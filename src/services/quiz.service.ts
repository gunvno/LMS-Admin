import { apiClient } from '@/lib/api-client';
import type { PageResponse } from './course.service';

export type QuizStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type Quiz = {
  id: string;
  courseId: string;
  lessonId: string;
  title: string;
  passScore: number;
  maxAttempts: number;
  requiredToComplete: boolean;
  status?: QuizStatus;
};

export type CreateQuizPayload = Omit<Quiz, 'id'>;

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

export const quizService = {
  getQuizzes: (params?: ListParams): Promise<PageResponse<Quiz>> => {
    return getPage<Quiz>('/quiz/api/v1/quiz', params);
  },

  getQuiz: (id: string): Promise<Quiz> => {
    return apiClient<Quiz>(`/quiz/api/v1/quiz/${id}`, {
      method: 'GET',
    });
  },

  createQuiz: (data: CreateQuizPayload): Promise<Quiz> => {
    return apiClient<Quiz>('/quiz/api/v1/quiz', {
      method: 'POST',
      body: JSON.stringify({ data, channel: 'WEB', signature: '' }),
    });
  },

  updateQuiz: (id: string, data: CreateQuizPayload): Promise<Quiz> => {
    return apiClient<Quiz>(`/quiz/api/v1/quiz/${id}`, {
      method: 'POST',
      body: JSON.stringify({ data: { ...data, id }, channel: 'WEB', signature: '' }),
    });
  },

  deleteQuiz: (id: string): Promise<void> => {
    return apiClient<void>(`/quiz/api/v1/quiz/${id}`, {
      method: 'DELETE',
    });
  },
};
