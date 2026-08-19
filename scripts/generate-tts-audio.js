/**
 * Script Node.js: Tạo tự động các file âm thanh ngắn (.mp3) chuẩn ngữ âm Tiếng Việt
 * Sử dụng Microsoft Edge TTS (Voice: vi-VN-HoaiMyNeural - Giọng nữ miền Bắc chuẩn sư phạm)
 *
 * Cách chạy:
 *   npm run generate:audio
 *   hoặc: node scripts/generate-tts-audio.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EdgeTTS } from '@andresaya/edge-tts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VOICE = 'vi-VN-HoaiMyNeural';
const OUTPUT_DIR = path.join(__dirname, '..', 'raw-audio');
const DELAY_BETWEEN_REQUESTS_MS = 120;

// Danh sách các mẫu âm cần tạo tự động theo chuẩn SGK Tiếng Việt 1
const AUDIO_DATASET = [
  // ==========================================
  // 1. ÂM ĐẦU (INITIAL CONSONANTS)
  // ==========================================
  { category: 'am_dau', id: 'b', text: 'bờ', filename: 'am_dau__b.mp3' },
  { category: 'am_dau', id: 'c', text: 'cờ', filename: 'am_dau__c.mp3' },
  { category: 'am_dau', id: 'ch', text: 'chờ', filename: 'am_dau__ch.mp3' },
  { category: 'am_dau', id: 'd', text: 'dờ', filename: 'am_dau__d.mp3' },
  { category: 'am_dau', id: 'dd', text: 'đờ', filename: 'am_dau__dd.mp3' },
  { category: 'am_dau', id: 'g', text: 'gờ', filename: 'am_dau__g.mp3' },
  { category: 'am_dau', id: 'gh', text: 'gờ', filename: 'am_dau__gh.mp3' },
  { category: 'am_dau', id: 'gi', text: 'gi', filename: 'am_dau__gi.mp3' },
  { category: 'am_dau', id: 'h', text: 'hờ', filename: 'am_dau__h.mp3' },
  { category: 'am_dau', id: 'k', text: 'kờ', filename: 'am_dau__k.mp3' },
  { category: 'am_dau', id: 'kh', text: 'khờ', filename: 'am_dau__kh.mp3' },
  { category: 'am_dau', id: 'l', text: 'lờ', filename: 'am_dau__l.mp3' },
  { category: 'am_dau', id: 'm', text: 'mờ', filename: 'am_dau__m.mp3' },
  { category: 'am_dau', id: 'n', text: 'nờ', filename: 'am_dau__n.mp3' },
  { category: 'am_dau', id: 'ng', text: 'ngờ', filename: 'am_dau__ng.mp3' },
  { category: 'am_dau', id: 'ngh', text: 'ngờ', filename: 'am_dau__ngh.mp3' },
  { category: 'am_dau', id: 'nh', text: 'nhờ', filename: 'am_dau__nh.mp3' },
  { category: 'am_dau', id: 'p', text: 'pờ', filename: 'am_dau__p.mp3' },
  { category: 'am_dau', id: 'ph', text: 'phờ', filename: 'am_dau__ph.mp3' },
  { category: 'am_dau', id: 'qu', text: 'quờ', filename: 'am_dau__qu.mp3' },
  { category: 'am_dau', id: 'r', text: 'rờ', filename: 'am_dau__r.mp3' },
  { category: 'am_dau', id: 's', text: 'sờ', filename: 'am_dau__s.mp3' },
  { category: 'am_dau', id: 't', text: 'tờ', filename: 'am_dau__t.mp3' },
  { category: 'am_dau', id: 'th', text: 'thờ', filename: 'am_dau__th.mp3' },
  { category: 'am_dau', id: 'tr', text: 'trờ', filename: 'am_dau__tr.mp3' },
  { category: 'am_dau', id: 'v', text: 'vờ', filename: 'am_dau__v.mp3' },
  { category: 'am_dau', id: 'x', text: 'xờ', filename: 'am_dau__x.mp3' },

  // ==========================================
  // 2. VẦN CƠ BẢN (RIMES)
  // ==========================================
  { category: 'van', id: 'a', text: 'a', filename: 'van__a.mp3' },
  { category: 'van', id: 'an', text: 'an', filename: 'van__an.mp3' },
  { category: 'van', id: 'at', text: 'at', filename: 'van__at.mp3' },
  { category: 'van', id: 'ang', text: 'ang', filename: 'van__ang.mp3' },
  { category: 'van', id: 'at_breve', text: 'ắt', filename: 'van__at_breve.mp3' },
  { category: 'van', id: 'e', text: 'e', filename: 'van__e.mp3' },
  { category: 'van', id: 'en', text: 'en', filename: 'van__en.mp3' },
  { category: 'van', id: 'ê', text: 'ê', filename: 'van__e_hat.mp3' },
  { category: 'van', id: 'ên', text: 'ên', filename: 'van__en_hat.mp3' },
  { category: 'van', id: 'i', text: 'i', filename: 'van__i.mp3' },
  { category: 'van', id: 'in', text: 'in', filename: 'van__in.mp3' },
  { category: 'van', id: 'iêu', text: 'iêu', filename: 'van__ieu.mp3' },
  { category: 'van', id: 'o', text: 'o', filename: 'van__o.mp3' },
  { category: 'van', id: 'on', text: 'on', filename: 'van__on.mp3' },
  { category: 'van', id: 'oan', text: 'oan', filename: 'van__oan.mp3' },
  { category: 'van', id: 'ô', text: 'ô', filename: 'van__o_hat.mp3' },
  { category: 'van', id: 'u', text: 'u', filename: 'van__u.mp3' },
  { category: 'van', id: 'uông', text: 'uông', filename: 'van__uong.mp3' },
  { category: 'van', id: 'uyên', text: 'uyên', filename: 'van__uyen.mp3' },
  { category: 'van', id: 'ươ', text: 'ươ', filename: 'van__uo.mp3' },
  { category: 'van', id: 'ương', text: 'ương', filename: 'van__uong_horn.mp3' },
  { category: 'van', id: 'uyu', text: 'uyu', filename: 'van__uyu.mp3' },
  { category: 'van', id: 'ach', text: 'ach', filename: 'van__ach.mp3' },
  { category: 'van', id: 'ao', text: 'ao', filename: 'van__ao.mp3' },
  { category: 'van', id: 'im', text: 'im', filename: 'van__im.mp3' },
  { category: 'van', id: 'ai', text: 'ai', filename: 'van__ai.mp3' },

  // ==========================================
  // 3. DẤU THANH (TONES)
  // ==========================================
  { category: 'thanh', id: 'ngang', text: 'thanh ngang', filename: 'thanh__ngang.mp3' },
  { category: 'thanh', id: 'huyen', text: 'huyền', filename: 'thanh__huyen.mp3' },
  { category: 'thanh', id: 'sac', text: 'sắc', filename: 'thanh__sac.mp3' },
  { category: 'thanh', id: 'hoi', text: 'hỏi', filename: 'thanh__hoi.mp3' },
  { category: 'thanh', id: 'nga', text: 'ngã', filename: 'thanh__nga.mp3' },
  { category: 'thanh', id: 'nang', text: 'nặng', filename: 'thanh__nang.mp3' },

  // ==========================================
  // 4. TIẾNG TRUNG GIAN & TỪ ĐÁNH VẦN MẪU
  // ==========================================
  { category: 'tu', id: 'truong_ngang', text: 'trương', filename: 'tu__truong_ngang.mp3' },
  { category: 'tu', id: 'truong', text: 'trường', filename: 'tu__truong.mp3' },

  { category: 'tu', id: 'uong', text: 'uống', filename: 'tu__uong.mp3' },

  { category: 'tu', id: 'giat_ngang', text: 'giăt', filename: 'tu__giat_ngang.mp3' },
  { category: 'tu', id: 'giat', text: 'giặt', filename: 'tu__giat.mp3' },

  { category: 'tu', id: 'quang', text: 'quang', filename: 'tu__quang.mp3' },

  { category: 'tu', id: 'khuyu', text: 'khuỷu', filename: 'tu__khuyu.mp3' },
  { category: 'tu', id: 'nguyen', text: 'nguyễn', filename: 'tu__nguyen.mp3' },

  // ==========================================
  // 5. TỪ QUEN THUỘC SGK LỚP 1
  // ==========================================
  { category: 'tu', id: 'be', text: 'bé', filename: 'tu__be.mp3' },
  { category: 'tu', id: 'hoc', text: 'học', filename: 'tu__hoc.mp3' },
  { category: 'tu', id: 'bai', text: 'bài', filename: 'tu__bai.mp3' },
  { category: 'tu', id: 'vui', text: 'vui', filename: 'tu__vui.mp3' },
  { category: 'tu', id: 'cham', text: 'chăm', filename: 'tu__cham.mp3' },
  { category: 'tu', id: 'chi', text: 'chỉ', filename: 'tu__chi.mp3' },
  { category: 'tu', id: 'ca', text: 'cá', filename: 'tu__ca.mp3' },
  { category: 'tu', id: 'hoa', text: 'hoa', filename: 'tu__hoa.mp3' },
  { category: 'tu', id: 'sach', text: 'sách', filename: 'tu__sach.mp3' },
  { category: 'tu', id: 'yeu', text: 'yêu', filename: 'tu__yeu.mp3' },
  { category: 'tu', id: 'an', text: 'ăn', filename: 'tu__an.mp3' },
  { category: 'tu', id: 'ba', text: 'bà', filename: 'tu__ba.mp3' },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateAudioWithRetry(tts, text, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await tts.synthesize(text, VOICE);
      const buffer = tts.toBuffer();
      if (buffer && buffer.length > 0) {
        return buffer;
      }
    } catch (err) {
      if (attempt === maxRetries) throw err;
      console.warn(`    ⚠️ Thử lại lần ${attempt} cho từ "${text}" sau 500ms...`);
      await sleep(500 * attempt);
    }
  }
  throw new Error(`Không thể tạo audio cho từ: "${text}"`);
}

async function main() {
  console.log('='.repeat(70));
  console.log('🎤 BỘ TẠO ÂM THANH NGỮ ÂM TIẾNG VIỆT LỚP 1 (TTS EDGE)');
  console.log(`🎙️  Giọng đọc chuẩn: ${VOICE}`);
  console.log(`📂 Thư mục đích:    ${OUTPUT_DIR}`);
  console.log(`📊 Tổng số mẫu âm:  ${AUDIO_DATASET.length} file`);
  console.log('='.repeat(70));

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const tts = new EdgeTTS();
  const manifest = [];
  let successCount = 0;
  let skippedCount = 0;
  let failCount = 0;

  for (let i = 0; i < AUDIO_DATASET.length; i++) {
    const item = AUDIO_DATASET[i];
    const filePath = path.join(OUTPUT_DIR, item.filename);
    const progress = `[${String(i + 1).padStart(2, '0')}/${AUDIO_DATASET.length}]`;

    // Nếu file đã tồn tại và có dung lượng hợp lệ (> 1KB) thì bỏ qua để tăng tốc
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size > 1000) {
        const sizeKb = (stats.size / 1024).toFixed(1);
        console.log(`${progress} Đã có sẵn:  ${item.filename.padEnd(26)} ("${item.text}") ⏩ (${sizeKb} KB)`);
        skippedCount++;
        successCount++;
        manifest.push({
          id: item.id,
          category: item.category,
          text: item.text,
          filename: item.filename,
          sizeBytes: stats.size,
        });
        continue;
      }
    }

    process.stdout.write(`${progress} Đang tạo:   ${item.filename.padEnd(26)} ("${item.text}")... `);

    try {
      const buffer = await generateAudioWithRetry(tts, item.text);
      fs.writeFileSync(filePath, buffer);
      const fileSizeKb = (buffer.length / 1024).toFixed(1);

      console.log(`✅ OK (${fileSizeKb} KB)`);
      successCount++;

      manifest.push({
        id: item.id,
        category: item.category,
        text: item.text,
        filename: item.filename,
        sizeBytes: buffer.length,
      });

      await sleep(DELAY_BETWEEN_REQUESTS_MS);
    } catch (err) {
      console.log(`❌ LỖI: ${err.message}`);
      failCount++;
    }
  }

  // Ghi file manifest.json
  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log('='.repeat(70));
  console.log(`🎉 HOÀN TẤT TẠO DỮ LIỆU ÂM THANH!`);
  console.log(`✅ Tổng file hợp lệ: ${successCount}/${AUDIO_DATASET.length} (Đã có sẵn: ${skippedCount}, Mới tạo: ${successCount - skippedCount})`);
  if (failCount > 0) console.log(`❌ Thất bại:        ${failCount} file`);
  console.log(`📄 Đã cập nhật mục lục: raw-audio/manifest.json`);
  console.log('='.repeat(70));
}

main().catch((err) => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
