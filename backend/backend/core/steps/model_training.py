"""
Model Training Module for AURA Preprocessor 2.0

Handles machine learning model training with automatic model comparison.
Trains ALL candidate models, evaluates each with cross-validation,
and selects the best performer automatically.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix,
    precision_score, recall_score, f1_score
)
from typing import Dict, List, Tuple, Optional, Union, Any
import logging
import joblib
import os
import warnings

logger = logging.getLogger(__name__)


# =============================================================================
# Candidate Model Definitions
# =============================================================================

def _build_candidate_models() -> List[Tuple[str, Any]]:
    """
    Build the list of ALL candidate models to compare.
    Each entry is (display_name, model_instance).
    """
    return [
        ("Logistic Regression", LogisticRegression(
            solver="saga",
            max_iter=5000,
            C=1.0,
            random_state=42,
            n_jobs=-1,
        )),
        ("Random Forest", RandomForestClassifier(
            n_estimators=200,
            max_depth=10,
            random_state=42,
        )),
        ("Gradient Boosting", GradientBoostingClassifier(
            n_estimators=200,
            learning_rate=0.05,
            random_state=42,
        )),
        ("SVC (RBF)", SVC(
            kernel="rbf",
            probability=True,
            random_state=42,
        )),
    ]


class ModelTrainer:
    """
    Handles machine learning model training with automatic model comparison.
    """
    
    def __init__(self, mode: str = "auto"):
        """
        Initialize the model trainer.
        
        Args:
            mode: Execution mode - "auto" or "step"
        """
        self.mode = mode
        self.training_info = {}
        self.model = None
        self.model_name = None
    
    def train_model(self, 
                   X: Union[pd.DataFrame, np.ndarray], 
                   y: Union[pd.Series, np.ndarray],
                   target_col: str,
                   test_size: float = 0.2,
                   random_state: int = 42) -> Dict[str, Any]:
        """
        Train a machine learning model.
        
        In AUTO mode, trains ALL 4 candidate models, evaluates each with
        cross-validation, and selects the best one automatically.
        
        Args:
            X: Feature matrix
            y: Target vector
            target_col: Name of target column
            test_size: Proportion of data for testing
            random_state: Random seed for reproducibility
            
        Returns:
            Dictionary containing training results and metrics
        """
        try:
            # Convert to numpy arrays if needed
            if isinstance(X, pd.DataFrame):
                X = X.values
            if isinstance(y, pd.Series):
                y = y.values
            
            # Split the data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=random_state, stratify=y
            )
            
            logger.info(f"Data split: Train {X_train.shape[0]} samples, Test {X_test.shape[0]} samples")
            
            if self.mode == "step":
                # Interactive: let user pick a single model
                model_choice = self._get_user_model_choice()
                candidates = _build_candidate_models()
                idx = int(model_choice) - 1
                name, model = candidates[idx]
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    model.fit(X_train, y_train)
                self.model = model
                self.model_name = name
            else:
                # AUTO: compare ALL models and pick the best
                self.model, self.model_name = self._compare_and_select(X_train, y_train)
            
            # Evaluate the winning model
            results = self._evaluate_model(X_test, y_test, target_col)
            
            # Store training information
            self.training_info = {
                "model_name": self.model_name,
                "target_column": target_col,
                "train_size": X_train.shape[0],
                "test_size": X_test.shape[0],
                "feature_count": X_train.shape[1],
                "results": results
            }
            
            return self.training_info
            
        except Exception as e:
            error_msg = f"Error in model training: {str(e)}"
            logger.error(error_msg)
            return {"error": error_msg}
    
    def _get_user_model_choice(self) -> str:
        """
        Get user choice for model type in step mode.
        
        Returns:
            User's choice as string
        """
        print("\n⚡ Model selection options:")
        print("   1) Logistic Regression (saga solver, stable)")
        print("   2) Random Forest (robust, handles noise)")
        print("   3) Gradient Boosting (best for complex patterns)")
        print("   4) SVC with RBF kernel (good for small datasets)")
        
        while True:
            choice = input("👉 Enter choice: ").strip()
            if choice in ["1", "2", "3", "4"]:
                return choice
            print("⚠️ Invalid choice. Please enter 1, 2, 3, or 4.")
    
    # -----------------------------------------------------------------
    # Model Comparison Engine
    # -----------------------------------------------------------------

    def _compare_and_select(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
    ) -> Tuple[Any, str]:
        """
        Train ALL 4 candidate models, score each with 5-fold CV,
        and return the best one.

        Args:
            X_train: Training features
            y_train: Training targets
            
        Returns:
            Tuple of (best_model, best_model_name)
        """
        candidates = _build_candidate_models()
        n_samples = X_train.shape[0]

        print("\n🔬 MODEL COMPARISON — training all candidates...")
        print(f"   Samples: {n_samples}  |  Features: {X_train.shape[1]}")
        print("-" * 55)

        best_score = -1.0
        best_model = None
        best_name = ""
        comparison_results = []

        for name, model in candidates:
            try:
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    model.fit(X_train, y_train)

                    # Use min(5, n_samples) folds to avoid errors on tiny datasets
                    cv_folds = min(5, X_train.shape[0])
                    scores = cross_val_score(model, X_train, y_train, cv=cv_folds, scoring="accuracy")

                mean_cv = float(np.mean(scores))
                std_cv = float(np.std(scores))

                comparison_results.append({
                    "model": name,
                    "cv_mean": mean_cv,
                    "cv_std": std_cv,
                })

                status = "  "
                if mean_cv > best_score:
                    best_score = mean_cv
                    best_model = model
                    best_name = name

                print(f"   {name:<25s}  CV={mean_cv:.4f} (±{std_cv:.4f})")
                logger.info(f"Model comparison — {name}: CV={mean_cv:.4f} ±{std_cv:.4f}")

            except Exception as exc:
                logger.warning(f"Model {name} failed during comparison: {exc}")
                print(f"   {name:<25s}  ⚠️ FAILED — {exc}")

        print("-" * 55)
        print(f"   🏆 Winner: {best_name} (CV={best_score:.4f})")
        logger.info(f"Model comparison winner: {best_name} with CV={best_score:.4f}")

        # Store comparison for the report
        self.training_info["model_comparison"] = comparison_results

        return best_model, best_name

    # -----------------------------------------------------------------
    # Evaluation
    # -----------------------------------------------------------------

    def _evaluate_model(self, X_test: np.ndarray, y_test: np.ndarray, target_col: str) -> Dict[str, Any]:
        """
        Evaluate the trained model with comprehensive metrics.
        
        Args:
            X_test: Test features
            y_test: Test targets
            target_col: Target column name
            
        Returns:
            Dictionary containing evaluation metrics
        """
        try:
            # Make predictions
            y_pred = self.model.predict(X_test)
            y_pred_proba = self.model.predict_proba(X_test) if hasattr(self.model, 'predict_proba') else None
            
            # Core metrics
            acc = accuracy_score(y_test, y_pred)
            prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
            rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
            f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
            
            # Cross-validation on test set
            cv_folds = min(5, X_test.shape[0])
            cv_scores = cross_val_score(self.model, X_test, y_test, cv=cv_folds)
            
            # Classification report & confusion matrix
            class_report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
            conf_matrix = confusion_matrix(y_test, y_pred)
            
            results = {
                "accuracy": float(acc),
                "precision": float(prec),
                "recall": float(rec),
                "f1_score": float(f1),
                "cv_mean": float(np.mean(cv_scores)),
                "cv_std": float(np.std(cv_scores)),
                "classification_report": class_report,
                "confusion_matrix": conf_matrix.tolist(),
                "predictions": y_pred.tolist(),
                "probabilities": y_pred_proba.tolist() if y_pred_proba is not None else None
            }
            
            print(f"\n📊 Model Performance ({self.model_name}):")
            print(f"   Accuracy:  {acc:.4f}")
            print(f"   Precision: {prec:.4f}")
            print(f"   Recall:    {rec:.4f}")
            print(f"   F1 Score:  {f1:.4f}")
            print(f"   CV Score:  {np.mean(cv_scores):.4f} (±{np.std(cv_scores):.4f})")
            print(f"\n   Confusion Matrix:")
            for row in conf_matrix:
                print(f"   {row}")
            
            logger.info(
                f"Model evaluation completed — Accuracy: {acc:.4f}, "
                f"Precision: {prec:.4f}, Recall: {rec:.4f}, F1: {f1:.4f}"
            )
            
            return results
            
        except Exception as e:
            error_msg = f"Error in model evaluation: {str(e)}"
            logger.error(error_msg)
            return {"error": error_msg}
    
    def save_model(self, filepath: str) -> bool:
        """
        Save the trained model to disk.
        
        Args:
            filepath: Path to save the model
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if self.model is None:
                logger.error("No model to save")
                return False
            
            # Ensure directory exists
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            
            # Save model
            joblib.dump(self.model, filepath)
            
            # Save training info
            info_filepath = filepath.replace('.pkl', '_info.json')
            import json
            with open(info_filepath, 'w') as f:
                json.dump(self.training_info, f, indent=2)
            
            logger.info(f"Model saved to {filepath}")
            print(f"💾 Model saved to {filepath}")
            
            return True
            
        except Exception as e:
            error_msg = f"Error saving model: {str(e)}"
            logger.error(error_msg)
            print(f"⚠️ {error_msg}")
            return False
    
    def load_model(self, filepath: str) -> bool:
        """
        Load a trained model from disk.
        
        Args:
            filepath: Path to the model file
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.model = joblib.load(filepath)
            
            # Load training info if available
            info_filepath = filepath.replace('.pkl', '_info.json')
            if os.path.exists(info_filepath):
                import json
                with open(info_filepath, 'r') as f:
                    self.training_info = json.load(f)
            
            logger.info(f"Model loaded from {filepath}")
            return True
            
        except Exception as e:
            error_msg = f"Error loading model: {str(e)}"
            logger.error(error_msg)
            return False


def train_ml_model(X: Union[pd.DataFrame, np.ndarray], 
                   y: Union[pd.Series, np.ndarray],
                   target_col: str,
                   mode: str = "auto",
                   test_size: float = 0.2) -> Dict[str, Any]:
    """
    Convenience function to train a machine learning model.
    
    Args:
        X: Feature matrix
        y: Target vector
        target_col: Target column name
        mode: Execution mode
        test_size: Test set proportion
        
    Returns:
        Training results dictionary
    """
    trainer = ModelTrainer(mode)
    return trainer.train_model(X, y, target_col, test_size)
