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
      const res = await fetch(
        "https://api.sjtechsol.com/api/cashier/registrations"
      );
      const result = await res.json();
      if (result.success) setRecords(result.data);
    } catch {
      toast.error("Failed to load registrations");
    }
  };
  const viewScreenshot = async (id) => {
    try {
      const res = await fetch(
        `https://api.sjtechsol.com/api/cashier/registrations/${id}/screenshot`
      );

      if (!res.ok) {
        alert("Unable to load screenshot");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      alert("Error loading screenshot");
    }
  };

  const deleteRecord = async (id) => {
    if (!window.confirm("Are you sure you want to delete this registration?"))
      return;

    try {
      const res = await fetch(
        `https://api.sjtechsol.com/api/cashier/registrations/${id}`,
        {
          method: "DELETE",
        }
      );

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
      Title: item.title,
      Full_Name: item.fullName,
      Surname: item.surname,
      Gender: item.gender,
      Age: item.age,
      Mobile: item.mobile,
      Marital: item.maritalStatus,
      DTC_Attended: item.dtcAttended,
      DTC_When: item.dtcWhen,
      DTC_Where: item.dtcWhere,
      District: item.district,
      ICEU_EGF: item.iceuEgf,
      Group_Type: item.groupType,
      Spouse_Attending: item.spouseAttending,
      Spouse_Name: item.spouseName,
      Child_Under_10_Count: item.childBelow10Count,
      Child_Under_10_Names: item.childBelow10Names,
      Child_10_14_Count: item.child10to14Count,
      Child_10_14_Names: item.child10to14Names,
      Total_Family_Members: item.totalFamilyMembers,
      Delegates_Other: item.delegatesOther,
      Recommended_Role: item.recommendedByRole,
      Recommender_Contact: item.recommenderContact,
      Amount_Paid: item.amountPaid,
      Payment_Mode: item.paymentMode2,
      Date_of_Payment: item.dateOfPayment,
      Transaction_ID: item.transactionId,
      Screenshot_URL: item.paymentScreenshot,
      Arrival_Day: item.arrivalDay,
      Arrival_Time: item.arrivalTime,
      TotalAmount: item.totalAmount,
      Balance: item.balance,
      Payment_Status: item.status,
      Registration_Status: item.registrationStatus,
      Created_At: item.createdAt,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Registrations");
    saveAs(
      new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })]),
      `registrations_${Date.now()}.xlsx`
    );
  };

  return (
    <div className="container-fluid mt-3">
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Header + Excel Button */}
      <div className="d-flex justify-content-between mb-3 flex-wrap gap-2">
        <h4 className="fw-bold">Registration Approval List</h4>

        <div className="d-flex gap-2">
          <button
            className="btn btn-success btn-sm fw-bold"
            onClick={downloadExcel}
          >
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
              <th>Marital</th>
              <th>DTC Attended</th>
              <th>DTC When</th>
              <th>DTC Where</th>
              <th>District</th>
              <th>ICEU/EGF</th>
              <th>Group Type</th>
              <th>Spouse Attending</th>
              <th>Spouse Name</th>
              <th>Child 10 Count</th>
              <th>Child 10 Names</th>
              <th>Child 10-14 Count</th>
              <th>Child 10-14 Names</th>
              <th>Total Family Members</th>
              <th>Delegates Other</th>
              {/* Payment Related & Recommender */}
              <th>Recommended Role</th>
              <th>Recommender Contact</th> {/* <--- FIXED */}
              <th>Amount Paid</th>
              <th>Payment Mode</th>
              <th>Date Payment</th>
              <th>Transaction ID</th>
              <th>Screenshot</th>
              {/* Arrival */}
              <th>Arrival Day</th>
              <th>Arrival Time</th>
              {/* Calculation & Status */}
              <th>Balance Amount</th>
              <th>Payment Status</th>
              <th>Registration Status</th>
              <th>Created At</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredRecords.map((item, i) => {
              const emailDup = duplicateMap[item.email?.toLowerCase()] > 1;
              const nameDup = duplicateMap[item.name?.toLowerCase()] > 1;

              return (
                <tr
                  key={item._id}
                  style={{
                    background: emailDup || nameDup ? "#FFF5A1" : "white",
                  }}
                >
                  <td>{i + 1}</td>
                  <td>{item.region}</td>

                  <td>
                    {item.email}
                    {emailDup && (
                      <span className="badge bg-warning text-dark ms-1">
                        Duplicate
                      </span>
                    )}
                  </td>

                  <td>
                    {item.name}
                    {nameDup && (
                      <span className="badge bg-warning text-dark ms-1">
                        Duplicate
                      </span>
                    )}
                  </td>

                  <td>{item.gender}</td>
                  <td>{item.age}</td>
                  <td>{item.mobile}</td>
                  <td>{item.maritalStatus}</td>
                  <td>{item.dtcAttended}</td>
                  <td>{item.dtcWhen}</td>
                  <td>{item.dtcWhere}</td>
                  <td>{item.district}</td>
                  <td>{item.iceuEgf}</td>
                  <td>{item.groupType}</td>
                  <td>{item.spouseAttending}</td>
                  <td>{item.spouseName}</td>
                  <td>{item.childBelow10Count}</td>
                  <td>{item.childBelow10Names}</td>
                  <td>{item.child10to14Count}</td>
                  <td>{item.child10to14Names}</td>
                  <td>{item.totalFamilyMembers}</td>
                  <td>{item.delegatesOther}</td>

                  <td>{item.recommendedByRole}</td>
                  <td>{item.recommenderContact}</td>

                  <td>{item.amountPaid}</td>
                  <td>{item.paymentMode2}</td>
                  <td>{item.dateOfPayment}</td>
                  <td>{item.transactionId}</td>

                  <td>
                    {item.paymentScreenshot ? (
                      <button
                        className="btn btn-link btn-sm"
                        onClick={() => viewScreenshot(item._id)}
                      >
                        View
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td>{item.arrivalDay}</td>
                  <td>{item.arrivalTime}</td>
                  <td>{item.totalAmount}</td>
                  <td>{item.status}</td>
                  <td>{item.registrationStatus}</td>
                  <td>{new Date(item.createdAt).toLocaleString()}</td>

                  <td>
                    {getRegStatus(item) === "pending" && (
                      <>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => updateStatus(item._id, "approved")}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-danger btn-sm ms-1"
                          onClick={() => updateStatus(item._id, "rejected")}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      className="btn btn-outline-danger btn-sm ms-1"
                      onClick={() => deleteRecord(item._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
