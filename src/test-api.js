// Test API Connection
// Run this in browser console to test API connectivity

import { API_BASE_URL, API_ENDPOINTS } from './constants';

export const testAPIConnection = async () => {
  console.log('Testing API Connection...');
  console.log('API Base URL:', API_BASE_URL);
  console.log('Login Endpoint:', API_ENDPOINTS.LOGIN);
  
  try {
    // Test 1: Simple GET request to check if server is reachable
    const response = await fetch(API_BASE_URL, {
      method: 'GET',
      mode: 'cors',
    });
    
    console.log('Server Status:', response.status);
    console.log('CORS Headers:', {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
    });
    
    // Test 2: Check if login endpoint exists (will fail but shows CORS)
    try {
      const loginResponse = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'OPTIONS',
        mode: 'cors',
      });
      console.log('Login Endpoint Status:', loginResponse.status);
    } catch (error) {
      console.error('Login Endpoint Error:', error.message);
      if (error.message.includes('CORS')) {
        console.error('❌ CORS Error: Backend needs to allow your Vercel domain');
        console.error('   Add to backend CORS: https://expensesapp-six.vercel.app');
      }
    }
    
  } catch (error) {
    console.error('❌ Connection Error:', error.message);
    if (error.message.includes('Failed to fetch')) {
      console.error('   Server might be down or unreachable');
    }
  }
};

// Usage: Import and call testAPIConnection() in browser console

