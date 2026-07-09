"use client";

import "../../detail.css";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, FileText, PlayCircle, BookOpen, Layers3, Clock } from "lucide-react";
import { Course, courseService } from "@/services/course.service";
import { Lesson, lessonService } from "@/services/lesson.service";

function statusClass(status?: string) {
  if (status === "ACTIVE") return "status-badge status-success-light";
  if (status === "DRAFT") return "status-badge status-pending-gray";
  return "status-badge status-error-light";
}

export default function LessonDetailPage() {
  const params = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadLesson = async () => {
      try {
        setLoading(true);
        setError("");
        const nextLesson = await lessonService.getLesson(params.id);
        setLesson(nextLesson);
        if (nextLesson.courseId) {
          const nextCourse = await courseService.getCourse(nextLesson.courseId);
          setCourse(nextCourse);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được bài học.");
      } finally {
        setLoading(false);
      }
    };

    loadLesson();
  }, [params.id]);

  return (
    <div className="page-container detail-page">
      <div className="detail-toolbar">
        <Link href="/lessons" className="btn btn-ghost"><ArrowLeft size={18} /> Quay lại</Link>
        {lesson && <Link href={`/lessons/${params.id}/edit`} className="btn btn-primary"><Edit size={18} /> Sửa bài học</Link>}
      </div>

      {loading && <div className="card p-6">Đang tải bài học...</div>}
      {!loading && error && <div className="card p-6">{error}</div>}
      {!loading && !error && lesson && (
        <>
          <section className="detail-hero-card">
            <div className="detail-avatar">{lesson.videoUrl ? <PlayCircle size={34} /> : <FileText size={34} />}</div>
            <div className="detail-hero-copy">
              <div className="detail-kicker">Bài học</div>
              <h1>{lesson.title}</h1>
              <p>{lesson.code || "Chưa có mã bài học"}</p>
              <div className="detail-chip-row">
                <span className={statusClass(lesson.status)}>{lesson.status}</span>
                <span className="detail-chip">{lesson.videoUrl ? "Video Lesson" : "Text Lesson"}</span>
              </div>
            </div>
          </section>

          <section className="detail-panel">
            <div className="section-heading">
              <h2>Thông tin bài học</h2>
              <p>Chi tiết bài học trong course hiện tại.</p>
            </div>
            <div className="detail-list">
              <div className="detail-list-row"><span>ID</span><strong>#{lesson.id}</strong></div>
              <div className="detail-list-row"><span><BookOpen size={16} /> Khóa học</span><strong>{course?.name || lesson.courseId}</strong></div>
              <div className="detail-list-row"><span><Layers3 size={16} /> Thứ tự</span><strong>{lesson.orderIndex ?? "-"}</strong></div>
              <div className="detail-list-row"><span><Clock size={16} /> Thời lượng</span><strong>{lesson.durationMinutes ?? 0} phút</strong></div>
              <div className="detail-list-row"><span>Video URL</span><strong>{lesson.videoUrl || "-"}</strong></div>
              <div className="detail-list-row"><span>Trạng thái</span><strong>{lesson.status}</strong></div>
            </div>
          </section>

          <section className="detail-panel">
            <div className="section-heading">
              <h2>Nội dung</h2>
              <p>Nội dung văn bản lưu trong bài học.</p>
            </div>
            <p className="text-body-md text-on-surface-variant">{lesson.content || "Chưa có nội dung."}</p>
          </section>
        </>
      )}
    </div>
  );
}
