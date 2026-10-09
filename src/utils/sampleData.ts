import {
  LessonPlanFile,
  TimetableConfig,
  YccdTemplate,
  ExportSettings,
} from '../types';

export const DEFAULT_TEMPLATES: YccdTemplate[] = [
  {
    id: 'cv_2345',
    name: 'Mẫu chuẩn Công văn 2345/BGDĐT-GDTH',
    source: 'Bộ Giáo dục và Đào tạo',
    description: 'Mẫu kế hoạch bài dạy chuẩn quốc gia áp dụng cho toàn bộ cấp tiểu học theo Chương trình GDPT 2018.',
    defaultStructure: `I. YÊU CẦU CẦN ĐẠT:
1. Về phẩm chất và năng lực:
- Qua bài học, học sinh thực hiện được:
- Học sinh vận dụng bài học trong thực tế cuộc sống:
- Giúp các em hình thành và phát triển phẩm chất:
  + Yêu nước, nhân ái, chăm chỉ, trung thực, trách nhiệm.
- Giúp các em hình thành và phát triển năng lực:
  + Năng lực chung: Tự chủ và tự học, giao tiếp và hợp tác, giải quyết vấn đề và sáng tạo.
  + Năng lực đặc thù: Năng lực ngôn ngữ/toán học/tin học theo bài dạy.
2. Nội dung tích hợp:
- Tích hợp năng lực số (chữ đỏ #FF0000 nếu có):
- Tích hợp năng lực AI (chữ xanh dương #0000FF nếu có):
- Tích hợp giáo dục quyền trẻ em, bảo vệ môi trường, giáo dục địa phương.`,
    sections: [
      {
        title: 'Mục tiêu thực hiện được',
        placeholder: 'Qua bài học, học sinh thực hiện được những kiến thức, kỹ năng cơ bản...',
      },
      {
        title: 'Vận dụng thực tế cuộc sống',
        placeholder: 'Học sinh vận dụng kiến thức bài học vào sinh hoạt và học tập hàng ngày...',
      },
      {
        title: 'Hình thành và phát triển phẩm chất',
        placeholder: 'Bồi dưỡng các phẩm chất: chăm chỉ, nhân ái, trung thực, trách nhiệm...',
      },
      {
        title: 'Hình thành và phát triển năng lực',
        placeholder: 'Rèn luyện năng lực chung và năng lực đặc thù của môn học...',
      },
      {
        title: 'Nội dung tích hợp',
        placeholder: 'Nội dung tích hợp năng lực số (#FF0000), năng lực AI (#0000FF),...',
      },
    ],
  },
  {
    id: 'cv_2345_english',
    name: 'Primary English Lesson Plan (CV 2345 Bilingual)',
    source: 'Ministry of Education and Training',
    description: 'Standard objectives template tailored for Primary English subject with bilingual capability.',
    defaultStructure: `I. OBJECTIVES / YÊU CẦU CẦN ĐẠT:
By the end of the lesson, pupils will be able to:
1. Language knowledge & skills:
- Identify and produce key vocabulary and sentence structures accurately.
- Apply English phrases in daily classroom and real-life communication.
2. Core competencies:
- Communication and collaboration: practice pair work and group speaking.
- Self-control and independent learning: complete listening and reading tasks.
3. Integrated competencies:
- Digital competency (<span color="#FF0000">Pupils use digital audio/apps to practice listening</span>).
- AI competency (<span color="#0000FF">Pupils interact with simple AI voice recognition tool</span>).
4. Qualities:
- Build confidence, friendliness, and respect in cross-cultural communication.`,
    sections: [
      {
        title: 'Language Knowledge & Skills',
        placeholder: 'Pupils will be able to recognize vocabulary and sentence patterns...',
      },
      {
        title: 'Real-life Application',
        placeholder: 'Use language functions in daily situations...',
      },
      {
        title: 'Core Competencies',
        placeholder: 'Autonomy, communication, problem solving...',
      },
      {
        title: 'Integrated Competencies',
        placeholder: 'Digital competence (#FF0000), AI competence (#0000FF)...',
      },
    ],
  },
];

