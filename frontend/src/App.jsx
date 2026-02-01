import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminDashboard from './pages/AdminDashboard'
import SmartMatchingPage from './pages/SmartMatchingPage'
import ProvenancePage from './pages/ProvenancePage'
import { ChatPage } from './pages/ChatPage'
import Tracker from './pages/Tracker';

import SmartMatch from './pages/SmartMatch';
import WalletPage from './pages/WalletPage';
import TransparencyPage from './pages/TransparencyPage';

// Placeholder Pages
const Dashboard = () => <div className="p-10">Dashboard (Protected) - <a href="/marketplace" className="text-blue-500">Go to Marketplace</a></div>;
const PublicHome = () => <div className="p-10">Welcome to EcoChain. <a href="/login" className="text-blue-500">Login</a></div>;
import './index.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Admin Routes - No auth provider needed, uses own token */}
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          
          {/* Protected Routes - Require Authentication */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/list-waste" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/browse-materials" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-listings" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Smart Matching - For Buyers */}
          <Route 
            path="/smart-matching" 
            element={
              <ProtectedRoute>
                <SmartMatchingPage />
              </ProtectedRoute>
            } 
          />

          {/* Chat - Real-time Communication */}
          <Route 
            path="/chat" 
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chat/:conversationId" 
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Provenance Tracking */}
          <Route 
            path="/provenance/:listingId" 
            element={
              <ProtectedRoute>
                <ProvenancePage />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all - redirect to home */}
          <Route 
             path="/tracker/:id" 
             element={<Tracker />} 
          />
          <Route 
             path="/smart-match" 
             element={
               <ProtectedRoute>
                 <SmartMatch />
               </ProtectedRoute>
             } 
          />
          <Route 
             path="/wallet" 
             element={
               <ProtectedRoute>
                 <WalletPage />
               </ProtectedRoute>
             } 
          />
          <Route 
             path="/transparency" 
             element={
               <ProtectedRoute>
                 <TransparencyPage />
               </ProtectedRoute>
             } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
