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
import PaymentValidationRegionSelection from "./PaymentValidationRegionSelection";
import PaymentValidationTransactionValidation from "./PaymentValidationTransactionValidation";
import RegistrarDashboard from "./RegistrarDashboard";
import Statistics from "./Statistics";
import DistrictPlacePeopleDetails from "./DistrictPlacePeopleDetails";
import PaymentAbstract from "./PaymentAbstract";
import OfferingsRegionSelection from "./OfferingsRegionSelection";
import OfferingsRegistrationCheck from "./OfferingsRegistrationCheck";
import OfferingsSpiconValidation from "./OfferingsSpiconValidation";
import OfferingsForm from "./OfferingsForm";
import OfferingsSuccess from "./OfferingsSuccess";
import OfferingsList from "./OfferingsList";
import TreasurerDashboard from "./TreasurerDashboard";
import TreasurerApprovedRequests from "./TreasurerApprovedRequests";
import TreasurerSummary from "./TreasurerSummary";
import TreasurerRegionSelection from "./TreasurerRegionSelection";
import WorkerDisbursements from "./WorkerDisbursements";
import EventDayVerification from "./EventDayVerification";
import PendingPayment from "./PendingPayment";

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
        <Route path="/registrar-dashboard" element={<RegistrarDashboard />} /> {/* Post-login dashboard */}
        <Route path="/registrations" element={<RegistrationList />} /> {/* Approval page */}
        <Route path="/statistics" element={<Statistics />} /> {/* Statistics page */}
        <Route path="/payment-requests" element={<PaymentRequestList />} /> {/* Payment requests for registrar */}

        {/* Coordinator/LAC Convener Pages */}
        <Route path="/create-payment-request" element={<PaymentRequestForm />} />
        <Route path="/my-payment-requests" element={<MyPaymentRequests />} />

        {/* Treasurer Pages */}
        <Route path="/treasurer" element={<TreasurerDashboard />} />
        <Route path="/treasurer/region-selection" element={<TreasurerRegionSelection />} />
        <Route path="/treasurer/dashboard" element={<TreasurerDashboard />} />
        <Route path="/treasurer/approved-requests" element={<TreasurerApprovedRequests />} />
        <Route path="/treasurer/summary" element={<TreasurerSummary />} />
        <Route path="/treasurer/worker-disbursements" element={<WorkerDisbursements />} />

        {/* Cashier Pages */}
        <Route path="/cashier-payment-requests" element={<CashierPaymentRequests />} />

        {/* Chairperson/Admin Pages */}
        <Route path="/view-payment-requests" element={<ViewAllPaymentRequests />} />

        {/* View Payment Requests (for Chairperson, Registrar, Coordinator, LAC Convener) */}
        <Route path="/view-payment-requests" element={<ViewPaymentRequests />} />

        {/* Payment Validation */}
        <Route path="/payment-validation-region" element={<PaymentValidationRegionSelection />} />
        <Route path="/payment-validation" element={<PaymentValidationTransactionValidation />} />

        {/* Gifts Module */}
        <Route path="/gifts-region" element={<OfferingsRegionSelection />} />
        <Route path="/gifts-registration-check" element={<OfferingsRegistrationCheck />} />
        <Route path="/gifts-spicon-validation" element={<OfferingsSpiconValidation />} />
        <Route path="/gifts-form" element={<OfferingsForm />} />
        <Route path="/gifts-success" element={<OfferingsSuccess />} />
        <Route path="/gifts-list" element={<OfferingsList />} />

        {/* Statistics Modules */}
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/statistics/district-place-people" element={<DistrictPlacePeopleDetails />} />
        <Route path="/statistics/payment-abstract" element={<PaymentAbstract />} />

        {/* Event Day Verification */}
        <Route path="/event-day-verification" element={<EventDayVerification />} />

        {/* Pending Payment */}
        <Route path="/pending-payment" element={<PendingPayment />} />

      </Routes>
    </Router>
  );
}

export default App;
