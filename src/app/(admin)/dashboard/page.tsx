import { Users, BookOpen, GraduationCap, TrendingUp, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import "./dashboard.css";

export default function DashboardPage() {
  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '32px' }}>
        <div className="header-titles">
          <h1 className="text-headline-lg">Dashboard Tổng Quan</h1>
          <p className="text-body-md text-on-surface-variant mt-2">
            Chào mừng trở lại! Dưới đây là tóm tắt hoạt động hôm nay.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="metrics-grid mb-8">
        <div className="card p-6 metric-card">
          <div className="metric-header">
            <span className="text-label-md text-on-surface-variant">Tổng Học Viên</span>
            <div className="metric-icon bg-primary-fixed text-primary">
              <Users size={20} />
            </div>
          </div>
          <div className="metric-value text-display mt-4">12,450</div>
          <div className="metric-trend text-success mt-2">
            <TrendingUp size={16} /> <span className="text-body-sm">+12% so với tháng trước</span>
          </div>
        </div>

        <div className="card p-6 metric-card">
          <div className="metric-header">
            <span className="text-label-md text-on-surface-variant">Khóa Học Active</span>
            <div className="metric-icon bg-secondary-fixed text-secondary">
              <BookOpen size={20} />
            </div>
          </div>
          <div className="metric-value text-display mt-4">48</div>
          <div className="metric-trend text-success mt-2">
            <TrendingUp size={16} /> <span className="text-body-sm">+3 khóa mới</span>
          </div>
        </div>

        <div className="card p-6 metric-card">
          <div className="metric-header">
            <span className="text-label-md text-on-surface-variant">Chứng Chỉ Cấp Phát</span>
            <div className="metric-icon" style={{ backgroundColor: '#ffedd5', color: '#c2410c' }}>
              <GraduationCap size={20} />
            </div>
          </div>
          <div className="metric-value text-display mt-4">3,820</div>
          <div className="metric-trend text-success mt-2">
            <TrendingUp size={16} /> <span className="text-body-sm">+150 tuần này</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Recent Enrollments */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-headline-sm">Ghi Danh Mới Gần Đây</h3>
            <Link href="/enrollment" className="btn btn-ghost text-primary">
              Xem tất cả <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="activity-list flex flex-col gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="activity-item flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="student-avatar placeholder">HV</div>
                  <div>
                    <span className="text-label-md block">Học viên #{1000 + i}</span>
                    <span className="text-body-sm text-outline block mt-1">Vừa đăng ký: React Mastery</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                  <Clock size={14} /> 2 giờ trước
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Alerts / To-do */}
        <div className="card p-6">
          <h3 className="text-headline-sm mb-6">Cần Xử Lý</h3>
          <div className="todo-list flex flex-col gap-4">
            <div className="todo-item p-4 rounded bg-error-container text-on-error-container border border-error-container">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-label-md font-bold block mb-1">12 Yêu cầu cấp chứng chỉ</span>
                  <span className="text-body-sm block">Đang chờ xét duyệt bài tập cuối khóa.</span>
                </div>
                <Link href="/certificates" className="btn btn-secondary bg-white text-error">Xử lý ngay</Link>
              </div>
            </div>

            <div className="todo-item p-4 rounded bg-surface-container-low border border-border-subtle">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-label-md font-bold block mb-1">3 Khóa học nháp</span>
                  <span className="text-body-sm text-outline block">Cần bổ sung bài giảng trước khi Publish.</span>
                </div>
                <Link href="/courses" className="btn btn-secondary">Xem chi tiết</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
