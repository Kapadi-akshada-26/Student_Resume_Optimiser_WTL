import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import OptimiseResume from './pages/OptimiseResume';
import MyResumes from './pages/MyResumes';
import History from './pages/History';
import Profile from './pages/Profile';
import AnalysisResult from './pages/AnalysisResult';
import PreviewResumePage from './pages/PreviewResumePage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('user') !== null;
  });

  return (
    <Router>
      <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route 
            path="/login" 
            element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login setIsLoggedIn={setIsLoggedIn} />} 
          />
          <Route 
            path="/register" 
            element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Register />} 
          />

          {/* Authenticated Protected Routes */}
          <Route 
            path="/dashboard" 
            element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/optimise" 
            element={isLoggedIn ? <OptimiseResume /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/optimise-resume" 
            element={isLoggedIn ? <OptimiseResume /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/my-resumes" 
            element={isLoggedIn ? <MyResumes /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/preview/:id" 
            element={isLoggedIn ? <PreviewResumePage /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/analysis/:id" 
            element={isLoggedIn ? <AnalysisResult /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/history" 
            element={isLoggedIn ? <History /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/profile" 
            element={isLoggedIn ? <Profile /> : <Navigate to="/login" replace />} 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;
