/**
 * scripts/generate-zalo-tts.js
 * 
 * Script tự động sinh toàn bộ kho âm thanh chuẩn SGK Tiếng Việt 1 qua Zalo AI TTS API
 * NGUỒN DANH MỤC: danh_muc_am_thanh_lop_1.md
 * 
 * Hướng dẫn sử dụng:
 *   node scripts/generate-zalo-tts.js --api-key=YOUR_API_KEY
 *   Tùy chọn:
 *     --overwrite     : Ghi đè các file đã có
 *     --speaker=2     : 1: Nữ Nam, 2: Nữ Bắc (Ngọc Huyền), 3: Nam Bắc, 4: Nam Nam
 *     --limit=10      : Giới hạn số lượng file cần sinh (để test)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const RAW_DIR = path.join(rootDir, 'raw-audio');
const MANIFEST_FILE = path.join(RAW_DIR, 'manifest.json');
const ZALO_API_ENDPOINT = 'https://api.zalo.ai/v1/tts/synthesize';

// Lấy API Key từ tham số CLI (--api-key=...) hoặc biến môi trường
let apiKey = process.env.ZALO_API_KEY || 'yVryikwVR8F9V5ei1C6b0yT5k17XE59P';
const apiKeyArg = process.argv.find((arg) => arg.startsWith('--api-key='));
if (apiKeyArg) {
  apiKey = apiKeyArg.split('=')[1].trim();
}

const isOverwrite = process.argv.includes('--overwrite') || process.argv.includes('--force');

// Speaker ID: 2 = Nữ miền Bắc (Ngọc Huyền), 1 = Nữ miền Nam
const speakerIdArg = process.argv.find((arg) => arg.startsWith('--speaker='));
const SPEAKER_ID = speakerIdArg ? speakerIdArg.split('=')[1].trim() : '2';

// Giới hạn test (nếu có)
const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1].trim(), 10) : 0;

// Tốc độ: 0.9x cho trẻ lớp 1 dễ nghe
const SPEED = '0.9';

// BẢNG DANH MỤC CHUẨN 100% TỪ danh_muc_am_thanh_lop_1.md (189 items)
const AUDIO_DATASET = [
  // ==========================================
  // 1. 28 ÂM ĐẦU SƯ PHẠM (Đọc theo tên chữ)
  // ==========================================
  { key: 'am_dau__b', text: 'bờ' },
  { key: 'am_dau__c', text: 'cờ' },
  { key: 'am_dau__ch', text: 'chờ' },
  { key: 'am_dau__d', text: 'dờ' },
  { key: 'am_dau__dd', text: 'đờ' },
  { key: 'am_dau__g', text: 'gờ' },
  { key: 'am_dau__gh', text: 'ghờ' },
  { key: 'am_dau__gi', text: 'giờ' },
  { key: 'am_dau__h', text: 'hờ' },
  { key: 'am_dau__k', text: 'kờ' },
  { key: 'am_dau__kh', text: 'khờ' },
  { key: 'am_dau__l', text: 'lờ' },
  { key: 'am_dau__m', text: 'mờ' },
  { key: 'am_dau__n', text: 'nờ' },
  { key: 'am_dau__ng', text: 'ngờ' },
  { key: 'am_dau__ngh', text: 'nghờ' },
  { key: 'am_dau__nh', text: 'nhờ' },
  { key: 'am_dau__p', text: 'pờ' },
  { key: 'am_dau__ph', text: 'phờ' },
  { key: 'am_dau__qu', text: 'quờ' },
  { key: 'am_dau__r', text: 'rờ' },
  { key: 'am_dau__s', text: 'sờ' },
  { key: 'am_dau__t', text: 'tờ' },
  { key: 'am_dau__th', text: 'thờ' },
  { key: 'am_dau__tr', text: 'trờ' },
  { key: 'am_dau__v', text: 'vờ' },
  { key: 'am_dau__x', text: 'xờ' },

  // ==========================================
  // 2. 6 DẤU THANH
  // ==========================================
  { key: 'thanh__ngang', text: 'thanh ngang' },
  { key: 'thanh__huyen', text: 'huyền' },
  { key: 'thanh__sac', text: 'sắc' },
  { key: 'thanh__hoi', text: 'hỏi' },
  { key: 'thanh__nga', text: 'ngã' },
  { key: 'thanh__nang', text: 'nặng' },

  // ==========================================
  // 3. TOÀN BỘ VẦN TIẾNG VIỆT LỚP 1
  // ==========================================
  // Nhóm 1: Vần đơn & Nguyên âm đôi (20 vần)
  { key: 'van__a', text: 'a' },
  { key: 'van__a_breve', text: 'ă' },
  { key: 'van__a_hat', text: 'â' },
  { key: 'van__e', text: 'e' },
  { key: 'van__e_hat', text: 'ê' },
  { key: 'van__i', text: 'i' },
  { key: 'van__y', text: 'y' },
  { key: 'van__o', text: 'o' },
  { key: 'van__o_hat', text: 'ô' },
  { key: 'van__o_horn', text: 'ơ' },
  { key: 'van__u', text: 'u' },
  { key: 'van__u_horn', text: 'ư' },
  { key: 'van__ia', text: 'ia' },
  { key: 'van__ya', text: 'ya' },
  { key: 'van__ie', text: 'iê' },
  { key: 'van__ye', text: 'yê' },
  { key: 'van__ua', text: 'ua' },
  { key: 'van__uo_hat', text: 'uô' },
  { key: 'van__ua_horn', text: 'ưa' },
  { key: 'van__uo_horn', text: 'ươ' },

  // Nhóm 2: Vần kết thúc bằng bán âm i/y, o/u (25 vần)
  { key: 'van__ai', text: 'ai' },
  { key: 'van__ay', text: 'ay' },
  { key: 'van__a_hat_y', text: 'ây' },
  { key: 'van__ao', text: 'ao' },
  { key: 'van__au', text: 'au' },
  { key: 'van__a_hat_u', text: 'âu' },
  { key: 'van__eo', text: 'eo' },
  { key: 'van__e_hat_u', text: 'êu' },
  { key: 'van__iu', text: 'iu' },
  { key: 'van__ieu', text: 'iêu' },
  { key: 'van__yeu', text: 'yêu' },
  { key: 'van__oi', text: 'oi' },
  { key: 'van__o_hat_i', text: 'ôi' },
  { key: 'van__o_horn_i', text: 'ơi' },
  { key: 'van__ui', text: 'ui' },
  { key: 'van__u_horn_i', text: 'ưi' },
  { key: 'van__uoi', text: 'uôi' },
  { key: 'van__u_horn_o_horn_i', text: 'ươi' },
  { key: 'van__oa', text: 'oa' },
  { key: 'van__oe', text: 'oe' },
  { key: 'van__oai', text: 'oai' },
  { key: 'van__oay', text: 'oay' },
  { key: 'van__uay', text: 'uây' },
  { key: 'van__ue', text: 'uê' },
  { key: 'van__oeo', text: 'oeo' },
  { key: 'van__uya', text: 'uya' },
  { key: 'van__uyu', text: 'uyu' },
  { key: 'van__ui_horn_i', text: 'uôi' },

  // Nhóm 3: Vần kết thúc bằng âm mũi m, n, ng, nh (~45 vần)
  { key: 'van__am', text: 'am' },
  { key: 'van__a_breve_m', text: 'ăm' },
  { key: 'van__a_hat_m', text: 'âm' },
  { key: 'van__em', text: 'em' },
  { key: 'van__e_hat_m', text: 'êm' },
  { key: 'van__im', text: 'im' },
  { key: 'van__om', text: 'om' },
  { key: 'van__o_hat_m', text: 'ôm' },
  { key: 'van__o_horn_m', text: 'ơm' },
  { key: 'van__um', text: 'um' },
  { key: 'van__u_horn_m', text: 'ưm' },
  { key: 'van__iem', text: 'iêm' },
  { key: 'van__yem', text: 'yêm' },
  { key: 'van__uom_hat', text: 'uôm' },
  { key: 'van__uom_horn', text: 'ươm' },
  { key: 'van__oam', text: 'oam' },
  { key: 'van__an', text: 'an' },
  { key: 'van__a_breve_n', text: 'ăn' },
  { key: 'van__a_hat_n', text: 'ân' },
  { key: 'van__en', text: 'en' },
  { key: 'van__e_hat_n', text: 'ên' },
  { key: 'van__in', text: 'in' },
  { key: 'van__on', text: 'on' },
  { key: 'van__o_hat_n', text: 'ôn' },
  { key: 'van__o_horn_n', text: 'ơn' },
  { key: 'van__un', text: 'un' },
  { key: 'van__u_horn_n', text: 'ưn' },
  { key: 'van__ien', text: 'iên' },
  { key: 'van__yen', text: 'yên' },
  { key: 'van__uan_hat', text: 'uôn' },
  { key: 'van__uan_horn', text: 'ươn' },
  { key: 'van__oan', text: 'oan' },
  { key: 'van__oan_breve', text: 'oăn' },
  { key: 'van__uan_hat_a', text: 'uân' },
  { key: 'van__uen', text: 'uên' },
  { key: 'van__uyen', text: 'uyên' },
  { key: 'van__ang', text: 'ang' },
  { key: 'van__a_breve_ng', text: 'ăng' },
  { key: 'van__a_hat_ng', text: 'âng' },
  { key: 'van__eng', text: 'eng' },
  { key: 'van__e_hat_ng', text: 'êng' },
  { key: 'van__ong', text: 'ong' },
  { key: 'van__o_hat_ng', text: 'ông' },
  { key: 'van__ung', text: 'ung' },
  { key: 'van__u_horn_ng', text: 'ưng' },
  { key: 'van__ieng', text: 'iêng' },
  { key: 'van__yeng', text: 'yêng' },
  { key: 'van__uong_hat', text: 'uông' },
  { key: 'van__uong_horn', text: 'ương' },
  { key: 'van__oang', text: 'oang' },
  { key: 'van__oang_breve', text: 'oăng' },
  { key: 'van__uang_hat', text: 'uâng' },
  { key: 'van__anh', text: 'anh' },
  { key: 'van__e_hat_nh', text: 'ênh' },
  { key: 'van__inh', text: 'inh' },
  { key: 'van__oanh', text: 'oanh' },
  { key: 'van__uynh', text: 'uynh' },

  // Nhóm 4: Vần kết thúc bằng phụ âm tắc p, t, c, ch (44 vần) - Đọc bằng dạng thanh sắc
  // Kết thúc -p:
  { key: 'van__ap', text: 'áp' },
  { key: 'van__a_breve_p', text: 'ắp' },
  { key: 'van__a_hat_p', text: 'ấp' },
  { key: 'van__ep', text: 'ép' },
  { key: 'van__e_hat_p', text: 'ếp' },
  { key: 'van__ip', text: 'íp' },
  { key: 'van__op', text: 'óp' },
  { key: 'van__o_hat_p', text: 'ốp' },
  { key: 'van__o_horn_p', text: 'ớp' },
  { key: 'van__up', text: 'úp' },
  { key: 'van__u_horn_p', text: 'úp' },
  { key: 'van__iep', text: 'iếp' },
  { key: 'van__uop_hat', text: 'uốp' },
  { key: 'van__uop_horn', text: 'ướp' },

  // Kết thúc -t:
  { key: 'van__at', text: 'át' },
  { key: 'van__a_breve_t', text: 'ắt' },
  { key: 'van__a_hat_t', text: 'ất' },
  { key: 'van__et', text: 'ét' },
  { key: 'van__e_hat_t', text: 'ết' },
  { key: 'van__it', text: 'ít' },
  { key: 'van__ot', text: 'ót' },
  { key: 'van__o_hat_t', text: 'ốt' },
  { key: 'van__o_horn_t', text: 'ớt' },
  { key: 'van__ut', text: 'út' },
  { key: 'van__u_horn_t', text: 'ứt' },
  { key: 'van__iet', text: 'iết' },
  { key: 'van__uot_hat', text: 'uốt' },
  { key: 'van__uot_horn', text: 'ướt' },
  { key: 'van__oat', text: 'oát' },
  { key: 'van__oat_breve', text: 'oắt' },
  { key: 'van__uat_hat', text: 'uất' },
  { key: 'van__uyet', text: 'uyết' },
  { key: 'van__uyt', text: 'uýt' },

  // Kết thúc -c:
  { key: 'van__ac', text: 'ác' },
  { key: 'van__a_breve_c', text: 'ắc' },
  { key: 'van__a_hat_c', text: 'ấc' },
  { key: 'van__ec', text: 'éc' },
  { key: 'van__e_hat_c', text: 'ếc' },
  { key: 'van__oc', text: 'óc' },
  { key: 'van__o_hat_c', text: 'ốc' },
  { key: 'van__uc', text: 'úc' },
  { key: 'van__u_horn_c', text: 'ức' },
  { key: 'van__iec', text: 'iếc' },
  { key: 'van__uoc_hat', text: 'uốc' },
  { key: 'van__uoc_horn', text: 'ước' },
  { key: 'van__oac', text: 'oác' },
  { key: 'van__oac_breve', text: 'oắc' },

  // Kết thúc -ch:
  { key: 'van__ach', text: 'ách' },
  { key: 'van__e_hat_ch', text: 'ếch' },
  { key: 'van__ich', text: 'ích' },
  { key: 'van__oach', text: 'oách' },
  { key: 'van__uych', text: 'uých' },

  // ==========================================
  // 4. TIẾNG TRUNG GIAN & TỪ ĐẶC BIỆT SGK LỚP 1
  // ==========================================
  { key: 'tu__giat_sac', text: 'giắt' },
  { key: 'tu__giat', text: 'giặt' },
  { key: 'tu__hoc_sac', text: 'hóc' },
  { key: 'tu__hoc', text: 'học' },
  { key: 'tu__vit_sac', text: 'vít' },
  { key: 'tu__vit', text: 'vịt' },
  { key: 'tu__mat_sac', text: 'mắt' },
  { key: 'tu__mat', text: 'mặt' },
  { key: 'tu__quat_sac', text: 'quát' },
  { key: 'tu__quat', text: 'quạt' },
  { key: 'tu__chuot_sac', text: 'chuốt' },
  { key: 'tu__chuot', text: 'chuột' },
  { key: 'tu__bat', text: 'bắt' },
  { key: 'tu__hat', text: 'hát' },
  { key: 'tu__sach', text: 'sách' },
  { key: 'tu__quoc', text: 'quốc' },
  { key: 'tu__truong_ngang', text: 'trương' },
  { key: 'tu__truong', text: 'trường' },
  { key: 'tu__quang', text: 'quang' },
  { key: 'tu__khuyu_ngang', text: 'khuyu' },
  { key: 'tu__khuyu', text: 'khuỷu' },
  { key: 'tu__nguyen', text: 'nguyễn' },
  { key: 'tu__chich', text: 'chích' },
  { key: 'tu__choe', text: 'chòe' },
  { key: 'tu__huych', text: 'huých' },
  { key: 'tu__chim', text: 'chim' },
  { key: 'tu__hoa', text: 'hoa' },
  { key: 'tu__me_ngang', text: 'me' },
  { key: 'tu__me', text: 'mẹ' },
  { key: 'tu__be_ngang', text: 'be' },
  { key: 'tu__be', text: 'bé' },
  { key: 'tu__ban_ngang', text: 'ban' },
  { key: 'tu__ban', text: 'bạn' },
  { key: 'tu__it_nang', text: 'ịt' },
  { key: 'tu__ac_nang', text: 'ạc' },
];

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function synthesizeZaloVoice(text, apiKey, speakerId = '2') {
  const bodyParams = new URLSearchParams({
    input: text,
    speaker_id: speakerId,
    speed: SPEED,
    encode_type: '1', // mp3
  });

  const response = await fetch(ZALO_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'apikey': apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: bodyParams.toString(),
  });

  if (!response.ok) {
    throw new Error(`Zalo API HTTP Error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  if (json.error_code !== 0) {
    throw new Error(`Zalo API Error (${json.error_code}): ${json.error_message}`);
  }

  return json.data.url;
}

/**
 * Tải file từ Zalo CDN có cơ chế thăm dò (polling) vì CDN cần ~800ms để render file xong
 */
