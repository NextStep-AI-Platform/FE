export interface InterviewFeedbackPreset {
  score: number
  comment: string
}

const FEEDBACK: Record<string, InterviewFeedbackPreset[]> = {
  'Frontend Developer': [
    {
      score: 86,
      comment:
        'Bạn giới thiệu khá tự tin, nói rõ mình làm gì và từng làm project nào. Thử thêm 1–2 câu vì sao bạn muốn vào đúng vị trí frontend này — phần đó hay được hỏi thêm lắm.',
    },
    {
      score: 78,
      comment:
        'Bạn trả lời đúng ý rồi, nhưng hơi giống đọc sách giáo khoa. Kể luôn 1 ví dụ từ project thật (vd: màn hình nào dùng state, phần nào truyền từ component cha) sẽ dễ nghe hơn.',
    },
    {
      score: 82,
      comment:
        'Câu chuyện dự án có đầu có đuôi, nghe hợp lý. Nếu được thì chốt thêm kết quả cụ thể: trang load nhanh hơn bao nhiêu, ít bug hơn, team đỡ vất vả thế nào.',
    },
    {
      score: 74,
      comment:
        'Hướng xử lý ổn, nhưng còn chung chung. Lần sau thử nói rõ bạn đã làm gì trước — tối ưu ảnh, chia nhỏ code, hay test lại chỗ nào — để người nghe thấy bạn thực sự làm việc đó.',
    },
    {
      score: 80,
      comment:
        'Kế hoạch 3 tháng nghe có thể làm được. Gợi ý nhỏ: nói rõ tuần đầu học gì, tháng đầu giao được gì — như vậy sẽ thấy bạn chủ động hơn.',
    },
  ],
  'Backend Developer': [
    {
      score: 83,
      comment:
        'Giới thiệu rõ ràng, ai nghe cũng biết bạn quen làm API và làm việc nhóm. Thêm 1 con số thực tế (vd: xử lý nhanh hơn, ít lỗi hơn) thì câu trả lời sẽ “nặng” hơn.',
    },
    {
      score: 76,
      comment:
        'Bạn nắm được ý cơ bản. Nên kể thêm 1 tình huống thật: làm API cho tính năng nào, team dùng thế nào, có gặp khó chỗ nào không — nghe sẽ tự nhiên hơn liệt kê lý thuyết.',
    },
    {
      score: 85,
      comment:
        'Câu trả lời có ví dụ cụ thể, nghe là biết bạn từng gặp bài toán thật. Rất ổn. Có thể nói thêm bạn học được gì sau lần tối ưu đó.',
    },
    {
      score: 72,
      comment:
        'Bạn nhắc đủ các ý quan trọng rồi, nhưng hơi giống checklist. Chọn 1 phần bạn làm tốt nhất (vd: bảo mật đăng nhập, kiểm tra dữ liệu) và kể sâu hơn sẽ ấn tượng hơn.',
    },
    {
      score: 88,
      comment:
        'Cách bạn xử lý sự cố nghe rất thực tế, có trình tự, không hoảng. Đây là điểm cộng lớn. Giữ phong cách trả lời calm và rõ ràng như vậy nhé.',
    },
  ],
  default: [
    {
      score: 84,
      comment:
        'Phần giới thiệu ổn, nghe tự nhiên. Thử gài thêm 1 thành tích nhỏ mà bạn tự hào (điểm số, giải thưởng, feedback thầy/công ty) để người phỏng vấn nhớ bạn hơn.',
    },
    {
      score: 79,
      comment:
        'Bạn nói rõ điểm mạnh của mình. Nếu liên hệ luôn với công việc ở vị trí này (“em mạnh phần X nên có thể hỗ trợ team làm Y”) thì càng thuyết phục.',
    },
    {
      score: 81,
      comment:
        'Câu chuyện khó khăn bạn kể có logic, dễ theo dõi. Phần cuối nên nói rõ kết quả: xong việc chưa, mọi người phản ứng sao, bạn rút ra gì.',
    },
    {
      score: 77,
      comment:
        'Định hướng tương lai nghe hợp lý, không quá xa vời. Có thể nói thêm 6–12 tháng tới bạn muốn cải thiện kỹ năng gì trước — nghe sẽ chắc tay hơn.',
    },
    {
      score: 83,
      comment:
        'Lý do chọn bạn khá có cá tính, không giống mẫu cũ. Nếu thêm 1 câu về việc bạn thích sản phẩm/văn hóa công ty thì càng “đúng gu” HR.',
    },
  ],
}

function clampScore(n: number) {
  return Math.max(55, Math.min(95, Math.round(n)))
}

/** Mock feedback theo vị trí + index câu hỏi; điều chỉnh nhẹ theo độ dài câu trả lời */
export function getInterviewFeedback(
  role: string,
  questionIndex: number,
  answerText: string,
): InterviewFeedbackPreset {
  const list = FEEDBACK[role] ?? FEEDBACK.default
  const preset = list[questionIndex] ?? list[list.length - 1]
  const len = answerText.trim().length

  let delta = 0
  if (len < 80) delta = -6
  else if (len < 150) delta = -2
  else if (len > 350) delta = 3

  return {
    score: clampScore(preset.score + delta),
    comment: preset.comment,
  }
}
