// @ts-ignore
import mammoth from 'mammoth';
import { LessonPlanFile } from '../types';

export function isOldDocFile(fileName: string, buffer: ArrayBuffer): boolean {
  if (fileName.toLowerCase().endsWith('.doc') && !fileName.toLowerCase().endsWith('.docx')) {
    return true;
  }
  // Check magic bytes for OLE2 Compound Document (D0 CF 11 E0)
  if (buffer.byteLength >= 4) {
    const bytes = new Uint8Array(buffer.slice(0, 4));
    if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) {
      return true;
    }
  }
  return false;
}

export async function parseDocxFile(file: File, index: number = 0): Promise<LessonPlanFile> {
  const buffer = await file.arrayBuffer();

  // Check if it's an old .doc file
  if (isOldDocFile(file.name, buffer)) {
    return {
      id: `file_${Date.now()}_${index}`,
      fileName: file.name,
      fileSize: file.size,
      detectedWeek: 1,
      detectedTitle: file.name.replace(/\.[^/.]+$/, ''),
      detectedPeriods: 1,
      orderIndex: index,
      rawText: '',
      originalYccd: '',
      status: 'old_doc_warning',
      statusMessage:
        'Tập tin này có định dạng Word .DOC cũ (Word 97-2003). Vui lòng mở bằng Microsoft Word và chọn "Lưu thành" (Save As) dạng Word Document (.docx) để hệ thống xử lý đầy đủ nội dung và bảng biểu.',
    };
  }

  try {
    const rawResult = await mammoth.extractRawText({ arrayBuffer: buffer });
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer: buffer });

    const rawText = rawResult.value || '';
    const rawHtml = htmlResult.value || '';

    // Extract detected week
    let detectedWeek = 1;
    const weekMatch = rawText.match(/(?:Tuần|TUẦN|tuần)\s*[:：\-]?\s*(\d+)/i);
    if (weekMatch && weekMatch[1]) {
      detectedWeek = parseInt(weekMatch[1], 10);
    }

    // Extract detected lesson title
    let detectedTitle = '';
    const titleMatch = rawText.match(
      /(?:BÀI|Bài|CHỦ ĐỀ|Chủ đề|UNIT|Unit|BÀI HỌC)\s*[:：\-]?\s*([0-9A-Za-zÀ-ỹ\s,.:\-–—]{3,80})/i
    );
    if (titleMatch && titleMatch[1]) {
      detectedTitle = titleMatch[0].trim().replace(/[\r\n]+/g, ' ');
    } else {
      // Fallback from filename
      detectedTitle = file.name.replace(/\.[^/.]+$/, '').replace(/^[A-Za-z0-9_-]+_/, '');
    }

    // Extract detected periods
    let detectedPeriods = 1;
    const periodMatch = rawText.match(
      /(?:Số tiết|Thời lượng|Thời gian)\s*[:：\-]?\s*(\d+)\s*tiết/i
    ) || rawText.match(/\((\d+)\s*tiết\)/i) || rawText.match(/\b(\d+)\s*tiết\b/i);
    if (periodMatch && periodMatch[1]) {
      const p = parseInt(periodMatch[1], 10);
      if (p >= 1 && p <= 10) detectedPeriods = p;
    }

    // Extract original YCCĐ
    let originalYccd = '';
    const yccdRegex = /(?:I\.\s*YÊU CẦU CẦN ĐẠT|YÊU CẦU CẦN ĐẠT|MỤC TIÊU)([\s\S]*?)(?:II\.\s*ĐỒ DÙNG|ĐỒ DÙNG DẠY HỌC|THIẾT BỊ DẠY HỌC|CHUẨN BỊ|TIẾN TRÌNH)/i;
    const yccdMatch = rawText.match(yccdRegex);
    if (yccdMatch && yccdMatch[1]) {
      originalYccd = yccdMatch[1].trim();
    } else {
      // Take first 500 characters of text as preview if not found
      originalYccd = rawText.slice(0, 400).trim();
    }

    // Detect existing digital competencies & AI competencies
    const digitalMatches: string[] = [];
    const aiMatches: string[] = [];

    const lines = originalYccd.split('\n');
    for (const line of lines) {
      if (/(?:năng lực số|thiết bị số|công nghệ số|phần mềm|tìm kiếm số|môi trường số)/i.test(line)) {
        digitalMatches.push(line.trim());
      }
      if (/(?:trí tuệ nhân tạo|năng lực AI|hệ thống AI|trợ lý AI|ứng dụng AI)/i.test(line)) {
        aiMatches.push(line.trim());
      }
    }

    // Detect subject from text or filename
    let detectedSubject = detectSubjectFromContext(file.name, rawText);

    // Detect grade and class
    const { detectedGrade, detectedClass } = detectClassAndGrade(file.name, rawText);

    // Detect school name
    const detectedSchool = detectSchoolFromText(rawText);

    return {
      id: `file_${Date.now()}_${index}`,
      fileName: file.name,
      fileSize: file.size,
      detectedWeek,
      detectedTitle,
      detectedPeriods,
      detectedSubject,
      detectedGrade,
      detectedClass,
      detectedSchool,
      orderIndex: index,
      rawText,
      rawHtml,
      originalYccd,
      digitalCompetencies: digitalMatches,
      aiCompetencies: aiMatches,
      status: 'ready',
      statusMessage: 'Đã đọc thành công nội dung Word (.docx)',
    };
  } catch (err: any) {
    console.error('Parse docx error:', err);
    return {
      id: `file_${Date.now()}_${index}`,
      fileName: file.name,
      fileSize: file.size,
      detectedWeek: 1,
      detectedTitle: file.name,
      detectedPeriods: 1,
      orderIndex: index,
      rawText: '',
      originalYccd: '',
      status: 'error',
      statusMessage: 'Lỗi khi đọc file DOCX: ' + (err.message || 'Tệp có thể bị hỏng hoặc có mật khẩu bảo vệ'),
    };
  }
}

