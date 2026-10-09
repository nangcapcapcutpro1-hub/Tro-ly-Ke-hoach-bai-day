import React, { useRef, useState } from 'react';
import {
  Upload,
  FileText,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Trash2,
  CheckCircle2,
  FileWarning,
  Info,
  Clock,
  Sparkles,
  School,
  GraduationCap,
  BookOpen,
  User,
  Calendar,
  Check,
} from 'lucide-react';
import { LessonPlanFile, TimetableConfig } from '../types';
import { parseDocxFile } from '../utils/docxParser';

interface Step1UploadProps {
  files: LessonPlanFile[];
  onFilesChange: (files: LessonPlanFile[]) => void;
  config: TimetableConfig;
  onConfigChange: (config: TimetableConfig) => void;
  onNext: () => void;
  missingWeeks: number[];
  duplicateWeeks: number[];
  onLoadSampleData: () => void;
}

const COMMON_SUBJECTS = [
  'Toán',
  'Tiếng Việt',
  'Tiếng Anh',
  'Khoa học',
  'Lịch sử và Địa lí',
  'Tin học',
  'Công nghệ',
  'Đạo đức',
  'Mĩ thuật',
  'Âm nhạc',
  'Hoạt động trải nghiệm',
  'Giáo dục thể chất',
  'Tự nhiên và Xã hội',
];

