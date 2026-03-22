"""
AURA Agent – LangGraph Pipeline
================================
Defines the LangGraph-based agent workflow with:
  - Enhanced system prompt (decision framework + REASONING prefix)
  - Step logging: every tool call is recorded in steps_history
  - validate_dataset_state tool
  - Sensitivity analysis node
  - Human-readable run_agentic_pipeline() entry point
"""

import os
import re
import json
import logging
from datetime import datetime
from typing import TypedDict, Annotated, Sequence, Dict, Any, List, Union
import operator
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage, ToolMessage, AIMessage
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_core.tools import tool
from dotenv import load_dotenv

from backend.backend.core.agent.tools import (
    inspect_metadata, run_preprocessing_step,
    get_dataset, DATA_STORE
)
from backend.backend.core.agent.sanitizer import extract_metadata, sanitize_tool_output

load_dotenv()
logger = logging.getLogger(__name__)


# =====================================================================
# State Definition
# =====================================================================

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    dataset_id: str
    metadata: Dict[str, Any]
    sensitivity_flags: Dict[str, Any]
    status: str
    error: str
    # --- NEW: step logging ---
    steps_history: List[Dict[str, Any]]
    preprocessing_summary: Dict[str, List[str]]   # column → list of actions applied
    privacy_flags: List[str]                        # columns flagged as PII
    agent_reasoning: List[str]                      # all "REASONING: …" statements


# =====================================================================
# LangChain Tools (thin wrappers for LangGraph ToolNode)
# =====================================================================

@tool
def tool_inspect_metadata(dataset_id: str) -> str:
    """Inspect dataset metadata: column types, missing %, stats.
    Returns a JSON summary — never raw data."""
    result = inspect_metadata(dataset_id)
    return json.dumps(result, indent=2)


@tool
def tool_run_preprocessing_step(dataset_id: str, action: str, params: str) -> str:
    """Execute a preprocessing step on the dataset.
    action: one of 'impute', 'encode', 'scale', 'drop_col'.
    params: JSON string of parameters, e.g. '{"strategy":"mean","columns":{"age":"mean"}}'"""
    try:
        params_dict = json.loads(params) if isinstance(params, str) else params
    except json.JSONDecodeError:
        return json.dumps({"error": f"Invalid JSON in params: {params}"})
    result = run_preprocessing_step(dataset_id, action, params_dict)
    return json.dumps(result, indent=2)


@tool
def validate_dataset_state(dataset_id: str) -> str:
    """Check if the dataset is ML-ready: no missing values, all numeric, no PII columns.
    Returns {'is_ready': true/false, 'issues': [...]}."""
    try:
        df = get_dataset(dataset_id)
        issues = []

        # Check missing values
        missing = df.isnull().sum()
        cols_with_missing = missing[missing > 0]
        if len(cols_with_missing) > 0:
            for col, count in cols_with_missing.items():
                issues.append(f"Column '{col}' still has {int(count)} missing values")

        # Check non-numeric columns (excluding target if it's the only string)
        non_numeric = df.select_dtypes(exclude=["number", "bool"]).columns.tolist()
        if non_numeric:
            for col in non_numeric:
                issues.append(f"Column '{col}' is non-numeric (dtype={df[col].dtype})")

        # Check for PII-suspect columns still present
        pii_keywords = ["name", "email", "phone", "ssn", "address"]
        for col in df.columns:
            if any(kw in col.lower() for kw in pii_keywords):
                issues.append(f"Column '{col}' looks like PII — consider dropping")

        is_ready = len(issues) == 0
        result = {
            "is_ready": is_ready,
            "shape": list(df.shape),
            "issues": issues[:20],  # cap for safety
        }
        return json.dumps(sanitize_tool_output(result), indent=2)
    except Exception as e:
        return json.dumps({"error": str(e)})


# Collect all tools
ALL_TOOLS = [tool_inspect_metadata, tool_run_preprocessing_step, validate_dataset_state]


# =====================================================================
# Sensitivity Analysis Node
# =====================================================================

PII_KEYWORDS = ["name", "email", "phone", "ssn", "address", "dob", "passport", "id"]

def sensitivity_node(state: AgentState) -> dict:
    """Scans metadata for PII-suspect columns."""
    metadata = state.get("metadata", {})
    columns_info = metadata.get("columns", {})

    flags = {}
    privacy_flags = []
    for col_name, col_info in columns_info.items():
        reasons = []
        col_lower = col_name.lower()

        # Keyword check
        for kw in PII_KEYWORDS:
            if kw in col_lower:
                reasons.append(f"column name contains '{kw}'")

        # High cardinality check (likely PII / free-text)
        unique_count = col_info.get("unique_count", 0)
        if unique_count > 100:
            reasons.append(f"high cardinality ({unique_count} unique values)")

        if reasons:
            flags[col_name] = {"sensitive": True, "reasons": reasons}
            privacy_flags.append(col_name)

    logger.info(f"Sensitivity scan: {len(flags)} columns flagged — {list(flags.keys())}")
    return {
        "sensitivity_flags": flags,
        "privacy_flags": privacy_flags,
        "messages": [SystemMessage(content=f"Sensitivity scan result: {json.dumps(flags)}")]
    }


