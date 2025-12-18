import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_ENDPOINTS } from "./constants";

export default function RegistrationList() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const navigate = useNavigate();

  // 🔹 Get final status safely
  const getRegStatus = (item) => {
    if (item.registrationStatus) return item.registrationStatus;
    const lastTx = item.transactions?.[item.transactions.length - 1]?.status;
    return lastTx || "pending";
  };

  useEffect(() => {
    const token = localStorage.getItem("registrarToken");
    if (!token) return navigate("/registrar-login");
    fetchList();
  }, []);

  const fetchList = async () => {
    try {
      // Use HTTP on backend port 5000 (adjust if your backend runs elsewhere)
      const res = await fetch(API_ENDPOINTS.REGISTRATIONS);
      const result = await res.json();
      if (result.success) setRecords(result.data);
    } catch {
      toast.error("Failed to load registrations");
    }
  };

  const updateStatus = async (id, action) => {
    try {
      let reason = "";
      if (action === "rejected") {
        reason = window.prompt("Please enter a rejection reason:", "");
        if (reason === null || reason.trim() === "") {
          toast.info("Rejection cancelled (reason required).");
          return;
        }
      }

      // Use the new endpoint structure: /approve or /reject
      const endpoint = action === "approved" 
        ? API_ENDPOINTS.REGISTRATION_APPROVE(id)
        : API_ENDPOINTS.REGISTRATION_REJECT(id);
      
      const registrarData = localStorage.getItem("registrarData");
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          approvedBy: registrarData || "Registrar",
          rejectedBy: registrarData || "Registrar",
          ...(action === "rejected" && { reason })
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        toast.success(`Registration ${action === "approved" ? "approved" : "rejected"} successfully! Email sent.`);
        fetchList();
      } else {
        toast.error(result.error || "Action failed");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Server Error");
    }
  };

  // Search + Filter
  const filteredRecords = records.filter((item) => {
    const s = search.toLowerCase();
    const status = getRegStatus(item);
    return (
      (item.name?.toLowerCase().includes(s) ||
        item.email?.toLowerCase().includes(s) ||
        item.mobile?.includes(search) ||
        item.region?.toLowerCase().includes(s)) &&
      (filterStatus === "all" || filterStatus === status)
    );
  });

  return (
    <div className="container-fluid mt-3">
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="fw-bold">Registration Approval List</h4>

        <div className="d-flex gap-2">
          <button
            className="btn btn-primary fw-bold btn-sm px-3"
            onClick={() => navigate("/payment-requests")}
          >
            Approve Requests
          </button>
          <button
            className="btn btn-info fw-bold btn-sm px-3"
            onClick={() => navigate("/view-payment-requests")}
          >
            View All Requests
          </button>
          <button
            className="btn btn-danger fw-bold btn-sm px-3"
            onClick={() => {
              localStorage.removeItem("registrarToken");
              localStorage.removeItem("registrarData");
              toast.success("Logged out!");
              setTimeout(() => navigate("/"), 600);
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="row g-2 mb-3">
        <div className="col-12 col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Search Name / Email / Mobile / Region"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="col-12 col-md-3">
          <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-bordered table-striped align-middle text-center table-sm">
          <thead className="table-dark">
            <tr>
              <th>S.No</th>
              <th>Region</th>
              <th>Email</th>
              <th>Name</th>
              <th>Mobile</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredRecords.length ? (
              filteredRecords.map((item, i) => {
                const status = getRegStatus(item);
                return (
                  <tr key={item._id}>
                    <td>{i + 1}</td>
                    <td>{item.region}</td>
                    <td className="text-break">{item.email}</td>
                    <td>{item.name}</td>
                    <td>{item.mobile}</td>

                    <td>
                      <span
                        className={`fw-bold ${
                          status === "approved" ? "text-success" : status === "rejected" ? "text-danger" : "text-warning"
                        }`}
                      >
                        {status}
                      </span>
                      {item.uniqueId && (
                        <div className="small text-muted">ID: {item.uniqueId}</div>
                      )}
                    </td>

                    <td>
                      <div className="d-flex gap-1 justify-content-center flex-wrap">

                        {status === "approved" && (
                          <button className="btn btn-success rounded-circle btn-sm" disabled>
                            ✓
                          </button>
                        )}

                        {status === "rejected" && (
                          <button className="btn btn-danger rounded-circle btn-sm" disabled>
                            ✕
                          </button>
                        )}

                        {status === "pending" && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => updateStatus(item._id, "approved")}>
                              Approve
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => updateStatus(item._id, "rejected")}>
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="10" className="text-danger fw-bold">
                  No Records Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Styling */}
      <style>{`
        @media(max-width: 600px){
          table th, table td { font-size: 12px; padding: 6px; }
          h4{ font-size: 18px; }
          .btn-sm { font-size: 11px; padding: 3px 7px; }
          .rounded-circle{ width:28px;height:28px;font-size:14px!important; }
        }
      `}</style>
    </div>
  );
}
