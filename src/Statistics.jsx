import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "./constants";
import { getTotalAmount } from "./utils/pricingUtils";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Statistics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [registrations, setRegistrations] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const registrarToken = localStorage.getItem("registrarToken");
    const adminToken = localStorage.getItem("adminToken");
    if (!registrarToken && !adminToken) {
      // Redirect to appropriate login based on which token exists
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
      // Fetch registrations and payments in parallel
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
      toast.error("Failed to load statistics data");
    } finally {
      setLoading(false);
    }
  };

  // Filter data by selected region
  const filteredRegistrations = registrations.filter((reg) => {
    if (selectedRegion === "all") return true;
    const regRegion = (reg.region || "").trim();
    return regRegion === selectedRegion;
  });

  // Remove duplicate payments based on transactionId
  const uniquePayments = payments.reduce((acc, payment) => {
    const txId = payment.transactionId?.trim();
    if (!txId) return acc; // Skip payments without transaction ID
    
    // If transaction ID already exists, skip (treat as duplicate)
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

  // ==================== REGISTRATION STATISTICS ====================

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
    return groupType; // Return as-is if doesn't match
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

  // District-wise Boys & Girls with category counts
  const districtGenderStats = filteredRegistrations.reduce((acc, reg) => {
    const district = reg.district || "Unknown";
    const gender = (reg.gender || "").toLowerCase();
    const name = reg.name || reg.fullName || "";
    const category = getCategoryKey(reg.groupType);

    if (!acc[district]) {
      acc[district] = { 
        boys: [], 
        girls: [],
        categories: initCategoryCounts(),
        totalFamilyMembers: 0, // Total family members from Family category
        totalPeople: 0 // Total people attending (individuals + family members)
      };
    }

    if (gender.includes("male") || gender.includes("m")) {
      if (name && !acc[district].boys.includes(name)) {
        acc[district].boys.push(name);
      }
    } else if (gender.includes("female") || gender.includes("f")) {
      if (name && !acc[district].girls.includes(name)) {
        acc[district].girls.push(name);
      }
    }

    // Count category
    if (acc[district].categories[category] !== undefined) {
      acc[district].categories[category] += 1;
    } else {
      acc[district].categories[category] = 1;
    }

    // Add total family members if it's a Family category registration
    if (category === "Family" && reg.totalFamilyMembers) {
      const familyCount = parseInt(reg.totalFamilyMembers) || 0;
      acc[district].totalFamilyMembers += familyCount;
      acc[district].totalPeople += familyCount;
    } else {
      // For non-family registrations, count as 1 person
      acc[district].totalPeople += 1;
    }

    return acc;
  }, {});

  // Check if there are Family registrations or zero girls count to show message
  const hasFamilyRegistrations = filteredRegistrations.some(reg => {
    const category = getCategoryKey(reg.groupType);
    return category === "Family";
  });

  const hasZeroGirls = Object.values(districtGenderStats).some(data => data.girls.length === 0);

  // Place-wise Registration Details with category counts
  const placeStats = filteredRegistrations.reduce((acc, reg) => {
    const place = reg.iceuEgf || "Unknown";
    const category = getCategoryKey(reg.groupType);
    
    if (!acc[place]) {
      acc[place] = {
        registrations: [],
        categories: initCategoryCounts(),
        totalPeople: 0 // Total people attending
      };
    }
    acc[place].registrations.push(reg);
    
    // Count category
    if (acc[place].categories[category] !== undefined) {
      acc[place].categories[category] += 1;
    } else {
      acc[place].categories[category] = 1;
    }

    // Count total people: if Family, use totalFamilyMembers, otherwise count as 1
    if (category === "Family" && reg.totalFamilyMembers) {
      const familyCount = parseInt(reg.totalFamilyMembers) || 0;
      acc[place].totalPeople += familyCount;
    } else {
      acc[place].totalPeople += 1;
    }
    
    return acc;
  }, {});

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
        totalPeople: 0 // Total people attending
      };
    }
    acc[district].count += 1;
    
    // Count category
    if (acc[district].categories[category] !== undefined) {
      acc[district].categories[category] += 1;
    } else {
      acc[district].categories[category] = 1;
    }

    // Count total people: if Family, use totalFamilyMembers, otherwise count as 1
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
    
    // Get paid amount from payment record - match by transactionId first, then email, then name+mobile
    const payment = filteredPayments.find(p => {
      // First try to match by transactionId (most reliable)
      if (reg.transactionId && p.transactionId) {
        return reg.transactionId.trim() === p.transactionId.trim();
      }
      // Then try email
      if (reg.email && p.email) {
        return reg.email.trim().toLowerCase() === p.email.trim().toLowerCase();
      }
      // Finally try name + mobile
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
  // Note: For payments, we need to match with registrations to get totalFamilyMembers
  const districtPaymentStats = filteredPayments.reduce((acc, payment) => {
    const district = payment.district || "Unknown";
    const category = getCategoryKey(payment.groupType);
    
    if (!acc[district]) {
      acc[district] = {
        amount: 0,
        categories: initCategoryCounts(),
        totalPeople: 0 // Total people attending
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

    // Count total people: if Family and has matching registration with totalFamilyMembers, use that, otherwise count as 1
    if (category === "Family" && matchingReg && matchingReg.totalFamilyMembers) {
      const familyCount = parseInt(matchingReg.totalFamilyMembers) || 0;
      acc[district].totalPeople += familyCount;
    } else {
      acc[district].totalPeople += 1;
    }
    
    return acc;
  }, {});

  // Calculate overall total people attending
  const overallTotalPeople = Object.values(districtGenderStats).reduce((sum, data) => sum + (data.totalPeople || 0), 0);

  // ==================== PAYMENT STATISTICS ====================

  // Total Amount Collected (unique transactions only)
  const totalCollected = filteredPayments.reduce(
    (sum, p) => sum + (Number(p.amountPaid) || 0),
    0
  );

  // District-wise Amount Collection (already updated above in the registration statistics section)

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
    
    // Calculate expected based on registration data - match by transactionId first, then email, then name+mobile
    const reg = filteredRegistrations.find(r => {
      // First try to match by transactionId (most reliable)
      if (r.transactionId && payment.transactionId) {
        return r.transactionId.trim() === payment.transactionId.trim();
      }
      // Then try email
      if (r.email && payment.email) {
        return r.email.trim().toLowerCase() === payment.email.trim().toLowerCase();
      }
      // Finally try name + mobile
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
      // If no matching registration found, use payment's totalAmount as expected
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
          <p className="mt-3">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-3" style={{ minHeight: "100vh", paddingBottom: "20px" }}>
      <ToastContainer position="top-right" autoClose={2000} />
      
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <h3 className="fw-bold m-0">Statistics Dashboard</h3>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-secondary"
            onClick={() => {
              const adminToken = localStorage.getItem("adminToken");
              if (adminToken) {
                navigate("/admin-dashboard");
              } else {
                navigate("/registrar-dashboard");
              }
            }}
          >
            ← Back to Dashboard
          </button>
          <button
            className="btn btn-danger"
            onClick={() => {
              localStorage.removeItem("registrarToken");
              localStorage.removeItem("registrarData");
              localStorage.removeItem("adminToken");
              localStorage.removeItem("adminData");
              navigate("/");
            }}
          >
            Logout
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

      {/* Registration-Based Statistics */}
      <div className="row g-4 mb-4">
        {/* District-wise Boys & Girls */}
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">District-wise Boys & Girls Details</h5>
            </div>
            <div className="card-body">
              {/* Information Message */}
              {(hasFamilyRegistrations || hasZeroGirls) && (
                <div className="alert alert-info mb-3">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Note:</strong> The Girls Count shown here only includes individual registrations with specified gender information. 
                  For Family category registrations, we track the total number of family members attending (including children), 
                  but we don't have specific gender information for individual family members. 
                  Therefore, if the Girls Count is zero or appears low, there may be women/girls included in the Family registrations 
                  that are not reflected in this count.
                </div>
              )}
              <div className="table-responsive">
                <table className="table table-bordered table-striped">
                  <thead className="table-light">
                    <tr>
                      <th>District</th>
                      <th>Boys Count</th>
                      <th>Girls Count</th>
                      <th>Family (Registrations)</th>
                      <th>Total Family Members</th>
                      <th>Single Graduate (Employed)</th>
                      <th>Single Graduate (Unemployed)</th>
                      <th>Graduates' children (15+)</th>
                      <th>Students</th>
                      <th>Volunteers</th>
                      <th className="bg-info text-white">Total People Attending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(districtGenderStats).length > 0 ? (
                      Object.entries(districtGenderStats).map(([district, data]) => (
                        <tr key={district}>
                          <td className="fw-bold">{district}</td>
                          <td>{data.boys.length}</td>
                          <td>{data.girls.length}</td>
                          <td>{data.categories["Family"] || 0}</td>
                          <td className="fw-bold text-primary">{data.totalFamilyMembers || 0}</td>
                          <td>{data.categories["Single Graduate (Employed)"] || 0}</td>
                          <td>{data.categories["Single Graduate (Unemployed)"] || 0}</td>
                          <td>{data.categories["Graduates' children (15+)"] || 0}</td>
                          <td>{data.categories["Students"] || 0}</td>
                          <td>{data.categories["Volunteers"] || 0}</td>
                          <td className="fw-bold bg-light">{data.totalPeople || 0}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="11" className="text-center text-muted">No data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Place-wise Registration Details */}
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">Place-wise Registration Details (ICEU/EGF)</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered table-striped">
                  <thead className="table-light">
                    <tr>
                      <th>Place (ICEU/EGF)</th>
                      <th>Total Registrations</th>
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
                    {Object.keys(placeStats).length > 0 ? (
                      Object.entries(placeStats)
                        .sort((a, b) => b[1].registrations.length - a[1].registrations.length)
                        .map(([place, data]) => (
                          <tr key={place}>
                            <td className="fw-bold">{place}</td>
                            <td>{data.registrations.length}</td>
                            <td>{data.categories["Family"] || 0}</td>
                            <td>{data.categories["Single Graduate (Employed)"] || 0}</td>
                            <td>{data.categories["Single Graduate (Unemployed)"] || 0}</td>
                            <td>{data.categories["Graduates' children (15+)"] || 0}</td>
                            <td>{data.categories["Students"] || 0}</td>
                            <td>{data.categories["Volunteers"] || 0}</td>
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

        {/* All-Districts Abstract */}
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">All-Districts Abstract</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered table-striped">
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
                      <td className="fw-bold bg-info">{overallTotalPeople}</td>
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
      </div>

      {/* Payment Statistics */}
      <div className="row g-4 mb-4">
        {/* District-wise Amount Collection */}
        <div className="col-12 col-md-6">
          <div className="card shadow-sm">
            <div className="card-header bg-warning text-dark">
              <h5 className="mb-0">District-wise Amount Collection</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered table-striped table-sm">
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
            <div className="card-header bg-secondary text-white">
              <h5 className="mb-0">Category-wise / Group-wise Amount Summary</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered table-striped table-sm">
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

      {/* Responsive Styles */}
      <style>{`
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

