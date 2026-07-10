import { apiClient } from '@/lib/api-client';
import type { PageResponse } from './course.service';

export type QuestionType = 'SINGLE_CHOICE';

export type Question = {
  id: string;
  quizId: string;
  content: string;
  questionType: QuestionType;
  score: number;
  orderIndex: number;
};

export type Answer = {
  id: string;
  questionId: string;
  content: string;
  correct: boolean;
  orderIndex: number;
};

export type CreateQuestionPayload = Omit<Question, 'id' | 'quizId'>;
export type CreateAnswerPayload = Omit<Answer, 'id' | 'questionId'>;

type ListParams = {
  page?: number;
  size?: number;
  sort?: string;
  quizId?: string;
  questionId?: string;
};

function toQuery(params: ListParams = {}) {
  const search = new URLSearchParams();
  search.set('page', String(params.page ?? 0));
  search.set('size', String(params.size ?? 100));
  if (params.sort) search.set('sort', params.sort);
  if (params.quizId) search.set('quizId', params.quizId);
  if (params.questionId) search.set('questionId', params.questionId);
  return search.toString();
}

function emptyPage<T>(params: ListParams = {}): PageResponse<T> {
  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: params.page ?? 0,
    size: params.size ?? 100,
  };
}

async function getPage<T>(endpoint: string, params?: ListParams): Promise<PageResponse<T>> {
  const page = await apiClient<PageResponse<T> | null>(`${endpoint}?${toQuery(params)}`, {
    method: 'GET',
  });
  return page ?? emptyPage<T>(params);
}


export const questionService = {
  getQuestions: (quizId: string): Promise<PageResponse<Question>> => {
    return getPage<Question>('/quiz/api/v1/questions', { quizId, page: 0, size: 100, sort: 'orderIndex,asc' });
  },

  getAnswers: (questionId: string): Promise<PageResponse<Answer>> => {
    return getPage<Answer>('/quiz/api/v1/answers', { questionId, page: 0, size: 100, sort: 'orderIndex,asc' });
  },

  getQuestion: (questionId: string): Promise<Question> => {
    return apiClient<Question>(`/quiz/api/v1/questions/${questionId}`, {
      method: 'GET',
    });
  },

  updateQuestion: (questionId: string, quizId: string, data: CreateQuestionPayload): Promise<Question> => {
    return apiClient<Question>(`/quiz/api/v1/questions/${questionId}`, {
      method: 'POST',
      body: JSON.stringify({ data: { ...data, id: questionId, quizId }, channel: 'WEB', signature: '' }),
    });
  },

  deleteQuestion: (questionId: string): Promise<void> => {
    return apiClient<void>(`/quiz/api/v1/questions/${questionId}`, {
      method: 'DELETE',
    });
  },

  updateAnswer: (answerId: string, questionId: string, data: CreateAnswerPayload): Promise<Answer> => {
    return apiClient<Answer>(`/quiz/api/v1/answers/${answerId}`, {
      method: 'POST',
      body: JSON.stringify({ data: { ...data, id: answerId, questionId }, channel: 'WEB', signature: '' }),
    });
  },

  deleteAnswer: (answerId: string): Promise<void> => {
    return apiClient<void>(`/quiz/api/v1/answers/${answerId}`, {
      method: 'DELETE',
    });
  },

  createQuestion: (quizId: string, data: CreateQuestionPayload): Promise<Question> => {
    return apiClient<Question>(`/quiz/api/v1/questions/quizzes/${quizId}`, {
      method: 'POST',
      body: JSON.stringify({ data: { ...data, quizId }, channel: 'WEB', signature: '' }),
    });
  },

  createAnswer: (questionId: string, data: CreateAnswerPayload): Promise<Answer> => {
    return apiClient<Answer>(`/quiz/api/v1/answers/questions/${questionId}`, {
      method: 'POST',
      body: JSON.stringify({ data: { ...data, questionId }, channel: 'WEB', signature: '' }),
    });
  },
};
