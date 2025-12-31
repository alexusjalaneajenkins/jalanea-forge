import Cookies from 'js-cookie';

// The password - in production this would be hashed and stored securely
const MASTER_PASSWORD = 'jalanea_e37254281em';
const COOKIE_NAME = 'jalanea_lab_auth';
const COOKIE_EXPIRY_DAYS = 30;

// Simple hash function for cookie value
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Generate auth token from password
function generateToken(password: string): string {
  const timestamp = Date.now().toString(36);
  const hash = simpleHash(password + timestamp);
  return `${hash}_${timestamp}`;
}

// Verify password
export function verifyPassword(password: string): boolean {
  return password === MASTER_PASSWORD;
}

// Set auth cookie
export function setAuthCookie(): void {
  const token = generateToken(MASTER_PASSWORD);
  Cookies.set(COOKIE_NAME, token, {
    expires: COOKIE_EXPIRY_DAYS,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
}

// Check if authenticated (client-side)
export function isAuthenticated(): boolean {
  const token = Cookies.get(COOKIE_NAME);
  return !!token;
}

// Clear auth cookie (logout)
export function logout(): void {
  Cookies.remove(COOKIE_NAME);
}

// Get cookie value for server-side validation
export function getAuthCookie(): string | undefined {
  return Cookies.get(COOKIE_NAME);
}

// Update password (for settings)
export function updatePassword(currentPassword: string, newPassword: string): boolean {
  if (currentPassword === MASTER_PASSWORD) {
    // In a real app, you'd update this in a database
    // For this demo, we just validate the current password
    console.log('Password update requested. New password:', newPassword);
    return true;
  }
  return false;
}
