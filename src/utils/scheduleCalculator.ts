import {
  TimetableConfig,
  LessonPlanFile,
  LessonDateSummary,
  ScheduledLesson,
  WeeklySlot,
  SpecialDate,
} from '../types';

// Helper to format Date to YYYY-MM-DD
export function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parse YYYY-MM-DD to local Date
export function parseDateISO(isoStr: string): Date {
  const [y, m, d] = isoStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Add days to date
export function addDays(date: Date, days: number): Date {
  const res = new Date(date);
  res.setDate(res.getDate() + days);
  return res;
}

// Format single date to DD/MM/YYYY
export function formatDDMMYYYY(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Format array of dates into pedagogical string
export function formatTeachingDateString(
  datesISO: string[],
  label: 'Ngày dạy' | 'Date of teaching',
  style: 'standard' | 'compact_same_month'
): string {
  if (!datesISO || datesISO.length === 0) {
    return `${label}: Chưa xác định`;
  }

  // Parse all dates
  const dates = datesISO.map(parseDateISO).sort((a, b) => a.getTime() - b.getTime());

  if (dates.length === 1) {
    return `${label}: ${formatDDMMYYYY(dates[0])}`;
  }

  // Check if all dates share the same month and same year
  const first = dates[0];
  const allSameMonthAndYear = dates.every(
    (d) => d.getMonth() === first.getMonth() && d.getFullYear() === first.getFullYear()
  );

  if (style === 'compact_same_month' && allSameMonthAndYear) {
    // E.g. "5, 7, 8/10/2026"
    const dayNumbers = dates.map((d) => d.getDate()).join(', ');
    const month = String(first.getMonth() + 1).padStart(2, '0');
    const year = first.getFullYear();
    return `${label}: ${dayNumbers}/${month}/${year}`;
  }

  // If different months, different years, or standard format, write full date for each
  // E.g. "Ngày dạy: 28/09/2026, 02/10/2026" or "31/12/2026, 04/01/2027"
  const formattedDates = dates.map(formatDDMMYYYY).join(', ');
  return `${label}: ${formattedDates}`;
}

export interface CalculationResult {
  scheduledLessons: ScheduledLesson[];
  lessonSummaries: LessonDateSummary[];
  missingWeeks: number[];
  duplicateWeeks: number[];
  warnings: string[];
}

export function calculateTeachingSchedule(
  files: LessonPlanFile[],
  config: TimetableConfig
): CalculationResult {
  const warnings: string[] = [];

  // Sort files by week and orderIndex
  const sortedFiles = [...files].sort((a, b) => {
    if (a.detectedWeek !== b.detectedWeek) {
      return a.detectedWeek - b.detectedWeek;
    }
    return a.orderIndex - b.orderIndex;
  });

  // Check missing & duplicate weeks
  const weekCounts = new Map<number, number>();
  const detectedWeeks = sortedFiles.map((f) => f.detectedWeek).filter((w) => w > 0);
  detectedWeeks.forEach((w) => weekCounts.set(w, (weekCounts.get(w) || 0) + 1));

  const duplicateWeeks: number[] = [];
  weekCounts.forEach((count, week) => {
    if (count > 1) duplicateWeeks.push(week);
  });

  const minWeek = detectedWeeks.length > 0 ? Math.min(...detectedWeeks) : 1;
  const maxWeek = detectedWeeks.length > 0 ? Math.max(...detectedWeeks) : 1;
  const missingWeeks: number[] = [];
  for (let w = minWeek; w <= maxWeek; w++) {
    if (!weekCounts.has(w)) {
      missingWeeks.push(w);
    }
  }

  if (missingWeeks.length > 0) {
    warnings.push(`Phát hiện thiếu kế hoạch bài dạy cho các tuần: ${missingWeeks.join(', ')}.`);
  }
  if (duplicateWeeks.length > 0) {
    warnings.push(`Có nhiều kế hoạch bài dạy trùng tuần: ${duplicateWeeks.join(', ')}.`);
  }

  if (config.weeklySlots.length === 0) {
    warnings.push('Chưa có tiết học nào được thiết lập trong Thời khóa biểu.');
    return {
      scheduledLessons: [],
      lessonSummaries: sortedFiles.map((f) => ({
        fileId: f.id,
        weekNumber: f.detectedWeek,
        lessonTitle: f.detectedTitle,
        periodsCount: f.detectedPeriods,
        dates: [],
        formattedDateString: `${config.dateLabel}: Chưa thiết lập TKB`,
        slotsInfo: [],
        warnings: ['Chưa thiết lập TKB'],
      })),
      missingWeeks,
      duplicateWeeks,
      warnings,
    };
  }

  // Sort weekly slots by dayOfWeek (2..7), session ('morning' before 'afternoon'), period (1..5)
  const sortedWeeklySlots = [...config.weeklySlots].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    if (a.session !== b.session) return a.session === 'morning' ? -1 : 1;
    return a.period - b.period;
  });

  // Base Monday of term
  const termStart = parseDateISO(config.termStartMonday || '2026-09-07');

  // Helper map for special dates
  const specialDatesMap = new Map<string, SpecialDate>();
  config.specialDates.forEach((sd) => specialDatesMap.set(sd.date, sd));

  // Determine available calendar slots per week
  // Slot in calendar: { dateISO, dayOfWeek, session, period, isHoliday, isExam, specialInfo }
  interface AvailableSlot {
    date: Date;
    dateISO: string;
    dayOfWeek: number;
    session: 'morning' | 'afternoon';
    period: number;
    isHoliday: boolean;
    isExam: boolean;
    isTentativeExam: boolean;
    isMakeup: boolean;
    note?: string;
  }

  const getWeekSlots = (weekNum: number): AvailableSlot[] => {
    const mondayOfWeek = addDays(termStart, (weekNum - 1) * 7);
    const slots: AvailableSlot[] = [];

    // Check each weekly slot
    for (const ws of sortedWeeklySlots) {
      // dayOfWeek: 2 is Monday (+0 days), 3 is Tuesday (+1 days), ..., 7 is Saturday (+5 days)
      const offsetDays = ws.dayOfWeek - 2;
      const slotDate = addDays(mondayOfWeek, offsetDays);
      const dateISO = formatDateISO(slotDate);
      const special = specialDatesMap.get(dateISO);

      let isHoliday = false;
      let isExam = false;
      let isTentativeExam = false;
      let isMakeup = false;
      let note = '';

      if (special) {
        if (special.type === 'holiday' || special.type === 'tet') {
          isHoliday = true;
          note = `Nghỉ lễ: ${special.name}`;
        } else if (special.type === 'exam') {
          isExam = true;
          isTentativeExam = !!special.isTentative;
          note = `Ngày thi: ${special.name}${special.isTentative ? ' (Tạm tính)' : ''}`;
        } else if (special.type === 'makeup') {
          isMakeup = true;
          note = `Dạy bù: ${special.name}`;
        }
      }

      slots.push({
        date: slotDate,
        dateISO,
        dayOfWeek: ws.dayOfWeek,
        session: ws.session,
        period: ws.period,
        isHoliday,
        isExam,
        isTentativeExam,
        isMakeup,
        note,
      });
    }

    return slots;
  };

  const scheduledLessons: ScheduledLesson[] = [];
  const lessonSummaries: LessonDateSummary[] = [];

  // Carry-over slot queue for 'continuous' mode
  let currentContinuousWeek = 1;
  let currentContinuousSlotIndex = 0;
  let continuousWeekSlots = getWeekSlots(1);

  const getNextValidSlotContinuous = (): AvailableSlot => {
    while (true) {
      if (currentContinuousSlotIndex >= continuousWeekSlots.length) {
        currentContinuousWeek++;
        if (currentContinuousWeek > config.totalWeeks + 4) {
          // Exceeded school year warning
          warnings.push(
            `Kế hoạch bài dạy đã vượt quá tuần thứ ${config.totalWeeks} của năm học!`
          );
        }
        continuousWeekSlots = getWeekSlots(currentContinuousWeek);
        currentContinuousSlotIndex = 0;
      }

      const candidate = continuousWeekSlots[currentContinuousSlotIndex];
      currentContinuousSlotIndex++;

      // If holiday or exam, cannot teach unless it's designated makeup
      if (candidate.isHoliday || candidate.isExam) {
        continue;
      }

      return candidate;
    }
  };

  if (config.rolloverMode === 'continuous') {
    // Mode: Nối tiếp liên tục các tiết
    for (const file of sortedFiles) {
      const periodsCount = Math.max(1, file.detectedPeriods || 1);
      const assignedDates: string[] = [];
      const slotsInfo: string[] = [];
      const fileWarnings: string[] = [];

      for (let p = 1; p <= periodsCount; p++) {
        const slot = getNextValidSlotContinuous();
        assignedDates.push(slot.dateISO);

        const dayName = `Thứ ${slot.dayOfWeek === 7 ? '7' : slot.dayOfWeek}`;
        const sessionName = slot.session === 'morning' ? 'Sáng' : 'Chiều';
        slotsInfo.push(
          `${dayName} (${formatDDMMYYYY(slot.date)}) - ${sessionName} Tiết ${slot.period}`
        );

        scheduledLessons.push({
          id: `${file.id}_p${p}`,
          fileId: file.id,
          weekNumber: currentContinuousWeek,
          lessonTitle: file.detectedTitle,
          periodIndexInWeek: p,
          totalPeriodsInLesson: periodsCount,
          periodIndexOfLesson: p,
          className: config.className,
          assignedDate: slot.dateISO,
          session: slot.session,
          periodSlot: slot.period,
          dayOfWeek: slot.dayOfWeek,
          isMakeup: slot.isMakeup,
          note: slot.note,
        });
      }

      const formattedDateString = formatTeachingDateString(
        assignedDates,
        config.dateLabel,
        config.dateFormatStyle
      );

      lessonSummaries.push({
        fileId: file.id,
        weekNumber: file.detectedWeek,
        lessonTitle: file.detectedTitle,
        periodsCount,
        dates: assignedDates,
        formattedDateString,
        slotsInfo,
        warnings: fileWarnings,
      });
    }
  } else {
    // Mode: 'fixed_week' (Giữ bài theo tuần đã phân phối)
    // Group files by week
    const filesByWeek = new Map<number, LessonPlanFile[]>();
    for (const file of sortedFiles) {
      const list = filesByWeek.get(file.detectedWeek) || [];
      list.push(file);
      filesByWeek.set(file.detectedWeek, list);
    }

    filesByWeek.forEach((weekFiles, weekNum) => {
      const weekSlots = getWeekSlots(weekNum);
      const validSlots = weekSlots.filter((s) => !s.isHoliday && !s.isExam);
      let slotPointer = 0;

      for (const file of weekFiles) {
        const periodsCount = Math.max(1, file.detectedPeriods || 1);
        const assignedDates: string[] = [];
        const slotsInfo: string[] = [];
        const fileWarnings: string[] = [];

        for (let p = 1; p <= periodsCount; p++) {
          if (slotPointer < validSlots.length) {
            const slot = validSlots[slotPointer++];
            assignedDates.push(slot.dateISO);

            const dayName = `Thứ ${slot.dayOfWeek === 7 ? '7' : slot.dayOfWeek}`;
            const sessionName = slot.session === 'morning' ? 'Sáng' : 'Chiều';
            slotsInfo.push(
              `${dayName} (${formatDDMMYYYY(slot.date)}) - ${sessionName} Tiết ${slot.period}`
            );

            scheduledLessons.push({
              id: `${file.id}_p${p}`,
              fileId: file.id,
              weekNumber: weekNum,
              lessonTitle: file.detectedTitle,
              periodIndexInWeek: p,
              totalPeriodsInLesson: periodsCount,
              periodIndexOfLesson: p,
              className: config.className,
              assignedDate: slot.dateISO,
              session: slot.session,
              periodSlot: slot.period,
              dayOfWeek: slot.dayOfWeek,
              isMakeup: slot.isMakeup,
              note: slot.note,
            });
          } else {
            // Not enough slots in this week!
            const msg = `Tuần ${weekNum} không đủ tiết trong TKB cho bài "${file.detectedTitle}" (Tiết ${p}/${periodsCount}) do trùng ngày nghỉ hoặc TKB ít tiết.`;
            fileWarnings.push(msg);
            warnings.push(msg);

            // Fallback: estimate end of week
            const mondayOfWeek = addDays(termStart, (weekNum - 1) * 7);
            const friday = addDays(mondayOfWeek, 4);
            assignedDates.push(formatDateISO(friday));
            slotsInfo.push(`Thiếu tiết TKB - Cần sắp lịch bù`);

            scheduledLessons.push({
              id: `${file.id}_p${p}`,
              fileId: file.id,
              weekNumber: weekNum,
              lessonTitle: file.detectedTitle,
              periodIndexInWeek: p,
              totalPeriodsInLesson: periodsCount,
              periodIndexOfLesson: p,
              className: config.className,
              assignedDate: formatDateISO(friday),
              session: 'morning',
              periodSlot: 1,
              dayOfWeek: 6,
              note: 'Chưa có tiết TKB chính thức (Cần xếp bù)',
            });
          }
        }

        const formattedDateString = formatTeachingDateString(
          assignedDates,
          config.dateLabel,
          config.dateFormatStyle
        );

        lessonSummaries.push({
          fileId: file.id,
          weekNumber: file.detectedWeek,
          lessonTitle: file.detectedTitle,
          periodsCount,
          dates: assignedDates,
          formattedDateString,
          slotsInfo,
          warnings: fileWarnings,
        });
      }
    });
  }

  return {
    scheduledLessons,
    lessonSummaries,
    missingWeeks,
    duplicateWeeks,
    warnings,
  };
}
