"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import CourseSelect from "@/components/forms/CourseSelect";
import LessonMediaFields from "@/components/forms/LessonMediaFields";
import { useConfirmation } from "@/components/ConfirmationModal";
import {
  CreateLessonPayload,
  LessonResource,
  LessonStatus,
  lessonService,
} from "@/services/lesson.service";
import "./edit-lesson.css";

export default function EditLessonPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { confirm } = useConfirmation();
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [orderIndex, setOrderIndex] = useState(1);
  const [status, setStatus] = useState<LessonStatus>("DRAFT");
  const [content, setContent] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [resources, setResources] = useState<LessonResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadLesson = async () => {
      try {
        setLoading(true);
        setError("");
        const [lesson, resourcePage] = await Promise.all([
          lessonService.getLesson(params.id),
          lessonService.getLessonResources(params.id),
        ]);
        if (!active) return;
        setCourseId(lesson.courseId);
        setTitle(lesson.title);
        setCode(lesson.code || "");
        setVideoUrl(lesson.videoUrl || "");
        setDurationMinutes(lesson.durationMinutes ?? 0);
        setOrderIndex(lesson.orderIndex ?? 1);
        setStatus(lesson.status);
        setContent(lesson.content || "");
        setResources(resourcePage.content);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Không tải được bài học.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadLesson();
    return () => { active = false; };
  }, [params.id]);

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
      videoUrl: videoUrl.trim() || undefined,
      orderIndex,
      durationMinutes,
      status,
    };

    try {
      setSaving(true);
      setError("");
      await lessonService.updateLesson(params.id, payload);

      if (videoFile) {
        const videoResource = await lessonService.uploadLessonResource(params.id, videoFile, videoFile.name);
        const uploadedVideoUrl = `/course/api/v1/lesson-resources/${videoResource.id}/view`;
        await lessonService.updateLesson(params.id, { ...payload, videoUrl: uploadedVideoUrl });
        const oldVideos = resources.filter((resource) => resource.resourceType === "VIDEO");
        await Promise.all(oldVideos.map((resource) => lessonService.deleteLessonResource(resource.id)));
        setVideoUrl(uploadedVideoUrl);
        setVideoFile(null);
      }

      for (const documentFile of documentFiles) {
        await lessonService.uploadLessonResource(params.id, documentFile, documentFile.name);
        setDocumentFiles((current) => current.filter((file) => file !== documentFile));
      }
      router.replace("/lessons");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Không cập nhật được bài học.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteResource = async (resource: LessonResource) => {
    const accepted = await confirm({
      title: "Xóa tài liệu đính kèm?",
      description: `Tài liệu “${resource.title}” sẽ bị xóa khỏi bài học và không thể khôi phục.`,
      confirmLabel: "Xóa tài liệu",
    });
    if (!accepted) return;
    try {
      setSaving(true);
      setError("");
      await lessonService.deleteLessonResource(resource.id);
      setResources((current) => current.filter((item) => item.id !== resource.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Không xóa được tài liệu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="page-container" style={{ maxWidth: "1100px" }}>
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <div className="header-titles flex-center gap-4">
          <Link href="/lessons" className="icon-btn text-outline"><ArrowLeft size={24} /></Link>
          <div>
            <h1 className="text-headline-lg">Sửa bài học</h1>
            <p className="text-body-md text-on-surface-variant mt-1">
              {loading ? "Đang tải dữ liệu bài học..." : title}
            </p>
          </div>
        </div>
        <div className="header-actions">
          <Link href="/lessons" className="btn btn-ghost">Hủy</Link>
          <button className="btn btn-primary" type="submit" disabled={loading || saving}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>

      {error && <div className="card p-4 mb-4 text-body-md text-status-required">{error}</div>}

      <div className="lesson-form-grid" aria-busy={loading}>
        <div className="form-left-col">
          <div className="card p-6 mb-6">
            <h3 className="text-headline-sm mb-4">Thông tin cơ bản</h3>
            <div className="form-group mb-4">
              <label className="text-label-md">Tên bài học <span className="text-status-required">*</span></label>
              <input type="text" className="form-input" value={title} onChange={(event) => setTitle(event.target.value)} required disabled={loading || saving} />
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="text-label-md">Khóa học <span className="text-status-required">*</span></label>
                <CourseSelect value={courseId} onChange={setCourseId} required className="form-input" disabled={loading || saving} />
              </div>
              <div className="form-group">
                <label className="text-label-md">Mã bài học</label>
                <input type="text" className="form-input" value={code} onChange={(event) => setCode(event.target.value)} disabled={loading || saving} />
              </div>
            </div>
            <div className="form-grid-2 mt-4">
              <div className="form-group">
                <label className="text-label-md">Thứ tự</label>
                <input type="number" className="form-input" min={1} value={orderIndex} onChange={(event) => setOrderIndex(Number(event.target.value))} disabled={loading || saving} />
              </div>
              <div className="form-group">
                <label className="text-label-md">Thời lượng (phút)</label>
                <input type="number" className="form-input" min={0} value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} disabled={loading || saving} />
              </div>
            </div>
            <div className="form-group mt-4">
              <label className="text-label-md">Video URL</label>
              <input type="url" className="form-input" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://example.com/video.mp4" disabled={loading || saving} />
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
              <textarea className="editor-textarea p-4" rows={12} value={content} onChange={(event) => setContent(event.target.value)} disabled={loading || saving} />
            </div>
          </div>
        </div>

        <div className="form-right-col">
          <LessonMediaFields
            videoFile={videoFile}
            documentFiles={documentFiles}
            existingResources={resources}
            disabled={loading || saving}
            onVideoChange={setVideoFile}
            onDocumentsChange={setDocumentFiles}
            onDeleteExisting={(resource) => void handleDeleteResource(resource)}
          />

          <div className="card p-6">
            <h3 className="text-headline-sm mb-4">Trạng thái</h3>
            <select className="form-input" value={status} onChange={(event) => setStatus(event.target.value as LessonStatus)} disabled={loading || saving}>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="INACTIVE">Ngừng hoạt động</option>
              <option value="ARCHIVED">Đã lưu trữ</option>
            </select>
          </div>
        </div>
      </div>
    </form>
  );
}
