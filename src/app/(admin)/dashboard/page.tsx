"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, CreditCard, FileText, TrendingUp, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { courseService, Course } from "@/services/course.service";
import { paymentService, Payment, Invoice } from "@/services/payment.service";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime, getDateTimestamp } from "@/lib/date";
import { PERMISSION } from "@/lib/permissions";
import "./dashboard.css";

function formatMoney(value: number) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

export default function DashboardPage() {
  const { hasPermission } = useAuth();
  const canViewCourses = hasPermission(PERMISSION.COURSE_VIEW);
  const canReviewCourses = canViewCourses && hasPermission(PERMISSION.COURSE_REVIEW);
  const canViewRevenue = hasPermission(PERMISSION.PAYMENT_MANAGE);
  const [courses, setCourses] = useState<Course[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");
      const [courseResult, paymentResult, invoiceResult] = await Promise.allSettled([
        canViewCourses ? courseService.getCourses({ page: 0, size: 100 }) : Promise.resolve(null),
        canViewRevenue ? paymentService.getAdminPayments(0, 100) : Promise.resolve(null),
        canViewRevenue ? paymentService.getAdminInvoices(0, 100) : Promise.resolve(null),
      ] as const);
      if (!active) return;

      const errors: string[] = [];
      if (courseResult.status === "fulfilled") {
        setCourses(courseResult.value?.content || []);
      } else {
        setCourses([]);
        errors.push(courseResult.reason instanceof Error ? courseResult.reason.message : "Không tải được khóa học.");
      }
      if (paymentResult.status === "fulfilled") {
        setPayments(paymentResult.value?.content || []);
      } else {
        setPayments([]);
        errors.push(paymentResult.reason instanceof Error ? paymentResult.reason.message : "Không tải được giao dịch.");
      }
      if (invoiceResult.status === "fulfilled") {
        setInvoices(invoiceResult.value?.content || []);
      } else {
        setInvoices([]);
        errors.push(invoiceResult.reason instanceof Error ? invoiceResult.reason.message : "Không tải được hóa đơn.");
      }
      setError(Array.from(new Set(errors)).join(" "));
      setLoading(false);
    };

    void loadDashboard();
    return () => { active = false; };
  }, [canViewCourses, canViewRevenue]);

  const courseById = useMemo(() => Object.fromEntries(courses.map((course) => [course.id, course.name])), [courses]);
  const publishedCourses = courses.filter((course) => course.status === "PUBLISHED").length;
  const paidPayments = payments.filter((payment) => payment.status === "PAID");
  const revenue = paidPayments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
  const recentPayments = [...payments]
    .sort((a, b) => getDateTimestamp(b.displayDate || b.createdAt || b.createdDate || b.paidAt) - getDateTimestamp(a.displayDate || a.createdAt || a.createdDate || a.paidAt))
    .slice(0, 5);

  return <div className="page-container">
    <div className="page-header" style={{ marginBottom: "32px" }}><div className="header-titles"><h1 className="text-headline-lg">Dashboard tổng quan</h1><p className="text-body-md text-on-surface-variant mt-2">Chỉ các số liệu thuộc phạm vi quyền của tài khoản mới được hiển thị.</p></div></div>
    {error && <div className="card p-4 mb-6 text-status-required">{error}</div>}
    <div className="metrics-grid mb-8">
      {canViewCourses && <div className="card p-6 metric-card"><div className="metric-header"><span className="text-label-md text-on-surface-variant">Khóa học đã xuất bản</span><div className="metric-icon bg-secondary-fixed text-secondary"><BookOpen size={20}/></div></div><div className="metric-value text-display mt-4">{loading ? "…" : publishedCourses}</div></div>}
      {canReviewCourses && <div className="card p-6 metric-card"><div className="metric-header"><span className="text-label-md text-on-surface-variant">Chờ duyệt</span><div className="metric-icon bg-primary-fixed text-primary"><Clock size={20}/></div></div><div className="metric-value text-display mt-4">{loading ? "…" : courses.filter((course) => course.status === "PENDING_REVIEW").length}</div></div>}
      {canViewRevenue && <><div className="card p-6 metric-card"><div className="metric-header"><span className="text-label-md text-on-surface-variant">Tổng giao dịch</span><div className="metric-icon bg-primary-fixed text-primary"><CreditCard size={20}/></div></div><div className="metric-value text-display mt-4">{loading ? "…" : payments.length}</div></div><div className="card p-6 metric-card"><div className="metric-header"><span className="text-label-md text-on-surface-variant">Doanh thu đã thanh toán</span><div className="metric-icon" style={{ backgroundColor: "#ffedd5", color: "#c2410c" }}><TrendingUp size={20}/></div></div><div className="metric-value text-display mt-4">{loading ? "…" : formatMoney(revenue)}</div></div><div className="card p-6 metric-card"><div className="metric-header"><span className="text-label-md text-on-surface-variant">Hóa đơn đã phát hành</span><div className="metric-icon bg-primary-fixed text-primary"><FileText size={20}/></div></div><div className="metric-value text-display mt-4">{loading ? "…" : invoices.length}</div></div></>}
    </div>
    <div className="dashboard-grid">
      {canViewRevenue && <div className="card p-6"><div className="flex justify-between items-center mb-6"><h3 className="text-headline-sm">Giao dịch gần đây</h3><Link href="/payments" className="btn btn-ghost text-primary">Xem tất cả <ChevronRight size={16}/></Link></div><div className="activity-list flex flex-col gap-4">{recentPayments.length === 0 && !loading ? <span className="text-body-sm text-outline">Chưa có giao dịch.</span> : recentPayments.map((payment) => <div key={payment.id} className="activity-item flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"><div><span className="text-label-md block">{courseById[payment.courseId] || payment.courseId}</span><span className="text-body-sm text-outline block mt-1">{payment.status} · {formatMoney(payment.amount)}</span></div><div className="flex items-center gap-2 text-body-sm text-on-surface-variant"><Clock size={14}/>{formatDateTime(payment.displayDate || payment.createdAt || payment.createdDate || payment.paidAt)}</div></div>)}</div></div>}
      {(canViewRevenue || canReviewCourses) && <div className="card p-6"><h3 className="text-headline-sm mb-6">Cần theo dõi</h3><div className="todo-list flex flex-col gap-4">{canViewRevenue && <div className="todo-item p-4 rounded bg-surface-container-low border border-border-subtle"><span className="text-label-md font-bold block mb-1">{payments.filter((payment) => payment.status === "PENDING").length} giao dịch đang chờ thanh toán</span><Link href="/payments" className="btn btn-secondary mt-3">Xem giao dịch</Link></div>}{canReviewCourses && <div className="todo-item p-4 rounded bg-surface-container-low border border-border-subtle"><span className="text-label-md font-bold block mb-1">{courses.filter((course) => course.status === "PENDING_REVIEW").length} khóa học chờ duyệt</span><Link href="/courses" className="btn btn-secondary mt-3">Xem khóa học</Link></div>}</div></div>}
      {!canViewCourses && !canViewRevenue && <div className="card p-6"><h3 className="text-headline-sm">Chưa có số liệu tổng quan phù hợp</h3><p className="text-body-md text-on-surface-variant mt-2">Các module khác vẫn được hiển thị trong menu theo permission đã cấp.</p></div>}
    </div>
  </div>;
}
