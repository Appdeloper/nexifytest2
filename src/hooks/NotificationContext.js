import { createContext } from 'react';

// Shared context object — lives in its own file so that
// NotificationProvider.jsx (component) and useNotifications.jsx (hook)
// can both import it without Vite Fast Refresh warnings.
export const NotificationContext = createContext();
