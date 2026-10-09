import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  PageBreak,
} from 'docx';
import {
  LessonPlanFile,
  TimetableConfig,
  LessonDateSummary,
  ExportSettings,
} from '../types';

// Convert cm to twips (1 inch = 2.54 cm = 1440 twips => 1 cm ≈ 567 twips)
function cmToTwips(cm: number): number {
  return Math.round(cm * 567);
}

// Helper to parse colored text runs from HTML/tags:
// <span color="#FF0000">...</span> or <span color="#0000FF">...</span>
export function parseStyledTextRuns(
  text: string,
  fontFamily: string,
  fontSizePt: number
): TextRun[] {
  const runs: TextRun[] = [];
  const regex = /<span\s+color=["'](#(?:FF0000|0000FF|[0-9A-Fa-f]{6}))["']>([\s\S]*?)<\/span>/gi;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const normalPart = text.slice(lastIndex, match.index);
      if (normalPart) {
        runs.push(
          new TextRun({
            text: normalPart,
            font: fontFamily,
            size: fontSizePt * 2, // docx uses half-points
            color: '000000',
          })
        );
      }
    }

    const hexColor = match[1].replace('#', '').toUpperCase();
    const coloredText = match[2];
    runs.push(
      new TextRun({
        text: coloredText,
        font: fontFamily,
        size: fontSizePt * 2,
        bold: true,
        color: hexColor,
      })
    );

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    const trailingPart = text.slice(lastIndex);
    if (trailingPart) {
      runs.push(
        new TextRun({
          text: trailingPart,
          font: fontFamily,
          size: fontSizePt * 2,
          color: '000000',
        })
      );
    }
  }

  if (runs.length === 0) {
    runs.push(
      new TextRun({
        text: text,
        font: fontFamily,
        size: fontSizePt * 2,
        color: '000000',
      })
    );
  }

  return runs;
}

