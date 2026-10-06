import './HomePage.css';

const features = [
  {
    id: 'prediction',
    icon: '✚',
    title: 'Diabetes Prediction',
    description: 'Use patient health information to estimate readmission risk.',
    action: 'prediction'
  },
  {
    id: 'eda',
    icon: '▥',
    title: 'Exploratory Data Analysis',
    description: 'Explore the dataset and understand the information behind the system.',
    action: 'eda'
  },
  {
    id: 'insights',
    icon: '⌁',
    title: 'Machine Learning Insights',
    description: 'Learn how machine learning can support healthcare decisions.'
  }
];

function HomePage({ onNavigate }) {
  return (
    <main className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <p className="home-eyebrow">Healthcare · Machine Learning</p>
          <h1 id="home-title">Diabetes Prediction System</h1>
          <p className="home-description">
            An interactive machine learning system that estimates hospital readmission risk from patient health information.
          </p>
          <button
            className="home-primary-button"
            type="button"
            onClick={() => onNavigate('prediction')}
          >
            Start Prediction <span aria-hidden="true">→</span>
          </button>
        </div>
        <div className="home-hero-symbol" aria-hidden="true">
          <span>+</span>
        </div>
      </section>

      <section className="home-features" aria-labelledby="home-features-title">
        <div className="home-section-heading">
          <h2 id="home-features-title">What you can do</h2>
          <p>Choose a section to get started.</p>
        </div>
        <div className="home-feature-grid">
          {features.map(({ id, icon, title, description, action }) => {
            const content = (
              <>
                <span className="home-feature-icon" aria-hidden="true">{icon}</span>
                <span className="home-feature-title">{title}</span>
                <span className="home-feature-description">{description}</span>
                {action && <span className="home-feature-link">Open section <span aria-hidden="true">→</span></span>}
              </>
            );

            return action ? (
              <button
                className="home-feature-card home-feature-card--action"
                key={id}
                type="button"
                onClick={() => onNavigate(action)}
              >
                {content}
              </button>
            ) : (
              <article className="home-feature-card" key={id}>
                {content}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default HomePage;
