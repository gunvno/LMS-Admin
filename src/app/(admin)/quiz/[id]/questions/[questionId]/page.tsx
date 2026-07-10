"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, Edit, Trash2 } from "lucide-react";
import { Answer, Question, questionService } from "@/services/question.service";
import "../new/new-question.css";

function sortByOrder<T extends { orderIndex: number }>(items: T[]) {
  return [...items].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
}

export default function QuestionDetailPage() {
  const params = useParams<{ id: string; questionId: string }>();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        const [nextQuestion, answerPage] = await Promise.all([
          questionService.getQuestion(params.questionId),
          questionService.getAnswers(params.questionId),
        ]);
        setQuestion(nextQuestion);
        setAnswers(sortByOrder(answerPage.content || []));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được câu hỏi.");
      } finally {
        setLoading(false);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [params.questionId]);

  const deleteQuestion = async () => {
    if (!question || !window.confirm("Xóa câu hỏi này?")) return;

    try {
      setDeleting(true);
      await questionService.deleteQuestion(question.id);
      window.location.href = `/quiz/${params.id}/questions`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xóa được câu hỏi.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: "900px" }}>
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <div className="header-titles flex-center gap-4">
          <Link href={`/quiz/${params.id}/questions`} className="icon-btn text-outline">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <span className="text-body-sm text-outline">Chi tiết câu hỏi</span>
            <h1 className="text-headline-lg mt-1">Câu hỏi quiz</h1>
          </div>
        </div>
        {question && (
          <div className="header-actions">
            <Link href={`/quiz/${params.id}/questions/${question.id}/edit`} className="btn btn-primary action-btn">
              <Edit size={18} /> Sửa câu hỏi
            </Link>
            <button className="btn btn-secondary action-btn text-status-required" onClick={deleteQuestion} disabled={deleting}>
              <Trash2 size={18} /> {deleting ? "Đang xóa..." : "Xóa"}
            </button>
          </div>
        )}
      </div>

      {loading && <div className="card p-6">Đang tải câu hỏi...</div>}
      {error && <div className="card p-4 mb-4 text-status-required">{error}</div>}
      {!loading && question && (
        <div className="card question-card">
          <div className="question-header">
            <div className="question-number">{question.orderIndex}</div>
            <div className="question-content">
              <p className="text-body-md font-medium">{question.content}</p>
              <div className="question-badges mt-3">
                <span className="badge bg-secondary-fixed text-on-secondary-fixed">{question.questionType}</span>
                <span className="badge badge-neutral bg-transparent">{question.score} điểm</span>
                <span className="badge badge-neutral bg-transparent">ID {question.id}</span>
              </div>
            </div>
          </div>

          <div className="options-grid mt-4">
            {answers.map((answer) => (
              <div className={`option-item ${answer.correct ? "correct" : ""}`} key={answer.id}>
                {answer.correct ? <CheckCircle2 size={16} className="text-success" /> : <Circle size={16} className="text-outline-variant" />}
                <span>{answer.content}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