export const Step1Upload: React.FC<Step1UploadProps> = ({
  files,
  onFilesChange,
  config,
  onConfigChange,
  onNext,
  missingWeeks,
  duplicateWeeks,
  onLoadSampleData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectionNotice, setDetectionNotice] = useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileSelection = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsProcessing(true);
    setDetectionNotice(null);

    const newFiles: LessonPlanFile[] = [];
    let detectedSubjectName: string | undefined = undefined;
    let detectedClassName: string | undefined = undefined;
    let detectedGradeName: string | undefined = undefined;
    let detectedSchoolName: string | undefined = undefined;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const parsed = await parseDocxFile(file, files.length + i);
      newFiles.push(parsed);

      if (!detectedSubjectName && parsed.detectedSubject) {
        detectedSubjectName = parsed.detectedSubject;
      }
      if (!detectedClassName && parsed.detectedClass) {
        detectedClassName = parsed.detectedClass;
      }
      if (!detectedGradeName && parsed.detectedGrade) {
        detectedGradeName = parsed.detectedGrade;
      }
      if (!detectedSchoolName && parsed.detectedSchool) {
        detectedSchoolName = parsed.detectedSchool;
      }
    }

    // Auto-update config if subject or class detected
    let updatedConfig = { ...config };
    let hasConfigUpdate = false;
    const notices: string[] = [];

    if (detectedSubjectName) {
      updatedConfig.subject = detectedSubjectName;
      hasConfigUpdate = true;
      notices.push(`môn "${detectedSubjectName}"`);
    }

    if (detectedClassName && (!config.className || config.className === '4A1')) {
      updatedConfig.className = detectedClassName;
      hasConfigUpdate = true;
      notices.push(`lớp "${detectedClassName}"`);
    }

    if (detectedGradeName && (!config.grade || config.grade === '4')) {
      updatedConfig.grade = detectedGradeName;
      hasConfigUpdate = true;
    }

    if (detectedSchoolName && (!config.schoolName || config.schoolName === 'Trường Tiểu học Kim Đồng')) {
      updatedConfig.schoolName = detectedSchoolName;
      hasConfigUpdate = true;
      notices.push(`trường "${detectedSchoolName}"`);
    }

    if (hasConfigUpdate) {
      onConfigChange(updatedConfig);
    }

    if (notices.length > 0) {
      setDetectionNotice(`Đã tự động nhận diện ${notices.join(', ')} từ tệp vừa tải lên!`);
    }

    onFilesChange([...files, ...newFiles]);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      await handleFileSelection(e.dataTransfer.files);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...files];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    // update orderIndex
    updated.forEach((f, idx) => (f.orderIndex = idx));
    onFilesChange(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === files.length - 1) return;
    const updated = [...files];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    updated.forEach((f, idx) => (f.orderIndex = idx));
    onFilesChange(updated);
  };

  const handleDeleteFile = (id: string) => {
    const updated = files.filter((f) => f.id !== id);
    updated.forEach((f, idx) => (f.orderIndex = idx));
    onFilesChange(updated);
  };

  const handleUpdateFileField = (
    id: string,
    field: 'detectedWeek' | 'detectedTitle' | 'detectedPeriods',
    value: any
  ) => {
    const updated = files.map((f) => {
      if (f.id === id) {
        return { ...f, [field]: value };
      }
      return f;
    });
    onFilesChange(updated);
  };

  const hasOldDocWarning = files.some((f) => f.status === 'old_doc_warning');

  return (
    <div className="space-y-6">
      {/* Step Header & Instructions */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Bước 1: Tải lên và Sắp xếp Kế hoạch bài dạy
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Nhận nhiều tập tin Word (.docx). Hệ thống tự nhận diện tuần, bài, số tiết và phát hiện tuần thiếu/trùng.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onLoadSampleData}
              type="button"
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-700" />
              Nạp dữ liệu mẫu để thử nhanh
            </button>
          </div>
        </div>
      </div>

      {/* Warnings & Diagnostics Banner */}
      {(missingWeeks.length > 0 || duplicateWeeks.length > 0 || hasOldDocWarning) && (
        <div className="space-y-2">
          {missingWeeks.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 mr-2 shrink-0 mt-0.5" />
              <div>
                <strong>Cảnh báo thiếu tuần học:</strong> Hiện chưa có kế hoạch bài dạy cho các tuần{' '}
                <span className="font-bold underline">{missingWeeks.join(', ')}</span>. Bạn có thể tải bổ sung thêm file DOCX hoặc điều chỉnh số tuần của các bài bên dưới.
              </div>
            </div>
          )}

          {duplicateWeeks.length > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start text-xs text-blue-900">
              <Info className="w-4 h-4 text-blue-600 mr-2 shrink-0 mt-0.5" />
              <div>
                <strong>Lưu ý tuần trùng:</strong> Có nhiều bài cùng thuộc tuần{' '}
                <span className="font-bold underline">{duplicateWeeks.join(', ')}</span>. Hệ thống sẽ lần lượt xếp các bài vào các tiết trong thời khóa biểu của tuần đó.
              </div>
            </div>
          )}

          {hasOldDocWarning && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start text-xs text-rose-900">
              <FileWarning className="w-4 h-4 text-rose-600 mr-2 shrink-0 mt-0.5" />
              <div>
                <strong>Phát hiện tập tin Word .DOC cũ:</strong> Hệ thống không thể xử lý trực tiếp định dạng nhị phân Word 97-2003 (.doc). Vui lòng mở file bằng Microsoft Word và chọn <em>File &gt; Save As &gt; Word Document (.docx)</em> để tải lên lại.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detection Notice Banner */}
      {detectionNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between text-xs text-emerald-900 shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{detectionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setDetectionNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold px-2 py-0.5 rounded hover:bg-emerald-100 transition-colors"
          >
            Đã hiểu
          </button>
        </div>
      )}

      {/* School, Class, and Subject Configuration Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
              <School className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Thông tin Trường, Lớp & Môn học
              </h3>
              <p className="text-xs text-slate-500">
                Thông tin dùng để in tiêu đề kế hoạch bài dạy và đặt tên tệp xuất (.docx / PDF) đúng theo môn học.
              </p>
            </div>
          </div>
          {config.subject && (
            <div className="inline-flex items-center px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-700 font-semibold self-start sm:self-auto">
              <BookOpen className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              Môn hiện tại: <span className="ml-1 text-blue-900 font-bold underline">{config.subject}</span>
              {config.className && <span className="ml-1 text-slate-600">({config.className})</span>}
            </div>
          )}
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
          {/* School Name */}
          <div className="lg:col-span-5">
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
              <School className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Tên trường tiểu học <span className="text-rose-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              value={config.schoolName}
              onChange={(e) => onConfigChange({ ...config, schoolName: e.target.value })}
              placeholder="VD: Trường Tiểu học Kim Đồng"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          {/* Class Name */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
              <GraduationCap className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Lớp dạy <span className="text-rose-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              value={config.className}
              onChange={(e) => onConfigChange({ ...config, className: e.target.value })}
              placeholder="4A1"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          {/* Grade */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Khối lớp
            </label>
            <select
              value={config.grade}
              onChange={(e) => onConfigChange({ ...config, grade: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
            >
              <option value="1">Khối 1</option>
              <option value="2">Khối 2</option>
              <option value="3">Khối 3</option>
              <option value="4">Khối 4</option>
              <option value="5">Khối 5</option>
            </select>
          </div>

          {/* Subject */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
              <BookOpen className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Môn học <span className="text-rose-500 ml-0.5">*</span>
            </label>
            <input
              type="text"
              value={config.subject}
              onChange={(e) => onConfigChange({ ...config, subject: e.target.value })}
              placeholder="VD: Toán, Tiếng Việt..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          {/* Teacher Name */}
          <div className="lg:col-span-6">
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
              <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Giáo viên giảng dạy
            </label>
            <input
              type="text"
              value={config.teacherName}
              onChange={(e) => onConfigChange({ ...config, teacherName: e.target.value })}
              placeholder="VD: Nguyễn Thị Minh Hạnh"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          {/* School Year */}
          <div className="lg:col-span-6">
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Năm học
            </label>
            <input
              type="text"
              value={config.schoolYear}
              onChange={(e) => onConfigChange({ ...config, schoolYear: e.target.value })}
              placeholder="2026 - 2027"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>
        </div>

        {/* Quick Subject Select Pills */}
        <div className="pt-1">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
            Chọn nhanh môn học:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_SUBJECTS.map((subj) => (
              <button
                key={subj}
                type="button"
                onClick={() => onConfigChange({ ...config, subject: subj })}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  config.subject === subj
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50/50'
            : 'border-slate-300 hover:border-emerald-400 bg-white hover:bg-slate-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".docx,.doc"
          onChange={(e) => handleFileSelection(e.target.files)}
          className="hidden"
        />

        <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
          <Upload className="w-6 h-6" />
        </div>

        <p className="text-sm font-semibold text-slate-800">
          Kéo thả các tập tin Kế hoạch bài dạy (.docx) vào đây, hoặc{' '}
          <span className="text-emerald-600 underline">bấm để chọn từ máy tính</span>
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Hỗ trợ tải lên nhiều tập tin Word cùng lúc. Mỗi tập tin được giữ nguyên bản gốc để đối chiếu song song.
        </p>

        {isProcessing && (
          <div className="mt-4 flex items-center justify-center text-xs text-emerald-700 font-medium">
            <Clock className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            Đang giải mã và đọc cấu trúc tập tin Word...
          </div>
        )}
      </div>

      {/* Uploaded Files Table */}
      {files.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Danh sách bài dạy đã nạp ({files.length} bài)
              </span>
              {files.some((f) => f.isSample) && (
                <span className="text-[11px] bg-amber-100 text-amber-800 font-medium px-2 py-0.5 rounded-sm">
                  Dữ liệu minh họa để thử nghiệm
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500">
              Có thể chỉnh sửa Tuần, Tên bài, Số tiết trực tiếp trong bảng
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/75 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">Thứ tự</th>
                  <th className="py-2.5 px-3 w-20 text-center">Tuần</th>
                  <th className="py-2.5 px-3">Tên bài học (Nhận diện)</th>
                  <th className="py-2.5 px-3 w-24 text-center">Số tiết</th>
                  <th className="py-2.5 px-3 w-28">Dung lượng</th>
                  <th className="py-2.5 px-3 w-32">Trạng thái</th>
                  <th className="py-2.5 px-3 w-24 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {files.map((file, idx) => (
                  <tr
                    key={file.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      file.status === 'old_doc_warning' ? 'bg-rose-50/50' : ''
                    }`}
                  >
                    {/* Index & Reorder */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <span className="font-bold text-slate-600">{idx + 1}</span>
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => handleMoveUp(idx)}
                            disabled={idx === 0}
                            className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                            title="Chuyển lên"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveDown(idx)}
                            disabled={idx === files.length - 1}
                            className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                            title="Chuyển xuống"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Detected Week Editable */}
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        min="1"
                        max="40"
                        value={file.detectedWeek}
                        onChange={(e) =>
                          handleUpdateFileField(
                            file.id,
                            'detectedWeek',
                            parseInt(e.target.value, 10) || 1
                          )
                        }
                        className="w-16 px-2 py-1 text-center border border-slate-300 rounded font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>

                    {/* Title Editable */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        value={file.detectedTitle}
                        onChange={(e) =>
                          handleUpdateFileField(file.id, 'detectedTitle', e.target.value)
                        }
                        className="w-full px-2 py-1 border border-slate-300 rounded text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="flex items-center text-slate-500">
                          <FileText className="w-3 h-3 inline mr-1" />
                          <span className="truncate max-w-[200px]">{file.fileName}</span>
                        </span>
                        {file.detectedSubject && (
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                            Môn: {file.detectedSubject}
                          </span>
                        )}
                        {file.detectedClass && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                            Lớp: {file.detectedClass}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Periods Editable */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex items-center">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={file.detectedPeriods}
                          onChange={(e) =>
                            handleUpdateFileField(
                              file.id,
                              'detectedPeriods',
                              parseInt(e.target.value, 10) || 1
                            )
                          }
                          className="w-14 px-2 py-1 text-center border border-slate-300 rounded font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <span className="ml-1 text-slate-500">tiết</span>
                      </div>
                    </td>

                    {/* File Size */}
                    <td className="py-2.5 px-3 text-slate-600">
                      {formatFileSize(file.fileSize)}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3">
                      {file.status === 'ready' ? (
                        <span className="inline-flex items-center text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          Hợp lệ
                        </span>
                      ) : file.status === 'old_doc_warning' ? (
                        <span className="inline-flex items-center text-rose-700 font-medium">
                          <FileWarning className="w-3.5 h-3.5 mr-1 text-rose-600" />
                          Cần file .docx
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-amber-700 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                          Xem lại
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteFile(file.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                        title="Xóa bài dạy này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <div className="text-xs text-slate-500">
          {files.length > 0
            ? `Đã nạp ${files.length} bài dạy (${files.reduce(
                (sum, f) => sum + f.detectedPeriods,
                0
              )} tiết tổng cộng).`
            : 'Chưa có tập tin nào được nạp.'}
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={files.length === 0}
          className="inline-flex items-center px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md shadow-xs transition-colors"
        >
          Tiếp tục: Chọn mẫu YCCĐ &rarr;
        </button>
      </div>
    </div>
  );
};
