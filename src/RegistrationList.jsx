import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "react-toastify/dist/ReactToastify.css";

export default function RegistrationList() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const navigate = useNavigate();

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
      const res = await fetch("https://api.sjtechsol.com/api/cashier/registrations");
      const result = await res.json();
      if (result.success) setRecords(result.data);
    } catch {
      toast.error("Failed to load registrations");
    }
  };

  const deleteRecord = async (id) => {
    if (!window.confirm("Are you sure you want to delete this registration?")) return;

    try {
      const res = await fetch(`https://api.sjtechsol.com/api/cashier/registrations/${id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (result.success) {
        toast.success("Record deleted successfully!");
        fetchList();
      } else {
        toast.error(result.error || "Delete failed");
      }
    } catch (err) {
      toast.error("Server Error while deleting");
    }
  };

  const updateStatus = async (id, action) => {
    try {
      let reason = "";
      if (action === "rejected") {
        reason = window.prompt("Please enter a rejection reason:", "");
        if (!reason.trim()) return toast.info("Rejection cancelled");
      }

      const endpoint =
        action === "approved"
          ? `https://api.sjtechsol.com/api/cashier/registrations/${id}/approve`
          : `https://api.sjtechsol.com/api/cashier/registrations/${id}/reject`;

      const registrarData = localStorage.getItem("registrarData");

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvedBy: registrarData || "Registrar",
          rejectedBy: registrarData || "Registrar",
          ...(action === "rejected" && { reason }),
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success(`Status updated successfully!`);
        fetchList();
      } else toast.error("Update failed");
    } catch (err) {
      toast.error("Server error");
    }
  };

  // ---------------- Highlight Duplicates by EMAIL or NAME ----------------
  const duplicateMap = {};
  records.forEach((r) => {
    const emailKey = r.email?.trim().toLowerCase();
    const nameKey = r.name?.trim().toLowerCase();
    if (emailKey) duplicateMap[emailKey] = (duplicateMap[emailKey] || 0) + 1;
    if (nameKey) duplicateMap[nameKey] = (duplicateMap[nameKey] || 0) + 1;
  });

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

  // ---------------- Excel Export ----------------
  const downloadExcel = () => {
    const data = filteredRecords.map((item, index) => ({
      S_No: index + 1,
      Region: item.region,
      Email: item.email,
      Name: item.name,
      Gender: item.gender,
      Age: item.age,
      Mobile: item.mobile,
      Recommended_Role: item.recommendedByRole,
      Recommender: item.recommenderContact,
      Amount: item.amountPaid,
      Payment_Mode: item.paymentMode2,
      Status: getRegStatus(item),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], { type: "application/octet-stream" });

    saveAs(file, `registrations_${Date.now()}.xlsx`);
  };

  return (
    <div className="container-fluid mt-3">
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Header + Excel Button */}
      <div className="d-flex justify-content-between mb-3 flex-wrap gap-2">
        <h4 className="fw-bold">Registration Approval List</h4>

        <div className="d-flex gap-2">
          <button className="btn btn-success btn-sm fw-bold" onClick={downloadExcel}>
            📥 Download Excel
          </button>

          <button
            className="btn btn-danger fw-bold btn-sm"
            onClick={() => {
              localStorage.removeItem("registrarToken");
              localStorage.removeItem("registrarData");
              toast.success("Logged out");
              setTimeout(() => navigate("/"), 500);
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="row g-2 mb-3">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="Search Name / Email / Mobile / Region"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="col-md-3">
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-bordered table-striped text-center table-sm">
          <thead className="table-dark">
            <tr>
              <th>S.No</th>
              <th>Region</th>
              <th>Email</th>
              <th>Name</th>
              <th>Gender</th>
              <th>Age</th>
              <th>Mobile</th>
              <th>Recommended Role</th>
              <th>Recommender</th>
              <th>Amount</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredRecords.length ? (
              filteredRecords.map((item, i) => {
                const status = getRegStatus(item);
                const emailKey = item.email?.trim().toLowerCase();
                const nameKey = item.name?.trim().toLowerCase();
                const isDuplicate = duplicateMap[emailKey] > 1 || duplicateMap[nameKey] > 1;

                return (
                  <tr key={item._id} style={{ background: isDuplicate ? "#FFF29A" : "white" }}>
                    <td>{i + 1}</td>
                    <td>{item.region}</td>

                    <td>
                      {item.email}
                      {duplicateMap[emailKey] > 1 && (
                        <span className="badge bg-warning text-dark ms-1">Duplicate</span>
                      )}
                    </td>

                    <td>
                      {item.name}
                      {duplicateMap[nameKey] > 1 && (
                        <span className="badge bg-warning text-dark ms-1">Duplicate</span>
                      )}
                    </td>

                    <td>{item.gender || "-"}</td>
                    <td>{item.age}</td>
                    <td>{item.mobile}</td>
                    <td>{item.recommendedByRole}</td>
                    <td>{item.recommenderContact}</td>
                    <td>{item.amountPaid}</td>
                    <td>{item.paymentMode2}</td>

                    <td className="fw-bold">
                      {status === "approved" && <span className="text-success">Approved</span>}
                      {status === "rejected" && <span className="text-danger">Rejected</span>}
                      {status === "pending" && <span className="text-warning">Pending</span>}
                    </td>

                    <td>
                      <div className="d-flex gap-1 justify-content-center flex-wrap">
                        {status === "pending" && (
                          <>
                            <button className="btn btn-success btn-sm"
                              onClick={() => updateStatus(item._id, "approved")}
                            >Approve</button>

                            <button className="btn btn-danger btn-sm"
                              onClick={() => updateStatus(item._id, "rejected")}
                            >Reject</button>
                          </>
                        )}

                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => deleteRecord(item._id)}
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="12" className="text-danger fw-bold">
                  No Records Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
