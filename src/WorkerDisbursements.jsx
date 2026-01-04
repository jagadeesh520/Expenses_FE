import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_ENDPOINTS } from "./constants";

// Pricing function (same as TreasurerSummary)
const getTotalAmount = (region, groupType, maritalStatus, spouseAttending) => {
  const regionLower = (region || "").toLowerCase();
  const groupTypeLower = (groupType || "").toLowerCase();

  if (regionLower.includes("west")) {
    if (groupTypeLower.includes("family")) return 2500;
    if (groupTypeLower.includes("employed") && !groupTypeLower.includes("unemployed")) return 1300;
    if (groupTypeLower.includes("unemployed") || groupTypeLower.includes("students")) return 500;
    if (groupTypeLower.includes("children") || groupTypeLower.includes("15+")) return 500;
    if (groupTypeLower.includes("volunteer")) return 250;
  }
  
  if (regionLower.includes("east")) {
    if (groupTypeLower.includes("family")) {
      if (spouseAttending && spouseAttending.toLowerCase().includes("yes")) return 2500;
      return 2000;
    }
    if (groupTypeLower.includes("employed") && !groupTypeLower.includes("unemployed")) return 1300;
    if (groupTypeLower.includes("unemployed") || groupTypeLower.includes("students")) return 500;
    if (groupTypeLower.includes("children") || groupTypeLower.includes("15+")) return 500;
    if (groupTypeLower.includes("volunteer")) return 200;
  }

  return 0;
};

// Use description pattern to identify worker disbursements in payment requests
// We use "coordinator" as requesterRole (valid backend role) and identify disbursements by description pattern
const DISBURSEMENT_DESCRIPTION_PREFIX = "Payment Method:"; // Pattern to identify disbursements

