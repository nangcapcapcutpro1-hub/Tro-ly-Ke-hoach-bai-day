import React, { useState } from 'react';
import {
  FileText,
  Calendar,
  Layers,
  Sparkles,
  Download,
  HelpCircle,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileDown,
  UploadCloud,
} from 'lucide-react';

interface NavbarProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  onSaveDraft: () => void;
  onResetAll: () => void;
  onLoadSampleData: () => void;
  onOpenGuide: () => void;
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hasApiKey: boolean;
  isDraftSaved: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStep,
  onSelectStep,
  onSaveDraft,
  onResetAll,
  onLoadSampleData,
  onOpenGuide,
  onExportJson,
  onImportJson,
  hasApiKey,
  isDraftSaved,
}) => {
  const [showConfigMenu, setShowConfigMenu] = useState(false);

  const steps = [
    { num: 1, label: 'Tải tài liệu', icon: FileText },
    { num: 2, label: 'Chọn mẫu YCCĐ', icon: Layers },
    { num: 3, label: 'Thiết lập lịch', icon: Calendar },
    { num: 4, label: 'Chỉnh nội dung', icon: Sparkles },
    { num: 5, label: 'Xem trước lịch', icon: CheckCircle2 },
    { num: 6, label: 'Xuất Word & PDF', icon: Download },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  Trợ lý Kế hoạch bài dạy
                </h1>
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium px-2 py-0.5 rounded-sm">
                  Tiểu học
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Chuẩn hóa YCCĐ • Tích hợp năng lực số & AI • Tính ngày dạy tự động
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onLoadSampleData}
              type="button"
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
              title="Nạp dữ liệu kế hoạch bài dạy và thời khóa biểu mẫu để thử nghiệm nhanh"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              <span>Dữ liệu mẫu thử nghiệm</span>
            </button>

            <button
              onClick={onSaveDraft}
              type="button"
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors"
              title="Lưu tiến trình hiện tại vào trình duyệt"
            >
              <Save className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
              <span className="hidden sm:inline">Lưu bản nháp</span>
            </button>

            {/* Config & File options dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowConfigMenu(!showConfigMenu)}
                type="button"
                className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md transition-colors"
                title="Tùy chọn cấu hình JSON"
              >
                <FileDown className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Sao lưu</span>
              </button>

              {showConfigMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-slate-200 py-1 z-50 text-xs text-slate-700">
                  <button
                    onClick={() => {
                      onExportJson();
                      setShowConfigMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2 text-slate-500" />
                    Xuất cấu hình & bản nháp (JSON)
                  </button>
                  <label className="w-full text-left px-4 py-2 hover:bg-slate-100 flex items-center cursor-pointer">
                    <UploadCloud className="w-4 h-4 mr-2 text-slate-500" />
                    Nhập bản nháp từ file JSON
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        onImportJson(e);
                        setShowConfigMenu(false);
                      }}
                      className="hidden"
                    />
                  </label>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={() => {
                      onResetAll();
                      setShowConfigMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center"
                  >
                    <RotateCcw className="w-4 h-4 mr-2 text-red-500" />
                    Xóa tất cả & làm mới
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onOpenGuide}
              type="button"
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              title="Xem hướng dẫn sử dụng"
            >
              <HelpCircle className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Hướng dẫn</span>
            </button>
          </div>
        </div>
      </div>

      {/* Step navigation bar */}
      <div className="bg-slate-100 border-t border-slate-200 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 py-1.5" aria-label="Các bước thực hiện">
            {steps.map((s) => {
              const Icon = s.icon;
              const isActive = currentStep === s.num;
              const isPast = currentStep > s.num;

              return (
                <button
                  key={s.num}
                  onClick={() => onSelectStep(s.num)}
                  type="button"
                  className={`flex items-center whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    isActive
                      ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                      : isPast
                      ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/60'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] mr-2 font-bold ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : isPast
                        ? 'bg-slate-300 text-slate-700'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {s.num}
                  </span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
