import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const componentPath = path.join(rootDir, 'src', 'components', 'kid', 'PhonicsKaraokeStage.tsx');

describe('PhonicsKaraokeStage Component & Montessori UI Standards', () => {
  it('1. Component file exists and exports PhonicsKaraokeStage', () => {
    assert.ok(fs.existsSync(componentPath), 'Phải tồn tại component PhonicsKaraokeStage.tsx');
    const content = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(content.includes('export const PhonicsKaraokeStage'), 'Phải export PhonicsKaraokeStage');
  });

  it('2. Đạt tiêu chuẩn Fitts touch target >= 56px cho ngón tay trẻ 6 tuổi', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(content.includes('min-w-[56px]'), 'Thẻ bài phải có chiều rộng tối thiểu 56px');
    assert.ok(content.includes('min-h-[62px]'), 'Thẻ bài phải có chiều cao tối thiểu 62px (> 56px)');
  });

  it('3. Đầy đủ các data-testid phục vụ kiểm thử và karaoke highlight', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(content.includes('data-testid="phonics-karaoke-stage-empty"'), 'Phải có testid cho trạng thái chờ');
    assert.ok(content.includes('data-testid="phonics-karaoke-stage"'), 'Phải có testid cho sân khấu đánh vần');
    assert.ok(content.includes('data-testid={`phonics-tile-${idx}`}'), 'Phải có testid cho từng thẻ bài đánh vần');
    assert.ok(content.includes('ring-amber-300'), 'Phải có hiệu ứng highlight viền vàng sáng Karaoke');
  });

  it('4. Có chức năng phát lại toàn từ và phát lại riêng từng mẩu âm 1-chạm', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(content.includes('onStepClick?.(idx, step)'), 'Bé chạm thẻ bài phải kích hoạt onStepClick');
    assert.ok(content.includes('onReplayWord'), 'Phải có nút nghe lại cả từ');
  });

  it('5. Cung cấp nhãn sư phạm tối giản cho chuỗi 5 bước (âm đầu, vần, tiếng, thanh, từ đọc)', () => {
    const content = fs.readFileSync(componentPath, 'utf-8');
    assert.ok(content.includes('âm đầu'), 'Phải có nhãn âm đầu');
    assert.ok(content.includes('vần'), 'Phải có nhãn vần');
    assert.ok(content.includes('tiếng'), 'Phải có nhãn tiếng');
    assert.ok(content.includes('từ đọc'), 'Phải có nhãn từ đọc');
  });
});