export async function generateDocxBlob(
  files: LessonPlanFile[],
  config: TimetableConfig,
  summaries: Map<string, LessonDateSummary>,
  settings: ExportSettings
): Promise<Blob> {
  const fontFamily = settings.fontFamily || 'Times New Roman';
  const fontSize = settings.fontSize || 14;

  // Filter files by week if splitMode is by_week_range
  let exportFiles = [...files];
  if (settings.splitMode === 'by_week_range') {
    exportFiles = exportFiles.filter(
      (f) => f.detectedWeek >= settings.fromWeek && f.detectedWeek <= settings.toWeek
    );
  }

  // Sort files by week & order
  exportFiles.sort((a, b) => {
    if (a.detectedWeek !== b.detectedWeek) return a.detectedWeek - b.detectedWeek;
    return a.orderIndex - b.orderIndex;
  });

  const children: (Paragraph | Table)[] = [];

  // Iterate over each lesson
  exportFiles.forEach((file, index) => {
    if (index > 0 && settings.pageBreakPerLesson) {
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
    }

    const summary = summaries.get(file.id);
    const dateString = summary ? summary.formattedDateString : `${config.dateLabel}: Chưa xếp ngày`;

    // 1. Header: School & Department Info
    if (settings.includeSchoolHeader) {
      const headerTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
          insideHorizontal: { style: BorderStyle.NONE },
          insideVertical: { style: BorderStyle.NONE },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: (config.schoolName || 'TRƯỜNG TIỂU HỌC').toUpperCase(),
                        font: fontFamily,
                        bold: true,
                        size: (fontSize - 1) * 2,
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: `Khối lớp: ${config.grade || '4'} - Lớp: ${config.className || ''}`,
                        font: fontFamily,
                        size: (fontSize - 1) * 2,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
                        font: fontFamily,
                        bold: true,
                        size: (fontSize - 2) * 2,
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        text: 'Độc lập - Tự do - Hạnh phúc',
                        font: fontFamily,
                        bold: true,
                        size: (fontSize - 2) * 2,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      });
      children.push(headerTable);

      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [],
        })
      );
    }

    // 2. Lesson Title
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 80 },
        children: [
          new TextRun({
            text: `KẾ HOẠCH BÀI DẠY - TUẦN ${file.detectedWeek}`,
            font: fontFamily,
            bold: true,
            size: fontSize * 2,
          }),
        ],
      })
    );

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: `MÔN: ${config.subject.toUpperCase() || 'MÔN HỌC'}`,
            font: fontFamily,
            bold: true,
            size: (fontSize + 1) * 2,
          }),
        ],
      })
    );

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: file.detectedTitle.toUpperCase(),
            font: fontFamily,
            bold: true,
            size: (fontSize + 2) * 2,
          }),
        ],
      })
    );

    // 3. Metadata line: Thời lượng & Ngày dạy
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: `(Thời lượng: ${file.detectedPeriods} tiết)   •   `,
            font: fontFamily,
            italics: true,
            size: fontSize * 2,
          }),
          new TextRun({
            text: dateString,
            font: fontFamily,
            bold: true,
            italics: true,
            size: fontSize * 2,
          }),
        ],
      })
    );

    // 4. Section I: YÊU CẦU CẦN ĐẠT
    children.push(
      new Paragraph({
        spacing: { before: 160, after: 80 },
        children: [
          new TextRun({
            text: 'I. YÊU CẦU CẦN ĐẠT:',
            font: fontFamily,
            bold: true,
            size: fontSize * 2,
          }),
        ],
      })
    );

    const yccdContent = file.transformedYccd || file.originalYccd || 'Chưa có thông tin.';
    const yccdParagraphs = yccdContent.split('\n');
    for (const p of yccdParagraphs) {
      if (p.trim()) {
        const styledRuns = parseStyledTextRuns(p, fontFamily, fontSize);
        children.push(
          new Paragraph({
            spacing: { after: 60, line: 320 },
            children: styledRuns,
          })
        );
      }
    }

    // 5. Section II: ĐỒ DÙNG DẠY HỌC
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 80 },
        children: [
          new TextRun({
            text: 'II. ĐỒ DÙNG DẠY HỌC:',
            font: fontFamily,
            bold: true,
            size: fontSize * 2,
          }),
        ],
      })
    );

    children.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({
            text: '1. Giáo viên: Kế hoạch bài dạy, bài giảng điện tử trình chiếu, thiết bị dạy học số (nếu có), tranh ảnh minh họa.',
            font: fontFamily,
            size: fontSize * 2,
          }),
        ],
      })
    );
    children.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: '2. Học sinh: Sách giáo khoa, vở ghi, đồ dùng học tập cá nhân.',
            font: fontFamily,
            size: fontSize * 2,
          }),
        ],
      })
    );

    // 6. Section III: CÁC HOẠT ĐỘNG DẠY HỌC CHỦ YẾU (Bảng 2 cột chuẩn sư phạm)
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({
            text: 'III. CÁC HOẠT ĐỘNG DẠY HỌC CHỦ YẾU:',
            font: fontFamily,
            bold: true,
            size: fontSize * 2,
          }),
        ],
      })
    );

    // Two-column pedagogical table
    const tableBorderConfig = {
      style: BorderStyle.SINGLE,
      size: 6,
      color: '888888',
    };

    const activities = file.activitiesTable && file.activitiesTable.length > 0
      ? file.activitiesTable
      : [
          {
            stepName: '1. Khởi động (3 - 5 phút)',
            teacherActivities: '- GV tổ chức trò chơi kết nối hoặc đặt câu hỏi tình huống thực tế.\n- GV dẫn dắt vào bài mới.',
            studentActivities: '- HS tích cực tham gia trò chơi theo hướng dẫn.\n- HS chia sẻ câu trả lời và chuẩn bị tâm thế học tập.',
          },
          {
            stepName: '2. Khám phá (12 - 15 phút)',
            teacherActivities: '- GV hướng dẫn học sinh đọc tài liệu, quan sát hình ảnh/video.\n- GV tổ chức thảo luận nhóm, giao nhiệm vụ cụ thể.\n- Hướng dẫn học sinh vận dụng năng lực tự học.',
            studentActivities: '- HS quan sát, trao đổi nhóm đôi/nhóm bốn.\n- Đại diện nhóm trình bày ý kiến, các nhóm khác lắng nghe và nhận xét.',
          },
          {
            stepName: '3. Luyện tập, thực hành (10 - 12 phút)',
            teacherActivities: '- GV giao bài tập thực hành theo mức độ phân hóa.\n- Quan sát, hỗ trợ các học sinh gặp khó khăn.',
            studentActivities: '- HS tự lực làm bài vào vở hoặc phiếu học tập.\n- Đổi vở chấm chéo hoặc chia sẻ trước lớp.',
          },
          {
            stepName: '4. Vận dụng (3 - 5 phút)',
            teacherActivities: '- Hướng dẫn học sinh liên hệ thực tế cuộc sống xung quanh.\n- Nhận xét tiết học, dặn dò chuẩn bị bài sau.',
            studentActivities: '- Nêu ví dụ vận dụng bài học vào đời sống.\n- Lắng nghe dặn dò của giáo viên.',
          },
        ];

    const tableRows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { fill: 'F1F5F9' },
            borders: {
              top: tableBorderConfig,
              bottom: tableBorderConfig,
              left: tableBorderConfig,
              right: tableBorderConfig,
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'HOẠT ĐỘNG CỦA GIÁO VIÊN',
                    font: fontFamily,
                    bold: true,
                    size: fontSize * 2,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { fill: 'F1F5F9' },
            borders: {
              top: tableBorderConfig,
              bottom: tableBorderConfig,
              left: tableBorderConfig,
              right: tableBorderConfig,
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'HOẠT ĐỘNG CỦA HỌC SINH',
                    font: fontFamily,
                    bold: true,
                    size: fontSize * 2,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ];

    activities.forEach((act) => {
      // Step banner row across table
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 2,
              shading: { fill: 'FAFAFA' },
              borders: {
                top: tableBorderConfig,
                bottom: tableBorderConfig,
                left: tableBorderConfig,
                right: tableBorderConfig,
              },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: act.stepName,
                      font: fontFamily,
                      bold: true,
                      size: fontSize * 2,
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      );

      // Split activities text into paragraphs
      const tParas = act.teacherActivities.split('\n').filter(Boolean).map(
        (line) =>
          new Paragraph({
            spacing: { after: 60, line: 280 },
            children: parseStyledTextRuns(line, fontFamily, fontSize),
          })
      );
      const sParas = act.studentActivities.split('\n').filter(Boolean).map(
        (line) =>
          new Paragraph({
            spacing: { after: 60, line: 280 },
            children: parseStyledTextRuns(line, fontFamily, fontSize),
          })
      );

      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: {
                top: tableBorderConfig,
                bottom: tableBorderConfig,
                left: tableBorderConfig,
                right: tableBorderConfig,
              },
              children: tParas.length > 0 ? tParas : [new Paragraph({})],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: {
                top: tableBorderConfig,
                bottom: tableBorderConfig,
                left: tableBorderConfig,
                right: tableBorderConfig,
              },
              children: sParas.length > 0 ? sParas : [new Paragraph({})],
            }),
          ],
        })
      );
    });

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows,
      })
    );

    // 7. Section IV: ĐIỀU CHỈNH SAU BÀI DẠY
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 60 },
        children: [
          new TextRun({
            text: 'IV. ĐIỀU CHỈNH SAU BÀI DẠY:',
            font: fontFamily,
            bold: true,
            size: fontSize * 2,
          }),
        ],
      })
    );
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: '....................................................................................................................................................................................',
            font: fontFamily,
            size: fontSize * 2,
          }),
        ],
      })
    );

    // 8. Approval Signatures (Ký duyệt)
    if (settings.includeSignatures) {
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 33, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: 'DUYỆT CỦA BGH',
                          font: fontFamily,
                          bold: true,
                          size: (fontSize - 1) * 2,
                        }),
                      ],
                    }),
                    new Paragraph({
                      spacing: { before: 600 },
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: '....................................',
                          font: fontFamily,
                          size: (fontSize - 1) * 2,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 34, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: 'TỔ TRƯỞNG CHUYÊN MÔN',
                          font: fontFamily,
                          bold: true,
                          size: (fontSize - 1) * 2,
                        }),
                      ],
                    }),
                    new Paragraph({
                      spacing: { before: 600 },
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: '....................................',
                          font: fontFamily,
                          size: (fontSize - 1) * 2,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 33, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: 'GIÁO VIÊN SOẠN BÀI',
                          font: fontFamily,
                          bold: true,
                          size: (fontSize - 1) * 2,
                        }),
                      ],
                    }),
                    new Paragraph({
                      spacing: { before: 600 },
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({
                          text: config.teacherName || '....................................',
                          font: fontFamily,
                          bold: true,
                          size: (fontSize - 1) * 2,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
      );
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: cmToTwips(settings.margins.top),
              bottom: cmToTwips(settings.margins.bottom),
              left: cmToTwips(settings.margins.left),
              right: cmToTwips(settings.margins.right),
            },
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  return buffer;
}
