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

  // Filter data by selected region
  const filteredRegistrations = registrations.filter((reg) => {
    if (selectedRegion === "all") return true;
    const regRegion = (reg.region || "").trim();
    return regRegion === selectedRegion;
  });

  // Helper function to check if registration is a student
  const isStudent = (groupType) => {
    if (!groupType) return false;
    return groupType.toLowerCase().includes("student");
  };

  // Helper function to check if registration is a single graduate
  const isSingleGraduate = (groupType) => {
    if (!groupType) return false;
    const gt = groupType.toLowerCase();
    return gt.includes("single graduate") || (gt.includes("graduate") && !gt.includes("family") && !gt.includes("children"));
  };

  // Helper function to check if single graduate is employed
  const isEmployed = (groupType) => {
    if (!groupType) return false;
    const gt = groupType.toLowerCase();
    return gt.includes("employed") && !gt.includes("unemployed");
  };

  // Helper function to check if single graduate is unemployed
  const isUnemployed = (groupType) => {
    if (!groupType) return false;
    const gt = groupType.toLowerCase();
    return gt.includes("unemployed");
  };

  // Helper function to check if registration is a volunteer
  const isVolunteer = (groupType) => {
    if (!groupType) return false;
    return groupType.toLowerCase().includes("volunteer");
  };

  // Helper function to check if registration is a family
  const isFamily = (groupType) => {
    if (!groupType) return false;
    return groupType.toLowerCase().includes("family");
  };

  // Helper function to parse age
  const parseAge = (age) => {
    if (!age) return null;
    const ageNum = parseInt(age);
    return isNaN(ageNum) ? null : ageNum;
  };

  // Helper function to check if child is below 10
  const isChildBelow10 = (age) => {
    const ageNum = parseAge(age);
    return ageNum !== null && ageNum < 10;
  };

  // Helper function to check if child is 10-14
  const isChild10to14 = (age) => {
    const ageNum = parseAge(age);
    return ageNum !== null && ageNum >= 10 && ageNum <= 14;
  };

  // Helper function to check if child is 15+
  const isChild15Plus = (age) => {
    const ageNum = parseAge(age);
    return ageNum !== null && ageNum >= 15;
  };

  // Helper function to get gender
  const getGender = (gender) => {
    if (!gender) return null;
    const g = gender.toLowerCase();
    if (g.includes("male") || g.includes("m")) return "male";
    if (g.includes("female") || g.includes("f")) return "female";
    return null;
  };

  // Helper function to get name
  const getName = (reg) => {
    return reg.name || reg.fullName || "";
  };

  // Process data for all categories
  const processData = () => {
    const data = {
      maleStudents: {}, // { district: { place: { names: [], count: 0 } } }
      femaleStudents: {},
      families: {}, // { district: { place: [ { headName, spouseName, childBelow10Names, childBelow10Count, child10to14Names, child10to14Count, totalCount } ] } }
      singleGraduateMalesEmployed: {},
      singleGraduateMalesUnemployed: {},
      singleGraduateFemalesEmployed: {},
      singleGraduateFemalesUnemployed: {},
      childrenBelow10: {}, // { district: { place: { count: 0 } } }
      children10to14: {}, // { district: { place: { names: [], count: 0 } } }
      children15Plus: {}, // { district: { place: { count: 0 } } }
      volunteers: {}
    };

    filteredRegistrations.forEach((reg) => {
      const district = reg.district || "Unknown";
      const place = reg.iceuEgf || "Unknown";
      const name = getName(reg);
      const gender = getGender(reg.gender);
      const groupType = reg.groupType || "";
      const age = parseAge(reg.age);

      // Initialize district if not exists
      const initDistrict = (category, structure = "namesAndCount") => {
        if (!data[category][district]) {
          data[category][district] = {};
        }
        if (!data[category][district][place]) {
          if (structure === "namesAndCount") {
            data[category][district][place] = { names: [], count: 0 };
          } else if (structure === "countOnly") {
            data[category][district][place] = { count: 0 };
          } else if (structure === "families") {
            data[category][district][place] = [];
          }
        }
      };

      // Male Students
      if (isStudent(groupType) && gender === "male" && name) {
        initDistrict("maleStudents", "namesAndCount");
        if (!data.maleStudents[district][place].names.includes(name)) {
          data.maleStudents[district][place].names.push(name);
          data.maleStudents[district][place].count++;
        }
      }

      // Female Students
      if (isStudent(groupType) && gender === "female" && name) {
        initDistrict("femaleStudents", "namesAndCount");
        if (!data.femaleStudents[district][place].names.includes(name)) {
          data.femaleStudents[district][place].names.push(name);
          data.femaleStudents[district][place].count++;
        }
      }

      // Families - Store complete family information
      if (isFamily(groupType) && name) {
        initDistrict("families", "families");
        // Check if this family already exists (by head name)
        const existingFamilyIndex = data.families[district][place].findIndex(f => f.headName === name);
        
        if (existingFamilyIndex === -1) {
          // Parse children data
          const childBelow10Count = parseInt(reg.childBelow10Count) || 0;
          const childBelow10Names = (reg.childBelow10Names || "").split(",").map(n => n.trim()).filter(n => n);
          const child10to14Count = parseInt(reg.child10to14Count) || 0;
          const child10to14Names = (reg.child10to14Names || "").split(",").map(n => n.trim()).filter(n => n);
          const spouseName = (reg.spouseName || "").trim();
          const totalCount = parseInt(reg.totalFamilyMembers) || 1;
          
          data.families[district][place].push({
            headName: name,
            spouseName: spouseName || null,
            childBelow10Names: childBelow10Names,
            childBelow10Count: childBelow10Count,
            child10to14Names: child10to14Names,
            child10to14Count: child10to14Count,
            totalCount: totalCount
          });
        }
      }

      // Single Graduate Males - Employed
      if (isSingleGraduate(groupType) && isEmployed(groupType) && gender === "male" && name) {
        initDistrict("singleGraduateMalesEmployed", "namesAndCount");
        if (!data.singleGraduateMalesEmployed[district][place].names.includes(name)) {
          data.singleGraduateMalesEmployed[district][place].names.push(name);
          data.singleGraduateMalesEmployed[district][place].count++;
        }
      }

      // Single Graduate Males - Unemployed
      if (isSingleGraduate(groupType) && isUnemployed(groupType) && gender === "male" && name) {
        initDistrict("singleGraduateMalesUnemployed", "namesAndCount");
        if (!data.singleGraduateMalesUnemployed[district][place].names.includes(name)) {
          data.singleGraduateMalesUnemployed[district][place].names.push(name);
          data.singleGraduateMalesUnemployed[district][place].count++;
        }
      }

      // Single Graduate Females - Employed
      if (isSingleGraduate(groupType) && isEmployed(groupType) && gender === "female" && name) {
        initDistrict("singleGraduateFemalesEmployed", "namesAndCount");
        if (!data.singleGraduateFemalesEmployed[district][place].names.includes(name)) {
          data.singleGraduateFemalesEmployed[district][place].names.push(name);
          data.singleGraduateFemalesEmployed[district][place].count++;
        }
      }

      // Single Graduate Females - Unemployed
      if (isSingleGraduate(groupType) && isUnemployed(groupType) && gender === "female" && name) {
        initDistrict("singleGraduateFemalesUnemployed", "namesAndCount");
        if (!data.singleGraduateFemalesUnemployed[district][place].names.includes(name)) {
          data.singleGraduateFemalesUnemployed[district][place].names.push(name);
          data.singleGraduateFemalesUnemployed[district][place].count++;
        }
      }

      // Volunteers
      if (isVolunteer(groupType) && name) {
        initDistrict("volunteers", "namesAndCount");
        if (!data.volunteers[district][place].names.includes(name)) {
          data.volunteers[district][place].names.push(name);
          data.volunteers[district][place].count++;
        }
      }

      // Children Statistics - Below 10 (count only)
      // NOTE: Exclude children from Family registrations - they appear only in Families table
      if (isChildBelow10(age) && !isFamily(groupType)) {
        initDistrict("childrenBelow10", "countOnly");
        data.childrenBelow10[district][place].count++;
      }

      // Children Statistics - 10-14 (names and count)
      // NOTE: Exclude children from Family registrations - they appear only in Families table
      if (isChild10to14(age) && name && !isFamily(groupType)) {
        initDistrict("children10to14", "namesAndCount");
        if (!data.children10to14[district][place].names.includes(name)) {
          data.children10to14[district][place].names.push(name);
          data.children10to14[district][place].count++;
        }
      }

      // Children Statistics - 15+ (count only)
      // NOTE: Exclude children from Family registrations - they appear only in Families table
      if (isChild15Plus(age) && !isFamily(groupType)) {
        initDistrict("children15Plus", "countOnly");
        data.children15Plus[district][place].count++;
      }
    });

    return data;
  };

  const processedData = processData();

  // Helper function to get volunteer counts by gender
  const getVolunteerCountsByGender = () => {
    const volunteerData = {
      male: {}, // { district: { place: { names: Set, count: number } } }
      female: {} // { district: { place: { names: Set, count: number } } }
    };

    filteredRegistrations.forEach((reg) => {
      if (isVolunteer(reg.groupType)) {
        const name = getName(reg);
        if (!name) return;
        
        const district = reg.district || "Unknown";
        const place = reg.iceuEgf || "Unknown";
        const gender = getGender(reg.gender);

        if (gender === "male") {
          if (!volunteerData.male[district]) {
            volunteerData.male[district] = {};
          }
          if (!volunteerData.male[district][place]) {
            volunteerData.male[district][place] = { names: new Set(), count: 0 };
          }
          if (!volunteerData.male[district][place].names.has(name)) {
            volunteerData.male[district][place].names.add(name);
            volunteerData.male[district][place].count++;
          }
        } else if (gender === "female") {
          if (!volunteerData.female[district]) {
            volunteerData.female[district] = {};
          }
          if (!volunteerData.female[district][place]) {
            volunteerData.female[district][place] = { names: new Set(), count: 0 };
          }
          if (!volunteerData.female[district][place].names.has(name)) {
            volunteerData.female[district][place].names.add(name);
            volunteerData.female[district][place].count++;
          }
        }
      }
    });

    // Convert to simple count structure
    const result = {
      male: {},
      female: {}
    };

    Object.keys(volunteerData.male).forEach(district => {
      result.male[district] = {};
      Object.keys(volunteerData.male[district]).forEach(place => {
        result.male[district][place] = volunteerData.male[district][place].count;
      });
    });

    Object.keys(volunteerData.female).forEach(district => {
      result.female[district] = {};
      Object.keys(volunteerData.female[district]).forEach(place => {
        result.female[district][place] = volunteerData.female[district][place].count;
      });
    });

    return result;
  };

  // Helper function to render the summary table
  const renderSummaryTable = () => {
    const volunteerCounts = getVolunteerCountsByGender();
    
    // Build summary data structure
    const summaryData = {};
    let grandTotal = {
      families: 0,
      singleGraduateMaleEmployed: 0,
      singleGraduateFemaleEmployed: 0,
      singleGraduateMaleUnemployed: 0,
      singleGraduateFemaleUnemployed: 0,
      studentsMale: 0,
      studentsFemale: 0,
      volunteersMale: 0,
      volunteersFemale: 0,
      childrenBelow15: 0,
      childrenAbove15: 0,
      total: 0
    };

    // Get all districts from all categories
    const allDistricts = new Set();
    Object.keys(processedData.maleStudents).forEach(d => allDistricts.add(d));
    Object.keys(processedData.femaleStudents).forEach(d => allDistricts.add(d));
    Object.keys(processedData.families).forEach(d => allDistricts.add(d));
    Object.keys(processedData.singleGraduateMalesEmployed).forEach(d => allDistricts.add(d));
    Object.keys(processedData.singleGraduateMalesUnemployed).forEach(d => allDistricts.add(d));
    Object.keys(processedData.singleGraduateFemalesEmployed).forEach(d => allDistricts.add(d));
    Object.keys(processedData.singleGraduateFemalesUnemployed).forEach(d => allDistricts.add(d));
    Object.keys(processedData.childrenBelow10).forEach(d => allDistricts.add(d));
    Object.keys(processedData.children10to14).forEach(d => allDistricts.add(d));
    Object.keys(processedData.children15Plus).forEach(d => allDistricts.add(d));
    Object.keys(volunteerCounts.male).forEach(d => allDistricts.add(d));
    Object.keys(volunteerCounts.female).forEach(d => allDistricts.add(d));

    const sortedDistricts = Array.from(allDistricts).sort();

    sortedDistricts.forEach((district) => {
      // Get all places for this district
      const allPlaces = new Set();
      
      // Collect places from all categories
      if (processedData.maleStudents[district]) {
        Object.keys(processedData.maleStudents[district]).forEach(p => allPlaces.add(p));
      }
      if (processedData.femaleStudents[district]) {
        Object.keys(processedData.femaleStudents[district]).forEach(p => allPlaces.add(p));
      }
      if (processedData.families[district]) {
        Object.keys(processedData.families[district]).forEach(p => allPlaces.add(p));
      }
      if (processedData.singleGraduateMalesEmployed[district]) {
        Object.keys(processedData.singleGraduateMalesEmployed[district]).forEach(p => allPlaces.add(p));
      }
      if (processedData.singleGraduateMalesUnemployed[district]) {
        Object.keys(processedData.singleGraduateMalesUnemployed[district]).forEach(p => allPlaces.add(p));
      }
      if (processedData.singleGraduateFemalesEmployed[district]) {
        Object.keys(processedData.singleGraduateFemalesEmployed[district]).forEach(p => allPlaces.add(p));
      }
      if (processedData.singleGraduateFemalesUnemployed[district]) {
        Object.keys(processedData.singleGraduateFemalesUnemployed[district]).forEach(p => allPlaces.add(p));
      }
      if (processedData.childrenBelow10[district]) {
        Object.keys(processedData.childrenBelow10[district]).forEach(p => allPlaces.add(p));
      }
      if (processedData.children10to14[district]) {
        Object.keys(processedData.children10to14[district]).forEach(p => allPlaces.add(p));
      }
      if (processedData.children15Plus[district]) {
        Object.keys(processedData.children15Plus[district]).forEach(p => allPlaces.add(p));
      }
      if (volunteerCounts.male[district]) {
        Object.keys(volunteerCounts.male[district]).forEach(p => allPlaces.add(p));
      }
      if (volunteerCounts.female[district]) {
        Object.keys(volunteerCounts.female[district]).forEach(p => allPlaces.add(p));
      }

      const sortedPlaces = Array.from(allPlaces).sort();
      
      if (!summaryData[district]) {
        summaryData[district] = {
          places: [],
          districtTotal: {
            families: 0,
            singleGraduateMaleEmployed: 0,
            singleGraduateFemaleEmployed: 0,
            singleGraduateMaleUnemployed: 0,
            singleGraduateFemaleUnemployed: 0,
            studentsMale: 0,
            studentsFemale: 0,
            volunteersMale: 0,
            volunteersFemale: 0,
            childrenBelow15: 0,
            childrenAbove15: 0,
            total: 0
          }
        };
      }

      sortedPlaces.forEach((place) => {
        // Get counts for each category
        const familiesCount = processedData.families[district]?.[place]?.length || 0;
        const singleGraduateMaleEmployed = processedData.singleGraduateMalesEmployed[district]?.[place]?.count || 0;
        const singleGraduateFemaleEmployed = processedData.singleGraduateFemalesEmployed[district]?.[place]?.count || 0;
        const singleGraduateMaleUnemployed = processedData.singleGraduateMalesUnemployed[district]?.[place]?.count || 0;
        const singleGraduateFemaleUnemployed = processedData.singleGraduateFemalesUnemployed[district]?.[place]?.count || 0;
        const studentsMale = processedData.maleStudents[district]?.[place]?.count || 0;
        const studentsFemale = processedData.femaleStudents[district]?.[place]?.count || 0;
        const volunteersMale = volunteerCounts.male[district]?.[place] || 0;
        const volunteersFemale = volunteerCounts.female[district]?.[place] || 0;
        
        // Children: Below 15 = Below 10 + 10-14
        const childrenBelow10 = processedData.childrenBelow10[district]?.[place]?.count || 0;
        const children10to14 = processedData.children10to14[district]?.[place]?.count || 0;
        const childrenBelow15 = childrenBelow10 + children10to14;
        const childrenAbove15 = processedData.children15Plus[district]?.[place]?.count || 0;

        // Calculate row total
        const rowTotal = familiesCount +
          singleGraduateMaleEmployed + singleGraduateFemaleEmployed +
          singleGraduateMaleUnemployed + singleGraduateFemaleUnemployed +
          studentsMale + studentsFemale +
          volunteersMale + volunteersFemale +
          childrenBelow15 + childrenAbove15;

        summaryData[district].places.push({
          place,
          families: familiesCount,
          singleGraduateMaleEmployed,
          singleGraduateFemaleEmployed,
          singleGraduateMaleUnemployed,
          singleGraduateFemaleUnemployed,
          studentsMale,
          studentsFemale,
          volunteersMale,
          volunteersFemale,
          childrenBelow15,
          childrenAbove15,
          total: rowTotal
        });

        // Add to district total
        summaryData[district].districtTotal.families += familiesCount;
        summaryData[district].districtTotal.singleGraduateMaleEmployed += singleGraduateMaleEmployed;
        summaryData[district].districtTotal.singleGraduateFemaleEmployed += singleGraduateFemaleEmployed;
        summaryData[district].districtTotal.singleGraduateMaleUnemployed += singleGraduateMaleUnemployed;
        summaryData[district].districtTotal.singleGraduateFemaleUnemployed += singleGraduateFemaleUnemployed;
        summaryData[district].districtTotal.studentsMale += studentsMale;
        summaryData[district].districtTotal.studentsFemale += studentsFemale;
        summaryData[district].districtTotal.volunteersMale += volunteersMale;
        summaryData[district].districtTotal.volunteersFemale += volunteersFemale;
        summaryData[district].districtTotal.childrenBelow15 += childrenBelow15;
        summaryData[district].districtTotal.childrenAbove15 += childrenAbove15;
        summaryData[district].districtTotal.total += rowTotal;

        // Add to grand total
        grandTotal.families += familiesCount;
        grandTotal.singleGraduateMaleEmployed += singleGraduateMaleEmployed;
        grandTotal.singleGraduateFemaleEmployed += singleGraduateFemaleEmployed;
        grandTotal.singleGraduateMaleUnemployed += singleGraduateMaleUnemployed;
        grandTotal.singleGraduateFemaleUnemployed += singleGraduateFemaleUnemployed;
        grandTotal.studentsMale += studentsMale;
        grandTotal.studentsFemale += studentsFemale;
        grandTotal.volunteersMale += volunteersMale;
        grandTotal.volunteersFemale += volunteersFemale;
        grandTotal.childrenBelow15 += childrenBelow15;
        grandTotal.childrenAbove15 += childrenAbove15;
        grandTotal.total += rowTotal;
      });
    });

    if (sortedDistricts.length === 0) return null;

    return (
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-warning text-dark">
          <h5 className="mb-0 fw-bold">District & Place wise Consolidated Summary</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-bordered table-striped mb-0">
              <thead className="table-light">
                <tr>
                  <th rowSpan="3" className="align-middle text-center" style={{ verticalAlign: "middle" }}>District</th>
                  <th rowSpan="3" className="align-middle text-center" style={{ verticalAlign: "middle" }}>Name of the EGF / ICEU</th>
                  <th rowSpan="3" className="align-middle text-center" style={{ verticalAlign: "middle" }}>Families</th>
                  <th colSpan="4" className="text-center">Single Graduates</th>
                  <th colSpan="2" className="text-center">Students</th>
                  <th colSpan="2" className="text-center">Volunteers</th>
                  <th colSpan="2" className="text-center">Children</th>
                  <th rowSpan="3" className="align-middle text-center bg-warning" style={{ verticalAlign: "middle" }}>TOTAL</th>
                </tr>
                <tr>
                  <th colSpan="2" className="text-center">Employed</th>
                  <th colSpan="2" className="text-center">Unemployed</th>
                  <th rowSpan="2" className="align-middle text-center" style={{ verticalAlign: "middle" }}>Male</th>
                  <th rowSpan="2" className="align-middle text-center" style={{ verticalAlign: "middle" }}>Female</th>
                  <th rowSpan="2" className="align-middle text-center" style={{ verticalAlign: "middle" }}>Male</th>
                  <th rowSpan="2" className="align-middle text-center" style={{ verticalAlign: "middle" }}>Female</th>
                  <th rowSpan="2" className="align-middle text-center" style={{ verticalAlign: "middle" }}>Below 15 Years</th>
                  <th rowSpan="2" className="align-middle text-center" style={{ verticalAlign: "middle" }}>Above 15 Years</th>
                </tr>
                <tr>
                  <th className="text-center">Male</th>
                  <th className="text-center">Female</th>
                  <th className="text-center">Male</th>
                  <th className="text-center">Female</th>
                </tr>
              </thead>
              <tbody>
                {sortedDistricts.map((district) => {
                  const districtData = summaryData[district];
                  const places = districtData.places;
                  const districtTotal = districtData.districtTotal;
                  
                  return (
                    <React.Fragment key={district}>
                      {places.map((placeData, placeIndex) => {
                        const isFirstPlace = placeIndex === 0;
                        return (
                          <tr key={`${district}-${placeData.place}`}>
                            {isFirstPlace && (
                              <td rowSpan={places.length + 1} className="fw-bold align-middle" style={{ verticalAlign: "middle" }}>
                                {district}
                              </td>
                            )}
                            <td className="fw-bold">{placeData.place}</td>
                            <td className="text-center">{placeData.families}</td>
                            <td className="text-center">{placeData.singleGraduateMaleEmployed}</td>
                            <td className="text-center">{placeData.singleGraduateFemaleEmployed}</td>
                            <td className="text-center">{placeData.singleGraduateMaleUnemployed}</td>
                            <td className="text-center">{placeData.singleGraduateFemaleUnemployed}</td>
                            <td className="text-center">{placeData.studentsMale}</td>
                            <td className="text-center">{placeData.studentsFemale}</td>
                            <td className="text-center">{placeData.volunteersMale}</td>
                            <td className="text-center">{placeData.volunteersFemale}</td>
                            <td className="text-center">{placeData.childrenBelow15}</td>
                            <td className="text-center">{placeData.childrenAbove15}</td>
                            <td className="text-center fw-bold bg-light">{placeData.total}</td>
                          </tr>
                        );
                      })}
                      {/* District Total Row */}
                      <tr className="table-info fw-bold">
                        <td className="bg-info text-white">Total ({district})</td>
                        <td className="text-center bg-info text-white">{districtTotal.families}</td>
                        <td className="text-center bg-info text-white">{districtTotal.singleGraduateMaleEmployed}</td>
                        <td className="text-center bg-info text-white">{districtTotal.singleGraduateFemaleEmployed}</td>
                        <td className="text-center bg-info text-white">{districtTotal.singleGraduateMaleUnemployed}</td>
                        <td className="text-center bg-info text-white">{districtTotal.singleGraduateFemaleUnemployed}</td>
                        <td className="text-center bg-info text-white">{districtTotal.studentsMale}</td>
                        <td className="text-center bg-info text-white">{districtTotal.studentsFemale}</td>
                        <td className="text-center bg-info text-white">{districtTotal.volunteersMale}</td>
                        <td className="text-center bg-info text-white">{districtTotal.volunteersFemale}</td>
                        <td className="text-center bg-info text-white">{districtTotal.childrenBelow15}</td>
                        <td className="text-center bg-info text-white">{districtTotal.childrenAbove15}</td>
                        <td className="text-center bg-warning text-dark">{districtTotal.total}</td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot className="table-dark">
                <tr className="fw-bold">
                  <td colSpan="2" className="bg-dark text-white">GRAND TOTAL</td>
                  <td className="text-center bg-dark text-white">{grandTotal.families}</td>
                  <td className="text-center bg-dark text-white">{grandTotal.singleGraduateMaleEmployed}</td>
                  <td className="text-center bg-dark text-white">{grandTotal.singleGraduateFemaleEmployed}</td>
                  <td className="text-center bg-dark text-white">{grandTotal.singleGraduateMaleUnemployed}</td>
                  <td className="text-center bg-dark text-white">{grandTotal.singleGraduateFemaleUnemployed}</td>
                  <td className="text-center bg-dark text-white">{grandTotal.studentsMale}</td>
                  <td className="text-center bg-dark text-white">{grandTotal.studentsFemale}</td>
                  <td className="text-center bg-dark text-white">{grandTotal.volunteersMale}</td>
                  <td className="text-center bg-dark text-white">{grandTotal.volunteersFemale}</td>
                  <td className="text-center bg-dark text-white">{grandTotal.childrenBelow15}</td>
                  <td className="text-center bg-dark text-white">{grandTotal.childrenAbove15}</td>
                  <td className="text-center bg-warning text-dark">{grandTotal.total}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Helper component to render a table with names and counts
  const renderTableWithNames = (title, data, showNames = true) => {
    const districts = Object.keys(data).sort();
    if (districts.length === 0) return null;

    return (
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">{title}</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered table-striped">
              <thead className="table-light">
                <tr>
                  <th>District</th>
                  <th>Place (ICEU/EGF)</th>
                  {showNames && <th>Names</th>}
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {districts.map((district) => {
                  const places = Object.keys(data[district]).sort();
                  return places.map((place, placeIndex) => {
                    const placeData = data[district][place];
                    const isFirstPlace = placeIndex === 0;
                    return (
                      <tr key={`${district}-${place}`}>
                        {isFirstPlace && (
                          <td rowSpan={places.length} className="fw-bold align-middle" style={{ verticalAlign: "middle" }}>
                            {district}
                          </td>
                        )}
                        <td className="fw-bold">{place}</td>
                        {showNames && (
                          <td>
                            {placeData.names && placeData.names.length > 0 ? (
                              <ul className="list-unstyled mb-0 small">
                                {placeData.names.map((name, idx) => (
                                  <li key={idx}>{idx + 1}. {name}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                        )}
                        <td className="fw-bold">{placeData.count || placeData.totalCount || 0}</td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Helper component to render Families table with place-wise aggregation
  const renderFamiliesTable = (title, data) => {
    const districts = Object.keys(data).sort();
    if (districts.length === 0) return null;

    // Aggregate families by place (similar to Male Students table)
    const placeWiseData = {};
    let totalFamilies = 0;
    let totalChildrenBelow10 = 0;
    let totalChildren10to14 = 0;
    let totalFamilyMembers = 0;

    districts.forEach((district) => {
      const places = Object.keys(data[district]).sort();
      places.forEach((place) => {
        const families = data[district][place];
        if (families && families.length > 0) {
          const key = `${district}-${place}`;
          if (!placeWiseData[key]) {
            placeWiseData[key] = {
              district,
              place,
              familyNames: [],
              spouseNames: [],
              childrenBelow10Names: [],
              childrenBelow10Count: 0,
              children10to14Names: [],
              children10to14Count: 0,
              totalFamilyMembers: 0
            };
          }

          families.forEach((family) => {
            totalFamilies++;
            // Collect family head names
            if (family.headName && !placeWiseData[key].familyNames.includes(family.headName)) {
              placeWiseData[key].familyNames.push(family.headName);
            }
            // Collect spouse names
            if (family.spouseName && !placeWiseData[key].spouseNames.includes(family.spouseName)) {
              placeWiseData[key].spouseNames.push(family.spouseName);
            }
            // Collect children below 10 names
            if (family.childBelow10Names && family.childBelow10Names.length > 0) {
              family.childBelow10Names.forEach(name => {
                if (name && !placeWiseData[key].childrenBelow10Names.includes(name)) {
                  placeWiseData[key].childrenBelow10Names.push(name);
                }
              });
            }
            placeWiseData[key].childrenBelow10Count += family.childBelow10Count || 0;
            totalChildrenBelow10 += family.childBelow10Count || 0;
            
            // Collect children 10-14 names
            if (family.child10to14Names && family.child10to14Names.length > 0) {
              family.child10to14Names.forEach(name => {
                if (name && !placeWiseData[key].children10to14Names.includes(name)) {
                  placeWiseData[key].children10to14Names.push(name);
                }
              });
            }
            placeWiseData[key].children10to14Count += family.child10to14Count || 0;
            totalChildren10to14 += family.child10to14Count || 0;
            
            placeWiseData[key].totalFamilyMembers += family.totalCount || 0;
            totalFamilyMembers += family.totalCount || 0;
          });
        }
      });
    });

    const placeKeys = Object.keys(placeWiseData).sort();
    if (placeKeys.length === 0) return null;

    // Group by district for rowSpan calculation
    const districtGroups = {};
    placeKeys.forEach(key => {
      const placeData = placeWiseData[key];
      if (!districtGroups[placeData.district]) {
        districtGroups[placeData.district] = [];
      }
      districtGroups[placeData.district].push(placeData);
    });

    return (
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-success text-white">
          <h5 className="mb-0">{title}</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered table-striped">
              <thead className="table-light">
                <tr>
                  <th>District</th>
                  <th>Place (ICEU/EGF)</th>
                  <th>Family Names</th>
                  <th>Spouse Names</th>
                  <th>Children Below 10 Years - Names</th>
                  <th>Children Below 10 Years - Count</th>
                  <th>Children 10-14 Years - Names</th>
                  <th>Children 10-14 Years - Count</th>
                  <th>Total Family Members</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(districtGroups).sort().map((district) => {
                  const places = districtGroups[district];
                  return places.map((placeData, placeIndex) => {
                    const isFirstPlace = placeIndex === 0;
                    return (
                      <tr key={`${placeData.district}-${placeData.place}`}>
                        {isFirstPlace && (
                          <td rowSpan={places.length} className="fw-bold align-middle" style={{ verticalAlign: "middle" }}>
                            {placeData.district}
                          </td>
                        )}
                        <td className="fw-bold">{placeData.place}</td>
                        <td>
                          <div className="small">
                            {placeData.familyNames && placeData.familyNames.length > 0 ? (
                              <ul className="list-unstyled mb-0">
                                {placeData.familyNames.map((name, idx) => (
                                  <li key={idx}>{idx + 1}. {name}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="small">
                            {placeData.spouseNames && placeData.spouseNames.length > 0 ? (
                              <ul className="list-unstyled mb-0">
                                {placeData.spouseNames.map((name, idx) => (
                                  <li key={idx}>{idx + 1}. {name}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="small">
                            {placeData.childrenBelow10Names && placeData.childrenBelow10Names.length > 0 ? (
                              <ul className="list-unstyled mb-0">
                                {placeData.childrenBelow10Names.map((name, idx) => (
                                  <li key={idx}>{idx + 1}. {name}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </div>
                        </td>
                        <td className="fw-bold text-center">{placeData.childrenBelow10Count || 0}</td>
                        <td>
                          <div className="small">
                            {placeData.children10to14Names && placeData.children10to14Names.length > 0 ? (
                              <ul className="list-unstyled mb-0">
                                {placeData.children10to14Names.map((name, idx) => (
                                  <li key={idx}>{idx + 1}. {name}</li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </div>
                        </td>
                        <td className="fw-bold text-center">{placeData.children10to14Count || 0}</td>
                        <td className="fw-bold bg-light">{placeData.totalFamilyMembers || 0}</td>
                      </tr>
                    );
                  });
                })}
              </tbody>
              <tfoot className="table-dark">
                <tr>
                  <td colSpan="2" className="fw-bold bg-info text-white">TOTAL</td>
                  <td colSpan="2" className="fw-bold bg-info text-white">
                    Families: {totalFamilies}
                  </td>
                  <td className="fw-bold bg-info text-white">—</td>
                  <td className="fw-bold bg-info text-white text-center">
                    {totalChildrenBelow10}
                  </td>
                  <td className="fw-bold bg-info text-white">—</td>
                  <td className="fw-bold bg-info text-white text-center">
                    {totalChildren10to14}
                  </td>
                  <td className="fw-bold bg-info text-white">
                    {totalFamilyMembers}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Helper component to render a table with counts only
  const renderTableCountOnly = (title, data) => {
    const districts = Object.keys(data).sort();
    if (districts.length === 0) return null;

    return (
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-info text-white">
          <h5 className="mb-0">{title}</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered table-striped">
              <thead className="table-light">
                <tr>
                  <th>District</th>
                  <th>Place (ICEU/EGF)</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {districts.map((district) => {
                  const places = Object.keys(data[district]).sort();
                  return places.map((place, placeIndex) => {
                    const placeData = data[district][place];
                    const isFirstPlace = placeIndex === 0;
                    return (
                      <tr key={`${district}-${place}`}>
                        {isFirstPlace && (
                          <td rowSpan={places.length} className="fw-bold align-middle" style={{ verticalAlign: "middle" }}>
                            {district}
                          </td>
                        )}
                        <td className="fw-bold">{place}</td>
                        <td className="fw-bold">{placeData.count || 0}</td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

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

      {/* Information Note */}
      <div className="alert alert-info mb-4">
        <i className="bi bi-info-circle me-2"></i>
        <strong>Note:</strong> The data below is grouped by District and Place (ICEU/EGF). 
        The Families table shows complete family composition including head of family, spouse, and children. 
        Children below 10 and 10-14 years from family registrations appear only in the Families table, not in the general Children Statistics tables.
      </div>

      {/* Consolidated Summary Table */}
      {renderSummaryTable()}

      {/* Male Students */}
      {renderTableWithNames("Male Students", processedData.maleStudents)}

      {/* Female Students */}
      {renderTableWithNames("Female Students", processedData.femaleStudents)}

      {/* Families */}
      {renderFamiliesTable("Families", processedData.families)}

      {/* Single Graduate Males - Employed */}
      {renderTableWithNames("Single Graduate Males – Employed", processedData.singleGraduateMalesEmployed)}

      {/* Single Graduate Males - Unemployed */}
      {renderTableWithNames("Single Graduate Males – Unemployed", processedData.singleGraduateMalesUnemployed)}

      {/* Single Graduate Females - Employed */}
      {renderTableWithNames("Single Graduate Females – Employed", processedData.singleGraduateFemalesEmployed)}

      {/* Single Graduate Females - Unemployed */}
      {renderTableWithNames("Single Graduate Females – Unemployed", processedData.singleGraduateFemalesUnemployed)}

      {/* Children Statistics - Below 10 */}
      {renderTableCountOnly("Children Statistics - Below 10 years (Count)", processedData.childrenBelow10)}

      {/* Children Statistics - 10-14 */}
      {renderTableWithNames("Children Statistics - 10 to 14 years (Names and Count)", processedData.children10to14)}

      {/* Children Statistics - 15+ */}
      {renderTableCountOnly("Children Statistics - 15+ years (Count)", processedData.children15Plus)}

      {/* Volunteers */}
      {renderTableWithNames("Volunteers", processedData.volunteers)}

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
          .list-unstyled li {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
}
