"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Bell,
  BellOff,
  BellRing,
  CheckCircle2,
  LoaderCircle,
  MailCheck,
  Megaphone,
  RefreshCw,
  Search,
  Send,
  Users,
  X,
} from "lucide-react";
import {
  NoticeDto,
  NoticeTargetType,
  NoticeType,
  noticeService,
} from "@/services/notice.service";
import { formatDateTime } from "@/lib/date";
import { useAuth } from "@/contexts/AuthContext";
import { PERMISSION } from "@/lib/permissions";
import { usePushNotifications } from "@/contexts/PushNotificationsContext";
import {
  authorService,
  NoticeRecipient,
} from "@/services/author.service";
import "./notices.css";

const noticeTypes: Array<{ value: NoticeType; label: string }> = [
  { value: "SYSTEM", label: "Thông báo hệ thống" },
  { value: "COURSE_SUBMITTED", label: "Khóa học được gửi duyệt" },
  { value: "COURSE_APPROVED", label: "Khóa học được duyệt" },
  { value: "COURSE_REJECTED", label: "Khóa học bị từ chối" },
  { value: "COURSE_PUBLISHED", label: "Khóa học được xuất bản" },
  { value: "ENROLLMENT_SUCCESS", label: "Đăng ký khóa học thành công" },
  { value: "COURSE_COMPLETED", label: "Hoàn thành khóa học" },
  { value: "CERTIFICATE_ISSUED", label: "Được cấp chứng chỉ" },
];

const targetOptions: Array<{ value: NoticeTargetType; label: string; hint: string }> = [
  { value: "ROLE", label: "Theo vai trò", hint: "Gửi cho ADMIN, INSTRUCTOR hoặc STUDENT" },
  { value: "USER", label: "Một người", hint: "Tìm theo tên, username, email hoặc vai trò" },
  { value: "USERS", label: "Nhiều người", hint: "Tìm và chọn nhiều người nhận từ danh sách tài khoản" },
  { value: "ALL", label: "Tất cả", hint: "Gửi broadcast cho người dùng có thiết bị active" },
];

function parseJsonText(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  JSON.parse(trimmed);
  return trimmed;
}

function statusClass(notice: NoticeDto) {
  if (notice.readStatus === "UNREAD") return "notice-chip unread";
  if (notice.deliveryStatus === "FAILED") return "notice-chip failed";
  return "notice-chip read";
}

