import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

// Catch Firestore internal assertion failures that escape React's error boundary.
// These happen when Firestore's realtime stream gets into a corrupted state
// (e.g., after permission denied errors). The only recovery is a full reload.
window.addEventListener('unhandledrejection', (event) => {
  const msg = event?.reason?.message || '';
  if (msg.includes('INTERNAL ASSERTION FAILED') || msg.includes('Unexpected state')) {
    console.warn('[Nexify] Firestore SDK entered a corrupted state. Clearing cache and reloading...');
    event.preventDefault();
    // Clear Firestore IndexedDB cache to break the corruption loop
    if (window.indexedDB) {
      const dbNames = ['firestore/[DEFAULT]/nexify-connect-prod/main', 'firebaseLocalStorageDb'];
      dbNames.forEach(name => {
        try { window.indexedDB.deleteDatabase(name); } catch {}
      });
    }
    setTimeout(() => window.location.reload(), 500);
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