/**
 * Detect subject name from file name or raw text of lesson plan
 */
export function detectSubjectFromContext(fileName: string, rawText: string): string | undefined {
  const combined = `${fileName}\n${rawText.slice(0, 3000)}`;

  // 1. Direct Regex match for Môn: [Tên môn]
  const subjectMatch = rawText.slice(0, 2500).match(/(?:MÔN(?:\s*HỌC)?|Môn(?:\s*học)?|BỘ MÔN|Bộ môn)\s*[:：\-]\s*([0-9A-Za-zÀ-ỹ\s&]+?)(?:[\r\n\t,–\-;]|Lớp|Khối|Tiết|Bài|$)/i);
  if (subjectMatch && subjectMatch[1]) {
    const rawSubj = subjectMatch[1].trim();
    if (rawSubj.length >= 2 && rawSubj.length <= 40) {
      // Clean up common prefixes
      const cleaned = rawSubj.replace(/^(học|hoc)\s+/i, '').trim();
      if (cleaned) {
        // Normalize known subject casing
        const lower = cleaned.toLowerCase();
        if (lower.includes('toán') || lower.includes('toan')) return 'Toán';
        if (lower.includes('tiếng việt') || lower.includes('tieng viet')) return 'Tiếng Việt';
        if (lower.includes('tiếng anh') || lower.includes('tieng anh') || lower.includes('english')) return 'Tiếng Anh';
        if (lower.includes('khoa học') || lower.includes('khoa hoc')) return 'Khoa học';
        if (lower.includes('lịch sử') || lower.includes('địa lí') || lower.includes('địa lý')) return 'Lịch sử và Địa lí';
        if (lower.includes('tin học') || lower.includes('tin hoc')) return 'Tin học';
        if (lower.includes('công nghệ') || lower.includes('cong nghe')) return 'Công nghệ';
        if (lower.includes('đạo đức') || lower.includes('dao duc')) return 'Đạo đức';
        if (lower.includes('mĩ thuật') || lower.includes('mỹ thuật')) return 'Mĩ thuật';
        if (lower.includes('âm nhạc') || lower.includes('am nhac')) return 'Âm nhạc';
        if (lower.includes('hoạt động trải nghiệm') || lower.includes('trải nghiệm')) return 'Hoạt động trải nghiệm';
        if (lower.includes('thể chất') || lower.includes('gdtc')) return 'Giáo dục thể chất';
        if (lower.includes('tự nhiên và xã hội') || lower.includes('tn&xh') || lower.includes('tnxh')) return 'Tự nhiên và Xã hội';
        return cleaned;
      }
    }
  }

  // 2. Keyword scan across fileName and combined text
  const checkText = combined.toLowerCase();

  if (/\b(?:tiếng việt|tieng viet|t\.việt|tv4|tv1|tv2|tv3|tv5)\b/i.test(checkText)) return 'Tiếng Việt';
  if (/\b(?:toán|toan|toan4|toan1|toan2|toan3|toan5)\b/i.test(checkText)) return 'Toán';
  if (/\b(?:tiếng anh|tieng anh|english)\b/i.test(checkText)) return 'Tiếng Anh';
  if (/\b(?:khoa học|khoa hoc)\b/i.test(checkText)) return 'Khoa học';
  if (/\b(?:lịch sử và địa lí|lịch sử và địa lý|lich su|dia li|ls&đl)\b/i.test(checkText)) return 'Lịch sử và Địa lí';
  if (/\b(?:tin học|tin hoc|tinhoc)\b/i.test(checkText)) return 'Tin học';
  if (/\b(?:công nghệ|cong nghe|congnghe)\b/i.test(checkText)) return 'Công nghệ';
  if (/\b(?:đạo đức|dao duc|daoduc)\b/i.test(checkText)) return 'Đạo đức';
  if (/\b(?:mĩ thuật|mỹ thuật|mi thuat|my thuat)\b/i.test(checkText)) return 'Mĩ thuật';
  if (/\b(?:âm nhạc|am nhac|amnhac)\b/i.test(checkText)) return 'Âm nhạc';
  if (/\b(?:hoạt động trải nghiệm|trải nghiệm|hđtn|hdtn)\b/i.test(checkText)) return 'Hoạt động trải nghiệm';
  if (/\b(?:giáo dục thể chất|thể chất|gdtc)\b/i.test(checkText)) return 'Giáo dục thể chất';
  if (/\b(?:tự nhiên và xã hội|tn&xh|tnxh)\b/i.test(checkText)) return 'Tự nhiên và Xã hội';

  return undefined;
}

