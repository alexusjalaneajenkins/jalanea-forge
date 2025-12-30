import React from 'react';
import './index.css';
import ReactDOM from 'react-dom/client';
import App from './App';
import { supabase } from './lib/supabase';

// Handle Supabase OAuth callback BEFORE React Router initializes
// This is needed because HashRouter (#/) conflicts with Supabase's hash-based auth tokens
const hash = window.location.hash;
if (hash && (hash.includes('access_token') || hash.includes('error_description'))) {
  // Extract the auth portion from the hash (everything after #)
  const hashParams = hash.substring(1);

  // If using HashRouter, the auth tokens might be after the route
  // e.g., #/some-route#access_token=xxx or #access_token=xxx
  const authPart = hashParams.includes('access_token')
    ? hashParams.substring(hashParams.indexOf('access_token'))
    : hashParams;

  console.log('OAuth callback detected, processing auth tokens...');

  // Let Supabase process the tokens
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('Error processing OAuth callback:', error);
    } else if (data.session) {
      console.log('OAuth session established successfully');
      // Clean up the URL by removing the auth tokens
      window.history.replaceState(null, '', window.location.pathname + '#/');
    }
  });
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
