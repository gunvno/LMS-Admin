import { apiClient } from "@/lib/api-client";

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type NoticeType =
  | "COURSE_SUBMITTED"
  | "COURSE_APPROVED"
  | "COURSE_REJECTED"
  | "COURSE_PUBLISHED"
  | "ENROLLMENT_SUCCESS"
  | "COURSE_COMPLETED"
  | "CERTIFICATE_ISSUED"
  | "SYSTEM";

export type NoticeTargetType = "USER" | "USERS" | "ROLE" | "ALL";
export type NoticeStatus = "DRAFT" | "SENDING" | "SENT" | "FAILED" | "CANCELLED";
export type NoticeReadStatus = "UNREAD" | "READ";
export type NoticeDeliveryStatus = "PENDING" | "SENT" | "FAILED";

export type NoticeDto = {
  noticeId: string;
  recipientId: string;
  userId: string;
  title: string;
  content: string;
  noticeType: NoticeType;
  targetType: NoticeTargetType;
  data?: string;
  status: NoticeStatus;
  deliveryStatus: NoticeDeliveryStatus;
  readStatus: NoticeReadStatus;
  sentAt?: string;
  readAt?: string;
};

export type NoticeSendBase = {
  title: string;
  content: string;
  noticeType: NoticeType;
  data?: string;
};

export type NoticeSendUserPayload = NoticeSendBase & {
  userId: string;
};

export type NoticeSendUsersPayload = NoticeSendBase & {
  userIds: string[];
};

export type NoticeSendRolePayload = NoticeSendBase & {
  roleCode: string;
};

export type NoticeSendAllPayload = NoticeSendBase;

type ListParams = {
  page?: number;
  size?: number;
  sort?: string;
};

function wrap<T>(data: T) {
  return { data, channel: "WEB", signature: "" };
}

function toQuery(params: ListParams = {}) {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 0));
  search.set("size", String(params.size ?? 10));
  if (params.sort) search.set("sort", params.sort);
  return search.toString();
}

function emptyPage<T>(params: ListParams = {}): PageResponse<T> {
  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: params.page ?? 0,
    size: params.size ?? 10,
  };
}

async function getNoticePage(params?: ListParams) {
  const page = await apiClient<PageResponse<NoticeDto> | null>(
    `/notice/api/v1/notices/me?${toQuery(params)}`,
    { method: "GET" }
  );
  return page ?? emptyPage<NoticeDto>(params);
}

export const noticeService = {
  getMyNotices: getNoticePage,

  getUnreadCount: (): Promise<number> => {
    return apiClient<number>("/notice/api/v1/notices/me/unread-count", {
      method: "GET",
    });
  },

  markRead: (recipientId: string): Promise<NoticeDto> => {
    return apiClient<NoticeDto>(`/notice/api/v1/notices/${recipientId}/read`, {
      method: "POST",
    });
  },

  markAllRead: (): Promise<void> => {
    return apiClient<void>("/notice/api/v1/notices/read-all", {
      method: "POST",
    });
  },

  sendUser: (data: NoticeSendUserPayload): Promise<void> => {
    return apiClient<void>("/notice/api/v1/admin/notices/send-user", {
      method: "POST",
      body: JSON.stringify(wrap(data)),
    });
  },

  sendUsers: (data: NoticeSendUsersPayload): Promise<void> => {
    return apiClient<void>("/notice/api/v1/admin/notices/send-users", {
      method: "POST",
      body: JSON.stringify(wrap(data)),
    });
  },

  sendRole: (data: NoticeSendRolePayload): Promise<void> => {
    return apiClient<void>("/notice/api/v1/admin/notices/send-role", {
      method: "POST",
      body: JSON.stringify(wrap(data)),
    });
  },

  sendAll: (data: NoticeSendAllPayload): Promise<void> => {
    return apiClient<void>("/notice/api/v1/admin/notices/send-all", {
      method: "POST",
      body: JSON.stringify(wrap(data)),
    });
  },
};
