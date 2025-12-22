import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "./constants";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function PeopleNames() {
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

  // Filter data by selected region
  const filteredRegistrations = registrations.filter((reg) => {
    if (selectedRegion === "all") return true;
    const regRegion = (reg.region || "").trim();
    return regRegion === selectedRegion;
  });

  // District-wise Male and Female names (including spouse names from Family)
  const districtNames = filteredRegistrations.reduce((acc, reg) => {
    const district = reg.district || "Unknown";
    const gender = (reg.gender || "").toLowerCase();
    const name = reg.name || reg.fullName || "";
    const groupType = (reg.groupType || "").toLowerCase();
    const spouseName = reg.spouseName || "";
    
    if (!acc[district]) {
      acc[district] = {
        males: [],
        females: [],
        familyFemales: [] // Spouse names from Family category
      };
    }

    // Add individual registration names
    if (name) {
      if (gender.includes("male") || gender.includes("m")) {
        if (!acc[district].males.includes(name)) {
          acc[district].males.push(name);
        }
      } else if (gender.includes("female") || gender.includes("f")) {
        if (!acc[district].females.includes(name)) {
          acc[district].females.push(name);
        }
      }
    }

    // Add spouse names from Family category
    if (groupType.includes("family") && spouseName && spouseName.trim()) {
      if (!acc[district].familyFemales.includes(spouseName.trim())) {
        acc[district].familyFemales.push(spouseName.trim());
      }
    }

    return acc;
  }, {});

  // Place-wise Male and Female names (including spouse names from Family)
  const placeNames = filteredRegistrations.reduce((acc, reg) => {
    const place = reg.iceuEgf || "Unknown";
    const gender = (reg.gender || "").toLowerCase();
    const name = reg.name || reg.fullName || "";
    const groupType = (reg.groupType || "").toLowerCase();
    const spouseName = reg.spouseName || "";
    
    if (!acc[place]) {
      acc[place] = {
        males: [],
        females: [],
        familyFemales: [] // Spouse names from Family category
      };
    }

    // Add individual registration names
    if (name) {
      if (gender.includes("male") || gender.includes("m")) {
        if (!acc[place].males.includes(name)) {
          acc[place].males.push(name);
        }
      } else if (gender.includes("female") || gender.includes("f")) {
        if (!acc[place].females.includes(name)) {
          acc[place].females.push(name);
        }
      }
    }

    // Add spouse names from Family category
    if (groupType.includes("family") && spouseName && spouseName.trim()) {
      if (!acc[place].familyFemales.includes(spouseName.trim())) {
        acc[place].familyFemales.push(spouseName.trim());
      }
    }

    return acc;
  }, {});

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
        <h3 className="fw-bold m-0">People Names</h3>
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

      {/* Information Note */}
      <div className="alert alert-warning mb-4">
        <i className="bi bi-info-circle me-2"></i>
        <strong>Note:</strong> The "Female Names Included in Family" column shows spouse names from Family category registrations. 
        In the registration form, we only collect the spouse name field. We do not have information about female children 
        who may be attending as part of the family, as the form does not capture individual names for family members 
        other than the spouse.
      </div>

      {/* District-wise Names */}
      <div className="row g-4 mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">District-wise Male and Female Names</h5>
            </div>
            <div className="card-body">
              {Object.keys(districtNames).length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-bordered table-striped">
                    <thead className="table-light">
                      <tr>
                        <th>District</th>
                        <th>Male Names (Count: {Object.values(districtNames).reduce((sum, data) => sum + data.males.length, 0)})</th>
                        <th>Female Names (Count: {Object.values(districtNames).reduce((sum, data) => sum + data.females.length, 0)})</th>
                        <th>Female Names Included in Family (Count: {Object.values(districtNames).reduce((sum, data) => sum + data.familyFemales.length, 0)})</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(districtNames).map(([district, data]) => (
                        <tr key={district}>
                          <td className="fw-bold">{district}</td>
                          <td>
                            <div className="small">
                              <strong className="text-primary">Count: {data.males.length}</strong>
                              {data.males.length > 0 ? (
                                <ul className="list-unstyled mt-2 mb-0">
                                  {data.males.map((name, index) => (
                                    <li key={index} className="mb-1">{index + 1}. {name}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-muted mb-0 mt-1">No male registrations</p>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="small">
                              <strong className="text-danger">Count: {data.females.length}</strong>
                              {data.females.length > 0 ? (
                                <ul className="list-unstyled mt-2 mb-0">
                                  {data.females.map((name, index) => (
                                    <li key={index} className="mb-1">{index + 1}. {name}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-muted mb-0 mt-1">No female registrations</p>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="small">
                              <strong className="text-warning">Count: {data.familyFemales.length}</strong>
                              {data.familyFemales.length > 0 ? (
                                <ul className="list-unstyled mt-2 mb-0">
                                  {data.familyFemales.map((name, index) => (
                                    <li key={index} className="mb-1">{index + 1}. {name}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-muted mb-0 mt-1">No spouse names from Family registrations</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="alert alert-info text-center">
                  <i className="bi bi-info-circle me-2"></i>
                  No data available for the selected region.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Place-wise Names */}
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">Place-wise (ICEU/EGF) Male and Female Names</h5>
            </div>
            <div className="card-body">
              {Object.keys(placeNames).length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-bordered table-striped">
                    <thead className="table-light">
                      <tr>
                        <th>Place (ICEU/EGF)</th>
                        <th>Male Names (Count: {Object.values(placeNames).reduce((sum, data) => sum + data.males.length, 0)})</th>
                        <th>Female Names (Count: {Object.values(placeNames).reduce((sum, data) => sum + data.females.length, 0)})</th>
                        <th>Female Names Included in Family (Count: {Object.values(placeNames).reduce((sum, data) => sum + data.familyFemales.length, 0)})</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(placeNames)
                        .sort((a, b) => (b[1].males.length + b[1].females.length + b[1].familyFemales.length) - (a[1].males.length + a[1].females.length + a[1].familyFemales.length))
                        .map(([place, data]) => (
                          <tr key={place}>
                            <td className="fw-bold">{place}</td>
                            <td>
                              <div className="small">
                                <strong className="text-primary">Count: {data.males.length}</strong>
                                {data.males.length > 0 ? (
                                  <ul className="list-unstyled mt-2 mb-0">
                                    {data.males.map((name, index) => (
                                      <li key={index} className="mb-1">{index + 1}. {name}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-muted mb-0 mt-1">No male registrations</p>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="small">
                                <strong className="text-danger">Count: {data.females.length}</strong>
                                {data.females.length > 0 ? (
                                  <ul className="list-unstyled mt-2 mb-0">
                                    {data.females.map((name, index) => (
                                      <li key={index} className="mb-1">{index + 1}. {name}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-muted mb-0 mt-1">No female registrations</p>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="small">
                                <strong className="text-warning">Count: {data.familyFemales.length}</strong>
                                {data.familyFemales.length > 0 ? (
                                  <ul className="list-unstyled mt-2 mb-0">
                                    {data.familyFemales.map((name, index) => (
                                      <li key={index} className="mb-1">{index + 1}. {name}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-muted mb-0 mt-1">No spouse names from Family registrations</p>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="alert alert-info text-center">
                  <i className="bi bi-info-circle me-2"></i>
                  No data available for the selected region.
                </div>
              )}
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
          h6 {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}

