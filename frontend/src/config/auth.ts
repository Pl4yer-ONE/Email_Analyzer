// IMPORTANT: Replace these values with your actual OAuth client IDs
// For development, you can use environment variables
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const MSAL_CONFIG = {
  auth: {
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID || '',
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

export const MAIL_SCOPES = {
  GOOGLE: ['https://www.googleapis.com/auth/gmail.readonly'],
  OUTLOOK: ['Mail.Read'],
};

// Add type definitions
export interface MSALConfig {
  auth: {
    clientId: string;
    authority: string;
    redirectUri: string;
  };
  cache: {
    cacheLocation: 'sessionStorage' | 'localStorage';
    storeAuthStateInCookie: boolean;
  };
}

// Add runtime checks
if (!GOOGLE_CLIENT_ID) {
  console.error('Missing GOOGLE_CLIENT_ID');
}

if (!import.meta.env.VITE_MICROSOFT_CLIENT_ID) {
  console.error('Missing VITE_MICROSOFT_CLIENT_ID environment variable');
}

// Add this validation function
export const validateEnvironment = () => {
  const errors = [];
  
  if (!GOOGLE_CLIENT_ID) errors.push('Google OAuth Client ID');
  if (!MSAL_CONFIG.auth.clientId) errors.push('Microsoft OAuth Client ID');
  
  if (errors.length > 0) {
    const message = `Missing configuration: ${errors.join(', ')}`;
    console.error(message);
    alert(message);
    return false;
  }
  
  return true;
};

// Call in App.tsx before rendering
if (import.meta.env.PROD) {
  validateEnvironment();
}