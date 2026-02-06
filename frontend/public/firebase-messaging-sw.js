/* eslint-disable no-undef */
// VERSION: 3.0 (Force Update for Double Notification Fix)

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAN66JVKGAse_ey1nvsagC-rZrRSFIpM00",
  authDomain: "whoosher-kcic.firebaseapp.com",
  projectId: "whoosher-kcic",
  messagingSenderId: "1000931199968",
  appId: "1:1000931199968:web:9f20dad6e9f76887e5b985",
});

const messaging = firebase.messaging();

// Force SW Update to fix double notification issue
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

messaging.onBackgroundMessage(function (payload) {
  console.log('[firebase-messaging-sw.js] Background message', payload);

  // Handle Data-Only Notification
  if (payload.data) {
     console.log('[SW DEBUG] Payload Data Received:', payload.data); // DEBUG LOG
     const title = payload.data.title || 'Notification';
     const body = payload.data.body || ''; 
     const icon = '/assets/images/icon-light-32x32.png';

     return self.registration.showNotification(title, {
        body: body,
        icon: icon,
        data: payload.data, // Pass data for click handling
        tag: 'unique-fcm-message', // FORCE DEDUPLICATION
        renotify: true // Vibrate again if replaced
     });
  }
});

// Handle Notification Click
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click Received.', event);
  
  event.notification.close();

  // Focus Window or Open New One
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // 1. If app is already open, focus it
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      
      // 2. If app is closed, open it
      return clients.openWindow('/');
    })
  );
});