/**
 * Detect grade and class name from filename or text
 */
export function detectClassAndGrade(
  fileName: string,
  rawText: string
): { detectedGrade?: string; detectedClass?: string } {
  const combined = `${fileName}\n${rawText.slice(0, 2000)}`;

  let detectedClass: string | undefined = undefined;
  let detectedGrade: string | undefined = undefined;

  // Match: Lớp: 4A1, Lớp 4A, Lớp: 4/1, Lop 4A1
  const classMatch = combined.match(/(?:Lớp|LỚP|lớp|Lop|lop)\s*[:：\-]?\s*([1-5][A-Za-z0-9\/\.\-_]*)/i);
  if (classMatch && classMatch[1]) {
    detectedClass = classMatch[1].trim();
  }

  // Match grade: Khối 4, Khối lớp: 4
  const gradeMatch = combined.match(/(?:Khối(?:\s*lớp)?|KHỐI)\s*[:：\-]?\s*([1-5])/i);
  if (gradeMatch && gradeMatch[1]) {
    detectedGrade = gradeMatch[1];
  } else if (detectedClass && /^[1-5]/.test(detectedClass)) {
    detectedGrade = detectedClass.charAt(0);
  }

  return { detectedGrade, detectedClass };
}

/**
 * Detect primary school name from text
 */
export function detectSchoolFromText(rawText: string): string | undefined {
  const headerPart = rawText.slice(0, 2000);
  const schoolMatch = headerPart.match(
    /(?:Trường\s+Tiểu\s+học|TRƯỜNG\s+TIỂU\s+HỌC|Trường\s+TH|TRƯỜNG\s+TH)\s+([A-Za-zÀ-ỹ0-9\s\.\-]+?)(?:[\r\n,–\-]|$)/i
  );
  if (schoolMatch && schoolMatch[1]) {
    const name = schoolMatch[1].trim();
    if (name.length > 2 && name.length < 50) {
      return `Trường Tiểu học ${name}`;
    }
  }
  return undefined;
}