async function downloadAudioWithPolling(url, destPath, maxAttempts = 6) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await delay(600 * attempt);

    try {
      const res = await fetch(url);
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        if (arrayBuffer.byteLength > 1000) {
          fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
          return arrayBuffer.byteLength;
        }
      }
    } catch (err) {
      // retry
    }
  }

  throw new Error(`Quá thời gian chờ file sẵn sàng trên Zalo CDN: ${url}`);
}

async function main() {
  console.log('='.repeat(75));
  console.log('🎙️  ZALO AI TEXT-TO-SPEECH GENERATOR - TIẾNG VIỆT LỚP 1');
  console.log(`🔊 Speaker ID: ${SPEAKER_ID} (1: Nữ Nam, 2: Nữ Bắc Ngọc Huyền, 3: Nam Bắc, 4: Nam Nam)`);
  console.log(`📂 Output:     ${RAW_DIR}`);
  console.log(`⚡ Chế độ:     ${isOverwrite ? 'GHI ĐÈ TẤT CẢ (--overwrite)' : 'Bỏ qua file đã tồn tại'}`);
  console.log('='.repeat(75));

  if (!apiKey) {
    console.error('\n❌ THIẾU API KEY CỦA ZALO AI!');
    process.exit(1);
  }

  if (!fs.existsSync(RAW_DIR)) {
    fs.mkdirSync(RAW_DIR, { recursive: true });
  }

  // Đọc manifest cũ nếu có để nhận diện mục đã đổi text cần tải lại
  const oldManifestMap = new Map();
  if (fs.existsSync(MANIFEST_FILE)) {
    try {
      const oldList = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf-8'));
      for (const entry of oldList) {
        oldManifestMap.set(entry.key, entry);
      }
    } catch {}
  }

  // Dọn dẹp các file rác cũ đã bị loại khỏi danh mục
  const garbageFiles = ['tu__giat_ngang.mp3'];
  for (const gf of garbageFiles) {
    const gfPath = path.join(RAW_DIR, gf);
    if (fs.existsSync(gfPath)) {
      try {
        fs.unlinkSync(gfPath);
        console.log(`🗑️ Đã xóa file rác cũ: ${gf}`);
      } catch {}
    }
  }

  const manifest = [];
  let successCount = 0;
  let skipCount = 0;

  const datasetToRun = LIMIT > 0 ? AUDIO_DATASET.slice(0, LIMIT) : AUDIO_DATASET;

  // Xử lý song song từng cặp 2 items để tối ưu tốc độ mà không bị nghẽn rate limit
  const BATCH_SIZE = 2;
  for (let i = 0; i < datasetToRun.length; i += BATCH_SIZE) {
    const batch = datasetToRun.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (item, batchIdx) => {
        const itemIndex = i + batchIdx + 1;
        const filename = `${item.key}.mp3`;
        const targetPath = path.join(RAW_DIR, filename);

        const oldEntry = oldManifestMap.get(item.key);
        const textChanged = !oldEntry || oldEntry.text !== item.text;

        if (!isOverwrite && !textChanged && fs.existsSync(targetPath) && fs.statSync(targetPath).size > 1024) {
          skipCount++;
          manifest.push({ key: item.key, filename, text: item.text });
          return;
        }

        if (textChanged && oldEntry) {
          console.log(`  [${String(itemIndex).padStart(3, '0')}/${datasetToRun.length}] 🔄 Cập nhật text mới cho ${item.key}: "${oldEntry.text}" -> "${item.text}"`);
        }

        try {
          const audioUrl = await synthesizeZaloVoice(item.text, apiKey, SPEAKER_ID);
          const byteSize = await downloadAudioWithPolling(audioUrl, targetPath);
          successCount++;
          console.log(`  [${String(itemIndex).padStart(3, '0')}/${datasetToRun.length}] ✅ ${item.key.padEnd(25)} ("${item.text}") -> ${(byteSize / 1024).toFixed(1)} KB`);
          manifest.push({ key: item.key, filename, text: item.text });
        } catch (err) {
          console.error(`  [${String(itemIndex).padStart(3, '0')}/${datasetToRun.length}] ❌ Lỗi ${item.key}: ${err.message}`);
        }
      })
    );

    // Nghỉ nhẹ 100ms giữa các batch
    await delay(100);
  }

  // Cập nhật manifest.json
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log('\n' + '='.repeat(75));
  console.log(`🎉 HOÀN TẤT: Tạo mới ${successCount} file, Bỏ qua ${skipCount} file.`);
  console.log(`📋 Đã lưu danh mục vào: ${MANIFEST_FILE}`);
  console.log('👉 Tiếp theo, hãy chạy lệnh sau để đóng gói Audio Sprite:');
  console.log('   npm run build:sprite');
  console.log('='.repeat(75));
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
