import React from 'react';
import { X, BookOpen, CheckCircle2, AlertTriangle, FileText, Calendar, Sparkles, Download } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Hướng dẫn Sử dụng “Trợ lý Kế hoạch bài dạy”
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 leading-relaxed">
          {/* Section 1 */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 text-sm flex items-center">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs mr-2 font-bold">1</span>
              Bước 1: Tải và sắp xếp tài liệu (.docx)
            </h4>
            <p className="pl-7">
              • Bạn có thể tải lên nhiều file Word cùng lúc. Hệ thống sẽ tự nhận diện Tuần học, Tên bài dạy và Số tiết.<br />
              • <strong>Tập tin .doc cũ (Word 97-2003):</strong> Cần mở file trên máy tính bằng Word, chọn <em>File &gt; Save As &gt; Word Document (.docx)</em> để tải lên lại.<br />
              • Bạn có thể bấm nút <strong>“Dữ liệu mẫu thử nghiệm”</strong> để trải nghiệm ngay quy trình với các bài dạy mẫu chuẩn.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 text-sm flex items-center">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs mr-2 font-bold">2</span>
              Bước 2: Chọn mẫu Yêu cầu cần đạt
            </h4>
            <p className="pl-7">
              • Mặc định áp dụng mẫu chuẩn Công văn 2345/BGDĐT-GDTH.<br />
              • Bạn có thể chụp ảnh hoặc tải tài liệu mẫu của nhà trường để AI trích xuất và duyệt trước khi dùng.<br />
              • Với môn Tiếng Anh: có thể chọn hiển thị tiếng Việt hoặc chuyển sang tiếng Anh.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 text-sm flex items-center">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs mr-2 font-bold">3</span>
              Bước 3: Thiết lập Thời khóa biểu & Ngày dạy
            </h4>
            <p className="pl-7">
              • Ngày dạy được tính toán bằng <strong>mã chương trình chuẩn xác 100%</strong> theo chu kỳ tuần học của nhà trường, tuyệt đối không dùng AI đoán mò.<br />
              • Có thể tải ảnh chụp thời khóa biểu để AI hỗ trợ điền nhanh các tiết.<br />
              • Thiết lập ngày nghỉ lễ, nghỉ Tết, ngày thi học kỳ. Các ngày thi chưa có lịch chính thức được đánh dấu rõ <em>[Tạm tính]</em>.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 text-sm flex items-center">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs mr-2 font-bold">4</span>
              Bước 4: Chỉnh sửa YCCĐ & Tô màu Năng lực Số / AI
            </h4>
            <p className="pl-7">
              • Bản gốc và bản đề xuất hiển thị cạnh nhau để bạn đối chiếu dễ dàng.<br />
              • <strong>Năng lực số:</strong> Chữ màu đỏ (<span className="text-[#FF0000] font-bold">#FF0000</span>).<br />
              • <strong>Năng lực AI:</strong> Chữ màu xanh dương (<span className="text-[#0000FF] font-bold">#0000FF</span>).<br />
              • Bạn có thể bôi đen văn bản và bấm nút định dạng màu trực tiếp bất kỳ lúc nào.
            </p>
          </div>

          {/* Section 5 & 6 */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 text-sm flex items-center">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs mr-2 font-bold">5</span>
              Bước 5 & 6: Xem trước & Xuất Word / PDF
            </h4>
            <p className="pl-7">
              • Bảng xem trước cho phép sửa trực tiếp mọi ngày dạy trước khi xuất.<br />
              • Hỗ trợ ghép toàn bộ các tuần vào 1 tài liệu hoặc chia theo khoảng tuần tùy chọn.<br />
              • Xuất file Word (.docx) chuẩn phông Times New Roman 14pt, căn lề chuẩn Nghị định 30/2020/NĐ-CP và có thể in trực tiếp sang PDF vector tìm kiếm được.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
          >
            Đã hiểu, quay lại làm việc
          </button>
        </div>
      </div>
    </div>
  );
};