export default function WorkerDisbursements() {
  const navigate = useNavigate();
  const location = useLocation();
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalAmount: 0,
    totalCollected: 0,
    totalSentToWorkers: 0,
    balance: 0,
  });
  const [disbursements, setDisbursements] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    amountSentTo: "",
    howAmountWasSent: "",
    amountSent: "",
    paymentProof: null,
  });

  useEffect(() => {
    const regionFromState = location.state?.region;
    const regionFromStorage = localStorage.getItem("treasurerSelectedRegion");
    const selectedRegion = regionFromState || regionFromStorage;
    
    if (!selectedRegion) {
      navigate("/treasurer/region-selection");
      return;
    }
    
    setRegion(selectedRegion);
    loadData(selectedRegion);
  }, [location, navigate]);

  const loadData = async (selectedRegion) => {
    setLoading(true);
    try {
      // Fetch registrations for the region
      const res = await fetch(API_ENDPOINTS.REGISTRATIONS);
      const result = await res.json();
      
      if (result.success) {
        let registrations = result.data || [];
        
        // Filter by region
        registrations = registrations.filter((item) => {
          const itemRegion = (item.region || "").trim();
          return itemRegion === selectedRegion;
        });

        // Remove duplicates based on transactionId
        const seenTransactionIds = new Set();
        const uniqueRegistrations = registrations.filter((reg) => {
          const txId = reg.transactionId?.trim();
          if (!txId) return true;
          if (seenTransactionIds.has(txId)) return false;
          seenTransactionIds.add(txId);
          return true;
        });

        // Calculate totals
        const totalAmount = uniqueRegistrations.reduce((sum, reg) => {
          return sum + getTotalAmount(
            reg.region,
            reg.groupType,
            reg.maritalStatus,
            reg.spouseAttending
          );
        }, 0);

        const totalCollected = uniqueRegistrations.reduce(
          (sum, reg) => sum + (Number(reg.amountPaid) || 0),
          0
        );

        // Load worker disbursements from payment requests API
        // Filter by description pattern to get only disbursements
        const disbursementsRes = await fetch(API_ENDPOINTS.PAYMENT_REQUESTS);
        const disbursementsResult = await disbursementsRes.json();
        
        let totalSentToWorkers = 0;
        let mappedDisbursements = [];
        
        if (disbursementsResult.success) {
          // Filter payment requests to get only worker disbursements
          // Identify disbursements by checking if description contains "Payment Method:" pattern
          const allDisbursements = (disbursementsResult.data || []).filter(
            (req) => {
              const matchesRegion = req.region === selectedRegion;
              const isDisbursement = req.description && req.description.includes(DISBURSEMENT_DESCRIPTION_PREFIX);
              return matchesRegion && isDisbursement;
            }
          );
          
          // Map payment request fields to disbursement format
          mappedDisbursements = allDisbursements.map((req) => {
            // Extract payment method from description (format: "Sent To: ...\nPayment Method: ...")
            let howAmountWasSent = "";
            if (req.description) {
              const methodMatch = req.description.match(/Payment Method:\s*(.+)/i);
              if (methodMatch) {
                howAmountWasSent = methodMatch[1].trim();
              } else {
                // Fallback: use description as-is if format doesn't match
                howAmountWasSent = req.description;
              }
            }
            
            return {
              id: req._id,
              region: req.region,
              amountSentTo: req.title || "",
              howAmountWasSent: howAmountWasSent,
              amountSent: Number(req.requestedAmount) || 0,
              paymentProof: req.requestImages && req.requestImages.length > 0 ? req.requestImages[0] : null,
              paymentProofImages: req.requestImages || [], // Array of all images
              createdAt: req.createdAt,
            };
          });
          
          setDisbursements(mappedDisbursements);

          totalSentToWorkers = mappedDisbursements.reduce(
            (sum, d) => sum + (Number(d.amountSent) || 0),
            0
          );
        }

        const balance = totalCollected - totalSentToWorkers;

        setSummary({
          totalAmount,
          totalCollected,
          totalSentToWorkers,
          balance,
        });
      }
    } catch (err) {
      console.error("Error loading data:", err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, paymentProof: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.amountSentTo.trim()) {
      toast.error("Please enter 'Amount Sent To'");
      return;
    }
    if (!formData.howAmountWasSent.trim()) {
      toast.error("Please select 'How Amount Was Sent'");
      return;
    }
    if (!formData.amountSent || Number(formData.amountSent) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!formData.paymentProof) {
      toast.error("Please upload payment proof");
      return;
    }

    try {
      // Map worker disbursement fields to payment request API format
      const formDataToSend = new FormData();
      
      // Get user ID from localStorage - check multiple sources
      // The backend requires a valid MongoDB ObjectId for requestedBy
      let requestedBy = null;
      
      // #region agent log
      const availableStorageKeys = ['treasurerData', 'adminData', 'registrarData', 'coordinatorData', 'lacConvenerData'];
      const storageData = {};
      availableStorageKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            storageData[key] = JSON.parse(value);
          } catch (e) {
            storageData[key] = 'parse_error';
          }
        }
      });
      fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkerDisbursements.jsx:handleSubmit-userLookup',message:'Checking localStorage for user data',data:{storageData:storageData},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      // Try treasurerData first
      const treasurerData = localStorage.getItem("treasurerData");
      if (treasurerData) {
        try {
          const treasurer = JSON.parse(treasurerData);
          requestedBy = treasurer._id || treasurer.id;
        } catch (e) {
          console.error("Error parsing treasurer data:", e);
        }
      }
      
      // If no treasurer data, try adminData (treasurer might be logged in as admin)
      if (!requestedBy) {
        const adminData = localStorage.getItem("adminData");
        if (adminData) {
          try {
            const admin = JSON.parse(adminData);
            requestedBy = admin._id || admin.id;
          } catch (e) {
            console.error("Error parsing admin data:", e);
          }
        }
      }
      
      // If still no valid ID, try registrarData
      if (!requestedBy) {
        const registrarData = localStorage.getItem("registrarData");
        if (registrarData) {
          try {
            const registrar = JSON.parse(registrarData);
            requestedBy = registrar._id || registrar.id;
          } catch (e) {
            console.error("Error parsing registrar data:", e);
          }
        }
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkerDisbursements.jsx:handleSubmit-userLookup-result',message:'User ID lookup result',data:{requestedBy:requestedBy,hasValidId:!!requestedBy},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      // If no valid user ID found, show error
      if (!requestedBy) {
        toast.error("User authentication required. Please log in.");
        setLoading(false);
        return;
      }
      
      // Map fields to payment request format
      formDataToSend.append("requestedBy", requestedBy);
      formDataToSend.append("title", formData.amountSentTo.trim()); // Worker name/group/purpose
      formDataToSend.append("description", `Sent To: ${formData.amountSentTo.trim()}\nPayment Method: ${formData.howAmountWasSent}`); // Include both recipient and method (pattern identifies disbursements)
      formDataToSend.append("requestedAmount", formData.amountSent);
      formDataToSend.append("region", region);
      formDataToSend.append("requesterRole", "coordinator"); // Use valid backend role (disbursements identified by description pattern)
      
      // Add payment proof file
      formDataToSend.append("requestImages", formData.paymentProof);

      // #region agent log
      const formDataEntries = [];
      for (let pair of formDataToSend.entries()) {
        if (pair[1] instanceof File) {
          formDataEntries.push({ key: pair[0], value: `[File: ${pair[1].name}, size: ${pair[1].size}]` });
        } else {
          formDataEntries.push({ key: pair[0], value: pair[1] });
        }
      }
      fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkerDisbursements.jsx:handleSubmit-beforeFetch',message:'FormData before API call',data:{formDataEntries:formDataEntries,apiEndpoint:API_ENDPOINTS.PAYMENT_REQUEST},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      // Submit to payment request API
      const res = await fetch(API_ENDPOINTS.PAYMENT_REQUEST, {
        method: "POST",
        body: formDataToSend,
      });

      let result;
      try {
        result = await res.json();
      } catch (parseError) {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkerDisbursements.jsx:handleSubmit-parseError',message:'Failed to parse JSON response',data:{status:res.status,statusText:res.statusText,parseError:parseError?.toString()},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        toast.error("Server returned invalid response");
        setLoading(false);
        return;
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkerDisbursements.jsx:handleSubmit-response',message:'API response received',data:{status:res.status,statusText:res.statusText,ok:res.ok,success:result?.success,error:result?.error,message:result?.message,resultData:result},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      if (res.ok && result?.success) {
        toast.success("Worker disbursement recorded successfully!");
        
        // Reset form
        setFormData({
          amountSentTo: "",
          howAmountWasSent: "",
          amountSent: "",
          paymentProof: null,
        });
        
        // Reset file input
        const fileInput = document.getElementById("paymentProof");
        if (fileInput) {
          fileInput.value = "";
        }
        
        // Reload data to update summary
        loadData(region);
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'WorkerDisbursements.jsx:handleSubmit-error',message:'API request failed',data:{status:res.status,errorMessage:result?.error || result?.message || 'Unknown error',fullResult:result},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        toast.error(result?.error || result?.message || "Failed to record disbursement");
      }
    } catch (error) {
      console.error("Error submitting disbursement:", error);
      toast.error("Server error. Please try again.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="container-fluid mt-3" style={{ minHeight: "100vh", paddingBottom: "20px" }}>
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="fw-bold">
          Worker Disbursements
          {region && <span className="text-primary ms-2">({region})</span>}
        </h4>
        <div className="d-flex gap-2">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate("/treasurer/dashboard")}
          >
            <i className="bi bi-arrow-left me-1"></i>Back to Dashboard
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => {
              localStorage.removeItem("treasurerToken");
              localStorage.removeItem("treasurerData");
              localStorage.removeItem("adminToken");
              localStorage.removeItem("adminData");
              navigate("/");
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading data...</p>
        </div>
      ) : (
        <>
          {/* Summary Section */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card shadow-lg">
                <div className="card-header bg-info text-white">
                  <h5 className="mb-0 fw-bold">
                    <i className="bi bi-calculator me-2"></i>Financial Summary
                  </h5>
                </div>
                <div className="card-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6 col-lg-3">
                      <div className="text-center p-3 border rounded">
                        <h6 className="text-muted mb-2">Total Amount</h6>
                        <h4 className="fw-bold text-primary">₹{Number(summary.totalAmount).toLocaleString()}</h4>
                      </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-3">
                      <div className="text-center p-3 border rounded">
                        <h6 className="text-muted mb-2">Total Collected</h6>
                        <h4 className="fw-bold text-success">₹{Number(summary.totalCollected).toLocaleString()}</h4>
                      </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-3">
                      <div className="text-center p-3 border rounded">
                        <h6 className="text-muted mb-2">Total Sent to Workers</h6>
                        <h4 className="fw-bold text-warning">₹{Number(summary.totalSentToWorkers).toLocaleString()}</h4>
                      </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-3">
                      <div className="text-center p-3 border rounded">
                        <h6 className="text-muted mb-2">Balance</h6>
                        <h4 className={`fw-bold ${summary.balance >= 0 ? "text-success" : "text-danger"}`}>
                          ₹{Number(summary.balance).toLocaleString()}
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Worker Payment Entry Form */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card shadow-lg">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0 fw-bold">
                    <i className="bi bi-plus-circle me-2"></i>Add Worker Disbursement
                  </h5>
                </div>
                <div className="card-body p-4">
                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label htmlFor="amountSentTo" className="form-label fw-bold">
                          Amount Sent To <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="amountSentTo"
                          name="amountSentTo"
                          value={formData.amountSentTo}
                          onChange={handleInputChange}
                          placeholder="Worker name / Worker group / Purpose"
                          required
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label htmlFor="howAmountWasSent" className="form-label fw-bold">
                          How Amount Was Sent <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-select"
                          id="howAmountWasSent"
                          name="howAmountWasSent"
                          value={formData.howAmountWasSent}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">-- Select Method --</option>
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="col-12 col-md-6">
                        <label htmlFor="amountSent" className="form-label fw-bold">
                          Amount Sent (₹) <span className="text-danger">*</span>
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          id="amountSent"
                          name="amountSent"
                          value={formData.amountSent}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label htmlFor="paymentProof" className="form-label fw-bold">
                          Upload Payment Proof <span className="text-danger">*</span>
                        </label>
                        <input
                          type="file"
                          className="form-control"
                          id="paymentProof"
                          name="paymentProof"
                          onChange={handleFileChange}
                          accept="image/*,.pdf"
                          required
                        />
                        <small className="text-muted">Accepted: Images or PDF files</small>
                      </div>

                      <div className="col-12">
                        <button
                          type="submit"
                          className="btn btn-primary btn-lg"
                          disabled={
                            !formData.amountSentTo.trim() ||
                            !formData.howAmountWasSent ||
                            !formData.amountSent ||
                            !formData.paymentProof
                          }
                        >
                          <i className="bi bi-check-circle me-2"></i>Submit
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Disbursements History Table */}
          {disbursements.length > 0 && (
            <div className="row">
              <div className="col-12">
                <div className="card shadow-lg">
                  <div className="card-header bg-secondary text-white">
                    <h5 className="mb-0 fw-bold">
                      <i className="bi bi-clock-history me-2"></i>Disbursement History
                    </h5>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-bordered table-striped align-middle mb-0">
                        <thead className="table-dark">
                          <tr>
                            <th>S.No</th>
                            <th>Date</th>
                            <th>Amount Sent To</th>
                            <th>Method</th>
                            <th>Amount (₹)</th>
                            <th>Payment Proof</th>
                          </tr>
                        </thead>
                        <tbody>
                          {disbursements.map((disbursement, index) => (
                            <tr key={disbursement.id}>
                              <td>{index + 1}</td>
                              <td>{formatDate(disbursement.createdAt)}</td>
                              <td>{disbursement.amountSentTo}</td>
                              <td>{disbursement.howAmountWasSent}</td>
                              <td className="fw-bold">₹{Number(disbursement.amountSent).toLocaleString()}</td>
                              <td>
                                {disbursement.paymentProof ? (
                                  <a
                                    href={`${API_ENDPOINTS.UPLOADS}/${encodeURIComponent(disbursement.paymentProof)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-info"
                                  >
                                    <i className="bi bi-file-earmark-image me-1"></i>View
                                  </a>
                                ) : disbursement.paymentProofImages && disbursement.paymentProofImages.length > 0 ? (
                                  <a
                                    href={`${API_ENDPOINTS.UPLOADS}/${encodeURIComponent(disbursement.paymentProofImages[0])}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-info"
                                  >
                                    <i className="bi bi-file-earmark-image me-1"></i>View
                                  </a>
                                ) : (
                                  <span className="text-muted">No proof</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

