import { useState } from 'react';
import './Sidebar.css';

const navigationItems = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'prediction', label: 'Prediction', icon: '✚' },
  { id: 'eda', label: 'EDA', icon: '▥' }
];

function Sidebar({ activePage, onNavigate }) {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  function handleNavigate(page) {
    onNavigate(page);
    setMobileExpanded(false);
  }

  return (
    <aside className={`dashboard-sidebar${mobileExpanded ? ' dashboard-sidebar--expanded' : ''}`}>
      <div className="sidebar-heading">
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark" aria-hidden="true">+</span>
          <span>Care<span className="sidebar-brand-accent">AI</span></span>
        </div>
        <button
          className="sidebar-toggle"
          type="button"
          aria-expanded={mobileExpanded}
          aria-controls="dashboard-navigation"
          onClick={() => setMobileExpanded((expanded) => !expanded)}
        >
          {mobileExpanded ? 'Close menu' : 'Menu'}
        </button>
      </div>

      <nav className="sidebar-navigation" id="dashboard-navigation" aria-label="Main navigation">
        <p className="sidebar-section-label">Workspace</p>
        {navigationItems.map(({ id, label, icon }) => (
          <button
            className={`sidebar-nav-item${activePage === id ? ' sidebar-nav-item--active' : ''}`}
            type="button"
            key={id}
            aria-current={activePage === id ? 'page' : undefined}
            onClick={() => handleNavigate(id)}
          >
            <span className="sidebar-nav-icon" aria-hidden="true">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
