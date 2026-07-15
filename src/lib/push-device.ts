import { deviceService } from "@/services/device.service";
import {
  clearStoredInstallationId,
  getBrowserMessaging,
  getStoredInstallationId,
} from "@/lib/firebase-messaging";

export async function deactivateCurrentPushInstallation() {
  if (typeof window === "undefined") return;

  const installationId = getStoredInstallationId();
  if (installationId) {
    await deviceService.deactivate(installationId).catch(() => undefined);
  }

  const messaging = await getBrowserMessaging().catch(() => null);
  if (!messaging) return;

  const { unregister } = await import("firebase/messaging");
  const removed = await unregister(messaging).then(() => true).catch(() => false);
  if (removed) clearStoredInstallationId();
}
