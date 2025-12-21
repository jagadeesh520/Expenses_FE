// API Configuration
// Update this IP address when the backend server IP changes
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
  REGISTRATION_SCREENSHOT: (id) => `${API_BASE_URL}/api/cashier/registrations/${id}/screenshot`,
  REGISTRATION_APPROVE: (id) => `${API_BASE_URL}/api/cashier/registrations/${id}/approve`,
  REGISTRATION_REJECT: (id) => `${API_BASE_URL}/api/cashier/registrations/${id}/reject`,
  
  // Payments List
  PAYMENTS_LIST: `${API_BASE_URL}/api/cashier/list`,
  
  // Authentication
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  
  // File Uploads
  UPLOADS: `${API_BASE_URL}/uploads`,
  
  // Payment Validation
  VALIDATE_PAYMENTS: `${API_BASE_URL}/api/cashier/validate-payments`,
};

