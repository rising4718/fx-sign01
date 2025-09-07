import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider } from './contexts/AuthContext';
import TORBLandingPage from './pages/TORBLandingPage';
import TradingPage from './pages/TradingPage';
import TORBLogicPage from './pages/TORBLogicPage';
import FundManagementPage from './pages/FundManagementPage';
import ResultsPage from './pages/ResultsPage';
import PerformanceDashboard from './pages/PerformanceDashboard';
import ReleaseNotesPage from './pages/ReleaseNotesPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Router>
          <Routes>
            <Route path="/" element={<TORBLandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route 
              path="/trading" 
              element={
                <ProtectedRoute>
                  <TradingPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/torb-logic" 
              element={
                <ProtectedRoute>
                  <TORBLogicPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/fund-management" 
              element={
                <ProtectedRoute>
                  <FundManagementPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/results" 
              element={
                <ProtectedRoute>
                  <ResultsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/performance" 
              element={
                <ProtectedRoute>
                  <PerformanceDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/release-notes" 
              element={
                <ProtectedRoute>
                  <ReleaseNotesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;