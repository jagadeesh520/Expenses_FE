import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_ENDPOINTS } from "./constants";
import { exportTableToExcel, exportTableToPDF } from "./utils/exportUtils";

export default function RegistrationList() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRegion, setFilterRegion] = useState("all"); // Filter for region dropdown
  const navigate = useNavigate();

  // 🔹 Get final status safely
  const getRegStatus = (item) => {
    if (item.registrationStatus) return item.registrationStatus;
    const lastTx = item.transactions?.[item.transactions.length - 1]?.status;
    return lastTx || "pending";
  };

  useEffect(() => {
    const registrarToken = localStorage.getItem("registrarToken");
    const adminToken = localStorage.getItem("adminToken");
    if (!registrarToken && !adminToken) {
      // Redirect to appropriate login
      if (!adminToken) {
        navigate("/registrar-login");
      } else {
        navigate("/admin-login");
      }
      return;
    }
    
    // Load all registrations (both regions)
    fetchList();
  }, []);

  const fetchList = async () => {
    try {
      // Fetch all registrations (both regions)
      const res = await fetch(API_ENDPOINTS.REGISTRATIONS);
      const result = await res.json();
      if (result.success) {
        console.log(`Received ${result.data.length} total registrations from API`);
        // #region agent log
        const giftsCount = result.data.filter((item) => item.type === "gift" || (!item.uniqueId && !item.dtcAttended && !item.recommendedByRole && !item.arrivalTime && item.transactionId && item.amountPaid)).length;
        fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrationList.jsx:fetchList',message:'Registrations fetched',data:{totalRecords:result.data.length,giftsCount:giftsCount,firstRecordType:result.data[0]?.type,firstRecordHasUniqueId:!!result.data[0]?.uniqueId},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        setRecords(result.data);
      }
    } catch (err) {
      console.error("Error fetching registrations:", err);
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

  // Helper function to identify gifts (same logic as OfferingsList.jsx)
  const isGift = (item) => {
    // #region agent log
    const checkResults = {
      hasTypeGift: item.type === "gift",
      typeValue: item.type,
      fullName: item.fullName || item.name || "",
      hasPurpose: !!item.purpose,
      hasTransactionId: !!item.transactionId,
      hasAmountPaid: !!item.amountPaid,
      hasUniqueId: !!item.uniqueId,
      hasDtcAttended: !!item.dtcAttended,
      hasRecommendedByRole: !!item.recommendedByRole,
      hasArrivalTime: !!item.arrivalTime
    };
    // #endregion

    // Primary: Check if type field is "gift"
    if (item.type === "gift") {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrationList.jsx:isGift',message:'Gift identified by type field',data:{...checkResults,result:true,reason:'type===gift'},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return true;
    }
    
    // Fallback 1: Check if fullName or name indicates non-registered gift
    const name = item.fullName || item.name || "";
    if (name === "Gift - Non-Registered") {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrationList.jsx:isGift',message:'Gift identified by name pattern',data:{...checkResults,result:true,reason:'name===Gift - Non-Registered'},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return true;
    }
    
    // Fallback 2: Check if purpose field exists (gifts have this optional field)
    if (item.purpose) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrationList.jsx:isGift',message:'Gift identified by purpose field',data:{...checkResults,result:true,reason:'hasPurpose'},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return true;
    }
    
    // Fallback 3: Check if it has transactionId and amountPaid but lacks key registration-specific fields
    // Gifts have transactionId and amountPaid but typically don't have dtcAttended, recommendedByRole, arrivalTime, uniqueId
    const hasGiftFields = item.transactionId && item.amountPaid;
    const lacksRegistrationFields = !item.uniqueId && !item.dtcAttended && !item.recommendedByRole && !item.arrivalTime;
    
    if (hasGiftFields && lacksRegistrationFields) {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrationList.jsx:isGift',message:'Gift identified by field pattern',data:{...checkResults,result:true,reason:'hasGiftFields&&lacksRegistrationFields'},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return true;
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RegistrationList.jsx:isGift',message:'Not identified as gift',data:{...checkResults,result:false,reason:'noMatch'},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    return false;
  };

  // Search + Filter with region and status filtering
  const filteredRecords = records.filter((item) => {
    // Exclude gifts from registrar approval list (gifts don't need approval)
    if (isGift(item)) {
      return false;
    }
    
    // Filter by selected region
    if (filterRegion !== "all") {
      const itemRegion = (item.region || "").trim();
      const targetRegion = filterRegion.trim();
      if (itemRegion !== targetRegion) {
        return false;
      }
    }
    
    // Filter by search term
    const s = search.toLowerCase();
    const matchesSearch = 
      (item.name?.toLowerCase().includes(s) ||
        item.email?.toLowerCase().includes(s) ||
        item.mobile?.includes(search) ||
        item.region?.toLowerCase().includes(s) ||
        item.uniqueId?.toLowerCase().includes(s) ||
        item.district?.toLowerCase().includes(s) ||
        item.groupType?.toLowerCase().includes(s));
    
    // Filter by status
    const status = getRegStatus(item);
    const matchesStatus = (filterStatus === "all" || filterStatus === status);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container-fluid mt-3" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingBottom: "20px" }}>
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="fw-bold">
          Registration Approval List
          {filterRegion !== "all" && <span className="text-primary ms-2">({filterRegion})</span>}
          {filterRegion === "all" && <span className="text-info ms-2">(All Regions)</span>}
        </h4>

        <div className="d-flex gap-2 flex-wrap">
          <button
            className="btn btn-success fw-bold btn-sm px-3"
            onClick={() => {
              const tableElement = document.getElementById("registrations-table");
              if (tableElement) {
                exportTableToExcel(tableElement, "Registrations_Approval_List");
                toast.success("Excel file downloaded successfully!");
              } else {
                toast.error("Table not found");
              }
            }}
            title="Download as Excel"
          >
            <i className="bi bi-file-earmark-excel me-1"></i>Excel
          </button>
          <button
            className="btn btn-danger fw-bold btn-sm px-3"
            onClick={() => {
              const tableElement = document.getElementById("registrations-table");
              if (tableElement) {
                exportTableToPDF(tableElement, "Registrations_Approval_List", "Registrations Approval List");
                toast.success("PDF file downloaded successfully!");
              } else {
                toast.error("Table not found");
              }
            }}
            title="Download as PDF"
          >
            <i className="bi bi-file-earmark-pdf me-1"></i>PDF
          </button>
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
              localStorage.removeItem("adminToken");
              localStorage.removeItem("adminData");
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
            placeholder="Search Name / Email / Mobile / Region / ID / District"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="col-12 col-md-3">
          <select className="form-select" value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}>
            <option value="all">All Regions</option>
            <option value="East Rayalaseema">East Rayalaseema</option>
            <option value="West Rayalaseema">West Rayalaseema</option>
          </select>
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

      {/* Table with scrollable container */}
      <div className="table-responsive" style={{ 
        overflowY: "auto", 
        overflowX: "auto",
        maxHeight: "70vh",
        minHeight: "400px",
        border: "1px solid #dee2e6",
        borderRadius: "0.375rem"
      }}>
        <table id="registrations-table" className="table table-bordered table-striped align-middle text-center table-sm mb-0" style={{ minWidth: "2000px" }}>
          <thead className="table-dark" style={{ position: "sticky", top: 0, zIndex: 10 }}>
            <tr>
              <th style={{ minWidth: "50px" }}>S.No</th>
              <th style={{ minWidth: "120px" }}>Reg ID</th>
              <th style={{ minWidth: "100px" }}>Region</th>
              <th style={{ minWidth: "80px" }}>Title</th>
              <th style={{ minWidth: "150px" }}>Full Name</th>
              <th style={{ minWidth: "100px" }}>Gender</th>
              <th style={{ minWidth: "60px" }}>Age</th>
              <th style={{ minWidth: "180px" }}>Email</th>
              <th style={{ minWidth: "120px" }}>Mobile</th>
              <th style={{ minWidth: "100px" }}>Marital Status</th>
              <th style={{ minWidth: "120px" }}>District</th>
              <th style={{ minWidth: "120px" }}>ICEF/EGF</th>
              <th style={{ minWidth: "120px" }}>Group Type</th>
              <th style={{ minWidth: "100px" }}>DTC Attended</th>
              <th style={{ minWidth: "120px" }}>DTC When</th>
              <th style={{ minWidth: "150px" }}>DTC Where</th>
              <th style={{ minWidth: "120px" }}>Recommended By</th>
              <th style={{ minWidth: "120px" }}>Recommender Contact</th>
              <th style={{ minWidth: "100px" }}>Spouse Attending</th>
              <th style={{ minWidth: "150px" }}>Spouse Name</th>
              <th style={{ minWidth: "80px" }}>Children &lt;10</th>
              <th style={{ minWidth: "200px" }}>Children &lt;10 Names</th>
              <th style={{ minWidth: "80px" }}>Children 10-14</th>
              <th style={{ minWidth: "200px" }}>Children 10-14 Names</th>
              <th style={{ minWidth: "100px" }}>Total Family</th>
              <th style={{ minWidth: "120px" }}>Other Delegates</th>
              <th style={{ minWidth: "120px" }}>Arrival Day</th>
              <th style={{ minWidth: "120px" }}>Arrival Time</th>
              <th style={{ minWidth: "120px" }}>Amount Paid</th>
              <th style={{ minWidth: "100px" }}>Payment Mode</th>
              <th style={{ minWidth: "120px" }}>Payment Date</th>
              <th style={{ minWidth: "150px" }}>Transaction ID</th>
              <th style={{ minWidth: "120px" }}>Payment Screenshot</th>
              <th style={{ minWidth: "100px" }}>Status</th>
              <th style={{ minWidth: "150px" }}>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredRecords.length ? (
              filteredRecords.map((item, i) => {
                const status = getRegStatus(item);
                return (
                  <tr key={item._id}>
                    <td>{i + 1}</td>
                    <td className="fw-bold text-primary">{item.uniqueId || "-"}</td>
                    <td>{item.region || "-"}</td>
                    <td>{item.title || "-"}</td>
                    <td className="text-start">{item.name || item.fullName || "-"}</td>
                    <td>{item.gender || "-"}</td>
                    <td>{item.age || "-"}</td>
                    <td className="text-break text-start">{item.email || "-"}</td>
                    <td>{item.mobile || "-"}</td>
                    <td>{item.maritalStatus || "-"}</td>
                    <td>{item.district || "-"}</td>
                    <td>{item.iceuEgf || "-"}</td>
                    <td><span className="badge bg-info">{item.groupType || "-"}</span></td>
                    <td>{item.dtcAttended || "-"}</td>
                    <td>{item.dtcWhen || "-"}</td>
                    <td className="text-start">{item.dtcWhere || "-"}</td>
                    <td>{item.recommendedByRole || "-"}</td>
                    <td>{item.recommenderContact || "-"}</td>
                    <td>{item.spouseAttending || "-"}</td>
                    <td className="text-start">{item.spouseName || "-"}</td>
                    <td>{item.childBelow10Count || "-"}</td>
                    <td className="text-start small">{item.childBelow10Names || "-"}</td>
                    <td>{item.child10to14Count || "-"}</td>
                    <td className="text-start small">{item.child10to14Names || "-"}</td>
                    <td>{item.totalFamilyMembers || "-"}</td>
                    <td className="text-start">{item.delegatesOther || "-"}</td>
                    <td>{item.arrivalDay || "-"}</td>
                    <td>{item.arrivalTime || "-"}</td>
                    <td className="text-success fw-bold">₹{item.amountPaid || 0}</td>
                    <td>{item.paymentMode2 || "-"}</td>
                    <td>{item.dateOfPayment || "-"}</td>
                    <td className="text-break">{item.transactionId || "-"}</td>
                    <td>
                      {item.paymentScreenshot ? (
                        <a
                          href={`${API_ENDPOINTS.UPLOADS}/${encodeURIComponent(item.paymentScreenshot)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-info"
                          title="View Payment Screenshot"
                        >
                          View Image
                        </a>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge fw-bold ${
                          status === "approved" ? "bg-success" : status === "rejected" ? "bg-danger" : "bg-warning"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1 justify-content-center flex-wrap">
                        {status === "approved" && (
                          <button className="btn btn-success rounded-circle btn-sm" disabled title="Approved">
                            ✓
                          </button>
                        )}
                        {status === "rejected" && (
                          <button className="btn btn-danger rounded-circle btn-sm" disabled title="Rejected">
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
                <td colSpan="34" className="text-danger fw-bold py-4">
                  No Records Found {filterRegion !== "all" && `for ${filterRegion}`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Count Display */}
      <div className="mt-2 text-muted small">
        Showing {filteredRecords.length} of {records.length} registration(s)
        {filterRegion !== "all" && ` (Filtered: ${filterRegion})`}
        {filterRegion === "all" && " (All Regions)"}
      </div>

      {/* Mobile Styling */}
      <style>{`
        .table-responsive {
          position: relative;
        }
        .table-responsive::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .table-responsive::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .table-responsive::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        .table-responsive::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
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
