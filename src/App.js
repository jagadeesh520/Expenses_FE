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
import PaymentRequestForm from "./PaymentRequestForm";
import PaymentRequestList from "./PaymentRequestList";
import CashierPaymentRequests from "./CashierPaymentRequests";
import ViewAllPaymentRequests from "./ViewAllPaymentRequests";
import MyPaymentRequests from "./MyPaymentRequests";
import ViewPaymentRequests from "./ViewPaymentRequests";

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
        <Route path="/payment-requests" element={<PaymentRequestList />} /> {/* Payment requests for registrar */}

        {/* Coordinator/LAC Convener Pages */}
        <Route path="/create-payment-request" element={<PaymentRequestForm />} />
        <Route path="/my-payment-requests" element={<MyPaymentRequests />} />

        {/* Cashier Pages */}
        <Route path="/cashier-payment-requests" element={<CashierPaymentRequests />} />

        {/* Chairperson/Admin Pages */}
        <Route path="/view-payment-requests" element={<ViewAllPaymentRequests />} />

        {/* View Payment Requests (for Chairperson, Registrar, Coordinator, LAC Convener) */}
        <Route path="/view-payment-requests" element={<ViewPaymentRequests />} />

      </Routes>
    </Router>
  );
}

export default App;
