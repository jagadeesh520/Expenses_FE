import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_ENDPOINTS } from "./constants";

export default function PaymentRequestForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requestedAmount: "",
    region: "",
    requesterRole: "coordinator", // or "lac_convener"
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.requestedAmount || !formData.region) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("requestedBy", "test-coordinator-id"); // In test mode, use test ID
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("requestedAmount", formData.requestedAmount);
      formDataToSend.append("region", formData.region);
      formDataToSend.append("requesterRole", formData.requesterRole);

      files.forEach((file) => {
        formDataToSend.append("requestImages", file);
      });

      const res = await fetch(API_ENDPOINTS.PAYMENT_REQUEST, {
        method: "POST",
        body: formDataToSend,
      });

      const result = await res.json();

      if (res.ok && result.success) {
        toast.success("Payment request submitted successfully!");
        setTimeout(() => {
          navigate("/my-payment-requests");
        }, 1500);
      } else {
        toast.error(result.error || "Failed to submit request");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <ToastContainer position="top-right" autoClose={2000} />
      
      <div className="card shadow-lg p-4" style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h3 className="fw-bold mb-4 text-center">Create Payment Request</h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-bold">Requesting As *</label>
            <select
              className="form-select"
              name="requesterRole"
              value={formData.requesterRole}
              onChange={handleChange}
              required
            >
              <option value="coordinator">Coordinator</option>
              <option value="lac_convener">LAC Convener</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold">Region *</label>
            <select
              className="form-select"
              name="region"
              value={formData.region}
              onChange={handleChange}
              required
            >
              <option value="">-- Select Region --</option>
              <option value="West Rayalaseema">West Rayalaseema</option>
              <option value="East Rayalaseema">East Rayalaseema</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold">Title *</label>
            <input
              type="text"
              className="form-control"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Conference Venue Payment"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold">Description *</label>
            <textarea
              className="form-control"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Describe the payment request..."
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold">Requested Amount (₹) *</label>
            <input
              type="number"
              className="form-control"
              name="requestedAmount"
              value={formData.requestedAmount}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold">Supporting Documents (Optional)</label>
            <input
              type="file"
              className="form-control"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileChange}
            />
            <small className="text-muted">You can upload multiple files (images or PDFs)</small>
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/")}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

