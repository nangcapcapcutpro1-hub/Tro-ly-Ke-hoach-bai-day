import React, { useState } from 'react';
import {
  Download,
  FileText,
  Printer,
  Settings2,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Layers,
  Sparkles,
  ArrowLeft,
  HardDrive,
  Split,
  School,
  GraduationCap,
  BookOpen,
  Edit3,
} from 'lucide-react';
import {
  LessonPlanFile,
  TimetableConfig,
  LessonDateSummary,
  ExportSettings,
} from '../types';
import { generateDocxBlob } from '../utils/docxExporter';
import { generatePrintableHtml, triggerPrintPdf } from '../utils/pdfExporter';

interface Step6ExportProps {
  files: LessonPlanFile[];
  config: TimetableConfig;
  onConfigChange?: (config: TimetableConfig) => void;
  lessonSummaries: LessonDateSummary[];
  exportSettings: ExportSettings;
  onExportSettingsChange: (settings: ExportSettings) => void;
  onBack: () => void;
}

export const Step6Export: React.FC<Step6ExportProps> = ({
  files,
  config,
  onConfigChange,
  lessonSummaries,
  exportSettings,
  onExportSettingsChange,
  onBack,
}) => {
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [customFileName, setCustomFileName] = useState<string>('');

  // Summaries map by fileId
  const summariesMap = new Map<string, LessonDateSummary>();
  lessonSummaries.forEach((s) => summariesMap.set(s.fileId, s));

  // Determine active files based on split mode
  const activeFiles =
    exportSettings.splitMode === 'by_week_range'
      ? files.filter(
          (f) =>
            f.detectedWeek >= exportSettings.fromWeek &&
            f.detectedWeek <= exportSettings.toWeek
        )
      : files;

  // File size calculation & estimate
  const totalInputBytes = activeFiles.reduce((acc, f) => acc + f.fileSize, 0);
  const estimatedDocxBytes = Math.max(150000, totalInputBytes * 0.85);
  const estimatedDocxMB = (estimatedDocxBytes / (1024 * 1024)).toFixed(2);
  const isOverSizeLimit = estimatedDocxBytes > 20 * 1024 * 1024;

  // Sanitize file name helper (keep Unicode Vietnamese, remove forbidden chars)
  const sanitizeFileName = (name: string): string => {
    return name.replace(/[\\/:*?"<>|]/g, '_').trim();
  };

  const subjectNameClean = (config.subject || 'Môn học').trim();
  const classNameClean = (config.className || 'Lớp').trim();
  const minWeek = activeFiles.length > 0 ? Math.min(...activeFiles.map((f) => f.detectedWeek)) : 1;
  const maxWeek = activeFiles.length > 0 ? Math.max(...activeFiles.map((f) => f.detectedWeek)) : 1;
  const weekRangeText = minWeek === maxWeek ? `Tuần ${minWeek}` : `Tuần ${minWeek}-${maxWeek}`;

  // Smart naming presets derived directly from the uploaded/configured subject
  const presetExactSubjectAndClass = `${subjectNameClean} - Lớp ${classNameClean}`;
  const presetExactSubjectOnly = `${subjectNameClean}`;
  const presetSubjectClassWeeks = `${subjectNameClean} - Lớp ${classNameClean} - ${weekRangeText}`;
  const presetKhbdSubject = `KHBD ${subjectNameClean} - Lớp ${classNameClean}`;

  // Default file name is exact subject name and class
  const defaultFileName = presetExactSubjectAndClass;
  const effectiveFileName = sanitizeFileName(customFileName.trim() || defaultFileName);

  // Update setting helper
  const handleUpdateSetting = (field: keyof ExportSettings, val: any) => {
    onExportSettingsChange({ ...exportSettings, [field]: val });
  };

  const handleUpdateMargin = (dir: 'top' | 'bottom' | 'left' | 'right', val: number) => {
    onExportSettingsChange({
      ...exportSettings,
      margins: { ...exportSettings.margins, [dir]: val },
    });
  };

  // DOCX download handler
  const handleDownloadDocx = async () => {
    setIsExportingDocx(true);
    setExportSuccessMessage(null);

    try {
      const blob = await generateDocxBlob(
        files,
        config,
        summariesMap,
        exportSettings
      );

      // Trigger browser download with exact subject file name
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${effectiveFileName}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportSuccessMessage(
        `Đã tạo và tải xuống thành công tập tin Word "${effectiveFileName}.docx" (${(
          blob.size / 1024
        ).toFixed(1)} KB)!`
      );
    } catch (err: any) {
      console.error(err);
      alert('Lỗi xuất file Word: ' + (err.message || 'Không thể tạo file'));
    } finally {
      setIsExportingDocx(false);
    }
  };

  // PDF export handler
  const handlePrintPdf = () => {
    const html = generatePrintableHtml(
      files,
      config,
      summariesMap,
      exportSettings,
      effectiveFileName
    );
    triggerPrintPdf(html);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="text-base font-bold text-slate-900">
          Bước 6: Ghép / Chia và Xuất File Word (.docx) & PDF
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Xuất tài liệu hoàn chỉnh với đầy đủ ngày dạy, bảng 2 cột sư phạm, font Times New Roman và giữ chuẩn màu Năng lực số (#FF0000) & AI (#0000FF).
        </p>
      </div>

      {/* School, Class & Subject Info Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
              <School className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Thông tin hồ sơ giáo án đang xuất
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Trường: <strong className="text-slate-800">{config.schoolName || 'Chưa nhập'}</strong> • Lớp: <strong className="text-slate-800">{config.className || 'Chưa nhập'}</strong> • Môn: <strong className="text-blue-700 font-bold">{config.subject || 'Chưa nhập'}</strong> • GV: <strong className="text-slate-800">{config.teacherName || 'Chưa nhập'}</strong>
              </p>
            </div>
          </div>

          {onConfigChange && (
            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const newSchool = prompt('Nhập tên trường tiểu học:', config.schoolName);
                  if (newSchool !== null && newSchool.trim()) onConfigChange({ ...config, schoolName: newSchool.trim() });
                }}
                className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors"
              >
                Đổi Trường
              </button>
              <button
                type="button"
                onClick={() => {
                  const newClass = prompt('Nhập tên lớp dạy:', config.className);
                  if (newClass !== null && newClass.trim()) onConfigChange({ ...config, className: newClass.trim() });
                }}
                className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors"
              >
                Đổi Lớp
              </button>
              <button
                type="button"
                onClick={() => {
                  const newSubj = prompt('Nhập tên môn học:', config.subject);
                  if (newSubj !== null && newSubj.trim()) onConfigChange({ ...config, subject: newSubj.trim() });
                }}
                className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-300 transition-colors"
              >
                Đổi Môn
              </button>
            </div>
          )}
        </div>
      </div>

      {exportSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 flex items-center">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
          <span>{exportSuccessMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Export Controls & Settings */}
        <div className="lg:col-span-2 space-y-4">
          {/* Merge & Split Option */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
              <Split className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                1. Chế độ Ghép hoặc Chia tài liệu theo tuần
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  exportSettings.splitMode === 'all'
                    ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950 font-semibold ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="splitMode"
                    checked={exportSettings.splitMode === 'all'}
                    onChange={() => handleUpdateSetting('splitMode', 'all')}
                    className="text-emerald-600"
                  />
                  <span>Ghép tất cả các bài vào 1 file duy nhất</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 pl-5 font-normal">
                  Xuất gộp toàn bộ {files.length} bài dạy đã nạp trong danh sách.
                </p>
              </label>

              <label
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  exportSettings.splitMode === 'by_week_range'
                    ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950 font-semibold ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="splitMode"
                    checked={exportSettings.splitMode === 'by_week_range'}
                    onChange={() => handleUpdateSetting('splitMode', 'by_week_range')}
                    className="text-emerald-600"
                  />
                  <span>Chia theo khoảng tuần tùy chọn</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 pl-5 font-normal">
                  Chỉ xuất những bài thuộc khoảng tuần được chỉ định.
                </p>
              </label>
            </div>

            {exportSettings.splitMode === 'by_week_range' && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center space-x-4 text-xs">
                <span className="font-semibold text-slate-700">Chọn khoảng tuần:</span>
                <div className="flex items-center space-x-2">
                  <span>Từ Tuần:</span>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={exportSettings.fromWeek}
                    onChange={(e) =>
                      handleUpdateSetting('fromWeek', parseInt(e.target.value, 10) || 1)
                    }
                    className="w-16 px-2 py-1 border border-slate-300 rounded font-semibold text-center bg-white"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span>Đến Tuần:</span>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={exportSettings.toWeek}
                    onChange={(e) =>
                      handleUpdateSetting('toWeek', parseInt(e.target.value, 10) || 1)
                    }
                    className="w-16 px-2 py-1 border border-slate-300 rounded font-semibold text-center bg-white"
                  />
                </div>
                <span className="text-[11px] text-slate-500">
                  (Khớp {activeFiles.length} bài dạy)
                </span>
              </div>
            )}
          </div>

          {/* Typography & Layout Settings */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
              <Settings2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                2. Định dạng thể thức văn bản & Căn lề chuẩn Nghị định 30/2020
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Phông chữ (Font)
                </label>
                <select
                  value={exportSettings.fontFamily}
                  onChange={(e) => handleUpdateSetting('fontFamily', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-800 font-medium"
                >
                  <option value="Times New Roman">Times New Roman (Chuẩn QG)</option>
                  <option value="Arial">Arial</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cỡ chữ nội dung
                </label>
                <select
                  value={exportSettings.fontSize}
                  onChange={(e) =>
                    handleUpdateSetting('fontSize', parseInt(e.target.value, 10))
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-800 font-medium"
                >
                  <option value={14}>14 pt (Chuẩn sư phạm phổ biến)</option>
                  <option value={13}>13 pt (Gọn gàng)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Trang mới cho từng bài
                </label>
                <label className="flex items-center space-x-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportSettings.pageBreakPerLesson}
                    onChange={(e) =>
                      handleUpdateSetting('pageBreakPerLesson', e.target.checked)
                    }
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="text-slate-700">Mỗi bài ngắt sang trang mới</span>
                </label>
              </div>
            </div>

            {/* Margins */}
            <div className="pt-2">
              <span className="block font-semibold text-slate-700 text-xs mb-2">
                Căn lề trang in (cm) - Chuẩn Nghị định 30: Trên 2cm, Dưới 2cm, Trái 3cm, Phải 1.5cm
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-slate-500 block mb-0.5">Lề Trên (Top)</label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      step="0.1"
                      value={exportSettings.margins.top}
                      onChange={(e) =>
                        handleUpdateMargin('top', parseFloat(e.target.value) || 2)
                      }
                      className="w-16 px-2 py-1 border border-slate-300 rounded text-center bg-white"
                    />
                    <span>cm</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-500 block mb-0.5">Lề Dưới (Bottom)</label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      step="0.1"
                      value={exportSettings.margins.bottom}
                      onChange={(e) =>
                        handleUpdateMargin('bottom', parseFloat(e.target.value) || 2)
                      }
                      className="w-16 px-2 py-1 border border-slate-300 rounded text-center bg-white"
                    />
                    <span>cm</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-500 block mb-0.5">Lề Trái (Left)</label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      step="0.1"
                      value={exportSettings.margins.left}
                      onChange={(e) =>
                        handleUpdateMargin('left', parseFloat(e.target.value) || 3)
                      }
                      className="w-16 px-2 py-1 border border-slate-300 rounded text-center bg-white font-semibold"
                    />
                    <span>cm</span>
                  </div>
                </div>

                <div>
                  <label className="text-slate-500 block mb-0.5">Lề Phải (Right)</label>
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      step="0.1"
                      value={exportSettings.margins.right}
                      onChange={(e) =>
                        handleUpdateMargin('right', parseFloat(e.target.value) || 1.5)
                      }
                      className="w-16 px-2 py-1 border border-slate-300 rounded text-center bg-white"
                    />
                    <span>cm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Checkboxes: School header & Signatures */}
            <div className="pt-2 flex flex-wrap gap-4 text-xs">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportSettings.includeSchoolHeader}
                  onChange={(e) =>
                    handleUpdateSetting('includeSchoolHeader', e.target.checked)
                  }
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span className="text-slate-700">In tiêu đề trường và Quốc hiệu ở đầu bài</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportSettings.includeSignatures}
                  onChange={(e) =>
                    handleUpdateSetting('includeSignatures', e.target.checked)
                  }
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span className="text-slate-700">Thêm bảng chữ ký duyệt (BGH, Tổ CM, GV) ở cuối bài</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportSettings.removeImages}
                  onChange={(e) =>
                    handleUpdateSetting('removeImages', e.target.checked)
                  }
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span className="text-slate-700">Bỏ hình ảnh dung lượng lớn để nén file dưới 20MB</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Col: Summary & Actions */}
        <div className="space-y-4">
          {/* File Size & Quota Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center">
                <HardDrive className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Kiểm soát dung lượng
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  isOverSizeLimit
                    ? 'bg-red-100 text-red-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {estimatedDocxMB} MB / &lt; 20 MB
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full ${
                  isOverSizeLimit ? 'bg-red-500' : 'bg-emerald-500'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    (Number(estimatedDocxMB) / 20) * 100
                  )}%`,
                }}
              />
            </div>

            <p className="text-[11px] text-slate-500">
              {isOverSizeLimit
                ? 'Cảnh báo: Dung lượng vượt 20MB. Vui lòng bật tùy chọn "Bỏ hình ảnh" hoặc chọn xuất theo khoảng tuần.'
                : 'Dung lượng hoàn toàn trong ngưỡng an toàn để gửi qua email và lưu trữ.'}
            </p>
          </div>

          {/* Export Actions Card with Subject-based File Naming */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center">
              <FileCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
              Tải xuống tài liệu (Theo đúng tên môn)
            </h3>

            {/* File Name Configuration Form */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Tên tệp xuất tải về:</span>
                  <span className="text-[10px] text-blue-600 font-semibold">
                    Đúng tên môn: <strong>{config.subject}</strong>
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customFileName}
                    placeholder={defaultFileName}
                    onChange={(e) => setCustomFileName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-900 border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-14"
                  />
                  <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-mono">
                    .docx
                  </span>
                </div>
              </div>

              {/* Quick Format Chips */}
              <div>
                <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                  Chọn mẫu đặt tên nhanh:
                </span>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setCustomFileName(presetExactSubjectAndClass)}
                    className={`px-2 py-0.5 text-[11px] rounded font-medium transition-colors ${
                      effectiveFileName === presetExactSubjectAndClass
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                    title={presetExactSubjectAndClass}
                  >
                    {subjectNameClean} - Lớp {classNameClean}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomFileName(presetExactSubjectOnly)}
                    className={`px-2 py-0.5 text-[11px] rounded font-medium transition-colors ${
                      effectiveFileName === presetExactSubjectOnly
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                    title={presetExactSubjectOnly}
                  >
                    Chỉ môn ({subjectNameClean})
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomFileName(presetSubjectClassWeeks)}
                    className={`px-2 py-0.5 text-[11px] rounded font-medium transition-colors ${
                      effectiveFileName === presetSubjectClassWeeks
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                    title={presetSubjectClassWeeks}
                  >
                    Kèm tuần ({weekRangeText})
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomFileName(presetKhbdSubject)}
                    className={`px-2 py-0.5 text-[11px] rounded font-medium transition-colors ${
                      effectiveFileName === presetKhbdSubject
                        ? 'bg-emerald-600 text-white font-semibold'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                    title={presetKhbdSubject}
                  >
                    KHBD {subjectNameClean}
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="pt-1 border-t border-slate-200 text-[11px] text-slate-600 space-y-0.5">
                <div className="flex items-center text-slate-700">
                  <FileText className="w-3.5 h-3.5 mr-1 text-blue-600 shrink-0" />
                  <span className="font-semibold truncate">Tập tin Word:</span>
                  <span className="ml-1 font-mono text-slate-900 truncate font-semibold">{effectiveFileName}.docx</span>
                </div>
                <div className="text-[10px] text-slate-500 pl-4">
                  Bao gồm {activeFiles.length} bài dạy • Môn {config.subject} • Lớp {config.className}
                </div>
              </div>
            </div>

            {/* Button 1: Download Word DOCX */}
            <button
              type="button"
              onClick={handleDownloadDocx}
              disabled={isExportingDocx || activeFiles.length === 0}
              className="w-full inline-flex items-center justify-center px-4 py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md shadow-xs transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExportingDocx ? 'Đang tạo file Word DOCX...' : 'Tải xuống Microsoft Word (.docx)'}
            </button>

            {/* Button 2: Export & Print PDF */}
            <button
              type="button"
              onClick={handlePrintPdf}
              disabled={activeFiles.length === 0}
              className="w-full inline-flex items-center justify-center px-4 py-3 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 border border-slate-300 rounded-md transition-colors"
            >
              <Printer className="w-4 h-4 mr-2 text-slate-600" />
              Xuất & In PDF (Tìm kiếm được)
            </button>

            <div className="text-[11px] text-slate-500 space-y-1 pt-1">
              <p>
                ✓ File Word (.docx) mở chỉnh sửa bình thường trên Microsoft Word & WPS.
              </p>
              <p>
                ✓ File PDF giữ nguyên định dạng vector, tìm kiếm chữ, đầy đủ dấu tiếng Việt và màu chữ đỏ #FF0000 / xanh dương #0000FF.
              </p>
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
          Quay lại: Xem trước lịch
        </button>
      </div>
    </div>
  );
};
