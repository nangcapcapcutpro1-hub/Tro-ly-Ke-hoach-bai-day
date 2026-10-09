import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to get GoogleGenAI client if key exists
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API Health / Status
app.get('/api/status', (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const hasApiKey = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');
  res.json({
    status: 'ok',
    hasApiKey,
    app: 'Trợ lý Kế hoạch bài dạy',
    version: '1.0.0',
  });
});

// AI Endpoint: OCR & extract timetable from image or text description
app.post('/api/ai/extract-timetable', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ. Bạn vẫn có thể nhập thời khóa biểu thủ công dễ dàng!',
        code: 'NO_API_KEY',
      });
    }

    const { imageBase64, mimeType, grade, subject, className } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Thiếu dữ liệu hình ảnh thời khóa biểu.' });
    }

    const prompt = `Bạn là trợ lý đắc lực cho giáo viên tiểu học Việt Nam. Hãy đọc bảng thời khóa biểu trong ảnh và trích xuất lịch học của môn "${subject || 'môn học'}" cho lớp "${className || 'lớp học'}".
Nếu không thấy tên môn hoặc lớp cụ thể, hãy phân tích tất cả các buổi dạy của lớp hoặc giáo viên đó.

Hãy trả về kết quả định dạng JSON với cấu trúc:
{
  "schoolName": "Tên trường nếu có trong ảnh hoặc để trống",
  "className": "${className || 'Lớp trích xuất'}",
  "subject": "${subject || 'Môn học trích xuất'}",
  "slots": [
    {
      "dayOfWeek": 2, // 2 = Thứ Hai, 3 = Thứ Ba, 4 = Thứ Tư, 5 = Thứ Năm, 6 = Thứ Sáu, 7 = Thứ Bảy
      "session": "morning", // "morning" (buổi sáng) hoặc "afternoon" (buổi chiều)
      "period": 1, // Tiết 1, 2, 3, 4, 5
      "timeNote": "Ví dụ: 07:30 - 08:05"
    }
  ],
  "notes": "Ghi chú nếu có (tuần áp dụng, thời gian bắt đầu,...)"
}
Lưu ý: Chỉ trả về JSON hợp lệ, không thêm chú thích ngoài JSON.`;

    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/png',
        data: imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, ''),
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsed = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('OCR Timetable error:', err);
    res.status(500).json({
      error: 'Không thể phân tích ảnh thời khóa biểu: ' + (err.message || 'Lỗi xử lý'),
      details: err.message,
    });
  }
});

// AI Endpoint: Extract YCCĐ template from uploaded image or document
app.post('/api/ai/extract-template', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Chưa cấu hình GEMINI_API_KEY. Bạn có thể sử dụng mẫu mặc định chuẩn Công văn 2345/BGDĐT hoặc nhập tay.',
        code: 'NO_API_KEY',
      });
    }

    const { imageBase64, mimeType, rawText } = req.body;
    let parts: any[] = [];

    const prompt = `Bạn là chuyên gia giáo dục tiểu học Việt Nam. Hãy đọc và trích xuất cấu trúc mục "YÊU CẦU CẦN ĐẠT" (Mục tiêu bài học) từ tài liệu/hình ảnh được cung cấp.
Chuẩn theo quy định của Bộ GD&ĐT thường gồm:
- Mục tiêu kiến thức/thực hiện được
- Vận dụng thực tế cuộc sống
- Phẩm chất chủ yếu (Yêu nước, Nhân ái, Chăm chỉ, Trung thực, Trách nhiệm)
- Năng lực cốt lõi & đặc thù (Tự chủ tự học, Giao tiếp hợp tác, Giải quyết vấn đề & sáng tạo, Năng lực môn học)
- Nội dung tích hợp (Năng lực số, Năng lực AI, Giáo dục địa phương, Quyền trẻ em,...)

Trả về JSON:
{
  "templateName": "Tên mẫu hoặc nguồn (VD: Theo Công văn 2345/BGDĐT)",
  "sections": [
    {
      "id": "kien_thuc",
      "heading": "1. Khởi động và thực hiện bài học (Qua bài học, học sinh thực hiện được:)",
      "guide": "Mô tả ngắn gọn hướng dẫn điền"
    },
    {
      "id": "van_dung",
      "heading": "2. Vận dụng thực tế cuộc sống:",
      "guide": "Vận dụng vào thực tiễn hàng ngày của học sinh"
    },
    {
      "id": "pham_chat",
      "heading": "3. Phẩm chất:",
      "guide": "Hình thành và phát triển các phẩm chất..."
    },
    {
      "id": "nang_luc",
      "heading": "4. Năng lực:",
      "guide": "Năng lực chung và năng lực đặc thù..."
    },
    {
      "id": "tich_hop",
      "heading": "5. Nội dung tích hợp:",
      "guide": "Tích hợp năng lực số (chữ đỏ), năng lực AI (chữ xanh dương),..."
    }
  ],
  "fullMarkdownTemplate": "Văn bản mẫu hoàn chỉnh có thể dùng trực tiếp"
}
Chỉ trả về JSON hợp lệ.`;

    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/png',
          data: imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, ''),
        },
      });
    }
    if (rawText) {
      parts.push({ text: `Nội dung tài liệu đính kèm:\n${rawText}` });
    }
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsed = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Extract template error:', err);
    res.status(500).json({
      error: 'Lỗi trích xuất mẫu: ' + (err.message || 'Lỗi server'),
    });
  }
});

