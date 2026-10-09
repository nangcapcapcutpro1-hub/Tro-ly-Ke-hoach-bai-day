import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Step1Upload } from './components/Step1Upload';
import { Step2Template } from './components/Step2Template';
import { Step3Timetable } from './components/Step3Timetable';
import { Step4ContentEditor } from './components/Step4ContentEditor';
import { Step5Preview } from './components/Step5Preview';
import { Step6Export } from './components/Step6Export';
import { GuideModal } from './components/GuideModal';
import {
  LessonPlanFile,
  TimetableConfig,
  YccdTemplate,
  ExportSettings,
} from './types';
import {
  DEFAULT_TEMPLATES,
  INITIAL_TIMETABLE_CONFIG,
  INITIAL_EXPORT_SETTINGS,
  SAMPLE_LESSON_FILES,
} from './utils/sampleData';
import { calculateTeachingSchedule } from './utils/scheduleCalculator';
import { Check, Info } from 'lucide-react';

export default function App() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [files, setFiles] = useState<LessonPlanFile[]>([]);
  const [templates, setTemplates] = useState<YccdTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('cv_2345');
  const [timetableConfig, setTimetableConfig] = useState<TimetableConfig>(INITIAL_TIMETABLE_CONFIG);
  const [exportSettings, setExportSettings] = useState<ExportSettings>(INITIAL_EXPORT_SETTINGS);
  const [languageMode, setLanguageMode] = useState<'vi' | 'en'>('vi');

  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manual date overrides: fileId -> custom formatted string
  const [manualDateOverrides, setManualDateOverrides] = useState<{ [fileId: string]: string }>({});

  // Check server status & API key on mount
  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.hasApiKey === 'boolean') {
          setHasApiKey(data.hasApiKey);
        }
      })
      .catch(() => {
        // Fallback: server may be starting or offline, manual mode always works
        setHasApiKey(false);
      });

    // Check for existing draft in localStorage
    try {
      const savedDraft = localStorage.getItem('KHBD_DRAFT_V1');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.files && parsed.files.length > 0) {
          setFiles(parsed.files);
        }
        if (parsed.timetableConfig) {
          setTimetableConfig(parsed.timetableConfig);
        }
        if (parsed.exportSettings) {
          setExportSettings(parsed.exportSettings);
        }
        if (parsed.selectedTemplateId) {
          setSelectedTemplateId(parsed.selectedTemplateId);
        }
        if (parsed.manualDateOverrides) {
          setManualDateOverrides(parsed.manualDateOverrides);
        }
      } else {
        // Automatically load realistic sample data on first visit so teacher can immediately explore the app!
        setFiles(SAMPLE_LESSON_FILES);
      }
    } catch (e) {
      console.warn('Could not load draft from localStorage:', e);
      setFiles(SAMPLE_LESSON_FILES);
    }
  }, []);

  // Show toast notification helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Save draft to localStorage
  const handleSaveDraft = () => {
    try {
      const payload = {
        files,
        timetableConfig,
        exportSettings,
        selectedTemplateId,
        templates,
        manualDateOverrides,
        languageMode,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('KHBD_DRAFT_V1', JSON.stringify(payload));
      showToast('Đã lưu bản nháp thành công vào trình duyệt!');
    } catch (e: any) {
      console.error(e);
      alert('Không thể lưu bản nháp: ' + (e.message || 'Bộ nhớ trình duyệt đầy'));
    }
  };

  // Reset all data
  const handleResetAll = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ dữ liệu bài dạy và thời khóa biểu để làm mới?')) {
      localStorage.removeItem('KHBD_DRAFT_V1');
      setFiles([]);
      setTimetableConfig(INITIAL_TIMETABLE_CONFIG);
      setExportSettings(INITIAL_EXPORT_SETTINGS);
      setSelectedTemplateId('cv_2345');
      setManualDateOverrides({});
      setCurrentStep(1);
      showToast('Đã làm mới toàn bộ dữ liệu.');
    }
  };

  // Load sample data
  const handleLoadSampleData = () => {
    setFiles(SAMPLE_LESSON_FILES);
    setTimetableConfig(INITIAL_TIMETABLE_CONFIG);
    setExportSettings(INITIAL_EXPORT_SETTINGS);
    setSelectedTemplateId('cv_2345');
    setManualDateOverrides({});
    showToast('Đã nạp 5 bài dạy mẫu và thời khóa biểu lớp 4A1 để thử nghiệm.');
  };

  // Export JSON backup
  const handleExportJson = () => {
    const payload = {
      files,
      timetableConfig,
      exportSettings,
      selectedTemplateId,
      templates,
      manualDateOverrides,
      languageMode,
      exportedAt: new Date().toISOString(),
      app: 'TroLyKeHoachBaiDay',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KHBD_SaoLuu_${(timetableConfig.subject || 'MonHoc').replace(/\s+/g, '_')}_${(timetableConfig.className || 'Lop').replace(/\s+/g, '')}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Đã xuất tập tin sao lưu JSON.');
  };

  // Import JSON backup
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (parsed.files) setFiles(parsed.files);
        if (parsed.timetableConfig) setTimetableConfig(parsed.timetableConfig);
        if (parsed.exportSettings) setExportSettings(parsed.exportSettings);
        if (parsed.selectedTemplateId) setSelectedTemplateId(parsed.selectedTemplateId);
        if (parsed.manualDateOverrides) setManualDateOverrides(parsed.manualDateOverrides);
        if (parsed.templates) setTemplates(parsed.templates);
        showToast('Đã nạp bản nháp từ file JSON thành công!');
      } catch (err: any) {
        alert('File JSON không hợp lệ: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Deterministic schedule calculation
  const calculationResult = useMemo(() => {
    return calculateTeachingSchedule(files, timetableConfig);
  }, [files, timetableConfig]);

  // Combine calculated summaries with manual date overrides
  const effectiveLessonSummaries = useMemo(() => {
    return calculationResult.lessonSummaries.map((summary) => {
      if (manualDateOverrides[summary.fileId]) {
        return {
          ...summary,
          formattedDateString: manualDateOverrides[summary.fileId],
        };
      }
      return summary;
    });
  }, [calculationResult.lessonSummaries, manualDateOverrides]);

  const handleUpdateManualDate = (fileId: string, newDateString: string) => {
    setManualDateOverrides((prev) => ({
      ...prev,
      [fileId]: newDateString,
    }));
  };

  const selectedTemplate =
    templates.find((t) => t.id === selectedTemplateId) || templates[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Navigation Bar */}
      <Navbar
        currentStep={currentStep}
        onSelectStep={setCurrentStep}
        onSaveDraft={handleSaveDraft}
        onResetAll={handleResetAll}
        onLoadSampleData={handleLoadSampleData}
        onOpenGuide={() => setIsGuideOpen(true)}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        hasApiKey={hasApiKey}
        isDraftSaved={true}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl flex items-center space-x-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentStep === 1 && (
          <Step1Upload
            files={files}
            onFilesChange={setFiles}
            config={timetableConfig}
            onConfigChange={setTimetableConfig}
            onNext={() => setCurrentStep(2)}
            missingWeeks={calculationResult.missingWeeks}
            duplicateWeeks={calculationResult.duplicateWeeks}
            onLoadSampleData={handleLoadSampleData}
          />
        )}

        {currentStep === 2 && (
          <Step2Template
            selectedTemplateId={selectedTemplateId}
            onSelectTemplateId={setSelectedTemplateId}
            templates={templates}
            onTemplatesChange={setTemplates}
            languageMode={languageMode}
            onLanguageModeChange={setLanguageMode}
            subjectName={timetableConfig.subject}
            onBack={() => setCurrentStep(1)}
            onNext={() => setCurrentStep(3)}
            hasApiKey={hasApiKey}
          />
        )}

        {currentStep === 3 && (
          <Step3Timetable
            config={timetableConfig}
            onConfigChange={setTimetableConfig}
            onBack={() => setCurrentStep(2)}
            onNext={() => setCurrentStep(4)}
            hasApiKey={hasApiKey}
          />
        )}

        {currentStep === 4 && (
          <Step4ContentEditor
            files={files}
            onFilesChange={setFiles}
            selectedTemplate={selectedTemplate}
            subjectName={timetableConfig.subject}
            grade={timetableConfig.grade}
            languageMode={languageMode}
            onBack={() => setCurrentStep(3)}
            onNext={() => setCurrentStep(5)}
            hasApiKey={hasApiKey}
          />
        )}

        {currentStep === 5 && (
          <Step5Preview
            files={files}
            config={timetableConfig}
            scheduledLessons={calculationResult.scheduledLessons}
            lessonSummaries={effectiveLessonSummaries}
            onUpdateManualDate={handleUpdateManualDate}
            warnings={calculationResult.warnings}
            onBack={() => setCurrentStep(4)}
            onNext={() => setCurrentStep(6)}
          />
        )}

        {currentStep === 6 && (
          <Step6Export
            files={files}
            config={timetableConfig}
            onConfigChange={setTimetableConfig}
            lessonSummaries={effectiveLessonSummaries}
            exportSettings={exportSettings}
            onExportSettingsChange={setExportSettings}
            onBack={() => setCurrentStep(5)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>Trợ lý Kế hoạch bài dạy</strong> • Dành riêng cho giáo viên tiểu học Việt Nam
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span>Chuẩn Công văn 2345/BGDĐT-GDTH</span>
            <span>•</span>
            <span>Nghị định 30/2020/NĐ-CP</span>
            <span>•</span>
            <span className="text-emerald-700 font-medium">Bảo mật dữ liệu trên máy</span>
          </div>
        </div>
      </footer>

      {/* User Guide Modal */}
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}
