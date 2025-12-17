import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';
import './chartjsSetup'


if (process.env.REACT_APP_FAVICON_APPLE) {
  const appleIcon = document.querySelector("link[rel='apple-touch-icon']");
  if (appleIcon) {
    appleIcon.href = process.env.REACT_APP_FAVICON_APPLE;
  }
}

if (process.env.REACT_APP_FAVICON_32) {
  const favicon32 = document.querySelector("link[rel='icon'][sizes='32x32']");
  if (favicon32) {
    favicon32.href = process.env.REACT_APP_FAVICON_32;
  }
}

if (process.env.REACT_APP_FAVICON_16) {
  const favicon16 = document.querySelector("link[rel='icon'][sizes='16x16']");
  if (favicon16) {
    favicon16.href = process.env.REACT_APP_FAVICON_16;
  }
}

if (process.env.REACT_APP_SITE_WEBMANIFEST) {
  const manifest = document.querySelector("link[rel='manifest']");
  if (manifest) {
    manifest.href = process.env.REACT_APP_SITE_WEBMANIFEST;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
