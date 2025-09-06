import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TORBLandingPage from './pages/TORBLandingPage';
import TradingPage from './pages/TradingPage';
import TORBLogicPage from './pages/TORBLogicPage';
import FundManagementPage from './pages/FundManagementPage';
import ResultsPage from './pages/ResultsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TORBLandingPage />} />
        <Route path="/trading" element={<TradingPage />} />
        <Route path="/torb-logic" element={<TORBLogicPage />} />
        <Route path="/fund-management" element={<FundManagementPage />} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </Router>
  );
}

export default App;