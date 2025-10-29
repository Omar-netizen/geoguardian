import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AnalysisHistory from "./pages/AnalysisHistory";
import CompareImages from "./pages/CompareImages";
import TimeLapse from "./pages/TimeLapse";
import Monitoring from "./pages/Monitoring";
import PrivateRoute from "./components/PrivateRoute";
import Navbar from "./components/NavBar";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/analysis-history"
          element={
            <PrivateRoute>
              <AnalysisHistory />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/compare"
          element={
            <PrivateRoute>
              <CompareImages />
            </PrivateRoute>
          }
        />
        
        <Route
          path="/timelapse"
          element={
            <PrivateRoute>
              <TimeLapse />
            </PrivateRoute>
          }
        
        />
        <Route
          path="/monitoring"
          element={
            <PrivateRoute>
              <Monitoring />
            </PrivateRoute>
          }
        />
        
      </Routes>
    </Router>
  );
}

export default App;