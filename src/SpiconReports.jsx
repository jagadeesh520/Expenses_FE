import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_ENDPOINTS } from "./constants";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

export default function SpiconReports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfBlob, setPdfBlob] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("registrarToken");
    if (!token) {
      navigate("/registrar-login");
      return;
    }
    loadReportData();
  }, [navigate]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.REGISTRATIONS);
      const result = await res.json();

      if (result.success) {
        const registrations = result.data || [];
        const processed = processRegistrations(registrations);
        setReportData(processed);
      } else {
        toast.error("Failed to load registration data");
      }
    } catch (err) {
      console.error("Error loading report data:", err);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const processRegistrations = (registrations) => {
    // Filter out gifts
    const regularRegistrations = registrations.filter((reg) => reg.type !== "gift");

    // Calculate balance for each registration
    const registrationsWithBalance = regularRegistrations.map((reg) => {
      const totalAmount = calculateTotalAmount(reg);
      const amountPaid = Number(reg.amountPaid) || 0;
      const balanceAmount = Math.max(0, totalAmount - amountPaid);
      const attended = balanceAmount === 0;

      return {
        ...reg,
        totalAmount,
        amountPaid,
        balanceAmount,
        attended,
      };
    });

    // Group by region → district → gender
    const regionMap = {};

    registrationsWithBalance.forEach((reg) => {
      const region = reg.region || "Unknown Region";
      const district = reg.district || "Unknown District";
      const gender = reg.gender || "Other";

      if (!regionMap[region]) {
        regionMap[region] = {
          name: region,
          totalRegistrations: 0,
          totalAttended: 0,
          genderCounts: { Male: 0, Female: 0, Other: 0 },
          districts: {},
        };
      }

      const regionData = regionMap[region];
      regionData.totalRegistrations++;

      if (reg.attended) {
        regionData.totalAttended++;
        if (gender === "Male") regionData.genderCounts.Male++;
        else if (gender === "Female") regionData.genderCounts.Female++;
        else regionData.genderCounts.Other++;
      }

      if (!regionData.districts[district]) {
        regionData.districts[district] = {
          name: district,
          totalRegistrations: 0,
          totalAttended: 0,
          genderCounts: { Male: 0, Female: 0, Other: 0 },
        };
      }

      const districtData = regionData.districts[district];
      districtData.totalRegistrations++;

      if (reg.attended) {
        districtData.totalAttended++;
        if (gender === "Male") districtData.genderCounts.Male++;
        else if (gender === "Female") districtData.genderCounts.Female++;
        else districtData.genderCounts.Other++;
      }
    });

    // Convert to array and sort
    const regions = Object.values(regionMap).map((region) => ({
      ...region,
      districts: Object.values(region.districts).sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    }));

    regions.sort((a, b) => a.name.localeCompare(b.name));

    // Calculate overall totals
    const overallTotals = {
      totalRegistrations: registrationsWithBalance.length,
      totalAttended: registrationsWithBalance.filter((r) => r.attended).length,
      genderCounts: {
        Male: registrationsWithBalance.filter((r) => r.attended && r.gender === "Male").length,
        Female: registrationsWithBalance.filter((r) => r.attended && r.gender === "Female").length,
        Other: registrationsWithBalance.filter((r) => r.attended && (r.gender !== "Male" && r.gender !== "Female")).length,
      },
    };

    return {
      regions,
      overallTotals,
      generatedAt: new Date().toLocaleString(),
    };
  };

  const calculateTotalAmount = (reg) => {
    const region = (reg.region || "").toLowerCase();
    const groupType = (reg.groupType || "").toLowerCase();

    if (region.includes("west")) {
      if (groupType.includes("family")) return 2500;
      if (groupType.includes("employed") && !groupType.includes("unemployed")) return 1300;
      if (groupType.includes("unemployed") || groupType.includes("students")) return 500;
      if (groupType.includes("children") || groupType.includes("15+")) return 500;
      if (groupType.includes("volunteer")) return 250;
    }

    if (region.includes("east")) {
      if (groupType.includes("family")) {
        if (reg.spouseAttending && reg.spouseAttending.toLowerCase().includes("yes")) return 2500;
        return 2000;
      }
      if (groupType.includes("employed") && !groupType.includes("unemployed")) return 1300;
      if (groupType.includes("unemployed") || groupType.includes("students")) return 500;
      if (groupType.includes("children") || groupType.includes("15+")) return 500;
      if (groupType.includes("volunteer")) return 200;
    }

    return 0;
  };

  const generatePDF = () => {
    if (!reportData) {
      toast.error("No report data available");
      return;
    }

    try {
      // US Letter size: 8.5 x 11 inches = 215.9 x 279.4 mm
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [215.9, 279.4], // US Letter
      });

      // Margins: 20-25mm
      const margin = 20;
      let yPos = margin;

      // Title
      doc.setFontSize(18);
      doc.setFont(undefined, "bold");
      doc.text("SPICON Attendance Report", margin, yPos);
      yPos += 10;

      // Generated date
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.text(`Generated: ${reportData.generatedAt}`, margin, yPos);
      yPos += 15;

      // Overall Summary
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text("Overall Summary", margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      const summaryData = [
        ["Total Registrations", reportData.overallTotals.totalRegistrations],
        ["Total Attended", reportData.overallTotals.totalAttended],
        ["Male (Attended)", reportData.overallTotals.genderCounts.Male],
        ["Female (Attended)", reportData.overallTotals.genderCounts.Female],
        ["Other (Attended)", reportData.overallTotals.genderCounts.Other],
      ];

      doc.autoTable({
        startY: yPos,
        head: [["Metric", "Count"]],
        body: summaryData,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: "bold" },
        margin: { left: margin, right: margin },
      });

      yPos = doc.lastAutoTable.finalY + 15;

      // Region-wise Reports
      reportData.regions.forEach((region, regionIdx) => {
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          yPos = margin;
        }

        // Region Header
        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        doc.text(`${region.name}`, margin, yPos);
        yPos += 8;

        // Region Summary
        doc.setFontSize(10);
        doc.setFont(undefined, "normal");
        const regionSummary = [
          ["Total Registrations", region.totalRegistrations],
          ["Total Attended", region.totalAttended],
          ["Male (Attended)", region.genderCounts.Male],
          ["Female (Attended)", region.genderCounts.Female],
          ["Other (Attended)", region.genderCounts.Other],
        ];

        doc.autoTable({
          startY: yPos,
          head: [["Metric", "Count"]],
          body: regionSummary,
          theme: "grid",
          styles: { fontSize: 9, cellPadding: 2 },
          headStyles: { fillColor: [100, 150, 200], textColor: 255, fontStyle: "bold" },
          margin: { left: margin, right: margin },
        });

        yPos = doc.lastAutoTable.finalY + 10;

        // District-wise Breakdown
        if (region.districts.length > 0) {
          doc.setFontSize(12);
          doc.setFont(undefined, "bold");
          doc.text("District-wise Breakdown", margin, yPos);
          yPos += 8;

          const districtRows = region.districts.map((district) => [
            district.name,
            district.totalRegistrations,
            district.totalAttended,
            district.genderCounts.Male,
            district.genderCounts.Female,
            district.genderCounts.Other,
          ]);

          doc.autoTable({
            startY: yPos,
            head: [["District", "Total Reg.", "Attended", "Male", "Female", "Other"]],
            body: districtRows,
            theme: "grid",
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [150, 150, 150], textColor: 255, fontStyle: "bold" },
            margin: { left: margin, right: margin },
          });

          yPos = doc.lastAutoTable.finalY + 15;
        }
      });

      // Generate blob for preview
      const pdfBlob = doc.output("blob");
      setPdfBlob(pdfBlob);

      // Save PDF
      const timestamp = new Date().toISOString().split("T")[0];
      doc.save(`SPICON_Report_${timestamp}.pdf`);

      toast.success("PDF generated successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const viewPDFPreview = () => {
    if (!reportData) {
      toast.error("No report data available");
      return;
    }
    generatePDF();
    setShowPdfPreview(true);
  };

  const generateExcel = () => {
    if (!reportData) {
      toast.error("No report data available");
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      // Overall Summary Sheet
      const overallData = [
        ["SPICON Attendance Report"],
        [`Generated: ${reportData.generatedAt}`],
        [],
        ["Overall Summary"],
        ["Metric", "Count"],
        ["Total Registrations", reportData.overallTotals.totalRegistrations],
        ["Total Attended", reportData.overallTotals.totalAttended],
        ["Male (Attended)", reportData.overallTotals.genderCounts.Male],
        ["Female (Attended)", reportData.overallTotals.genderCounts.Female],
        ["Other (Attended)", reportData.overallTotals.genderCounts.Other],
      ];

      const overallWs = XLSX.utils.aoa_to_sheet(overallData);
      XLSX.utils.book_append_sheet(wb, overallWs, "Overall Summary");

      // Region-wise Sheets
      reportData.regions.forEach((region) => {
        const regionData = [
          [`${region.name} - Summary`],
          [],
          ["Metric", "Count"],
          ["Total Registrations", region.totalRegistrations],
          ["Total Attended", region.totalAttended],
          ["Male (Attended)", region.genderCounts.Male],
          ["Female (Attended)", region.genderCounts.Female],
          ["Other (Attended)", region.genderCounts.Other],
          [],
          ["District-wise Breakdown"],
          ["District", "Total Reg.", "Attended", "Male", "Female", "Other"],
        ];

        region.districts.forEach((district) => {
          regionData.push([
            district.name,
            district.totalRegistrations,
            district.totalAttended,
            district.genderCounts.Male,
            district.genderCounts.Female,
            district.genderCounts.Other,
          ]);
        });

        const regionWs = XLSX.utils.aoa_to_sheet(regionData);
        const sheetName = region.name.length > 31 ? region.name.substring(0, 31) : region.name;
        XLSX.utils.book_append_sheet(wb, regionWs, sheetName);
      });

      // Save Excel
      const timestamp = new Date().toISOString().split("T")[0];
      XLSX.writeFile(wb, `SPICON_Report_${timestamp}.xlsx`);

      toast.success("Excel file generated successfully!");
    } catch (error) {
      console.error("Error generating Excel:", error);
      toast.error("Failed to generate Excel file");
    }
  };

  if (loading) {
    return (
      <div className="container-fluid mt-3" style={{ minHeight: "100vh" }}>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="container-fluid mt-3" style={{ minHeight: "100vh" }}>
        <div className="alert alert-danger">No report data available</div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-3" style={{ minHeight: "100vh", paddingBottom: "20px" }}>
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="fw-bold">SPICON Attendance Reports</h4>
        <div className="d-flex gap-2">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate("/registrar-dashboard")}
          >
            <i className="bi bi-arrow-left me-1"></i>Back to Dashboard
          </button>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-file-earmark-text me-2"></i>Export Reports
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex flex-wrap gap-2">
                <button
                  className="btn btn-info"
                  onClick={viewPDFPreview}
                >
                  <i className="bi bi-eye me-2"></i>View PDF
                </button>
                <button
                  className="btn btn-danger"
                  onClick={generatePDF}
                >
                  <i className="bi bi-file-pdf me-2"></i>Download PDF
                </button>
                <button
                  className="btn btn-success"
                  onClick={generateExcel}
                >
                  <i className="bi bi-file-earmark-excel me-2"></i>Download Excel
                </button>
              </div>
              <p className="text-muted mt-2 mb-0 small">
                <i className="bi bi-info-circle me-1"></i>
                Reports are formatted for US Letter (8.5" × 11") paper size
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Summary */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-lg">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-calculator me-2"></i>Overall Summary
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="text-center p-3 border rounded">
                    <h6 className="text-muted mb-2">Total Registrations</h6>
                    <h4 className="fw-bold text-primary">
                      {reportData.overallTotals.totalRegistrations}
                    </h4>
                  </div>
                </div>
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="text-center p-3 border rounded">
                    <h6 className="text-muted mb-2">Total Attended</h6>
                    <h4 className="fw-bold text-success">
                      {reportData.overallTotals.totalAttended}
                    </h4>
                  </div>
                </div>
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="text-center p-3 border rounded">
                    <h6 className="text-muted mb-2">Attendance Rate</h6>
                    <h4 className="fw-bold text-info">
                      {reportData.overallTotals.totalRegistrations > 0
                        ? (
                            (reportData.overallTotals.totalAttended /
                              reportData.overallTotals.totalRegistrations) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </h4>
                  </div>
                </div>
              </div>
              <div className="row g-3 mt-2">
                <div className="col-12 col-md-4">
                  <div className="text-center p-3 border rounded bg-light">
                    <h6 className="text-muted mb-2">Male (Attended)</h6>
                    <h5 className="fw-bold text-primary">
                      {reportData.overallTotals.genderCounts.Male}
                    </h5>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="text-center p-3 border rounded bg-light">
                    <h6 className="text-muted mb-2">Female (Attended)</h6>
                    <h5 className="fw-bold text-primary">
                      {reportData.overallTotals.genderCounts.Female}
                    </h5>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="text-center p-3 border rounded bg-light">
                    <h6 className="text-muted mb-2">Other (Attended)</h6>
                    <h5 className="fw-bold text-primary">
                      {reportData.overallTotals.genderCounts.Other}
                    </h5>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Region-wise Reports */}
      {reportData.regions.map((region, regionIdx) => (
        <div key={regionIdx} className="row mb-4">
          <div className="col-12">
            <div className="card shadow-lg">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-geo-alt me-2"></i>{region.name}
                </h5>
              </div>
              <div className="card-body">
                {/* Region Summary */}
                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6 col-lg-3">
                    <div className="text-center p-3 border rounded">
                      <h6 className="text-muted mb-2">Total Registrations</h6>
                      <h4 className="fw-bold text-primary">{region.totalRegistrations}</h4>
                    </div>
                  </div>
                  <div className="col-12 col-md-6 col-lg-3">
                    <div className="text-center p-3 border rounded">
                      <h6 className="text-muted mb-2">Total Attended</h6>
                      <h4 className="fw-bold text-success">{region.totalAttended}</h4>
                    </div>
                  </div>
                  <div className="col-12 col-md-6 col-lg-2">
                    <div className="text-center p-3 border rounded bg-light">
                      <h6 className="text-muted mb-2 small">Male</h6>
                      <h5 className="fw-bold text-primary">{region.genderCounts.Male}</h5>
                    </div>
                  </div>
                  <div className="col-12 col-md-6 col-lg-2">
                    <div className="text-center p-3 border rounded bg-light">
                      <h6 className="text-muted mb-2 small">Female</h6>
                      <h5 className="fw-bold text-primary">{region.genderCounts.Female}</h5>
                    </div>
                  </div>
                  <div className="col-12 col-md-6 col-lg-2">
                    <div className="text-center p-3 border rounded bg-light">
                      <h6 className="text-muted mb-2 small">Other</h6>
                      <h5 className="fw-bold text-primary">{region.genderCounts.Other}</h5>
                    </div>
                  </div>
                </div>

                {/* District-wise Breakdown */}
                {region.districts.length > 0 && (
                  <div className="mt-4">
                    <h6 className="fw-bold mb-3">
                      <i className="bi bi-list-ul me-2"></i>District-wise Breakdown
                    </h6>
                    <div className="table-responsive">
                      <table className="table table-bordered table-striped" id={`district-table-${regionIdx}`}>
                        <thead className="table-dark">
                          <tr>
                            <th>District</th>
                            <th>Total Registrations</th>
                            <th>Total Attended</th>
                            <th>Male (Attended)</th>
                            <th>Female (Attended)</th>
                            <th>Other (Attended)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {region.districts.map((district, districtIdx) => (
                            <tr key={districtIdx}>
                              <td className="fw-bold">{district.name}</td>
                              <td>{district.totalRegistrations}</td>
                              <td className="text-success fw-bold">
                                {district.totalAttended}
                              </td>
                              <td>{district.genderCounts.Male}</td>
                              <td>{district.genderCounts.Female}</td>
                              <td>{district.genderCounts.Other}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* PDF Preview Modal */}
      {showPdfPreview && pdfBlob && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">PDF Preview</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPdfPreview(false)}
                ></button>
              </div>
              <div className="modal-body">
                <iframe
                  src={URL.createObjectURL(pdfBlob)}
                  style={{ width: "100%", height: "80vh", border: "none" }}
                  title="PDF Preview"
                ></iframe>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPdfPreview(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(pdfBlob);
                    link.download = `SPICON_Report_${new Date().toISOString().split("T")[0]}.pdf`;
                    link.click();
                  }}
                >
                  <i className="bi bi-download me-2"></i>Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          .btn, .card-header, .modal {
            display: none !important;
          }
          .card {
            page-break-inside: avoid;
            border: 1px solid #ddd;
          }
          body {
            font-size: 12pt;
          }
          table {
            font-size: 10pt;
          }
        }
      `}</style>
    </div>
  );
}
