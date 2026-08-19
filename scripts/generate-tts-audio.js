/**
 * Script Node.js: Tạo tự động kho âm thanh chuẩn 100% SGK Tiếng Việt 1 (Kết Nối Tri Thức)
 * NGUỒN DUY NHẤT: danh_muc_am_thanh_lop_1.md
 * - Giọng đọc: vi-VN-HoaiMyNeural (Nữ miền Bắc sư phạm)
 * - Tự động bỏ qua file đã tồn tại (> 1KB) để tối ưu thời gian.
 * - Cơ chế Timeout 4000ms & new EdgeTTS() chống treo kết nối WebSocket.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EdgeTTS } from '@andresaya/edge-tts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VOICE = 'vi-VN-HoaiMyNeural';
const OUTPUT_DIR = path.join(__dirname, '..', 'raw-audio');
const DELAY_MS = 60;
const TIMEOUT_MS = 4500;

// BẢNG DANH MỤC CHUẨN 100% TỪ danh_muc_am_thanh_lop_1.md
const AUDIO_SPEC_DATASET = [
  // ==========================================
  // 1. BẢNG 27 ÂM ĐẦU
  // ==========================================
  { key: 'am_dau__b', char: 'b', text: 'bờ' },
  { key: 'am_dau__c', char: 'c', text: 'cờ' },
  { key: 'am_dau__ch', char: 'ch', text: 'chờ' },
  { key: 'am_dau__d', char: 'd', text: 'dờ' },
  { key: 'am_dau__dd', char: 'đ', text: 'đờ' },
  { key: 'am_dau__g', char: 'g', text: 'gờ' },
  { key: 'am_dau__gh', char: 'gh', text: 'ghờ' },
  { key: 'am_dau__gi', char: 'gi', text: 'giờ' },
  { key: 'am_dau__h', char: 'h', text: 'hờ' },
  { key: 'am_dau__k', char: 'k', text: 'kờ' },
  { key: 'am_dau__kh', char: 'kh', text: 'khờ' },
  { key: 'am_dau__l', char: 'l', text: 'lờ' },
  { key: 'am_dau__m', char: 'm', text: 'mờ' },
  { key: 'am_dau__n', char: 'n', text: 'nờ' },
  { key: 'am_dau__ng', char: 'ng', text: 'ngờ' },
  { key: 'am_dau__ngh', char: 'ngh', text: 'nghờ' },
  { key: 'am_dau__nh', char: 'nh', text: 'nhờ' },
  { key: 'am_dau__p', char: 'p', text: 'pờ' },
  { key: 'am_dau__ph', char: 'ph', text: 'phờ' },
  { key: 'am_dau__qu', char: 'qu', text: 'quờ' },
  { key: 'am_dau__r', char: 'r', text: 'rờ' },
  { key: 'am_dau__s', char: 's', text: 'sờ' },
  { key: 'am_dau__t', char: 't', text: 'tờ' },
  { key: 'am_dau__th', char: 'th', text: 'thờ' },
  { key: 'am_dau__tr', char: 'tr', text: 'trờ' },
  { key: 'am_dau__v', char: 'v', text: 'vờ' },
  { key: 'am_dau__x', char: 'x', text: 'xờ' },

  // ==========================================
  // 2. BẢNG 6 DẤU THANH
  // ==========================================
  { key: 'thanh__ngang', char: 'ngang', text: 'thanh ngang' },
  { key: 'thanh__huyen', char: 'huyền', text: 'huyền' },
  { key: 'thanh__sac', char: 'sắc', text: 'sắc' },
  { key: 'thanh__hoi', char: 'hỏi', text: 'hỏi' },
  { key: 'thanh__nga', char: 'ngã', text: 'ngã' },
  { key: 'thanh__nang', char: 'nặng', text: 'nặng' },

  // ==========================================
  // 3. BẢNG TOÀN BỘ VẦN TIẾNG VIỆT LỚP 1
  // ==========================================
  // Nhóm 1: Vần đơn & Nguyên âm đôi (20 vần)
  { key: 'van__a', char: 'a', text: 'a' },
  { key: 'van__a_breve', char: 'ă', text: 'ă' },
  { key: 'van__a_hat', char: 'â', text: 'â' },
  { key: 'van__e', char: 'e', text: 'e' },
  { key: 'van__e_hat', char: 'ê', text: 'ê' },
  { key: 'van__i', char: 'i', text: 'i' },
  { key: 'van__y', char: 'y', text: 'y' },
  { key: 'van__o', char: 'o', text: 'o' },
  { key: 'van__o_hat', char: 'ô', text: 'ô' },
  { key: 'van__o_horn', char: 'ơ', text: 'ơ' },
  { key: 'van__u', char: 'u', text: 'u' },
  { key: 'van__u_horn', char: 'ư', text: 'ư' },
  { key: 'van__ia', char: 'ia', text: 'ia' },
  { key: 'van__ya', char: 'ya', text: 'ya' },
  { key: 'van__ie', char: 'iê', text: 'iê' },
  { key: 'van__ye', char: 'yê', text: 'yê' },
  { key: 'van__ua', char: 'ua', text: 'ua' },
  { key: 'van__uo_hat', char: 'uô', text: 'uô' },
  { key: 'van__ua_horn', char: 'ưa', text: 'ưa' },
  { key: 'van__uo_horn', char: 'ươ', text: 'ươ' },

  // Nhóm 2: Vần kết thúc bằng bán âm i/y, o/u (25 vần)
  { key: 'van__ai', char: 'ai', text: 'ai' },
  { key: 'van__ay', char: 'ay', text: 'ay' },
  { key: 'van__a_hat_y', char: 'ây', text: 'ây' },
  { key: 'van__ao', char: 'ao', text: 'ao' },
  { key: 'van__au', char: 'au', text: 'au' },
  { key: 'van__a_hat_u', char: 'âu', text: 'âu' },
  { key: 'van__eo', char: 'eo', text: 'eo' },
  { key: 'van__e_hat_u', char: 'êu', text: 'êu' },
  { key: 'van__iu', char: 'iu', text: 'iu' },
  { key: 'van__ieu', char: 'iêu', text: 'iêu' },
  { key: 'van__yeu', char: 'yêu', text: 'yêu' },
  { key: 'van__oi', char: 'oi', text: 'oi' },
  { key: 'van__o_hat_i', char: 'ôi', text: 'ôi' },
  { key: 'van__o_horn_i', char: 'ơi', text: 'ơi' },
  { key: 'van__ui', char: 'ui', text: 'ui' },
  { key: 'van__u_horn_i', char: 'ưi', text: 'ưi' },
  { key: 'van__uoi', char: 'uôi', text: 'uôi' },
  { key: 'van__u_horn_o_horn_i', char: 'ươi', text: 'ươi' },
  { key: 'van__oa', char: 'oa', text: 'oa' },
  { key: 'van__oe', char: 'oe', text: 'oe' },
  { key: 'van__oai', char: 'oai', text: 'oai' },
  { key: 'van__oay', char: 'oay', text: 'oay' },
  { key: 'van__oeo', char: 'oeo', text: 'oeo' },
  { key: 'van__uya', char: 'uya', text: 'uya' },
  { key: 'van__uyu', char: 'uyu', text: 'uyu' },

  // Nhóm 3: Vần kết thúc bằng phụ âm mũi m, n, ng, nh (56 vần)
  // Kết thúc -m:
  { key: 'van__am', char: 'am', text: 'am' },
  { key: 'van__a_breve_m', char: 'ăm', text: 'ăm' },
  { key: 'van__a_hat_m', char: 'âm', text: 'âm' },
  { key: 'van__em', char: 'em', text: 'em' },
  { key: 'van__e_hat_m', char: 'êm', text: 'êm' },
  { key: 'van__im', char: 'im', text: 'im' },
  { key: 'van__om', char: 'om', text: 'om' },
  { key: 'van__o_hat_m', char: 'ôm', text: 'ôm' },
  { key: 'van__o_horn_m', char: 'ơm', text: 'ơm' },
  { key: 'van__um', char: 'um', text: 'um' },
  { key: 'van__u_horn_m', char: 'ưm', text: 'ưm' },
  { key: 'van__iem', char: 'iêm', text: 'iêm' },
  { key: 'van__yem', char: 'yêm', text: 'yêm' },
  { key: 'van__uom', char: 'uôm', text: 'uôm' },
  { key: 'van__u_horn_o_horn_m', char: 'ươm', text: 'ươm' },
  { key: 'van__oam', char: 'oam', text: 'oam' },

  // Kết thúc -n:
  { key: 'van__an', char: 'an', text: 'an' },
  { key: 'van__a_breve_n', char: 'ăn', text: 'ăn' },
  { key: 'van__a_hat_n', char: 'ân', text: 'ân' },
  { key: 'van__en', char: 'en', text: 'en' },
  { key: 'van__e_hat_n', char: 'ên', text: 'ên' },
  { key: 'van__in', char: 'in', text: 'in' },
  { key: 'van__on', char: 'on', text: 'on' },
  { key: 'van__o_hat_n', char: 'ôn', text: 'ôn' },
  { key: 'van__o_horn_n', char: 'ơn', text: 'ơn' },
  { key: 'van__un', char: 'un', text: 'un' },
  { key: 'van__u_horn_n', char: 'ưn', text: 'ưn' },
  { key: 'van__ien', char: 'iên', text: 'iên' },
  { key: 'van__yen', char: 'yên', text: 'yên' },
  { key: 'van__uon', char: 'uôn', text: 'uôn' },
  { key: 'van__u_horn_o_horn_n', char: 'ươn', text: 'ươn' },
  { key: 'van__oan', char: 'oan', text: 'oan' },
  { key: 'van__o_breve_n', char: 'oăn', text: 'oăn' },
  { key: 'van__uan', char: 'uân', text: 'uân' },
  { key: 'van__uen', char: 'uên', text: 'uên' },

  // Kết thúc -ng:
  { key: 'van__ang', char: 'ang', text: 'ang' },
  { key: 'van__a_breve_ng', char: 'ăng', text: 'ăng' },
  { key: 'van__a_hat_ng', char: 'âng', text: 'âng' },
  { key: 'van__eng', char: 'eng', text: 'eng' },
  { key: 'van__e_hat_ng', char: 'êng', text: 'êng' },
  { key: 'van__ong', char: 'ong', text: 'ong' },
  { key: 'van__o_hat_ng', char: 'ông', text: 'ông' },
  { key: 'van__ung', char: 'ung', text: 'ung' },
  { key: 'van__u_horn_ng', char: 'ưng', text: 'ưng' },
  { key: 'van__ieng', char: 'iêng', text: 'iêng' },
  { key: 'van__yeng', char: 'yêng', text: 'yêng' },
  { key: 'van__uong', char: 'uông', text: 'uông' },
  { key: 'van__u_horn_o_horn_ng', char: 'ương', text: 'ương' },
  { key: 'van__oang', char: 'oang', text: 'oang' },
  { key: 'van__o_breve_ng', char: 'oăng', text: 'oăng' },
  { key: 'van__uang', char: 'uâng', text: 'uâng' },

  // Kết thúc -nh:
  { key: 'van__anh', char: 'anh', text: 'anh' },
  { key: 'van__e_hat_nh', char: 'ênh', text: 'ênh' },
  { key: 'van__inh', char: 'inh', text: 'inh' },
  { key: 'van__oanh', char: 'oanh', text: 'oanh' },
  { key: 'van__uynh', char: 'uynh', text: 'uynh' },

  // Nhóm 4: Vần kết thúc bằng phụ âm tắc p, t, c, ch (44 vần)
  // Kết thúc -p:
  { key: 'van__ap', char: 'ap', text: 'ap' },
  { key: 'van__a_breve_p', char: 'ăp', text: 'ăp' },
  { key: 'van__a_hat_p', char: 'âp', text: 'âp' },
  { key: 'van__ep', char: 'ep', text: 'ep' },
  { key: 'van__e_hat_p', char: 'êp', text: 'êp' },
  { key: 'van__ip', char: 'ip', text: 'ip' },
  { key: 'van__op', char: 'op', text: 'op' },
  { key: 'van__o_hat_p', char: 'ôp', text: 'ôp' },
  { key: 'van__o_horn_p', char: 'ơp', text: 'ơp' },
  { key: 'van__up', char: 'up', text: 'up' },
  { key: 'van__u_horn_p', char: 'ưp', text: 'ưp' },
  { key: 'van__iep', char: 'iêp', text: 'iêp' },
  { key: 'van__yep', char: 'yêp', text: 'yêp' },
  { key: 'van__u_horn_o_horn_p', char: 'ươp', text: 'ươp' },

  // Kết thúc -t:
  { key: 'van__at', char: 'at', text: 'at' },
  { key: 'van__a_breve_t', char: 'ăt', text: 'ăt' },
  { key: 'van__a_hat_t', char: 'ât', text: 'ât' },
  { key: 'van__et', char: 'et', text: 'et' },
  { key: 'van__e_hat_t', char: 'êt', text: 'êt' },
  { key: 'van__it', char: 'it', text: 'it' },
  { key: 'van__ot', char: 'ot', text: 'ot' },
  { key: 'van__o_hat_t', char: 'ôt', text: 'ôt' },
  { key: 'van__o_horn_t', char: 'ơt', text: 'ơt' },
  { key: 'van__ut', char: 'ut', text: 'ut' },
  { key: 'van__u_horn_t', char: 'ưt', text: 'ưt' },
  { key: 'van__iet', char: 'iêt', text: 'iêt' },
  { key: 'van__yet', char: 'yêt', text: 'yêt' },
  { key: 'van__uot', char: 'uôt', text: 'uôt' },
  { key: 'van__u_horn_o_horn_t', char: 'ươt', text: 'ươt' },
  { key: 'van__oat', char: 'oat', text: 'oat' },
  { key: 'van__o_breve_t', char: 'oăt', text: 'oăt' },
  { key: 'van__uat', char: 'uât', text: 'uât' },
  { key: 'van__uet', char: 'uêt', text: 'uêt' },
  { key: 'van__uyt', char: 'uyt', text: 'uyt' },

  // Kết thúc -c:
  { key: 'van__ac', char: 'ac', text: 'ac' },
  { key: 'van__a_breve_c', char: 'ăc', text: 'ăc' },
  { key: 'van__a_hat_c', char: 'âc', text: 'âc' },
  { key: 'van__ec', char: 'ec', text: 'ec' },
  { key: 'van__e_hat_c', char: 'êc', text: 'êc' },
  { key: 'van__oc', char: 'oc', text: 'óc' },
  { key: 'van__o_hat_c', char: 'ôc', text: 'ôc' },
  { key: 'van__uc', char: 'uc', text: 'uc' },
  { key: 'van__u_horn_c', char: 'ưc', text: 'ưc' },
  { key: 'van__iec', char: 'iêc', text: 'iêc' },
  { key: 'van__uoc', char: 'uôc', text: 'uôc' },
  { key: 'van__u_horn_o_horn_c', char: 'ươc', text: 'ươc' },
  { key: 'van__oac', char: 'oac', text: 'oac' },
  { key: 'van__o_breve_c', char: 'oăc', text: 'oăc' },

  // Kết thúc -ch:
  { key: 'van__ach', char: 'ach', text: 'ach' },
  { key: 'van__e_hat_ch', char: 'êch', text: 'ếch' },
  { key: 'van__ich', char: 'ich', text: 'ích' },
  { key: 'van__oach', char: 'oach', text: 'oach' },
  { key: 'van__uych', char: 'uych', text: 'uych' },

  // ==========================================
  // 4. BẢNG TIẾNG TRUNG GIAN & TỪ ĐẶC BIỆT SGK LỚP 1
  // ==========================================
  { key: 'tu__truong_ngang', char: 'trương', text: 'trương' },
  { key: 'tu__truong', char: 'trường', text: 'trường' },
  { key: 'tu__giat_ngang', char: 'giăt', text: 'giắt' },
  { key: 'tu__giat', char: 'giặt', text: 'giặt' },
  { key: 'tu__quang', char: 'quang', text: 'quang' },
  { key: 'tu__khuyu_ngang', char: 'khuyu', text: 'khuyu' },
  { key: 'tu__khuyu', char: 'khuỷu', text: 'khuỷu' },
  { key: 'tu__nguyen', char: 'nguyễn', text: 'nguyễn' },
  { key: 'tu__chich', char: 'chích', text: 'chích' },
  { key: 'tu__choe', char: 'chòe', text: 'chòe' },
  { key: 'tu__huych', char: 'huých', text: 'huých' },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function synthesizeWithTimeout(text) {
  const tts = new EdgeTTS();
  const synthPromise = async () => {
    await tts.synthesize(text, VOICE);
    return tts.toBuffer();
  };

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout WebSocket TTS')), TIMEOUT_MS)
  );

  return Promise.race([synthPromise(), timeoutPromise]);
}

async function generateAudioWithRetry(text, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const buffer = await synthesizeWithTimeout(text);
      if (buffer && buffer.length > 0) {
        return buffer;
      }
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await sleep(300 * attempt);
    }
  }
  throw new Error(`Không thể tạo audio cho: "${text}"`);
}

async function main() {
  console.log('='.repeat(75));
  console.log('🎤 BỘ SINH ÂM THANH NGỮ ÂM CHUẨN SGK TIẾNG VIỆT 1 (KẾT NỐI TRI THỨC)');
  console.log(`🎙️  Giọng đọc chuẩn: ${VOICE}`);
  console.log(`📂 Thư mục đích:    ${OUTPUT_DIR}`);
  console.log(`📊 Tổng số mẫu âm:  ${AUDIO_SPEC_DATASET.length} file`);
  console.log('='.repeat(75));

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const manifest = [];
  let successCount = 0;
  let skippedCount = 0;
  let failCount = 0;

  for (let i = 0; i < AUDIO_SPEC_DATASET.length; i++) {
    const item = AUDIO_SPEC_DATASET[i];
    const filename = `${item.key}.mp3`;
    const filePath = path.join(OUTPUT_DIR, filename);
    const progress = `[${String(i + 1).padStart(3, '0')}/${AUDIO_SPEC_DATASET.length}]`;

    // Nếu file đã tồn tại và hợp lệ (> 1KB) thì bỏ qua
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size > 1000) {
        skippedCount++;
        successCount++;
        manifest.push({
          key: item.key,
          char: item.char,
          text: item.text,
          filename,
          sizeBytes: stats.size,
        });
        continue;
      }
    }

    process.stdout.write(`${progress} Đang tạo: ${filename.padEnd(28)} ("${item.text}")... `);

    try {
      const buffer = await generateAudioWithRetry(item.text);
      fs.writeFileSync(filePath, buffer);
      const fileSizeKb = (buffer.length / 1024).toFixed(1);

      console.log(`✅ OK (${fileSizeKb} KB)`);
      successCount++;

      manifest.push({
        key: item.key,
        char: item.char,
        text: item.text,
        filename,
        sizeBytes: buffer.length,
      });

      await sleep(DELAY_MS);
    } catch (err) {
      console.log(`❌ LỖI: ${err.message}`);
      failCount++;
    }
  }

  // Ghi file manifest.json
  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log('='.repeat(75));
  console.log(`🎉 HOÀN TẤT SINH KHO ÂM THANH THEO ĐẶC TẢ!`);
  console.log(`✅ Tổng file hợp lệ: ${successCount}/${AUDIO_SPEC_DATASET.length} (Đã có sẵn: ${skippedCount}, Mới tạo: ${successCount - skippedCount})`);
  if (failCount > 0) console.log(`❌ Thất bại:        ${failCount} file`);
  console.log(`📄 Mục lục xác thực: raw-audio/manifest.json`);
  console.log('='.repeat(75));
}

main().catch((err) => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
