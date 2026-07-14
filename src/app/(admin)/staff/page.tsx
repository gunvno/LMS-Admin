"use client";

import { MouseEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HasPermission from "@/components/HasPermission";
import ActionMenu from "@/components/ActionMenu";
import { useConfirmation } from "@/components/ConfirmationModal";
import Pagination from "@/components/Pagination";
import { authorService, StaffAccount } from "@/services/author.service";
import { Plus, Search, ChevronDown, UserCog, Lock, Key } from "lucide-react";
import "./staff-list.css";

function shouldIgnoreRowClick(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('a, button, summary, details, input, select, textarea, label'));
}

function initials(name?: string) {
  const source = name || "ST";
  return source.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export default function StaffPage() {
  const router = useRouter();
  const { confirm } = useConfirmation();
  const [staff, setStaff] = useState<StaffAccount[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  useEffect(() => {
    const loadStaff = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await authorService.getStaffAccounts();
        setStaff(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được danh sách nhân sự.");
      } finally {
        setLoading(false);
      }
    };

    loadStaff();
  }, []);

  const filteredStaff = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    if (!term) return staff;
    return staff.filter((item) =>
      [item.fullName, item.email, item.username, item.roleCode, item.userId].some((value) => value?.toLowerCase().includes(term))
    );
  }, [staff, keyword]);

  const handleRowClick = (event: MouseEvent<HTMLTableRowElement>, userId: string) => {
    if (shouldIgnoreRowClick(event.target)) return;
    router.push(`/staff/${userId}`);
  };

  const handleLock = async (account: StaffAccount) => {
    const accepted = await confirm({
      title: "Khóa tài khoản?",
      description: `“${account.fullName || account.email}” sẽ không thể đăng nhập cho đến khi tài khoản được mở khóa.`,
      confirmLabel: "Khóa tài khoản",
    });
    if (!accepted) return;
    try {
      setUpdatingId(account.userId);
      await authorService.updateStaffStatus(account.userId, "LOCKED");
      setStaff((prev) => prev.map((item) => item.userId === account.userId ? { ...item } : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không cập nhật được trạng thái tài khoản.");
    } finally {
      setUpdatingId("");
    }
  };

  const handleResetPassword = async (account: StaffAccount) => {
    const password = window.prompt(`Nhập mật khẩu mới cho ${account.fullName || account.email}`, "123456");
    if (!password) return;
    try {
      setUpdatingId(account.userId);
      await authorService.resetStaffPassword(account.userId, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không reset được mật khẩu.");
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-titles">
          <h1 className="text-headline-lg">Quản lý Nhân sự & Quyền</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            Danh sách staff đang dùng <strong>userId</strong> làm mã định danh.
          </p>
        </div>
        <div className="header-actions">
          <HasPermission required="STAFF_CREATE">
            <Link href="/staff/new" className="btn btn-primary action-btn">
              <Plus size={18} /> Thêm Nhân viên
            </Link>
          </HasPermission>
        </div>
      </div>

      <div className="top-controls card p-2">
        <div className="search-wrapper flex-1">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email hoặc userId..."
            className="form-input search-input"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </div>
        <div className="dropdown-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="text-label-sm text-outline">LỌC:</span>
          <div style={{ position: 'relative' }}>
            <select className="form-input dropdown-select text-body-sm" defaultValue="ALL">
              <option value="ALL">Tất cả Vai trò</option>
              <option value="INSTRUCTOR">Giảng viên</option>
            </select>
            <ChevronDown size={16} className="dropdown-icon" />
          </div>
        </div>
      </div>

      {error && <div className="card p-6 mb-4" style={{ color: "var(--on-error-container)", backgroundColor: "var(--error-container)" }}>{error}</div>}

      <div className="card table-card mt-4">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '38%' }}>Nhân viên</th>
                <th style={{ width: '22%' }}>User ID</th>
                <th style={{ width: '16%' }}>Vai trò</th>
                <th style={{ width: '14%' }}>Quyền</th>
                <th className="actions-col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="text-body-md text-on-surface-variant">Đang tải nhân sự...</td>
                </tr>
              )}

              {!loading && filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-body-md text-on-surface-variant">Chưa có nhân sự phù hợp.</td>
                </tr>
              )}

              {!loading && filteredStaff.map((account) => (
                <tr key={account.userId} className="clickable-row" onClick={(event) => handleRowClick(event, account.userId)}>
                  <td>
                    <div className="cell-flex">
                      <div className="student-avatar placeholder">{initials(account.fullName || account.username)}</div>
                      <div className="student-info">
                        <span className="text-label-md">{account.fullName || account.username}</span>
                        <span className="text-body-sm text-outline">{account.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="text-body-sm text-on-surface-variant">{account.userId}</td>
                  <td><span className="role-badge role-instructor">{account.roleCode || "INSTRUCTOR"}</span></td>
                  <td><span className="status-badge status-success-light">{account.permissionCodes?.length || 0} quyền</span></td>
                  <td className="actions-cell">
                    <ActionMenu
                      items={[
                        { label: 'Chi tiết quyền', href: `/staff/${account.userId}`, icon: <UserCog size={16} /> },
                        { label: updatingId === account.userId ? 'Đang khóa...' : 'Khóa tài khoản', icon: <Lock size={16} />, disabled: updatingId === account.userId, onClick: () => handleLock(account) },
                        { label: 'Reset mật khẩu', icon: <Key size={16} />, disabled: updatingId === account.userId, onClick: () => handleResetPassword(account) },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination summary={`Hiển thị ${filteredStaff.length} trong số ${staff.length} nhân viên`} />
      </div>
    </div>
  );
}
