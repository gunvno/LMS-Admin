import { apiClient } from "@/lib/api-client";

type DeviceRegisterPayload = {
  installationId: string;
  deviceType: "WEB";
  deviceId: string;
  appVersion: string;
};

function wrap<T>(data: T) {
  return { data, channel: "WEB", signature: "" };
}

export const deviceService = {
  register(data: DeviceRegisterPayload): Promise<void> {
    return apiClient<void>("/notice/api/v1/devices/register", {
      method: "POST",
      body: JSON.stringify(wrap(data)),
    });
  },

  deactivate(installationId: string): Promise<void> {
    return apiClient<void>("/notice/api/v1/devices/deactivate", {
      method: "POST",
      body: JSON.stringify(wrap({ installationId })),
    });
  },
};
