import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_ENDPOINTS } from "./constants";
import logo from "./Assests/logo.PNG";
import EastRayaUPI from "./Assests/eastrayalaseemaupi.png";
import WestGooglePayQR from "./Assests/west_googlepay.png";
import WestPhonePayQR from "./Assests/west_phonepay.png";

// Pricing function based on region and group type (reused from TreasurerSummary)
const getTotalAmount = (region, groupType, maritalStatus, spouseAttending) => {
  const regionLower = (region || "").toLowerCase();
  const groupTypeLower = (groupType || "").toLowerCase();

  // West Rayalaseema pricing
  if (regionLower.includes("west")) {
    if (groupTypeLower.includes("family")) {
      return 2500;
    } else if (groupTypeLower.includes("employed") && !groupTypeLower.includes("unemployed")) {
      return 1300; // Single Graduate (Employed)
    } else if (groupTypeLower.includes("unemployed") || groupTypeLower.includes("students")) {
      return 500; // Single Graduate (Unemployed) or Students
    } else if (groupTypeLower.includes("children") || groupTypeLower.includes("15+")) {
      return 500; // Graduates' children (15+)
    } else if (groupTypeLower.includes("volunteer")) {
      return 250; // Volunteers
    }
  }
  
  // East Rayalaseema pricing
  if (regionLower.includes("east")) {
    if (groupTypeLower.includes("family")) {
      // For East, check if spouse is attending to determine if it's doubled employed
      if (spouseAttending && spouseAttending.toLowerCase().includes("yes")) {
        return 2500; // Graduate Family (Doubled Employed)
      } else {
        return 2000; // Graduate Family (Single Employed)
      }
    } else if (groupTypeLower.includes("employed") && !groupTypeLower.includes("unemployed")) {
      return 1300; // Employed Graduate
    } else if (groupTypeLower.includes("unemployed") || groupTypeLower.includes("students")) {
      return 500; // Unemployed Graduate or Students
    } else if (groupTypeLower.includes("children") || groupTypeLower.includes("15+")) {
      return 500; // Children above 15 years
    } else if (groupTypeLower.includes("volunteer")) {
      return 200; // Volunteers
    }
  }

  // Default fallback
  return 0;
};

