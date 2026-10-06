from pathlib import Path
from functools import lru_cache
import os
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware



# Get the directory where main.py is located
BASE_DIR = Path(__file__).resolve().parent

# Define path to the pipeline model file
MODEL_PATH = BASE_DIR / "models" / "final_readmission_pipeline.joblib"
EDA_DATA_PATH = Path(os.getenv("DIABETIC_DATA_PATH", BASE_DIR.parent.parent / "diabetic_data.csv"))

# 1. Initialize FastAPI App
app = FastAPI(
    title="Hospital Readmission Prediction API",
    description="Backend service for predicting 30-day readmission risk for diabetic patients.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    model_pipeline = joblib.load(MODEL_PATH)
    print("Model pipeline loaded successfully.")
except Exception as e:
    raise RuntimeError(f"Failed to load model pipeline: {str(e)} and path is {MODEL_PATH}")

OPTIMAL_THRESHOLD = 0.50  # Operational threshold chosen in Stage 7


# 3. Define Input Schema (Data Validation with Pydantic)
class PatientData(BaseModel):
    race: str = Field(..., example="Caucasian")
    gender: str = Field(..., example="Female")
    age: str = Field(..., example="[70-80)")
    admission_type_id: int = Field(..., example=1)
    discharge_disposition_id: int = Field(..., example=1)
    admission_source_id: int = Field(..., example=7)
    time_in_hospital: int = Field(..., ge=1, le=14, example=3)
    num_lab_procedures: int = Field(..., ge=0, example=41)
    num_procedures: int = Field(..., ge=0, example=0)
    num_medications: int = Field(..., ge=0, example=18)
    number_outpatient: int = Field(..., ge=0, example=0)
    number_emergency: int = Field(..., ge=0, example=0)
    number_inpatient: int = Field(..., ge=0, example=1)
    number_diagnoses: int = Field(..., ge=1, example=9)
    max_glu_serum: str = Field(..., example="None")
    A1Cresult: str = Field(..., example=">8")
    metformin: str = Field(..., example="No")
    insulin: str = Field(..., example="Up")
    change: str = Field(..., example="Ch")
    diabetesMed: str = Field(..., example="Yes")
    diag_1: Optional[str] = Field("414", example="414")
    diag_2: Optional[str] = Field("411", example="411")
    diag_3: Optional[str] = Field("250", example="250")
    medical_specialty: Optional[str] = Field("Missing", example="Missing")
    repaglinide: Optional[str] = Field("No", example="No")
    glimepiride: Optional[str] = Field("No", example="No")
    glipizide: Optional[str] = Field("No", example="No")
    glyburide: Optional[str] = Field("No", example="No")
    pioglitazone: Optional[str] = Field("No", example="No")
    rosiglitazone: Optional[str] = Field("No", example="No")


# 4. Define Health Check Endpoint
@app.get("/")
def health_check():
    return {"status": "online", "model_loaded": model_pipeline is not None}


EXPECTED_COLUMNS = [
    'race', 'gender', 'age', 'admission_type_id', 'discharge_disposition_id',
    'admission_source_id', 'time_in_hospital', 'num_lab_procedures', 'num_procedures',
    'num_medications', 'number_outpatient', 'number_emergency', 'number_inpatient',
    'number_diagnoses', 'max_glu_serum', 'A1Cresult', 'metformin', 'insulin',
    'change', 'diabetesMed', 'diag_1', 'diag_2', 'diag_3',
    'medical_specialty', 'repaglinide', 'glimepiride', 'glipizide',
    'glyburide', 'pioglitazone', 'rosiglitazone'
]


EDA_PIE_FEATURES = ["readmitted", "age", "gender", "race"]
EDA_TARGET_LABELS = {
    "NO": "No readmission",
    ">30": "Readmitted after 30 days",
    "<30": "Readmitted within 30 days",
}
EDA_NUMERIC_LABELS = {
    "admission_type_id": "Admission type",
    "discharge_disposition_id": "Discharge disposition",
    "admission_source_id": "Admission source",
    "time_in_hospital": "Time in hospital",
    "num_lab_procedures": "Lab procedures",
    "num_procedures": "Procedures",
    "num_medications": "Medications",
    "number_outpatient": "Outpatient visits",
    "number_emergency": "Emergency visits",
    "number_inpatient": "Inpatient visits",
    "number_diagnoses": "Number of diagnoses",
}


@lru_cache(maxsize=1)
def build_eda_summary():
    if not EDA_DATA_PATH.is_file():
        raise FileNotFoundError(
            f"EDA dataset not found at {EDA_DATA_PATH}. "
            "Set DIABETIC_DATA_PATH to the path of diabetic_data.csv."
        )

    data = pd.read_csv(EDA_DATA_PATH, na_values="?", low_memory=False)
    required_columns = {
        *EDA_PIE_FEATURES,
    }
    missing_columns = required_columns.difference(data.columns)
    if missing_columns:
        raise ValueError(
            "EDA dataset is missing required columns: "
            + ", ".join(sorted(missing_columns))
        )

    row_count = len(data)
    rows_with_missing_values = int(data.isna().any(axis=1).sum())
    target_counts = data["readmitted"].value_counts()
    target = [
        {
            "value": value,
            "label": EDA_TARGET_LABELS[value],
            "count": int(target_counts.get(value, 0)),
            "percent": round(float(target_counts.get(value, 0) / row_count * 100), 2),
        }
        for value in ("NO", ">30", "<30")
    ]

    features = []
    for key in EDA_PIE_FEATURES:
        counts = data[key].value_counts()
        valid_count = int(counts.sum())
        features.append({
            "key": key,
            "label": key,
            "kind": "category",
            "bins": [
                {
                    "label": str(value),
                    "count": int(count),
                    "percent": round(float(count / valid_count * 100), 2),
                }
                for value, count in counts.items()
            ],
            "stats": None,
        })

    age_counts = data["age"].value_counts()
    age_group, age_count = age_counts.idxmax(), int(age_counts.max())
    inpatient_zero = int((data["number_inpatient"] == 0).sum())
    target_early_count = int(target_counts.get("<30", 0))
    observations = [
        (
            f"{target_early_count:,} encounters ({target_early_count / row_count:.1%}) "
            "were followed by readmission within 30 days."
        ),
        (
            f"The most common age group was {age_group}, "
            f"with {age_count:,} encounters ({age_count / row_count:.1%})."
        ),
        (
            f"{inpatient_zero / row_count:.1%} of encounters had no prior-year inpatient visits "
            "(number_inpatient = 0)."
        ),
    ]

    id_columns = {"encounter_id", "patient_nbr"}
    numeric_columns = [
        column for column in data.select_dtypes(include="number").columns
        if column not in id_columns
    ]
    numeric_distributions = []
    for column in numeric_columns:
        series = data[column].dropna()
        if series.empty:
            continue

        if series.nunique() < 20:
            value_counts = series.value_counts().sort_index()
            histogram = [
                {
                    "label": str(value),
                    "count": int(count),
                    "lower": float(value) - 0.5,
                    "upper": float(value) + 0.5,
                }
                for value, count in value_counts.items()
            ]
        else:
            binned = pd.cut(series, bins=30).value_counts(sort=False)
            histogram = [
                {
                    "label": str(interval),
                    "count": int(count),
                    "lower": float(interval.left),
                    "upper": float(interval.right),
                }
                for interval, count in binned.items()
            ]

        quartiles = series.quantile([0.25, 0.5, 0.75])
        first_quartile = float(quartiles.loc[0.25])
        median = float(quartiles.loc[0.5])
        third_quartile = float(quartiles.loc[0.75])
        interquartile_range = third_quartile - first_quartile
        lower_fence = first_quartile - 1.5 * interquartile_range
        upper_fence = third_quartile + 1.5 * interquartile_range
        inliers = series[(series >= lower_fence) & (series <= upper_fence)]
        outliers = series[(series < lower_fence) | (series > upper_fence)].sort_values().reset_index(drop=True)
        sample_size = min(len(outliers), 250)
        if sample_size == 1:
            outlier_sample = [float(outliers.iloc[0])]
        elif sample_size > 1:
            sample_indexes = [
                round(index * (len(outliers) - 1) / (sample_size - 1))
                for index in range(sample_size)
            ]
            outlier_sample = [float(outliers.iloc[index]) for index in sample_indexes]
        else:
            outlier_sample = []
        numeric_distributions.append({
            "key": column,
            "label": EDA_NUMERIC_LABELS.get(column, column.replace("_", " ").title()),
            "histogram": histogram,
            "stats": {
                "min": float(series.min()),
                "q1": first_quartile,
                "median": median,
                "q3": third_quartile,
                "max": float(series.max()),
                "lowerWhisker": float(inliers.min()),
                "upperWhisker": float(inliers.max()),
                "outlierCount": int(len(outliers)),
                "outlierSample": outlier_sample,
            },
        })

    return {
        "source": EDA_DATA_PATH.name,
        "overview": {
            "records": row_count,
            "columns": int(data.shape[1]),
            "features": int(data.shape[1] - 1),
            "targetClasses": len(target),
            "duplicateRows": int(data.duplicated().sum()),
            "rowsWithMissingValues": rows_with_missing_values,
            "missingRowPercent": round(float(rows_with_missing_values / row_count * 100), 2),
        },
        "target": target,
        "features": features,
        "numericDistributions": numeric_distributions,
        "insights": observations,
    }


@app.get("/eda/summary")
def get_eda_summary():
    try:
        return build_eda_summary()
    except FileNotFoundError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except (ValueError, pd.errors.ParserError) as error:
        raise HTTPException(status_code=422, detail=f"Could not analyze EDA dataset: {error}") from error


# 5. Define Inference Endpoint
@app.post("/predict")
def predict_readmission(patient: PatientData):
    try:
        # Convert incoming JSON payload to Pandas DataFrame (single row)
        input_data = pd.DataFrame([patient.dict()])

        # 2. Automatically patch missing columns with default missing values
        for col in EXPECTED_COLUMNS:
            if col not in input_data.columns:
                input_data[col] = "Missing"  # or None / 'No' depending on feature type

        # 3. Ensure column order matches training set order
        input_data = input_data[EXPECTED_COLUMNS]

        # Generate predicted probability for positive class (<30 days)
        prob_readmit = float(model_pipeline.predict_proba(input_data)[0, 1])

        # Apply operational decision threshold
        is_high_risk = prob_readmit >= OPTIMAL_THRESHOLD

        # Return clear and actionable JSON response
        return { "prediction": int(is_high_risk), 
                "readmission_flag": int(is_high_risk), 
                "probability": round(prob_readmit, 4), 
                "operational_threshold_used": OPTIMAL_THRESHOLD, 
                "risk_category": "CRITICAL" if prob_readmit >= 0.70 else ("MODERATE" if is_high_risk else "LOW") }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")