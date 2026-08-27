import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import React from 'react';
import ParentDashboard from './pages/ParentDashboard';
import AvatarSelection from './pages/avatarSelection';
import Welcome from './pages/welcome';
import Registering from './pages/registering';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ChildRegistration from './pages/childRegistration';
import Activities from './pages/Activities';
import ResetPassword from "./pages/ResetPassword";
import AccountSettings from './pages/AccountSettings';
import HistoryPage from './pages/HistoryPage';
import AnalyticsPage from './pages/analyticsPage';
import Layout from './components/Layout';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/registering" element={<Registering />} />
        <Route path="/login" element={<Login />} />
        <Route path="/avatarSelection" element={<AvatarSelection />} />
        <Route path="/childRegistration" element={<ChildRegistration />} />
        <Route path="/add-activity" element={<Activities />} />
        <Route path="/ParentDashboard" element={<Layout><ParentDashboard /></Layout>} />
        <Route path="/account" element={<AccountSettings />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;
