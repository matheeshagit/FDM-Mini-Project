const options = (values) => values.map(([value, label]) => ({ value, label }));
const optionalMedicationNames = [
  'repaglinide', 'glimepiride', 'glipizide', 'glyburide', 'pioglitazone', 'rosiglitazone'
];

export const fieldGroups = [
  {
    title: 'Patient information',
    description: 'Basic demographic details from the encounter record.',
    fields: [
      { name: 'race', label: 'Race', type: 'select', options: options([
        ['Caucasian', 'Caucasian'], ['AfricanAmerican', 'AfricanAmerican'], ['Asian', 'Asian'], ['Hispanic', 'Hispanic'], ['Other', 'Other']
      ]), required: true },
      { name: 'gender', label: 'Gender', type: 'select', options: options([
        ['Female', 'Female'], ['Male', 'Male'], ['Unknown/Invalid', 'Unknown/Invalid']
      ]), required: true },
      { name: 'age', label: 'Age range', type: 'select', options: options(
        Array.from({ length: 10 }, (_, index) => {
          const start = index * 10;
          const ageRange = `[${start}-${start + 10})`;
          return [ageRange, ageRange];
        })
      ), required: true }
    ]
  },
  {
    title: 'Hospital visit',
    description: 'Admission details, length of stay, and service use.',
    fields: [
      { name: 'admission_type_id', label: 'Admission type ID', type: 'number', min: 1, max: 8, step: 1, required: true },
      { name: 'discharge_disposition_id', label: 'Discharge disposition ID', type: 'number', min: 1, max: 28, step: 1, required: true },
      { name: 'admission_source_id', label: 'Admission source ID', type: 'number', min: 1, max: 25, step: 1, required: true },
      { name: 'time_in_hospital', label: 'Days in hospital', type: 'number', min: 1, max: 14, step: 1, required: true },
      { name: 'num_lab_procedures', label: 'Lab procedures', type: 'number', min: 1, max: 132, step: 1, required: true },
      { name: 'num_procedures', label: 'Procedures', type: 'number', min: 0, max: 6, step: 1, required: true },
      { name: 'num_medications', label: 'Medications during visit', type: 'number', min: 1, max: 81, step: 1, required: true },
      { name: 'number_outpatient', label: 'Outpatient visits (past year)', type: 'number', min: 0, max: 42, step: 1, required: true },
      { name: 'number_emergency', label: 'Emergency visits (past year)', type: 'number', min: 0, max: 76, step: 1, required: true },
      { name: 'number_inpatient', label: 'Inpatient visits (past year)', type: 'number', min: 0, max: 21, step: 1, required: true }
    ]
  },
  {
    title: 'Medical history',
    description: 'Diagnoses, specialty, and available laboratory results.',
    fields: [
      { name: 'medical_specialty', label: 'Medical specialty', type: 'text', required: false, placeholder: 'e.g. InternalMedicine' },
      { name: 'diag_1', label: 'Primary diagnosis code', type: 'text', required: false, placeholder: 'Enter the recorded diagnosis code' },
      { name: 'diag_2', label: 'Secondary diagnosis code', type: 'text', required: false, placeholder: 'Enter the recorded diagnosis code' },
      { name: 'diag_3', label: 'Additional diagnosis code', type: 'text', required: false, placeholder: 'Enter the recorded diagnosis code' },
      { name: 'number_diagnoses', label: 'Number of diagnoses', type: 'number', min: 1, max: 16, step: 1, required: true },
      { name: 'max_glu_serum', label: 'Max glucose serum', type: 'select', options: options([
        ['None', 'None'], ['Norm', 'Norm'], ['>200', '>200'], ['>300', '>300']
      ]), required: true },
      { name: 'A1Cresult', label: 'A1C result', type: 'select', options: options([
        ['None', 'None'], ['Norm', 'Norm'], ['>7', '>7'], ['>8', '>8']
      ]), required: true }
    ]
  },
  {
    title: 'Medication and clinical information',
    description: 'Recorded diabetes medications and treatment changes.',
    fields: [
      ...['metformin', 'repaglinide', 'glimepiride', 'glipizide', 'glyburide', 'pioglitazone', 'rosiglitazone', 'insulin'].map((name) => ({
        name,
        label: name.charAt(0).toUpperCase() + name.slice(1),
        type: 'select',
        required: !optionalMedicationNames.includes(name),
        options: options([
          ['No', 'No'], ['Steady', 'Steady'], ['Up', 'Up'], ['Down', 'Down']
        ])
      })),
      { name: 'change', label: 'Medication changed', type: 'select', options: options([['No', 'No'], ['Ch', 'Ch']]), required: true },
      { name: 'diabetesMed', label: 'Diabetes medication prescribed', type: 'select', options: options([['No', 'No'], ['Yes', 'Yes']]), required: true }
    ]
  }
];

export const numericFeatures = new Set(
  fieldGroups.flatMap((group) => group.fields)
    .filter((field) => field.type === 'number')
    .map((field) => field.name)
);

export const featureNames = [
  'race', 'gender', 'age', 'admission_type_id', 'discharge_disposition_id',
  'admission_source_id', 'time_in_hospital', 'medical_specialty', 'num_lab_procedures',
  'num_procedures', 'num_medications', 'number_outpatient', 'number_emergency',
  'number_inpatient', 'diag_1', 'diag_2', 'diag_3', 'number_diagnoses',
  'max_glu_serum', 'A1Cresult', 'metformin', 'repaglinide', 'glimepiride',
  'glipizide', 'glyburide', 'pioglitazone', 'rosiglitazone', 'insulin', 'change', 'diabetesMed'
];

export const emptyForm = Object.fromEntries(featureNames.map((name) => [name, '']));