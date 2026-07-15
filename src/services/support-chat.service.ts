import { apiClient } from "@/lib/api-client";
import {
  normalizeSupportMessage,
  type SupportMessageDateValue,
} from "@/lib/support-chat-message";

export type SupportConversation = {
  id: string;
  courseId: string;
  courseName: string;
  studentId: string;
  studentName: string;
  instructorId: string;
  instructorName: string;
  status: "ACTIVE" | "CLOSED";
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  createdAt: string;
};

export type SupportMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt?: string;
  createdAt: string;
};

type SupportMessagePayload = Omit<SupportMessage, "createdAt"> & {
  createdAt?: SupportMessageDateValue;
  createdDate?: SupportMessageDateValue;
};

function toSupportMessage(message: SupportMessagePayload): SupportMessage {
  return normalizeSupportMessage(message) as SupportMessage;
}

export const supportChatService = {
  getConversations: () => apiClient<SupportConversation[]>("/chat/api/v1/support/conversations"),
  getMessages: (conversationId: string) =>
    apiClient<SupportMessagePayload[]>(`/chat/api/v1/support/conversations/${conversationId}/messages`)
      .then((messages) => (messages || []).map(toSupportMessage)),
  sendMessage: (conversationId: string, content: string) =>
    apiClient<SupportMessagePayload>(`/chat/api/v1/support/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }).then(toSupportMessage),
  markRead: (conversationId: string) =>
    apiClient<void>(`/chat/api/v1/support/conversations/${conversationId}/read`, { method: "POST" }),
};
