"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  MailCheck,
  Megaphone,
  RefreshCw,
  Send,
  Users,
} from "lucide-react";
import {
  NoticeDto,
  NoticeTargetType,
  NoticeType,
  noticeService,
} from "@/services/notice.service";
import { formatDateTime } from "@/lib/date";
import "./notices.css";

const noticeTypes: NoticeType[] = [
  "SYSTEM",
  "COURSE_SUBMITTED",
  "COURSE_APPROVED",
  "COURSE_REJECTED",
  "COURSE_PUBLISHED",
  "ENROLLMENT_SUCCESS",
  "COURSE_COMPLETED",
  "CERTIFICATE_ISSUED",
];

const targetOptions: Array<{ value: NoticeTargetType; label: string; hint: string }> = [
  { value: "ROLE", label: "Theo vai trò", hint: "Gửi cho ADMIN, INSTRUCTOR hoặc STUDENT" },
  { value: "USER", label: "Một user", hint: "Gửi theo userId cụ thể" },
  { value: "USERS", label: "Nhiều user", hint: "Dán danh sách userId, mỗi dòng hoặc cách nhau dấu phẩy" },
  { value: "ALL", label: "Tất cả", hint: "Gửi broadcast cho người dùng có thiết bị active" },
];

function parseJsonText(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  JSON.parse(trimmed);
  return trimmed;
}

