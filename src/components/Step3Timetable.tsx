import React, { useState, useRef } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Sparkles,
  Upload,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Info,
  CalendarCheck2,
} from 'lucide-react';
import {
  TimetableConfig,
  WeeklySlot,
  SpecialDate,
  RolloverMode,
  DateLabelMode,
  DateFormatStyle,
} from '../types';

interface Step3TimetableProps {
  config: TimetableConfig;
  onConfigChange: (config: TimetableConfig) => void;
  onBack: () => void;
  onNext: () => void;
  hasApiKey: boolean;
}

export const Step3Timetable: React.FC<Step3TimetableProps> = ({
  config,
  onConfigChange,
  onBack,
  onNext,
  hasApiKey,
}) => {
  const timetableImageInputRef = useRef<HTMLInputElement>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrExtractedData, setOcrExtractedData] = useState<any | null>(null);

  // Form helpers
  const handleUpdateField = (field: keyof TimetableConfig, value: any) => {
    onConfigChange({ ...config, [field]: value });
  };

  // Weekly slot helpers
  const handleAddSlot = () => {
    const newSlot: WeeklySlot = {
      id: `slot_${Date.now()}`,
      dayOfWeek: 2, // Thứ 2
      session: 'morning',
      period: 1,
      timeRange: '07:30 - 08:05',
    };
    onConfigChange({
      ...config,
      weeklySlots: [...config.weeklySlots, newSlot],
    });
  };

  const handleRemoveSlot = (id: string) => {
    onConfigChange({
      ...config,
      weeklySlots: config.weeklySlots.filter((s) => s.id !== id),
    });
  };

  const handleUpdateSlot = (id: string, field: keyof WeeklySlot, val: any) => {
    const updated = config.weeklySlots.map((s) => {
      if (s.id === id) {
        return { ...s, [field]: val };
      }
      return s;
    });
    onConfigChange({ ...config, weeklySlots: updated });
  };

  // Special date helpers (Holidays, Exams, Tet, Make-up)
  const [newSpecialDate, setNewSpecialDate] = useState<Partial<SpecialDate>>({
    date: '',
    type: 'holiday',
    name: '',
    isTentative: false,
  });

  const handleAddSpecialDate = () => {
    if (!newSpecialDate.date || !newSpecialDate.name) return;
    const item: SpecialDate = {
      id: `sd_${Date.now()}`,
      date: newSpecialDate.date,
      type: newSpecialDate.type as any || 'holiday',
      name: newSpecialDate.name,
      isTentative: newSpecialDate.isTentative || false,
      makeupForDate: newSpecialDate.makeupForDate || '',
    };
    onConfigChange({
      ...config,
      specialDates: [...config.specialDates, item],
    });
    setNewSpecialDate({
      date: '',
      type: 'holiday',
      name: '',
      isTentative: false,
    });
  };

  const handleRemoveSpecialDate = (id: string) => {
    onConfigChange({
      ...config,
      specialDates: config.specialDates.filter((sd) => sd.id !== id),
    });
  };

  // OCR upload handler
  const handleOcrTimetableUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrProcessing(true);
    setOcrError(null);
    setOcrExtractedData(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;

        const res = await fetch('/api/ai/extract-timetable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type || 'image/png',
            grade: config.grade,
            subject: config.subject,
            className: config.className,
          }),
        });

        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error || 'Lỗi khi phân tích ảnh thời khóa biểu.');
        }

        setOcrExtractedData(json.data);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      setOcrError(err.message || 'Không thể đọc ảnh thời khóa biểu');
    } finally {
      setIsOcrProcessing(false);
      if (timetableImageInputRef.current) timetableImageInputRef.current.value = '';
    }
  };

  const handleApplyOcrSlots = () => {
    if (!ocrExtractedData || !ocrExtractedData.slots) return;

    const newSlots: WeeklySlot[] = ocrExtractedData.slots.map((s: any, idx: number) => ({
      id: `ocr_slot_${Date.now()}_${idx}`,
      dayOfWeek: Number(s.dayOfWeek) || 2,
      session: s.session === 'afternoon' ? 'afternoon' : 'morning',
      period: Number(s.period) || 1,
      timeRange: s.timeNote || '',
    }));

    onConfigChange({
      ...config,
      schoolName: ocrExtractedData.schoolName || config.schoolName,
      className: ocrExtractedData.className || config.className,
      weeklySlots: newSlots,
    });

    setOcrExtractedData(null);
  };

  const dayNames: { [key: number]: string } = {
    2: 'Thứ Hai',
    3: 'Thứ Ba',
    4: 'Thứ Tư',
    5: 'Thứ Năm',
    6: 'Thứ Sáu',
    7: 'Thứ Bảy',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="text-base font-bold text-slate-900">
          Bước 3: Thiết lập Thời khóa biểu và Lịch năm học
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Hệ thống tính lịch hoàn toàn bằng mã chương trình chuẩn xác 100%, không dùng AI để đoán ngày.
        </p>
      </div>

      {/* Row 1: General School Information */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
          1. Thông tin trường, lớp và môn học
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên trường tiểu học
            </label>
            <input
              type="text"
              value={config.schoolName}
              onChange={(e) => handleUpdateField('schoolName', e.target.value)}
              placeholder="VD: Trường Tiểu học Kim Đồng"
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Giáo viên dạy
            </label>
            <input
              type="text"
              value={config.teacherName}
              onChange={(e) => handleUpdateField('teacherName', e.target.value)}
              placeholder="Nguyễn Thị A"
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Môn học
            </label>
            <input
              type="text"
              value={config.subject}
              onChange={(e) => handleUpdateField('subject', e.target.value)}
              placeholder="Tiếng Việt / Toán..."
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lớp dạy
            </label>
            <input
              type="text"
              value={config.className}
              onChange={(e) => handleUpdateField('className', e.target.value)}
              placeholder="4A1"
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Năm học
            </label>
            <input
              type="text"
              value={config.schoolYear}
              onChange={(e) => handleUpdateField('schoolYear', e.target.value)}
              placeholder="2026 - 2027"
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Thứ Hai bắt đầu Tuần 1
            </label>
            <input
              type="date"
              value={config.termStartMonday}
              onChange={(e) => handleUpdateField('termStartMonday', e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Mốc tính chu kỳ tuần học (Thứ Hai đến Thứ Sáu)
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tổng số tuần năm học
            </label>
            <input
              type="number"
              min="1"
              max="40"
              value={config.totalWeeks}
              onChange={(e) => handleUpdateField('totalWeeks', parseInt(e.target.value, 10) || 35)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Chuẩn tiểu học: 35 tuần thực học
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Bài 2 tiết học cùng ngày
            </label>
            <label className="flex items-center space-x-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.multiPeriodSameDayPreference}
                onChange={(e) =>
                  handleUpdateField('multiPeriodSameDayPreference', e.target.checked)
                }
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-700 font-medium">
                Dạy cùng ngày nếu TKB có 2 tiết
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Row 2: Weekly Timetable Slots */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              2. Các tiết học trong tuần của lớp {config.className || ''} ({config.weeklySlots.length} tiết/tuần)
            </h3>
            <p className="text-xs text-slate-500">
              Nhập thủ công các tiết hoặc tải ảnh chụp thời khóa biểu để AI hỗ trợ đọc.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              ref={timetableImageInputRef}
              type="file"
              accept="image/*"
              onChange={handleOcrTimetableUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => timetableImageInputRef.current?.click()}
              disabled={isOcrProcessing}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-600" />
              {isOcrProcessing ? 'Đang đọc ảnh TKB...' : 'Đọc ảnh TKB'}
            </button>

            <button
              type="button"
              onClick={handleAddSlot}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Thêm tiết học
            </button>
          </div>
        </div>

        {/* OCR Result Preview Modal/Banner */}
        {ocrExtractedData && (
          <div className="p-4 bg-indigo-50 border-2 border-indigo-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 flex items-center">
                <Sparkles className="w-4 h-4 mr-1 text-indigo-600" />
                Kết quả nhận diện từ ảnh Thời khóa biểu (Cần xác nhận)
              </span>
              <span className="text-xs text-indigo-700">
                Lớp: {ocrExtractedData.className || config.className}
              </span>
            </div>

            <p className="text-xs text-indigo-800">
              Tìm thấy {ocrExtractedData.slots?.length || 0} tiết học trong tuần. Vui lòng kiểm tra kỹ trước khi bấm Áp dụng:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ocrExtractedData.slots?.map((s: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-white p-2 rounded border border-indigo-200 text-xs text-slate-800"
                >
                  <strong className="text-indigo-900">{dayNames[s.dayOfWeek] || `Thứ ${s.dayOfWeek}`}</strong>: {s.session === 'afternoon' ? 'Chiều' : 'Sáng'} Tiết {s.period}
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setOcrExtractedData(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleApplyOcrSlots}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-xs"
              >
                Xác nhận & Điền vào Thời khóa biểu
              </button>
            </div>
          </div>
        )}

        {/* Slots Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-md">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Thứ trong tuần</th>
                <th className="py-2 px-3">Buổi dạy</th>
                <th className="py-2 px-3">Tiết học</th>
                <th className="py-2 px-3">Khung giờ (Tùy chọn)</th>
                <th className="py-2 px-3 w-16 text-center">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {config.weeklySlots.map((slot) => (
                <tr key={slot.id} className="hover:bg-slate-50">
                  <td className="py-2 px-3">
                    <select
                      value={slot.dayOfWeek}
                      onChange={(e) =>
                        handleUpdateSlot(slot.id, 'dayOfWeek', parseInt(e.target.value, 10))
                      }
                      className="px-2 py-1 border border-slate-300 rounded font-medium text-slate-800 focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value={2}>Thứ Hai</option>
                      <option value={3}>Thứ Ba</option>
                      <option value={4}>Thứ Tư</option>
                      <option value={5}>Thứ Năm</option>
                      <option value={6}>Thứ Sáu</option>
                      <option value={7}>Thứ Bảy</option>
                    </select>
                  </td>

                  <td className="py-2 px-3">
                    <select
                      value={slot.session}
                      onChange={(e) =>
                        handleUpdateSlot(slot.id, 'session', e.target.value)
                      }
                      className="px-2 py-1 border border-slate-300 rounded text-slate-800 focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="morning">Buổi Sáng</option>
                      <option value="afternoon">Buổi Chiều</option>
                    </select>
                  </td>

                  <td className="py-2 px-3">
                    <select
                      value={slot.period}
                      onChange={(e) =>
                        handleUpdateSlot(slot.id, 'period', parseInt(e.target.value, 10))
                      }
                      className="px-2 py-1 border border-slate-300 rounded font-semibold text-slate-800 focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value={1}>Tiết 1</option>
                      <option value={2}>Tiết 2</option>
                      <option value={3}>Tiết 3</option>
                      <option value={4}>Tiết 4</option>
                      <option value={5}>Tiết 5</option>
                    </select>
                  </td>

                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={slot.timeRange || ''}
                      onChange={(e) =>
                        handleUpdateSlot(slot.id, 'timeRange', e.target.value)
                      }
                      placeholder="07:30 - 08:05"
                      className="w-36 px-2 py-1 border border-slate-300 rounded text-slate-700 text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  </td>

                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveSlot(slot.id)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 3: Special Dates (Holidays, Tet, Exams, Make-ups) */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
          3. Ngày nghỉ lễ, nghỉ Tết, ngày thi và ngày dạy bù ({config.specialDates.length} ngày)
        </h3>

        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-5 gap-2 items-end text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Ngày áp dụng</label>
            <input
              type="date"
              value={newSpecialDate.date}
              onChange={(e) =>
                setNewSpecialDate({ ...newSpecialDate, date: e.target.value })
              }
              className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Loại sự kiện</label>
            <select
              value={newSpecialDate.type}
              onChange={(e) =>
                setNewSpecialDate({ ...newSpecialDate, type: e.target.value as any })
              }
              className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-800"
            >
              <option value="holiday">Nghỉ lễ / Sinh hoạt trường</option>
              <option value="tet">Nghỉ Tết Nguyên đán</option>
              <option value="exam">Ngày thi học kỳ</option>
              <option value="makeup">Ngày dạy bù</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Tên sự kiện / Ghi chú</label>
            <input
              type="text"
              value={newSpecialDate.name}
              onChange={(e) =>
                setNewSpecialDate({ ...newSpecialDate, name: e.target.value })
              }
              placeholder="VD: Nghỉ 20/11..."
              className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-800"
            />
          </div>

          <div className="flex items-center space-x-1 py-2">
            <input
              type="checkbox"
              id="tentativeCheck"
              checked={newSpecialDate.isTentative}
              onChange={(e) =>
                setNewSpecialDate({ ...newSpecialDate, isTentative: e.target.checked })
              }
              className="w-4 h-4 text-emerald-600 rounded border-slate-300"
            />
            <label htmlFor="tentativeCheck" className="text-slate-700 font-medium cursor-pointer">
              Ngày tạm tính (Chưa có lịch chính thức)
            </label>
          </div>

          <div>
            <button
              type="button"
              onClick={handleAddSpecialDate}
              disabled={!newSpecialDate.date || !newSpecialDate.name}
              className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-xs transition-colors disabled:opacity-40"
            >
              Thêm ngày
            </button>
          </div>
        </div>

        {/* List of Special Dates */}
        <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
          {config.specialDates.map((sd) => (
            <div
              key={sd.id}
              className="py-2 px-3 flex items-center justify-between text-xs hover:bg-slate-50"
            >
              <div className="flex items-center space-x-2">
                <span className="font-mono font-semibold text-slate-800">
                  {sd.date}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    sd.type === 'holiday'
                      ? 'bg-amber-100 text-amber-800'
                      : sd.type === 'tet'
                      ? 'bg-rose-100 text-rose-800'
                      : sd.type === 'exam'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {sd.type === 'holiday'
                    ? 'Nghỉ lễ'
                    : sd.type === 'tet'
                    ? 'Nghỉ Tết'
                    : sd.type === 'exam'
                    ? 'Ngày thi'
                    : 'Dạy bù'}
                </span>
                <span className="text-slate-800 font-medium">{sd.name}</span>
                {sd.isTentative && (
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                    Tạm tính
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleRemoveSpecialDate(sd.id)}
                className="text-slate-400 hover:text-red-600 p-1"
                title="Xóa ngày này"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Row 4: Calculation Rules & Date Formatting */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
          4. Chế độ tính lịch và Định dạng hiển thị ngày dạy
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Rollover Mode */}
          <div className="border border-slate-200 rounded-lg p-3 space-y-2">
            <span className="font-semibold text-slate-800 block">
              Chế độ xếp bài:
            </span>
            <div className="space-y-1.5">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="rolloverMode"
                  checked={config.rolloverMode === 'fixed_week'}
                  onChange={() => handleUpdateField('rolloverMode', 'fixed_week')}
                  className="mt-0.5 text-emerald-600"
                />
                <div>
                  <strong className="text-slate-800">Cố định trong tuần</strong>
                  <p className="text-[11px] text-slate-500">
                    Giữ bài trong tuần đã ghi. Nếu thiếu tiết do nghỉ lễ, hệ thống cảnh báo để xếp bù.
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="rolloverMode"
                  checked={config.rolloverMode === 'continuous'}
                  onChange={() => handleUpdateField('rolloverMode', 'continuous')}
                  className="mt-0.5 text-emerald-600"
                />
                <div>
                  <strong className="text-slate-800">Nối tiếp liên tục</strong>
                  <p className="text-[11px] text-slate-500">
                    Khi mất tiết do nghỉ lễ hoặc thi, bài tự động dời sang tiết hợp lệ tiếp theo.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Date Label */}
          <div className="border border-slate-200 rounded-lg p-3 space-y-2">
            <span className="font-semibold text-slate-800 block">
              Nhãn ghi ngày dạy:
            </span>
            <div className="space-y-1.5">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="dateLabel"
                  checked={config.dateLabel === 'Ngày dạy'}
                  onChange={() => handleUpdateField('dateLabel', 'Ngày dạy')}
                  className="text-emerald-600"
                />
                <span className="text-slate-800 font-medium">“Ngày dạy:”</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="dateLabel"
                  checked={config.dateLabel === 'Date of teaching'}
                  onChange={() => handleUpdateField('dateLabel', 'Date of teaching')}
                  className="text-emerald-600"
                />
                <span className="text-slate-800 font-medium">“Date of teaching:”</span>
              </label>
            </div>
          </div>

          {/* Date Format Style */}
          <div className="border border-slate-200 rounded-lg p-3 space-y-2">
            <span className="font-semibold text-slate-800 block">
              Quy tắc hiển thị nhiều ngày:
            </span>
            <div className="space-y-1.5">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="dateFormatStyle"
                  checked={config.dateFormatStyle === 'standard'}
                  onChange={() => handleUpdateField('dateFormatStyle', 'standard')}
                  className="mt-0.5 text-emerald-600"
                />
                <div>
                  <strong className="text-slate-800">Đầy đủ ngày tháng năm</strong>
                  <p className="text-[11px] text-slate-500">
                    VD: Ngày dạy: 05/10/2026, 07/10/2026
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="dateFormatStyle"
                  checked={config.dateFormatStyle === 'compact_same_month'}
                  onChange={() => handleUpdateField('dateFormatStyle', 'compact_same_month')}
                  className="mt-0.5 text-emerald-600"
                />
                <div>
                  <strong className="text-slate-800">Thu gọn khi cùng tháng</strong>
                  <p className="text-[11px] text-slate-500">
                    VD: Ngày dạy: 5, 7/10/2026 (Nếu khác tháng/năm tự động ghi đủ từng ngày)
                  </p>
                </div>
              </label>
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
          Quay lại: Chọn mẫu YCCĐ
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs transition-colors"
        >
          Tiếp tục: Chỉnh nội dung YCCĐ &rarr;
        </button>
      </div>
    </div>
  );
};
