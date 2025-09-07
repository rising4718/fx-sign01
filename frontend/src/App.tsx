import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SettingsProvider } from './contexts/SettingsContext';
import TORBLandingPage from './pages/TORBLandingPage';
import TradingPage from './pages/TradingPage';
import TORBLogicPage from './pages/TORBLogicPage';
import FundManagementPage from './pages/FundManagementPage';
import ResultsPage from './pages/ResultsPage';
import ReleaseNotesPage from './pages/ReleaseNotesPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <SettingsProvider>
      <Router>
        <Routes>
          <Route path="/" element={<TORBLandingPage />} />
          <Route path="/trading" element={<TradingPage />} />
          <Route path="/torb-logic" element={<TORBLogicPage />} />
          <Route path="/fund-management" element={<FundManagementPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/release-notes" element={<ReleaseNotesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Router>
    </SettingsProvider>
  );
}

export default App;