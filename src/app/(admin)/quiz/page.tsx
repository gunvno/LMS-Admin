"use client";

import { useEffect, useMemo, useState } from "react";
import HasPermission from "@/components/HasPermission";
import Link from "next/link";
import CourseSelect from "@/components/forms/CourseSelect";
import { Plus, Search, ChevronDown, Archive, Settings, FileText, Trophy, MoreVertical, Check, Trash2 } from "lucide-react";
import { Course, courseService } from "@/services/course.service";
import { Quiz, quizService } from "@/services/quiz.service";
import "./quiz.css";

function statusClass(status?: string) {
  if (status === "ACTIVE") return "status-success-light";
  if (status === "INACTIVE") return "status-pending-gray";
  return "status-error-light";
}

export default function QuizManagementPage() {
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const [quizPage, coursePage] = await Promise.all([
          quizService.getQuizzes({ page: 0, size: 100 }),
          courseService.getCourses({ page: 0, size: 100 }),
        ]);
        const nextQuizzes = quizPage.content || [];
        setQuizzes(nextQuizzes);
        setCourses(coursePage.content || []);
        setSelectedId((prev) => prev || nextQuizzes[0]?.id || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được danh sách quiz.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const courseNameById = useMemo(() => {
    return courses.reduce<Record<string, string>>((acc, course) => {
      acc[course.id] = course.name;
      return acc;
    }, {});
  }, [courses]);

  const filteredQuizzes = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    return quizzes.filter((quiz) => {
      const matchKeyword = !term || [
        quiz.title,
        courseNameById[quiz.courseId],
      ].some((value) => value?.toLowerCase().includes(term));
      const matchCourse = courseFilter === "ALL" || quiz.courseId === courseFilter;
      return matchKeyword && matchCourse;
    });
  }, [quizzes, keyword, courseFilter, courseNameById]);

  const selectedQuiz = filteredQuizzes.find((quiz) => quiz.id === selectedId) || filteredQuizzes[0];

  const handleDelete = async (quiz: Quiz) => {
    if (!window.confirm(`Xóa quiz "${quiz.title}"?`)) return;

    try {
      setDeletingId(quiz.id);
      await quizService.deleteQuiz(quiz.id);
      setQuizzes((prev) => prev.filter((item) => item.id !== quiz.id));
      if (selectedId === quiz.id) setSelectedId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xóa được quiz.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-titles">
          <h1 className="text-headline-lg">Quản lý Quiz</h1>
          <p className="text-body-md text-on-surface-variant mt-2">Quản lý quiz, điều kiện hoàn thành và câu hỏi theo khóa học.</p>
        </div>
        <div className="header-actions">
          <HasPermission required="QUIZ_MANAGE">
            <Link href="/quiz/new" className="btn btn-primary action-btn">
              <Plus size={18} /> Tạo Quiz
            </Link>
          </HasPermission>
        </div>
      </div>

      <div className="top-controls p-2 mb-4">
        <div className="search-wrapper flex-1 card" style={{ maxWidth: '500px' }}>
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Tìm quiz theo tên hoặc khóa học..." className="form-input search-input" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        </div>
        <div className="flex-center gap-4">
          <div className="dropdown-wrapper card p-0">
            <CourseSelect value={courseFilter} onChange={setCourseFilter} includeAllOption allLabel="Tất cả khóa học" className="form-input dropdown-select text-body-sm" />
            <ChevronDown size={16} className="dropdown-icon" />
          </div>
        </div>
      </div>

      {error && <div className="card p-4 mb-4 text-status-required">{error}</div>}

      <div className="quiz-layout">
        <div className="quiz-list">
          <h3 className="text-headline-sm mb-4">Danh sách Quiz</h3>
          {loading && <div className="card p-4 text-body-md text-on-surface-variant">Đang tải quiz...</div>}
          {!loading && filteredQuizzes.length === 0 && <div className="card p-4 text-body-md text-on-surface-variant">Chưa có quiz phù hợp.</div>}

          {!loading && filteredQuizzes.map((quiz) => (
            <button type="button" className={`quiz-card ${selectedQuiz?.id === quiz.id ? "active" : ""}`} key={quiz.id} onClick={() => setSelectedId(quiz.id)}>
              <div className="quiz-card-header">
                <div className="flex-center gap-2">
                  <span className={`status-badge ${statusClass(quiz.status)}`}>{quiz.status || "ACTIVE"}</span>
                  {quiz.requiredToComplete && <span className="badge" style={{ backgroundColor: '#f97316', color: '#fff' }}>Bắt buộc</span>}
                </div>
                <MoreVertical size={16} />
              </div>
              <h4 className="text-headline-sm mt-3">{quiz.title}</h4>
              <p className="text-body-sm text-on-surface-variant mt-1">Khóa: {courseNameById[quiz.courseId] || quiz.courseId}</p>
              <div className="quiz-meta mt-4">
                <span className="meta-item"><FileText size={14} /> Lesson {quiz.lessonId?.slice(0, 8)}</span>
                <span className="meta-item"><Trophy size={14} /> Pass {quiz.passScore}%</span>
              </div>
            </button>
          ))}
        </div>

        <div className="quiz-details">
          {selectedQuiz ? (
            <>
              <div className="card details-header">
                <div className="details-title">
                  <h2 className="text-headline-md">{selectedQuiz.title}</h2>
                  <p className="text-body-sm text-on-surface-variant mt-2">Quản lý cài đặt quiz và câu hỏi. API câu hỏi sẽ nối ở bước tiếp theo.</p>
                </div>
                <div className="details-actions">
                  <button className="btn btn-secondary action-btn text-success border-success">
                    <Check size={16} /> {selectedQuiz.requiredToComplete ? "Bắt buộc" : "Luyện tập"}
                  </button>
                  <button className="btn btn-secondary action-btn text-outline">
                    <Archive size={16} /> {selectedQuiz.status || "ACTIVE"}
                  </button>
                  <button className="btn btn-secondary action-btn text-outline">
                    <Settings size={16} /> Pass {selectedQuiz.passScore}%
                  </button>
                  <HasPermission required="QUESTION_MANAGE">
                    <Link className="btn btn-primary action-btn" href={`/quiz/${selectedQuiz.id}/questions`}>
                      <Plus size={16} /> Quản lý câu hỏi
                    </Link>
                  </HasPermission>
                  <HasPermission required="QUIZ_MANAGE">
                    <button className="btn btn-secondary action-btn text-status-required" disabled={deletingId === selectedQuiz.id} onClick={() => handleDelete(selectedQuiz)}>
                      <Trash2 size={16} /> {deletingId === selectedQuiz.id ? "Đang xóa..." : "Xóa"}
                    </button>
                  </HasPermission>
                </div>
              </div>

              <div className="questions-section mt-6">
                <div className="flex-center justify-between mb-4">
                  <h3 className="text-headline-sm">Thông tin Quiz</h3>
                  <div className="text-label-sm text-outline">Max attempts: <strong>{selectedQuiz.maxAttempts}</strong></div>
                </div>
                <div className="card question-card">
                  <div className="detail-list">
                    <div className="detail-list-row"><span>ID</span><strong>{selectedQuiz.id}</strong></div>
                    <div className="detail-list-row"><span>Khóa học</span><strong>{courseNameById[selectedQuiz.courseId] || selectedQuiz.courseId}</strong></div>
                    <div className="detail-list-row"><span>Lesson ID</span><strong>{selectedQuiz.lessonId}</strong></div>
                    <div className="detail-list-row"><span>Điểm đạt</span><strong>{selectedQuiz.passScore}%</strong></div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="card p-6">Chọn một quiz để xem chi tiết.</div>
          )}
        </div>
      </div>
    </div>
  );
}
