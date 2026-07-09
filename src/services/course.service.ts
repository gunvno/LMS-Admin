import { apiClient } from '@/lib/api-client';

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type CourseCategoryStatus = 'ACTIVE' | 'INACTIVE';
export type CourseStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type CourseCategory = {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: CourseCategoryStatus;
};

export type Course = {
  id: string;
  categoryId: string;
  instructorId: string;
  name: string;
  code: string;
  description?: string;
  level?: CourseLevel;
  durationMinutes?: number;
  price?: number;
  status: CourseStatus;
  rejectReason?: string;
  publishedAt?: string;
};

export type CreateCoursePayload = Omit<Course, 'id' | 'rejectReason' | 'publishedAt'>;

export type CreateCategoryPayload = Omit<CourseCategory, 'id'>;

export type ImageDto = {
  id: string;
  objectType: 'COURSE' | 'LESSON' | 'USER' | 'CERTIFICATE';
  objectId: string;
  fileName: string;
  filePath: string;
  fileUrl?: string;
  contentType?: string;
  fileSize?: number;
  primaryImage?: boolean;
  status: 'ACTIVE' | 'INACTIVE';
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

export const courseService = {
  getCategories: (params?: ListParams): Promise<PageResponse<CourseCategory>> => {
    return getPage<CourseCategory>('/course/api/v1/course-categories', params);
  },

  createCategory: (data: CreateCategoryPayload): Promise<CourseCategory> => {
    return apiClient<CourseCategory>('/course/api/v1/course-categories', {
      method: 'POST',
      body: JSON.stringify({ data, channel: 'WEB', signature: '' }),
    });
  },

  getCategory: (id: string): Promise<CourseCategory> => {
    return apiClient<CourseCategory>(`/course/api/v1/course-categories/${id}`, {
      method: 'GET',
    });
  },

  updateCategory: (id: string, data: CreateCategoryPayload): Promise<CourseCategory> => {
    return apiClient<CourseCategory>(`/course/api/v1/course-categories/${id}`, {
      method: 'POST',
      body: JSON.stringify({ data: { ...data, id }, channel: 'WEB', signature: '' }),
    });
  },

  deleteCategory: (id: string): Promise<void> => {
    return apiClient<void>(`/course/api/v1/course-categories/${id}`, {
      method: 'DELETE',
    });
  },

  getCourses: (params?: ListParams): Promise<PageResponse<Course>> => {
    return getPage<Course>('/course/api/v1/courses', params);
  },

  createCourse: (data: CreateCoursePayload): Promise<Course> => {
    return apiClient<Course>('/course/api/v1/courses', {
      method: 'POST',
      body: JSON.stringify({ data, channel: 'WEB', signature: '' }),
    });
  },

  getCourse: (id: string): Promise<Course> => {
    return apiClient<Course>(`/course/api/v1/courses/${id}`, {
      method: 'GET',
    });
  },

  updateCourse: (id: string, data: CreateCoursePayload): Promise<Course> => {
    return apiClient<Course>(`/course/api/v1/courses/${id}`, {
      method: 'POST',
      body: JSON.stringify({ data: { ...data, id }, channel: 'WEB', signature: '' }),
    });
  },

  deleteCourse: (id: string): Promise<void> => {
    return apiClient<void>(`/course/api/v1/courses/${id}`, {
      method: 'DELETE',
    });
  },

  uploadCourseImage: (courseId: string, file: File): Promise<ImageDto> => {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient<ImageDto>(`/course/api/v1/courses/${courseId}/images`, {
      method: 'POST',
      body: formData,
    });
  },
};
