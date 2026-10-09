import React, { useState } from 'react';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  Palette,
  AlertCircle,
  FileText,
  RotateCcw,
  Languages,
  Eye,
  Info,
} from 'lucide-react';
import { LessonPlanFile, YccdTemplate } from '../types';

interface Step4ContentEditorProps {
  files: LessonPlanFile[];
  onFilesChange: (files: LessonPlanFile[]) => void;
  selectedTemplate: YccdTemplate;
  subjectName: string;
  grade: string;
  languageMode: 'vi' | 'en';
  onBack: () => void;
  onNext: () => void;
  hasApiKey: boolean;
}

export const Step4ContentEditor: React.FC<Step4ContentEditorProps> = ({
  files,
  onFilesChange,
  selectedTemplate,
  subjectName,
  grade,
  languageMode,
  onBack,
  onNext,
  hasApiKey,
}) => {
  const [activeFileId, setActiveFileId] = useState<string>(files[0]?.id || '');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // AI transformation options
  const [includeDigital, setIncludeDigital] = useState(true);
  const [includeAI, setIncludeAI] = useState(false);

  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  const handleUpdateActiveFileYccd = (newYccd: string) => {
    if (!activeFile) return;
    const updated = files.map((f) => {
      if (f.id === activeFile.id) {
        return { ...f, transformedYccd: newYccd };
      }
      return f;
    });
    onFilesChange(updated);
  };

  // Tag selected text with Digital (#FF0000) or AI (#0000FF)
  const handleWrapSelection = (color: '#FF0000' | '#0000FF' | 'clear') => {
    const textarea = document.getElementById('yccd-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = activeFile?.transformedYccd || activeFile?.originalYccd || '';

    if (start === end) {
      alert('Vui lòng bôi đen đoạn văn bản cần đánh dấu năng lực số hoặc AI.');
      return;
    }

    const selectedText = currentVal.substring(start, end);
    let replacement = '';

    if (color === 'clear') {
      replacement = selectedText.replace(/<span\s+color=["'][^"']+["']>([\s\S]*?)<\/span>/gi, '$1');
    } else {
      replacement = `<span color="${color}">${selectedText}</span>`;
    }

    const nextVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);
    handleUpdateActiveFileYccd(nextVal);
  };

  // Call server-side Gemini to transform single lesson
  const handleTransformSingleLesson = async () => {
    if (!activeFile) return;
    setIsAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch('/api/ai/transform-yccd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonTitle: activeFile.detectedTitle,
          subject: subjectName,
          grade: grade,
          originalYccd: activeFile.originalYccd || activeFile.rawText,
          templateFormat: selectedTemplate.defaultStructure,
          language: languageMode,
          integrateDigital: includeDigital,
          integrateAI: includeAI,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Lỗi chuẩn hóa YCCĐ.');
      }

      const updated = files.map((f) => {
        if (f.id === activeFile.id) {
          return {
            ...f,
            transformedYccd: data.data.transformedText,
            digitalCompetencies: data.data.digitalCompetencies,
            aiCompetencies: data.data.aiCompetencies,
          };
        }
        return f;
      });
      onFilesChange(updated);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Không thể chuẩn hóa bài học.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Apply default standard format to all lessons without overwriting core objectives
  const handleApplyTemplateToAllLessons = () => {
    const updated = files.map((f) => {
      if (!f.transformedYccd) {
        return {
          ...f,
          transformedYccd: `I. YÊU CẦU CẦN ĐẠT:
Qua bài học, học sinh thực hiện được:
- ${f.originalYccd ? f.originalYccd.replace(/I\.\s*YÊU CẦU CẦN ĐẠT/gi, '').trim() : 'Nắm vững kiến thức bài học.'}
Học sinh vận dụng bài học trong thực tế cuộc sống:
- Vận dụng kiến thức bài học vào thực tiễn hàng ngày của học sinh.
Giúp các em hình thành và phát triển phẩm chất:
- Chăm chỉ, trung thực, trách nhiệm trong học tập.
Giúp các em hình thành và phát triển năng lực:
- Năng lực tự chủ và tự học, giao tiếp và hợp tác.
Nội dung tích hợp:
- Tích hợp theo kế hoạch giáo dục của nhà trường.`,
        };
      }
      return f;
    });
    onFilesChange(updated);
  };

  // Helper to render preview HTML with colored spans
  const renderColoredHtml = (rawStr: string): { __html: string } => {
    if (!rawStr) return { __html: 'Chưa có nội dung.' };
    const html = rawStr
      .replace(
        /<span\s+color=["']#FF0000["']>([\s\S]*?)<\/span>/gi,
        '<span style="color: #FF0000; font-weight: 600; background-color: #fee2e2; padding: 1px 4px; border-radius: 2px;">$1</span>'
      )
      .replace(
        /<span\s+color=["']#0000FF["']>([\s\S]*?)<\/span>/gi,
        '<span style="color: #0000FF; font-weight: 600; background-color: #dbeafe; padding: 1px 4px; border-radius: 2px;">$1</span>'
      );
    return { __html: html.replace(/\n/g, '<br/>') };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Bước 4: Chỉnh sửa Yêu cầu cần đạt và Tô màu Năng lực Số / AI
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Đối chiếu bản gốc và bản đề xuất song song. Năng lực số: chữ đỏ <span className="text-[#FF0000] font-bold">#FF0000</span>, Năng lực AI: chữ xanh dương <span className="text-[#0000FF] font-bold">#0000FF</span>.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleApplyTemplateToAllLessons}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors"
              title="Áp dụng khung cấu trúc cho tất cả bài chưa có bản đề xuất"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1 text-slate-600" />
              Khung mẫu cho mọi bài
            </button>
          </div>
        </div>
      </div>

      {/* Lesson Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 overflow-x-auto scrollbar-none">
        <div className="flex space-x-2">
          {files.map((file) => {
            const isSelected = file.id === activeFile?.id;
            const hasTransformed = Boolean(file.transformedYccd);
            return (
              <button
                key={file.id}
                type="button"
                onClick={() => setActiveFileId(file.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-medium border text-left transition-all ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-1">
                  <span>Tuần {file.detectedWeek}:</span>
                  <span className="truncate max-w-[140px]">{file.detectedTitle}</span>
                  {hasTransformed && (
                    <Check className="w-3 h-3 text-emerald-600 inline ml-1 shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {activeFile ? (
        <div className="space-y-4">
          {/* Action Toolbar for Active Lesson */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Color Tagging Toolbar */}
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-slate-700 mr-1 flex items-center">
                <Palette className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Định dạng:
              </span>

              <button
                type="button"
                onClick={() => handleWrapSelection('#FF0000')}
                className="px-2.5 py-1 font-semibold text-[#FF0000] bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors"
                title="Bôi đen văn bản và bấm để đánh dấu Năng lực số màu đỏ"
              >
                Năng lực Số (#FF0000)
              </button>

              <button
                type="button"
                onClick={() => handleWrapSelection('#0000FF')}
                className="px-2.5 py-1 font-semibold text-[#0000FF] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors"
                title="Bôi đen văn bản và bấm để đánh dấu Năng lực AI màu xanh dương"
              >
                Năng lực AI (#0000FF)
              </button>

              <button
                type="button"
                onClick={() => handleWrapSelection('clear')}
                className="px-2 py-1 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded transition-colors"
                title="Xóa đánh dấu màu đoạn đã chọn"
              >
                Xóa màu
              </button>
            </div>

            {/* AI Control for this lesson */}
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDigital}
                  onChange={(e) => setIncludeDigital(e.target.checked)}
                  className="w-3.5 h-3.5 text-red-600 rounded"
                />
                <span className="text-slate-700 text-[11px]">Tích hợp số</span>
              </label>

              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAI}
                  onChange={(e) => setIncludeAI(e.target.checked)}
                  className="w-3.5 h-3.5 text-blue-600 rounded"
                />
                <span className="text-slate-700 text-[11px]">Tích hợp AI</span>
              </label>

              <button
                type="button"
                onClick={handleTransformSingleLesson}
                disabled={isAiLoading}
                className="inline-flex items-center px-3 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded shadow-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                {isAiLoading ? 'AI đang chuẩn hóa...' : 'Chuẩn hóa bài này bằng AI'}
              </button>
            </div>
          </div>

          {aiError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start">
              <AlertCircle className="w-4 h-4 text-red-500 mr-2 shrink-0 mt-0.5" />
              <div>
                <span>{aiError}</span>
                <span className="block mt-1 text-[11px] text-slate-600">
                  Bạn có thể chỉnh sửa trực tiếp nội dung ở ô bên phải mà không cần AI.
                </span>
              </div>
            </div>
          )}

          {/* Side-by-side comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Original Unchanged Text */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-700 uppercase">
                    Bản gốc đối chiếu (Giữ nguyên vẹn)
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">Chỉ đọc</span>
              </div>

              <div className="flex-1 bg-slate-50 border border-slate-200 rounded p-3 text-xs font-serif leading-relaxed text-slate-700 whitespace-pre-wrap max-h-[460px] overflow-y-auto">
                {activeFile.originalYccd || activeFile.rawText || 'Không tìm thấy nội dung mục tiêu gốc.'}
              </div>
            </div>

            {/* Right: Editable Transformed Proposal */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-950 uppercase">
                    Bản đề xuất chuẩn hóa (Cho phép sửa trực tiếp)
                  </span>
                </div>
                <span className="text-[11px] text-emerald-700 font-medium">
                  Sẽ xuất vào văn bản
                </span>
              </div>

              <textarea
                id="yccd-textarea"
                value={activeFile.transformedYccd || activeFile.originalYccd || ''}
                onChange={(e) => handleUpdateActiveFileYccd(e.target.value)}
                rows={16}
                placeholder="Nhập hoặc chỉnh sửa Yêu cầu cần đạt..."
                className="w-full flex-1 p-3 border border-slate-300 rounded text-xs font-serif leading-relaxed text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />

              {/* Visual preview of formatted colors */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1 flex items-center">
                  <Eye className="w-3 h-3 mr-1" />
                  Xem trước màu chữ khi xuất Word/PDF:
                </span>
                <div
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs font-serif leading-relaxed text-slate-800 max-h-36 overflow-y-auto"
                  dangerouslySetInnerHTML={renderColoredHtml(
                    activeFile.transformedYccd || activeFile.originalYccd || ''
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-xs text-slate-500">
          Chưa có bài dạy nào được chọn. Vui lòng tải file ở Bước 1.
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Quay lại: Thiết lập lịch
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs transition-colors"
        >
          Tiếp tục: Xem trước lịch dạy &rarr;
        </button>
      </div>
    </div>
  );
};