# =====================================================================
# Agent Node (LLM Decision-Making + Step Logging)
# =====================================================================

def agent_node(state: AgentState) -> dict:
    """The main decision-making node. Invokes the LLM and logs reasoning."""
    model = ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0,
        api_key=os.environ.get("GROQ_API_KEY")
    )

    # Bind tools
    model_with_tools = model.bind_tools(ALL_TOOLS)

    # Prompt Construction
    metadata_str = json.dumps(state.get("metadata", {}), indent=2)
    sensitivity_str = json.dumps(state.get("sensitivity_flags", {}), indent=2)

    system_prompt = f"""You are AURA — an Autonomous Reasoning Agent for data preprocessing.
Your job is to analyze dataset metadata and make intelligent preprocessing decisions
WITHOUT ever seeing raw data.

CURRENT CONTEXT:
Dataset ID: {state['dataset_id']}
Metadata: {metadata_str}
Sensitivity Report: {sensitivity_str}

STRICT RULES:
1. PRIVACY FIRST: If any column name contains keywords like 'name', 'email', 'phone',
   'ssn', 'id', 'address' — flag it as PII and recommend dropping it immediately.
2. MISSING VALUES FIRST: Always handle missing values before encoding or scaling.
3. REASONING: Before each tool call, explain your reasoning in one sentence starting
   with "REASONING:" so your decisions are auditable.
4. NO REDUNDANCY: Never apply the same operation twice on the same column.
5. VALIDATE LAST: Always call validate_dataset_state as your final step before DONE.
6. TARGET AWARENESS: Never encode, scale, or drop the target column.

DECISION FRAMEWORK — follow these thresholds exactly:

  Missing Values (numeric columns):
    missing_pct > 60%   → DROP the column
    missing_pct 5–40%   → Use KNN imputation
    missing_pct < 5%    → Use mean imputation

  Missing Values (categorical columns):
    missing_pct > 60%   → DROP the column
    missing_pct ≤ 60%   → Use mode imputation

  Encoding:
    unique_count > 20   → DROP (high cardinality or PII)
    unique_count 3–20   → One-hot encode
    unique_count ≤ 2    → Label encode

  Scaling:
    outlier_pct > 15%   → RobustScaler
    outlier_pct ≤ 15%   → StandardScaler

FINISH CONDITION:
When the dataset is clean (no missing values, all numeric, privacy-safe),
call validate_dataset_state. If it returns 'is_ready': true, reply with exactly
"DONE" and stop all tool calls.

Think step-by-step. Always output REASONING before every tool call.
"""

    messages = [SystemMessage(content=system_prompt)] + list(state['messages'])
    response = model_with_tools.invoke(messages)

    # ── Extract REASONING statements from the LLM's text content ──
    new_reasoning = []
    if isinstance(response.content, str):
        for line in response.content.splitlines():
            stripped = line.strip()
            if stripped.upper().startswith("REASONING:"):
                new_reasoning.append(stripped)

    return {
        "messages": [response],
        "agent_reasoning": new_reasoning,
    }


# =====================================================================
# Tool Execution Node (wraps LangGraph ToolNode + step logging)
# =====================================================================

_langgraph_tool_node = ToolNode(ALL_TOOLS)

