import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from '@/components/ui/sonner';
import Landing from '@/pages/Landing';
import AuthCallback from '@/pages/AuthCallback';
import Dashboard from '@/pages/Dashboard';
import CreateGroup from '@/pages/CreateGroup';
import GroupDetail from '@/pages/GroupDetail';
import MemberPreferences from '@/pages/MemberPreferences';
import PlanDisplay from '@/pages/PlanDisplay';
import InvitePreferences from '@/pages/InvitePreferences';
import MomentDetail from '@/pages/MomentDetail';
import Demo from '@/pages/Demo';
import ProtectedRoute from '@/components/ProtectedRoute';
import '@/App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

function AppRouter() {
  const location = useLocation();
  
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/invite/:groupId/:memberToken" element={<InvitePreferences />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-group"
          element={
            <ProtectedRoute>
              <CreateGroup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups/:groupId"
          element={
            <ProtectedRoute>
              <GroupDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups/:groupId/members/:memberId/preferences"
          element={
            <ProtectedRoute>
              <MemberPreferences />
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups/:groupId/plan"
          element={
            <ProtectedRoute>
              <PlanDisplay />
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups/:groupId/moments/:momentId"
          element={
            <ProtectedRoute>
              <MomentDetail />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
        <Toaster />
      </BrowserRouter>
    </div>
  );
}

export default App;