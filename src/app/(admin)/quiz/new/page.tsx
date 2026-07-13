"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import HasPermission from "@/components/HasPermission";
import CourseSelect from "@/components/forms/CourseSelect";
import { Lesson, lessonService } from "@/services/lesson.service";
import { CreateQuizPayload, QuizStatus, quizService } from "@/services/quiz.service";

export default function NewQuizPage() {
  const router = useRouter();
  const [courseId, setCourseId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [title, setTitle] = useState("");
  const [passScore, setPassScore] = useState(70);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [requiredToComplete, setRequiredToComplete] = useState(true);
  const [status, setStatus] = useState<QuizStatus>("ACTIVE");
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!courseId) return;

    const loadLessons = async () => {
      try {
        setLoadingLessons(true);
        const page = await lessonService.getLessonsByCourse(courseId, { page: 0, size: 100, sort: "orderIndex,asc" });
        setLessons(page.content || []);
        setLessonId("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được bài học của khóa.");
      } finally {
        setLoadingLessons(false);
      }
    };

    loadLessons();
  }, [courseId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!courseId || !lessonId || !title.trim()) {
      setError("Vui lòng nhập tên quiz, chọn khóa học và bài học.");
      return;
    }

    const payload: CreateQuizPayload = {
      courseId,
      lessonId,
      title: title.trim(),
      passScore,
      maxAttempts,
      requiredToComplete,
      status,
    };

    try {
      setSubmitting(true);
      setError("");
      await quizService.createQuiz(payload);
      router.replace("/quiz");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="page-container" style={{ maxWidth: '800px' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div className="header-titles flex-center gap-4">
          <Link href="/quiz" className="icon-btn text-outline"><ArrowLeft size={24} /></Link>
          <div>
            <h1 className="text-headline-lg">Tạo Quiz Mới</h1>
            <p className="text-body-md text-on-surface-variant mt-1">Thiết lập bài kiểm tra, bài tập trắc nghiệm cho khóa học.</p>
          </div>
        </div>
      </div>

      <div className="card p-8">
        {error && <div className="card p-4 mb-6 text-body-md text-status-required">{error}</div>}

        <div className="form-group mb-6">
          <label className="text-label-md">Tên bài Quiz <span className="text-status-required">*</span></label>
          <input type="text" className="form-input" placeholder="Ví dụ: Kiểm tra cuối module..." value={title} onChange={(event) => setTitle(event.target.value)} required />
        </div>

        <div className="form-group mb-6">
          <label className="text-label-md">Khóa học áp dụng <span className="text-status-required">*</span></label>
          <CourseSelect
            value={courseId}
            onChange={(nextCourseId) => {
              setCourseId(nextCourseId);
              setLessonId("");
              setLessons([]);
            }}
            required
          />
        </div>

        <div className="form-group mb-6">
          <label className="text-label-md">Bài học áp dụng <span className="text-status-required">*</span></label>
          <select className="form-input" value={lessonId} onChange={(event) => setLessonId(event.target.value)} required disabled={!courseId || loadingLessons}>
            <option value="">{loadingLessons ? "Đang tải bài học..." : "Chọn bài học..."}</option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
            ))}
          </select>
        </div>

        <div className="form-grid-2 mb-6" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="form-group">
            <label className="text-label-md">Số lần làm tối đa</label>
            <input type="number" className="form-input" min={1} value={maxAttempts} onChange={(event) => setMaxAttempts(Number(event.target.value))} />
          </div>
          <div className="form-group">
            <label className="text-label-md">Điểm đạt (%)</label>
            <input type="number" className="form-input" min={0} max={100} value={passScore} onChange={(event) => setPassScore(Number(event.target.value))} />
          </div>
        </div>

        <div className="form-grid-2 mb-8" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="form-group">
            <label className="text-label-md block mb-2">Loại hình thi</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="quiz_type" className="custom-radio" checked={requiredToComplete} onChange={() => setRequiredToComplete(true)} />
                <span>Bắt buộc</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="quiz_type" className="custom-radio" checked={!requiredToComplete} onChange={() => setRequiredToComplete(false)} />
                <span>Luyện tập</span>
              </label>
            </div>
          </div>
          <div className="form-group">
            <label className="text-label-md">Trạng thái</label>
            <select className="form-input" value={status} onChange={(event) => setStatus(event.target.value as QuizStatus)}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        <div className="form-footer border-t pt-6 flex justify-end gap-4">
          <Link href="/quiz" className="btn btn-ghost">Hủy</Link>
          <HasPermission required="QUIZ_MANAGE">
            <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? "Đang lưu..." : "Lưu Quiz"}</button>
          </HasPermission>
        </div>
      </div>
    </form>
  );
}
