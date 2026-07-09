"use client";

import { useState } from "react";
import { ArrowLeft, UploadCloud, FileText, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import CourseSelect from "@/components/forms/CourseSelect";
import "./edit-lesson.css";

export default function EditLessonPage() {
  const [courseId, setCourseId] = useState("");

  return (
    <div className="page-container" style={{ maxWidth: '1100px' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div className="header-titles flex-center gap-4">
          <Link href="/lessons" className="icon-btn text-outline">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-headline-lg">Edit Lesson</h1>
            <p className="text-body-md text-on-surface-variant mt-1">
              Advanced React Patterns - Chapter 2
            </p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost">Cancel</button>
          <button className="btn btn-primary">Save Changes</button>
        </div>
      </div>

      <div className="lesson-form-grid">
        {/* Left Column */}
        <div className="form-left-col">
          {/* Basic Information */}
          <div className="card p-6 mb-6">
            <h3 className="text-headline-sm mb-4">Basic Information</h3>
            <div className="form-group mb-4">
              <label className="text-label-md">
                Lesson Title <span className="text-status-required">*</span>
              </label>
              <input type="text" className="form-input" defaultValue="Understanding Higher-Order Components" />
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label className="text-label-md">Chapter Module</label>
<CourseSelect value={courseId} onChange={setCourseId} required />
              </div>
              <div className="form-group">
                <label className="text-label-md">Lesson Type</label>
                <select className="form-input">
                  <option>Video Lesson</option>
                  <option>Text Lesson</option>
                  <option>Quiz</option>
                </select>
              </div>
            </div>
            <div className="form-group mt-4">
              <label className="text-label-md">Short Description</label>
              <textarea 
                className="form-input" 
                rows={3}
                defaultValue="An in-depth look at how to create and utilize Higher-Order Components (HOCs) in React to reuse component logic."
              />
            </div>
          </div>

          {/* Detailed Content */}
          <div className="card p-6">
            <h3 className="text-headline-sm mb-4">Detailed Content</h3>
            <div className="editor-container border rounded">
              <div className="editor-toolbar border-b p-2 flex gap-2 bg-surface-container-lowest">
                <button className="editor-btn font-bold">B</button>
                <button className="editor-btn italic">I</button>
                <button className="editor-btn underline">U</button>
                <div className="divider"></div>
                <button className="editor-btn">List</button>
                <button className="editor-btn">Code</button>
              </div>
              <textarea 
                className="editor-textarea p-4" 
                rows={12}
                defaultValue="Higher-Order Components (HOCs) are an advanced technique in React for reusing component logic. HOCs are not part of the React API, per se. They are a pattern that emerges from React's compositional nature.

Concretely, a higher-order component is a function that takes a component and returns a new component.

const EnhancedComponent = higherOrderComponent(WrappedComponent);

Whereas a component transforms props into UI, a higher-order component transforms a component into another component."
              />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="form-right-col">
          {/* Primary Media */}
          <div className="card p-6 mb-6">
            <h3 className="text-headline-sm mb-4">Primary Media</h3>
            <div className="upload-area mb-4">
              <div className="upload-icon-wrapper bg-primary-fixed mb-3">
                <UploadCloud size={24} className="text-primary" />
              </div>
              <span className="text-label-md text-primary cursor-pointer">Click to upload video</span>
              <span className="text-body-sm text-outline mt-1 text-center">MP4, WebM (Max 500MB)</span>
            </div>
            <div className="media-attachment">
              <div className="media-icon bg-secondary-fixed text-on-secondary-fixed">
                <FileText size={20} />
              </div>
              <div className="media-info flex-1">
                <span className="text-label-md block">hoc-tutorial.mp4</span>
                <span className="text-body-sm text-outline">124.5 MB • 14:20</span>
              </div>
              <button className="icon-btn text-error"><Trash2 size={16} /></button>
            </div>
          </div>

          {/* Resources */}
          <div className="card p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-headline-sm">Resources</h3>
              <button className="icon-btn text-primary"><Plus size={18} /></button>
            </div>
            
            <div className="resources-list flex flex-col gap-3">
              <div className="resource-item">
                <div className="media-icon" style={{ backgroundColor: '#ffedd5', color: '#c2410c' }}>
                  <FileText size={18} />
                </div>
                <div className="media-info flex-1">
                  <span className="text-label-md block">Code_Snippets.zip</span>
                  <span className="text-body-sm text-outline">2.4 MB</span>
                </div>
              </div>
              
              <div className="resource-item">
                <div className="media-icon" style={{ backgroundColor: '#ccfbf1', color: '#115e59' }}>
                  <FileText size={18} />
                </div>
                <div className="media-info flex-1">
                  <span className="text-label-md block">HOC_Cheatsheet.pdf</span>
                  <span className="text-body-sm text-outline">1.1 MB</span>
                </div>
              </div>
            </div>
            
            <button className="btn btn-secondary w-full mt-4 justify-center">
              <FileText size={16} className="mr-2" /> Add Resource
            </button>
          </div>

          {/* Settings */}
          <div className="card p-6">
            <h3 className="text-headline-sm mb-4">Settings</h3>
            <div className="settings-list flex flex-col gap-6">
              <div className="setting-toggle">
                <div className="toggle-switch active">
                  <div className="toggle-knob"></div>
                </div>
                <div className="setting-info flex-1">
                  <span className="text-label-md block">Publish Lesson</span>
                  <span className="text-body-sm text-outline">Visible to enrolled students</span>
                </div>
              </div>
              
              <div className="setting-toggle">
                <div className="toggle-switch">
                  <div className="toggle-knob"></div>
                </div>
                <div className="setting-info flex-1">
                  <span className="text-label-md block">Free Preview</span>
                  <span className="text-body-sm text-outline">Allow non-enrolled to view</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
