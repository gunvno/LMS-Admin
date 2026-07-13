"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import CourseSelect from "@/components/forms/CourseSelect";
import LessonMediaFields from "@/components/forms/LessonMediaFields";
import { CreateLessonPayload, LessonStatus, lessonService } from "@/services/lesson.service";
import "../[id]/edit/edit-lesson.css";

export default function NewLessonPage() {
  const router = useRouter();
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [orderIndex, setOrderIndex] = useState(1);
  const [status, setStatus] = useState<LessonStatus>("ACTIVE");
  const [content, setContent] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [createdLessonId, setCreatedLessonId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!courseId || !title.trim()) {
      setError("Vui lòng chọn khóa học và nhập tên bài học.");
      return;
    }
    if (videoFile && videoFile.size > 200 * 1024 * 1024) {
      setError("Video không được lớn hơn 200 MB.");
      return;
    }

    const payload: CreateLessonPayload = {
      courseId,
      title: title.trim(),
      code: code.trim() || undefined,
      content: content.trim() || undefined,
      videoUrl: videoFile ? undefined : videoUrl.trim() || undefined,
      orderIndex,
      durationMinutes,
      status,
    };

    try {
      setSubmitting(true);
      setError("");
      let lesson = createdLessonId
        ? await lessonService.updateLesson(createdLessonId, payload)
        : await lessonService.createLesson(payload);
      if (!createdLessonId) setCreatedLessonId(lesson.id);

      if (videoFile) {
        const videoResource = await lessonService.uploadLessonResource(lesson.id, videoFile, videoFile.name);
        const uploadedVideoUrl = `/course/api/v1/lesson-resources/${videoResource.id}/view`;
        lesson = await lessonService.updateLesson(lesson.id, { ...payload, videoUrl: uploadedVideoUrl });
        setVideoUrl(uploadedVideoUrl);
        setVideoFile(null);
      }

      for (const documentFile of documentFiles) {
        await lessonService.uploadLessonResource(lesson.id, documentFile, documentFile.name);
        setDocumentFiles((current) => current.filter((file) => file !== documentFile));
      }
      router.replace("/lessons");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được bài học.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="page-container" style={{ maxWidth: '1100px' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div className="header-titles flex-center gap-4">
          <Link href="/lessons" className="icon-btn text-outline"><ArrowLeft size={24} /></Link>
          <div>
            <h1 className="text-headline-lg">Tạo Bài Học Mới</h1>
            <p className="text-body-md text-on-surface-variant mt-1">Thêm nội dung bài học, video và tài liệu đính kèm.</p>
          </div>
        </div>
        <div className="header-actions">
          <Link href="/lessons" className="btn btn-ghost">Hủy</Link>
          <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? "Đang lưu..." : "Lưu Bài Học"}</button>
        </div>
      </div>

      {error && <div className="card p-4 mb-4 text-body-md text-status-required">{error}</div>}

      <div className="lesson-form-grid">
        <div className="form-left-col">
          <div className="card p-6 mb-6">
            <h3 className="text-headline-sm mb-4">Thông tin cơ bản</h3>
            <div className="form-group mb-4">
              <label className="text-label-md">Tên bài học <span className="text-status-required">*</span></label>
              <input type="text" className="form-input" placeholder="Nhập tên bài học..." value={title} onChange={(event) => setTitle(event.target.value)} required />
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="text-label-md">Khóa học <span className="text-status-required">*</span></label>
                <CourseSelect value={courseId} onChange={setCourseId} required />
              </div>
              <div className="form-group">
                <label className="text-label-md">Mã bài học</label>
                <input type="text" className="form-input" placeholder="LESSON_001" value={code} onChange={(event) => setCode(event.target.value)} />
              </div>
            </div>
            <div className="form-grid-2 mt-4">
              <div className="form-group">
                <label className="text-label-md">Thứ tự</label>
                <input type="number" className="form-input" min={1} value={orderIndex} onChange={(event) => setOrderIndex(Number(event.target.value))} />
              </div>
              <div className="form-group">
                <label className="text-label-md">Thời lượng (phút)</label>
                <input type="number" className="form-input" min={0} value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} />
              </div>
            </div>
            <div className="form-group mt-4">
              <label className="text-label-md">Video URL</label>
              <input type="url" className="form-input" placeholder="https://example.com/video.mp4" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} />
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-headline-sm mb-4">Nội dung chi tiết</h3>
            <div className="editor-container border rounded">
              <div className="editor-toolbar border-b p-2 flex gap-2 bg-surface-container-lowest">
                <button className="editor-btn font-bold" type="button">B</button>
                <button className="editor-btn italic" type="button">I</button>
                <button className="editor-btn underline" type="button">U</button>
                <div className="divider"></div>
                <button className="editor-btn" type="button">List</button>
                <button className="editor-btn" type="button">Code</button>
              </div>
              <textarea className="editor-textarea p-4" rows={12} placeholder="Nhập nội dung văn bản cho bài học tại đây..." value={content} onChange={(event) => setContent(event.target.value)} />
            </div>
          </div>
        </div>

        <div className="form-right-col">
          <LessonMediaFields
            videoFile={videoFile}
            documentFiles={documentFiles}
            disabled={submitting}
            onVideoChange={setVideoFile}
            onDocumentsChange={setDocumentFiles}
          />

          <div className="card p-6">
            <h3 className="text-headline-sm mb-4">Cài đặt</h3>
            <div className="form-group">
              <label className="text-label-md">Trạng thái</label>
              <select className="form-input" value={status} onChange={(event) => setStatus(event.target.value as LessonStatus)}>
                <option value="ACTIVE">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
