# Diabetic Readmission Predictor

This Create React App-style frontend collects the raw input fields used by the notebook's final model pipeline and submits them to `POST /predict`. Model preprocessing stays in the backend pipeline.

## Run locally

```powershell
npm install
$env:REACT_APP_API_URL = "http://localhost:5000"
npm start
```

The API URL defaults to `http://localhost:5000`. Set `REACT_APP_API_URL` to the backend origin before starting the development server to use a different address.

## Backend contract

Send a JSON object with these exact feature names: `race`, `gender`, `age`, `admission_type_id`, `discharge_disposition_id`, `admission_source_id`, `time_in_hospital`, `medical_specialty`, `num_lab_procedures`, `num_procedures`, `num_medications`, `number_outpatient`, `number_emergency`, `number_inpatient`, `diag_1`, `diag_2`, `diag_3`, `number_diagnoses`, `max_glu_serum`, `A1Cresult`, `metformin`, `repaglinide`, `glimepiride`, `glipizide`, `glyburide`, `pioglitazone`, `rosiglitazone`, `insulin`, `change`, and `diabetesMed`.

The frontend sends numeric fields as JSON numbers and category fields as the original dataset strings. The notebook's target is `readmitted_binary`, where `1` means the original `readmitted` value was `<30`; all other target values are `0`.

The endpoint should return a JSON object with `prediction` as `0` or `1`. It may also return `label` using the displayed result labels and `probability` as a number between `0` and `1`. The probability is shown only when the backend includes a valid value.