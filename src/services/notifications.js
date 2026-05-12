import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

// Note: Requires FIREBASE_VAPID_KEY in env to fully initialize.
// We are structuring this as a prep phase for production.

export const initializeNotifications = async (app, uid) => {
  try {
    const messaging = getMessaging(app);
    
    // Request permission
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      // TODO: Replace with real VAPID key in production
      // const token = await getToken(messaging, { vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY });
      const token = 'mock-token-pending-vapid-key'; 
      
      if (token) {
        // Save token to Firestore
        await updateDoc(doc(db, "users", uid), {
          fcmToken: token
        });
      }

      // Foreground message handler
      onMessage(messaging, (payload) => {
        console.log("Message received in foreground:", payload);
        // Dispatch to UI toast system
        // CustomEvent could be used here to notify ToastProvider
        window.dispatchEvent(new CustomEvent('fcm-message', { detail: payload }));
      });
    }
  } catch (error) {
    console.log("Failed to initialize notifications:", error);
  }
};
