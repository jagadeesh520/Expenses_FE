import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_ENDPOINTS } from "./constants";
import { getTotalAmount } from "./utils/pricingUtils";

export default function PaymentValidationTransactionValidation() {
  const navigate = useNavigate();
  const location = useLocation();
  const region = location.state?.region || "West Rayalaseema";

  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validatedPayments, setValidatedPayments] = useState([]);
  const [nonValidatedPayments, setNonValidatedPayments] = useState([]);
  const [validationCompleted, setValidationCompleted] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setValidationCompleted(false);
      setValidatedPayments([]);
      setNonValidatedPayments([]);
    } else {
      toast.error("Please select a valid PDF file");
      setPdfFile(null);
    }
  };

  const handleValidate = async () => {
    if (!pdfFile) {
      toast.error("Please select a PDF file first");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("pdf", pdfFile);
      formData.append("region", region);

      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'PaymentValidationTransactionValidation.jsx:handleValidate',
          message: 'Validation request started',
          data: { 
            region: region,
            pdfFileName: pdfFile.name,
            pdfFileSize: pdfFile.size,
            endpoint: API_ENDPOINTS.VALIDATE_PAYMENTS
          },
          timestamp: Date.now(),
          sessionId: 'payment-validation',
          runId: 'run1',
          hypothesisId: 'A'
        })
      }).catch(() => {});
      // #endregion

      const res = await fetch(API_ENDPOINTS.VALIDATE_PAYMENTS, {
        method: "POST",
        body: formData,
      });

      // #region agent log
      const responseText = await res.text();
      fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'PaymentValidationTransactionValidation.jsx:handleValidate',
          message: 'Response received from server',
          data: { 
            status: res.status,
            statusText: res.statusText,
            contentType: res.headers.get('content-type'),
            responsePreview: responseText.substring(0, 200),
            isJSON: responseText.trim().startsWith('{') || responseText.trim().startsWith('[')
          },
          timestamp: Date.now(),
          sessionId: 'payment-validation',
          runId: 'run1',
          hypothesisId: 'A'
        })
      }).catch(() => {});
      // #endregion

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'PaymentValidationTransactionValidation.jsx:handleValidate',
            message: 'JSON parse error',
            data: { 
              error: parseError.message,
              responsePreview: responseText.substring(0, 500),
              status: res.status
            },
            timestamp: Date.now(),
            sessionId: 'payment-validation',
            runId: 'run1',
            hypothesisId: 'A'
          })
        }).catch(() => {});
        // #endregion

        throw new Error(`Server returned invalid JSON. Status: ${res.status}. The endpoint may not exist or returned an error page.`);
      }

      if (res.ok && result.success) {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'PaymentValidationTransactionValidation.jsx:handleValidate',
            message: 'Validation successful',
            data: { 
              validatedCount: result.data?.validated?.length || 0,
              nonValidatedCount: result.data?.nonValidated?.length || 0
            },
            timestamp: Date.now(),
            sessionId: 'payment-validation',
            runId: 'run1',
            hypothesisId: 'A'
          })
        }).catch(() => {});
        // #endregion

        setValidatedPayments(result.data.validated || []);
        setNonValidatedPayments(result.data.nonValidated || []);
        setValidationCompleted(true);
        toast.success("Payment validation completed!");
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'PaymentValidationTransactionValidation.jsx:handleValidate',
            message: 'Validation failed with error response',
            data: { 
              status: res.status,
              error: result.error,
              result: result
            },
            timestamp: Date.now(),
            sessionId: 'payment-validation',
            runId: 'run1',
            hypothesisId: 'A'
          })
        }).catch(() => {});
        // #endregion

        toast.error(result.error || "Validation failed");
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'PaymentValidationTransactionValidation.jsx:handleValidate',
          message: 'Validation error caught',
          data: { 
            errorMessage: error.message,
            errorStack: error.stack,
            errorName: error.name
          },
          timestamp: Date.now(),
          sessionId: 'payment-validation',
          runId: 'run1',
          hypothesisId: 'A'
        })
      }).catch(() => {});
      // #endregion

      console.error("Validation error:", error);
      toast.error(error.message || "Failed to validate payments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Group validated payments by category (reusing logic from PaymentSummary)
  const categorySummary = validatedPayments.reduce((acc, item) => {
    const category = item.groupType || "Other";
    const totalAmount = getTotalAmount(
      region,
      item.groupType,
      item.maritalStatus,
      item.spouseAttending
    );
    const amountPaid = Number(item.amountPaid) || 0;
    const balance = Math.max(0, totalAmount - amountPaid);

    if (!acc[category]) {
      acc[category] = {
        category,
        items: [],
        totalAmount: 0,
        totalPaid: 0,
        totalBalance: 0,
        count: 0,
      };
    }

    acc[category].items.push({
      ...item,
      totalAmount,
      balance,
    });
    acc[category].totalAmount += totalAmount;
    acc[category].totalPaid += amountPaid;
    acc[category].totalBalance += balance;
    acc[category].count += 1;

    return acc;
  }, {});

  const categoryList = Object.values(categorySummary);

  return (
    <div className="container-fluid mt-3" style={{ minHeight: "100vh", paddingBottom: "20px" }}>
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold">
            Payment Validation - {region}
          </h4>
          <p className="text-muted small mb-0">Upload PhonePe transaction history PDF to validate payments</p>
        </div>
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate("/payment-validation-region")}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Change Region
        </button>
      </div>

      {/* PDF Upload Section */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title mb-3">
            <i className="bi bi-file-earmark-pdf me-2"></i>
            Upload PhonePe Transaction History PDF
          </h5>
          
          <div className="mb-3">
            <label htmlFor="pdfFile" className="form-label">
              Select PDF File
            </label>
            <input
              type="file"
              className="form-control"
              id="pdfFile"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={loading}
            />
            {pdfFile && (
              <div className="mt-2 text-success">
                <i className="bi bi-check-circle me-2"></i>
                Selected: {pdfFile.name}
              </div>
            )}
          </div>

          <button
            className="btn btn-primary"
            onClick={handleValidate}
            disabled={!pdfFile || loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Validating...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Validate Payments
              </>
            )}
          </button>
        </div>
      </div>

      {/* Validated Payments Section */}
      {validationCompleted && validatedPayments.length > 0 && (
        <div className="card mb-4">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">
              <i className="bi bi-check-circle-fill me-2"></i>
              Validated Payments ({validatedPayments.length})
            </h5>
          </div>
          <div className="card-body">
            {/* Category Summary Table */}
            <div className="mb-4">
              <h6 className="fw-bold mb-3">Category-wise Summary</h6>
              <div className="table-responsive">
                <table className="table table-bordered table-striped align-middle text-center table-sm">
                  <thead className="table-primary">
                    <tr>
                      <th>S.No</th>
                      <th>Category</th>
                      <th>Count</th>
                      <th>Total Amount</th>
                      <th>Amount Paid</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryList.map((cat, index) => (
                      <tr key={cat.category}>
                        <td>{index + 1}</td>
                        <td className="text-start">{cat.category}</td>
                        <td>{cat.count}</td>
                        <td>₹{cat.totalAmount.toLocaleString()}</td>
                        <td className="text-success fw-bold">₹{cat.totalPaid.toLocaleString()}</td>
                        <td className="text-warning fw-bold">₹{cat.totalBalance.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Category Tables */}
            <div className="mt-4">
              <h6 className="fw-bold mb-3">Detailed Payment Breakdown by Category</h6>
              {categoryList.map((cat) => (
                <div key={cat.category} className="mb-4">
                  <h6 className="text-primary mb-2">
                    {cat.category} - {cat.count} record(s)
                  </h6>
                  <div className="table-responsive">
                    <table className="table table-bordered table-striped align-middle text-center table-sm">
                      <thead className="table-secondary">
                        <tr>
                          <th>S.No</th>
                          <th>Name</th>
                          <th>User ID</th>
                          <th>Category</th>
                          <th>Total Amount</th>
                          <th>Amount Paid</th>
                          <th>Balance Amount</th>
                          <th>Payment Validated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cat.items.map((item, idx) => (
                          <tr key={item._id || idx}>
                            <td>{idx + 1}</td>
                            <td className="text-start">{item.name || item.fullName || "-"}</td>
                            <td className="fw-bold text-primary">{item.uniqueId || "-"}</td>
                            <td><span className="badge bg-info">{item.groupType || "-"}</span></td>
                            <td>₹{item.totalAmount.toLocaleString()}</td>
                            <td className="text-success fw-bold">₹{item.amountPaid.toLocaleString()}</td>
                            <td className="text-warning fw-bold">₹{item.balance.toLocaleString()}</td>
                            <td>
                              <span className="badge bg-success">
                                <i className="bi bi-check-circle-fill me-1"></i>
                                ✓ Validated
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Non-Validated Payments Section */}
      {validationCompleted && nonValidatedPayments.length > 0 && (
        <div className="card mb-4">
          <div className="card-header bg-danger text-white">
            <h5 className="mb-0">
              <i className="bi bi-x-circle-fill me-2"></i>
              Not Validated Payments ({nonValidatedPayments.length})
            </h5>
          </div>
          <div className="card-body">
            <p className="text-muted">
              The following payments could not be validated. Please review the details below.
            </p>
            <div className="table-responsive" style={{ 
              overflowY: "auto", 
              overflowX: "auto",
              maxHeight: "70vh",
              border: "1px solid #dee2e6",
              borderRadius: "0.375rem"
            }}>
              <table className="table table-bordered table-striped align-middle text-center table-sm mb-0" style={{ minWidth: "2000px" }}>
                <thead className="table-dark" style={{ position: "sticky", top: 0, zIndex: 10 }}>
                  <tr>
                    <th style={{ minWidth: "50px" }}>S.No</th>
                    <th style={{ minWidth: "120px" }}>Reg ID</th>
                    <th style={{ minWidth: "100px" }}>Region</th>
                    <th style={{ minWidth: "80px" }}>Title</th>
                    <th style={{ minWidth: "150px" }}>Full Name</th>
                    <th style={{ minWidth: "100px" }}>Gender</th>
                    <th style={{ minWidth: "60px" }}>Age</th>
                    <th style={{ minWidth: "180px" }}>Email</th>
                    <th style={{ minWidth: "120px" }}>Mobile</th>
                    <th style={{ minWidth: "120px" }}>District</th>
                    <th style={{ minWidth: "120px" }}>ICEF/EGF</th>
                    <th style={{ minWidth: "120px" }}>Group Type</th>
                    <th style={{ minWidth: "150px" }}>Entered Transaction ID</th>
                    <th style={{ minWidth: "120px" }}>Entered Amount</th>
                    <th style={{ minWidth: "120px" }}>Payment Screenshot</th>
                    <th style={{ minWidth: "200px" }}>Validation Failure Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {nonValidatedPayments.map((item, i) => (
                    <tr key={item._id || i}>
                      <td>{i + 1}</td>
                      <td className="fw-bold text-primary">{item.uniqueId || "-"}</td>
                      <td>{item.region || "-"}</td>
                      <td>{item.title || "-"}</td>
                      <td className="text-start">{item.name || item.fullName || "-"}</td>
                      <td>{item.gender || "-"}</td>
                      <td>{item.age || "-"}</td>
                      <td className="text-break text-start">{item.email || "-"}</td>
                      <td>{item.mobile || "-"}</td>
                      <td>{item.district || "-"}</td>
                      <td>{item.iceuEgf || "-"}</td>
                      <td><span className="badge bg-info">{item.groupType || "-"}</span></td>
                      <td className="text-break">{item.transactionId || "-"}</td>
                      <td className="text-success fw-bold">₹{item.amountPaid || 0}</td>
                      <td>
                        {item.paymentScreenshot ? (
                          <a
                            href={`${API_ENDPOINTS.UPLOADS}/${encodeURIComponent(item.paymentScreenshot)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-info"
                            title="View Payment Screenshot"
                          >
                            View Image
                          </a>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge fw-bold ${
                          item.validationReason?.includes("not found") ? "bg-secondary" :
                          item.validationReason?.includes("mismatch") ? "bg-warning text-dark" :
                          "bg-danger"
                        }`}>
                          {item.validationReason || "Validation failed"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {validationCompleted && validatedPayments.length === 0 && nonValidatedPayments.length === 0 && (
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          No payment records found in the uploaded PDF or database for this region.
        </div>
      )}

      {/* Mobile Styling */}
      <style>{`
        .table-responsive {
          position: relative;
        }
        .table-responsive::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .table-responsive::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .table-responsive::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        .table-responsive::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        @media(max-width: 600px){
          table th, table td { font-size: 12px; padding: 6px; }
          h4{ font-size: 18px; }
          .btn-sm { font-size: 11px; padding: 3px 7px; }
        }
      `}</style>
    </div>
  );
}

