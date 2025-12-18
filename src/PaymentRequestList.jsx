import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_ENDPOINTS } from "./constants";

export default function PaymentRequestList() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("registrarToken");
    if (!token) {
      navigate("/registrar-login");
      return;
    }

    // Get user data from localStorage
    const registrarData = localStorage.getItem("registrarData");
    if (registrarData) {
      try {
        setUserData(JSON.parse(registrarData));
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
    fetchRequests();
  }, [filterStatus, navigate]);

  const fetchRequests = async () => {
    try {
      const res = await fetch(
        `${API_ENDPOINTS.PAYMENT_REQUESTS}?status=${filterStatus}`
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

  const handleApprove = async (id) => {
    if (!window.confirm("Are you sure you want to approve this payment request?")) {
      return;
    }

    if (!userData || !userData.id) {
      toast.error("User information not found. Please login again.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        API_ENDPOINTS.PAYMENT_REQUEST_APPROVE(id),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approvedBy: userData.id,
          }),
        }
      );

      const result = await res.json();
      if (res.ok && result.success) {
        toast.success("Payment request approved! Now available for Cashier.");
        fetchRequests();
      } else {
        toast.error(result.error || "Failed to approve request");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Please enter rejection reason:");
    if (!reason || reason.trim() === "") {
      toast.info("Rejection cancelled. Reason is required.");
      return;
    }

    if (!userData || !userData.id) {
      toast.error("User information not found. Please login again.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        API_ENDPOINTS.PAYMENT_REQUEST_REJECT(id),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approvedBy: userData.id,
            rejectionReason: reason,
          }),
        }
      );

      const result = await res.json();
      if (res.ok && result.success) {
        toast.success("Payment request rejected.");
        fetchRequests();
      } else {
        toast.error(result.error || "Failed to reject request");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid mt-3">
      <ToastContainer position="top-right" autoClose={2000} />

      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="fw-bold">Payment Requests</h4>
        <div className="d-flex gap-2">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate("/registrations")}
          >
            Back to Registrations
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => {
              localStorage.removeItem("registrarToken");
              navigate("/");
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mb-3">
        <select
          className="form-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ maxWidth: "300px" }}
        >
          <option value="pending">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-striped">
          <thead className="table-dark">
            <tr>
              <th>S.No</th>
              <th>Requested By</th>
              <th>Role</th>
              <th>Region</th>
              <th>Title</th>
              <th>Amount (₹)</th>
              <th>Paid Amount</th>
              <th>Status</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.length > 0 ? (
              requests.map((req, i) => (
                <tr key={req._id}>
                  <td>{i + 1}</td>
                  <td>{req.requestedByName || "N/A"}</td>
                  <td>{req.requesterRole}</td>
                  <td>{req.region}</td>
                  <td>{req.title}</td>
                  <td className="fw-bold">₹{req.requestedAmount}</td>
                  <td>
                    {req.status === "paid" && req.paidAmount ? (
                      <span className="text-success fw-bold">₹{req.paidAmount}</span>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        req.status === "approved"
                          ? "bg-success"
                          : req.status === "rejected"
                          ? "bg-danger"
                          : req.status === "paid"
                          ? "bg-info"
                          : "bg-warning"
                      }`}
                    >
                      {req.status}
                    </span>
                    {req.status === "paid" && req.paymentProofImages && req.paymentProofImages.length > 0 && (
                      <div className="small text-success mt-1">✓ Proof Uploaded</div>
                    )}
                  </td>
                  <td>{new Date(req.createdAt).toLocaleString()}</td>
                  <td>
                    <div className="d-flex gap-1 flex-wrap">
                      <button
                        className="btn btn-info btn-sm"
                        onClick={() => setSelectedRequest(req)}
                        title="View Details"
                      >
                        View
                      </button>
                      {req.status === "pending" && (
                        <>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleApprove(req._id)}
                            disabled={loading}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleReject(req._id)}
                            disabled={loading}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {req.status === "approved" && (
                        <span className="text-success">✓ Approved</span>
                      )}
                      {req.status === "rejected" && (
                        <span className="text-danger">✕ Rejected</span>
                      )}
                      {req.status === "paid" && (
                        <span className="text-info">💰 Paid</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="text-center text-muted">
                  No payment requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setSelectedRequest(null)}
        >
          <div
            className="modal-dialog modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Payment Request Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedRequest(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <strong>Requested By:</strong> {selectedRequest.requestedByName}
                </div>
                <div className="mb-3">
                  <strong>Role:</strong> {selectedRequest.requesterRole}
                </div>
                <div className="mb-3">
                  <strong>Region:</strong> {selectedRequest.region}
                </div>
                <div className="mb-3">
                  <strong>Title:</strong> {selectedRequest.title}
                </div>
                <div className="mb-3">
                  <strong>Description:</strong>
                  <p className="mt-1">{selectedRequest.description}</p>
                </div>
                <div className="mb-3">
                  <strong>Requested Amount:</strong> ₹{selectedRequest.requestedAmount}
                </div>
                <div className="mb-3">
                  <strong>Status:</strong>{" "}
                  <span
                    className={`badge ${
                      selectedRequest.status === "approved"
                        ? "bg-success"
                        : selectedRequest.status === "rejected"
                        ? "bg-danger"
                        : selectedRequest.status === "paid"
                        ? "bg-info"
                        : "bg-warning"
                    }`}
                  >
                    {selectedRequest.status}
                  </span>
                </div>
                {selectedRequest.requestImages && selectedRequest.requestImages.length > 0 && (
                  <div className="mb-3">
                    <strong>Supporting Documents (Request):</strong>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {selectedRequest.requestImages.map((img, idx) => (
                        <a
                          key={idx}
                          href={`${API_ENDPOINTS.UPLOADS}/${img}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary"
                        >
                          View Image {idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {selectedRequest.status === "paid" && selectedRequest.paidAmount && (
                  <div className="mb-3">
                    <strong>Payment Details:</strong>
                    <div className="border p-2 bg-light rounded mt-2">
                      <p className="mb-1">
                        <strong>Amount Paid:</strong> ₹{selectedRequest.paidAmount}
                      </p>
                      {(selectedRequest.paidByName || selectedRequest.paidBy?.name) && (
                        <p className="mb-1">
                          <strong>Paid By (Treasurer):</strong> {selectedRequest.paidByName || selectedRequest.paidBy?.name}
                        </p>
                      )}
                      {selectedRequest.paidAt && (
                        <p className="mb-1">
                          <strong>Paid At:</strong> {new Date(selectedRequest.paidAt).toLocaleString()}
                        </p>
                      )}
                      {selectedRequest.paymentNote && (
                        <p className="mb-1">
                          <strong>Payment Note:</strong> {selectedRequest.paymentNote}
                        </p>
                      )}
                      {selectedRequest.paymentProofImages && selectedRequest.paymentProofImages.length > 0 && (
                        <div className="mt-3">
                          <strong className="text-success">Payment Proof Images (Uploaded by Treasurer):</strong>
                          <div className="d-flex flex-wrap gap-3 mt-2">
                            {selectedRequest.paymentProofImages.map((img, idx) => (
                              <div key={idx} className="text-center">
                                <a
                                  href={`${API_ENDPOINTS.UPLOADS}/${img}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-success d-block mb-2"
                                >
                                  View Full Size {idx + 1}
                                </a>
                                <img
                                  src={`${API_ENDPOINTS.UPLOADS}/${img}`}
                                  alt={`Payment Proof ${idx + 1}`}
                                  style={{ maxWidth: "200px", maxHeight: "200px", objectFit: "cover", borderRadius: "5px", cursor: "pointer" }}
                                  className="border"
                                  onClick={() => window.open(`${API_ENDPOINTS.UPLOADS}/${img}`, '_blank')}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <p className="mb-1">
                        <strong>Paid By:</strong> {selectedRequest.paidByName || "Treasurer"}
                      </p>
                      {selectedRequest.paidAt && (
                        <p className="mb-1">
                          <strong>Paid At:</strong>{" "}
                          {new Date(selectedRequest.paidAt).toLocaleString()}
                        </p>
                      )}
                      {selectedRequest.paymentNote && (
                        <p className="mb-0">
                          <strong>Payment Note:</strong> {selectedRequest.paymentNote}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {selectedRequest.status === "paid" && selectedRequest.paymentProofImages && selectedRequest.paymentProofImages.length > 0 && (
                  <div className="mb-3">
                    <strong>Payment Proof Images (Uploaded by Treasurer):</strong>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                      {selectedRequest.paymentProofImages.map((img, idx) => (
                        <div key={idx} className="text-center">
                          <a
                            href={`${API_ENDPOINTS.UPLOADS}/${img}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-success d-block mb-1"
                          >
                            View Proof {idx + 1}
                          </a>
                          <img
                            src={`${API_ENDPOINTS.UPLOADS}/${img}`}
                            alt={`Payment Proof ${idx + 1}`}
                            style={{ maxWidth: "150px", maxHeight: "150px", objectFit: "cover", borderRadius: "5px" }}
                            className="border"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedRequest.approvedAt && (
                  <div className="mb-3">
                    <strong>Approved At:</strong>{" "}
                    {new Date(selectedRequest.approvedAt).toLocaleString()}
                    {selectedRequest.approvedByName && (
                      <span> by {selectedRequest.approvedByName}</span>
                    )}
                  </div>
                )}
                {selectedRequest.rejectionReason && (
                  <div className="mb-3">
                    <strong>Rejection Reason:</strong> {selectedRequest.rejectionReason}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedRequest(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

