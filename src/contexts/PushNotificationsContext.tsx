"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Messaging } from "firebase/messaging";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSION } from "@/lib/permissions";
import {
  firebaseVapidKey,
  getBrowserMessaging,
  getOrCreateDeviceId,
  getStoredInstallationId,
  hasFirebaseWebConfig,
  registerFirebaseServiceWorker,
  storeInstallationId,
  clearStoredInstallationId,
} from "@/lib/firebase-messaging";
import { deviceService } from "@/services/device.service";

export type PushStatus =
  | "checking"
  | "unsupported"
  | "default"
  | "denied"
  | "registering"
  | "enabled"
  | "error";

type PushNotificationsContextValue = {
  status: PushStatus;
  error: string;
  enableNotifications: () => Promise<void>;
};

const PushNotificationsContext = createContext<PushNotificationsContextValue | null>(null);

export function PushNotificationsProvider({ children }: { children: ReactNode }) {
  const { user, hasPermission } = useAuth();
  const canManageDevice = hasPermission(PERMISSION.DEVICE_MANAGE);
  const [status, setStatus] = useState<PushStatus>("checking");
  const [error, setError] = useState("");
  const cleanupListenersRef = useRef<(() => void) | null>(null);
  const registrationPromiseRef = useRef<Promise<void> | null>(null);

  const attachListeners = useCallback(async (messaging: Messaging) => {
    if (cleanupListenersRef.current) return;

    const { onMessage, onRegistered, onUnregistered } = await import("firebase/messaging");
    if (cleanupListenersRef.current) return;

    const stopRegistered = onRegistered(messaging, async (installationId) => {
        try {
          storeInstallationId(installationId);
          await deviceService.register({
            installationId,
            deviceType: "WEB",
            deviceId: getOrCreateDeviceId(),
            appVersion: "lms-admin-web/0.1.0",
          });
          setError("");
          setStatus("enabled");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Không đăng ký được thiết bị nhận thông báo.");
          setStatus("error");
        }
    });

    const stopUnregistered = onUnregistered(messaging, (installationId) => {
      if (getStoredInstallationId() === installationId) clearStoredInstallationId();
      void deviceService.deactivate(installationId).catch(() => undefined);
      setStatus(Notification.permission === "denied" ? "denied" : "default");
    });

    const stopMessage = onMessage(messaging, (payload) => {
      window.dispatchEvent(new CustomEvent("lms:notifications-updated", { detail: payload }));
    });

    cleanupListenersRef.current = () => {
      stopRegistered();
      stopUnregistered();
      stopMessage();
    };
  }, []);

  const activate = useCallback(async (requestPermission: boolean) => {
    if (!user || !canManageDevice) {
      setStatus("unsupported");
      return;
    }
    if (!hasFirebaseWebConfig() || typeof window === "undefined" || !("Notification" in window)) {
      setStatus("unsupported");
      return;
    }

    if (requestPermission && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    if (Notification.permission !== "granted") {
      setStatus("default");
      return;
    }
    if (registrationPromiseRef.current) return registrationPromiseRef.current;

    const registrationTask = (async () => {
      try {
        setError("");
        setStatus("registering");
        const [messaging, serviceWorkerRegistration] = await Promise.all([
          getBrowserMessaging(),
          registerFirebaseServiceWorker(),
        ]);
        if (!messaging || !serviceWorkerRegistration) {
          setStatus("unsupported");
          return;
        }

        await attachListeners(messaging);
        const { register } = await import("firebase/messaging");
        await register(messaging, {
          vapidKey: firebaseVapidKey,
          serviceWorkerRegistration,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể bật thông báo trình duyệt.");
        setStatus("error");
      } finally {
        registrationPromiseRef.current = null;
      }
    })();

    registrationPromiseRef.current = registrationTask;
    return registrationTask;
  }, [attachListeners, canManageDevice, user]);

  const enableNotifications = useCallback(() => activate(true), [activate]);

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => {
      if (!canManageDevice || !("Notification" in window)) {
        setStatus("unsupported");
        return;
      }

      if (Notification.permission === "granted") void activate(false);
      else setStatus(Notification.permission === "denied" ? "denied" : "default");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activate, canManageDevice, user]);

  useEffect(() => () => cleanupListenersRef.current?.(), []);

  const value = useMemo(
    () => ({ status, error, enableNotifications }),
    [enableNotifications, error, status]
  );

  return (
    <PushNotificationsContext.Provider value={value}>
      {children}
    </PushNotificationsContext.Provider>
  );
}

export function usePushNotifications() {
  const context = useContext(PushNotificationsContext);
  if (!context) throw new Error("usePushNotifications must be used within PushNotificationsProvider");
  return context;
}
