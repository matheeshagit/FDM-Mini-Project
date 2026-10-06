# Diabetic Readmission Predictor

This Create React App-style frontend collects the raw input fields used by the notebook's final model pipeline and submits them to `POST /predict`. Model preprocessing stays in the backend pipeline. The development server proxies API requests to the existing FastAPI service on port `8000`.

## Run locally

```powershell
npm install
npm start
```

Start the backend in a second terminal from `back-end/` using the isolated environment that matches the saved model:

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

If `.venv` is already set up, only run the final command. For a different backend origin, set `REACT_APP_API_URL` before starting the frontend; direct cross-origin use requires the backend to allow that origin.
$env:REACT_APP_API_URL = "http://localhost:5000"
npm start
```

The API URL defaults to `http://localhost:5000`. Set `REACT_APP_API_URL` to the backend origin before starting the development server to use a different address.

## Backend contract

Send a JSON object with these exact feature names: `race`, `gender`, `age`, `admission_type_id`, `discharge_disposition_id`, `admission_source_id`, `time_in_hospital`, `medical_specialty`, `num_lab_procedures`, `num_procedures`, `num_medications`, `number_outpatient`, `number_emergency`, `number_inpatient`, `diag_1`, `diag_2`, `diag_3`, `number_diagnoses`, `max_glu_serum`, `A1Cresult`, `metformin`, `repaglinide`, `glimepiride`, `glipizide`, `glyburide`, `pioglitazone`, `rosiglitazone`, `insulin`, `change`, and `diabetesMed`.

The frontend sends numeric fields as JSON numbers and category fields as the original dataset strings. The notebook's target is `readmitted_binary`, where `1` means the original `readmitted` value was `<30`; all other target values are `0`.

The existing endpoint returns `readmission_flag` as `0` or `1` and `readmission_probability` between `0` and `1`; the frontend maps those fields to the displayed result and only shows probability when the response includes a valid value. Fields the backend declares optional are omitted when left blank so its declared defaults are applied.
The endpoint should return a JSON object with `prediction` as `0` or `1`. It may also return `label` using the displayed result labels and `probability` as a number between `0` and `1`. The probability is shown only when the backend includes a valid value.
