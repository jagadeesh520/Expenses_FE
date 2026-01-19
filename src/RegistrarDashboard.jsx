import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "./constants";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";

export default function RegistrarDashboard() {
  const navigate = useNavigate();
  const [sendingEmails, setSendingEmails] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [persistedFailedEmails, setPersistedFailedEmails] = useState([]);
  const [loadingFailedEmails, setLoadingFailedEmails] = useState(false);
  const [expandedDetails, setExpandedDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("registrarToken");
    if (!token) {
      navigate("/registrar-login");
    } else {
      fetchFailedEmails();
    }
  }, [navigate]);

  const fetchFailedEmails = async () => {
    setLoadingFailedEmails(true);
    try {
      const token = localStorage.getItem("registrarToken");
      const response = await fetch(API_ENDPOINTS.FAILED_EMAILS, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch failed emails");
      }

      setPersistedFailedEmails(data.data || []);
    } catch (error) {
      console.error("Error fetching failed emails:", error);
      toast.error(error.message || "Failed to fetch failed emails");
    } finally {
      setLoadingFailedEmails(false);
    }
  };

  const handleDeleteFailedEmail = async (id, email) => {
    if (!window.confirm(`Are you sure you want to delete the failed email record for ${email}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("registrarToken");
      const response = await fetch(API_ENDPOINTS.FAILED_EMAIL_DELETE(id), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete failed email");
      }

      toast.success("Failed email record deleted successfully");
      // Refresh the list
      fetchFailedEmails();
      // Also remove from emailStatus if it exists
      if (emailStatus && emailStatus.failedEmails) {
        setEmailStatus({
          ...emailStatus,
          failedEmails: emailStatus.failedEmails.filter(f => f._id !== id && f.email !== email)
        });
      }
    } catch (error) {
      console.error("Error deleting failed email:", error);
      toast.error(error.message || "Failed to delete failed email");
    }
  };

  const handleFetchUserDetails = async (email) => {
    if (expandedDetails[email]) {
      // Toggle off
      setExpandedDetails({ ...expandedDetails, [email]: null });
      return;
    }

    setLoadingDetails({ ...loadingDetails, [email]: true });
    try {
      const token = localStorage.getItem("registrarToken");
      const response = await fetch(API_ENDPOINTS.FAILED_EMAIL_DETAILS(email), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch user details");
      }

      setExpandedDetails({ ...expandedDetails, [email]: data.data });
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error(error.message || "Failed to fetch user details");
    } finally {
      setLoadingDetails({ ...loadingDetails, [email]: false });
    }
  };

  const handleExportFailedEmailsToExcel = async () => {
    // Combine persisted and current failed emails
    const allFailedEmails = [
      ...persistedFailedEmails,
      ...(emailStatus?.failedEmails || []).filter(f => 
        !persistedFailedEmails.some(p => p.email === f.email)
      )
    ];

    if (allFailedEmails.length === 0) {
      toast.info("No failed emails to export");
      return;
    }

    try {
      // Fetch user details for all failed emails
      const emailsWithDetails = await Promise.all(
        allFailedEmails.map(async (failed) => {
          if (failed.email === "No email provided") {
            return { ...failed, userDetails: null };
          }
          try {
            const token = localStorage.getItem("registrarToken");
            const response = await fetch(API_ENDPOINTS.FAILED_EMAIL_DETAILS(failed.email), {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            const data = await response.json();
            return { ...failed, userDetails: data.success ? data.data : null };
          } catch (error) {
            return { ...failed, userDetails: null };
          }
        })
      );

      // Prepare Excel data
      const excelData = emailsWithDetails.map((failed, idx) => {
        const whatsappLink = failed.region === "East Rayalaseema" 
          ? "https://chat.whatsapp.com/JW88QUiqz8HFbeX7ri7dZr"
          : "https://chat.whatsapp.com/FAJaJPnaHh07yoObN1Tfpw";
        
        const userDetails = failed.userDetails || {};
        
        return {
          "#": idx + 1,
          "Name": failed.fullName || failed.name || "Unknown",
          "Email": failed.email,
          "Phone": failed.mobile || "N/A",
          "Region": failed.region || "N/A",
          "District": failed.district || userDetails.district || "N/A",
          "ICEU/EGF": failed.iceuEgf || userDetails.iceuEgf || "N/A",
          "Group Type": failed.groupType || userDetails.groupType || "N/A",
          "Unique ID": failed.uniqueId || userDetails.uniqueId || "N/A",
          "Error": failed.error || "N/A",
          "WhatsApp Link": whatsappLink,
          // Additional user details
          "Title": userDetails.title || "N/A",
          "Surname": userDetails.surname || "N/A",
          "Gender": userDetails.gender || "N/A",
          "Age": userDetails.age || "N/A",
          "Marital Status": userDetails.maritalStatus || "N/A",
          "Spouse Attending": userDetails.spouseAttending || "N/A",
          "Spouse Name": userDetails.spouseName || "N/A",
          "Children Below 10": userDetails.childBelow10Count || "N/A",
          "Children 10-14": userDetails.child10to14Count || "N/A",
          "Total Family Members": userDetails.totalFamilyMembers || "N/A",
          "Registration Status": userDetails.registrationStatus || "N/A",
          "Amount Paid": userDetails.amountPaid || 0,
          "Total Amount": userDetails.totalAmount || 0,
          "Balance": userDetails.balance || 0,
          "Created At": failed.createdAt ? new Date(failed.createdAt).toLocaleString() : "N/A"
        };
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths
      const colWidths = [
        { wch: 5 },   // #
        { wch: 25 },  // Name
        { wch: 30 },  // Email
        { wch: 15 },  // Phone
        { wch: 20 },  // Region
        { wch: 15 },  // District
        { wch: 15 },  // ICEU/EGF
        { wch: 15 },  // Group Type
        { wch: 15 },  // Unique ID
        { wch: 40 },  // Error
        { wch: 50 },  // WhatsApp Link
        { wch: 10 },  // Title
        { wch: 15 },  // Surname
        { wch: 10 },  // Gender
        { wch: 5 },   // Age
        { wch: 15 },  // Marital Status
        { wch: 15 },  // Spouse Attending
        { wch: 20 },  // Spouse Name
        { wch: 15 },  // Children Below 10
        { wch: 15 },  // Children 10-14
        { wch: 15 },  // Total Family Members
        { wch: 20 },  // Registration Status
        { wch: 12 },  // Amount Paid
        { wch: 12 },  // Total Amount
        { wch: 12 },  // Balance
        { wch: 20 }   // Created At
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Failed Emails");
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `failed_emails_${timestamp}.xlsx`;
      
      // Download
      XLSX.writeFile(wb, filename);
      
      toast.success(`Exported ${excelData.length} failed emails to Excel`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export to Excel");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("registrarToken");
    localStorage.removeItem("registrarData");
    navigate("/");
  };

  const handleSendBulkEmails = async (region = null) => {
    if (sendingEmails) return;
    
    const confirmMessage = region 
      ? `Send WhatsApp group invitation emails to all approved ${region} registrations?`
      : "Send WhatsApp group invitation emails to all approved registrations (both regions)?";
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setSendingEmails(true);
    setEmailStatus(null);

    try {
      const url = region 
        ? `${API_ENDPOINTS.REGISTRATIONS}/send-bulk-emails?region=${encodeURIComponent(region)}`
        : `${API_ENDPOINTS.REGISTRATIONS}/send-bulk-emails`;
      
      const token = localStorage.getItem("registrarToken");
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send bulk emails");
      }

      setEmailStatus(data.data);
      
      // Refresh persisted failed emails after sending
      fetchFailedEmails();
      
      const successMessage = `Emails sent successfully! 
Total Sent: ${data.data.totalSent}
Total Failed: ${data.data.totalFailed}
${region ? '' : `West: ${data.data.westRayalaseema.sent} sent, ${data.data.westRayalaseema.failed} failed
East: ${data.data.eastRayalaseema.sent} sent, ${data.data.eastRayalaseema.failed} failed`}`;
      
      toast.success(successMessage, { autoClose: 5000 });
      
      if (data.data.failedEmails && data.data.failedEmails.length > 0) {
        console.warn("Failed emails:", data.data.failedEmails);
      }
    } catch (error) {
      console.error("Error sending bulk emails:", error);
      toast.error(error.message || "Failed to send bulk emails");
    } finally {
      setSendingEmails(false);
    }
  };

  const handleResendFailedEmails = async (region = null) => {
    if (sendingEmails) {
      return;
    }
    
    // Combine persisted and current failed emails
    const allFailedEmails = [
      ...persistedFailedEmails,
      ...(emailStatus?.failedEmails || []).filter(f => 
        !persistedFailedEmails.some(p => p.email === f.email)
      )
    ];
    
    if (allFailedEmails.length === 0) {
      toast.info("No failed emails found");
      return;
    }
    
    // Filter failed emails by region if specified
    let failedEmailsToResend = allFailedEmails;
    if (region) {
      failedEmailsToResend = allFailedEmails.filter(failed => failed.region === region);
    }
    
    if (failedEmailsToResend.length === 0) {
      toast.info(`No failed emails found for ${region || "selected region"}`);
      return;
    }
    
    const confirmMessage = region
      ? `Resend emails to ${failedEmailsToResend.length} failed ${region} email(s)?`
      : `Resend emails to ${failedEmailsToResend.length} failed email(s)?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setSendingEmails(true);

    try {
      const token = localStorage.getItem("registrarToken");
      const response = await fetch(`${API_ENDPOINTS.REGISTRATIONS}/resend-failed-emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          failedEmails: failedEmailsToResend
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend emails");
      }

      // Update email status with new results
      setEmailStatus(data.data);
      
      // Refresh persisted failed emails after resending
      fetchFailedEmails();
      
      const successMessage = `Resend completed! 
Sent: ${data.data.totalSent}
Failed: ${data.data.totalFailed}`;
      
      toast.success(successMessage, { autoClose: 5000 });
      
    } catch (error) {
      console.error("Error resending failed emails:", error);
      toast.error(error.message || "Failed to resend emails");
    } finally {
      setSendingEmails(false);
    }
  };

  return (
    <div className="container-fluid d-flex flex-column" style={{ minHeight: "100vh", paddingBottom: "20px" }}>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="container mt-4" style={{ maxWidth: "1200px", flex: "1", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {/* Header - Centered */}
        <div className="text-center mb-4">
          <h4 className="fw-bold">Registrar Dashboard</h4>
        </div>

        {/* Dashboard Modules - Compact Grid - Centered */}
        <div className="row g-3 mb-3 justify-content-center">
          {/* Registrations Approval List Module */}
          <div className="col-12 col-md-6 col-lg-5">
            <div
              className="card shadow-sm dashboard-module"
              style={{
                cursor: "pointer",
                transition: "all 0.2s",
                borderRadius: "8px",
                border: "2px solid #0d6efd",
                borderLeft: "4px solid #0d6efd"
              }}
              onClick={() => navigate("/registrations")}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <i className="bi bi-list-check" style={{ fontSize: "32px", color: "#0d6efd" }}></i>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h5 className="fw-bold mb-1" style={{ fontSize: "16px" }}>Registrations Approval List</h5>
                    <p className="text-muted mb-0 small">
                      View and manage registration approvals
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <i className="bi bi-chevron-right text-muted"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Module */}
          <div className="col-12 col-md-6 col-lg-5">
            <div
              className="card shadow-sm dashboard-module"
              style={{
                cursor: "pointer",
                transition: "all 0.2s",
                borderRadius: "8px",
                border: "2px solid #198754",
                borderLeft: "4px solid #198754"
              }}
              onClick={() => navigate("/statistics")}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <i className="bi bi-bar-chart-fill" style={{ fontSize: "32px", color: "#198754" }}></i>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h5 className="fw-bold mb-1" style={{ fontSize: "16px" }}>Statistics</h5>
                    <p className="text-muted mb-0 small">
                      View registration and payment statistics
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <i className="bi bi-chevron-right text-muted"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gift List Module */}
          <div className="col-12 col-md-6 col-lg-5">
            <div
              className="card shadow-sm dashboard-module"
              style={{
                cursor: "pointer",
                transition: "all 0.2s",
                borderRadius: "8px",
                border: "2px solid #9333ea",
                borderLeft: "4px solid #9333ea"
              }}
              onClick={() => navigate("/gifts-list")}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <i className="bi bi-gift-fill" style={{ fontSize: "32px", color: "#9333ea" }}></i>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h5 className="fw-bold mb-1" style={{ fontSize: "16px" }}>Gift List</h5>
                    <p className="text-muted mb-0 small">
                      View all submitted gifts
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <i className="bi bi-chevron-right text-muted"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Event Day Verification Module */}
          <div className="col-12 col-md-6 col-lg-5">
            <div
              className="card shadow-sm dashboard-module"
              style={{
                cursor: "pointer",
                transition: "all 0.2s",
                borderRadius: "8px",
                border: "2px solid #dc3545",
                borderLeft: "4px solid #dc3545"
              }}
              onClick={() => navigate("/event-day-verification")}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <i className="bi bi-clipboard-check" style={{ fontSize: "32px", color: "#dc3545" }}></i>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h5 className="fw-bold mb-1" style={{ fontSize: "16px" }}>Event Day Verification</h5>
                    <p className="text-muted mb-0 small">
                      Generate district & category-wise PDFs for verification
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <i className="bi bi-chevron-right text-muted"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SPICON Reports Module */}
          <div className="col-12 col-md-6 col-lg-5">
            <div
              className="card shadow-sm dashboard-module"
              style={{
                cursor: "pointer",
                transition: "all 0.2s",
                borderRadius: "8px",
                border: "2px solid #0dcaf0",
                borderLeft: "4px solid #0dcaf0"
              }}
              onClick={() => navigate("/registrar/spicon-reports")}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <i className="bi bi-file-earmark-text" style={{ fontSize: "32px", color: "#0dcaf0" }}></i>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h5 className="fw-bold mb-1" style={{ fontSize: "16px" }}>SPICON Reports</h5>
                    <p className="text-muted mb-0 small">
                      Region & district-wise attendance reports
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <i className="bi bi-chevron-right text-muted"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Navigation Options - Centered */}
        <div className="row g-2 mb-4 justify-content-center">
          <div className="col-12 col-md-auto">
            <div className="d-flex flex-wrap gap-2 justify-content-center">
              <button
                className="btn btn-info btn-sm fw-bold"
                onClick={() => navigate("/payment-requests")}
              >
                <i className="bi bi-check-circle me-1"></i>Approve Payment Requests
              </button>
              <button
                className="btn btn-secondary btn-sm fw-bold"
                onClick={() => navigate("/view-payment-requests")}
              >
                <i className="bi bi-eye me-1"></i>View All Payment Requests
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Email Section */}
        <div className="row g-3 mb-4 justify-content-center">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="bi bi-envelope-paper me-2"></i>Send WhatsApp Group Invitation Emails
                </h5>
              </div>
              <div className="card-body">
                <p className="text-muted mb-3">
                  Send WhatsApp group invitation emails to all approved registrations. Emails will include region-specific WhatsApp group links.
                </p>
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  <button
                    className="btn btn-success"
                    onClick={() => handleSendBulkEmails("West Rayalaseema")}
                    disabled={sendingEmails}
                  >
                    {sendingEmails ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-envelope-check me-2"></i>Send to West Rayalaseema
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-warning"
                    onClick={() => handleSendBulkEmails("East Rayalaseema")}
                    disabled={sendingEmails}
                  >
                    {sendingEmails ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-envelope-check me-2"></i>Send to East Rayalaseema
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSendBulkEmails()}
                    disabled={sendingEmails}
                  >
                    {sendingEmails ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-envelope-check me-2"></i>Send to All Regions
                      </>
                    )}
                  </button>
                </div>
                
                {/* Persisted Failed Emails Section */}
                {(persistedFailedEmails.length > 0 || (emailStatus && emailStatus.failedEmails && emailStatus.failedEmails.length > 0)) && (
                  <div className="mt-4 p-3 bg-light rounded">
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                      <h6 className="mb-0 text-danger fw-bold">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Failed Emails ({persistedFailedEmails.length + (emailStatus?.failedEmails?.length || 0)})
                      </h6>
                      <div className="d-flex gap-2 flex-wrap">
                        {/* Resend buttons */}
                        {([...persistedFailedEmails, ...(emailStatus?.failedEmails || [])].some(f => f.region === "West Rayalaseema")) && (
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => {
                              const westFailed = [
                                ...persistedFailedEmails.filter(f => f.region === "West Rayalaseema"),
                                ...(emailStatus?.failedEmails || []).filter(f => f.region === "West Rayalaseema")
                              ];
                              if (westFailed.length > 0) {
                                handleResendFailedEmails("West Rayalaseema");
                              }
                            }}
                            disabled={sendingEmails}
                            title="Resend to failed West Rayalaseema emails only"
                          >
                            {sendingEmails ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                Resending...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-arrow-repeat me-1"></i>
                                Resend West Failed
                              </>
                            )}
                          </button>
                        )}
                        {([...persistedFailedEmails, ...(emailStatus?.failedEmails || [])].some(f => f.region === "East Rayalaseema")) && (
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => {
                              const eastFailed = [
                                ...persistedFailedEmails.filter(f => f.region === "East Rayalaseema"),
                                ...(emailStatus?.failedEmails || []).filter(f => f.region === "East Rayalaseema")
                              ];
                              if (eastFailed.length > 0) {
                                handleResendFailedEmails("East Rayalaseema");
                              }
                            }}
                            disabled={sendingEmails}
                            title="Resend to failed East Rayalaseema emails only"
                          >
                            {sendingEmails ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                Resending...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-arrow-repeat me-1"></i>
                                Resend East Failed
                              </>
                            )}
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => handleResendFailedEmails()}
                          disabled={sendingEmails}
                          title="Resend to all failed emails"
                        >
                          {sendingEmails ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                              Resending...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-arrow-repeat me-1"></i>
                              Resend All Failed
                            </>
                          )}
                        </button>
                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={handleExportFailedEmailsToExcel}
                          title="Export to Excel"
                        >
                          <i className="bi bi-file-earmark-excel me-1"></i>Export to Excel
                        </button>
                      </div>
                    </div>
                    
                    {loadingFailedEmails ? (
                      <div className="text-center py-3">
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Loading failed emails...
                      </div>
                    ) : (
                      <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto" }}>
                        <table className="table table-sm table-bordered table-striped table-hover">
                          <thead className="table-dark sticky-top">
                            <tr>
                              <th>#</th>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Phone</th>
                              <th>Region</th>
                              <th>District</th>
                              <th>ICEU/EGF</th>
                              <th>Group Type</th>
                              <th>Unique ID</th>
                              <th>Error</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              ...persistedFailedEmails,
                              ...(emailStatus?.failedEmails || []).filter(f => 
                                !persistedFailedEmails.some(p => p.email === f.email)
                              )
                            ].map((failed, idx) => {
                              const whatsappLink = failed.region === "East Rayalaseema" 
                                ? "https://chat.whatsapp.com/JW88QUiqz8HFbeX7ri7dZr"
                                : "https://chat.whatsapp.com/FAJaJPnaHh07yoObN1Tfpw";
                              const hasDetails = expandedDetails[failed.email];
                              const isLoadingDetails = loadingDetails[failed.email];
                              
                              return (
                                <React.Fragment key={failed._id || failed.email || idx}>
                                  <tr>
                                    <td>{idx + 1}</td>
                                    <td className="fw-bold">{failed.fullName || failed.name}</td>
                                    <td>
                                      {failed.email !== "No email provided" ? (
                                        <a href={`mailto:${failed.email}`}>{failed.email}</a>
                                      ) : (
                                        <span className="text-muted">No email</span>
                                      )}
                                    </td>
                                    <td>
                                      {failed.mobile && failed.mobile !== "N/A" ? (
                                        <a href={`tel:${failed.mobile}`}>{failed.mobile}</a>
                                      ) : (
                                        <span className="text-muted">N/A</span>
                                      )}
                                    </td>
                                    <td>
                                      <span className={`badge ${failed.region === "West Rayalaseema" ? "bg-warning text-dark" : "bg-info"}`}>
                                        {failed.region}
                                      </span>
                                    </td>
                                    <td>{failed.district}</td>
                                    <td>{failed.iceuEgf}</td>
                                    <td><small>{failed.groupType}</small></td>
                                    <td><code className="small">{failed.uniqueId}</code></td>
                                    <td>
                                      <small className="text-danger">{failed.error}</small>
                                    </td>
                                    <td>
                                      <div className="d-flex gap-1">
                                        <button
                                          className="btn btn-sm btn-success"
                                          onClick={() => {
                                            navigator.clipboard.writeText(whatsappLink);
                                            toast.success(`WhatsApp link copied! Send to ${failed.mobile || failed.email}`);
                                          }}
                                          title="Copy WhatsApp link"
                                        >
                                          <i className="bi bi-link-45deg"></i>
                                        </button>
                                        {failed.email && failed.email !== "No email provided" && (
                                          <button
                                            className="btn btn-sm btn-info"
                                            onClick={() => handleFetchUserDetails(failed.email)}
                                            disabled={isLoadingDetails}
                                            title="View complete details"
                                          >
                                            {isLoadingDetails ? (
                                              <span className="spinner-border spinner-border-sm"></span>
                                            ) : hasDetails ? (
                                              <i className="bi bi-chevron-up"></i>
                                            ) : (
                                              <i className="bi bi-chevron-down"></i>
                                            )}
                                          </button>
                                        )}
                                        {failed._id && (
                                          <button
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleDeleteFailedEmail(failed._id, failed.email)}
                                            title="Delete from database"
                                          >
                                            <i className="bi bi-trash"></i>
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                  {hasDetails && (
                                    <tr>
                                      <td colSpan="11" className="bg-light">
                                        <div className="p-3">
                                          <h6 className="fw-bold mb-2">Complete User Details:</h6>
                                          <div className="row">
                                            <div className="col-md-6">
                                              <p><strong>Title:</strong> {hasDetails.title || "N/A"}</p>
                                              <p><strong>Full Name:</strong> {hasDetails.fullName || "N/A"}</p>
                                              <p><strong>Surname:</strong> {hasDetails.surname || "N/A"}</p>
                                              <p><strong>Gender:</strong> {hasDetails.gender || "N/A"}</p>
                                              <p><strong>Age:</strong> {hasDetails.age || "N/A"}</p>
                                              <p><strong>Marital Status:</strong> {hasDetails.maritalStatus || "N/A"}</p>
                                              <p><strong>Spouse Attending:</strong> {hasDetails.spouseAttending || "N/A"}</p>
                                              {hasDetails.spouseName && <p><strong>Spouse Name:</strong> {hasDetails.spouseName}</p>}
                                            </div>
                                            <div className="col-md-6">
                                              <p><strong>Children Below 10:</strong> {hasDetails.childBelow10Count || "N/A"}</p>
                                              {hasDetails.childBelow10Names && <p><strong>Children Names:</strong> {hasDetails.childBelow10Names}</p>}
                                              <p><strong>Children 10-14:</strong> {hasDetails.child10to14Count || "N/A"}</p>
                                              {hasDetails.child10to14Names && <p><strong>Children Names:</strong> {hasDetails.child10to14Names}</p>}
                                              <p><strong>Total Family Members:</strong> {hasDetails.totalFamilyMembers || "N/A"}</p>
                                              <p><strong>Registration Status:</strong> <span className={`badge ${hasDetails.registrationStatus === "approved" ? "bg-success" : hasDetails.registrationStatus === "rejected" ? "bg-danger" : "bg-warning"}`}>{hasDetails.registrationStatus || "N/A"}</span></p>
                                              <p><strong>Amount Paid:</strong> ₹{hasDetails.amountPaid || 0}</p>
                                              <p><strong>Total Amount:</strong> ₹{hasDetails.totalAmount || 0}</p>
                                              <p><strong>Balance:</strong> ₹{hasDetails.balance || 0}</p>
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="mt-2 p-2 bg-info bg-opacity-10 rounded">
                      <small className="text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        <strong>Tip:</strong> Click the link button to copy the WhatsApp group link. 
                        Click the info button to view complete user details. Click the trash button to delete from database.
                      </small>
                    </div>
                  </div>
                )}
                
                {emailStatus && (
                  <div className="mt-3 p-3 bg-light rounded">
                    <h6 className="fw-bold">Email Status:</h6>
                    <p className="mb-1">Total Sent: <strong className="text-success">{emailStatus.totalSent}</strong></p>
                    <p className="mb-1">Total Failed: <strong className="text-danger">{emailStatus.totalFailed}</strong></p>
                    <div className="row mt-2">
                      <div className="col-md-6">
                        <p className="mb-1 small">
                          <strong>West Rayalaseema:</strong> {emailStatus.westRayalaseema.sent} sent, {emailStatus.westRayalaseema.failed} failed
                        </p>
                      </div>
                      <div className="col-md-6">
                        <p className="mb-1 small">
                          <strong>East Rayalaseema:</strong> {emailStatus.eastRayalaseema.sent} sent, {emailStatus.eastRayalaseema.failed} failed
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Logout Button - At Bottom */}
        <div className="text-center mt-auto pt-4">
          <button className="btn btn-danger btn-sm fw-bold px-4" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right me-1"></i>Logout
          </button>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .dashboard-module:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }
        @media(max-width: 768px) {
          .dashboard-module .card-body {
            padding: 0.75rem !important;
          }
          .dashboard-module i {
            font-size: 28px !important;
          }
          .dashboard-module h5 {
            font-size: 14px !important;
          }
          .dashboard-module .small {
            font-size: 11px !important;
          }
        }
      `}</style>
    </div>
  );
}

