import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { SettingsProvider, useSettings } from './SettingsContext';
import ComingSoon from './ComingSoon';
import Chat from './Chat';
import SettingsModal from './SettingsModal';
import Login from './Login';
import Register from './Register';
import TermsOfService from './TermsOfService';
import PrivacyPolicy from './PrivacyPolicy';

// Requesting user info will happen in SettingsProvider mount.
// We need a component to handle the "wait for auth check" before redirecting.

const ProtectedRoute = () => {
  const { isAuthenticated, authLoading } = useSettings();

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/app/login" replace />;
};

const AppLayout = () => {
  return (
    <>
      <div className="mesh-gradient"></div>
      <div className="min-h-screen text-[var(--color-text-primary)]">
        <Outlet />
        <SettingsModal />
      </div>
    </>
  );
};

function App() {
  return (
    <SettingsProvider>
      <Routes>
        <Route path="/" element={<ComingSoon />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />

        {/* App Routes with Mesh Background */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="/app/chat" replace />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />

          {/* Protected Chat Route */}
          <Route element={<ProtectedRoute />}>
            <Route path="chat" element={<Chat />} />
          </Route>
        </Route>
      </Routes>
    </SettingsProvider>
  );
}

export default App;
