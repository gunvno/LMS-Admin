"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { connectSupportChat } from "@/services/support-chat-websocket";
import {
  supportChatService,
  type SupportConversation,
  type SupportMessage,
} from "@/services/support-chat.service";
import { mergeSupportMessage } from "@/lib/support-chat-message";
import "./messages.css";

function formatTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(date)
    : "";
}

export default function InstructorMessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const selected = conversations.find((conversation) => conversation.id === selectedId);

  const loadConversations = useCallback(async () => {
    const items = await supportChatService.getConversations();
    setConversations(items || []);
    setSelectedId((current) => current || items?.[0]?.id || "");
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadConversations()
        .catch((err) => setError(err instanceof Error ? err.message : "Không tải được danh sách hội thoại."))
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) return;
    let alive = true;
    supportChatService.getMessages(selectedId)
      .then((items) => alive && setMessages(items || []))
      .catch((err) => alive && setError(err instanceof Error ? err.message : "Không tải được tin nhắn."));
    const disconnect = connectSupportChat(
      selectedId,
      (event) => {
        if (event.message) setMessages((current) => mergeSupportMessage(current, event.message!));
        void supportChatService.markRead(selectedId).catch(() => undefined);
        void loadConversations().catch(() => undefined);
      },
      setConnected,
    );
    return () => {
      alive = false;
      disconnect();
    };
  }, [loadConversations, selectedId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || !selectedId || sending) return;
    setInput("");
    setSending(true);
    try {
      const message = await supportChatService.sendMessage(selectedId, content);
      setMessages((current) => mergeSupportMessage(current, message));
      await loadConversations();
    } catch (err) {
      setInput(content);
      setError(err instanceof Error ? err.message : "Không gửi được tin nhắn.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="instructor-chat-page">
      <header className="instructor-chat-heading">
        <div><span>Hỗ trợ học viên</span><h1>Tin nhắn</h1><p>Trao đổi realtime với học viên trong các khóa học của bạn.</p></div>
        <b className={connected ? "online" : ""}>{connected ? "Đang trực tuyến" : "Đang kết nối"}</b>
      </header>
      {error && <p className="instructor-chat-error">{error}</p>}

      <div className="instructor-chat-layout">
        <aside className="instructor-chat-list">
          {loading && <p className="instructor-chat-empty">Đang tải...</p>}
          {!loading && conversations.length === 0 && <p className="instructor-chat-empty">Chưa có học viên nào gửi tin nhắn.</p>}
          {conversations.map((conversation) => (
            <button key={conversation.id} type="button" className={conversation.id === selectedId ? "active" : ""} onClick={() => { setMessages([]); setSelectedId(conversation.id); }}>
              <span className="instructor-chat-avatar">{conversation.studentName.charAt(0).toUpperCase()}</span>
              <span><strong>{conversation.studentName}</strong><small>{conversation.courseName}</small><em>{conversation.lastMessage || "Chưa có tin nhắn"}</em></span>
              {conversation.unreadCount > 0 && <b>{conversation.unreadCount}</b>}
            </button>
          ))}
        </aside>

        <section className="instructor-chat-room">
          {!selected ? (
            <div className="instructor-chat-placeholder"><MessageCircle size={40} /><strong>Chọn một học viên</strong><span>Hội thoại sẽ xuất hiện khi học viên tạo chat theo khóa học.</span></div>
          ) : (
            <>
              <header><span className="instructor-chat-avatar">{selected.studentName.charAt(0).toUpperCase()}</span><span><strong>{selected.studentName}</strong><small>{selected.courseName}</small></span></header>
              <div className="instructor-chat-messages">
                {messages.length === 0 && <p className="instructor-chat-empty">Chưa có tin nhắn trong hội thoại này.</p>}
                {messages.map((message) => {
                  const mine = message.senderId === user?.id || message.senderId === selected.instructorId;
                  return <div key={message.id} className={`instructor-chat-message ${mine ? "mine" : ""}`}><span>{message.content}</span><time>{formatTime(message.createdAt)}</time></div>;
                })}
                <div ref={endRef} />
              </div>
              <form className="instructor-chat-composer" onSubmit={submit}>
                <textarea value={input} onChange={(event) => setInput(event.target.value.slice(0, 2000))} placeholder="Nhập câu trả lời..." rows={1} />
                <button type="submit" disabled={!input.trim() || sending} aria-label="Gửi tin nhắn"><Send size={18} /></button>
              </form>
            </>
          )}
        </section>
      </div>
    </section>
  );
}
