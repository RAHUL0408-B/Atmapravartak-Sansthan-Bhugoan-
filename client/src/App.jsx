import { useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import AuthContext from './contexts/AuthContext'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import Dashboard from './pages/Dashboard'
import MemberList from './pages/MemberList'
import MemberForm from './pages/MemberForm'
import Programs from './pages/Programs'
import ProgramForm from './pages/ProgramForm'
import Collectors from './pages/Collectors'
import CollectorForm from './components/CollectorForm'
import Header from './components/Header'
import Navigation from './components/Navigation'
import './App.css'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return children;
};

function AppRoutes() {
  const { user } = useContext(AuthContext);

  return (
    <>
      {user && <Navigation />}
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <SignupPage />} />
        <Route path="/forgot-password" element={user ? <Navigate to="/dashboard" /> : <ForgotPasswordPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/" element={
          <ProtectedRoute>
            <MemberList />
          </ProtectedRoute>
        } />
        <Route path="/members/add" element={
          <ProtectedRoute>
            <MemberForm />
          </ProtectedRoute>
        } />
        <Route path="/members/edit/:id" element={
          <ProtectedRoute>
            <MemberForm />
          </ProtectedRoute>
        } />
        <Route path="/programs" element={
          <ProtectedRoute>
            <Programs />
          </ProtectedRoute>
        } />
        <Route path="/programs/add" element={
          <ProtectedRoute>
            <ProgramForm />
          </ProtectedRoute>
        } />
        <Route path="/programs/edit/:id" element={
          <ProtectedRoute>
            <ProgramForm />
          </ProtectedRoute>
        } />
        <Route path="/collectors" element={
          <ProtectedRoute>
            <Collectors />
          </ProtectedRoute>
        } />
        <Route path="/collectors/add" element={
          <ProtectedRoute>
            <CollectorForm />
          </ProtectedRoute>
        } />
        <Route path="/collectors/edit/:id" element={
          <ProtectedRoute>
            <CollectorForm />
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Header />
          <main className="container mt-4" style={{ paddingBottom: '50px' }}>
            <AppRoutes />
          </main>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
