import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import type { SupportMessage } from "@/services/support-chat.service";

const BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8080";

export type SupportChatEvent = {
  eventType: "MESSAGE_CREATED" | "MESSAGES_READ";
  conversationId: string;
  message?: SupportMessage;
  occurredAt: string;
};

export function connectSupportChat(
  conversationId: string,
  onEvent: (event: SupportChatEvent) => void,
  onConnectionChange: (connected: boolean) => void,
) {
  let subscription: StompSubscription | undefined;
  const client = new Client({
    brokerURL: websocketUrl(),
    reconnectDelay: 5_000,
    connectionTimeout: 8_000,
    heartbeatIncoming: 10_000,
    heartbeatOutgoing: 10_000,
    debug: () => undefined,
    onConnect: () => {
      subscription = client.subscribe(`/topic/support/conversations/${conversationId}`, (frame) => {
        handleEvent(frame, onEvent);
      });
      onConnectionChange(true);
    },
    onDisconnect: () => onConnectionChange(false),
    onStompError: () => onConnectionChange(false),
    onWebSocketClose: () => onConnectionChange(false),
    onWebSocketError: () => onConnectionChange(false),
  });
  onConnectionChange(false);
  client.activate();
  return () => {
    subscription?.unsubscribe();
    void client.deactivate();
  };
}

function handleEvent(frame: IMessage, onEvent: (event: SupportChatEvent) => void) {
  try {
    const event = JSON.parse(frame.body) as SupportChatEvent;
    if (event?.conversationId && event?.eventType) onEvent(event);
  } catch {
    // Ignore malformed frames without closing the socket.
  }
}

function websocketUrl() {
  const url = new URL(BASE_URL);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = `${url.pathname.replace(/\/$/, "")}/chat/ws`;
  url.search = "";
  return url.toString();
}
