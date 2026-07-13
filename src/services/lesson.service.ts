import { apiClient } from '@/lib/api-client';
import type { PageResponse } from './course.service';

export type LessonStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type Lesson = {
  id: string;
  courseId: string;
  title: string;
  code?: string;
  content?: string;
  videoUrl?: string;
  orderIndex?: number;
  durationMinutes?: number;
  status: LessonStatus;
};

export type CreateLessonPayload = Omit<Lesson, 'id'>;

export type LessonResourceType = 'PDF' | 'DOCX' | 'LINK' | 'VIDEO' | 'IMAGE';

export type LessonResource = {
  id: string;
  lessonId: string;
  title: string;
  resourceType: LessonResourceType;
  filePath?: string;
  externalUrl?: string;
  status: 'ACTIVE' | 'INACTIVE';
};

type ListParams = {
  page?: number;
  size?: number;
  sort?: string;
  lessonId?: string;
};

function toQuery(params: ListParams = {}) {
  const search = new URLSearchParams();
  search.set('page', String(params.page ?? 0));
  search.set('size', String(params.size ?? 10));
  if (params.sort) search.set('sort', params.sort);
  if (params.lessonId) search.set('lessonId', params.lessonId);
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

export const lessonService = {
  getLessons: (params?: ListParams): Promise<PageResponse<Lesson>> => {
    return getPage<Lesson>('/course/api/v1/lessons', params);
  },

  getLessonsByCourse: (courseId: string, params?: ListParams): Promise<PageResponse<Lesson>> => {
    return getPage<Lesson>(`/course/api/v1/courses/${courseId}/lessons`, params);
  },

  getLesson: (id: string): Promise<Lesson> => {
    return apiClient<Lesson>(`/course/api/v1/lessons/${id}`, {
      method: 'GET',
    });
  },

  createLesson: (data: CreateLessonPayload): Promise<Lesson> => {
    return apiClient<Lesson>('/course/api/v1/lessons', {
      method: 'POST',
      body: JSON.stringify({ data, channel: 'WEB', signature: '' }),
    });
  },

  updateLesson: (id: string, data: CreateLessonPayload): Promise<Lesson> => {
    return apiClient<Lesson>(`/course/api/v1/lessons/${id}`, {
      method: 'POST',
      body: JSON.stringify({ data: { ...data, id }, channel: 'WEB', signature: '' }),
    });
  },

  deleteLesson: (id: string): Promise<void> => {
    return apiClient<void>(`/course/api/v1/lessons/${id}`, {
      method: 'DELETE',
    });
  },

  getLessonResources: (lessonId: string): Promise<PageResponse<LessonResource>> => {
    return getPage<LessonResource>('/course/api/v1/lesson-resources', {
      lessonId,
      page: 0,
      size: 100,
    });
  },

  uploadLessonResource: (lessonId: string, file: File, title = file.name): Promise<LessonResource> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);

    return apiClient<LessonResource>(`/course/api/v1/lessons/${lessonId}/resources`, {
      method: 'POST',
      body: formData,
    });
  },

  deleteLessonResource: (id: string): Promise<void> => {
    return apiClient<void>(`/course/api/v1/lesson-resources/${id}`, {
      method: 'DELETE',
    });
  },
};
