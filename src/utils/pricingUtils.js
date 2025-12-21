/**
 * Pricing Utility Functions
 * Reused from expenses_app/Expenses_Mobile/app/registrar/PaymentSummary.tsx
 * 
 * Calculates total amount based on region and group type
 */

/**
 * Get total amount based on region and group type
 * @param {string} region - Region name (e.g., "West Rayalaseema", "East Rayalaseema")
 * @param {string} groupType - Group type from registration form
 * @param {string} maritalStatus - Optional marital status
 * @param {string} spouseAttending - Optional spouse attending status
 * @returns {number} - Total amount for the registration
 */
export const getTotalAmount = (region, groupType, maritalStatus, spouseAttending) => {
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

