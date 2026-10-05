import { fieldGroups } from '../services/features';

function PredictionForm({ values, onChange, onSubmit, onClear, loading }) {
  return (
    <form className="prediction-form" onSubmit={onSubmit} noValidate>
      {fieldGroups.map((group, groupIndex) => (
        <fieldset className="form-group" key={group.title} disabled={loading}>
          <legend className="visually-hidden">{group.title}</legend>
          <div className="group-heading">
            <span className="group-index">{String(groupIndex + 1).padStart(2, '0')}</span>
            <div>
              <h3>{group.title}</h3>
              <p>{group.description}</p>
            </div>
          </div>
          <div className="field-grid">
            {group.fields.map((field) => (
              <label className="field" htmlFor={field.name} key={field.name}>
                <span className="field-label">{field.label}<span aria-hidden="true"> *</span></span>
                {field.type === 'select' ? (
                  <select id={field.name} name={field.name} value={values[field.name]} onChange={onChange} required>
                    <option value="" disabled>Select {field.label.toLowerCase()}</option>
                    {field.options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                  </select>
                ) : (
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    value={values[field.name]}
                    onChange={onChange}
                    placeholder={field.placeholder || 'Enter a value'}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    required
                  />
                )}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="form-actions">
        <button className="clear-button" type="button" onClick={onClear} disabled={loading}>Clear form</button>
        <button className="submit-button" type="submit" disabled={loading}>
          {loading ? <><span className="spinner" aria-hidden="true" /> Predicting...</> : <>Predict readmission <span aria-hidden="true">→</span></>}
        </button>
      </div>
    </form>
  );
}

export default PredictionForm;