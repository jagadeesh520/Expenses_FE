import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "./constants";
import { getTotalAmount } from "./utils/pricingUtils";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { exportTableToExcel, exportTableToPDF } from "./utils/exportUtils";

export default function PaymentAbstract() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [registrations, setRegistrations] = useState([]);
  const [payments, setPayments] = useState([]);

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
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [regRes, payRes] = await Promise.all([
        fetch(API_ENDPOINTS.REGISTRATIONS),
        fetch(API_ENDPOINTS.PAYMENTS_LIST)
      ]);

      const regData = await regRes.json();
      const payData = await payRes.json();

      if (regData.success) {
        setRegistrations(regData.data || []);
      }
      if (payData.success) {
        setPayments(payData.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Export handler functions
  const handleExportExcel = (tableId, tableName) => {
    const tableElement = document.getElementById(tableId);
    if (tableElement) {
      exportTableToExcel(tableElement, tableName);
    }
  };

  const handleExportPDF = (tableId, tableName, title) => {
    const tableElement = document.getElementById(tableId);
    if (tableElement) {
      exportTableToPDF(tableElement, tableName, title);
    }
  };

  // Helper function to categorize groupType
  const getCategoryKey = (groupType) => {
    if (!groupType) return "Unknown";
    const gt = groupType.toLowerCase();
    if (gt.includes("family")) return "Family";
    if (gt.includes("employed") && !gt.includes("unemployed")) return "Single Graduate (Employed)";
    if (gt.includes("unemployed")) return "Single Graduate (Unemployed)";
    if (gt.includes("children") || gt.includes("15+")) return "Graduates' children (15+)";
    if (gt.includes("student")) return "Students";
    if (gt.includes("volunteer")) return "Volunteers";
    return groupType;
  };

  // Helper function to initialize category counts
  const initCategoryCounts = () => ({
    "Family": 0,
    "Single Graduate (Employed)": 0,
    "Single Graduate (Unemployed)": 0,
    "Graduates' children (15+)": 0,
    "Students": 0,
    "Volunteers": 0,
    "Unknown": 0
  });

  // Filter data by selected region
  const filteredRegistrations = registrations.filter((reg) => {
    if (selectedRegion === "all") return true;
    const regRegion = (reg.region || "").trim();
    return regRegion === selectedRegion;
  });

  // Remove duplicate payments based on transactionId
  const uniquePayments = payments.reduce((acc, payment) => {
    const txId = payment.transactionId?.trim();
    if (!txId) return acc;
    if (acc.find(p => p.transactionId?.trim() === txId)) {
      return acc;
    }
    acc.push(payment);
    return acc;
  }, []);

  // Filter unique payments by region
  const filteredPayments = uniquePayments.filter((payment) => {
    if (selectedRegion === "all") return true;
    const payRegion = (payment.region || "").trim();
    return payRegion === selectedRegion;
  });

  // All-Districts Abstract with category counts
  const districtAbstract = filteredRegistrations.reduce((acc, reg) => {
    const district = reg.district || "Unknown";
    const category = getCategoryKey(reg.groupType);
    
    if (!acc[district]) {
      acc[district] = {
        count: 0,
        totalExpected: 0,
        totalPaid: 0,
        categories: initCategoryCounts(),
        totalPeople: 0
      };
    }
    acc[district].count += 1;
    
    // Count category
    if (acc[district].categories[category] !== undefined) {
      acc[district].categories[category] += 1;
    } else {
      acc[district].categories[category] = 1;
    }

    // Count total people
    if (category === "Family" && reg.totalFamilyMembers) {
      const familyCount = parseInt(reg.totalFamilyMembers) || 0;
      acc[district].totalPeople += familyCount;
    } else {
      acc[district].totalPeople += 1;
    }
    
    // Calculate expected amount
    const expected = getTotalAmount(
      reg.region,
      reg.groupType,
      reg.maritalStatus,
      reg.spouseAttending
    );
    acc[district].totalExpected += expected;
    
    // Get paid amount from payment record
    const payment = filteredPayments.find(p => {
      if (reg.transactionId && p.transactionId) {
        return reg.transactionId.trim() === p.transactionId.trim();
      }
      if (reg.email && p.email) {
        return reg.email.trim().toLowerCase() === p.email.trim().toLowerCase();
      }
      if (reg.name && reg.mobile && p.name && p.mobile) {
        return (reg.name.trim().toLowerCase() === p.name.trim().toLowerCase() ||
                reg.fullName?.trim().toLowerCase() === p.name?.trim().toLowerCase() ||
                reg.name === p.fullName) &&
               reg.mobile.trim() === p.mobile.trim();
      }
      return false;
    });
    if (payment && payment.amountPaid) {
      acc[district].totalPaid += Number(payment.amountPaid) || 0;
    }

    return acc;
  }, {});

  // District-wise Payment Collection with category counts
  const districtPaymentStats = filteredPayments.reduce((acc, payment) => {
    const district = payment.district || "Unknown";
    const category = getCategoryKey(payment.groupType);
    
    if (!acc[district]) {
      acc[district] = {
        amount: 0,
        categories: initCategoryCounts(),
        totalPeople: 0
      };
    }
    acc[district].amount += Number(payment.amountPaid) || 0;
    
    // Count category
    if (acc[district].categories[category] !== undefined) {
      acc[district].categories[category] += 1;
    } else {
      acc[district].categories[category] = 1;
    }

    // Find matching registration to get totalFamilyMembers
    const matchingReg = filteredRegistrations.find(reg => {
      if (reg.transactionId && payment.transactionId) {
        return reg.transactionId.trim() === payment.transactionId.trim();
      }
      if (reg.email && payment.email) {
        return reg.email.trim().toLowerCase() === payment.email.trim().toLowerCase();
      }
      if (reg.name && reg.mobile && payment.name && payment.mobile) {
        return (reg.name.trim().toLowerCase() === payment.name.trim().toLowerCase() ||
                reg.fullName?.trim().toLowerCase() === payment.name?.trim().toLowerCase() ||
                reg.name === payment.fullName) &&
               reg.mobile.trim() === payment.mobile.trim();
      }
      return false;
    });

    if (category === "Family" && matchingReg && matchingReg.totalFamilyMembers) {
      const familyCount = parseInt(matchingReg.totalFamilyMembers) || 0;
      acc[district].totalPeople += familyCount;
    } else {
      acc[district].totalPeople += 1;
    }
    
    return acc;
  }, {});

  // Category-wise/Group-wise Amount Summary
  const categoryStats = filteredPayments.reduce((acc, payment) => {
    const category = payment.groupType || "Unknown";
    if (!acc[category]) {
      acc[category] = {
        count: 0,
        collected: 0,
        expected: 0
      };
    }
    acc[category].count += 1;
    acc[category].collected += Number(payment.amountPaid) || 0;
    
    // Calculate expected based on registration data
    const reg = filteredRegistrations.find(r => {
      if (r.transactionId && payment.transactionId) {
        return r.transactionId.trim() === payment.transactionId.trim();
      }
      if (r.email && payment.email) {
        return r.email.trim().toLowerCase() === payment.email.trim().toLowerCase();
      }
      if (r.name && r.mobile && payment.name && payment.mobile) {
        return (r.name.trim().toLowerCase() === payment.name.trim().toLowerCase() ||
                r.fullName?.trim().toLowerCase() === payment.name?.trim().toLowerCase() ||
                r.name === payment.fullName) &&
               r.mobile.trim() === payment.mobile.trim();
      }
      return false;
    });
    if (reg) {
      const expected = getTotalAmount(
        reg.region,
        reg.groupType,
        reg.maritalStatus,
        reg.spouseAttending
      );
      acc[category].expected += expected;
    } else {
      acc[category].expected += Number(payment.totalAmount) || 0;
    }

    return acc;
  }, {});

  // Overall Payment Abstract
  const totalExpected = filteredRegistrations.reduce((sum, reg) => {
    return sum + getTotalAmount(
      reg.region,
      reg.groupType,
      reg.maritalStatus,
      reg.spouseAttending
    );
  }, 0);

  const totalCollected = filteredPayments.reduce(
    (sum, p) => sum + (Number(p.amountPaid) || 0),
    0
  );

  const totalPending = totalExpected - totalCollected;
  const collectionPercentage = totalExpected > 0 
    ? ((totalCollected / totalExpected) * 100).toFixed(2) 
    : 0;

  if (loading) {
    return (
      <div className="container-fluid mt-4 text-center" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div>
          <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-3" style={{ minHeight: "100vh", paddingBottom: "20px" }}>
      <ToastContainer position="top-right" autoClose={2000} />
      
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <h3 className="fw-bold m-0">Payment Abstract</h3>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => navigate("/statistics")}
          >
            ← Back to Statistics
          </button>
        </div>
      </div>

      {/* Region Filter */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <label className="form-label fw-bold mb-2">Filter by Region:</label>
          <select
            className="form-select form-select-lg"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            style={{ maxWidth: "300px" }}
          >
            <option value="all">All Regions</option>
            <option value="West Rayalaseema">West Rayalaseema</option>
            <option value="East Rayalaseema">East Rayalaseema</option>
          </select>
        </div>
      </div>

      {/* Overall Payment Abstract Card */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-3">
          <div className="card text-center shadow-sm" style={{ borderTop: "4px solid #0d6efd" }}>
            <div className="card-body">
              <h6 className="text-muted mb-2">Total Expected</h6>
              <h4 className="fw-bold text-primary">₹{totalExpected.toLocaleString()}</h4>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card text-center shadow-sm" style={{ borderTop: "4px solid #198754" }}>
            <div className="card-body">
              <h6 className="text-muted mb-2">Total Collected</h6>
              <h4 className="fw-bold text-success">₹{totalCollected.toLocaleString()}</h4>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card text-center shadow-sm" style={{ borderTop: "4px solid #dc3545" }}>
            <div className="card-body">
              <h6 className="text-muted mb-2">Total Pending</h6>
              <h4 className="fw-bold text-danger">₹{totalPending.toLocaleString()}</h4>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card text-center shadow-sm" style={{ borderTop: "4px solid #ffc107" }}>
            <div className="card-body">
              <h6 className="text-muted mb-2">Collection %</h6>
              <h4 className="fw-bold text-warning">{collectionPercentage}%</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Statistics */}
      <div className="row g-4 mb-4">
        {/* All-Districts Abstract */}
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">All-Districts Abstract</h5>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-light"
                  onClick={() => handleExportExcel('all-districts-table', 'All_Districts_Abstract')}
                  title="Download as Excel"
                >
                  <i className="bi bi-file-earmark-excel me-1"></i>Excel
                </button>
                <button
                  className="btn btn-sm btn-light"
                  onClick={() => handleExportPDF('all-districts-table', 'All_Districts_Abstract', 'All-Districts Abstract')}
                  title="Download as PDF"
                >
                  <i className="bi bi-file-earmark-pdf me-1"></i>PDF
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table id="all-districts-table" className="table table-bordered table-striped">
                  <thead className="table-light">
                    <tr>
                      <th>District</th>
                      <th>Total Registrations</th>
                      <th>Family</th>
                      <th>Single Graduate (Employed)</th>
                      <th>Single Graduate (Unemployed)</th>
                      <th>Graduates' children (15+)</th>
                      <th>Students</th>
                      <th>Volunteers</th>
                      <th className="bg-info text-white">Total People Attending</th>
                      <th>Total Expected (₹)</th>
                      <th>Total Paid (₹)</th>
                      <th>Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(districtAbstract).length > 0 ? (
                      Object.entries(districtAbstract)
                        .sort((a, b) => b[1].count - a[1].count)
                        .map(([district, data]) => (
                          <tr key={district}>
                            <td className="fw-bold">{district}</td>
                            <td>{data.count}</td>
                            <td>{data.categories["Family"] || 0}</td>
                            <td>{data.categories["Single Graduate (Employed)"] || 0}</td>
                            <td>{data.categories["Single Graduate (Unemployed)"] || 0}</td>
                            <td>{data.categories["Graduates' children (15+)"] || 0}</td>
                            <td>{data.categories["Students"] || 0}</td>
                            <td>{data.categories["Volunteers"] || 0}</td>
                            <td className="fw-bold bg-light">{data.totalPeople || 0}</td>
                            <td>₹{data.totalExpected.toLocaleString()}</td>
                            <td className="text-success">₹{data.totalPaid.toLocaleString()}</td>
                            <td className={data.totalExpected - data.totalPaid > 0 ? "text-danger" : "text-success"}>
                              ₹{(data.totalExpected - data.totalPaid).toLocaleString()}
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="12" className="text-center text-muted">No data available</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="table-dark">
                    <tr>
                      <td className="fw-bold">TOTAL</td>
                      <td className="fw-bold">{filteredRegistrations.length}</td>
                      <td className="fw-bold">-</td>
                      <td className="fw-bold">-</td>
                      <td className="fw-bold">-</td>
                      <td className="fw-bold">-</td>
                      <td className="fw-bold">-</td>
                      <td className="fw-bold">-</td>
                      <td className="fw-bold bg-info">-</td>
                      <td className="fw-bold">₹{totalExpected.toLocaleString()}</td>
                      <td className="fw-bold">₹{totalCollected.toLocaleString()}</td>
                      <td className="fw-bold">₹{totalPending.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* District-wise Amount Collection */}
        <div className="col-12 col-md-6">
          <div className="card shadow-sm">
            <div className="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
              <h5 className="mb-0">District-wise Amount Collection</h5>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => handleExportExcel('district-collection-table', 'District_wise_Amount_Collection')}
                  title="Download as Excel"
                >
                  <i className="bi bi-file-earmark-excel me-1"></i>Excel
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleExportPDF('district-collection-table', 'District_wise_Amount_Collection', 'District-wise Amount Collection')}
                  title="Download as PDF"
                >
                  <i className="bi bi-file-earmark-pdf me-1"></i>PDF
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table id="district-collection-table" className="table table-bordered table-striped table-sm">
                  <thead className="table-light">
                    <tr>
                      <th>District</th>
                      <th>Amount Collected (₹)</th>
                      <th>Family</th>
                      <th>Single Graduate (Employed)</th>
                      <th>Single Graduate (Unemployed)</th>
                      <th>Graduates' children (15+)</th>
                      <th>Students</th>
                      <th>Volunteers</th>
                      <th className="bg-info text-white">Total People Attending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(districtPaymentStats).length > 0 ? (
                      Object.entries(districtPaymentStats)
                        .sort((a, b) => (b[1].amount || 0) - (a[1].amount || 0))
                        .map(([district, data]) => (
                          <tr key={district}>
                            <td className="fw-bold">{district}</td>
                            <td className="text-success">₹{(data.amount || 0).toLocaleString()}</td>
                            <td>{data.categories ? (data.categories["Family"] || 0) : 0}</td>
                            <td>{data.categories ? (data.categories["Single Graduate (Employed)"] || 0) : 0}</td>
                            <td>{data.categories ? (data.categories["Single Graduate (Unemployed)"] || 0) : 0}</td>
                            <td>{data.categories ? (data.categories["Graduates' children (15+)"] || 0) : 0}</td>
                            <td>{data.categories ? (data.categories["Students"] || 0) : 0}</td>
                            <td>{data.categories ? (data.categories["Volunteers"] || 0) : 0}</td>
                            <td className="fw-bold bg-light">{data.totalPeople || 0}</td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center text-muted">No data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Category-wise Amount Summary */}
        <div className="col-12 col-md-6">
          <div className="card shadow-sm">
            <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Category-wise / Group-wise Amount Summary</h5>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-success"
                  onClick={() => handleExportExcel('category-summary-table', 'Category_wise_Amount_Summary')}
                  title="Download as Excel"
                >
                  <i className="bi bi-file-earmark-excel me-1"></i>Excel
                </button>
                <button
                  className="btn btn-sm btn-light"
                  onClick={() => handleExportPDF('category-summary-table', 'Category_wise_Amount_Summary', 'Category-wise / Group-wise Amount Summary')}
                  title="Download as PDF"
                >
                  <i className="bi bi-file-earmark-pdf me-1"></i>PDF
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table id="category-summary-table" className="table table-bordered table-striped table-sm">
                  <thead className="table-light">
                    <tr>
                      <th>Category</th>
                      <th>Count</th>
                      <th>Expected (₹)</th>
                      <th>Collected (₹)</th>
                      <th>Pending (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(categoryStats).length > 0 ? (
                      Object.entries(categoryStats)
                        .sort((a, b) => b[1].collected - a[1].collected)
                        .map(([category, data]) => (
                          <tr key={category}>
                            <td className="fw-bold small">{category}</td>
                            <td>{data.count}</td>
                            <td>₹{data.expected.toLocaleString()}</td>
                            <td className="text-success">₹{data.collected.toLocaleString()}</td>
                            <td className={data.expected - data.collected > 0 ? "text-danger" : "text-success"}>
                              ₹{(data.expected - data.collected).toLocaleString()}
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center text-muted">No data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="alert alert-info">
        <i className="bi bi-info-circle me-2"></i>
        <strong>Note:</strong> Payment statistics are calculated using unique transaction IDs only. 
        Duplicate entries based on transaction ID have been removed.
      </div>

      {/* Enhanced Table Styling */}
      <style>{`
        /* Enhanced table borders for better readability */
        .table {
          border: 2px solid #495057 !important;
        }
        .table th,
        .table td {
          border: 1px solid #6c757d !important;
          border-width: 1px !important;
        }
        .table thead th {
          border-bottom: 2px solid #495057 !important;
          border-top: 2px solid #495057 !important;
          background-color: #f8f9fa !important;
          font-weight: 600 !important;
        }
        .table tbody tr {
          border-top: 1px solid #6c757d !important;
        }
        .table tbody tr:first-child {
          border-top: 1px solid #6c757d !important;
        }
        .table tfoot th,
        .table tfoot td {
          border-top: 2px solid #495057 !important;
          border-bottom: 2px solid #495057 !important;
        }
        .table.table-bordered {
          border: 2px solid #495057 !important;
        }
        .table.table-bordered th,
        .table.table-bordered td {
          border: 1px solid #6c757d !important;
        }
        .table.table-striped > tbody > tr:nth-of-type(odd) > td {
          background-color: rgba(0, 0, 0, 0.02);
        }
        .table.table-striped > tbody > tr:nth-of-type(even) > td {
          background-color: rgba(0, 0, 0, 0.05);
        }
        /* Enhanced header separation */
        .table thead th {
          border-bottom-width: 2px !important;
        }
        /* Card border enhancement */
        .card {
          border: 1px solid #dee2e6 !important;
        }
        .card-header {
          border-bottom: 2px solid #dee2e6 !important;
        }
        @media(max-width: 768px) {
          .table {
            font-size: 12px;
          }
          .card-header h5 {
            font-size: 16px;
          }
          h3 {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
}

