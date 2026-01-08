import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_ENDPOINTS } from "./constants";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

// Pricing function based on region and group type (reused from TreasurerSummary)
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

// Region-District mapping
const REGION_DISTRICTS = {
  "East Rayalaseema": ["Annamayya", "Chittoor", "Tirupati", "Other"],
  "West Rayalaseema": ["Anantapur", "Sri Sathya Sai", "YSR Kadapa", "Other"]
};

// Categories
const CATEGORIES = [
  "Family",
  "Single Graduate (Employed)",
  "Single Graduate (Unemployed)",
  "Graduates' children (15+)",
  "Students",
  "Volunteers"
];

// Genders for splitting categories (except Family)
// Using lowercase to match Statistics module normalization
const GENDERS = ["male", "female"];

/**
 * Helper function to normalize gender (REUSED from DistrictPlacePeopleDetails)
 * Returns "male", "female", or null
 */
const getGender = (gender) => {
  if (!gender) return null;
  const g = gender.toLowerCase().trim();
  // Check for "female" first (more specific) before "male" to avoid false matches
  // "female" contains "male", so we must check "female" first
  if (g.includes("female") || g === "f") return "female";
  if (g.includes("male") || g === "m") return "male";
  return null;
};

/**
 * Get display label for category card
 * For Family: returns "Family"
 * For others: returns "Category – Gender" (capitalized for display)
 */
const getCategoryLabel = (category, gender = null) => {
  if (category === "Family") {
    return "Family";
  }
  if (gender) {
    // Capitalize first letter for display
    const genderDisplay = gender.charAt(0).toUpperCase() + gender.slice(1);
    return `${category} – ${genderDisplay}`;
  }
  return category;
};

/**
 * Get category key for counting/filtering
 * For Family: returns "Family"
 * For others: returns "Category_Gender" format (lowercase)
 */
const getCategoryKey = (category, gender = null) => {
  if (category === "Family") {
    return "Family";
  }
  return gender ? `${category}_${gender}` : category;
};

