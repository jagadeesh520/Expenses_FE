import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_ENDPOINTS } from "./constants";

export default function ViewPaymentRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Get user data from localStorage
    const adminData = localStorage.getItem("adminData");
    const registrarData = localStorage.getItem("registrarData");
    const userDataStr = adminData || registrarData;
    
    if (userDataStr) {
      try {
        setUserData(JSON.parse(userDataStr));
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
    
    fetchRequests();
  }, [filterStatus]);

  const fetchRequests = async () => {
    try {
      let url = API_ENDPOINTS.PAYMENT_REQUESTS;
      
      // If user is coordinator or lac_convener, filter by their requests
      if (userData && (userData.role === "coordinator" || userData.role === "lac_convener")) {
        url += `?requestedBy=${userData.id}`;
      } else if (filterStatus !== "all") {
        url += `?status=${filterStatus}`;
      }
      
      const res = await fetch(url);
      const result = await res.json();
      if (result.success) {
        setRequests(result.data);
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
        <h4 className="fw-bold">Payment Requests</h4>
        <div className="d-flex gap-2">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              if (userData?.role === "registrar") {
                navigate("/registrations");
              } else {
                navigate("/admin-dashboard");
              }
            }}
          >
            Back
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => {
              localStorage.removeItem("adminToken");
              localStorage.removeItem("adminData");
              localStorage.removeItem("registrarToken");
              localStorage.removeItem("registrarData");
              navigate("/");
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {(userData?.role === "chairperson" || userData?.role === "registrar") && (
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
      )}

      <div className="table-responsive">
        <table className="table table-bordered table-striped">
          <thead className="table-dark">
            <tr>
              <th>S.No</th>
              <th>Requested By</th>
              <th>Role</th>
              <th>Region</th>
              <th>Title</th>
              <th>Requested Amount (₹)</th>
              <th>Paid Amount (₹)</th>
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
                  <td className="fw-bold text-success">
                    {req.paidAmount ? `₹${req.paidAmount}` : "-"}
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
                <td colSpan="10" className="text-center text-muted">
                  No payment requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Request Details Modal with Payment Proof */}
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
                
                {selectedRequest.status === "paid" && (
                  <>
                    <div className="mb-3 border-top pt-3">
                      <h6 className="fw-bold text-success">Payment Information</h6>
                      <div className="border p-2 bg-light rounded">
                        <p className="mb-1">
                          <strong>Amount Paid:</strong> ₹{selectedRequest.paidAmount}
                        </p>
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
                    
                    {selectedRequest.paymentProofImages && selectedRequest.paymentProofImages.length > 0 && (
                      <div className="mb-3">
                        <strong className="text-success">Payment Proof Images (Uploaded by Treasurer):</strong>
                        <div className="row g-2 mt-2">
                          {selectedRequest.paymentProofImages.map((img, idx) => (
                            <div key={idx} className="col-md-4 col-sm-6">
                              <div className="border rounded p-2 text-center">
                                <img
                                  src={`${API_ENDPOINTS.UPLOADS}/${img}`}
                                  alt={`Payment Proof ${idx + 1}`}
                                  style={{ 
                                    maxWidth: "100%", 
                                    maxHeight: "200px", 
                                    objectFit: "contain",
                                    borderRadius: "5px",
                                    cursor: "pointer"
                                  }}
                                  className="mb-2"
                                  onClick={() => window.open(`${API_ENDPOINTS.UPLOADS}/${img}`, '_blank')}
                                />
                                <a
                                  href={`${API_ENDPOINTS.UPLOADS}/${img}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-success w-100"
                                >
                                  View Full Size
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {selectedRequest.requestImages && selectedRequest.requestImages.length > 0 && (
                  <div className="mb-3 border-top pt-3">
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
                          View Document {idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

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

