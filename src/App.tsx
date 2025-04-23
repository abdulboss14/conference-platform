import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Authentication pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Common pages
import Dashboard from './pages/Dashboard';
import ClassSession from './pages/ClassSession';
import Messages from './pages/Messages';
import Profile from './pages/Profile';

// Mentor pages
import MyClasses from './pages/mentor/MyClasses';
import CreateClass from './pages/mentor/CreateClass';
import Participants from './pages/Participants';

// Participant pages
import ExploreClasses from './pages/participant/ExploreClasses';
import EnrolledClasses from './pages/participant/EnrolledClasses';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/class-session/:id" element={<ProtectedRoute><ClassSession /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Mentor routes */}
          <Route path="/my-classes" element={<MentorRoute><MyClasses /></MentorRoute>} />
          <Route path="/create-class" element={<MentorRoute><CreateClass /></MentorRoute>} />
          <Route path="/participants" element={<MentorRoute><Participants /></MentorRoute>} />

          {/* Participant routes */}
          <Route path="/explore" element={<ParticipantRoute><ExploreClasses /></ParticipantRoute>} />
          <Route path="/enrolled-classes" element={<ParticipantRoute><EnrolledClasses /></ParticipantRoute>} />

          {/* Redirect root to dashboard or login */}
          <Route path="/" element={<RootRedirect />} />
          
          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

function RootRedirect() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function MentorRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== 'mentor') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

function ParticipantRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== 'participant') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

export default App;