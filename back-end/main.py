from pathlib import Path
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