export default function PendingPayment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Region Selection, 2: SPICON Validation, 3: Payment Details, 4: Payment Form
  const [selectedRegion, setSelectedRegion] = useState("");
  const [spiconId, setSpiconId] = useState("");
  const [candidateData, setCandidateData] = useState(null);
  const [validated, setValidated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    transactionId: "",
    paidAmount: "",
    paymentDate: "",
    remarks: "",
  });
  const [screenshot, setScreenshot] = useState(null);

  // Calculate payment details
  const calculatePaymentDetails = () => {
    if (!candidateData) return { totalAmount: 0, amountPaid: 0, pendingAmount: 0 };

    const totalAmount = getTotalAmount(
      candidateData.region,
      candidateData.groupType,
      candidateData.maritalStatus,
      candidateData.spouseAttending
    );
    const amountPaid = parseFloat(candidateData.amountPaid || 0);
    const pendingAmount = Math.max(0, totalAmount - amountPaid);

    return { totalAmount, amountPaid, pendingAmount };
  };

  // Step 1: Region Selection
  const handleRegionSelect = () => {
    if (!selectedRegion) {
      setError("Please select a region");
      return;
    }
    setError("");
    setStep(2);
  };

  // Step 2: SPICON ID Validation
  const handleValidateSpicon = async () => {
    if (!spiconId.trim()) {
      setError("Please enter a SPICON ID");
      return;
    }

    setLoading(true);
    setError("");
    setCandidateData(null);
    setValidated(false);

    try {
      const res = await fetch(API_ENDPOINTS.REGISTRATIONS);
      const result = await res.json();

      if (result.success && result.data) {
        // First, find all matches for this SPICON ID (across all regions)
        const allMatches = result.data.filter(
          (reg) => reg.uniqueId && reg.uniqueId.toLowerCase() === spiconId.trim().toLowerCase()
        );

        // Now find the match in the selected region
        const found = allMatches.find(
          (reg) => reg.region === selectedRegion
        );

        if (found) {
          setCandidateData(found);
          setValidated(true);
          setError("");
          setStep(3); // Move to payment details step
        } else if (allMatches.length > 0) {
          // SPICON ID exists but in a different region
          const otherRegion = allMatches[0].region;
          setError(`This SPICON ID belongs to ${otherRegion}. Please select the correct region or verify your SPICON ID.`);
          setValidated(false);
          setCandidateData(null);
        } else {
          setError("SPICON ID not found. Please verify your SPICON ID and try again.");
          setValidated(false);
          setCandidateData(null);
        }
      } else {
        setError("Failed to fetch registration data. Please try again.");
      }
    } catch (err) {
      setError("An error occurred while validating SPICON ID. Please try again.");
      console.error("Validation error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Proceed to Payment Form
  const handleProceedToPayment = () => {
    const { pendingAmount } = calculatePaymentDetails();
    if (pendingAmount <= 0) {
      toast.warning("You have no pending amount to pay.");
      return;
    }
    setStep(4);
  };

  // Step 4: Payment Form Validation
  const validateForm = () => {
    const { pendingAmount } = calculatePaymentDetails();

    if (!formData.transactionId.trim()) {
      setError("Transaction ID is required");
      return false;
    }
    if (!formData.paidAmount || parseFloat(formData.paidAmount) <= 0) {
      setError("Please enter a valid paid amount");
      return false;
    }
    if (parseFloat(formData.paidAmount) > pendingAmount) {
      setError(`Payment amount cannot exceed pending amount (₹${pendingAmount.toLocaleString("en-IN")})`);
      return false;
    }
    if (!formData.paymentDate) {
      setError("Payment date is required");
      return false;
    }
    const paymentDate = new Date(formData.paymentDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (paymentDate > today) {
      setError("Payment date cannot be in the future");
      return false;
    }
    if (!screenshot) {
      setError("Please upload a payment screenshot");
      return false;
    }
    return true;
  };

  // Step 4: Payment Form Submission
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Calculate total amount paid (existing + new payment)
      const newPaymentAmount = parseFloat(formData.paidAmount);
      const existingAmountPaid = parseFloat(candidateData.amountPaid || 0);
      const totalAmountPaid = existingAmountPaid + newPaymentAmount;

      // Check if we have registration ID - if not, cannot update
      if (!candidateData._id) {
        throw new Error("Registration ID not found. Cannot update payment.");
      }

      // Step 1: Update existing registration using PUT endpoint
      // This updates the existing record instead of creating a new one
      // Backend PUT endpoint now supports: amountPaid, transactionId, dateOfPayment, registrationStatus
      // It will append new transaction to transactions array and recalculate amountPaid
      const updatePayload = {
        // Fields explicitly supported by backend PUT endpoint
        name: candidateData.name || candidateData.fullName || "",
        // Payment update fields (now supported by backend)
        amountPaid: totalAmountPaid,
        transactionId: formData.transactionId,
        dateOfPayment: formData.paymentDate,
        // Preserve registration status to prevent re-approval
        registrationStatus: candidateData.registrationStatus || "approved",
      };

      // Step 2: Update existing registration using PUT endpoint
      const res = await fetch(API_ENDPOINTS.REGISTRATION_UPDATE(candidateData._id), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatePayload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Payment update failed");
      }

      // Step 3: If payment update succeeds, upload screenshot separately
      if (screenshot && candidateData._id) {
        try {
          const screenshotForm = new FormData();
          screenshotForm.append("paymentScreenshot", screenshot);
          
          const screenshotRes = await fetch(API_ENDPOINTS.REGISTRATION_SCREENSHOT(candidateData._id), {
            method: "POST",
            body: screenshotForm,
          });

          const screenshotData = await screenshotRes.json();
          
          if (!screenshotRes.ok) {
            // Payment update succeeded but screenshot upload failed - show warning
            toast.warning("Payment updated successfully, but screenshot upload failed. Please contact support.");
            console.error("Screenshot upload error:", screenshotData);
          } else {
            toast.success("Payment and screenshot submitted successfully!");
          }
        } catch (screenshotErr) {
          // Payment update succeeded but screenshot upload failed - show warning
          toast.warning("Payment updated successfully, but screenshot upload failed. Please contact support.");
          console.error("Screenshot upload error:", screenshotErr);
        }
      } else {
        toast.success("Payment updated successfully!");
      }
      
      // Navigate to success or refresh candidate data
      setTimeout(() => {
        navigate("/", { state: { message: "Payment submitted successfully!" } });
      }, 2000);
    } catch (err) {
      setError(err.message || "An error occurred while submitting payment. Please try again.");
      toast.error(err.message || "Payment submission failed");
      console.error("Payment submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleFileChange = (e) => {
    setScreenshot(e.target.files[0]);
    setError("");
  };

  const { totalAmount, amountPaid, pendingAmount } = calculatePaymentDetails();

  return (
    <div className="container min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div className="row w-100" style={{ maxWidth: "800px" }}>
        <div className="col-12">
          <div className="card shadow-lg">
            <div className="card-header bg-primary text-white text-center">
              <img
                src={logo}
                alt="logo"
                className="mb-2"
                style={{ width: "80px" }}
              />
              <h4 className="mb-0 fw-bold">Pay Pending Amount</h4>
            </div>
            <div className="card-body p-4">
              {/* Step 1: Region Selection */}
              {step === 1 && (
                <div>
                  <h5 className="mb-4 text-center">Step 1: Select Your Region</h5>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Select Region</label>
                    <select
                      className="form-select form-select-lg"
                      value={selectedRegion}
                      onChange={(e) => {
                        setSelectedRegion(e.target.value);
                        setError("");
                      }}
                    >
                      <option value="">-- Choose Region --</option>
                      <option value="West Rayalaseema">West Rayalaseema</option>
                      <option value="East Rayalaseema">East Rayalaseema</option>
                    </select>
                  </div>
                  {error && <div className="alert alert-danger">{error}</div>}
                  <div className="d-grid gap-2">
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handleRegionSelect}
                      disabled={!selectedRegion}
                    >
                      Continue
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => navigate("/")}
                    >
                      Back to Home
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: SPICON ID Validation */}
              {step === 2 && (
                <div>
                  <h5 className="mb-4 text-center">Step 2: Enter Your SPICON ID</h5>
                  <div className="mb-3">
                    <label className="form-label fw-bold">SPICON ID</label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="Enter your SPICON ID"
                      value={spiconId}
                      onChange={(e) => {
                        setSpiconId(e.target.value);
                        setError("");
                      }}
                      disabled={loading}
                    />
                    <small className="text-muted">Selected Region: <strong>{selectedRegion}</strong></small>
                  </div>
                  {error && <div className="alert alert-danger">{error}</div>}
                  <div className="d-grid gap-2">
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handleValidateSpicon}
                      disabled={loading || !spiconId.trim()}
                    >
                      {loading ? "Validating..." : "Validate SPICON ID"}
                    </button>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setStep(1);
                        setSpiconId("");
                        setError("");
                      }}
                      disabled={loading}
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Payment Details Display */}
              {step === 3 && candidateData && (
                <div>
                  <h5 className="mb-4 text-center">Step 3: Payment Details</h5>
                  
                  {/* User Information Card */}
                  <div className="card mb-3 border-primary">
                    <div className="card-header bg-primary text-white">
                      <h6 className="mb-0 fw-bold">User Information</h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6 mb-2">
                          <strong>Name:</strong> {candidateData.name || candidateData.fullName || "N/A"}
                        </div>
                        <div className="col-md-6 mb-2">
                          <strong>Gender:</strong> {candidateData.gender || "N/A"}
                        </div>
                        <div className="col-md-6 mb-2">
                          <strong>SPICON ID:</strong> {candidateData.uniqueId || "N/A"}
                        </div>
                        <div className="col-md-6 mb-2">
                          <strong>Place:</strong> {candidateData.iceuEgf || "N/A"}
                        </div>
                        <div className="col-md-6 mb-2">
                          <strong>Category:</strong> {candidateData.groupType || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Summary Card */}
                  <div className="card mb-3 border-warning">
                    <div className="card-header bg-warning text-dark">
                      <h6 className="mb-0 fw-bold">Payment Summary</h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-4 mb-2">
                          <strong>Total Amount:</strong> ₹{totalAmount.toLocaleString("en-IN")}
                        </div>
                        <div className="col-md-4 mb-2">
                          <strong>Amount Paid:</strong> ₹{amountPaid.toLocaleString("en-IN")}
                        </div>
                        <div className="col-md-4 mb-2">
                          <strong className="text-danger">Pending Amount:</strong>{" "}
                          <span className="text-danger fw-bold fs-5">
                            ₹{pendingAmount.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                      {pendingAmount <= 0 && (
                        <div className="alert alert-success mt-3 mb-0">
                          <strong>✓ All payments completed!</strong> You have no pending amount.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* QR Codes & Account Details */}
                  {pendingAmount > 0 && (
                    <div className="card mb-3">
                      <div className="card-header bg-primary text-white">
                        <h6 className="mb-0 fw-bold">Account Details ({selectedRegion})</h6>
                      </div>
                      <div className="card-body">
                        {selectedRegion === "East Rayalaseema" ? (
                          <div className="p-3" style={{ background: "#f8f9fa", borderRadius: "5px" }}>
                            <p className="mb-2">
                              <strong>Account Holder Name:</strong> Janga Sumalatha
                            </p>
                            <p className="mb-2">
                              <strong>Account No:</strong> 62112258352
                            </p>
                            <p className="mb-2">
                              <strong>IFSC Code:</strong> SBIN0021040
                            </p>
                            <p className="mb-2">
                              <strong>Branch Name:</strong> SBI-NAIDUPET
                            </p>
                            <p className="mb-2">
                              <strong>Phone Pay Number:</strong> 9885108525
                            </p>
                            <div className="text-center mt-3">
                              <img
                                src={EastRayaUPI}
                                alt="UPI Scanner"
                                style={{ width: "200px", borderRadius: "10px" }}
                              />
                              <p className="mt-2">Scan this UPI QR to make the payment</p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3" style={{ background: "#f8f9fa", borderRadius: "5px" }}>
                            <p className="mb-2">
                              <strong>Account Holder Name:</strong> Mr. Jagatap Jagan
                            </p>
                            <p className="mb-2">
                              <strong>Account No:</strong> 44676705721
                            </p>
                            <p className="mb-2">
                              <strong>IFSC Code:</strong> SBIN0012674
                            </p>
                            <p className="mb-2">
                              <strong>UPI ID:</strong> 7396541571-3@ybl
                            </p>
                            <p className="mb-2">
                              <strong>PhonePe / Google Pay Number:</strong>
                              <br /> 73965 41571
                            </p>
                            <div className="row justify-content-center align-items-center mt-3 gx-4">
                              <div className="col-6 col-sm-4 col-md-3 text-center">
                                <img
                                  src={WestGooglePayQR}
                                  alt="Google Pay QR"
                                  style={{
                                    maxWidth: "150px",
                                    width: "100%",
                                    height: "auto",
                                    objectFit: "contain",
                                  }}
                                />
                                <p className="text-center mt-2 fw-bold">Google Pay</p>
                              </div>
                              <div className="col-6 col-sm-4 col-md-3 text-center">
                                <img
                                  src={WestPhonePayQR}
                                  alt="PhonePe QR"
                                  style={{
                                    maxWidth: "150px",
                                    width: "100%",
                                    height: "auto",
                                    objectFit: "contain",
                                  }}
                                />
                                <p className="text-center mt-2 fw-bold">PhonePe</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="d-grid gap-2">
                    {pendingAmount > 0 ? (
                      <button
                        className="btn btn-primary btn-lg"
                        onClick={handleProceedToPayment}
                      >
                        Proceed to Payment
                      </button>
                    ) : null}
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setStep(2);
                        setSpiconId("");
                        setCandidateData(null);
                        setValidated(false);
                      }}
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Payment Form */}
              {step === 4 && (
                <div>
                  <h5 className="mb-4 text-center">Step 4: Submit Payment</h5>
                  
                  {/* Payment Summary Reminder */}
                  <div className="alert alert-info mb-3">
                    <strong>Pending Amount:</strong> ₹{pendingAmount.toLocaleString("en-IN")}
                  </div>

                  <form onSubmit={handlePaymentSubmit}>
                    <div className="mb-3">
                      <label className="form-label fw-bold">Payment Date <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="form-control"
                        name="paymentDate"
                        value={formData.paymentDate}
                        onChange={handleChange}
                        max={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-bold">Transaction ID <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        name="transactionId"
                        value={formData.transactionId}
                        onChange={handleChange}
                        placeholder="Enter transaction ID"
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-bold">
                        Amount Paid <span className="text-danger">*</span>
                        <small className="text-muted ms-2">(Max: ₹{pendingAmount.toLocaleString("en-IN")})</small>
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        name="paidAmount"
                        value={formData.paidAmount}
                        onChange={handleChange}
                        placeholder="Enter amount paid"
                        min="1"
                        max={pendingAmount}
                        step="0.01"
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-bold">Upload Payment Screenshot <span className="text-danger">*</span></label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        required
                      />
                      {screenshot && (
                        <small className="text-muted">Selected: {screenshot.name}</small>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-bold">Remarks (Optional)</label>
                      <textarea
                        className="form-control"
                        name="remarks"
                        value={formData.remarks}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Any additional notes..."
                      />
                    </div>

                    {error && <div className="alert alert-danger">{error}</div>}

                    <div className="d-grid gap-2">
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={loading}
                      >
                        {loading ? "Submitting..." : "Submit Payment"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setStep(3)}
                        disabled={loading}
                      >
                        Back
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

