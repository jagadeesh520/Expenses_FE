import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_ENDPOINTS } from "./constants";

// Simple Workflow Stepper Component for Web
const WorkflowStepper = ({ status }) => {
  const steps = ["requested", "approved", "paid", "received"];
  const labels = {
    requested: "Worker Request",
    approved: "Admin Approved",
    paid: "Cashier Paid",
    received: "Worker Received",
  };

  const currentIndex = steps.indexOf(status);

  return (
    <div className="d-flex align-items-center flex-wrap" style={{ padding: "10px 0" }}>
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <div className="d-flex flex-column align-items-center" style={{ minWidth: "120px" }}>
            <div
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: "32px",
                height: "32px",
                backgroundColor: currentIndex >= index ? "#007bff" : "#ccc",
                color: "#fff",
                fontWeight: "bold",
                fontSize: "14px",
              }}
            >
              {index + 1}
            </div>
            <span
              style={{
                marginTop: "5px",
                fontSize: "12px",
                fontWeight: currentIndex >= index ? "bold" : "normal",
                color: currentIndex >= index ? "#000" : "#999",
                textAlign: "center",
              }}
            >
              {labels[step]}
            </span>
          </div>
          {index !== steps.length - 1 && (
            <div
              style={{
                width: "40px",
                height: "3px",
                backgroundColor: currentIndex > index ? "#007bff" : "#ccc",
                margin: "0 5px",
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default function TreasurerApprovedRequests() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [zoomImage, setZoomImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [uploadFiles, setUploadFiles] = useState({});

  // Load approved/paid/received items
  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(API_ENDPOINTS.ADMIN_REQUESTS);
      const data = await r.json();
      const filtered = Array.isArray(data)
        ? data.filter(
            (r) =>
              r.status === "approved" ||
              r.status === "paid" ||
              r.status === "received"
          )
        : (data.data || []).filter(
            (r) =>
              r.status === "approved" ||
              r.status === "paid" ||
              r.status === "received"
          );
      setList(filtered);
    } catch (err) {
      console.error("Error loading requests:", err);
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Status → Stepper stage
  const convertToStep = (status) => {
    switch (status) {
      case "approved":
        return "approved";
      case "paid":
        return "paid";
      case "received":
        return "received";
      default:
        return "requested";
    }
  };

  // Upload cashier images
  const sendMoney = async (id) => {
    const files = uploadFiles[id];
    if (!files || files.length === 0) {
      toast.error("Please select at least one image");
      return;
    }

    setUploadingId(id);

    try {
      const form = new FormData();

      // Use cashierImages to match mobile app (as per plan)
      // Note: If this doesn't work with web endpoint, may need to use 'paymentProofImages'
      Array.from(files).forEach((file) => {
        form.append("cashierImages", file);
      });

      // Use the payment request pay endpoint (web endpoint)
      // Note: Field name should be 'cashierImages' to match mobile app
      const response = await fetch(API_ENDPOINTS.PAYMENT_REQUEST_PAY(id), {
        method: "POST",
        body: form,
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to upload payment screenshot");
        return;
      }

      toast.success("Payment screenshot uploaded successfully");
      setUploadFiles({ ...uploadFiles, [id]: null });
      load();
    } catch (error) {
      console.error("Error uploading:", error);
      toast.error("Failed to upload payment screenshot");
    } finally {
      setUploadingId(null);
    }
  };

  const handleFileChange = (id, e) => {
    setUploadFiles({ ...uploadFiles, [id]: e.target.files });
  };

  // Image List Component
  const ImageList = ({ images }) => {
    if (!images || images.length === 0) return null;

    return (
      <div className="d-flex gap-2" style={{ overflowX: "auto", padding: "10px 0" }}>
        {images.map((img, index) => (
          <div key={index} style={{ flexShrink: 0 }}>
            <img
              src={`${API_ENDPOINTS.UPLOADS}/${img}`}
              alt={`Image ${index + 1}`}
              style={{
                width: "130px",
                height: "130px",
                objectFit: "cover",
                borderRadius: "10px",
                cursor: "pointer",
                border: "2px solid #dee2e6",
              }}
              onClick={() => setZoomImage(img)}
              className="img-thumbnail"
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container-fluid mt-3" style={{ minHeight: "100vh", paddingBottom: "20px" }}>
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="fw-bold">Treasurer Requests</h4>
        <div className="d-flex gap-2">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate("/treasurer")}
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

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading requests...</p>
        </div>
      )}

      {/* Requests List */}
      {!loading && (
        <div className="row g-3">
          {list.length > 0 ? (
            list.map((item, idx) => (
              <div key={item._id || idx} className="col-12">
                <div className="card shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title fw-bold">{item.title || "Untitled Request"}</h5>
                    
                    <div className="mb-2">
                      <strong>Amount:</strong> ₹{item.amount || item.requestedAmount || "0"}
                    </div>
                    
                    <div className="mb-2">
                      <strong>Status:</strong>{" "}
                      <span
                        className={`badge ${
                          item.status === "approved"
                            ? "bg-warning"
                            : item.status === "paid"
                            ? "bg-info"
                            : item.status === "received"
                            ? "bg-success"
                            : "bg-secondary"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {/* Worker Images */}
                    {item.workerImages && item.workerImages.length > 0 && (
                      <div className="mb-3">
                        <strong className="d-block mb-2">Worker Uploads:</strong>
                        <ImageList images={item.workerImages} />
                      </div>
                    )}

                    {/* Cashier/Treasurer Images */}
                    {(item.status === "paid" || item.status === "received") &&
                      item.cashierImages &&
                      item.cashierImages.length > 0 && (
                        <div className="mb-3">
                          <strong className="d-block mb-2">Treasurer Uploads:</strong>
                          <ImageList images={item.cashierImages} />
                        </div>
                      )}

                    {/* Workflow Stepper */}
                    <div className="mb-3">
                      <WorkflowStepper status={convertToStep(item.status)} />
                    </div>

                    {/* Upload Button for Approved Requests */}
                    {item.status === "approved" && (
                      <div className="mt-3">
                        <div className="mb-2">
                          <label className="form-label fw-bold">
                            Upload Payment Screenshot(s) *
                          </label>
                          <input
                            type="file"
                            className="form-control"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleFileChange(item._id, e)}
                            disabled={uploadingId === item._id}
                          />
                          <small className="text-muted">
                            Select one or more payment screenshot images
                          </small>
                        </div>
                        <button
                          className="btn btn-primary"
                          onClick={() => sendMoney(item._id)}
                          disabled={uploadingId === item._id || !uploadFiles[item._id] || uploadFiles[item._id].length === 0}
                        >
                          {uploadingId === item._id ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                              ></span>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-upload me-2"></i>
                              Upload Screenshot & Mark Paid
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12">
              <div className="alert alert-info text-center">
                <i className="bi bi-info-circle me-2"></i>
                No approved, paid, or received requests found
              </div>
            </div>
          )}
        </div>
      )}

      {/* Zoom Image Modal */}
      {zoomImage && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.9)" }}
          onClick={() => setZoomImage(null)}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content bg-transparent border-0">
              <div className="modal-header border-0">
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setZoomImage(null)}
                  style={{ fontSize: "24px" }}
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body p-0 text-center">
                <img
                  src={`${API_ENDPOINTS.UPLOADS}/${zoomImage}`}
                  alt="Zoomed"
                  style={{
                    maxWidth: "90%",
                    maxHeight: "80vh",
                    objectFit: "contain",
                  }}
                  className="img-fluid"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

