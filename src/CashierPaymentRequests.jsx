import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_ENDPOINTS } from "./constants";

export default function CashierPaymentRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [paymentData, setPaymentData] = useState({
    paidAmount: "",
    paymentNote: "",
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchApprovedRequests();
  }, []);

  const fetchApprovedRequests = async () => {
    try {
      const res = await fetch(
        `${API_ENDPOINTS.PAYMENT_REQUESTS}?status=approved`
      );
      const result = await res.json();
      if (result.success) {
        setRequests(result.data);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load payment requests");
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (!selectedRequest) {
      toast.error("Please select a request");
      return;
    }

    if (!paymentData.paidAmount || parseFloat(paymentData.paidAmount) <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("paidBy", "test-cashier-id"); // In test mode
      formData.append("paidAmount", paymentData.paidAmount);
      formData.append("paymentNote", paymentData.paymentNote || "");

      files.forEach((file) => {
        formData.append("paymentProofImages", file);
      });

      const res = await fetch(
        API_ENDPOINTS.PAYMENT_REQUEST_PAY(selectedRequest._id),
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await res.json();
      if (res.ok && result.success) {
        toast.success("Payment proof uploaded successfully!");
        setSelectedRequest(null);
        setPaymentData({ paidAmount: "", paymentNote: "" });
        setFiles([]);
        fetchApprovedRequests();
      } else {
        toast.error(result.error || "Failed to upload payment proof");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid mt-3">
      <ToastContainer position="top-right" autoClose={2000} />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold">Cashier - Payment Requests</h4>
        <div className="d-flex gap-2">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate("/admin-dashboard")}
          >
            Back to Dashboard
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => {
              localStorage.removeItem("adminToken");
              navigate("/");
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="row">
        <div className="col-md-7">
          <h5 className="mb-3">Approved Payment Requests</h5>
          <div className="table-responsive">
            <table className="table table-bordered table-striped">
              <thead className="table-dark">
                <tr>
                  <th>S.No</th>
                  <th>Requested By</th>
                  <th>Title</th>
                  <th>Amount (₹)</th>
                  <th>Region</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.length > 0 ? (
                  requests.map((req, i) => (
                    <tr
                      key={req._id}
                      className={selectedRequest?._id === req._id ? "table-info" : ""}
                    >
                      <td>{i + 1}</td>
                      <td>{req.requestedByName}</td>
                      <td>{req.title}</td>
                      <td className="fw-bold">₹{req.requestedAmount}</td>
                      <td>{req.region}</td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setSelectedRequest(req)}
                        >
                          Upload Payment
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center text-muted">
                      No approved payment requests available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-md-5">
          {selectedRequest ? (
            <div className="card shadow p-3">
              <h5 className="mb-3">Upload Payment Proof</h5>
              <form onSubmit={handlePaymentSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-bold">Request Details</label>
                  <div className="border p-2 bg-light rounded">
                    <p className="mb-1">
                      <strong>Title:</strong> {selectedRequest.title}
                    </p>
                    <p className="mb-1">
                      <strong>Requested Amount:</strong> ₹{selectedRequest.requestedAmount}
                    </p>
                    <p className="mb-0">
                      <strong>Requested By:</strong> {selectedRequest.requestedByName}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">
                    Amount Paid (₹) *
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={paymentData.paidAmount}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        paidAmount: e.target.value,
                      })
                    }
                    placeholder="Enter amount paid"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Payment Note</label>
                  <textarea
                    className="form-control"
                    value={paymentData.paymentNote}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        paymentNote: e.target.value,
                      })
                    }
                    rows="3"
                    placeholder="Add any notes about the payment..."
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">
                    Payment Proof Images *
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    multiple
                    accept="image/*"
                    onChange={(e) => setFiles(Array.from(e.target.files))}
                    required
                  />
                  <small className="text-muted">
                    Upload screenshots or images of payment proof
                  </small>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setSelectedRequest(null);
                      setPaymentData({ paidAmount: "", paymentNote: "" });
                      setFiles([]);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={loading}
                  >
                    {loading ? "Uploading..." : "Upload Payment Proof"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="card shadow p-3 text-center text-muted">
              <p>Select a request from the list to upload payment proof</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

