import { pictureAsset } from '../lib/picture'

export interface Testimonial {
  id: string
  name: string
  role: string
  avatar: string
  rating: number
  date: string
  content: string
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Lê Hoài Bảo Nhi',
    role: 'Sinh viên năm 4 · CNTT · Chuẩn bị thực tập Data',
    avatar: pictureAsset('user-1.png'),
    rating: 5,
    date: '12/06/2026',
    content:
      'Lần đầu nộp CV thực tập Data mà không biết JD cần gì — app chỉ thẳng chỗ CV còn thiếu, mình sửa xong quét lại điểm nhích lên rõ. Tuần sau có mail mời phỏng vấn, đúng kiểu cứu sinh viên năm cuối đang panic.',
  },
  {
    id: '2',
    name: 'Nguyễn Trần Hải Đăng',
    role: 'Sinh viên năm 3 · BA · Target internship fintech',
    avatar: pictureAsset('user-2.png'),
    rating: 5,
    date: '28/05/2026',
    content:
      'Tưởng CV ngành IT apply được mọi JD — app báo CV chưa khớp lắm và giải thích vì sao. Nhờ vậy mình chọn đúng JD intern BA thay vì ném CV lung tung, đỡ tốn cả tháng apply sai chỗ.',
  },
  {
    id: '3',
    name: 'Phạm An',
    role: 'Sinh viên năm 4 · Quản trị KD · Tìm BD thực tập',
    avatar: pictureAsset('user-3.png'),
    rating: 4,
    date: '03/06/2026',
    content:
      'Nhìn phát biết CV thiếu số liệu và vài ý quan trọng cho vị trí BD. Gợi ý sửa ngắn, dễ hiểu, không kiểu template chung chung trên mạng. Hợp mấy bạn muốn chỉnh CV nhanh trước mùa tuyển thực tập.',
  },
  {
    id: '4',
    name: 'Tin Nguyen',
    role: 'Sinh viên năm 3 · Kỹ thuật phần mềm · Fresher DE',
    avatar: pictureAsset('user-4.png'),
    rating: 5,
    date: '18/05/2026',
    content:
      'Scan CV với JD Big Data thì app bảo phần kỹ năng ổn nhưng kinh nghiệm còn mỏng — đúng ý mentor nói mà mình không tự thấy. Tự tính lại mốc thời gian làm project giúp ghi CV rõ hơn, giờ apply junior DE tự tin hơn hẳn.',
  },
  {
    id: '5',
    name: 'Tôi là Bin',
    role: 'Sinh viên năm 4 · Tài chính · Đi thực tập mùa hè',
    avatar: pictureAsset('user-5.png'),
    rating: 5,
    date: '25/06/2026',
    content:
      'Dùng bản free trước, thấy điểm và gợi ý sửa hợp lý nên lên Premium để xem thêm gợi ý khoá học. Luyện phỏng vấn VIP sau đó giúp bớt run khi phỏng vấn thật — recommend cho bạn năm 3–4 sắp ra trường.',
  },
]
