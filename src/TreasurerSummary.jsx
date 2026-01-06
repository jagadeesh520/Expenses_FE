import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_ENDPOINTS } from "./constants";
import { exportTableToExcel } from "./utils/exportUtils";

// Pricing function based on region and group type (from mobile app)
const getTotalAmount = (region, groupType, maritalStatus, spouseAttending) => {
  const regionLower = (region || "").toLowerCase();
  const groupTypeLower = (groupType || "").toLowerCase();

  // West Rayalaseema pricing
  if (regionLower.includes("west")) {
    if (groupTypeLower.includes("family")) {
      return 2500;
    } else if (groupTypeLower.includes("employed") && !groupTypeLower.includes("unemployed")) {
      return 1300; // Single Graduate (Employed)
    } else if (groupTypeLower.includes("unemployed") || groupTypeLower.includes("students")) {
      return 500; // Single Graduate (Unemployed) or Students
    } else if (groupTypeLower.includes("children") || groupTypeLower.includes("15+")) {
      return 500; // Graduates' children (15+)
    } else if (groupTypeLower.includes("volunteer")) {
      return 250; // Volunteers
    }
  }
  
  // East Rayalaseema pricing
  if (regionLower.includes("east")) {
    if (groupTypeLower.includes("family")) {
      // For East, check if spouse is attending to determine if it's doubled employed
      // If spouse is attending, it's likely doubled employed (₹2500)
      // Otherwise, single employed (₹2000)
      if (spouseAttending && spouseAttending.toLowerCase().includes("yes")) {
        return 2500; // Graduate Family (Doubled Employed)
      } else {
        return 2000; // Graduate Family (Single Employed)
      }
    } else if (groupTypeLower.includes("employed") && !groupTypeLower.includes("unemployed")) {
      return 1300; // Employed Graduate
    } else if (groupTypeLower.includes("unemployed") || groupTypeLower.includes("students")) {
      return 500; // Unemployed Graduate or Students
    } else if (groupTypeLower.includes("children") || groupTypeLower.includes("15+")) {
      return 500; // Children above 15 years
    } else if (groupTypeLower.includes("volunteer")) {
      return 200; // Volunteers
    }
  }

  // Default fallback
  return 0;
};

