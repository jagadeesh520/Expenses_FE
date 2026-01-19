// API Configuration
// Update this IP address when the backend server IP changes
// Try localhost first if backend is on same machine, otherwise use the network IP
export const API_BASE_URL = "https://api.sjtechsol.com";




// API Endpoints
export const API_ENDPOINTS = {
  // Registration
  REGISTER_CUSTOMER: `${API_BASE_URL}/api/cashier/registerCustomer`,
  
  // Payment Requests
  PAYMENT_REQUEST: `${API_BASE_URL}/api/cashier/payment-request`,
  PAYMENT_REQUESTS: `${API_BASE_URL}/api/cashier/payment-requests`,
  PAYMENT_REQUEST_BY_ID: (id) => `${API_BASE_URL}/api/cashier/payment-requests/${id}`,
  PAYMENT_REQUEST_APPROVE: (id) => `${API_BASE_URL}/api/cashier/payment-requests/${id}/approve`,
  PAYMENT_REQUEST_REJECT: (id) => `${API_BASE_URL}/api/cashier/payment-requests/${id}/reject`,
  PAYMENT_REQUEST_PAY: (id) => `${API_BASE_URL}/api/cashier/payment-requests/${id}/pay`,
  PAYMENT_REQUESTS_BY_ROLE: (role) => `${API_BASE_URL}/api/cashier/payment-requests/role/${role}`,
  
  // Registrations
  REGISTRATIONS: `${API_BASE_URL}/api/cashier/registrations`,
  REGISTRATION_BY_ID: (id) => `${API_BASE_URL}/api/cashier/registrations/${id}`,
  REGISTRATION_UPDATE: (id) => `${API_BASE_URL}/api/cashier/${id}`, // PUT endpoint for updating registrations
  REGISTRATION_SCREENSHOT: (id) => `${API_BASE_URL}/api/cashier/registrations/${id}/screenshot`,
  REGISTRATION_APPROVE: (id) => `${API_BASE_URL}/api/cashier/registrations/${id}/approve`,
  REGISTRATION_REJECT: (id) => `${API_BASE_URL}/api/cashier/registrations/${id}/reject`,
  FAILED_EMAILS: `${API_BASE_URL}/api/cashier/registrations/failed-emails`,
  FAILED_EMAIL_DELETE: (id) => `${API_BASE_URL}/api/cashier/registrations/failed-emails/${id}`,
  FAILED_EMAIL_DETAILS: (email) => `${API_BASE_URL}/api/cashier/registrations/failed-emails/${encodeURIComponent(email)}/details`,
  
  // Payments List
  PAYMENTS_LIST: `${API_BASE_URL}/api/cashier/list`,
  
  // Treasurer/Cashier
  CASHIER_SUMMARY: `${API_BASE_URL}/api/cashier/summary`,
  ADMIN_REQUESTS: `${API_BASE_URL}/api/admin/requests`,
  
  // Authentication
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  
  // File Uploads
  UPLOADS: `${API_BASE_URL}/uploads`,
  
  // Payment Validation
  VALIDATE_PAYMENTS: `${API_BASE_URL}/api/cashier/validate-payments`,
};