// AI Endpoint: Transform / Standardize YCCĐ according to template and Competency colors
app.post('/api/ai/transform-yccd', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Chưa cấu hình GEMINI_API_KEY.',
        code: 'NO_API_KEY',
      });
    }

    const {
      lessonTitle,
      subject,
      grade,
      originalYccd,
      templateFormat,
      language = 'vi', // 'vi' or 'en'
      integrateDigital = false,
      integrateAI = false,
    } = req.body;

    const prompt = `Bạn là trợ lý chuyên môn Kế hoạch bài dạy (Giáo án) tiểu học Việt Nam.
Nhiệm vụ: Chuẩn hóa phần "I. YÊU CẦU CẦN ĐẠT" cho bài dạy dưới đây theo đúng mẫu quy định, giữ trọn vẹn mục tiêu giáo dục gốc của tác giả và không tự bịa đặt mã năng lực chưa được cung cấp.

THÔNG TIN BÀI DẠY:
- Môn: ${subject || 'Chung'}
- Khối lớp: ${grade || 'Tiểu học'}
- Tên bài: ${lessonTitle || 'Bài học'}
- Ngôn ngữ yêu cầu: ${language === 'en' ? 'Tiếng Anh (English)' : 'Tiếng Việt'} (Lưu ý: Môn Tiếng Việt luôn giữ tiếng Việt; môn Tiếng Anh chỉ dịch sang Tiếng Anh khi ngôn ngữ yêu cầu là en).

NỘI DUNG YÊU CẦU CẦN ĐẠT GỐC:
"""
${originalYccd || 'Không có sẵn, hãy xây dựng từ bài dạy ' + lessonTitle}
"""

QUY TẮC BẮT BUỘC VỀ ĐỊNH DẠNG VÀ NĂNG LỰC SỐ / AI:
1. Mẫu cấu trúc chuẩn:
   I. YÊU CẦU CẦN ĐẠT
   1. Về kiến thức và kỹ năng (Qua bài học, học sinh thực hiện được):
   2. Vận dụng thực tế cuộc sống:
   3. Phẩm chất:
   4. Năng lực:
      - Năng lực chung:
      - Năng lực đặc thù:
   5. Nội dung tích hợp:

2. ĐỊNH DẠNG MÀU NĂNG LỰC SỐ VÀ AI:
   - Các nội dung tích hợp NĂNG LỰC SỐ (sử dụng thiết bị số, tìm kiếm thông tin số, an toàn mạng, tương tác số) PHẢI được bọc trong thẻ: <span color="#FF0000">nội dung năng lực số</span>
   - Các nội dung tích hợp NĂNG LỰC AI (nhận biết AI, sử dụng trợ lý AI phù hợp lứa tuổi, tư duy phản biện với kết quả AI) PHẢI được bọc trong thẻ: <span color="#0000FF">nội dung năng lực AI</span>
   - Phân biệt rõ nội dung rèn luyện năng lực thật sự với các câu chỉ vô tình nhắc tới máy tính hoặc thiết bị mà không có hoạt động phát triển năng lực.
   - Giữ nguyên các mã năng lực có sẵn trong bản gốc (ví dụ: NLa, NLb, NSc,...).
   - KHÔNG tự tiện thêm năng lực số hoặc AI nếu bài học không phù hợp hoặc người dùng không yêu cầu (yêu cầu tích hợp số: ${integrateDigital ? 'CÓ' : 'KHÔNG'}, yêu cầu tích hợp AI: ${integrateAI ? 'CÓ' : 'KHÔNG'}).

Hãy trả về JSON với cấu trúc:
{
  "lessonTitle": "${lessonTitle}",
  "transformedText": "Văn bản YCCĐ đầy đủ đã định dạng rõ ràng, các đoạn năng lực số được bọc <span color=\\"#FF0000\\">...</span> và năng lực AI được bọc <span color=\\"#0000FF\\">...</span>",
  "digitalCompetencies": ["Danh sách các ý năng lực số được đánh dấu nếu có"],
  "aiCompetencies": ["Danh sách các ý năng lực AI được đánh dấu nếu có"],
  "changeSummary": "Tóm tắt ngắn gọn những điểm đã điều chỉnh so với bản gốc"
}
Chỉ trả về JSON hợp lệ.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsed = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    res.json({ success: true, data: parsed });
  } catch (err: any) {
    console.error('Transform YCCD error:', err);
    res.status(500).json({
      error: 'Không thể chuẩn hóa YCCĐ: ' + (err.message || 'Lỗi server'),
    });
  }
});

// Mount Vite or static files
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