export default function EventDayVerification() {
  const navigate = useNavigate();
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [registrations, setRegistrations] = useState([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState({});

  // Check authentication
  useEffect(() => {
    const registrarToken = localStorage.getItem("registrarToken");
    const adminToken = localStorage.getItem("adminToken");
    if (!registrarToken && !adminToken) {
      if (!adminToken) {
        navigate("/registrar-login");
      } else {
        navigate("/admin-login");
      }
    }
  }, [navigate]);

  // Fetch registrations when district is selected
  useEffect(() => {
    if (selectedRegion && selectedDistrict) {
      fetchRegistrations();
    } else {
      setRegistrations([]);
      setFilteredRegistrations([]);
      setCategoryCounts({});
    }
  }, [selectedRegion, selectedDistrict]);

  // Update category counts when registrations change
  // Now includes gender-based splits for non-Family categories
  // Uses getGender() normalization to match Statistics module logic
  useEffect(() => {
    if (filteredRegistrations.length > 0) {
      const counts = {};
      
      // TEMPORARY DEBUG: Log sample registration data
      if (filteredRegistrations.length > 0) {
        const sampleReg = filteredRegistrations[0];
        console.log("[DEBUG] Sample registration:", {
          rawGender: sampleReg.gender,
          normalizedGender: getGender(sampleReg.gender),
          groupType: sampleReg.groupType,
          name: sampleReg.name || sampleReg.fullName
        });
      }
      
      CATEGORIES.forEach(category => {
        if (category === "Family") {
          // Family: no gender split
          const categoryRegs = filteredRegistrations.filter(reg => {
            const regCategory = reg.groupType || "";
            return regCategory === category;
          });
          counts[category] = categoryRegs.length;
        } else {
          // Other categories: split by gender using normalized gender values
          GENDERS.forEach(gender => {
            const categoryKey = getCategoryKey(category, gender);
            const categoryRegs = filteredRegistrations.filter(reg => {
              const regCategory = reg.groupType || "";
              const normalizedGender = getGender(reg.gender);
              return regCategory === category && normalizedGender === gender;
            });
            counts[categoryKey] = categoryRegs.length;
            
            // TEMPORARY DEBUG: Log counts per category+gender
            if (categoryRegs.length > 0) {
              console.log(`[DEBUG] ${category} - ${gender}: ${categoryRegs.length} registrations`);
            }
          });
        }
      });
      
      // TEMPORARY DEBUG: Log final counts
      console.log("[DEBUG] Final category counts:", counts);
      
      setCategoryCounts(counts);
    } else {
      setCategoryCounts({});
    }
  }, [filteredRegistrations]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.REGISTRATIONS);
      const result = await res.json();
      
      if (result.success) {
        let allRegistrations = result.data || [];
        
        // Filter by region
        allRegistrations = allRegistrations.filter(reg => {
          const regRegion = (reg.region || "").trim();
          return regRegion === selectedRegion;
        });

        // Filter by district
        allRegistrations = allRegistrations.filter(reg => {
          const regDistrict = (reg.district || "").trim();
          return regDistrict === selectedDistrict;
        });

        // Filter only approved registrations
        // Use the same status check logic as RegistrationList
        allRegistrations = allRegistrations.filter(reg => {
          const status = reg.registrationStatus || 
                        reg.transactions?.[reg.transactions.length - 1]?.status || 
                        "pending";
          return status === "approved";
        });

        // Remove duplicates based on transactionId (same logic as TreasurerSummary)
        const seenTransactionIds = new Set();
        const uniqueRegistrations = allRegistrations.filter(reg => {
          const txId = reg.transactionId?.trim();
          if (!txId) {
            return true; // Keep records without transactionId
          }
          if (seenTransactionIds.has(txId)) {
            return false; // Skip duplicates
          }
          seenTransactionIds.add(txId);
          return true;
        });

        setRegistrations(uniqueRegistrations);
        setFilteredRegistrations(uniqueRegistrations);
      } else {
        toast.error("Failed to load registrations");
      }
    } catch (err) {
      console.error("Error fetching registrations:", err);
      toast.error("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  const handleRegionChange = (e) => {
    const region = e.target.value;
    setSelectedRegion(region);
    setSelectedDistrict(""); // Reset district when region changes
    setRegistrations([]);
    setFilteredRegistrations([]);
    setCategoryCounts({});
  };

  const handleDistrictClick = (district) => {
    setSelectedDistrict(district);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "Rs. 0";
    // Use simple format for PDF compatibility - avoid Unicode ₹ symbol and locale formatting
    const num = Number(amount);
    // Format with commas manually for better PDF compatibility
    const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `Rs. ${formatted}`;
  };

  const sanitizeFileName = (name) => {
    return name.replace(/[^a-zA-Z0-9]/g, "_");
  };

  /**
   * Filter registrations by category and gender
   * For Family: ignores gender
   * For others: filters by both category and gender
   * Uses getGender() normalization to match Statistics module logic
   */
  const filterRegistrationsByCategoryAndGender = (category, gender = null) => {
    return filteredRegistrations.filter(reg => {
      const regCategory = reg.groupType || "";
      if (regCategory !== category) {
        return false;
      }
      
      // Family: no gender filter
      if (category === "Family") {
        return true;
      }
      
      // Other categories: filter by normalized gender
      if (gender) {
        const normalizedGender = getGender(reg.gender);
        return normalizedGender === gender;
      }
      
      return true;
    });
  };

  /**
   * Generate Excel file for category/gender combination
   */
  const generateCategoryExcel = (category, gender = null) => {
    if (!selectedRegion || !selectedDistrict) {
      toast.error("Please select region and district first");
      return;
    }

    // Filter registrations by category and gender
    const categoryRegistrations = filterRegistrationsByCategoryAndGender(category, gender);

    if (categoryRegistrations.length === 0) {
      const label = getCategoryLabel(category, gender);
      toast.info(`No registrations found for ${label} in ${selectedDistrict}`);
      return;
    }

    // Prepare Excel data
    const excelData = categoryRegistrations.map((reg, index) => {
      const totalAmount = getTotalAmount(
        reg.region,
        reg.groupType,
        reg.maritalStatus,
        reg.spouseAttending
      );
      const amountPaid = reg.amountPaid || 0;
      // Calculate balance: Math.max(0, totalAmount - amountPaid) - same logic as TreasurerSummary
      const balance = Math.max(0, totalAmount - amountPaid);
      const paymentDate = reg.paymentDate || reg.dateOfPayment || reg.updatedAt || reg.createdAt;

      // TEMPORARY DEBUG: Log balance calculation for Excel
      if (index < 3) {
        console.log(`[DEBUG Excel] Balance calculation for ${reg.name || reg.fullName}:`, {
          totalAmount,
          amountPaid,
          calculatedBalance: balance
        });
      }

      return {
        "S.No": index + 1,
        "Name": reg.name || reg.fullName || "N/A",
        "Gender": reg.gender || "N/A",
        "SPICON ID": reg.uniqueId || "N/A",
        "Place": reg.iceuEgf || "N/A",
        "Payment Date": formatDate(paymentDate),
        "Transaction ID": reg.transactionId || "N/A",
        "Total Amount": totalAmount,
        "Amount Paid": amountPaid,
        "Balance": balance, // Calculated from totalAmount - amountPaid
        "Sign": "" // Empty for manual signature
      };
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 6 },   // S.No
      { wch: 25 },  // Name
      { wch: 10 },  // Gender
      { wch: 20 },  // SPICON ID
      { wch: 20 },  // Place
      { wch: 15 },  // Payment Date
      { wch: 20 },  // Transaction ID
      { wch: 15 },  // Total Amount
      { wch: 15 },  // Amount Paid
      { wch: 12 },  // Balance
      { wch: 12 }   // Sign
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Registrations');

    // Generate filename
    const sanitizedDistrict = sanitizeFileName(selectedDistrict);
    const sanitizedCategory = sanitizeFileName(category);
    const sanitizedGender = gender ? `_${sanitizeFileName(gender)}` : "";
    const filename = `${sanitizedDistrict}_${sanitizedCategory}${sanitizedGender}.xlsx`;

    // Write file
    XLSX.writeFile(wb, filename);
    toast.success(`Excel downloaded: ${filename}`);
  };

  const generateCategoryPDF = (category, gender = null, viewOnly = false) => {
    if (!selectedRegion || !selectedDistrict) {
      toast.error("Please select region and district first");
      return;
    }

    // Filter registrations by category and gender
    const categoryRegistrations = filterRegistrationsByCategoryAndGender(category, gender);

    if (categoryRegistrations.length === 0) {
      toast.info(`No registrations found for ${category} in ${selectedDistrict}`);
      return;
    }

    // Prepare table data
    const tableData = categoryRegistrations.map((reg, index) => {
      const totalAmount = getTotalAmount(
        reg.region,
        reg.groupType,
        reg.maritalStatus,
        reg.spouseAttending
      );
      const amountPaid = reg.amountPaid || 0;
      // Calculate balance: Math.max(0, totalAmount - amountPaid) - same logic as TreasurerSummary
      const balance = Math.max(0, totalAmount - amountPaid);
      const paymentDate = reg.paymentDate || reg.dateOfPayment || reg.updatedAt || reg.createdAt;

      const totalAmountFormatted = formatCurrency(totalAmount);
      const amountPaidFormatted = formatCurrency(amountPaid);
      const balanceFormatted = formatCurrency(balance);

      // TEMPORARY DEBUG: Log balance calculation
      if (index < 3) {
        console.log(`[DEBUG] Balance calculation for ${reg.name || reg.fullName}:`, {
          totalAmount,
          amountPaid,
          calculatedBalance: balance,
          formattedBalance: balanceFormatted
        });
      }

      return [
        index + 1, // S.No
        reg.name || reg.fullName || "N/A", // Name
        reg.gender || "N/A", // Gender
        reg.uniqueId || "N/A", // SPICON ID
        reg.iceuEgf || "N/A", // Place
        formatDate(paymentDate), // Payment Date
        reg.transactionId || "N/A", // Transaction ID
        totalAmountFormatted, // Total Amount
        amountPaidFormatted, // Amount Paid
        balanceFormatted, // Balance (calculated from totalAmount - amountPaid)
        "", // Accommodation Amount (empty for manual filling)
        "" // Sign (empty for manual signature)
      ];
    });

    // Create PDF
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // A4 page width in mm: 210mm
    // Calculate column widths to fit all 11 columns
    const pageWidth = 210;
    const leftMargin = 5; // Minimal margin for maximum space
    const rightMargin = 5; // Minimal margin for maximum space
    const usableWidth = pageWidth - leftMargin - rightMargin; // 200mm

    // Define column widths (in mm) - optimized to fit all columns
    // Total must be <= usableWidth (200mm)
    // Priority: Ensure Total Amount and Amount Paid are fully visible
    // Reduced some columns to ensure all 12 columns fit
    const columnWidths = [
      6,   // S.No (very small) - reduced from 6
      21,  // Name (flexible, will wrap) - reduced from 22
      12,  // Gender (small) - reduced from 12
      25,  // SPICON ID (medium) - reduced from 25
      15,  // Place (medium, will wrap) - reduced from 16
      15,  // Payment Date (small-medium) - reduced from 15
      19,  // Transaction ID (medium, will wrap) - reduced from 19
      17,  // Total Amount - reduced from 22
      17,  // Amount Paid - reduced from 22
      18,  // Balance - reduced from 20
      22,  // Accommodation Amount
      24   // Sign - reduced from 24
    ];
    // Total: 198mm (fits comfortably within 200mm usable width)
    const totalTableWidth = columnWidths.reduce((sum, width) => sum + width, 0);

    // Add main heading - SPICON 2026 (Region) (centered)
    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    const mainHeading = `SPICON 2026 (${selectedRegion})`;
    const mainHeadingWidth = doc.getTextWidth(mainHeading);
    doc.text(mainHeading, (pageWidth - mainHeadingWidth) / 2, 12);

    // Add district and category title (centered)
    doc.setFontSize(12);
    doc.setFont(undefined, "normal");
    const categoryLabel = getCategoryLabel(category, gender);
    const title = `${selectedDistrict} - ${categoryLabel}`;
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, 20);

    // Add table
    doc.autoTable({
      head: [[
        "S.No",
        "Name",
        "Gender",
        "SPICON ID",
        "Place",
        "Payment Date",
        "Transaction ID",
        "Total Amount",
        "Amount Paid",
        "Balance",
        "Accommodation(Room Number)",
        "Sign"
      ]],
      body: tableData,
      startY: 26,
      columnStyles: {
        0: { cellWidth: columnWidths[0], fontSize: 7, halign: "center" },
        1: { cellWidth: columnWidths[1], fontSize: 7, overflow: "linebreak", halign: "left" },
        2: { cellWidth: columnWidths[2], fontSize: 7, halign: "center" },
        3: { cellWidth: columnWidths[3], fontSize: 7, halign: "left" },
        4: { cellWidth: columnWidths[4], fontSize: 7, overflow: "linebreak", halign: "left" },
        5: { cellWidth: columnWidths[5], fontSize: 7, halign: "center" },
        6: { cellWidth: columnWidths[6], fontSize: 7, overflow: "linebreak", halign: "left" },
        7: { cellWidth: columnWidths[7], fontSize: 8, halign: "right", overflow: "linebreak", minCellHeight: 5 },
        8: { cellWidth: columnWidths[8], fontSize: 8, halign: "right", overflow: "linebreak", minCellHeight: 5 },
        9: { cellWidth: columnWidths[9], fontSize: 7, halign: "center" },
        10: { cellWidth: columnWidths[10], fontSize: 7, halign: "center" }, // Accommodation Amount
        11: { cellWidth: columnWidths[11], fontSize: 7, halign: "center" } // Sign
      },
      styles: {
        fontSize: 7, // Base font size
        cellPadding: 1.5, // Reduced from 2
        overflow: "linebreak", // Default overflow
        lineWidth: 0.1, // Thicker grid lines for better visibility
        lineColor: [0, 0, 0], // Black borders for clear visibility
        textColor: [0, 0, 0] // Ensure text is visible
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 7, // Base font size
        cellPadding: 1.5, // Reduced padding
        halign: "center"
      },
      didParseCell: function (data) {
        // Center all table headings
        if (data.section === "head") {
          data.cell.styles.halign = "center";
          // Ensure header text is white for all columns
          data.cell.styles.textColor = 255; // White text for headers
        }
        // Ensure Total Amount and Amount Paid columns are fully visible
        if (data.column.index === 7 || data.column.index === 8) {
          // Total Amount (index 7) and Amount Paid (index 8)
          if (data.section === "head") {
            data.cell.styles.halign = "center"; // Center header
            data.cell.styles.fontSize = 8;
            data.cell.styles.textColor = 255; // White text for header
          } else {
            // Body cells - right align for numbers
            data.cell.styles.halign = "right";
            data.cell.styles.fontSize = 8;
            data.cell.styles.textColor = [0, 0, 0]; // Black text for body
          }
          // Ensure text is not clipped
          data.cell.styles.overflow = "linebreak";
        }
      },
      bodyStyles: {
        fontSize: 7,
        cellPadding: 1.5
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250] // Lighter for better printing
      },
      margin: { 
        top: 15, // Reduced from 20
        right: rightMargin, 
        bottom: 10, // Reduced from 15
        left: leftMargin 
      },
      // Set explicit table width to ensure all columns are included
      // Use the sum of all column widths
      tableWidth: totalTableWidth,
      // Force all columns to be included
      showHead: "everyPage",
      theme: "grid",
      useCss: false, // Disable CSS to ensure proper rendering
      // Prevent column splitting
      horizontalPageBreak: false,
      horizontalPageBreakRepeat: 0,
      didDrawCell: function (data) {
        // Cell drawing callback - can be used for custom styling if needed
      }
    });

    // Generate filename
    const sanitizedDistrict = sanitizeFileName(selectedDistrict);
    const sanitizedCategory = sanitizeFileName(category);
    const sanitizedGender = gender ? `_${sanitizeFileName(gender)}` : "";
    const filename = `${sanitizedDistrict}_${sanitizedCategory}${sanitizedGender}.pdf`;

    if (viewOnly) {
      // Open in new tab
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, "_blank");
      toast.success("PDF opened in new tab");
    } else {
      // Download
      doc.save(filename);
      toast.success(`PDF downloaded: ${filename}`);
    }
  };

  const availableDistricts = selectedRegion ? REGION_DISTRICTS[selectedRegion] || [] : [];

  return (
    <div className="container-fluid mt-3" style={{ minHeight: "100vh", paddingBottom: "20px" }}>
      <ToastContainer position="top-right" autoClose={2000} />

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h4 className="fw-bold">Event Day Verification</h4>
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

      {/* Region Filter */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <label htmlFor="region" className="form-label fw-bold mb-3">
            Select Region *
          </label>
          <select
            id="region"
            className="form-select form-select-lg"
            value={selectedRegion}
            onChange={handleRegionChange}
          >
            <option value="">Choose Region</option>
            <option value="East Rayalaseema">East Rayalaseema</option>
            <option value="West Rayalaseema">West Rayalaseema</option>
          </select>
        </div>
      </div>

      {/* District Selection */}
      {selectedRegion && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5 className="fw-bold mb-3">Select District</h5>
            <div className="row g-3">
              {availableDistricts.map((district) => (
                <div key={district} className="col-12 col-md-6 col-lg-3">
                  <button
                    className={`btn w-100 ${
                      selectedDistrict === district
                        ? "btn-primary"
                        : "btn-outline-primary"
                    }`}
                    onClick={() => handleDistrictClick(district)}
                    style={{ minHeight: "60px" }}
                  >
                    <strong>{district}</strong>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading registrations...</p>
        </div>
      )}

      {/* Category Section */}
      {!loading && selectedRegion && selectedDistrict && (
        <div className="card shadow-sm">
          <div className="card-body">
            <h5 className="fw-bold mb-4">
              Categories for {selectedDistrict} ({filteredRegistrations.length} total registrations)
            </h5>
            <div className="row g-3">
              {CATEGORIES.map((category) => {
                if (category === "Family") {
                  // Family: single card, no gender split
                  const count = categoryCounts[category] || 0;
                  return (
                    <div key={category} className="col-12 col-md-6 col-lg-4">
                      <div className="card border h-100">
                        <div className="card-body">
                          <h6 className="fw-bold mb-2">{getCategoryLabel(category)}</h6>
                          <p className="text-muted small mb-3">
                            {count} registration{count !== 1 ? "s" : ""}
                          </p>
                          <div className="d-flex flex-column gap-2">
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-info btn-sm flex-fill"
                                onClick={() => generateCategoryPDF(category, null, true)}
                                disabled={count === 0}
                                title="View PDF in new tab"
                              >
                                <i className="bi bi-eye me-1"></i>View PDF
                              </button>
                              <button
                                className="btn btn-success btn-sm flex-fill"
                                onClick={() => generateCategoryPDF(category, null, false)}
                                disabled={count === 0}
                                title="Download PDF file"
                              >
                                <i className="bi bi-download me-1"></i>Download PDF
                              </button>
                            </div>
                            <button
                              className="btn btn-warning btn-sm w-100"
                              onClick={() => generateCategoryExcel(category, null)}
                              disabled={count === 0}
                              title="Download Excel file"
                            >
                              <i className="bi bi-file-earmark-excel me-1"></i>Download Excel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  // Other categories: split by gender (Male and Female)
                  return GENDERS.map((gender) => {
                    const categoryKey = getCategoryKey(category, gender);
                    const count = categoryCounts[categoryKey] || 0;
                    return (
                      <div key={categoryKey} className="col-12 col-md-6 col-lg-4">
                        <div className="card border h-100">
                          <div className="card-body">
                            <h6 className="fw-bold mb-2">{getCategoryLabel(category, gender)}</h6>
                            <p className="text-muted small mb-3">
                              {count} registration{count !== 1 ? "s" : ""}
                            </p>
                            <div className="d-flex flex-column gap-2">
                              <div className="d-flex gap-2">
                                <button
                                  className="btn btn-info btn-sm flex-fill"
                                  onClick={() => generateCategoryPDF(category, gender, true)}
                                  disabled={count === 0}
                                  title="View PDF in new tab"
                                >
                                  <i className="bi bi-eye me-1"></i>View PDF
                                </button>
                                <button
                                  className="btn btn-success btn-sm flex-fill"
                                  onClick={() => generateCategoryPDF(category, gender, false)}
                                  disabled={count === 0}
                                  title="Download PDF file"
                                >
                                  <i className="bi bi-download me-1"></i>Download PDF
                                </button>
                              </div>
                              <button
                                className="btn btn-warning btn-sm w-100"
                                onClick={() => generateCategoryExcel(category, gender)}
                                disabled={count === 0}
                                title="Download Excel file"
                              >
                                <i className="bi bi-file-earmark-excel me-1"></i>Download Excel
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                }
              })}
            </div>
            {filteredRegistrations.length === 0 && (
              <div className="alert alert-warning mt-3">
                <i className="bi bi-exclamation-triangle me-2"></i>
                No approved registrations found for {selectedDistrict} in {selectedRegion}.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      {selectedRegion && selectedDistrict && !loading && (
        <div className="alert alert-info mt-3">
          <h6 className="fw-bold">
            <i className="bi bi-info-circle me-2"></i>Instructions
          </h6>
          <ul className="mb-0 small">
            <li>Select a region and district to view category-wise PDF options</li>
            <li>Each PDF contains a printable table with registration details</li>
            <li>Balance and Sign columns are left empty for manual filling on event day</li>
            <li>Use "View PDF" to preview or "Download" to save the file</li>
          </ul>
        </div>
      )}
    </div>
  );
}