function splitUserIds(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function statusClass(notice: NoticeDto) {
  if (notice.readStatus === "UNREAD") return "notice-chip unread";
  if (notice.deliveryStatus === "FAILED") return "notice-chip failed";
  return "notice-chip read";
}

export default function NoticesPage() {
  const [targetType, setTargetType] = useState<NoticeTargetType>("ROLE");
  const [noticeType, setNoticeType] = useState<NoticeType>("SYSTEM");
  const [roleCode, setRoleCode] = useState("STUDENT");
  const [userId, setUserId] = useState("");
  const [userIds, setUserIds] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [data, setData] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [notices, setNotices] = useState<NoticeDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingInbox, setLoadingInbox] = useState(true);

  const selectedTarget = useMemo(
    () => targetOptions.find((item) => item.value === targetType),
    [targetType]
  );

  const loadInbox = async () => {
    try {
      setLoadingInbox(true);
      const [page, unread] = await Promise.all([
        noticeService.getMyNotices({ page: 0, size: 8 }),
        noticeService.getUnreadCount(),
      ]);
      setNotices(page.content || []);
      setUnreadCount(unread || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được thông báo.");
    } finally {
      setLoadingInbox(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void loadInbox(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const cleanTitle = title.trim();
    const cleanContent = content.trim();
    if (!cleanTitle || !cleanContent) {
      setError("Vui lòng nhập tiêu đề và nội dung thông báo.");
      return;
    }

    let normalizedData: string | undefined;
    try {
      normalizedData = parseJsonText(data);
    } catch {
      setError("Trường data phải là JSON hợp lệ, ví dụ {\"courseId\":\"...\"}.");
      return;
    }

    try {
      setLoading(true);
      const base = {
        title: cleanTitle,
        content: cleanContent,
        noticeType,
        data: normalizedData,
      };

      if (targetType === "ROLE") {
        await noticeService.sendRole({ ...base, roleCode });
      } else if (targetType === "USER") {
        if (!userId.trim()) throw new Error("Vui lòng nhập userId.");
        await noticeService.sendUser({ ...base, userId: userId.trim() });
      } else if (targetType === "USERS") {
        const ids = splitUserIds(userIds);
        if (ids.length === 0) throw new Error("Vui lòng nhập ít nhất một userId.");
        await noticeService.sendUsers({ ...base, userIds: ids });
      } else {
        await noticeService.sendAll(base);
      }

      setMessage("Đã gửi thông báo thành công.");
      setTitle("");
      setContent("");
      setData("");
      await loadInbox();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không gửi được thông báo.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await noticeService.markAllRead();
      await loadInbox();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đánh dấu đã đọc được.");
    }
  };

  return (
    <div className="page-container notices-page">
      <div className="page-header">
        <div className="header-titles">
          <h1 className="text-headline-lg">Thông báo</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            Soạn thông báo thật qua notice-service và gửi tới học viên, giảng viên hoặc nhóm user cụ thể.
          </p>
        </div>
      </div>

      {(error || message) && (
        <div className={`notice-alert ${error ? "error" : "success"}`}>
          {error || message}
        </div>
      )}

      <div className="notices-grid">
        <section className="card notice-composer">
          <div className="notice-section-title">
            <Megaphone size={20} />
            <div>
              <h2 className="text-headline-sm">Gửi thông báo</h2>
              <p className="text-body-sm text-on-surface-variant">
                Nội dung sẽ xuất hiện ở chuông thông báo frontend student.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="notice-form">
            <div className="target-tabs" aria-label="Chọn đối tượng nhận">
              {targetOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={targetType === item.value ? "active" : ""}
                  onClick={() => setTargetType(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="target-hint">{selectedTarget?.hint}</p>

            <div className="form-grid">
              <label>
                <span>Loại thông báo</span>
                <select
                  className="form-input"
                  value={noticeType}
                  onChange={(event) => setNoticeType(event.target.value as NoticeType)}
                >
                  {noticeTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>

              {targetType === "ROLE" && (
                <label>
                  <span>Role</span>
                  <select className="form-input" value={roleCode} onChange={(event) => setRoleCode(event.target.value)}>
                    <option value="STUDENT">STUDENT</option>
                    <option value="INSTRUCTOR">INSTRUCTOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </label>
              )}

              {targetType === "USER" && (
                <label>
                  <span>User ID</span>
                  <input
                    className="form-input"
                    value={userId}
                    onChange={(event) => setUserId(event.target.value)}
                    placeholder="Nhập userId người nhận"
                  />
                </label>
              )}
            </div>

            {targetType === "USERS" && (
              <label>
                <span>Danh sách userId</span>
                <textarea
                  className="form-input notice-textarea compact"
                  value={userIds}
                  onChange={(event) => setUserIds(event.target.value)}
                  placeholder="user-1, user-2 hoặc mỗi dòng một userId"
                />
              </label>
            )}

            <label>
              <span>Tiêu đề</span>
              <input
                className="form-input"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ví dụ: Khóa học của bạn đã được duyệt"
              />
            </label>

            <label>
              <span>Nội dung</span>
              <textarea
                className="form-input notice-textarea"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Nhập nội dung hiển thị cho người nhận..."
              />
            </label>

            <label>
              <span>Data JSON tùy chọn</span>
              <textarea
                className="form-input notice-textarea compact"
                value={data}
                onChange={(event) => setData(event.target.value)}
                placeholder='{"courseId":"...","url":"/courses/..."}'
              />
            </label>

            <button className="btn btn-primary notice-submit" disabled={loading}>
              <Send size={18} />
              {loading ? "Đang gửi..." : "Gửi thông báo"}
            </button>
          </form>
        </section>

        <aside className="card notice-inbox-panel">
          <div className="notice-section-title split">
            <div className="notice-section-title">
              <Bell size={20} />
              <div>
                <h2 className="text-headline-sm">Inbox của tôi</h2>
                <p className="text-body-sm text-on-surface-variant">
                  {unreadCount} thông báo chưa đọc
                </p>
              </div>
            </div>
            <button className="icon-action" onClick={loadInbox} aria-label="Tải lại">
              <RefreshCw size={18} />
            </button>
          </div>

          <button className="mark-all-btn" onClick={handleMarkAllRead} disabled={!unreadCount}>
            <MailCheck size={16} />
            Đánh dấu tất cả đã đọc
          </button>

          <div className="admin-notice-list">
            {loadingInbox && <p className="empty-text">Đang tải thông báo...</p>}
            {!loadingInbox && notices.length === 0 && (
              <div className="empty-notice">
                <Users size={28} />
                <strong>Chưa có thông báo</strong>
                <span>Thông báo gửi tới tài khoản admin sẽ nằm ở đây.</span>
              </div>
            )}
            {!loadingInbox && notices.map((notice) => (
              <article key={notice.recipientId} className="admin-notice-item">
                <div className="admin-notice-head">
                  <span className={statusClass(notice)}>
                    {notice.readStatus === "UNREAD" ? "Chưa đọc" : notice.deliveryStatus}
                  </span>
                  <span>{formatDateTime(notice.sentAt, "Chưa gửi")}</span>
                </div>
                <h3>{notice.title}</h3>
                <p>{notice.content}</p>
                {notice.readStatus === "UNREAD" && (
                  <button
                    className="read-inline-btn"
                    onClick={async () => {
                      await noticeService.markRead(notice.recipientId);
                      await loadInbox();
                    }}
                  >
                    <CheckCircle2 size={15} />
                    Đã đọc
                  </button>
                )}
              </article>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
