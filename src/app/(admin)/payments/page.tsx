"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CreditCard, FileText, RefreshCw, Search } from "lucide-react";
import { paymentService, Payment, Invoice } from "@/services/payment.service";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateTime } from "@/lib/date";
import "./payments.css";

type Tab = "payments" | "invoices";

function formatMoney(value: number) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}

function statusClass(status: string) {
  if (status === "PAID") return "status-success-light";
  if (status === "PENDING") return "status-pending-gray";
  return "status-error-light";
}

export default function PaymentsPage() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>("payments");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      setError("");
      const [paymentPage, invoicePage] = await Promise.all([
        paymentService.getAdminPayments(),
        paymentService.getAdminInvoices(),
      ]);
      setPayments(paymentPage.content || []);
      setInvoices(invoicePage.content || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu thanh toán.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [isAdmin, loadData]);

  const filteredPayments = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    return payments.filter((item) => !term || [item.userId, item.courseId, item.providerOrderCode?.toString(), item.invoiceCode, item.status].some((value) => value?.toLowerCase().includes(term)));
  }, [payments, keyword]);

  const filteredInvoices = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    return invoices.filter((item) => !term || [item.userId, item.courseId, item.invoiceCode, item.providerTransactionId, item.status].some((value) => value?.toLowerCase().includes(term)));
  }, [invoices, keyword]);

  if (!isAdmin) {
    return <div className="page-container"><div className="card p-6">Bạn không có quyền xem giao dịch, hóa đơn hoặc doanh thu toàn hệ thống.</div></div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-titles">
          <h1 className="text-headline-lg">Thanh toán & hóa đơn</h1>
          <p className="text-body-md text-on-surface-variant mt-2">Theo dõi toàn bộ giao dịch và hóa đơn của học viên.</p>
        </div>
        <button className="btn btn-secondary action-btn" onClick={loadData} disabled={loading}><RefreshCw size={18} /> Làm mới</button>
      </div>

      <div className="stats-grid payment-stats">
        <div className="card stat-card"><CreditCard size={20} /><span>Giao dịch</span><strong>{payments.length}</strong></div>
        <div className="card stat-card"><FileText size={20} /><span>Hóa đơn</span><strong>{invoices.length}</strong></div>
        <div className="card stat-card"><span>Đã thanh toán</span><strong>{payments.filter((item) => item.status === "PAID").length}</strong></div>
        <div className="card stat-card"><span>Doanh thu</span><strong>{formatMoney(payments.filter((item) => item.status === "PAID").reduce((sum, item) => sum + Number(item.amount || 0), 0))}</strong></div>
      </div>

      <div className="top-controls card p-2 payment-toolbar">
        <div className="search-wrapper flex-1"><Search size={18} className="search-icon" /><input className="form-input search-input" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tìm user, course, mã giao dịch, hóa đơn..." /></div>
        <div className="tabs"><button className={`tab-pill ${tab === "payments" ? "active" : ""}`} onClick={() => setTab("payments")}>Giao dịch ({filteredPayments.length})</button><button className={`tab-pill ${tab === "invoices" ? "active" : ""}`} onClick={() => setTab("invoices")}>Hóa đơn ({filteredInvoices.length})</button></div>
      </div>

      {error && <div className="card p-4 mt-4 text-status-required">{error}</div>}
      <div className="card table-card mt-4">
        <div className="table-responsive">
          {loading ? <div className="p-4">Đang tải dữ liệu thanh toán...</div> : tab === "payments" ? (
            <table className="data-table"><thead><tr><th>User ID</th><th>Course ID</th><th>Mã PayOS</th><th>Số tiền</th><th>Provider</th><th>Trạng thái</th><th>Ngày tạo</th></tr></thead><tbody>{filteredPayments.length === 0 ? <tr><td colSpan={7}>Không có giao dịch phù hợp.</td></tr> : filteredPayments.map((item) => <tr key={item.id}><td>{item.userId}</td><td>{item.courseId}</td><td>{item.providerOrderCode || "-"}<small>{item.invoiceCode || "Chưa có hóa đơn"}</small></td><td>{formatMoney(item.amount)}</td><td>{item.provider}</td><td><span className={`status-badge ${statusClass(item.status)}`}>{item.status}</span></td><td>{formatDateTime(item.createdDate || item.paidAt)}</td></tr>)}</tbody></table>
          ) : (
            <table className="data-table"><thead><tr><th>Mã hóa đơn</th><th>User ID</th><th>Course ID</th><th>Số tiền</th><th>Provider</th><th>Trạng thái</th><th>Ngày phát hành</th></tr></thead><tbody>{filteredInvoices.length === 0 ? <tr><td colSpan={7}>Chưa có hóa đơn.</td></tr> : filteredInvoices.map((item) => <tr key={item.id}><td><strong>{item.invoiceCode}</strong><small>Payment: {item.paymentId}</small></td><td>{item.userId}</td><td>{item.courseId}</td><td>{formatMoney(item.amount)}</td><td>{item.provider}</td><td><span className={`status-badge ${statusClass(item.status)}`}>{item.status}</span></td><td>{formatDateTime(item.issuedAt)}</td></tr>)}</tbody></table>
          )}
        </div>
        <div className="table-footer"><span className="text-body-sm text-on-surface-variant">Dữ liệu lấy trực tiếp từ billing-service.</span></div>
      </div>
    </div>
  );
}
