import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "./constants";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function DistrictPlacePeopleDetails() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [registrations, setRegistrations] = useState([]);

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
      const res = await fetch(API_ENDPOINTS.REGISTRATIONS);
      const result = await res.json();
      if (result.success) {
        setRegistrations(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
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
        totalFamilyMembers: 0,
        totalPeople: 0
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
      acc[district].totalPeople += 1;
    }

    return acc;
  }, {});

  // Place-wise Registration Details with category counts
  const placeStats = filteredRegistrations.reduce((acc, reg) => {
    const place = reg.iceuEgf || "Unknown";
    const category = getCategoryKey(reg.groupType);
    
    if (!acc[place]) {
      acc[place] = {
        registrations: [],
        categories: initCategoryCounts(),
        totalPeople: 0
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

  // Check if there are Family registrations or zero girls count to show message
  const hasFamilyRegistrations = filteredRegistrations.some(reg => {
    const category = getCategoryKey(reg.groupType);
    return category === "Family";
  });

  const hasZeroGirls = Object.values(districtGenderStats).some(data => data.girls.length === 0);

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
        <h3 className="fw-bold m-0">District & Place wise People Count</h3>
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
                  <tfoot className="table-dark">
                    <tr>
                      <td className="fw-bold">TOTAL</td>
                      <td className="fw-bold">
                        {Object.values(placeStats).reduce((sum, data) => sum + data.registrations.length, 0)}
                      </td>
                      <td className="fw-bold">
                        {Object.values(placeStats).reduce((sum, data) => sum + (data.categories["Family"] || 0), 0)}
                      </td>
                      <td className="fw-bold">
                        {Object.values(placeStats).reduce((sum, data) => sum + (data.categories["Single Graduate (Employed)"] || 0), 0)}
                      </td>
                      <td className="fw-bold">
                        {Object.values(placeStats).reduce((sum, data) => sum + (data.categories["Single Graduate (Unemployed)"] || 0), 0)}
                      </td>
                      <td className="fw-bold">
                        {Object.values(placeStats).reduce((sum, data) => sum + (data.categories["Graduates' children (15+)"] || 0), 0)}
                      </td>
                      <td className="fw-bold">
                        {Object.values(placeStats).reduce((sum, data) => sum + (data.categories["Students"] || 0), 0)}
                      </td>
                      <td className="fw-bold">
                        {Object.values(placeStats).reduce((sum, data) => sum + (data.categories["Volunteers"] || 0), 0)}
                      </td>
                      <td className="fw-bold bg-info">
                        {Object.values(placeStats).reduce((sum, data) => sum + (data.totalPeople || 0), 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
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

