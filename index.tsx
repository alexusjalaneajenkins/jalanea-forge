import React from 'react';
import './index.css';
import ReactDOM from 'react-dom/client';
import App from './App';
import { supabase } from './lib/supabase';

// Handle Supabase OAuth callback BEFORE React Router initializes
// This is needed because HashRouter (#/) conflicts with Supabase's hash-based auth tokens
const hash = window.location.hash;

if (hash && (hash.includes('access_token') || hash.includes('refresh_token'))) {
  console.log('OAuth callback detected in hash:', hash);

  // Parse the hash to extract tokens
  // The hash format is: #access_token=xxx&refresh_token=yyy&...
  const hashParams = new URLSearchParams(hash.substring(1));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');

  console.log('Tokens found:', { accessToken: !!accessToken, refreshToken: !!refreshToken });

  if (accessToken) {
    // Set the session using the tokens from the URL
    supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    }).then(({ data, error }) => {
      if (error) {
        console.error('Error setting auth session:', error);
      } else {
        console.log('Auth session established:', data.session?.user?.email);
        // Clean up the URL hash after processing
        window.history.replaceState(null, '', window.location.pathname + '#/');
      }
    });
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
