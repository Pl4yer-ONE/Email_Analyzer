import React, { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { MAIL_SCOPES } from '../config/auth';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';

interface EmailProviderSelectorProps {
  onGmailSelect: (token: string) => void;
  onOutlookSelect: (token: string) => void;
}

export const EmailProviderSelector = ({ onGmailSelect, onOutlookSelect }: EmailProviderSelectorProps) => {
  const { instance } = useMsal();
  const [loggedIn, setLoggedIn] = useState(false);

  const login = useGoogleLogin({
    onSuccess: (response) => {
      console.log('Google login success:', response);
      onGmailSelect(response.access_token);
      setLoggedIn(true);
      console.log('Logged in state set to true');
    },
    onError: (error) => {
      console.error('Google login failed:', error);
    },
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
  });

  const handleOutlookLogin = async () => {
    try {
      const loginResponse = await instance.loginPopup({
        scopes: MAIL_SCOPES.OUTLOOK,
        redirectUri: window.location.origin
      });
      
      if (loginResponse.accessToken) {
        onOutlookSelect(loginResponse.accessToken);
        setLoggedIn(true);
        console.log('Logged in state set to true (Outlook)');
      }
    } catch (error) {
      console.error('Outlook login failed:', error);
      alert('Failed to login with Outlook. Please try again.');
    }
  };

  const handleLogout = () => {
    googleLogout();
    instance.logoutPopup();
    setLoggedIn(false);
    alert('You have been logged out');
  };

  return (
    <div className="max-w-4xl mx-auto my-8 p-8 bg-gray-800/50 rounded-2xl border border-purple-500/20 backdrop-blur-sm">
      <h2 className="text-2xl font-bold mb-6 text-cyan-400">Connect Email Provider</h2>
      <div className="space-y-4">
        {loggedIn ? (
          <button
            onClick={handleLogout}
            className="w-full bg-red-500/80 backdrop-blur-sm text-white p-4 rounded-lg hover:bg-red-600/80 transition-colors border border-red-400/30"
          >
            Logout from Email Account
          </button>
        ) : (
          <>
            <button
              onClick={() => login()}
              className="w-full bg-gray-900/80 backdrop-blur-sm border-2 border-purple-500/30 p-4 rounded-lg flex items-center justify-center space-x-2 hover:border-cyan-400/50 transition-colors text-white"
            >
              <img src="https://www.google.com/gmail/about/static/images/logo-gmail.png?cache=1adba63" alt="Gmail" className="w-6 h-6" />
              <span>Sign in with Gmail</span>
            </button>
            
            <button
              onClick={handleOutlookLogin}
              className="w-full bg-gray-900/80 backdrop-blur-sm border-2 border-purple-500/30 p-4 rounded-lg flex items-center justify-center space-x-2 hover:border-cyan-400/50 transition-colors text-white"
            >
              <img src="https://img.icons8.com/color/48/000000/microsoft-outlook-2019--v2.png" alt="Outlook" className="w-6 h-6" />
              <span>Sign in with Outlook</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};