def tool_node_with_logging(state: AgentState) -> dict:
    """Executes tool calls via LangGraph ToolNode, then records each step."""
    # Run the actual tools
    result = _langgraph_tool_node.invoke(state)

    # Build step-log entries from the new ToolMessages
    new_steps = []
    new_preprocessing = {}
    step_base = len(state.get("steps_history", []))

    new_messages = result.get("messages", [])
    if not isinstance(new_messages, list):
        new_messages = [new_messages]

    # Find the last AI message to extract which tools were called
    last_ai_msg = None
    for m in reversed(list(state.get("messages", []))):
        if isinstance(m, AIMessage) and hasattr(m, "tool_calls") and m.tool_calls:
            last_ai_msg = m
            break

    tool_calls_map = {}
    if last_ai_msg and hasattr(last_ai_msg, "tool_calls"):
        for tc in last_ai_msg.tool_calls:
            tool_calls_map[tc["id"]] = tc

    for i, msg in enumerate(new_messages):
        if isinstance(msg, ToolMessage):
            step_num = step_base + i + 1
            tc_info = tool_calls_map.get(msg.tool_call_id, {})
            tool_name = tc_info.get("name", "unknown")
            tool_args = tc_info.get("args", {})

            # Summarise result (truncate for readability)
            try:
                result_parsed = json.loads(msg.content) if isinstance(msg.content, str) else msg.content
                result_summary = str(result_parsed)[:500]
            except (json.JSONDecodeError, TypeError):
                result_summary = str(msg.content)[:500]

            # Extract reasoning from the last AI message text
            reasoning = ""
            if last_ai_msg and isinstance(last_ai_msg.content, str):
                for line in last_ai_msg.content.splitlines():
                    if line.strip().upper().startswith("REASONING:"):
                        reasoning = line.strip()
                        break

            new_steps.append({
                "step": step_num,
                "action": tool_name,
                "args": tool_args,
                "reasoning": reasoning,
                "result": result_summary,
                "timestamp": datetime.now().isoformat()
            })

            # Track preprocessing actions per column
            if tool_name == "tool_run_preprocessing_step":
                action = tool_args.get("action", "")
                params_raw = tool_args.get("params", "{}")
                try:
                    params = json.loads(params_raw) if isinstance(params_raw, str) else params_raw
                except (json.JSONDecodeError, TypeError):
                    params = {}

                cols = params.get("columns", {})
                if isinstance(cols, dict):
                    for col_name in cols:
                        new_preprocessing.setdefault(col_name, []).append(action)
                elif isinstance(cols, list):
                    for col_name in cols:
                        new_preprocessing.setdefault(col_name, []).append(action)
                elif isinstance(cols, str):
                    new_preprocessing.setdefault(cols, []).append(action)

    return {
        "messages": new_messages,
        "steps_history": new_steps,
        "preprocessing_summary": new_preprocessing,
    }


# =====================================================================
# Router
# =====================================================================

def should_continue(state: AgentState) -> str:
    """Route: if the last AI message has tool_calls → 'tools', else → END."""
    messages = state.get("messages", [])
    if not messages:
        return END
    last = messages[-1]
    if isinstance(last, AIMessage):
        if hasattr(last, "tool_calls") and last.tool_calls:
            return "tools"
        # Check for DONE in content
        if isinstance(last.content, str) and "DONE" in last.content.upper():
            return END
    return END


# =====================================================================
# Graph Construction
# =====================================================================

def build_agent_graph():
    """Build and compile the LangGraph agent graph."""
    workflow = StateGraph(AgentState)

    workflow.add_node("sensitivity_check", sensitivity_node)
    workflow.add_node("agent", agent_node)
    workflow.add_node("tools", tool_node_with_logging)

    workflow.set_entry_point("sensitivity_check")
    workflow.add_edge("sensitivity_check", "agent")

    workflow.add_conditional_edges("agent", should_continue, {
        "tools": "tools",
        END: END
    })
    workflow.add_edge("tools", "agent")

    return workflow.compile()


# =====================================================================
# Public Entry Point
# =====================================================================

def run_agentic_pipeline(dataset_id: str, verbose: bool = False) -> dict:
    """
    Run the full agentic preprocessing pipeline on a dataset.

    Args:
        dataset_id: UUID of the dataset in DATA_STORE.
        verbose: Whether to log each step.

    Returns:
        Final agent state dict including steps_history, privacy_flags,
        preprocessing_summary, and agent_reasoning.
    """
    if dataset_id not in DATA_STORE:
        raise ValueError(f"Dataset {dataset_id} not found in DATA_STORE.")

    # Extract initial metadata
    df = DATA_STORE[dataset_id]
    initial_metadata = extract_metadata(df)
    initial_metadata = sanitize_tool_output(initial_metadata)

    initial_state: AgentState = {
        "messages": [HumanMessage(content=f"Preprocess dataset '{dataset_id}' for ML.")],
        "dataset_id": dataset_id,
        "metadata": initial_metadata,
        "sensitivity_flags": {},
        "status": "RUNNING",
        "error": "",
        "steps_history": [],
        "preprocessing_summary": {},
        "privacy_flags": [],
        "agent_reasoning": [],
    }

    graph = build_agent_graph()
    final_state = graph.invoke(initial_state, config={"recursion_limit": 30})

    if verbose:
        logger.info("=" * 60)
        logger.info("AGENT STEP LOG")
        logger.info("=" * 60)
        for step in final_state.get("steps_history", []):
            logger.info(f"  Step {step['step']}: {step['action']}")
            if step.get("reasoning"):
                logger.info(f"    {step['reasoning']}")
        logger.info("=" * 60)

    final_state["status"] = "DONE"
    return final_state
