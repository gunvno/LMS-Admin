/* global firebase */

const DEFAULT_NOTIFICATION_PATH = "/notices";

function safeNotificationPath(rawData) {
  let candidate = DEFAULT_NOTIFICATION_PATH;
  try {
    const customData = typeof rawData === "string" ? JSON.parse(rawData) : rawData;
    candidate = customData?.url || customData?.path || DEFAULT_NOTIFICATION_PATH;
  } catch {
    candidate = DEFAULT_NOTIFICATION_PATH;
  }

  try {
    const url = new URL(candidate, self.location.origin);
    return url.origin === self.location.origin ? `${url.pathname}${url.search}${url.hash}` : DEFAULT_NOTIFICATION_PATH;
  } catch {
    return DEFAULT_NOTIFICATION_PATH;
  }
}

// Register before Firebase so the app can apply a safe, same-origin click target.
self.addEventListener("notificationclick", (event) => {
  const message = event.notification?.data?.FCM_MSG;
  if (!message) return;

  event.stopImmediatePropagation();
  event.notification.close();
  const targetPath = safeNotificationPath(message.data?.data);

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const current = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (current) {
      await current.navigate(targetPath);
      return current.focus();
    }
    return self.clients.openWindow(targetPath);
  })());
});

importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js");

const params = new URL(self.location.href).searchParams;
const config = {
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
};

if (Object.values(config).every(Boolean)) {
  firebase.initializeApp(config);
  firebase.messaging();
}