export const INITIAL_TIMETABLE_CONFIG: TimetableConfig = {
  schoolName: 'Trường Tiểu học Kim Đồng',
  teacherName: 'Nguyễn Thị Minh Hạnh',
  className: '4A1',
  subject: 'Tiếng Việt',
  grade: '4',
  schoolYear: '2026 - 2027',
  termStartMonday: '2026-09-07', // Thứ Hai tuần 1 năm học 2026-2027
  totalWeeks: 35,
  weeklySlots: [
    {
      id: 'ws_1',
      dayOfWeek: 2, // Thứ Hai
      session: 'morning',
      period: 2,
      timeRange: '08:15 - 08:50',
    },
    {
      id: 'ws_2',
      dayOfWeek: 3, // Thứ Ba
      session: 'morning',
      period: 1,
      timeRange: '07:30 - 08:05',
    },
    {
      id: 'ws_3',
      dayOfWeek: 4, // Thứ Tư
      session: 'morning',
      period: 3,
      timeRange: '09:05 - 09:40',
    },
    {
      id: 'ws_4',
      dayOfWeek: 5, // Thứ Năm
      session: 'morning',
      period: 2,
      timeRange: '08:15 - 08:50',
    },
  ],
  specialDates: [
    {
      id: 'sd_1',
      date: '2026-10-20',
      type: 'holiday',
      name: 'Kỷ niệm Ngày Phụ nữ Việt Nam (Sinh hoạt chuyên đề)',
      isTentative: false,
    },
    {
      id: 'sd_2',
      date: '2026-11-20',
      type: 'holiday',
      name: 'Kỷ niệm Ngày Nhà giáo Việt Nam 20/11',
      isTentative: false,
    },
    {
      id: 'sd_3',
      date: '2026-12-29',
      type: 'exam',
      name: 'Kiểm tra định kỳ cuối Học kỳ 1',
      isTentative: true, // Đánh dấu tạm tính theo yêu cầu
    },
    {
      id: 'sd_4',
      date: '2027-01-01',
      type: 'holiday',
      name: 'Nghỉ Tết Dương lịch 2027',
      isTentative: false,
    },
    {
      id: 'sd_5',
      date: '2027-02-08',
      type: 'tet',
      name: 'Nghỉ Tết Nguyên đán Đinh Mùi (Bắt đầu)',
      isTentative: false,
    },
    {
      id: 'sd_6',
      date: '2026-10-24',
      type: 'makeup',
      name: 'Dạy bù cho buổi chuyên đề ngày 20/10',
      isTentative: false,
      makeupForDate: '2026-10-20',
    },
  ],
  rolloverMode: 'fixed_week',
  dateLabel: 'Ngày dạy',
  dateFormatStyle: 'standard',
  multiPeriodSameDayPreference: false,
};

export const INITIAL_EXPORT_SETTINGS: ExportSettings = {
  fontFamily: 'Times New Roman',
  fontSize: 14,
  margins: {
    top: 2.0,
    bottom: 2.0,
    left: 3.0,
    right: 1.5,
  },
  includeSignatures: true,
  removeImages: false,
  pageBreakPerLesson: true,
  splitMode: 'all',
  fromWeek: 1,
  toWeek: 5,
  includeSchoolHeader: true,
};