function normalizeSearch(value?: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function recipientDisplayName(recipient: NoticeRecipient) {
  return recipient.fullName?.trim() || "Chưa cập nhật họ tên";
}

function recipientSecondaryText(recipient: NoticeRecipient) {
  const parts = [
    recipient.username ? `@${recipient.username}` : "",
    recipient.email,
  ].filter(Boolean);
  return parts.join(" · ") || "Tài khoản LMS";
}

type RecipientPickerProps = {
  recipients: NoticeRecipient[];
  selectedIds: string[];
  onChange: (userIds: string[]) => void;
  multiple?: boolean;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
};

const MAX_VISIBLE_RECIPIENTS = 30;

function RecipientPicker({
  recipients,
  selectedIds,
  onChange,
  multiple = false,
  loading = false,
  error = "",
  onRetry,
}: RecipientPickerProps) {
  const pickerId = useId().replace(/:/g, "");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedRecipients = useMemo(
    () => selectedIds
      .map((userId) => recipients.find((recipient) => recipient.userId === userId))
      .filter((recipient): recipient is NoticeRecipient => Boolean(recipient)),
    [recipients, selectedIds]
  );
  const matchingRecipients = useMemo(() => {
    const term = normalizeSearch(query);
    return recipients
      .filter((recipient) => !selectedSet.has(recipient.userId))
      .filter((recipient) => {
        if (!term) return true;
        const searchable = [
          recipient.fullName,
          recipient.username,
          recipient.email,
          ...(recipient.roleCodes || []),
        ].map(normalizeSearch).join(" ");
        return searchable.includes(term);
      })
      .sort((left, right) => recipientDisplayName(left).localeCompare(recipientDisplayName(right), "vi"));
  }, [query, recipients, selectedSet]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const selectRecipient = (recipient: NoticeRecipient) => {
    onChange(multiple ? [...selectedIds, recipient.userId] : [recipient.userId]);
    setQuery("");
    setOpen(multiple);
  };

  const removeRecipient = (userId: string) => {
    onChange(selectedIds.filter((selectedId) => selectedId !== userId));
  };

  const visibleRecipients = matchingRecipients.slice(0, MAX_VISIBLE_RECIPIENTS);
  const listId = `${pickerId}-options`;
  const inputLabel = multiple ? "Tìm và thêm người nhận" : "Tìm người nhận";

  return (
    <div className="recipient-picker" ref={rootRef}>
      <div
        className={`recipient-search-control ${open ? "open" : ""}`}
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        <Search size={17} aria-hidden="true" />
        <div className="recipient-control-content">
          {selectedRecipients.map((recipient) => (
            <span className={`recipient-value ${multiple ? "multiple" : "single"}`} key={recipient.userId}>
              {multiple ? (
                <strong>{recipientDisplayName(recipient)}</strong>
              ) : (
                <span className="recipient-value-copy">
                  <strong>{recipientDisplayName(recipient)}</strong>
                  <small>{recipientSecondaryText(recipient)}</small>
                </span>
              )}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  removeRecipient(recipient.userId);
                  window.setTimeout(() => inputRef.current?.focus(), 0);
                }}
                aria-label={`Bỏ chọn ${recipientDisplayName(recipient)}`}
              >
                <X size={14} />
              </button>
            </span>
          ))}
          {(multiple || selectedRecipients.length === 0) && (
            <input
              ref={inputRef}
              id={`${pickerId}-search`}
              type="search"
              value={query}
              disabled={loading}
              placeholder={loading ? "Đang tải danh sách..." : inputLabel}
              role="combobox"
              aria-label={inputLabel}
              aria-autocomplete="list"
              aria-expanded={open}
              aria-controls={listId}
              onFocus={() => setOpen(true)}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") setOpen(false);
              }}
            />
          )}
        </div>
        {loading && <LoaderCircle className="recipient-loading-icon" size={18} aria-label="Đang tải" />}
      </div>

      {error && (
        <div className="recipient-picker-error" role="alert">
          <span>{error}</span>
          {onRetry && (
            <button type="button" onClick={onRetry}>Thử lại</button>
          )}
        </div>
      )}

      {open && !loading && !error && (
        <div className="recipient-options" id={listId} role="listbox" aria-multiselectable={multiple || undefined}>
          {visibleRecipients.length === 0 ? (
            <p className="recipient-picker-message">
              {recipients.length === 0
                ? "Chưa có tài khoản nào trong danh sách."
                : recipients.length === selectedRecipients.length
                  ? "Bạn đã chọn toàn bộ tài khoản."
                  : "Không tìm thấy tài khoản phù hợp."}
            </p>
          ) : visibleRecipients.map((recipient) => (
            <button
              className="recipient-option"
              key={recipient.userId}
              type="button"
              role="option"
              aria-selected="false"
              onClick={() => selectRecipient(recipient)}
            >
              <span className="recipient-option-copy">
                <strong>{recipientDisplayName(recipient)}</strong>
                <small>{recipientSecondaryText(recipient)}</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NoticesPage() {
  const { hasPermission } = useAuth();
  const { status: pushStatus, error: pushError, enableNotifications } = usePushNotifications();
  const canViewInbox = hasPermission(PERMISSION.NOTICE_VIEW);
  const canBroadcast = hasPermission(PERMISSION.NOTICE_BROADCAST);
  const recipientLoadStarted = useRef(false);
  const [targetType, setTargetType] = useState<NoticeTargetType>("ROLE");
  const [noticeType, setNoticeType] = useState<NoticeType>("SYSTEM");
  const [roleCode, setRoleCode] = useState("STUDENT");
  const [recipientOptions, setRecipientOptions] = useState<NoticeRecipient[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [recipientError, setRecipientError] = useState("");
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

  const loadRecipients = useCallback(async () => {
    setLoadingRecipients(true);
    setRecipientError("");
    try {
      const recipients = await authorService.getNoticeRecipients();
      setRecipientOptions(recipients || []);
    } catch (err) {
      setRecipientError(err instanceof Error
        ? err.message
        : "Không tải được danh sách người nhận.");
    } finally {
      setLoadingRecipients(false);
    }
  }, []);

  useEffect(() => {
    if (!canBroadcast || recipientLoadStarted.current) return;

    recipientLoadStarted.current = true;
    void loadRecipients();
  }, [canBroadcast, loadRecipients]);

  const loadInbox = useCallback(async () => {
    if (!canViewInbox) return;

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
  }, [canViewInbox]);

  useEffect(() => {
    if (!canViewInbox) return;

    const timer = window.setTimeout(() => void loadInbox(), 0);
    const refreshOnPush = () => void loadInbox();
    window.addEventListener("lms:notifications-updated", refreshOnPush);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("lms:notifications-updated", refreshOnPush);
    };
  }, [canViewInbox, loadInbox]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canBroadcast) return;

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
        if (!selectedRecipientId) throw new Error("Vui lòng chọn người nhận.");
        await noticeService.sendUser({ ...base, userId: selectedRecipientId });
      } else if (targetType === "USERS") {
        if (selectedRecipientIds.length === 0) throw new Error("Vui lòng chọn ít nhất một người nhận.");
        await noticeService.sendUsers({ ...base, userIds: selectedRecipientIds });
      } else {
        await noticeService.sendAll(base);
      }

      setMessage("Đã gửi thông báo thành công.");
      setTitle("");
      setContent("");
      setData("");
      setSelectedRecipientId("");
      setSelectedRecipientIds([]);
      if (canViewInbox) await loadInbox();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không gửi được thông báo.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (!canViewInbox) return;

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
            {canBroadcast && canViewInbox
              ? "Theo dõi inbox và gửi thông báo tới học viên, giảng viên hoặc nhóm user cụ thể."
              : canBroadcast
                ? "Gửi thông báo tới học viên, giảng viên hoặc nhóm user cụ thể."
                : "Theo dõi những thông báo được gửi tới tài khoản của bạn."}
          </p>
        </div>
      </div>

      {(error || message) && (
        <div className={`notice-alert ${error ? "error" : "success"}`}>
          {error || message}
        </div>
      )}

      <section className={`push-permission-bar ${pushStatus}`}>
        {pushStatus === "denied" || pushStatus === "unsupported"
          ? <BellOff size={18} />
          : <BellRing size={18} />}
        <div className="push-permission-copy">
          <strong>Thông báo trình duyệt</strong>
          <span>
            {pushStatus === "enabled" && "Đã bật trên thiết bị này."}
            {pushStatus === "default" && "Bật để nhận thông báo khi không mở trang."}
            {pushStatus === "denied" && "Đang bị chặn trong cài đặt trình duyệt."}
            {pushStatus === "unsupported" && "Trình duyệt này không hỗ trợ."}
            {pushStatus === "registering" && "Đang đăng ký thiết bị..."}
            {pushStatus === "checking" && "Đang kiểm tra..."}
            {pushStatus === "error" && (pushError || "Chưa bật được. Vui lòng thử lại.")}
          </span>
        </div>
        {(pushStatus === "default" || pushStatus === "error") && (
          <button type="button" className="btn btn-primary push-enable-btn" onClick={() => void enableNotifications()}>
            Bật thông báo
          </button>
        )}
        {(pushStatus === "checking" || pushStatus === "registering") && (
          <LoaderCircle className="push-spinner" size={20} />
        )}
      </section>

      <div className={`notices-grid ${canBroadcast && canViewInbox ? "" : "single"}`}>
        {canBroadcast && (
          <section className="card notice-composer">
          <div className="notice-section-title">
            <Megaphone size={20} />
            <div>
              <h2 className="text-headline-sm">Gửi thông báo</h2>
              <p className="text-body-sm text-on-surface-variant">
                Người nhận sẽ thấy nội dung này trong danh sách thông báo.
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
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </label>

              {targetType === "ROLE" && (
                <label>
                  <span>Vai trò người nhận</span>
                  <select className="form-input" value={roleCode} onChange={(event) => setRoleCode(event.target.value)}>
                    <option value="STUDENT">Tất cả học viên</option>
                    <option value="INSTRUCTOR">Tất cả giảng viên</option>
                    <option value="ADMIN">Tất cả quản trị viên</option>
                  </select>
                </label>
              )}
            </div>

            {targetType === "USER" && (
              <div className="recipient-field">
                <div className="recipient-field-heading">
                  <span>Người nhận</span>
                  <small>Chọn một tài khoản</small>
                </div>
                <RecipientPicker
                  recipients={recipientOptions}
                  selectedIds={selectedRecipientId ? [selectedRecipientId] : []}
                  onChange={(userIds) => setSelectedRecipientId(userIds[0] || "")}
                  loading={loadingRecipients}
                  error={recipientError}
                  onRetry={() => void loadRecipients()}
                />
              </div>
            )}

            {targetType === "USERS" && (
              <div className="recipient-field">
                <div className="recipient-field-heading">
                  <span>Người nhận</span>
                  <small>{selectedRecipientIds.length} tài khoản đã chọn</small>
                </div>
                <RecipientPicker
                  recipients={recipientOptions}
                  selectedIds={selectedRecipientIds}
                  onChange={setSelectedRecipientIds}
                  multiple
                  loading={loadingRecipients}
                  error={recipientError}
                  onRetry={() => void loadRecipients()}
                />
              </div>
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

            <details className="notice-advanced">
              <summary>Tùy chọn nâng cao</summary>
              <label>
                <span>Data JSON</span>
                <textarea
                  className="form-input notice-textarea compact"
                  value={data}
                  onChange={(event) => setData(event.target.value)}
                  placeholder='{"courseId":"...","url":"/courses/..."}'
                />
              </label>
            </details>

            <button className="btn btn-primary notice-submit" disabled={loading}>
              <Send size={18} />
              {loading ? "Đang gửi..." : "Gửi thông báo"}
            </button>
          </form>
          </section>
        )}

        {canViewInbox && (
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
                      if (!canViewInbox) return;
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
        )}
      </div>
    </div>
  );
}
