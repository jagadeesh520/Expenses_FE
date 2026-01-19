import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_ENDPOINTS } from "./constants";
import { getTotalAmount } from "./utils/pricingUtils";

export const TRANSACTION_TYPES = {
  DISBURSEMENT: "DISBURSEMENT",
  REFUND: "REFUND",
};

function WorkerTransactionForm({ transactionType, region, onSuccess }) {
  const [formData, setFormData] = useState({
    party: "",
    method: "",
    amount: "",
    proof: null,
  });

  const isRefund = transactionType === TRANSACTION_TYPES.REFUND;

  const nameLabel = isRefund ? "Amount Received From" : "Amount Sent To";
  const methodLabel = isRefund ? "How Amount Was Received" : "How Amount Was Sent";
  const amountLabel = isRefund ? "Amount Received (₹)" : "Amount Sent (₹)";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, proof: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.party.trim()) {
      toast.error(`Please enter '${nameLabel}'`);
      return;
    }
    if (!formData.method.trim()) {
      toast.error(`Please select '${methodLabel}'`);
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!formData.proof) {
      toast.error("Please upload payment proof");
      return;
    }

    try {
      const payload = new FormData();

      let requestedBy = null;

      const treasurerData = localStorage.getItem("treasurerData");
      if (treasurerData) {
        try {
          const treasurer = JSON.parse(treasurerData);
          requestedBy = treasurer._id || treasurer.id;
        } catch (e) {
          console.error("Error parsing treasurer data:", e);
        }
      }

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

      if (!requestedBy) {
        toast.error("User authentication required. Please log in.");
        return;
      }

      payload.append("requestedBy", requestedBy);
      payload.append("title", formData.party.trim());

      const descriptionLines = [
        `Transaction Type: ${transactionType}`,
        `${isRefund ? "Received From" : "Sent To"}: ${formData.party.trim()}`,
        `Payment Method: ${formData.method}`,
      ];
      payload.append("description", descriptionLines.join("\n"));

      payload.append("requestedAmount", formData.amount);
      payload.append("region", region);
      payload.append("requesterRole", "coordinator");
      payload.append("requestImages", formData.proof);

      const res = await fetch(API_ENDPOINTS.PAYMENT_REQUEST, {
        method: "POST",
        body: payload,
      });

      let result;
      try {
        result = await res.json();
      } catch (err) {
        console.error("Failed to parse JSON response", err);
        toast.error("Server returned invalid response");
        return;
      }

      if (res.ok && result?.success) {
        toast.success(
          isRefund
            ? "Amount received from worker recorded successfully!"
            : "Worker disbursement recorded successfully!"
        );

        setFormData({
          party: "",
          method: "",
          amount: "",
          proof: null,
        });

        if (onSuccess) onSuccess();
      } else {
        console.error("API request failed", result);
        toast.error(result?.error || result?.message || "Failed to record transaction");
      }
    } catch (err) {
      console.error("Error submitting worker transaction:", err);
      toast.error("Server error. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="row g-3">
        <div className="col-12 col-md-6">
          <label className="form-label fw-bold">
            {nameLabel} <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="form-control"
            name="party"
            value={formData.party}
            onChange={handleInputChange}
            placeholder="Worker name / Worker group / Purpose"
            required
          />
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label fw-bold">
            {methodLabel} <span className="text-danger">*</span>
          </label>
          <select
            className="form-select"
            name="method"
            value={formData.method}
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
          <label className="form-label fw-bold">
            {amountLabel} <span className="text-danger">*</span>
          </label>
          <input
            type="number"
            className="form-control"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            placeholder="0.00"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label fw-bold">
            Upload Payment Proof <span className="text-danger">*</span>
          </label>
          <input
            type="file"
            className="form-control"
            name="proof"
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
              !formData.party.trim() ||
              !formData.method ||
              !formData.amount ||
              !formData.proof
            }
          >
            <i className="bi bi-check-circle me-2"></i>Submit
          </button>
        </div>
      </div>
    </form>
  );
}

