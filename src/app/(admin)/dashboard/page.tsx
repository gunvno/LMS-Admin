"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, CreditCard, FileText, TrendingUp, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { courseService, Course } from "@/services/course.service";
import { paymentService, Payment, Invoice } from "@/services/payment.service";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime, getDateTimestamp } from "@/lib/date";
import "./dashboard.css";

function formatMoney(value: number) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const requests = isAdmin
      ? Promise.all([
          courseService.getCourses({ page: 0, size: 100 }),
          paymentService.getAdminPayments(0, 100),
          paymentService.getAdminInvoices(0, 100),
        ])
      : courseService.getCourses({ page: 0, size: 100 }).then((coursePage) => [coursePage, null, null] as const);

    requests
      .then(([coursePage, paymentPage, invoicePage]) => {
        setCourses(coursePage.content || []);
        setPayments(paymentPage?.content || []);
        setInvoices(invoicePage?.content || []);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Không tải được dữ liệu dashboard."))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const courseById = useMemo(() => Object.fromEntries(courses.map((course) => [course.id, course.name])), [courses]);
  const publishedCourses = courses.filter((course) => course.status === "PUBLISHED").length;
  const paidPayments = payments.filter((payment) => payment.status === "PAID");
  const revenue = paidPayments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
  const recentPayments = [...payments]
    .sort((a, b) => getDateTimestamp(b.displayDate || b.createdAt || b.createdDate || b.paidAt) - getDateTimestamp(a.displayDate || a.createdAt || a.createdDate || a.paidAt))
    .slice(0, 5);

  return <div className="page-container">
    <div className="page-header" style={{ marginBottom: "32px" }}><div className="header-titles"><h1 className="text-headline-lg">{isAdmin ? "Dashboard Tổng Quan" : "Không gian giảng viên"}</h1><p className="text-body-md text-on-surface-variant mt-2">{isAdmin ? "Số liệu được cập nhật từ các dịch vụ khóa học và thanh toán." : "Theo dõi nội dung khóa học và các yêu cầu duyệt của bạn."}</p></div></div>
    {error && <div className="card p-4 mb-6 text-status-required">{error}</div>}
    <div className="metrics-grid mb-8">
      <div className="card p-6 metric-card"><div className="metric-header"><span className="text-label-md text-on-surface-variant">Khóa học đã xuất bản</span><div className="metric-icon bg-secondary-fixed text-secondary"><BookOpen size={20}/></div></div><div className="metric-value text-display mt-4">{loading ? "…" : publishedCourses}</div></div>
      <div className="card p-6 metric-card"><div className="metric-header"><span className="text-label-md text-on-surface-variant">Chờ duyệt</span><div className="metric-icon bg-primary-fixed text-primary"><Clock size={20}/></div></div><div className="metric-value text-display mt-4">{loading ? "…" : courses.filter((course) => course.status === "PENDING_REVIEW").length}</div></div>
      {isAdmin && <><div className="card p-6 metric-card"><div className="metric-header"><span className="text-label-md text-on-surface-variant">Tổng giao dịch</span><div className="metric-icon bg-primary-fixed text-primary"><CreditCard size={20}/></div></div><div className="metric-value text-display mt-4">{loading ? "…" : payments.length}</div></div><div className="card p-6 metric-card"><div className="metric-header"><span className="text-label-md text-on-surface-variant">Doanh thu đã thanh toán</span><div className="metric-icon" style={{ backgroundColor: "#ffedd5", color: "#c2410c" }}><TrendingUp size={20}/></div></div><div className="metric-value text-display mt-4">{loading ? "…" : formatMoney(revenue)}</div></div><div className="card p-6 metric-card"><div className="metric-header"><span className="text-label-md text-on-surface-variant">Hóa đơn đã phát hành</span><div className="metric-icon bg-primary-fixed text-primary"><FileText size={20}/></div></div><div className="metric-value text-display mt-4">{loading ? "…" : invoices.length}</div></div></>}
    </div>
    <div className="dashboard-grid">
      {isAdmin && <div className="card p-6"><div className="flex justify-between items-center mb-6"><h3 className="text-headline-sm">Giao dịch gần đây</h3><Link href="/payments" className="btn btn-ghost text-primary">Xem tất cả <ChevronRight size={16}/></Link></div><div className="activity-list flex flex-col gap-4">{recentPayments.length === 0 && !loading ? <span className="text-body-sm text-outline">Chưa có giao dịch.</span> : recentPayments.map((payment) => <div key={payment.id} className="activity-item flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"><div><span className="text-label-md block">{courseById[payment.courseId] || payment.courseId}</span><span className="text-body-sm text-outline block mt-1">{payment.status} · {formatMoney(payment.amount)}</span></div><div className="flex items-center gap-2 text-body-sm text-on-surface-variant"><Clock size={14}/>{formatDateTime(payment.displayDate || payment.createdAt || payment.createdDate || payment.paidAt)}</div></div>)}</div></div>}
      <div className="card p-6"><h3 className="text-headline-sm mb-6">Cần theo dõi</h3><div className="todo-list flex flex-col gap-4">{isAdmin && <div className="todo-item p-4 rounded bg-surface-container-low border border-border-subtle"><span className="text-label-md font-bold block mb-1">{payments.filter((payment) => payment.status === "PENDING").length} giao dịch đang chờ thanh toán</span><Link href="/payments" className="btn btn-secondary mt-3">Xem giao dịch</Link></div>}<div className="todo-item p-4 rounded bg-surface-container-low border border-border-subtle"><span className="text-label-md font-bold block mb-1">{courses.filter((course) => course.status === "PENDING_REVIEW").length} khóa học chờ duyệt</span><Link href="/courses" className="btn btn-secondary mt-3">Xem khóa học</Link></div></div></div>
    </div>
  </div>;
}
