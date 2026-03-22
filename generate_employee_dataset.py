"""
Synthetic Employee Churn Dataset Generator
============================================
1200 rows × 13 columns for binary classification (churned: yes / no).
Includes PII (emp_name, phone_number), correlated missing values, outliers.
"""

import numpy as np
import pandas as pd
from pathlib import Path

RNG = np.random.default_rng(42)
N = 1200

# ──────────────────────────────────────────────
# 1. Core numeric features
# ──────────────────────────────────────────────
age = RNG.integers(22, 61, size=N)                          # 22-60

years_at_company_raw = (age - 22) * RNG.uniform(0.1, 0.6, N)
years_at_company = np.clip(years_at_company_raw + RNG.normal(0, 2, N), 0, 30).round(1)

# Salary: log-normal for skew
salary_raw = RNG.lognormal(mean=11.2, sigma=0.5, size=N)
salary = np.clip(salary_raw, 30_000, 180_000).round(2)
# Inject ~3% outliers
outlier_idx = RNG.choice(N, size=36, replace=False)
salary[outlier_idx] = RNG.uniform(200_000, 450_000, size=36).round(2)

performance_score = RNG.integers(1, 6, size=N)               # 1-5

work_hours = np.clip(RNG.normal(47, 8, N), 30, 80).round(1)

num_projects = RNG.integers(1, 11, size=N)                   # 1-10

satisfaction_score = np.clip(RNG.normal(5.5, 2.0, N), 1, 10).round(1)

last_promotion_raw = RNG.exponential(3.0, N)
last_promotion_years = np.clip(last_promotion_raw, 0, 15).round(1)

# ──────────────────────────────────────────────
# 2. Categorical features
# ──────────────────────────────────────────────
dept_vals  = ["Engineering", "Sales", "HR", "Finance", "Marketing"]
dept_probs = [0.35, 0.25, 0.10, 0.15, 0.15]
department = RNG.choice(dept_vals, size=N, p=dept_probs)

remote_vals  = ["Yes", "No", "Hybrid"]
remote_probs = [0.30, 0.40, 0.30]
remote_work  = RNG.choice(remote_vals, size=N, p=remote_probs)

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
    "Sophia","Liam","Noah","Ava","Mia","Harper","Evelyn","Logan",
    "Lucas","Mason","Ella","Aria","Luna","Camila","Riley","Nora",
]
last_names = [
    "Sharma","Patel","Verma","Singh","Kumar","Gupta","Mehta","Joshi",
    "Nair","Iyer","Reddy","Pillai","Smith","Johnson","Williams","Brown",
    "Jones","Garcia","Martinez","Anderson","Taylor","Thomas","Moore",
    "Jackson","White","Harris","Martin","Thompson","Wilson","Robinson",
    "Davis","Miller","Lee","Walker","Hall","Allen","Young","King",
    "Wright","Scott","Torres","Nguyen","Hill","Baker","Carter","Green",
    "Adams","Nelson","Hernandez","Flores","Rivera","Mitchell","Perez",
    "Roberts","Turner","Phillips","Campbell","Parker","Evans","Edwards",
]

generated_names = set()
names_list, phone_list = [], []
while len(names_list) < N:
    first = RNG.choice(first_names)
    last  = RNG.choice(last_names)
    full  = f"{first} {last}"
    if full not in generated_names:
        generated_names.add(full)
        names_list.append(full)
        # Generate realistic phone number
        prefix = RNG.choice(["9","8","7"])
        digits = "".join([str(d) for d in RNG.integers(0, 10, size=9)])
        phone_list.append(f"+91-{prefix}{digits}")

emp_name     = np.array(names_list)
phone_number = np.array(phone_list)

# ──────────────────────────────────────────────
# 4. Target: churned (75% no, 25% yes)
#    Correlated with satisfaction_score, salary, performance_score
# ──────────────────────────────────────────────
churn_score = (
    (1 - satisfaction_score / 10) * 0.45           # low satisfaction → churn
    + (1 - np.clip(salary / 200_000, 0, 1)) * 0.25 # low salary → churn
    + (1 - performance_score / 5) * 0.15            # low performance → churn
    + (last_promotion_years / 15) * 0.10            # long since promotion → churn
    + RNG.uniform(-0.08, 0.08, N)                   # noise
)

# Calibrate threshold for 25% churn
threshold = np.percentile(churn_score, 75)           # top 25% → churned
churned_bool = churn_score >= threshold
churned = np.where(churned_bool, "yes", "no")

print(f"  churned split: {dict(zip(*np.unique(churned, return_counts=True)))}")

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

churned_idx = np.where(churned == "yes")[0]

age_f                  = inject_missing(age.astype(float), 0.05)
years_at_company_f     = inject_missing(years_at_company, 0.08, prefer_idx=churned_idx)
salary_f               = inject_missing(salary, 0.06)
performance_score_f    = inject_missing(performance_score.astype(float), 0.04)
work_hours_f           = inject_missing(work_hours, 0.07)
num_projects_f         = inject_missing(num_projects.astype(float), 0.03)
satisfaction_score_f   = inject_missing(satisfaction_score, 0.12, prefer_idx=churned_idx)
last_promotion_years_f = inject_missing(last_promotion_years, 0.09)
department_s           = inject_missing_cat(department, 0.02)
remote_work_s          = inject_missing_cat(remote_work, 0.03)

# ──────────────────────────────────────────────
# 6. Assemble DataFrame
# ──────────────────────────────────────────────
df = pd.DataFrame({
    "emp_id"               : np.arange(1, N + 1),
    "emp_name"             : emp_name,               # PII
    "department"           : department_s,
    "age"                  : age_f,
    "years_at_company"     : years_at_company_f,
    "salary"               : salary_f,
    "performance_score"    : performance_score_f,
    "work_hours_per_week"  : work_hours_f,
    "num_projects"         : num_projects_f,
    "satisfaction_score"   : satisfaction_score_f,
    "last_promotion_years" : last_promotion_years_f,
    "phone_number"         : phone_number,           # PII
    "remote_work"          : remote_work_s,
    "churned"              : churned,                # TARGET
})

# ──────────────────────────────────────────────
# 7. Save & Report
# ──────────────────────────────────────────────
out_path = Path("data/employee_churn.csv")
out_path.parent.mkdir(exist_ok=True)
df.to_csv(out_path, index=False)
print(f"\n✅ Saved {len(df)} rows × {len(df.columns)} columns → {out_path}")
print(f"\n📊 Dataset Summary:")
print(f"  Shape          : {df.shape}")
print(f"  Target split   : {df['churned'].value_counts().to_dict()}")
print(f"\n  Missing values (%):")
miss = (df.isnull().sum() / N * 100).round(1)
for col, pct in miss[miss > 0].items():
    print(f"    {col:<22}: {pct}%")
print(f"\n  salary outliers (>200k)        : {(df['salary'] > 200_000).sum()}")
print(f"  emp_name unique values         : {df['emp_name'].nunique()}")
print(f"  phone_number unique values     : {df['phone_number'].nunique()}")
