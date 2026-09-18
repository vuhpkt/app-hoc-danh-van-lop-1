export interface LessonItem {
  id: string;
  title: string;
  text: string;
  note?: string;
}

export const GRADE1_LESSONS: LessonItem[] = [
  {
    id: 'lesson-1',
    title: 'Bài 1: Trường học của em',
    text: 'Trường học của em khang trang. Tiếng chim hót líu lo trên cành cây. Bé học bài vui vẻ.',
    note: 'SGK Kết nối tri thức - Âm tr, kh, ch, v',
  },
  {
    id: 'lesson-2',
    title: 'Bài 2: Vè chim chích',
    text: 'Ve vẻ vè ve\nCái vè chim chích\nBắt sâu đầu cành\nGiúp ích cho cây.',
    note: 'Thơ đồng dao - Luyện dấu thanh & âm ch, v',
  },
  {
    id: 'lesson-3',
    title: 'Bài 3: Bé ngoan chăm chỉ',
    text: 'Bé ngoan bé học chăm chỉ. Cô giáo khen bé hoa điểm mười.',
    note: 'Chủ đề trường lớp - Luyện vần oan, am, iêm',
  },
  {
    id: 'lesson-4',
    title: 'Bài 4: Luyện âm khó & vần tắc',
    text: 'Bé giặt khăn sạch\nChú vịt bơi nhanh\nBé gập khuỷu tay\nBắt con cá nhỏ.',
    note: 'Luyện âm tắc giặt, vịt, bắt và vần hiếm khuỷu tay',
  },
];
