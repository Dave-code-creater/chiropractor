/**
 * Authentication Endpoints Test Suite
 * Use this to test all authentication functionality
 */

// Example API calls for testing your authentication endpoints

const API_BASE = 'http://localhost:3000';

// 1. Patient Registration
const testPatientRegistration = async () => {
  const response = await fetch(`${API_BASE}/auth/register-patient`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@email.com',
      password: 'SecurePassword123!',
      confirm_password: 'SecurePassword123!',
      phone_number: '+1234567890'
    })
  });
  
  const data = await response.json();
  console.log('Patient Registration:', data);
  return data;
};

// 2. User Login
const testLogin = async () => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'john.doe@email.com',
      password: 'SecurePassword123!',
      remember_me: false
    })
  });
  
  const data = await response.json();
  console.log('Login:', data);
  return data.token;
};

// 3. Get User Profile
const testGetProfile = async (token) => {
  const response = await fetch(`${API_BASE}/auth/profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  console.log('Profile:', data);
  return data;
};

// 4. Token Refresh
const testTokenRefresh = async (refreshToken) => {
  const response = await fetch(`${API_BASE}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refresh_token: refreshToken
    })
  });
  
  const data = await response.json();
  console.log('Token Refresh:', data);
  return data;
};

// 5. Password Reset Flow
const testPasswordReset = async () => {
  // Step 1: Request password reset
  const resetRequest = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'john.doe@email.com'
    })
  });
  
  const resetData = await resetRequest.json();
  console.log('Password Reset Request:', resetData);
  
  // Step 2: Verify reset token (use token from console logs)
  if (resetData.reset_token) {
    const verifyResponse = await fetch(`${API_BASE}/auth/verify-reset-token?token=${resetData.reset_token}`);
    const verifyData = await verifyResponse.json();
    console.log('Token Verification:', verifyData);
    
    // Step 3: Reset password
    const resetResponse = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetData.reset_token,
        new_password: 'NewSecurePassword123!',
        confirm_password: 'NewSecurePassword123!'
      })
    });
    
    const finalData = await resetResponse.json();
    console.log('Password Reset Complete:', finalData);
  }
};

// 6. Logout
const testLogout = async (token) => {
  const response = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  console.log('Logout:', data);
  return data;
};

// Run all tests
const runAllTests = async () => {
  try {
    console.log('🧪 Starting Authentication Tests...\n');
    
    // Test registration
    await testPatientRegistration();
    
    // Test login
    const token = await testLogin();
    
    // Test profile
    await testGetProfile(token);
    
    // Test password reset
    await testPasswordReset();
    
    // Test logout
    await testLogout(token);
    
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Export for module usage
module.exports = {
  testPatientRegistration,
  testLogin,
  testGetProfile,
  testTokenRefresh,
  testPasswordReset,
  testLogout,
  runAllTests
};

// Run tests if called directly
if (require.main === module) {
  runAllTests();
} 