"""
Synthetic Student Performance Dataset Generator
=================================================
800 rows × 14 columns for classification (Pass / Fail / Distinction).
Includes PII (student_name, email), correlated missing values, outliers.
"""

import numpy as np
import pandas as pd
from pathlib import Path

RNG = np.random.default_rng(42)
N = 800

# ──────────────────────────────────────────────
# 1. Core numeric features
# ──────────────────────────────────────────────
age = RNG.integers(16, 26, size=N)                          # 16-25

attendance_pct_raw = RNG.normal(75, 12, size=N)
attendance_pct = np.clip(attendance_pct_raw, 40, 100).round(1)

study_hours = np.clip(RNG.lognormal(1.0, 0.6, N), 0, 12).round(1)

math_score    = np.clip(RNG.normal(60, 18, N), 0, 100).astype(int)
english_score = np.clip(RNG.normal(55, 20, N), 0, 100).astype(int)
science_score = np.clip(RNG.normal(58, 17, N), 0, 100).astype(int)

extracurricular = RNG.integers(0, 6, size=N)               # 0-5

# family_income: log-normal → right skew
income_raw = RNG.lognormal(mean=11.0, sigma=0.7, size=N)
family_income = np.clip(income_raw, 10_000, 400_000).round(2)
# Inject ~3% outliers
outlier_idx = RNG.choice(N, size=24, replace=False)
family_income[outlier_idx] = RNG.uniform(450_000, 900_000, size=24).round(2)

# ──────────────────────────────────────────────
# 2. Categorical features
# ──────────────────────────────────────────────
gender_vals  = ["Male", "Female", "Other"]
gender_probs = [0.48, 0.47, 0.05]
gender = RNG.choice(gender_vals, size=N, p=gender_probs)

internet_vals = ["Yes", "No"]
internet_probs = [0.82, 0.18]
internet_access = RNG.choice(internet_vals, size=N, p=internet_probs)

parent_edu_vals  = ["None", "School", "Graduate", "Postgraduate"]
parent_edu_probs = [0.08, 0.30, 0.42, 0.20]
parent_education = RNG.choice(parent_edu_vals, size=N, p=parent_edu_probs)

# ──────────────────────────────────────────────
# 3. PII columns
# ──────────────────────────────────────────────
first_names = [
    "Aarav","Aditi","Aishwarya","Amit","Ananya","Arjun","Deepa","Divya",
    "Gaurav","Kavya","Kiran","Lakshmi","Manish","Meera","Neha","Nikhil",
    "Pooja","Priya","Rahul","Rajesh","Ravi","Rohit","Sangeeta","Sanjay",
    "Sneha","Suresh","Tanvi","Vijay","Vikram","Vinita","Yash","Zara",
    "Ishaan","Kritika","Naina","Alice","Benjamin","Charlotte","Daniel",
    "Emily","Ethan","Fiona","George","Hannah","Isabella","James","Jennifer",
    "Kevin","Laura","Michael","Natalie","Oliver","Patricia","Quinn",
    "Rebecca","Samuel","Sarah","Thomas","Uma","Victor","Wendy","Xavier",
    "Yvonne","Zachary","Chloe","Dylan","Emma","Felix","Grace","Henry",
]
last_names = [
    "Sharma","Patel","Verma","Singh","Kumar","Gupta","Mehta","Joshi",
    "Nair","Iyer","Reddy","Pillai","Smith","Johnson","Williams","Brown",
    "Jones","Garcia","Martinez","Anderson","Taylor","Thomas","Moore",
    "Jackson","White","Harris","Martin","Thompson","Wilson","Robinson",
    "Davis","Miller","Lee","Walker","Hall","Allen","Young","King",
    "Wright","Scott","Torres","Nguyen","Hill","Baker","Carter","Green",
    "Adams","Nelson","Hernandez","Flores",
]
email_domains = ["gmail.com","yahoo.com","outlook.com","hotmail.com","university.edu","student.edu"]

generated_names = set()
names_list, email_list = [], []
while len(names_list) < N:
    first = RNG.choice(first_names)
    last  = RNG.choice(last_names)
    full  = f"{first} {last}"
    if full not in generated_names:
        generated_names.add(full)
        names_list.append(full)
        # Generate unique email
        domain = RNG.choice(email_domains)
        suffix = RNG.integers(10, 999)
        email_list.append(f"{first.lower()}.{last.lower()}{suffix}@{domain}")

