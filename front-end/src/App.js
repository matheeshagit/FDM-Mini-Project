import PredictionPage from './pages/PredictionPage';
import HomePage from './pages/HomePage';
import EDAPage from './pages/EDAPage';
import Sidebar from './components/Sidebar';
import { useState } from 'react';

function App() {
  const [activePage, setActivePage] = useState('home');

  return (
    <div className={`dashboard-layout${activePage === 'eda' ? ' dashboard-layout--eda' : ''}`}>
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="dashboard-content">
        {activePage === 'prediction' && <PredictionPage />}
        {activePage === 'home' && <HomePage onNavigate={setActivePage} />}
        {activePage === 'eda' && <EDAPage />}
      </div>
    </div>
  );
}

export default App;