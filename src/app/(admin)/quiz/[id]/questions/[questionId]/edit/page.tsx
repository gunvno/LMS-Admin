"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { questionService } from "@/services/question.service";

type AnswerDraft = {
  id?: string;
  localId: string;
  content: string;
};

function createAnswerDraft(index: number): AnswerDraft {
  return {
    localId: `${Date.now()}-${index}`,
    content: "",
  };
}

export default function EditQuestionPage() {
  const params = useParams<{ id: string; questionId: string }>();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [score, setScore] = useState(1);
  const [answers, setAnswers] = useState<AnswerDraft[]>([]);
  const [deletedAnswerIds, setDeletedAnswerIds] = useState<string[]>([]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        const [question, answerPage] = await Promise.all([
          questionService.getQuestion(params.questionId),
          questionService.getAnswers(params.questionId),
        ]);
        const nextAnswers = [...(answerPage.content || [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
        setContent(question.content);
        setScore(question.score);
        setAnswers(nextAnswers.map((answer) => ({
          id: answer.id,
          localId: answer.id,
          content: answer.content,
        })));
        setCorrectIndex(Math.max(0, nextAnswers.findIndex((answer) => answer.correct)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được câu hỏi.");
      } finally {
        setLoading(false);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [params.questionId]);

  const updateAnswer = (index: number, nextContent: string) => {
    setAnswers((prev) => prev.map((answer, answerIndex) => answerIndex === index ? { ...answer, content: nextContent } : answer));
  };

  const addAnswer = () => {
    setAnswers((prev) => [...prev, createAnswerDraft(prev.length + 1)]);
  };

  const removeAnswer = (index: number) => {
    const removed = answers[index];
    if (removed?.id) setDeletedAnswerIds((prev) => [...prev, removed.id as string]);
    setAnswers((prev) => prev.filter((_, answerIndex) => answerIndex !== index));
    setCorrectIndex((prev) => {
      if (prev === index) return 0;
      if (prev > index) return prev - 1;
      return prev;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validAnswers = answers.filter((answer) => answer.content.trim());

    if (!content.trim()) {
      setError("Vui lòng nhập nội dung câu hỏi.");
      return;
    }
    if (validAnswers.length < 2) {
      setError("Cần ít nhất 2 đáp án.");
      return;
    }
    if (!answers[correctIndex]?.content.trim()) {
      setError("Vui lòng chọn đáp án đúng có nội dung.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await questionService.updateQuestion(params.questionId, params.id, {
        content: content.trim(),
        questionType: "SINGLE_CHOICE",
        score,
      });

      await Promise.all(deletedAnswerIds.map((answerId) => questionService.deleteAnswer(answerId)));

      await Promise.all(
        answers
          .map((answer, index) => ({ ...answer, content: answer.content.trim(), index }))
          .filter((answer) => answer.content)
          .map((answer) => {
            const payload = {
              content: answer.content,
              correct: answer.index === correctIndex,
              orderIndex: answer.index + 1,
            };
            if (answer.id) {
              return questionService.updateAnswer(answer.id, params.questionId, payload);
            }
            return questionService.createAnswer(params.questionId, payload);
          })
      );

      router.push(`/quiz/${params.id}/questions/${params.questionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được câu hỏi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="page-container" style={{ maxWidth: "800px" }}>
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <div className="header-titles flex-center gap-4">
          <Link href={`/quiz/${params.id}/questions/${params.questionId}`} className="icon-btn text-outline">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <span className="text-body-sm text-outline">Sửa câu hỏi</span>
            <h1 className="text-headline-lg mt-1">Cập nhật câu hỏi</h1>
          </div>
        </div>
      </div>

      <div className="card p-8">
        {loading && <div className="card p-4 mb-6">Đang tải câu hỏi...</div>}
        {error && <div className="card p-4 mb-6 text-status-required">{error}</div>}

        <div className="form-group mb-6">
          <label className="text-label-md">Nội dung câu hỏi <span className="text-status-required">*</span></label>
          <textarea className="form-input" rows={5} value={content} onChange={(event) => setContent(event.target.value)} required />
        </div>

        <div className="form-group mb-8">
          <div className="form-group">
            <label className="text-label-md">Điểm</label>
            <input type="number" className="form-input" min={0.1} step={0.1} value={score} onChange={(event) => setScore(Number(event.target.value))} />
          </div>
        </div>

        <div className="answers-section">
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-headline-sm">Đáp án</h3>
            <span className="text-body-sm text-outline">Chọn radio ở đáp án đúng.</span>
          </div>

          <div className="answers-list flex flex-col gap-4">
            {answers.map((answer, index) => (
              <div className="answer-item bg-surface-container-low p-3 rounded flex items-center gap-4" key={answer.localId}>
                <input type="radio" name="correct_answer" className="custom-radio" checked={correctIndex === index} onChange={() => setCorrectIndex(index)} />
                <input type="text" className="form-input flex-1" placeholder={`Đáp án ${index + 1}`} value={answer.content} onChange={(event) => updateAnswer(index, event.target.value)} />
                <button type="button" className="icon-btn text-status-required" onClick={() => removeAnswer(index)} disabled={answers.length <= 2}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <button className="btn btn-ghost text-primary mt-4" type="button" onClick={addAnswer}>
            <Plus size={16} className="mr-2" /> Thêm đáp án
          </button>
        </div>

        <div className="form-footer mt-8 border-t pt-6 flex justify-end gap-4">
          <Link href={`/quiz/${params.id}/questions/${params.questionId}`} className="btn btn-ghost">Hủy</Link>
          <button className="btn btn-primary" type="submit" disabled={submitting || loading}>
            {submitting ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </form>
  );
}
