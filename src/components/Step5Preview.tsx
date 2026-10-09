import React, { useState } from 'react';
import {
  Calendar,
  AlertTriangle,
  FileText,
  ArrowLeft,
  ArrowRight,
  Eye,
  CheckCircle2,
  CalendarDays,
  Info,
} from 'lucide-react';
import {
  LessonPlanFile,
  TimetableConfig,
  LessonDateSummary,
  ScheduledLesson,
} from '../types';
import { formatTeachingDateString } from '../utils/scheduleCalculator';

interface Step5PreviewProps {
  files: LessonPlanFile[];
  config: TimetableConfig;
  scheduledLessons: ScheduledLesson[];
  lessonSummaries: LessonDateSummary[];
  onUpdateManualDate: (fileId: string, newDateString: string) => void;
  warnings: string[];
  onBack: () => void;
  onNext: () => void;
}

export const Step5Preview: React.FC<Step5PreviewProps> = ({
  files,
  config,
  scheduledLessons,
  lessonSummaries,
  onUpdateManualDate,
  warnings,
  onBack,
  onNext,
}) => {
  const [activeTab, setActiveTab] = useState<'schedule_table' | 'doc_preview'>('schedule_table');
  const [previewFileId, setPreviewFileId] = useState<string>(files[0]?.id || '');

  const previewFile = files.find((f) => f.id === previewFileId) || files[0];
  const previewSummary = lessonSummaries.find((s) => s.fileId === previewFile?.id);

  // Helper for rendering colored text spans in preview
  const renderColoredHtml = (rawStr: string): { __html: string } => {
    if (!rawStr) return { __html: 'Chưa có thông tin' };
    const html = rawStr
      .replace(
        /<span\s+color=["']#FF0000["']>([\s\S]*?)<\/span>/gi,
        '<span style="color: #FF0000; font-weight: bold;">$1</span>'
      )
      .replace(
        /<span\s+color=["']#0000FF["']>([\s\S]*?)<\/span>/gi,
        '<span style="color: #0000FF; font-weight: bold;">$1</span>'
      );
    return { __html: html.replace(/\n/g, '<br/>') };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Bước 5: Xem trước Bảng phân phối Ngày dạy & Bố cục
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Rà soát bảng xếp ngày dạy của toàn bộ các tuần. Mọi ngày đều có thể chỉnh sửa thủ công trước khi xuất file.
            </p>
          </div>

          {/* View Tab Switcher */}
          <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('schedule_table')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'schedule_table'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 inline mr-1" />
              Bảng ngày dạy ({lessonSummaries.length} bài)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('doc_preview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'doc_preview'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5 inline mr-1" />
              Mô phỏng trang in Word/PDF
            </button>
          </div>
        </div>
      </div>

      {/* Warnings Banner if any */}
      {warnings.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
          <div className="flex items-center space-x-1 font-bold text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600 mr-1" />
            <span>Thông báo điều chỉnh lịch:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-amber-800">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Tab 1: Master Schedule Table */}
      {activeTab === 'schedule_table' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Bảng xem trước phân phối lịch dạy: {config.subject} - Lớp {config.className}
            </span>
            <span className="text-xs text-slate-500">
              Chế độ: {config.rolloverMode === 'fixed_week' ? 'Cố định trong tuần' : 'Nối tiếp liên tục'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-16 text-center">Tuần</th>
                  <th className="py-2.5 px-3">Tên bài dạy</th>
                  <th className="py-2.5 px-3 w-20 text-center">Số tiết</th>
                  <th className="py-2.5 px-3 w-20 text-center">Lớp</th>
                  <th className="py-2.5 px-3 w-80">
                    Dòng ghi ngày dạy (Có thể sửa trực tiếp)
                  </th>
                  <th className="py-2.5 px-3">Ghi chú & Chi tiết tiết dạy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {lessonSummaries.map((summary) => {
                  const lessonSlots = scheduledLessons.filter(
                    (sl) => sl.fileId === summary.fileId
                  );

                  return (
                    <tr key={summary.fileId} className="hover:bg-slate-50 transition-colors">
                      {/* Week */}
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                        Tuần {summary.weekNumber}
                      </td>

                      {/* Lesson Title */}
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {summary.lessonTitle}
                      </td>

                      {/* Period count */}
                      <td className="py-2.5 px-3 text-center text-slate-600">
                        {summary.periodsCount} tiết
                      </td>

                      {/* Class */}
                      <td className="py-2.5 px-3 text-center font-semibold text-emerald-800">
                        {config.className}
                      </td>

                      {/* Editable Date String */}
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={summary.formattedDateString}
                          onChange={(e) =>
                            onUpdateManualDate(summary.fileId, e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-medium text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>

                      {/* Notes & Slots Breakdown */}
                      <td className="py-2.5 px-3">
                        <div className="space-y-1">
                          {lessonSlots.map((ls, idx) => (
                            <div
                              key={idx}
                              className="text-[11px] text-slate-600 flex items-center space-x-1"
                            >
                              <span>
                                • Tiết {ls.periodIndexOfLesson}/{ls.totalPeriodsInLesson}:
                              </span>
                              <span className="font-medium text-slate-800">
                                Thứ {ls.dayOfWeek === 7 ? '7' : ls.dayOfWeek} ({ls.assignedDate}) - {ls.session === 'morning' ? 'Sáng' : 'Chiều'} T{ls.periodSlot}
                              </span>
                              {ls.isMakeup && (
                                <span className="bg-emerald-100 text-emerald-800 px-1 rounded text-[10px] font-semibold">
                                  Dạy bù
                                </span>
                              )}
                              {ls.note && (
                                <span className="text-amber-700 text-[10px]">
                                  ({ls.note})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Document Layout Preview */}
      {activeTab === 'doc_preview' && (
        <div className="space-y-4">
          {/* Lesson picker for document preview */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 overflow-x-auto scrollbar-none flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-700 shrink-0 mr-2">
              Xem bài:
            </span>
            {files.map((file) => (
              <button
                key={file.id}
                type="button"
                onClick={() => setPreviewFileId(file.id)}
                className={`px-3 py-1 rounded text-xs font-medium border whitespace-nowrap transition-colors ${
                  previewFile?.id === file.id
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Tuần {file.detectedWeek}: {file.detectedTitle}
              </button>
            ))}
          </div>

          {/* Rendered A4 Document Frame */}
          {previewFile && (
            <div className="bg-slate-200 p-4 sm:p-8 rounded-lg flex justify-center overflow-x-auto">
              <div
                className="bg-white shadow-md p-8 sm:p-12 w-full max-w-4xl text-slate-900 border border-slate-300 rounded"
                style={{ fontFamily: "'Tinos', 'Times New Roman', serif" }}
              >
                {/* School Header */}
                <div className="grid grid-cols-2 text-center text-xs pb-4 border-b border-slate-200">
                  <div>
                    <strong className="text-sm block">
                      {(config.schoolName || 'TRƯỜNG TIỂU HỌC').toUpperCase()}
                    </strong>
                    <span>Khối lớp: {config.grade || '4'} - Lớp: {config.className}</span>
                  </div>
                  <div>
                    <strong className="text-sm block">
                      CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                    </strong>
                    <span className="italic">Độc lập - Tự do - Hạnh phúc</span>
                  </div>
                </div>

                {/* Lesson Title & Date */}
                <div className="text-center my-6 space-y-1">
                  <h3 className="text-sm font-bold tracking-wide">
                    KẾ HOẠCH BÀI DẠY - TUẦN {previewFile.detectedWeek}
                  </h3>
                  <h2 className="text-base font-bold text-slate-900">
                    MÔN: {(config.subject || 'MÔN HỌC').toUpperCase()}
                  </h2>
                  <h1 className="text-lg font-bold text-slate-900 uppercase">
                    {previewFile.detectedTitle}
                  </h1>
                  <p className="text-xs italic text-slate-700 pt-1">
                    (Thời lượng: {previewFile.detectedPeriods} tiết) &nbsp; • &nbsp;{' '}
                    <strong className="underline">
                      {previewSummary?.formattedDateString || `${config.dateLabel}: Chưa xếp`}
                    </strong>
                  </p>
                </div>

                {/* Section I: YCCĐ */}
                <div className="my-5 space-y-2 text-xs leading-relaxed">
                  <h4 className="font-bold text-sm text-slate-900">
                    I. YÊU CẦU CẦN ĐẠT:
                  </h4>
                  <div
                    dangerouslySetInnerHTML={renderColoredHtml(
                      previewFile.transformedYccd || previewFile.originalYccd || ''
                    )}
                  />
                </div>

                {/* Section II: Đồ dùng */}
                <div className="my-5 space-y-1 text-xs leading-relaxed">
                  <h4 className="font-bold text-sm text-slate-900">
                    II. ĐỒ DÙNG DẠY HỌC:
                  </h4>
                  <p>
                    <strong>1. Giáo viên:</strong> Kế hoạch bài dạy, bài giảng điện tử trình chiếu, thiết bị dạy học số, tranh ảnh minh họa.
                  </p>
                  <p>
                    <strong>2. Học sinh:</strong> Sách giáo khoa, vở ghi, đồ dùng học tập cá nhân.
                  </p>
                </div>

                {/* Section III: 2-Column Table */}
                <div className="my-5 space-y-2 text-xs">
                  <h4 className="font-bold text-sm text-slate-900">
                    III. CÁC HOẠT ĐỘNG DẠY HỌC CHỦ YẾU:
                  </h4>

                  <table className="w-full border-collapse border border-slate-700 text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-700 p-2 text-center w-1/2">
                          HOẠT ĐỘNG CỦA GIÁO VIÊN
                        </th>
                        <th className="border border-slate-700 p-2 text-center w-1/2">
                          HOẠT ĐỘNG CỦA HỌC SINH
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-slate-50 font-bold">
                        <td colSpan={2} className="border border-slate-700 p-1.5 px-3">
                          1. Khởi động (3 - 5 phút)
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-700 p-2 align-top leading-relaxed">
                          - GV tổ chức trò chơi kết nối hoặc đặt câu hỏi tình huống thực tế.<br />
                          - GV dẫn dắt vào bài mới.
                        </td>
                        <td className="border border-slate-700 p-2 align-top leading-relaxed">
                          - HS tích cực tham gia trò chơi theo hướng dẫn.<br />
                          - HS chia sẻ câu trả lời và chuẩn bị tâm thế học tập.
                        </td>
                      </tr>

                      <tr className="bg-slate-50 font-bold">
                        <td colSpan={2} className="border border-slate-700 p-1.5 px-3">
                          2. Khám phá (12 - 15 phút)
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-700 p-2 align-top leading-relaxed">
                          - GV hướng dẫn học sinh đọc tài liệu, quan sát tranh ảnh.<br />
                          - Hướng dẫn học sinh thảo luận nhóm, giao nhiệm vụ cụ thể.
                        </td>
                        <td className="border border-slate-700 p-2 align-top leading-relaxed">
                          - HS quan sát, trao đổi nhóm đôi/nhóm bốn.<br />
                          - Đại diện nhóm trình bày ý kiến, các nhóm khác lắng nghe nhận xét.
                        </td>
                      </tr>

                      <tr className="bg-slate-50 font-bold">
                        <td colSpan={2} className="border border-slate-700 p-1.5 px-3">
                          3. Luyện tập, thực hành (10 - 12 phút)
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-700 p-2 align-top leading-relaxed">
                          - Giao bài tập thực hành theo mức độ phân hóa.<br />
                          - Quan sát, hỗ trợ các học sinh gặp khó khăn.
                        </td>
                        <td className="border border-slate-700 p-2 align-top leading-relaxed">
                          - HS tự lực làm bài vào vở hoặc phiếu học tập.<br />
                          - Đổi vở chấm chéo hoặc chia sẻ trước lớp.
                        </td>
                      </tr>

                      <tr className="bg-slate-50 font-bold">
                        <td colSpan={2} className="border border-slate-700 p-1.5 px-3">
                          4. Vận dụng (3 - 5 phút)
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-700 p-2 align-top leading-relaxed">
                          - Hướng dẫn học sinh liên hệ thực tế cuộc sống xung quanh.<br />
                          - Nhận xét tiết học, dặn dò chuẩn bị bài sau.
                        </td>
                        <td className="border border-slate-700 p-2 align-top leading-relaxed">
                          - Nêu ví dụ vận dụng bài học vào đời sống.<br />
                          - Lắng nghe dặn dò của giáo viên.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section IV: Điều chỉnh sau bài dạy */}
                <div className="my-5 text-xs">
                  <h4 className="font-bold text-sm text-slate-900">
                    IV. ĐIỀU CHỈNH SAU BÀI DẠY:
                  </h4>
                  <p className="pt-1 text-slate-400">
                    ....................................................................................................................................................................................
                  </p>
                </div>
              </div>
            </div>
          )}
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
          Quay lại: Chỉnh nội dung YCCĐ
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs transition-colors"
        >
          Tiếp tục: Xuất Word & PDF &rarr;
        </button>
      </div>
    </div>
  );
};
