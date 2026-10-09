export interface LessonPlanFile {
  id: string;
  fileName: string;
  fileSize: number; // in bytes
  detectedWeek: number;
  detectedTitle: string;
  detectedPeriods: number; // e.g., 1, 2, 3
  detectedSubject?: string;
  detectedGrade?: string;
  detectedClass?: string;
  detectedSchool?: string;
  orderIndex: number;
  rawText: string;
  rawHtml?: string;
  originalYccd: string;
  transformedYccd?: string;
  digitalCompetencies?: string[];
  aiCompetencies?: string[];
  status: 'ready' | 'needs_review' | 'error' | 'old_doc_warning';
  statusMessage?: string;
  isSample?: boolean;
  activitiesTable?: {
    teacherActivities: string;
    studentActivities: string;
    stepName: string;
  }[];
}

export type RolloverMode = 'fixed_week' | 'continuous';
export type DateLabelMode = 'Ngày dạy' | 'Date of teaching';
export type DateFormatStyle = 'standard' | 'compact_same_month';

export interface WeeklySlot {
  id: string;
  dayOfWeek: number; // 2 = Thứ 2, 3 = Thứ 3, ..., 6 = Thứ 6, 7 = Thứ 7
  session: 'morning' | 'afternoon';
  period: number; // 1, 2, 3, 4, 5
  timeRange?: string;
}

export interface SpecialDate {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'holiday' | 'tet' | 'exam' | 'makeup';
  name: string;
  isTentative?: boolean; // Tạm tính nếu chưa có thông báo chính thức
  makeupForDate?: string; // Nếu là ngày dạy bù cho ngày nào
}

export interface TimetableConfig {
  schoolName: string;
  teacherName: string;
  className: string;
  subject: string;
  grade: string;
  schoolYear: string; // e.g. "2026 - 2027"
  termStartMonday: string; // YYYY-MM-DD
  totalWeeks: number; // e.g. 35
  weeklySlots: WeeklySlot[];
  specialDates: SpecialDate[];
  rolloverMode: RolloverMode;
  dateLabel: DateLabelMode;
  dateFormatStyle: DateFormatStyle;
  previousLastPeriod?: number;
  previousLastDate?: string;
  multiPeriodSameDayPreference: boolean; // Ghép bài 2 tiết vào cùng ngày nếu có 2 tiết
}

export interface ScheduledLesson {
  id: string;
  fileId: string;
  weekNumber: number;
  lessonTitle: string;
  periodIndexInWeek: number; // Tiết thứ mấy trong tuần của môn này
  totalPeriodsInLesson: number;
  periodIndexOfLesson: number; // Tiết 1 hoặc Tiết 2 của bài
  className: string;
  assignedDate: string; // YYYY-MM-DD
  session: 'morning' | 'afternoon';
  periodSlot: number;
  dayOfWeek: number;
  isHolidayConflict?: boolean;
  isExamConflict?: boolean;
  isTentativeExam?: boolean;
  isMakeup?: boolean;
  note?: string;
}

export interface LessonDateSummary {
  fileId: string;
  weekNumber: number;
  lessonTitle: string;
  periodsCount: number;
  dates: string[]; // YYYY-MM-DD array
  formattedDateString: string; // "Ngày dạy: 05/10/2026, 07/10/2026"
  slotsInfo: string[];
  warnings: string[];
}

export interface YccdTemplate {
  id: string;
  name: string;
  source: string;
  description: string;
  defaultStructure: string;
  sections: {
    title: string;
    placeholder: string;
  }[];
}

export interface ExportSettings {
  fontFamily: 'Times New Roman' | 'Arial';
  fontSize: 13 | 14;
  margins: {
    top: number; // cm
    bottom: number; // cm
    left: number; // cm
    right: number; // cm
  };
  includeSignatures: boolean;
  removeImages: boolean;
  pageBreakPerLesson: boolean;
  splitMode: 'all' | 'by_week_range';
  fromWeek: number;
  toWeek: number;
  includeSchoolHeader: boolean;
}
