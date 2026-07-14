"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, Edit, Eye, Plus, Trash2 } from "lucide-react";
import { Answer, Question, questionService } from "@/services/question.service";
import { Quiz, quizService } from "@/services/quiz.service";
import { useConfirmation } from "@/components/ConfirmationModal";

function sortByOrder<T extends { orderIndex: number }>(items: T[]) {
  return [...items].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
}

export default function QuizQuestionsPage() {
  const params = useParams<{ id: string }>();
  const { confirm } = useConfirmation();
  const searchParams = useSearchParams();
  const refreshKey = searchParams.get("refresh");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answersByQuestionId, setAnswersByQuestionId] = useState<Record<string, Answer[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const totalAnswers = useMemo(() => {
    return Object.values(answersByQuestionId).reduce((total, answers) => total + answers.length, 0);
  }, [answersByQuestionId]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      if (refreshKey) setAnswersByQuestionId({});
      const [nextQuiz, questionPage] = await Promise.all([
        quizService.getQuiz(params.id),
        questionService.getQuestions(params.id),
      ]);
      const nextQuestions = sortByOrder(questionPage.content || []);
      setQuiz(nextQuiz);
      setQuestions(nextQuestions);

      const answerEntries = await Promise.all(
        nextQuestions.map(async (question) => {
          const answerPage = await questionService.getAnswers(question.id);
          return [question.id, sortByOrder(answerPage.content || [])] as const;
        })
      );
      setAnswersByQuestionId(Object.fromEntries(answerEntries));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách câu hỏi.");
    } finally {
      setLoading(false);
    }
  }, [params.id, refreshKey]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  const handleDeleteQuestion = async (question: Question) => {
    const accepted = await confirm({
      title: "Xóa câu hỏi?",
      description: "Câu hỏi và các đáp án liên quan sẽ bị xóa. Hành động này không thể hoàn tác.",
      confirmLabel: "Xóa câu hỏi",
    });
    if (!accepted) return;

    try {
      setDeletingId(question.id);
      await questionService.deleteQuestion(question.id);
      setQuestions((prev) => prev.filter((item) => item.id !== question.id));
      setAnswersByQuestionId((prev) => {
        const next = { ...prev };
        delete next[question.id];
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xóa được câu hỏi.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: "1000px" }}>
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <div className="header-titles flex-center gap-4">
          <Link href="/quiz" className="icon-btn text-outline">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <span className="text-body-sm text-outline">Quản lý câu hỏi</span>
            <h1 className="text-headline-lg mt-1">{quiz?.title || "Quiz"}</h1>
            <p className="text-body-md text-on-surface-variant mt-1">
              {questions.length} câu hỏi - {totalAnswers} đáp án
            </p>
          </div>
        </div>
        <div className="header-actions">
          <Link href={`/quiz/${params.id}/questions/new`} className="btn btn-primary action-btn">
            <Plus size={18} /> Thêm câu hỏi
          </Link>
        </div>
      </div>

      {error && <div className="card p-4 mb-4 text-status-required">{error}</div>}
      {loading && <div className="card p-6">Đang tải câu hỏi...</div>}

      {!loading && questions.length === 0 && (
        <div className="card p-8">
          <h2 className="text-headline-sm">Quiz này chưa có câu hỏi</h2>
          <p className="text-body-md text-on-surface-variant mt-2">Bấm “Thêm câu hỏi” để tạo câu hỏi đầu tiên.</p>
        </div>
      )}

      {!loading && questions.length > 0 && (
        <div className="questions-section">
          {questions.map((question, questionIndex) => {
            const answers = answersByQuestionId[question.id] || [];
            return (
              <div className="card question-card mb-4" key={question.id}>
                <div className="question-header">
                  <div className="question-number">{questionIndex + 1}</div>
                  <div className="question-content">
                    <p className="text-body-md font-medium">{question.content}</p>
                    <div className="question-badges mt-3">
                      <span className="badge bg-secondary-fixed text-on-secondary-fixed">{question.questionType}</span>
                      <span className="badge badge-neutral bg-transparent">{question.score} điểm</span>
                      <span className="badge badge-neutral bg-transparent">Thứ tự {question.orderIndex}</span>
                    </div>
                  </div>
                  <div className="flex-center gap-2">
                    <Link className="icon-btn text-outline" href={`/quiz/${params.id}/questions/${question.id}`} title="Xem chi tiết">
                      <Eye size={18} />
                    </Link>
                    <Link className="icon-btn text-primary" href={`/quiz/${params.id}/questions/${question.id}/edit`} title="Sửa câu hỏi">
                      <Edit size={18} />
                    </Link>
                    <button
                      type="button"
                      className="icon-btn text-status-required"
                      disabled={deletingId === question.id}
                      onClick={() => handleDeleteQuestion(question)}
                      title="Xóa câu hỏi"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="options-grid mt-4">
                  {answers.map((answer) => (
                    <div className={`option-item ${answer.correct ? "correct" : ""}`} key={answer.id}>
                      {answer.correct ? <CheckCircle2 size={16} className="text-success" /> : <Circle size={16} className="text-outline-variant" />}
                      <span>{answer.content}</span>
                    </div>
                  ))}
                  {answers.length === 0 && (
                    <div className="option-item">
                      <Circle size={16} className="text-outline-variant" />
                      <span>Chưa có đáp án.</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
