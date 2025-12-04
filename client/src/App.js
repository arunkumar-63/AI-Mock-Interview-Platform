import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';

// Context
import { AuthProvider } from './contexts/AuthContext';
import { InterviewProvider } from './contexts/InterviewContext';

// Components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard';
import ResumeBuilder from './pages/Resume/ResumeBuilder';
import ResumeAnalyzer from './pages/Resume/ResumeAnalyzer';
import InterviewCreator from './pages/Interview/InterviewCreator';
import InterviewSession from './pages/Interview/InterviewSession';
import InterviewHistory from './pages/Interview/InterviewHistory';
import InterviewDetails from './pages/Interview/InterviewDetails';
import Analytics from './pages/Analytics/Analytics';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Styles
import './index.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <AuthProvider>
            <InterviewProvider>
              <div className="App">
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                  }}
                />
                
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  {/* Protected routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/resume" element={
                    <ProtectedRoute>
                      <Layout>
                        <ResumeBuilder />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/resume/analyze" element={
                    <ProtectedRoute>
                      <Layout>
                        <ResumeAnalyzer />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/interview/create" element={
                    <ProtectedRoute>
                      <Layout>
                        <InterviewCreator />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/interview/session/:id" element={
                    <ProtectedRoute>
                      <Layout>
                        <InterviewSession />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/interview/history" element={
                    <ProtectedRoute>
                      <Layout>
                        <InterviewHistory />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/interview/details/:id" element={
                    <ProtectedRoute>
                      <Layout>
                        <InterviewDetails />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/analytics" element={
                    <ProtectedRoute>
                      <Layout>
                        <Analytics />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Layout>
                        <Profile />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  
                  {/* 404 route */}
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </div>
            </InterviewProvider>
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App; 