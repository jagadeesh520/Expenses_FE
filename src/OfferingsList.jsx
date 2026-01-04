import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_ENDPOINTS } from "./constants";

export default function OfferingsList() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [filterRegion, setFilterRegion] = useState("all");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Filter to identify offerings
  const isOffering = (item) => {
    // Primary: Check if type field is "offering"
    if (item.type === "offering") {
      return true;
    }
    
    // Fallback 1: Check if fullName or name indicates non-registered offering
    const name = item.fullName || item.name || "";
    if (name === "Offering - Non-Registered") {
      return true;
    }
    
    // Fallback 2: Check if purpose field exists (offerings have this optional field)
    if (item.purpose) {
      return true;
    }
    
    // Fallback 3: Check if it has transactionId and amountPaid but lacks key registration-specific fields
    // Offerings have transactionId and amountPaid but typically don't have dtcAttended, iceuEgf, recommendedByRole, etc.
    const hasOfferingFields = item.transactionId && item.amountPaid;
    const lacksRegistrationFields = !item.dtcAttended && !item.iceuEgf && !item.recommendedByRole && !item.arrivalTime;
    
    if (hasOfferingFields && lacksRegistrationFields) {
      return true;
    }
    
    return false;
  };

  useEffect(() => {
    const registrarToken = localStorage.getItem("registrarToken");
    const adminToken = localStorage.getItem("adminToken");
    if (!registrarToken && !adminToken) {
      if (!adminToken) {
        navigate("/registrar-login");
      } else {
        navigate("/admin-login");
      }
      return;
    }
    
    fetchList();
  }, [navigate]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.REGISTRATIONS);
      const result = await res.json();
      
      if (result.success) {
        // Filter to show only offerings
        const offerings = result.data.filter(isOffering);
        console.log(`Found ${offerings.length} offerings out of ${result.data.length} total records`);
        
        // Enrich offerings with SPICON ID from registration data
        // Since backend doesn't return uniqueId/spiconId for offerings, we need to match them
        const enrichedOfferings = offerings.map((offering) => {
          // Try to find matching registration by email or name
          // Exclude offerings from the search (they don't have uniqueId)
          const matchingReg = result.data.find((reg) => {
            // Skip if this is also an offering
            if (isOffering(reg)) return false;
            
            // Match by email (most reliable)
            if (offering.email && reg.email && offering.email.toLowerCase() === reg.email.toLowerCase()) {
              return true;
            }
            // Match by fullName and mobile (backup)
            if (offering.fullName && reg.fullName && offering.mobile && reg.mobile) {
              return offering.fullName.trim().toLowerCase() === reg.fullName.trim().toLowerCase() &&
                     offering.mobile === reg.mobile;
            }
            return false;
          });
          
          // Add uniqueId from matching registration if found
          if (matchingReg && matchingReg.uniqueId) {
            return { ...offering, uniqueId: matchingReg.uniqueId, spiconId: matchingReg.uniqueId };
          }
          return offering;
        });
        
        setRecords(enrichedOfferings);
      } else {
        toast.error("Failed to load offerings");
      }
    } catch (err) {
      console.error("Error fetching offerings:", err);
      toast.error("Failed to load offerings");
    } finally {
      setLoading(false);
    }
  };

  // Search + Filter with region filtering
  const filteredRecords = records.filter((item) => {
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
        item.fullName?.toLowerCase().includes(s) ||
        item.email?.toLowerCase().includes(s) ||
        item.mobile?.includes(search) ||
        item.region?.toLowerCase().includes(s) ||
        item.uniqueId?.toLowerCase().includes(s) ||
        item.district?.toLowerCase().includes(s) ||
        item.transactionId?.toLowerCase().includes(s) ||
        item.purpose?.toLowerCase().includes(s));
    
    return matchesSearch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="container-fluid mt-3" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingBottom: "20px" }}>
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="fw-bold">
          Offering List
          {filterRegion !== "all" && <span className="text-primary ms-2">({filterRegion})</span>}
          {filterRegion === "all" && <span className="text-info ms-2">(All Regions)</span>}
        </h4>

        <div className="d-flex gap-2">
          <button
            className="btn btn-secondary fw-bold btn-sm px-3"
            onClick={() => {
              const registrarToken = localStorage.getItem("registrarToken");
              if (registrarToken) {
                navigate("/registrar-dashboard");
              } else {
                navigate("/admin-dashboard");
              }
            }}
          >
            <i className="bi bi-arrow-left me-1"></i>Back to Dashboard
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
        <div className="col-12 col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search Name / Email / Mobile / Transaction ID / SPICON ID / Purpose"
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
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading offerings...</p>
        </div>
      )}

      {/* Table with scrollable container */}
      {!loading && (
        <div className="table-responsive" style={{ 
          overflowY: "auto", 
          overflowX: "auto",
          maxHeight: "70vh",
          minHeight: "400px",
          border: "1px solid #dee2e6",
          borderRadius: "0.375rem"
        }}>
          <table className="table table-bordered table-striped align-middle text-center table-sm mb-0" style={{ minWidth: "1400px" }}>
            <thead className="table-dark" style={{ position: "sticky", top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ minWidth: "50px" }}>S.No</th>
                <th style={{ minWidth: "120px" }}>SPICON ID</th>
                <th style={{ minWidth: "100px" }}>Region</th>
                <th style={{ minWidth: "150px" }}>Full Name</th>
                <th style={{ minWidth: "180px" }}>Email</th>
                <th style={{ minWidth: "120px" }}>Mobile</th>
                <th style={{ minWidth: "120px" }}>District</th>
                <th style={{ minWidth: "150px" }}>Transaction ID</th>
                <th style={{ minWidth: "120px" }}>Paid Amount</th>
                <th style={{ minWidth: "120px" }}>Payment Date</th>
                <th style={{ minWidth: "200px" }}>Purpose</th>
                <th style={{ minWidth: "120px" }}>Payment Screenshot</th>
                <th style={{ minWidth: "180px" }}>Submitted Date</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.length ? (
                filteredRecords.map((item, i) => (
                  <tr key={item._id}>
                    <td>{i + 1}</td>
                    <td className="fw-bold text-primary">{item.uniqueId || item.spiconId || "N/A"}</td>
                    <td>{item.region || "-"}</td>
                    <td className="text-start">{item.name || item.fullName || "-"}</td>
                    <td className="text-break text-start">{item.email || "-"}</td>
                    <td>{item.mobile || "-"}</td>
                    <td>{item.district || "-"}</td>
                    <td className="text-break">{item.transactionId || "-"}</td>
                    <td className="text-success fw-bold">₹{Number(item.amountPaid || 0).toLocaleString()}</td>
                    <td>{formatDate(item.dateOfPayment)}</td>
                    <td className="text-start small">{item.purpose || "-"}</td>
                    <td>
                      {item.paymentScreenshot ? (
                        <a
                          href={`${API_ENDPOINTS.UPLOADS}/${encodeURIComponent(item.paymentScreenshot)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-info"
                          title="View Payment Screenshot"
                        >
                          <i className="bi bi-image me-1"></i>View Image
                        </a>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="small">{formatDateTime(item.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="13" className="text-danger fw-bold py-4">
                    {loading ? "Loading..." : `No Offerings Found ${filterRegion !== "all" ? `for ${filterRegion}` : ""}`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Count Display */}
      {!loading && (
        <div className="mt-2 text-muted small">
          Showing {filteredRecords.length} of {records.length} offering(s)
          {filterRegion !== "all" && ` (Filtered: ${filterRegion})`}
          {filterRegion === "all" && " (All Regions)"}
        </div>
      )}

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
        }
      `}</style>
    </div>
  );
}

