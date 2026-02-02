/* eslint-disable no-undef */

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

messaging.onBackgroundMessage(function (payload) {
  console.log('[firebase-messaging-sw.js] Background message', payload);

  const notificationTitle = payload.notification?.title || 'Notification';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/assets/images/icon-light-32x32.png', // optional
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
