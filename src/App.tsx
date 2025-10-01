import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { SignIn } from './pages/auth/SignIn';
import { SignUp } from './pages/auth/SignUp';
import { Profile } from './pages/Profile';
import { Scenarios } from './pages/Scenarios';
import { Explore } from './pages/Explore';
import { CreateScenario } from './pages/CreateScenario';
import { EditScenario } from './pages/EditScenario';
import { ConversationSimulator } from './pages/ConversationSimulator';
import { Analytics } from './pages/Analytics';
import { UserManagement } from './pages/UserManagement';
import { PersonaList } from './pages/personas/PersonaList';
import { PersonaDetails } from './pages/personas/PersonaDetails';
import { CreatePersona } from './pages/personas/CreatePersona';
import { EditPersona } from './pages/personas/EditPersona';
import { Schedule } from './pages/Schedule';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { Billing } from './pages/Billing';
import { UserSubscriptions } from './pages/UserSubscriptions';
import { Pricing } from './pages/Pricing';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { ThemeProvider } from './providers/ThemeProvider';
import { ActivateAccount } from './pages/ActivateAccount';
import { RoleManagement } from './pages/RoleManagement';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RolePlayAnalytics } from './pages/RolePlayAnalytics';

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/activate" element={<ActivateAccount />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/role-plays" element={<Scenarios />} />
          <Route path="/role-plays/create" element={<CreateScenario />} />
          <Route path="/role-plays/:id/edit" element={<EditScenario />} />
          <Route path="/practice/:type/:scenarioId" element={<ConversationSimulator />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/role-play-analytics" element={<RolePlayAnalytics />} />
          
          {/* Admin and Super Admin only routes */}
          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['admin', 'super-admin']}>
              <UserManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/roles" element={
            <ProtectedRoute allowedRoles={['admin', 'super-admin']}>
              <RoleManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/subscriptions" element={
            <ProtectedRoute allowedRoles={['admin', 'super-admin']}>
              <UserSubscriptions />
            </ProtectedRoute>
          } />
          
          <Route path="/pricing" element={
            <ProtectedRoute allowedRoles={['admin', 'super-admin']}>
              <Pricing />
            </ProtectedRoute>
          } />
          
          <Route path="/billing" element={
            <ProtectedRoute allowedRoles={['admin', 'super-admin']}>
              <Billing />
            </ProtectedRoute>
          } />
          
          <Route path="/iq-agents" element={<PersonaList />} />
          <Route path="/iq-agents/:id" element={<PersonaDetails />} />
          <Route path="/iq-agents/create" element={<CreatePersona />} />
          <Route path="/iq-agents/:id/edit" element={<EditPersona />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/knowledge-base" element={<KnowledgeBase />} />
          
          {/* Super Admin only route */}
          <Route path="/super-admin" element={
            <ProtectedRoute allowedRoles={['super-admin']}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/" element={<SignIn />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}