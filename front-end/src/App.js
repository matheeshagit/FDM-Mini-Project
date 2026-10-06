import PredictionPage from './pages/PredictionPage';
import HomePage from './pages/HomePage';
import Sidebar from './components/Sidebar';
import { useState } from 'react';

function App() {
  const [activePage, setActivePage] = useState('home');

  return (
    <div className="dashboard-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="dashboard-content">
        {activePage === 'prediction' && <PredictionPage />}
        {activePage === 'home' && <HomePage onNavigate={setActivePage} />}
        {activePage === 'eda' && (
          <main className="placeholder-page">
            <p>Explore the data</p>
            <h1>EDA</h1>
            <span>Exploratory data analysis will be available here.</span>
          </main>
        )}
      </div>
    </div>
  );
}

export default App;