const options = (values) => values.map(([value, label]) => ({ value, label }));

export const fieldGroups = [
  {
    title: 'Patient information',
    description: 'Basic demographic details from the encounter record.',
    fields: [
      { name: 'race', label: 'Race', type: 'select', options: options([
        ['Caucasian', 'Caucasian'], ['AfricanAmerican', 'African American'], ['Asian', 'Asian'], ['Hispanic', 'Hispanic'], ['Other', 'Other']
      ]) },
      { name: 'gender', label: 'Gender', type: 'select', options: options([
        ['Female', 'Female'], ['Male', 'Male'], ['Unknown/Invalid', 'Unknown / invalid']
      ]) },
      { name: 'age', label: 'Age range', type: 'select', options: options(
        Array.from({ length: 10 }, (_, index) => {
          const start = index * 10;
          return [`[${start}-${start + 10})`, `${start} to ${start + 9} years`];
        })
      ) }
    ]
  },
  {
    title: 'Hospital visit',
    description: 'Admission details, length of stay, and service use.',
    fields: [
      { name: 'admission_type_id', label: 'Admission type ID', type: 'number', min: 1, max: 8, step: 1 },
      { name: 'discharge_disposition_id', label: 'Discharge disposition ID', type: 'number', min: 1, max: 28, step: 1 },
      { name: 'admission_source_id', label: 'Admission source ID', type: 'number', min: 1, max: 25, step: 1 },
      { name: 'time_in_hospital', label: 'Days in hospital', type: 'number', min: 1, max: 14, step: 1 },
      { name: 'num_lab_procedures', label: 'Lab procedures', type: 'number', min: 1, max: 132, step: 1 },
      { name: 'num_procedures', label: 'Procedures', type: 'number', min: 0, max: 6, step: 1 },
      { name: 'num_medications', label: 'Medications during visit', type: 'number', min: 1, max: 81, step: 1 },
      { name: 'number_outpatient', label: 'Outpatient visits (past year)', type: 'number', min: 0, max: 42, step: 1 },
      { name: 'number_emergency', label: 'Emergency visits (past year)', type: 'number', min: 0, max: 76, step: 1 },
      { name: 'number_inpatient', label: 'Inpatient visits (past year)', type: 'number', min: 0, max: 21, step: 1 }
    ]
  },
  {
    title: 'Medical history',
    description: 'Diagnoses, specialty, and available laboratory results.',
    fields: [
      { name: 'medical_specialty', label: 'Medical specialty', type: 'text', placeholder: 'e.g. InternalMedicine' },
      { name: 'diag_1', label: 'Primary diagnosis code', type: 'text', placeholder: 'Enter the recorded diagnosis code' },
      { name: 'diag_2', label: 'Secondary diagnosis code', type: 'text', placeholder: 'Enter the recorded diagnosis code' },
      { name: 'diag_3', label: 'Additional diagnosis code', type: 'text', placeholder: 'Enter the recorded diagnosis code' },
      { name: 'number_diagnoses', label: 'Number of diagnoses', type: 'number', min: 1, max: 16, step: 1 },
      { name: 'max_glu_serum', label: 'Max glucose serum', type: 'select', options: options([
        ['Norm', 'Normal'], ['>200', 'Above 200'], ['>300', 'Above 300']
      ]) },
      { name: 'A1Cresult', label: 'A1C result', type: 'select', options: options([
        ['Norm', 'Normal'], ['>7', 'Above 7'], ['>8', 'Above 8']
      ]) }
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
        options: options([
          ['No', 'No'], ['Steady', 'Steady'], ['Up', 'Increased'], ['Down', 'Decreased']
        ])
      })),
      { name: 'change', label: 'Medication changed', type: 'select', options: options([['No', 'No'], ['Ch', 'Yes']]) },
      { name: 'diabetesMed', label: 'Diabetes medication prescribed', type: 'select', options: options([['No', 'No'], ['Yes', 'Yes']]) }
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