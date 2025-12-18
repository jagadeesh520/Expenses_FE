import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_ENDPOINTS } from "./constants";

export default function MyPaymentRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [userData, setUserData] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    // Get user data from localStorage (could be from coordinator or LAC convener login)
    const userDataStr = localStorage.getItem("coordinatorData") || 
                       localStorage.getItem("lacConvenerData") || 
                       localStorage.getItem("registrarData");
    
    if (userDataStr) {
      try {
        const data = JSON.parse(userDataStr);
        setUserData(data);
        fetchMyRequests(data.id || data._id);
      } catch (e) {
        console.error("Error parsing user data:", e);
        // For testing: if no user data, try to fetch all requests
        // In production, this should redirect to login
        fetchMyRequests(null);
      }
    } else {
      // For testing: allow viewing without login
      // In production, this should redirect to login
      fetchMyRequests(null);
    }
  }, [filterStatus]);

  const fetchMyRequests = async (userId) => {
    try {
      let url = API_ENDPOINTS.PAYMENT_REQUESTS;
      const params = new URLSearchParams();
      if (userId) {
        params.append("requestedBy", userId);
      }
      if (filterStatus !== "all") {
        params.append("status", filterStatus);
      }
      if (params.toString()) {
        url += "?" + params.toString();
      }
      
      const res = await fetch(url);
      const result = await res.json();
      if (result.success) {
        // If userId is provided, filter by userId on frontend as well
        let filteredData = result.data;
        if (userId) {
          filteredData = result.data.filter(req => 
            req.requestedBy?._id === userId || 
            req.requestedBy === userId ||
            req.requestedBy?.toString() === userId
          );
        }
        setRequests(filteredData);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load payment requests");
    }
  };

  return (
    <div className="container-fluid mt-3">
      <ToastContainer position="top-right" autoClose={2000} />

      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="fw-bold">My Payment Requests</h4>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => {
            localStorage.removeItem("coordinatorData");
            localStorage.removeItem("lacConvenerData");
            navigate("/");
          }}
        >
          Logout
        </button>
      </div>

      <div className="mb-3">
        <select
          className="form-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ maxWidth: "300px" }}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
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
              <th>Title</th>
              <th>Amount (₹)</th>
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
                  <td>{req.title}</td>
                  <td className="fw-bold">₹{req.requestedAmount}</td>
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
                  </td>
                  <td>{new Date(req.createdAt).toLocaleString()}</td>
                  <td>
                    <button
                      className="btn btn-info btn-sm"
                      onClick={() => setSelectedRequest(req)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-muted">
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
                  <strong>Region:</strong> {selectedRequest.region}
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
                  <div className="mb-3 border-top pt-3">
                    <h6 className="fw-bold text-success">Payment Information</h6>
                    <div className="border p-3 bg-light rounded mt-2">
                      <p className="mb-2">
                        <strong>Amount Paid:</strong> ₹{selectedRequest.paidAmount}
                      </p>
                      {(selectedRequest.paidByName || selectedRequest.paidBy?.name) && (
                        <p className="mb-2">
                          <strong>Paid By (Treasurer):</strong> {selectedRequest.paidByName || selectedRequest.paidBy?.name}
                        </p>
                      )}
                      {selectedRequest.paidAt && (
                        <p className="mb-2">
                          <strong>Paid At:</strong> {new Date(selectedRequest.paidAt).toLocaleString()}
                        </p>
                      )}
                      {selectedRequest.paymentNote && (
                        <p className="mb-2">
                          <strong>Payment Note:</strong> {selectedRequest.paymentNote}
                        </p>
                      )}
                      {selectedRequest.paymentProofImages && selectedRequest.paymentProofImages.length > 0 && (
                        <div className="mt-3">
                          <strong className="text-success">Payment Proof Images:</strong>
                          <div className="d-flex flex-wrap gap-2 mt-2">
                            {selectedRequest.paymentProofImages.map((img, idx) => (
                              <div key={idx} className="text-center">
                                <a
                                  href={`${API_ENDPOINTS.UPLOADS}/${img}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-success d-block mb-1"
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
                    </div>
                  </div>
                )}

                {selectedRequest.status === "approved" && (
                  <div className="mb-3">
                    <strong>Approved At:</strong>{" "}
                    {selectedRequest.approvedAt
                      ? new Date(selectedRequest.approvedAt).toLocaleString()
                      : "N/A"}
                    {selectedRequest.approvedByName && (
                      <span> by {selectedRequest.approvedByName}</span>
                    )}
                  </div>
                )}

                {selectedRequest.status === "rejected" && selectedRequest.rejectionReason && (
                  <div className="mb-3">
                    <strong>Rejection Reason:</strong>
                    <p className="text-danger mt-1">{selectedRequest.rejectionReason}</p>
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

