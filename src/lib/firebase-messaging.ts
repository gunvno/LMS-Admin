import type { Messaging } from "firebase/messaging";

const INSTALLATION_ID_KEY = "lms:firebase-installation-id";
const DEVICE_ID_KEY = "lms:firebase-device-id";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

export const firebaseVapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";

export function hasFirebaseWebConfig() {
  return Object.values(firebaseConfig).every(Boolean) && Boolean(firebaseVapidKey);
}

export async function getBrowserMessaging(): Promise<Messaging | null> {
  if (typeof window === "undefined" || !hasFirebaseWebConfig()) return null;

  const [{ getApp, getApps, initializeApp }, { getMessaging, isSupported }] = await Promise.all([
    import("firebase/app"),
    import("firebase/messaging"),
  ]);
  if (!(await isSupported())) return null;

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getMessaging(app);
}

export async function registerFirebaseServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;

  const params = new URLSearchParams(firebaseConfig);
  const registration = await navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?${params.toString()}`,
    { scope: "/", updateViaCache: "none" }
  );
  await registration.update().catch(() => undefined);
  return registration;
}

export function getStoredInstallationId() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(INSTALLATION_ID_KEY);
}

export function storeInstallationId(installationId: string) {
  window.localStorage.setItem(INSTALLATION_ID_KEY, installationId);
}

export function clearStoredInstallationId() {
  if (typeof window !== "undefined") window.localStorage.removeItem(INSTALLATION_ID_KEY);
}

export function getOrCreateDeviceId() {
  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const generated = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
}
