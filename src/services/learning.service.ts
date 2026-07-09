import { apiClient } from '@/lib/api-client';
import type { PageResponse } from './course.service';

export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

export type Enrollment = {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt?: string;
  completedAt?: string;
  progressPercent?: number;
  status: EnrollmentStatus;
};

export type CertificateStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export type Certificate = {
  id: string;
  userId: string;
  courseId: string;
  enrollmentId: string;
  certificateCode: string;
  issuedAt?: string;
  status: CertificateStatus;
};

type ListParams = {
  page?: number;
  size?: number;
  sort?: string;
};

function toQuery(params: ListParams = {}) {
  const search = new URLSearchParams();
  search.set('page', String(params.page ?? 0));
  search.set('size', String(params.size ?? 10));
  if (params.sort) search.set('sort', params.sort);
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

async function getPage<T>(endpoint: string, params?: ListParams): Promise<PageResponse<T>> {
  const page = await apiClient<PageResponse<T> | null>(`${endpoint}?${toQuery(params)}`, {
    method: 'GET',
  });
  return page ?? emptyPage<T>(params);
}

export const learningService = {
  getMyCourses: (params?: ListParams): Promise<PageResponse<Enrollment>> => {
    return getPage<Enrollment>('/learning/api/v1/my-courses', params);
  },

  completeEnrollment: (id: string): Promise<Enrollment> => {
    return apiClient<Enrollment>(`/learning/api/v1/enrollments/${id}/complete`, {
      method: 'POST',
    });
  },

  getMyCertificates: (params?: ListParams): Promise<PageResponse<Certificate>> => {
    return getPage<Certificate>('/learning/api/v1/my-certificates', params);
  },

  verifyCertificate: (code: string): Promise<Certificate> => {
    return apiClient<Certificate>(`/learning/api/v1/certificates/${encodeURIComponent(code)}`, {
      method: 'GET',
    });
  },
};
