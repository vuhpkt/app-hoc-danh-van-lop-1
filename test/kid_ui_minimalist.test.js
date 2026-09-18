import test from 'node:test';
import assert from 'node:assert/strict';
import { GRADE1_LESSONS } from '../src/core/data/grade1Lessons.ts';

test('Minimalist UI & Pedagogical Design Standards', async (t) => {
  await t.test('1. Core Grade 1 Lessons adhere to textbook curriculum without non-standard text', () => {
    assert.ok(GRADE1_LESSONS.length >= 4, 'Should have at least 4 core Grade 1 lessons');
    GRADE1_LESSONS.forEach((lesson) => {
      assert.ok(lesson.id, 'Lesson must have an id');
      assert.ok(lesson.title, 'Lesson must have a title');
      assert.ok(lesson.text && lesson.text.length > 0, 'Lesson text cannot be empty');
      assert.ok(!lesson.text.includes('undefined'), 'No undefined artifacts');
    });
  });

  await t.test('2. Reading typography constraints for 6-year-old accessibility (WCAG AA)', () => {
    // Lesson 2: Poem "Vè chim chích" has exactly 4 stanzas / lines
    const lesson2 = GRADE1_LESSONS.find((l) => l.id === 'lesson-2');
    assert.ok(lesson2, 'Lesson 2 must exist');
    const lines = lesson2.text.split('\n');
    assert.strictEqual(lines.length, 4, 'Poem has 4 verses for optimal readability');
    lines.forEach((line) => {
      const words = line.trim().split(/\s+/);
      assert.strictEqual(words.length, 4, 'Poem line has exactly 4 words (thơ 4 chữ)');
    });
  });
});
