"use client";

import { FileText, Trash2, UploadCloud, Video } from "lucide-react";
import type { LessonResource } from "@/services/lesson.service";

type LessonMediaFieldsProps = {
  videoFile: File | null;
  documentFiles: File[];
  existingResources?: LessonResource[];
  canManage?: boolean;
  disabled?: boolean;
  onVideoChange: (file: File | null) => void;
  onDocumentsChange: (files: File[]) => void;
  onDeleteExisting?: (resource: LessonResource) => void;
};

export default function LessonMediaFields({
  videoFile,
  documentFiles,
  existingResources = [],
  canManage = true,
  disabled = false,
  onVideoChange,
  onDocumentsChange,
  onDeleteExisting,
}: LessonMediaFieldsProps) {
  const documents = existingResources.filter((resource) => resource.resourceType !== "VIDEO");
  const existingVideo = existingResources.find((resource) => resource.resourceType === "VIDEO");

  return (
    <>
      <div className="card p-6 mb-6">
        <h3 className="text-headline-sm mb-4">Video bài giảng</h3>
        {canManage && <label className={`upload-area mb-3${disabled ? " upload-area-disabled" : ""}`}>
          <div className="upload-icon-wrapper bg-primary-fixed mb-3">
            <UploadCloud size={24} className="text-primary" />
          </div>
          <strong className="text-label-md text-primary">Chọn file video</strong>
          <span className="text-body-sm text-outline mt-1 text-center">MP4, WebM, MOV hoặc MKV, tối đa 200 MB</span>
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.webm,.mov,.mkv"
            hidden
            disabled={disabled}
            onChange={(event) => onVideoChange(event.target.files?.[0] || null)}
          />
        </label>}
        {videoFile && (
          <div className="media-attachment">
            <Video size={20} className="text-primary" />
            <div className="resource-name"><strong>{videoFile.name}</strong><span>Video mới sẽ được upload khi lưu</span></div>
            <button type="button" className="icon-btn" disabled={disabled} onClick={() => onVideoChange(null)} aria-label="Bỏ video đã chọn"><Trash2 size={17} /></button>
          </div>
        )}
        {!videoFile && existingVideo && (
          <div className="media-attachment">
            <Video size={20} className="text-primary" />
            <div className="resource-name"><strong>{existingVideo.title}</strong><span>Video hiện tại</span></div>
          </div>
        )}
      </div>

      <div className="card p-6 mb-6">
        <h3 className="text-headline-sm mb-4">Tài liệu đính kèm</h3>
        {canManage && <label className={`btn btn-secondary w-full justify-center${disabled ? " disabled" : ""}`}>
          <FileText size={17} /> Chọn tài liệu
          <input
            type="file"
            accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,.doc,.docx"
            multiple
            hidden
            disabled={disabled}
            onChange={(event) => {
              const selected = Array.from(event.target.files || []);
              onDocumentsChange([...documentFiles, ...selected]);
              event.target.value = "";
            }}
          />
        </label>}

        {(documentFiles.length > 0 || documents.length > 0) && <div className="resource-list mt-4">
          {documentFiles.map((file, index) => (
            <div className="resource-item" key={`${file.name}-${file.size}-${index}`}>
              <FileText size={19} className="text-primary" />
              <div className="resource-name"><strong>{file.name}</strong><span>Chờ upload</span></div>
              <button type="button" className="icon-btn" disabled={disabled} onClick={() => onDocumentsChange(documentFiles.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Bỏ ${file.name}`}><Trash2 size={17} /></button>
            </div>
          ))}
          {documents.map((resource) => (
            <div className="resource-item" key={resource.id}>
              <FileText size={19} className="text-primary" />
              <div className="resource-name"><strong>{resource.title}</strong><span>Đã upload</span></div>
              {canManage && onDeleteExisting && <button type="button" className="icon-btn text-status-required" disabled={disabled} onClick={() => onDeleteExisting(resource)} aria-label={`Xóa ${resource.title}`}><Trash2 size={17} /></button>}
            </div>
          ))}
        </div>}
      </div>
    </>
  );
}