student_name = np.array(names_list)
email = np.array(email_list)

# ──────────────────────────────────────────────
# 4. Target: grade (Pass 50%, Fail 30%, Distinction 20%)
#    Correlated with attendance, study hours, scores
# ──────────────────────────────────────────────
avg_score = (math_score + english_score + science_score) / 3.0
composite = (
    (attendance_pct / 100) * 0.30
    + np.clip(study_hours / 12, 0, 1) * 0.25
    + (avg_score / 100) * 0.35
    + RNG.uniform(-0.05, 0.05, N)            # noise
)

# Calibrate thresholds for 50/30/20 split
p30 = np.percentile(composite, 30)    # bottom 30% → Fail
p80 = np.percentile(composite, 80)    # top 20% → Distinction

grade = np.where(composite < p30, "Fail",
         np.where(composite >= p80, "Distinction", "Pass"))

print(f"  grade split: {dict(zip(*np.unique(grade, return_counts=True)))}")

# ──────────────────────────────────────────────
# 5. Inject missing values
# ──────────────────────────────────────────────
def inject_missing(arr, rate, prefer_idx=None):
    arr = arr.astype(float)
    n_missing = int(N * rate)
    if prefer_idx is not None and len(prefer_idx) > 0:
        n_from_group = min(int(n_missing * 0.6), len(prefer_idx))
        chosen = list(RNG.choice(prefer_idx, size=n_from_group, replace=False))
        remaining_pool = np.setdiff1d(np.arange(N), chosen)
        chosen += list(RNG.choice(remaining_pool, size=n_missing - n_from_group, replace=False))
    else:
        chosen = RNG.choice(N, size=n_missing, replace=False)
    arr[chosen] = np.nan
    return arr

def inject_missing_cat(arr, rate):
    arr = arr.astype(object)
    idx = RNG.choice(N, size=int(N * rate), replace=False)
    arr[idx] = np.nan
    return arr

fail_idx = np.where(grade == "Fail")[0]

age_f               = inject_missing(age.astype(float), 0.06)
attendance_pct_f    = inject_missing(attendance_pct, 0.08, prefer_idx=fail_idx)
study_hours_f       = inject_missing(study_hours, 0.10, prefer_idx=fail_idx)
math_score_f        = inject_missing(math_score.astype(float), 0.05)
english_score_f     = inject_missing(english_score.astype(float), 0.04)
science_score_f     = inject_missing(science_score.astype(float), 0.03)
family_income_f     = inject_missing(family_income, 0.15)
gender_s            = inject_missing_cat(gender, 0.02)
internet_access_s   = inject_missing_cat(internet_access, 0.01)
parent_education_s  = inject_missing_cat(parent_education, 0.07)

# ──────────────────────────────────────────────
# 6. Assemble DataFrame
# ──────────────────────────────────────────────
df = pd.DataFrame({
    "student_id"         : np.arange(5001, 5001 + N),
    "student_name"       : student_name,             # PII
    "age"                : age_f,
    "gender"             : gender_s,
    "attendance_pct"     : attendance_pct_f,
    "study_hours_per_day": study_hours_f,
    "math_score"         : math_score_f,
    "english_score"      : english_score_f,
    "science_score"      : science_score_f,
    "internet_access"    : internet_access_s,
    "family_income"      : family_income_f,
    "parent_education"   : parent_education_s,
    "extracurricular"    : extracurricular,
    "email"              : email,                     # PII
    "grade"              : grade,                     # TARGET
})

# ──────────────────────────────────────────────
# 7. Save & Report
# ──────────────────────────────────────────────
out_path = Path("data/student_performance.csv")
out_path.parent.mkdir(exist_ok=True)
df.to_csv(out_path, index=False)
print(f"\n✅ Saved {len(df)} rows × {len(df.columns)} columns → {out_path}")
print(f"\n📊 Dataset Summary:")
print(f"  Shape          : {df.shape}")
print(f"  Target split   : {df['grade'].value_counts().to_dict()}")
print(f"\n  Missing values (%):")
miss = (df.isnull().sum() / N * 100).round(1)
for col, pct in miss[miss > 0].items():
    print(f"    {col:<22}: {pct}%")
print(f"\n  family_income outliers (>450k) : {(df['family_income'] > 450_000).sum()}")
print(f"  student_name unique values    : {df['student_name'].nunique()}")
print(f"  email unique values           : {df['email'].nunique()}")
