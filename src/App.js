import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./Home";
import AdminLogin from "./AdminLogin";
import EastRegistration from "./EastRegistration";
import WestRegistration from "./WestRegistration";
import AdminDashboard from "./AdminDashboard";
import RegistrationList from "./RegistrationList";
import RegistrarLogin from "./RegistrarLogin"; 
import RegistrationSuccess from "./RegistrationSuccess"; 
   // <<< IMPORTANT ADD

function App() {
  return (
    <Router>
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/registrar-login" element={<RegistrarLogin />} /> {/* <<< NEW ROUTE */}
        <Route path="/east-registration" element={<EastRegistration />} />
        <Route path="/west-registration" element={<WestRegistration />} />

        {/* Admin Pages */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/registration-success" element={<RegistrationSuccess />} />

        {/* Registrar Pages */}
        <Route path="/registrations" element={<RegistrationList />} /> {/* Approval page */}

      </Routes>
    </Router>
  );
}

export default App;