function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="Diabetic Readmission Predictor home">
        <span className="brand-mark" aria-hidden="true"><span /></span>
        <span className="brand-name">Diabetic Readmission<span>Predictor</span></span>
      </a>
      <div className="header-context">
        <span className="status-dot" aria-hidden="true" />
        30-day clinical decision support
      </div>
    </header>
  );
}

export default Header;