function formatDate(dateString) {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

export default function WorkerTransactionsPage({ transactionType }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalAmount: 0,
    totalCollected: 0,
    totalSentToWorkers: 0,
    totalRefundedFromWorkers: 0,
    balance: 0,
  });
  const [transactions, setTransactions] = useState([]);

  const isRefund = transactionType === TRANSACTION_TYPES.REFUND;

  const pageTitle = isRefund ? "Amount Received From Worker" : "Worker Disbursements";
  const cardTitle = isRefund ? "Add Amount Received From Worker" : "Add Worker Disbursement";
  const historyTitle = isRefund ? "Amount Received History" : "Disbursement History";
  const dateColumnLabel = isRefund ? "Received Date" : "Sent Date";
  const nameColumnLabel = isRefund ? "Amount Received From" : "Amount Sent To";
  const amountColumnLabel = isRefund ? "Amount Received (₹)" : "Amount (₹)";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, navigate]);

  const loadData = async (selectedRegion) => {
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.REGISTRATIONS);
      const result = await res.json();

      if (result.success) {
        let registrations = result.data || [];

        registrations = registrations.filter((item) => {
          const itemRegion = (item.region || "").trim();
          return itemRegion === selectedRegion;
        });

        const seenTransactionIds = new Set();
        const uniqueRegistrations = registrations.filter((reg) => {
          const txId = reg.transactionId?.trim();
          if (!txId) return true;
          if (seenTransactionIds.has(txId)) return false;
          seenTransactionIds.add(txId);
          return true;
        });

        const totalAmount = uniqueRegistrations.reduce((sum, reg) => {
          return (
            sum +
            getTotalAmount(reg.region, reg.groupType, reg.maritalStatus, reg.spouseAttending)
          );
        }, 0);

        const totalCollected = uniqueRegistrations.reduce(
          (sum, reg) => sum + (Number(reg.amountPaid) || 0),
          0
        );

        const prRes = await fetch(API_ENDPOINTS.PAYMENT_REQUESTS);
        const prResult = await prRes.json();

        let mappedTransactions = [];
        let totalDisbursed = 0;
        let totalRefunded = 0;

        if (prResult.success) {
          const allWorkerTx = (prResult.data || []).filter((req) => {
            const matchesRegion = req.region === selectedRegion;
            const hasPaymentPattern =
              req.description && req.description.includes("Payment Method:");
            return matchesRegion && hasPaymentPattern;
          });

          mappedTransactions = allWorkerTx.map((req) => {
            let method = "";
            if (req.description) {
              const methodMatch = req.description.match(/Payment Method:\s*(.+)/i);
              if (methodMatch) method = methodMatch[1].trim();
            }

            let type = TRANSACTION_TYPES.DISBURSEMENT;
            if (req.description) {
              const typeMatch = req.description.match(
                /Transaction Type:\s*(DISBURSEMENT|REFUND)/i
              );
              if (typeMatch && typeMatch[1]) {
                const value = typeMatch[1].toUpperCase();
                if (value === TRANSACTION_TYPES.REFUND) {
                  type = TRANSACTION_TYPES.REFUND;
                }
              }
            }

            const amount = Number(req.requestedAmount) || 0;
            if (type === TRANSACTION_TYPES.REFUND) {
              totalRefunded += amount;
            } else {
              totalDisbursed += amount;
            }

            return {
              id: req._id,
              region: req.region,
              transactionType: type,
              party: req.title || "",
              method,
              amount,
              paymentProof:
                req.requestImages && req.requestImages.length > 0
                  ? req.requestImages[0]
                  : null,
              paymentProofImages: req.requestImages || [],
              createdAt: req.createdAt,
            };
          });
        }

        const netSentToWorkers = totalDisbursed - totalRefunded;
        const balance = totalCollected - netSentToWorkers;

        setTransactions(mappedTransactions);
        setSummary({
          totalAmount,
          totalCollected,
          totalSentToWorkers: totalDisbursed,
          totalRefundedFromWorkers: totalRefunded,
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

  const filteredTransactions = transactions.filter(
    (tx) =>
      tx.transactionType ===
      (isRefund ? TRANSACTION_TYPES.REFUND : TRANSACTION_TYPES.DISBURSEMENT)
  );

  return (
    <div className="container-fluid mt-3" style={{ minHeight: "100vh", paddingBottom: "20px" }}>
      <ToastContainer position="top-right" autoClose={2000} />

      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="fw-bold">
          {pageTitle}
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
                        <h4 className="fw-bold text-primary">
                          ₹{Number(summary.totalAmount).toLocaleString()}
                        </h4>
                      </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-3">
                      <div className="text-center p-3 border rounded">
                        <h6 className="text-muted mb-2">Total Collected</h6>
                        <h4 className="fw-bold text-success">
                          ₹{Number(summary.totalCollected).toLocaleString()}
                        </h4>
                      </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-3">
                      <div className="text-center p-3 border rounded">
                        <h6 className="text-muted mb-2">Total Sent to Workers</h6>
                        <h4 className="fw-bold text-warning">
                          ₹{Number(summary.totalSentToWorkers).toLocaleString()}
                        </h4>
                      </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-3">
                      <div className="text-center p-3 border rounded">
                        <h6 className="text-muted mb-2">Amount Received From Workers</h6>
                        <h4 className="fw-bold text-primary">
                          ₹{Number(summary.totalRefundedFromWorkers).toLocaleString()}
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="row mt-3">
                    <div className="col-12">
                      <div className="text-center p-3 border rounded">
                        <h6 className="text-muted mb-2">Remaining Balance</h6>
                        <h4
                          className={`fw-bold ${
                            summary.balance >= 0 ? "text-success" : "text-danger"
                          }`}
                        >
                          ₹{Number(summary.balance).toLocaleString()}
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-12">
              <div className="card shadow-lg">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0 fw-bold">
                    <i className="bi bi-plus-circle me-2"></i>
                    {cardTitle}
                  </h5>
                </div>
                <div className="card-body p-4">
                  <WorkerTransactionForm
                    transactionType={transactionType}
                    region={region}
                    onSuccess={() => loadData(region)}
                  />
                </div>
              </div>
            </div>
          </div>

          {filteredTransactions.length > 0 && (
            <div className="row">
              <div className="col-12">
                <div className="card shadow-lg">
                  <div className="card-header bg-secondary text-white">
                    <h5 className="mb-0 fw-bold">
                      <i className="bi bi-clock-history me-2"></i>
                      {historyTitle}
                    </h5>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-bordered table-striped align-middle mb-0">
                        <thead className="table-dark">
                          <tr>
                            <th>S.No</th>
                            <th>{dateColumnLabel}</th>
                            <th>{nameColumnLabel}</th>
                            <th>Method</th>
                            <th>{amountColumnLabel}</th>
                            <th>Proof</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTransactions.map((tx, index) => (
                            <tr key={tx.id}>
                              <td>{index + 1}</td>
                              <td>{formatDate(tx.createdAt)}</td>
                              <td>{tx.party}</td>
                              <td>{tx.method}</td>
                              <td className="fw-bold">
                                ₹{Number(tx.amount).toLocaleString()}
                              </td>
                              <td>
                                {tx.paymentProof ? (
                                  <a
                                    href={`${API_ENDPOINTS.UPLOADS}/${encodeURIComponent(
                                      tx.paymentProof
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-info"
                                  >
                                    <i className="bi bi-file-earmark-image me-1"></i>View
                                  </a>
                                ) : tx.paymentProofImages &&
                                  tx.paymentProofImages.length > 0 ? (
                                  <a
                                    href={`${API_ENDPOINTS.UPLOADS}/${encodeURIComponent(
                                      tx.paymentProofImages[0]
                                    )}`}
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

