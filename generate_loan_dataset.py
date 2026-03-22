"""
Synthetic Loan Dataset Generator
=================================
Generates a realistic, messy 1000-row loan classification dataset for
testing AURA's preprocessing pipeline. Includes:
  - PII column (applicant_name) — high cardinality, should be flagged
  - Stratified missing values (not random — logically correlated)
  - Outliers in annual_income and loan_amount
  - loan_approved correlated with credit_score, income, defaults
  - 65/35 class imbalance (approved / rejected)
"""

import numpy as np
import pandas as pd
from pathlib import Path

RNG = np.random.default_rng(42)

N = 1000

# ──────────────────────────────────────────────
# 1. Base numeric features
# ──────────────────────────────────────────────
age = RNG.integers(22, 66, size=N)                          # 22-65 inclusive

# years_employed: correlated with age (older → more experience), capped at 35
years_employed_base = (age - 22) * RNG.uniform(0.3, 0.9, size=N)
years_employed = np.clip(years_employed_base + RNG.normal(0, 2, N), 0, 35).round(1)

# annual_income: log-normal for right skew, shifted to 20k-200k range
income_raw = RNG.lognormal(mean=11.0, sigma=0.6, size=N)
annual_income = np.clip(income_raw, 20_000, 180_000).round(2)
# Inject ~3% high outliers
outlier_idx = RNG.choice(N, size=30, replace=False)
annual_income[outlier_idx] = RNG.uniform(200_000, 800_000, size=30).round(2)

# credit_score: 300-850
credit_score = RNG.integers(300, 851, size=N)

# loan_amount: 5k-500k, slight right skew
loan_amount_raw = RNG.lognormal(mean=11.5, sigma=0.8, size=N)
loan_amount = np.clip(loan_amount_raw, 5_000, 450_000).round(2)
# Inject ~2% outliers
loan_outlier_idx = RNG.choice(N, size=20, replace=False)
loan_amount[loan_outlier_idx] = RNG.uniform(500_000, 950_000, size=20).round(2)

monthly_expenses = RNG.uniform(500, 15_000, size=N).round(2)
num_dependents   = RNG.integers(0, 6, size=N)               # 0-5
previous_defaults = RNG.integers(0, 4, size=N)              # 0-3

# ──────────────────────────────────────────────
# 2. Categorical features
# ──────────────────────────────────────────────
employment_types = ["Salaried", "Self-Employed", "Freelancer", "Unemployed"]
employment_probs = [0.55, 0.25, 0.12, 0.08]
employment_type  = RNG.choice(employment_types, size=N, p=employment_probs)

loan_term_options = [12, 24, 36, 48, 60, 84, 120]
loan_term_months  = RNG.choice(loan_term_options, size=N)

property_types = ["Apartment", "House", "Villa", "Land", "None"]
property_probs = [0.35, 0.30, 0.10, 0.10, 0.15]
property_type  = RNG.choice(property_types, size=N, p=property_probs)

education_levels = ["High School", "Bachelor", "Master", "PhD", "None"]
education_probs  = [0.20, 0.45, 0.22, 0.08, 0.05]
education_level  = RNG.choice(education_levels, size=N, p=education_probs)

city_tiers = ["Tier1", "Tier2", "Tier3"]
city_probs  = [0.30, 0.45, 0.25]
city_tier   = RNG.choice(city_tiers, size=N, p=city_probs)

# ──────────────────────────────────────────────
# 3. PII — applicant_name (high cardinality)
# ──────────────────────────────────────────────
indian_first  = ["Aarav","Aditi","Aishwarya","Amit","Ananya","Arjun","Deepa",
                 "Divya","Gaurav","Kavya","Kiran","Lakshmi","Manish","Meera",
                 "Neha","Nikhil","Pooja","Priya","Rahul","Rajesh","Ravi",
                 "Rohit","Sangeeta","Sanjay","Sneha","Suresh","Tanvi","Vijay",
                 "Vikram","Vinita","Yash","Zara","Ishaan","Kritika","Naina"]
western_first = ["Alice","Benjamin","Charlotte","Daniel","Emily","Ethan",
                 "Fiona","George","Hannah","Isabella","James","Jennifer",
                 "Kevin","Laura","Michael","Natalie","Oliver","Patricia",
                 "Quinn","Rebecca","Samuel","Sarah","Thomas","Uma","Victor",
                 "Wendy","Xavier","Yvonne","Zachary","Chloe","Dylan","Emma",
                 "Felix","Grace","Henry"]
last_names    = ["Sharma","Patel","Verma","Singh","Kumar","Gupta","Mehta",
                 "Joshi","Nair","Iyer","Reddy","Pillai","Smith","Johnson",
                 "Williams","Brown","Jones","Garcia","Martinez","Anderson",
                 "Taylor","Thomas","Moore","Jackson","White","Harris","Martin",
                 "Thompson","Wilson","Robinson","Davis","Miller","Lee","Walker",
                 "Hall","Allen","Young","Hernandez","King","Wright","Scott",
                 "Torres","Nguyen","Hill","Flores","Green","Adams","Nelson",
                 "Baker","Carter"]

all_first = indian_first + western_first

