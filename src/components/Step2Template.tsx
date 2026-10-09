import React, { useState, useRef } from 'react';
import {
  Layers,
  Upload,
  Sparkles,
  Check,
  FileCheck,
  Languages,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { YccdTemplate } from '../types';
import { DEFAULT_TEMPLATES } from '../utils/sampleData';

interface Step2TemplateProps {
  selectedTemplateId: string;
  onSelectTemplateId: (id: string) => void;
  templates: YccdTemplate[];
  onTemplatesChange: (templates: YccdTemplate[]) => void;
  languageMode: 'vi' | 'en';
  onLanguageModeChange: (lang: 'vi' | 'en') => void;
  subjectName: string;
  onBack: () => void;
  onNext: () => void;
  hasApiKey: boolean;
}

export const Step2Template: React.FC<Step2TemplateProps> = ({
  selectedTemplateId,
  onSelectTemplateId,
  templates,
  onTemplatesChange,
  languageMode,
  onLanguageModeChange,
  subjectName,
  onBack,
  onNext,
  hasApiKey,
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractedPreview, setExtractedPreview] = useState<any | null>(null);

  const selectedTemplate =
    templates.find((t) => t.id === selectedTemplateId) || templates[0];

  const isEnglishSubject =
    /tiếng anh|english|ngoại ngữ/i.test(subjectName || '');

  // Handle uploading template image/doc for OCR
  const handleUploadTemplateImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setExtractError(null);
    setExtractedPreview(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;

        const res = await fetch('/api/ai/extract-template', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type || 'image/png',
          }),
        });

        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error || 'Không thể trích xuất cấu trúc mẫu.');
        }

        setExtractedPreview(json.data);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      setExtractError(err.message || 'Lỗi khi trích xuất');
    } finally {
      setIsExtracting(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleApplyExtractedTemplate = () => {
    if (!extractedPreview) return;

    const newTemplateId = `custom_${Date.now()}`;
    const newTemplate: YccdTemplate = {
      id: newTemplateId,
      name: extractedPreview.templateName || 'Mẫu trích xuất từ tài liệu giáo viên',
      source: 'Tải lên từ giáo viên',
      description: 'Mẫu cấu trúc Yêu cầu cần đạt được trích xuất và xác nhận bởi giáo viên.',
      defaultStructure:
        extractedPreview.fullMarkdownTemplate ||
        extractedPreview.sections?.map((s: any) => `${s.heading}\n${s.guide}`).join('\n\n') ||
        '',
      sections: extractedPreview.sections?.map((s: any) => ({
        title: s.heading,
        placeholder: s.guide,
      })) || [],
    };

    onTemplatesChange([...templates, newTemplate]);
    onSelectTemplateId(newTemplateId);
    setExtractedPreview(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="text-base font-bold text-slate-900">
          Bước 2: Chọn Mẫu Cấu trúc Yêu cầu cần đạt (YCCĐ)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Chọn mẫu chuẩn theo Công văn 2345/BGDĐT-GDTH hoặc tải ảnh/tài liệu mẫu của nhà trường để trích xuất.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Template Selector & OCR Upload */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Danh sách mẫu sẵn có
            </h3>

            <div className="space-y-2">
              {templates.map((tpl) => {
                const isSelected = tpl.id === selectedTemplateId;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => onSelectTemplateId(tpl.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all text-xs ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950 ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-semibold">{tpl.name}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {tpl.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI OCR Template Extractor */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Trích xuất mẫu từ ảnh / tài liệu
              </span>
              <span className="text-[11px] bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded-sm">
                AI Hỗ trợ
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Chụp ảnh công văn mẫu của trường bạn hoặc tải ảnh chụp phần Mục tiêu. Hệ thống sẽ đọc và hiển thị để bạn xác nhận trước khi dùng.
            </p>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadTemplateImage}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={isExtracting}
              className="w-full inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors disabled:opacity-50"
            >
              {isExtracting ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-spin text-indigo-600" />
                  Đang đọc và phân tích cấu trúc mẫu...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                  Tải ảnh mẫu để trích xuất
                </>
              )}
            </button>

            {extractError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start">
                <AlertCircle className="w-4 h-4 text-red-500 mr-1.5 shrink-0 mt-0.5" />
                <span>{extractError}</span>
              </div>
            )}
          </div>

          {/* Language Selection */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-2">
              <Languages className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Ngôn ngữ Yêu cầu cần đạt
              </span>
            </div>

            <p className="text-xs text-slate-500">
              {isEnglishSubject
                ? 'Môn Tiếng Anh: Bạn có thể chọn giữ Tiếng Việt hoặc chuyển toàn bộ sang Tiếng Anh (English).'
                : 'Môn Tiếng Việt và các môn văn hóa khác mặc định luôn giữ Tiếng Việt theo chuẩn.'}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => onLanguageModeChange('vi')}
                className={`p-2 rounded border text-center font-medium transition-colors ${
                  languageMode === 'vi'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Tiếng Việt (Chuẩn)
              </button>

              <button
                type="button"
                onClick={() => onLanguageModeChange('en')}
                disabled={!isEnglishSubject}
                className={`p-2 rounded border text-center font-medium transition-colors ${
                  languageMode === 'en'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : !isEnglishSubject
                    ? 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title={
                  !isEnglishSubject
                    ? 'Chỉ áp dụng cho môn Tiếng Anh'
                    : 'Chuyển sang Tiếng Anh'
                }
              >
                Tiếng Anh (English)
              </button>
            </div>
          </div>
        </div>

        {/* Right: Template Preview & Confirmation */}
        <div className="lg:col-span-2 space-y-4">
          {/* If teacher just extracted an image template, show confirmation box first */}
          {extractedPreview && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-amber-700" />
                  <h4 className="text-sm font-bold text-amber-900">
                    Xác nhận kết quả trích xuất từ ảnh
                  </h4>
                </div>
                <span className="text-xs bg-amber-200/80 text-amber-900 font-semibold px-2 py-0.5 rounded">
                  Kiểm tra trước khi áp dụng
                </span>
              </div>

              <p className="text-xs text-amber-800">
                AI đã phân tích ảnh mẫu. Vui lòng rà soát lại các mục dưới đây để đảm bảo độ chính xác:
              </p>

              <div className="bg-white border border-amber-200 rounded p-4 text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto text-slate-800">
                {extractedPreview.fullMarkdownTemplate ||
                  JSON.stringify(extractedPreview, null, 2)}
              </div>

              <div className="flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setExtractedPreview(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleApplyExtractedTemplate}
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-md shadow-xs"
                >
                  Xác nhận & Thêm vào danh sách mẫu
                </button>
              </div>
            </div>
          )}

          {/* Active Template Detailed Structure */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Cấu trúc mẫu đang chọn: {selectedTemplate.name}
                </h3>
                <span className="text-xs text-slate-500">
                  Nguồn: {selectedTemplate.source}
                </span>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium px-2.5 py-1 rounded-sm">
                Đang kích hoạt
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <pre className="text-xs font-serif leading-relaxed text-slate-800 whitespace-pre-wrap font-medium">
                {selectedTemplate.defaultStructure}
              </pre>
            </div>

            <div className="space-y-2 text-xs text-slate-600 bg-blue-50/50 border border-blue-100 rounded-lg p-3">
              <div className="flex items-center space-x-1.5 font-semibold text-blue-900">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>Quy tắc chuẩn hóa nghiêm ngặt của Trợ lý:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                <li>Bảo toàn nguyên vẹn mục tiêu và nội dung cốt lõi của bài dạy gốc.</li>
                <li>Không tự tiện thêm mã năng lực hoặc yêu cầu chưa được tài liệu gốc cung cấp.</li>
                <li>Năng lực số sẽ được tô màu đỏ (<span className="text-[#FF0000] font-bold">#FF0000</span>) và năng lực AI tô màu xanh dương (<span className="text-[#0000FF] font-bold">#0000FF</span>).</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Quay lại: Tải tài liệu
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs transition-colors"
        >
          Tiếp tục: Thiết lập lịch dạy &rarr;
        </button>
      </div>
    </div>
  );
};
