import {
  LessonPlanFile,
  TimetableConfig,
  LessonDateSummary,
  ExportSettings,
} from '../types';

export function generatePrintableHtml(
  files: LessonPlanFile[],
  config: TimetableConfig,
  summaries: Map<string, LessonDateSummary>,
  settings: ExportSettings,
  customTitle?: string
): string {
  const fontFamily = settings.fontFamily || 'Times New Roman';
  const fontSize = settings.fontSize || 14;

  let exportFiles = [...files];
  if (settings.splitMode === 'by_week_range') {
    exportFiles = exportFiles.filter(
      (f) => f.detectedWeek >= settings.fromWeek && f.detectedWeek <= settings.toWeek
    );
  }

  exportFiles.sort((a, b) => {
    if (a.detectedWeek !== b.detectedWeek) return a.detectedWeek - b.detectedWeek;
    return a.orderIndex - b.orderIndex;
  });

  const lessonsHtml = exportFiles
    .map((file, idx) => {
      const summary = summaries.get(file.id);
      const dateString = summary ? summary.formattedDateString : `${config.dateLabel}: Chưa xếp ngày`;
      const yccdContent = file.transformedYccd || file.originalYccd || 'Chưa có thông tin.';

      // Process color spans
      const formattedYccd = yccdContent
        .replace(/<span\s+color=["']#FF0000["']>([\s\S]*?)<\/span>/gi, '<span style="color: #FF0000; font-weight: 600;">$1</span>')
        .replace(/<span\s+color=["']#0000FF["']>([\s\S]*?)<\/span>/gi, '<span style="color: #0000FF; font-weight: 600;">$1</span>')
        .split('\n')
        .filter((l) => l.trim())
        .map((l) => `<p style="margin: 4px 0; line-height: 1.5;">${l}</p>`)
        .join('');

      const activities = file.activitiesTable && file.activitiesTable.length > 0
        ? file.activitiesTable
        : [
            {
              stepName: '1. Khởi động (3 - 5 phút)',
              teacherActivities: '- GV tổ chức trò chơi hoặc khởi động vui tươi.<br>- Kết nối bài học mới.',
              studentActivities: '- HS tham gia sôi nổi.<br>- Lắng nghe và tiếp nhận nhiệm vụ.',
            },
            {
              stepName: '2. Khám phá (12 - 15 phút)',
              teacherActivities: '- GV hướng dẫn học sinh đọc tài liệu, quan sát tranh ảnh.<br>- Giao nhiệm vụ thảo luận nhóm.',
              studentActivities: '- HS quan sát, trao đổi nhóm đôi.<br>- Đại diện phát biểu ý kiến.',
            },
            {
              stepName: '3. Luyện tập, thực hành (10 - 12 phút)',
              teacherActivities: '- Giao bài tập cho học sinh.<br>- Quan sát, hỗ trợ học sinh còn lúng túng.',
              studentActivities: '- HS hoàn thành bài tập vào vở.<br>- Nhận xét bài của bạn.',
            },
            {
              stepName: '4. Vận dụng (3 - 5 phút)',
              teacherActivities: '- Hướng dẫn học sinh liên hệ thực tế.<br>- Nhận xét tiết dạy.',
              studentActivities: '- Nêu ví dụ vận dụng bài học vào đời sống.<br>- Ghi nhớ dặn dò.',
            },
          ];

      const activitiesRows = activities
        .map(
          (act) => `
          <tr style="background-color: #f8fafc;">
            <td colspan="2" style="padding: 6px 10px; font-weight: bold; border: 1px solid #475569;">${act.stepName}</td>
          </tr>
          <tr>
            <td style="width: 50%; vertical-align: top; padding: 8px 10px; border: 1px solid #475569; line-height: 1.4;">${act.teacherActivities.replace(/\n/g, '<br>')}</td>
            <td style="width: 50%; vertical-align: top; padding: 8px 10px; border: 1px solid #475569; line-height: 1.4;">${act.studentActivities.replace(/\n/g, '<br>')}</td>
          </tr>
        `
        )
        .join('');

      const pageBreakStyle = idx > 0 && settings.pageBreakPerLesson ? 'page-break-before: always;' : '';

      return `
        <div class="lesson-container" style="${pageBreakStyle} margin-bottom: 30px;">
          ${
            settings.includeSchoolHeader
              ? `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
              <tr>
                <td style="width: 50%; text-align: center; vertical-align: top;">
                  <strong style="font-size: ${fontSize - 1}pt;">${(config.schoolName || 'TRƯỜNG TIỂU HỌC').toUpperCase()}</strong><br>
                  <span style="font-size: ${fontSize - 1}pt;">Khối lớp: ${config.grade || '4'} - Lớp: ${config.className || ''}</span>
                </td>
                <td style="width: 50%; text-align: center; vertical-align: top;">
                  <strong style="font-size: ${fontSize - 2}pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br>
                  <span style="font-size: ${fontSize - 2}pt; font-weight: 500;">Độc lập - Tự do - Hạnh phúc</span>
                </td>
              </tr>
            </table>
          `
              : ''
          }

          <div style="text-align: center; margin: 15px 0;">
            <h3 style="margin: 0; font-size: ${fontSize}pt; font-weight: bold;">KẾ HOẠCH BÀI DẠY - TUẦN ${file.detectedWeek}</h3>
            <h2 style="margin: 4px 0; font-size: ${fontSize + 1}pt; font-weight: bold;">MÔN: ${(config.subject || 'MÔN HỌC').toUpperCase()}</h2>
            <h1 style="margin: 6px 0; font-size: ${fontSize + 2}pt; font-weight: bold; text-transform: uppercase;">${file.detectedTitle}</h1>
            <p style="margin: 4px 0; font-style: italic; font-size: ${fontSize}pt;">
              (Thời lượng: ${file.detectedPeriods} tiết) &nbsp; • &nbsp; <strong>${dateString}</strong>
            </p>
          </div>

          <div style="margin: 15px 0;">
            <h4 style="margin: 8px 0; font-size: ${fontSize}pt; font-weight: bold;">I. YÊU CẦU CẦN ĐẠT:</h4>
            ${formattedYccd}
          </div>

          <div style="margin: 15px 0;">
            <h4 style="margin: 8px 0; font-size: ${fontSize}pt; font-weight: bold;">II. ĐỒ DÙNG DẠY HỌC:</h4>
            <p style="margin: 4px 0;"><strong>1. Giáo viên:</strong> Kế hoạch bài dạy, bài giảng điện tử trình chiếu, thiết bị dạy học số, tranh ảnh minh họa.</p>
            <p style="margin: 4px 0;"><strong>2. Học sinh:</strong> Sách giáo khoa, vở ghi, đồ dùng học tập cá nhân.</p>
          </div>

          <div style="margin: 15px 0;">
            <h4 style="margin: 8px 0; font-size: ${fontSize}pt; font-weight: bold;">III. CÁC HOẠT ĐỘNG DẠY HỌC CHỦ YẾU:</h4>
            <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
              <thead>
                <tr style="background-color: #f1f5f9;">
                  <th style="width: 50%; padding: 8px; border: 1px solid #475569; text-align: center; font-size: ${fontSize}pt;">HOẠT ĐỘNG CỦA GIÁO VIÊN</th>
                  <th style="width: 50%; padding: 8px; border: 1px solid #475569; text-align: center; font-size: ${fontSize}pt;">HOẠT ĐỘNG CỦA HỌC SINH</th>
                </tr>
              </thead>
              <tbody>
                ${activitiesRows}
              </tbody>
            </table>
          </div>

          <div style="margin: 15px 0;">
            <h4 style="margin: 8px 0; font-size: ${fontSize}pt; font-weight: bold;">IV. ĐIỀU CHỈNH SAU BÀI DẠY:</h4>
            <p style="margin: 4px 0;">....................................................................................................................................................................................</p>
          </div>

          ${
            settings.includeSignatures
              ? `
            <table style="width: 100%; border-collapse: collapse; margin-top: 25px;">
              <tr>
                <td style="width: 33%; text-align: center; vertical-align: top;">
                  <strong style="font-size: ${fontSize - 1}pt;">DUYỆT CỦA BGH</strong><br><br><br><br>
                  <span>....................................</span>
                </td>
                <td style="width: 34%; text-align: center; vertical-align: top;">
                  <strong style="font-size: ${fontSize - 1}pt;">TỔ TRƯỞNG CHUYÊN MÔN</strong><br><br><br><br>
                  <span>....................................</span>
                </td>
                <td style="width: 33%; text-align: center; vertical-align: top;">
                  <strong style="font-size: ${fontSize - 1}pt;">GIÁO VIÊN SOẠN BÀI</strong><br><br><br><br>
                  <strong>${config.teacherName || '....................................'}</strong>
                </td>
              </tr>
            </table>
          `
              : ''
          }
        </div>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>${customTitle || `Kế hoạch bài dạy - ${config.subject} ${config.className}`}</title>
      <style>
        @page {
          size: A4 portrait;
          margin-top: ${settings.margins.top}cm;
          margin-bottom: ${settings.margins.bottom}cm;
          margin-left: ${settings.margins.left}cm;
          margin-right: ${settings.margins.right}cm;
        }
        body {
          font-family: '${fontFamily}', 'Times New Roman', serif;
          font-size: ${fontSize}pt;
          line-height: 1.45;
          color: #000000;
          margin: 0;
          padding: 10px;
          background: #ffffff;
        }
        p {
          margin: 4px 0;
          text-align: justify;
        }
        table {
          font-family: '${fontFamily}', 'Times New Roman', serif;
        }
        @media print {
          body {
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      ${lessonsHtml}
    </body>
    </html>
  `;
}

// Function to trigger clean vector PDF printing in browser
export function triggerPrintPdf(htmlContent: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Trình duyệt đã chặn cửa sổ in ấn. Vui lòng cho phép popup để xuất PDF.');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Wait for resources to load, then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };
}
