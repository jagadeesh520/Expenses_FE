import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "./constants";

export default function AdminDashboard() {
  const [records, setRecords] = useState([]);
  const [filterRegion, setFilterRegion] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) return navigate("/");
    fetchPayments();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    navigate("/");
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.PAYMENTS_LIST);
      const result = await res.json();

      if (result.success) {
        const unique = result.data.filter(
          (obj, index, self) =>
            index === self.findIndex((t) => t.email === obj.email)
        );
        setRecords(unique);
      }
    } catch (err) {
      console.log("Error fetching list:", err);
    }
  };

  const filteredRecords = records.filter((item) =>
    filterRegion === "all" ? true : item.region?.toLowerCase().includes(filterRegion)
  );

  const totalAmount = filteredRecords.reduce((sum, x) => sum + (Number(x.amountPaid) || 0), 0);

  const totalEast = records
    .filter(r => r.region?.toLowerCase().includes("east"))
    .reduce((sum, r) => sum + Number(r.amountPaid || 0), 0);

  const totalWest = records
    .filter(r => r.region?.toLowerCase().includes("west"))
    .reduce((sum, r) => sum + Number(r.amountPaid || 0), 0);

  return (
    <div className="container-fluid mt-4">

      {/* Header with Back & Logout */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <h3 className="fw-bold m-0 text-center flex-grow-1">
          Admin Payment Dashboard
        </h3>

        <div className="d-flex gap-2">
          <button 
            className="btn btn-primary fw-bold px-4" 
            onClick={() => navigate("/cashier-payment-requests")}
          >
            Upload Payment
          </button>
          <button 
            className="btn btn-info fw-bold px-4" 
            onClick={() => navigate("/view-payment-requests")}
          >
            View All Requests
          </button>
          <button className="btn btn-danger fw-bold px-4" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-3">

        <select className="form-select" style={{maxWidth:"250px"}}
          onChange={(e) => setFilterRegion(e.target.value)}
        >
          <option value="all">All Regions</option>
          <option value="east">East Rayalaseema</option>
          <option value="west">West Rayalaseema</option>
        </select>

        <div className="fw-bold fs-6 text-center d-flex flex-wrap gap-3">
          <span className="text-primary">East: ₹{totalEast}</span>
          <span className="text-success">West: ₹{totalWest}</span>
          <span className="text-warning">Total Displayed: ₹{totalAmount}</span>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive" style={{ maxHeight: "80vh", overflowY: "scroll" }}>
        <table className="table table-bordered table-striped table-sm text-center">
          <thead className="table-dark">
            <tr>
              <th>S.No</th><th>Region</th><th>Email</th><th>Name</th><th>Gender</th><th>Age</th>
              <th>Mobile</th><th>Recommended Role</th><th>Recommender Contact</th>
              <th>Amount Paid</th><th>Payment Mode</th><th>Date</th><th>Txn ID</th>
              <th>Screenshot</th><th>Balance</th><th>Status</th><th>Created</th>
            </tr>
          </thead>

          <tbody>
            {filteredRecords.length ? filteredRecords.map((item, i) => (
              <tr key={item._id}>
                <td>{i + 1}</td>
                <td>{item.region}</td>
                <td>{item.email}</td>
                <td>{item.name}</td>
                <td>{item.gender || "-"}</td>
                <td>{item.age}</td>
                <td>{item.mobile}</td>
                <td>{item.recommendedByRole}</td>
                <td>{item.recommenderContact}</td>
                <td>{item.amountPaid}</td>
                <td>{item.paymentMode2}</td>
                <td>{item.dateOfPayment || "-"}</td>
                <td>{item.transactionId}</td>

                <td>
                  {item.paymentScreenshot && (
                    <a href={item.paymentScreenshot} target="_blank" rel="noreferrer">View</a>
                  )}
                </td>

                <td>{item.totalAmount ?? 0}</td>
                <td className={item.status === "paid" ? "text-success fw-bold" : "text-danger fw-bold"}>
                  {item.status}
                </td>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
              </tr>
            )) : (
              <tr><td colSpan="40" className="text-danger fw-bold">No Records Found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Responsive Fix */}
      <style>{`
        @media(max-width:768px){
          table{ font-size:12px; }
          h3{ font-size:18px; }
          .table-responsive{ max-height:70vh; }
        }
      `}</style>

    </div>
  );
}
