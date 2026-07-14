import { apiClient } from '@/lib/api-client';

export type PaymentStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED' | 'FAILED';

export type Payment = {
  id: string;
  userId: string;
  courseId: string;
  amount: number;
  provider: string;
  providerOrderCode?: number;
  providerPaymentLinkId?: string;
  providerTransactionId?: string;
  invoiceCode?: string;
  status: PaymentStatus;
  paidAt?: string;
  createdDate?: string;
  createdAt?: string;
  displayDate?: string;
};

export type Invoice = {
  id: string;
  paymentId: string;
  invoiceCode: string;
  userId: string;
  courseId: string;
  amount: number;
  provider: string;
  providerTransactionId?: string;
  status: string;
  issuedAt: string;
  paidAt?: string;
  createdDate?: string;
  createdAt?: string;
  displayDate?: string;
};

export type PageData<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export const paymentService = {
  getAdminPayments: (page = 0, size = 100): Promise<PageData<Payment>> =>
    apiClient<PageData<Payment>>(`/billing/api/v1/admin/payments?page=${page}&size=${size}`),

  getAdminInvoices: (page = 0, size = 100): Promise<PageData<Invoice>> =>
    apiClient<PageData<Invoice>>(`/billing/api/v1/admin/invoices?page=${page}&size=${size}`),
};
