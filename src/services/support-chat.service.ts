import { apiClient } from "@/lib/api-client";

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

export const supportChatService = {
  getConversations: () => apiClient<SupportConversation[]>("/chat/api/v1/support/conversations"),
  getMessages: (conversationId: string) =>
    apiClient<SupportMessage[]>(`/chat/api/v1/support/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, content: string) =>
    apiClient<SupportMessage>(`/chat/api/v1/support/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  markRead: (conversationId: string) =>
    apiClient<void>(`/chat/api/v1/support/conversations/${conversationId}/read`, { method: "POST" }),
};