export const SAMPLE_LESSON_FILES: LessonPlanFile[] = [
  {
    id: 'sample_tv4_w5',
    fileName: 'KHBD_TiengViet4_Tuan5_MotGiotNuocBien.docx',
    fileSize: 245760,
    detectedWeek: 5,
    detectedTitle: 'BÀI: MỘT GIỌT NƯỚC BIỂN',
    detectedPeriods: 2,
    detectedSubject: 'Tiếng Việt',
    detectedGrade: '4',
    orderIndex: 0,
    rawText: `KẾ HOẠCH BÀI DẠY - TUẦN 5
Môn: Tiếng Việt 4
BÀI: MỘT GIỌT NƯỚC BIỂN (Thời lượng: 2 tiết)

I. YÊU CẦU CẦN ĐẠT:
1. Về phẩm chất và năng lực:
- Qua bài học, học sinh đọc đúng từ ngữ, câu văn trong bài; hiểu được vẻ đẹp kỳ diệu của đại dương và sự tuần hoàn của giọt nước biển.
- Vận dụng bài học trong thực tế cuộc sống: Biết bảo vệ nguồn nước sạch, không xả rác bừa bãi ra sông suối, ao hồ, biển cả.
- Phẩm chất: Yêu thiên nhiên, có ý thức bảo vệ môi trường biển đảo quê hương.
- Năng lực ngôn ngữ: Đọc diễn cảm, phát triển vốn từ ngữ về thiên nhiên đại dương.
- Năng lực tự chủ và tự học: Tự giác tìm hiểu câu hỏi đọc hiểu trong sách giáo khoa.
2. Nội dung tích hợp:
- Tích hợp bảo vệ môi trường và chủ quyền biển đảo Việt Nam.`,
    originalYccd: `I. YÊU CẦU CẦN ĐẠT:
1. Về phẩm chất và năng lực:
- Đọc đúng từ ngữ, hiểu được vẻ đẹp của giọt nước biển và sự tuần hoàn của nước.
- Vận dụng bài học trong thực tế: Bảo vệ nguồn nước sạch xung quanh em.
- Phẩm chất: Yêu quý thiên nhiên, bảo vệ môi trường.
- Năng lực: Năng lực ngôn ngữ, giao tiếp hợp tác khi chia sẻ với bạn.
2. Nội dung tích hợp:
- Tích hợp giáo dục môi trường.`,
    transformedYccd: `I. YÊU CẦU CẦN ĐẠT:
Qua bài học, học sinh thực hiện được:
- Đọc trôi chảy toàn bài, ngắt nghỉ đúng dấu câu; nhận biết được hành trình tuần hoàn kỳ thú của giọt nước biển.
Học sinh vận dụng bài học trong thực tế cuộc sống:
- Thực hành thói quen tiết kiệm nước sạch tại trường học và gia đình; nhắc nhở bạn bè không vứt rác thải nhựa ra kênh rạch, bờ biển.
Giúp các em hình thành và phát triển phẩm chất:
- Yêu nước: Tự hào về vẻ đẹp biển đảo quê hương Việt Nam.
- Trách nhiệm: Giữ gìn và bảo vệ nguồn nước sạch và môi trường sống.
Giúp các em hình thành và phát triển năng lực:
- Năng lực ngôn ngữ: Diễn đạt cảm xúc về thiên nhiên, mở rộng vốn từ chủ đề Biển đảo.
- Năng lực tự chủ và tự học: Chủ động tra cứu hình ảnh hoặc tư liệu về đại dương.
Nội dung tích hợp:
- Tích hợp năng lực số: <span color="#FF0000">Học sinh biết tìm kiếm hình ảnh các sinh vật biển trên kho học liệu số an toàn</span> dưới sự hướng dẫn của giáo viên.
- Giáo dục bảo vệ môi trường và chủ quyền biển đảo.`,
    digitalCompetencies: ['Học sinh biết tìm kiếm hình ảnh các sinh vật biển trên kho học liệu số an toàn'],
    aiCompetencies: [],
    status: 'ready',
    statusMessage: 'Dữ liệu mẫu minh họa - Sẵn sàng sử dụng',
    isSample: true,
  },
  {
    id: 'sample_toan4_w5',
    fileName: 'KHBD_Toan4_Tuan5_TimSoTrungBinhCong.docx',
    fileSize: 198400,
    detectedWeek: 5,
    detectedTitle: 'BÀI: TÌM SỐ TRUNG BÌNH CỘNG',
    detectedPeriods: 2,
    detectedSubject: 'Toán',
    detectedGrade: '4',
    orderIndex: 1,
    rawText: `KẾ HOẠCH BÀI DẠY - TUẦN 5
Môn: Toán 4
BÀI: TÌM SỐ TRUNG BÌNH CỘNG (2 tiết)

I. YÊU CẦU CẦN ĐẠT:
1. Kiến thức, kỹ năng:
- Nhận biết được khái niệm số trung bình cộng của nhiều số.
- Biết cách tìm số trung bình cộng của hai hay nhiều số tự nhiên.
2. Vận dụng:
- Giải các bài toán thực tế về tính điểm trung bình, số đo trung bình trong sinh hoạt.
3. Năng lực & Phẩm chất:
- Năng lực toán học: Tư duy và lập luận toán học.
- Năng lực số: Sử dụng bảng tính hoặc công cụ tính toán số học trên thiết bị.`,
    originalYccd: `I. YÊU CẦU CẦN ĐẠT:
- Nhận biết khái niệm số trung bình cộng của nhiều số.
- Biết cách tính số trung bình cộng của hai hay nhiều số.
- Vận dụng giải các bài toán thực tế.
- Bồi dưỡng tính cẩn thận, chăm chỉ.`,
    transformedYccd: `I. YÊU CẦU CẦN ĐẠT:
Qua bài học, học sinh thực hiện được:
- Nắm vững quy tắc tìm số trung bình cộng: Lấy tổng các số chia cho số các số hạng; thực hiện thành thạo các phép tính tìm trung bình cộng.
Học sinh vận dụng bài học trong thực tế cuộc sống:
- Biết tính trung bình số trang sách đọc mỗi ngày, trung bình số điểm kiểm tra cá nhân để đặt mục tiêu học tập.
Giúp các em hình thành và phát triển phẩm chất:
- Chăm chỉ: Kiên trì tính toán cẩn thận, rà soát lại kết quả.
- Trung thực: Báo cáo số liệu chính xác khi thực hiện khảo sát số đo nhóm.
Giúp các em hình thành và phát triển năng lực:
- Năng lực toán học: Năng lực tư duy và lập luận toán học, năng lực giải quyết vấn đề toán học.
- Năng lực giao tiếp toán học: Trình bày rõ ràng các bước giải bài toán có lời văn.
Nội dung tích hợp:
- Tích hợp năng lực số: <span color="#FF0000">Học sinh sử dụng phần mềm máy tính cầm tay số (Calculator) để kiểm tra đối chiếu kết quả phép tính</span>.`,
    digitalCompetencies: ['Học sinh sử dụng phần mềm máy tính cầm tay số (Calculator) để kiểm tra đối chiếu kết quả phép tính'],
    aiCompetencies: [],
    status: 'ready',
    statusMessage: 'Dữ liệu mẫu minh họa - Sẵn sàng sử dụng',
    isSample: true,
  },
  {
    id: 'sample_tinhoc4_w5',
    fileName: 'KHBD_TinHoc4_Tuan5_VeTranhVaTuongTacAI.docx',
    fileSize: 221184,
    detectedWeek: 5,
    detectedTitle: 'BÀI: EM TẬP VẼ TRANH TRÊN MÁY TÍNH VÀ NHẬN BIẾT TRỢ LÝ AI',
    detectedPeriods: 1,
    detectedSubject: 'Tin học',
    detectedGrade: '4',
    orderIndex: 2,
    rawText: `KẾ HOẠCH BÀI DẠY - TUẦN 5
Môn: Tin học 4
BÀI: EM TẬP VẼ TRANH TRÊN MÁY TÍNH VÀ NHẬN BIẾT TRỢ LÝ AI (1 tiết)

I. YÊU CẦU CẦN ĐẠT:
- Biết sử dụng các công cụ vẽ hình cơ bản trên phần mềm đồ họa.
- Nhận biết sự hiện diện của trợ lý số và công nghệ trí tuệ nhân tạo hỗ trợ học tập.
- Rèn luyện kỹ năng thực hành trên máy tính và tương tác với công cụ thông minh.`,
    originalYccd: `I. YÊU CẦU CẦN ĐẠT:
- Biết dùng công cụ vẽ hình học cơ bản.
- Làm quen với các tính năng thông minh gợi ý nét vẽ của phần mềm đồ họa số.
- Năng lực tin học: Sử dụng thiết bị và phần mềm đồ họa.
- Phẩm chất: Sáng tạo và có ý thức giữ gìn thiết bị phòng máy.`,
    transformedYccd: `I. YÊU CẦU CẦN ĐẠT:
Qua bài học, học sinh thực hiện được:
- Sử dụng thành thạo chuột máy tính và các công cụ hình khối cơ bản (hình chữ nhật, hình elip, đường thẳng) để vẽ bức tranh ngôi trường em.
Học sinh vận dụng bài học trong thực tế cuộc sống:
- Ứng dụng vẽ thiệp chúc mừng thầy cô, bố mẹ nhân dịp lễ; thiết kế tranh minh họa cho bài học.
Giúp các em hình thành và phát triển phẩm chất:
- Trách nhiệm: Giữ gìn bàn phím, chuột máy tính đúng nội quy phòng thực hành.
- Chăm chỉ: Tỉ mỉ hoàn thiện tác phẩm sáng tạo của bản thân.
Giúp các em hình thành và phát triển năng lực:
- Năng lực tin học (NLa): Sử dụng phần mềm đồ họa số để thể hiện ý tưởng trực quan.
Nội dung tích hợp:
- Tích hợp năng lực số: <span color="#FF0000">Học sinh thực hiện lưu tập tin hình ảnh vào thư mục cá nhân và thao tác đóng mở ứng dụng an toàn</span>.
- Tích hợp năng lực AI: <span color="#0000FF">Học sinh bước đầu nhận biết tính năng AI gợi ý nét vẽ thông minh (AutoDraw) và hiểu rằng AI là công cụ hỗ trợ người dùng sáng tạo</span>.`,
    digitalCompetencies: ['Học sinh thực hiện lưu tập tin hình ảnh vào thư mục cá nhân và thao tác đóng mở ứng dụng an toàn'],
    aiCompetencies: ['Học sinh bước đầu nhận biết tính năng AI gợi ý nét vẽ thông minh (AutoDraw) và hiểu rằng AI là công cụ hỗ trợ người dùng sáng tạo'],
    status: 'ready',
    statusMessage: 'Dữ liệu mẫu minh họa - Sẵn sàng sử dụng',
    isSample: true,
  },
  {
    id: 'sample_tienganh4_w5',
    fileName: 'KHBD_TiengAnh4_Tuan5_Unit3_MyFriends.docx',
    fileSize: 204800,
    detectedWeek: 5,
    detectedTitle: 'UNIT 3: MY FRIENDS - LESSON 1',
    detectedPeriods: 1,
    detectedSubject: 'Tiếng Anh',
    detectedGrade: '4',
    orderIndex: 3,
    rawText: `LESSON PLAN - WEEK 5
Subject: English 4
UNIT 3: MY FRIENDS - LESSON 1 (1 period)

I. OBJECTIVES / YÊU CẦU CẦN ĐẠT:
By the end of the lesson, pupils will be able to:
- Ask and answer questions about physical appearance (tall, short, slim, friendly).
- Structure: "What does he/she look like?" - "He's/She's tall."
- Competence: Communication and pair work.`,
    originalYccd: `I. OBJECTIVES:
- Vocabulary: tall, short, slim, big, cute.
- Sentence patterns: What does he/she look like? - He's / She's...
- Develop speaking and listening skills.`,
    transformedYccd: `I. YÊU CẦU CẦN ĐẠT:
Qua bài học, học sinh thực hiện được:
- Nhận biết và phát âm chuẩn các từ vựng chỉ đặc điểm ngoại hình: tall, short, slim, friendly; sử dụng cấu trúc hỏi - đáp "What does he/she look like? - He's/She's...".
Học sinh vận dụng bài học trong thực tế cuộc sống:
- Giới thiệu và miêu tả đặc điểm tích cực của bạn bè trong lớp bằng tiếng Anh tự tin, thân thiện.
Giúp các em hình thành và phát triển phẩm chất:
- Nhân ái: Tôn trọng sự đa dạng về ngoại hình của bạn bè, không chê bai trêu chọc.
Giúp các em hình thành và phát triển năng lực:
- Năng lực giao tiếp tiếng Anh: Nghe hiểu và phản xạ hội thoại theo cặp đôi.
Nội dung tích hợp:
- Tích hợp năng lực số: <span color="#FF0000">Học sinh nghe phát âm chuẩn qua phần mềm từ điển phát âm số của nhà trường</span>.`,
    digitalCompetencies: ['Học sinh nghe phát âm chuẩn qua phần mềm từ điển phát âm số của nhà trường'],
    aiCompetencies: [],
    status: 'ready',
    statusMessage: 'Dữ liệu mẫu minh họa - Sẵn sàng sử dụng',
    isSample: true,
  },
  {
    id: 'sample_toan4_w6',
    fileName: 'KHBD_Toan4_Tuan6_BieuThucCoChuaMotChu.docx',
    fileSize: 184320,
    detectedWeek: 6,
    detectedTitle: 'BÀI: BIỂU THỨC CÓ CHỨA MỘT CHỮ',
    detectedPeriods: 2,
    detectedSubject: 'Toán',
    detectedGrade: '4',
    orderIndex: 4,
    rawText: `KẾ HOẠCH BÀI DẠY - TUẦN 6
Môn: Toán 4
BÀI: BIỂU THỨC CÓ CHỨA MỘT CHỮ (2 tiết)

I. YÊU CẦU CẦN ĐẠT:
- Nhận biết biểu thức có chứa một chữ.
- Biết cách tính giá trị của biểu thức khi thay chữ bằng số.
- Vận dụng vào các bài toán thực tế đơn giản.`,
    originalYccd: `I. YÊU CẦU CẦN ĐẠT:
- Nhận biết biểu thức chứa một chữ.
- Tính giá trị biểu thức khi thay chữ bằng số.
- Rèn luyện tư duy toán học logic.`,
    transformedYccd: `I. YÊU CẦU CẦN ĐẠT:
Qua bài học, học sinh thực hiện được:
- Nhận biết dạng biểu thức có chứa một chữ cái (ví dụ: a + 5, 12 - b); tính đúng giá trị của biểu thức mỗi khi thay chữ bằng một số cụ thể.
Học sinh vận dụng bài học trong thực tế cuộc sống:
- Nhận biết ý nghĩa của việc thay số vào công thức tính toán hàng ngày (như công thức tính chu vi, diện tích các đồ vật quen thuộc).
Giúp các em hình thành và phát triển phẩm chất:
- Chăm chỉ: Tích cực suy nghĩ, thực hiện đầy đủ các bài tập tự luyện.
Giúp các em hình thành và phát triển năng lực:
- Năng lực toán học: Năng lực tư duy đại số sơ cấp, bước đầu làm quen với ký hiệu chữ đại diện cho số.
Nội dung tích hợp:
- Giáo dục tư duy logic và lập luận toán học.`,
    digitalCompetencies: [],
    aiCompetencies: [],
    status: 'ready',
    statusMessage: 'Dữ liệu mẫu minh họa - Sẵn sàng sử dụng',
    isSample: true,
  },
];