# Generate 1000 unique names
generated_names = set()
names_list = []
while len(names_list) < N:
    first = RNG.choice(all_first)
    last  = RNG.choice(last_names)
    full  = f"{first} {last}"
    if full not in generated_names:
        generated_names.add(full)
        names_list.append(full)

applicant_name = np.array(names_list)

# ──────────────────────────────────────────────
# 4. Target: loan_approved (65% yes, 35% no)
#    Correlated with credit_score, annual_income, previous_defaults
# ──────────────────────────────────────────────
# Build a score: higher → more likely approved
score = (
    (credit_score - 300) / (850 - 300) * 0.45        # credit_score weight: 45%
    + np.clip(annual_income / 200_000, 0, 1) * 0.35  # income weight: 35%
    - previous_defaults * 0.10                        # defaults penalty: 10% each
    + RNG.uniform(-0.1, 0.1, N)                       # noise
)
# Calibrate threshold to get ~65% approved
threshold = np.percentile(score, 35)                  # bottom 35% → rejected
loan_approved_bool = score >= threshold
loan_approved = np.where(loan_approved_bool, "yes", "no")

# Verify split
actual_yes_pct = loan_approved_bool.mean() * 100
print(f"  loan_approved split: yes={actual_yes_pct:.1f}%  no={100-actual_yes_pct:.1f}%")

# ──────────────────────────────────────────────
# 5. Introduce missing values (logically correlated)
# ──────────────────────────────────────────────
def inject_missing(arr, rate, prefer_idx=None):
    """Set `rate` fraction of arr to NaN. Bias toward prefer_idx if given."""
    arr = arr.astype(float)
    n_missing = int(N * rate)
    if prefer_idx is not None and len(prefer_idx) > 0:
        # 60% of missing from preferred group, rest random
        n_from_group = min(int(n_missing * 0.6), len(prefer_idx))
        chosen = list(RNG.choice(prefer_idx, size=n_from_group, replace=False))
        remaining_pool = np.setdiff1d(np.arange(N), chosen)
        chosen += list(RNG.choice(remaining_pool, size=n_missing - n_from_group, replace=False))
    else:
        chosen = RNG.choice(N, size=n_missing, replace=False)
    arr[chosen] = np.nan
    return arr

unemployed_idx = np.where(employment_type == "Unemployed")[0]
young_idx      = np.where(age < 28)[0]

age_f             = inject_missing(age.astype(float),            0.08)   # 8%
annual_income_f   = inject_missing(annual_income,                0.05)   # 5%
credit_score_f    = inject_missing(credit_score.astype(float),   0.12)   # 12%
employment_type_s = employment_type.astype(object)
employment_type_s[RNG.choice(N, size=int(N*0.03), replace=False)] = np.nan  # 3%
years_employed_f  = inject_missing(years_employed, 0.10, prefer_idx=unemployed_idx)  # 10%, bias unemployed
monthly_expenses_f = inject_missing(monthly_expenses, 0.06)              # 6%
loan_amount_f     = inject_missing(loan_amount,      0.02)               # 2%
education_level_s = education_level.astype(object)
education_level_s[RNG.choice(N, size=int(N*0.04), replace=False)] = np.nan  # 4%

# ──────────────────────────────────────────────
# 6. Assemble DataFrame
# ──────────────────────────────────────────────
df = pd.DataFrame({
    "applicant_id"     : np.arange(1001, 1001 + N),
    "applicant_name"   : applicant_name,               # PII — high cardinality
    "age"              : age_f,
    "annual_income"    : annual_income_f,
    "credit_score"     : credit_score_f,
    "employment_type"  : employment_type_s,
    "years_employed"   : years_employed_f,
    "loan_amount"      : loan_amount_f,
    "loan_term_months" : loan_term_months,
    "property_type"    : property_type,
    "num_dependents"   : num_dependents,
    "previous_defaults": previous_defaults,
    "monthly_expenses" : monthly_expenses_f,
    "education_level"  : education_level_s,
    "city_tier"        : city_tier,
    "loan_approved"    : loan_approved,                # target
})

# ──────────────────────────────────────────────
# 7. Save
# ──────────────────────────────────────────────
out_path = Path("data/loan_dataset.csv")
out_path.parent.mkdir(exist_ok=True)
df.to_csv(out_path, index=False)
print(f"\n✅ Saved {len(df)} rows × {len(df.columns)} columns → {out_path}")

# ──────────────────────────────────────────────
# 8. Summary
# ──────────────────────────────────────────────
print("\n📊 Dataset Summary:")
print(f"  Shape          : {df.shape}")
print(f"  Target split   : {df['loan_approved'].value_counts().to_dict()}")
print(f"\n  Missing values (%):")
miss = (df.isnull().sum() / N * 100).round(1)
for col, pct in miss[miss > 0].items():
    print(f"    {col:<22}: {pct}%")
print(f"\n  annual_income outliers (>200k) : {(df['annual_income'] > 200_000).sum()}")
print(f"  loan_amount outliers (>500k)   : {(df['loan_amount'] > 500_000).sum()}")
print(f"  applicant_name unique values   : {df['applicant_name'].nunique()}")
