import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { FleetProvider } from './context/FleetContext';
import { AppContent } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <FleetProvider>
          <AppContent />
        </FleetProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