export default function TreasurerSummary() {
  const navigate = useNavigate();
  const location = useLocation();
  // Get region from location state, localStorage, or default to "all"
  const regionFromState = location.state?.region;
  const regionFromStorage = localStorage.getItem("treasurerSelectedRegion");
  const defaultRegion = regionFromState || regionFromStorage || "all";
  const [filterRegion, setFilterRegion] = useState(defaultRegion);
  const [paymentDetails, setPaymentDetails] = useState([]);
  const [filteredPaymentDetails, setFilteredPaymentDetails] = useState([]);
  const [summary, setSummary] = useState({
    totalAmount: 0,
    totalPaid: 0,
    balance: 0,
  });
  const [loading, setLoading] = useState(true);
  
  // Date filter state
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  // Sorting state
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc"); // "asc" or "desc"

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch all registrations
      const res = await fetch(API_ENDPOINTS.REGISTRATIONS);
      const result = await res.json();
      
      if (result.success) {
        let registrations = result.data || [];
        
        // Filter by selected region
        if (filterRegion !== "all") {
          registrations = registrations.filter((item) => {
            const itemRegion = (item.region || "").trim();
            return itemRegion === filterRegion;
          });
        }

        // Separate gifts from regular registrations
        const gifts = registrations.filter((reg) => reg.type === "gift");
        const regularRegistrations = registrations.filter((reg) => reg.type !== "gift");

        // Remove duplicates based on transactionId BEFORE calculating payment details
        // Keep the first occurrence of each unique transactionId
        const seenTransactionIds = new Set();
        const uniqueRegistrations = regularRegistrations.filter((reg) => {
          const txId = reg.transactionId?.trim();
          // If no transactionId, keep the record (can't deduplicate)
          if (!txId) {
            return true;
          }
          // If transactionId already seen, skip this record (duplicate)
          if (seenTransactionIds.has(txId)) {
            return false;
          }
          // Mark this transactionId as seen and keep the record
          seenTransactionIds.add(txId);
          return true;
        });
        
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TreasurerSummary.jsx:loadData',message:'Deduplication stats',data:{totalRegistrations:registrations.length,giftsCount:gifts.length,regularRegistrationsCount:regularRegistrations.length,uniqueRegistrations:uniqueRegistrations.length,duplicatesRemoved:regularRegistrations.length-uniqueRegistrations.length,filterRegion:filterRegion},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        // Calculate payment details for regular registrations
        const regularDetails = uniqueRegistrations.map((reg) => {
          const groupType = reg.groupType || "";
          const region = reg.region || "";
          const totalAmount = getTotalAmount(
            region,
            groupType,
            reg.maritalStatus,
            reg.spouseAttending
          );
          const amountPaid = reg.amountPaid || 0;
          const balance = Math.max(0, totalAmount - amountPaid);

          // Get payment date - prefer paymentDate, fallback to updatedAt, then createdAt
          const paymentDate = reg.paymentDate || reg.updatedAt || reg.createdAt || null;
          
          return {
            _id: reg._id,
            name: reg.name || reg.fullName || "N/A",
            uniqueId: reg.uniqueId || "N/A",
            groupType: groupType || "N/A",
            transactionId: reg.transactionId || null,
            paymentDate: paymentDate,
            totalAmount,
            amountPaid,
            balance,
          };
        });

        // Calculate payment details for gifts
        // For gifts: use amountPaid as both totalAmount and amountPaid (gifts don't have a calculated total)
        const giftDetails = gifts.map((gift) => {
          const amountPaid = gift.amountPaid || 0;
          // For gifts, the amount paid is both the total amount and the amount paid
          const totalAmount = amountPaid;
          const balance = 0; // Gifts are fully paid (no balance)

          // Get payment date - prefer paymentDate, fallback to updatedAt, then createdAt
          const paymentDate = gift.paymentDate || gift.updatedAt || gift.createdAt || null;
          
          return {
            _id: gift._id,
            name: gift.name || gift.fullName || "N/A",
            uniqueId: gift.uniqueId || "Gift",
            groupType: "Gift",
            transactionId: gift.transactionId || null,
            paymentDate: paymentDate,
            totalAmount,
            amountPaid,
            balance,
          };
        });

        // Combine regular registrations and gifts
        const details = [...regularDetails, ...giftDetails];
        
        // #region agent log
        const balanceSum = details.reduce((sum, item) => sum + item.balance, 0);
        const totalAmountSum = details.reduce((sum, item) => sum + item.totalAmount, 0);
        const totalPaidSum = details.reduce((sum, item) => sum + item.amountPaid, 0);
        const balanceBySubtraction = totalAmountSum - totalPaidSum;
        fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TreasurerSummary.jsx:balance-calculation',message:'Balance calculation comparison',data:{balanceSum:balanceSum,balanceBySubtraction:balanceBySubtraction,difference:balanceSum-balanceBySubtraction,totalAmountSum:totalAmountSum,totalPaidSum:totalPaidSum,recordCount:details.length},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'D'})}).catch(()=>{});
        // #endregion

        // Calculate summary totals from unique details
        const summaryData = {
          totalAmount: details.reduce((sum, item) => sum + item.totalAmount, 0),
          totalPaid: details.reduce((sum, item) => sum + item.amountPaid, 0),
          balance: details.reduce((sum, item) => sum + item.balance, 0),
        };
        
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/9124ad60-cfbd-485f-a462-1b026806f018',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TreasurerSummary.jsx:loadData',message:'Treasurer summary totals',data:{totalAmount:summaryData.totalAmount,totalPaid:summaryData.totalPaid,balance:summaryData.balance,recordCount:details.length,filterRegion:filterRegion},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
        // #endregion

        setPaymentDetails(details);
        setSummary(summaryData);
      } else {
        toast.error("Failed to load payment data");
      }
    } catch (err) {
      console.error("Error loading payment summary:", err);
      toast.error("Failed to load payment summary");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort payment details
  useEffect(() => {
    let filtered = [...paymentDetails];
    
    // Apply date filter
    if (dateFrom) {
      filtered = filtered.filter((item) => {
        if (!item.paymentDate) return false;
        const itemDate = new Date(item.paymentDate);
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        return itemDate >= fromDate;
      });
    }
    
    if (dateTo) {
      filtered = filtered.filter((item) => {
        if (!item.paymentDate) return false;
        const itemDate = new Date(item.paymentDate);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        return itemDate <= toDate;
      });
    }
    
    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];
        
        // Handle null/undefined values
        if (aVal === null || aVal === undefined) aVal = "";
        if (bVal === null || bVal === undefined) bVal = "";
        
        // Handle date strings
        if (sortField === "paymentDate" && aVal && bVal) {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }
        
        // Handle numbers
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        }
        
        // Handle strings
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        if (sortOrder === "asc") {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }
    
    setFilteredPaymentDetails(filtered);
  }, [paymentDetails, dateFrom, dateTo, sortField, sortOrder]);

  useEffect(() => {
    loadData();
  }, [filterRegion]);
  
  // Handle column sorting
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new sort field and default to ascending
      setSortField(field);
      setSortOrder("asc");
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch (e) {
      return "N/A";
    }
  };
  
  // Export to Excel
  const handleExportExcel = () => {
    const tableElement = document.getElementById("payment-details-table");
    if (tableElement) {
      exportTableToExcel(tableElement, "Treasurer_Payment_Details");
      toast.success("Excel file downloaded successfully!");
    } else {
      toast.error("Table not found for export");
    }
  };

  return (
    <div className="container-fluid mt-3" style={{ minHeight: "100vh", paddingBottom: "20px" }}>
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="fw-bold">
          Treasurer Summary
          {filterRegion !== "all" && <span className="text-primary ms-2">({filterRegion})</span>}
        </h4>
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

      {/* Filters */}
      <div className="row mb-3">
        <div className="col-12 col-md-3">
          <label htmlFor="regionFilter" className="form-label fw-bold">
            Filter by Region
          </label>
          <select
            id="regionFilter"
            className="form-select"
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
          >
            <option value="all">All Regions</option>
            <option value="East Rayalaseema">East Rayalaseema</option>
            <option value="West Rayalaseema">West Rayalaseema</option>
          </select>
        </div>
        <div className="col-12 col-md-3">
          <label htmlFor="dateFrom" className="form-label fw-bold">
            From Date
          </label>
          <input
            type="date"
            id="dateFrom"
            className="form-select"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="col-12 col-md-3">
          <label htmlFor="dateTo" className="form-label fw-bold">
            To Date
          </label>
          <input
            type="date"
            id="dateTo"
            className="form-select"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <div className="col-12 col-md-3 d-flex align-items-end">
          <button
            className="btn btn-secondary w-100"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
            }}
          >
            <i className="bi bi-x-circle me-1"></i>Clear Dates
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-lg">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-wallet2 me-2"></i>Payment Summary
              </h5>
            </div>
            <div className="card-body p-4">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading summary...</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="fs-5">Total Amount Expected:</span>
                      <span className="fs-4 fw-bold">₹{Number(summary.totalAmount || 0).toLocaleString()}</span>
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="fs-5">Total Paid:</span>
                      <span className="fs-4 fw-bold text-success">
                        ₹{Number(summary.totalPaid || 0).toLocaleString()}
                      </span>
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fs-5">Balance:</span>
                      <span
                        className={`fs-4 fw-bold ${
                          summary.balance === 0 ? "text-success" : "text-danger"
                        }`}
                      >
                        ₹{Number(summary.balance || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  {summary.totalAmount > 0 && (
                    <div className="mt-4">
                      <div className="d-flex justify-content-between mb-2">
                        <small className="text-muted">Payment Progress</small>
                        <small className="text-muted">
                          {Math.round((summary.totalPaid / summary.totalAmount) * 100)}%
                        </small>
                      </div>
                      <div className="progress" style={{ height: "25px" }}>
                        <div
                          className="progress-bar bg-success"
                          role="progressbar"
                          style={{
                            width: `${Math.min((summary.totalPaid / summary.totalAmount) * 100, 100)}%`,
                          }}
                          aria-valuenow={summary.totalPaid}
                          aria-valuemin="0"
                          aria-valuemax={summary.totalAmount}
                        >
                          {Math.round((summary.totalPaid / summary.totalAmount) * 100)}%
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Record Count */}
                  <div className="mt-3 text-muted small">
                    Showing {filteredPaymentDetails.length} of {paymentDetails.length} record(s)
                    {filterRegion !== "all" && ` (Region: ${filterRegion})`}
                    {(dateFrom || dateTo) && ` (Date filtered)`}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details Table */}
      {!loading && (
        <div className="row">
          <div className="col-12">
            <div className="card shadow-lg">
              <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-table me-2"></i>Payment Details
                </h5>
                <button
                  className="btn btn-light btn-sm"
                  onClick={handleExportExcel}
                  title="Download as Excel"
                >
                  <i className="bi bi-file-earmark-excel me-1"></i>Export Excel
                </button>
              </div>
              <div className="card-body p-0">
                <div
                  className="table-responsive"
                  style={{
                    maxHeight: "70vh",
                    overflowY: "auto",
                    overflowX: "auto",
                  }}
                >
                  <table id="payment-details-table" className="table table-bordered table-striped align-middle text-center table-sm mb-0">
                    <thead className="table-dark" style={{ position: "sticky", top: 0, zIndex: 10 }}>
                      <tr>
                        <th 
                          style={{ minWidth: "60px", cursor: "pointer" }}
                          onClick={() => handleSort(null)}
                        >
                          S.No
                        </th>
                        <th 
                          style={{ minWidth: "200px", cursor: "pointer" }}
                          onClick={() => handleSort("name")}
                        >
                          Name
                          {sortField === "name" && (
                            <i className={`bi bi-arrow-${sortOrder === "asc" ? "up" : "down"}-short ms-1`}></i>
                          )}
                        </th>
                        <th 
                          style={{ minWidth: "150px", cursor: "pointer" }}
                          onClick={() => handleSort("uniqueId")}
                        >
                          SPICON ID
                          {sortField === "uniqueId" && (
                            <i className={`bi bi-arrow-${sortOrder === "asc" ? "up" : "down"}-short ms-1`}></i>
                          )}
                        </th>
                        <th 
                          style={{ minWidth: "180px", cursor: "pointer" }}
                          onClick={() => handleSort("groupType")}
                        >
                          Category
                          {sortField === "groupType" && (
                            <i className={`bi bi-arrow-${sortOrder === "asc" ? "up" : "down"}-short ms-1`}></i>
                          )}
                        </th>
                        <th 
                          style={{ minWidth: "150px", cursor: "pointer" }}
                          onClick={() => handleSort("transactionId")}
                        >
                          Transaction ID
                          {sortField === "transactionId" && (
                            <i className={`bi bi-arrow-${sortOrder === "asc" ? "up" : "down"}-short ms-1`}></i>
                          )}
                        </th>
                        <th 
                          style={{ minWidth: "130px", cursor: "pointer" }}
                          onClick={() => handleSort("paymentDate")}
                        >
                          Payment Date
                          {sortField === "paymentDate" && (
                            <i className={`bi bi-arrow-${sortOrder === "asc" ? "up" : "down"}-short ms-1`}></i>
                          )}
                        </th>
                        <th 
                          style={{ minWidth: "130px", cursor: "pointer" }}
                          onClick={() => handleSort("totalAmount")}
                        >
                          Total Amount
                          {sortField === "totalAmount" && (
                            <i className={`bi bi-arrow-${sortOrder === "asc" ? "up" : "down"}-short ms-1`}></i>
                          )}
                        </th>
                        <th 
                          style={{ minWidth: "130px", cursor: "pointer" }}
                          onClick={() => handleSort("amountPaid")}
                        >
                          Amount Paid
                          {sortField === "amountPaid" && (
                            <i className={`bi bi-arrow-${sortOrder === "asc" ? "up" : "down"}-short ms-1`}></i>
                          )}
                        </th>
                        <th 
                          style={{ minWidth: "130px", cursor: "pointer" }}
                          onClick={() => handleSort("balance")}
                        >
                          Balance
                          {sortField === "balance" && (
                            <i className={`bi bi-arrow-${sortOrder === "asc" ? "up" : "down"}-short ms-1`}></i>
                          )}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPaymentDetails.length > 0 ? (
                        filteredPaymentDetails.map((item, index) => (
                          <tr key={item._id}>
                            <td>{index + 1}</td>
                            <td className="text-start">{item.name}</td>
                            <td className="fw-bold text-primary">{item.uniqueId}</td>
                            <td className="text-start small">{item.groupType}</td>
                            <td className="small">{item.transactionId || "N/A"}</td>
                            <td>{formatDate(item.paymentDate)}</td>
                            <td className="fw-bold">₹{Number(item.totalAmount).toLocaleString()}</td>
                            <td className="text-success fw-bold">
                              ₹{Number(item.amountPaid).toLocaleString()}
                            </td>
                            <td
                              className={`fw-bold ${
                                item.balance > 0 ? "text-danger" : "text-success"
                              }`}
                            >
                              ₹{Number(item.balance).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="10" className="text-center py-4 text-muted">
                            No payment records found
                            {filterRegion !== "all" && ` for ${filterRegion}`}
                            {(dateFrom || dateTo) && " for selected date range"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
