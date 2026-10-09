import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const counsel = await readFile(new URL('../global-counsel.html', import.meta.url), 'utf8');
const privacy = await readFile(new URL('../privacy-readiness.html', import.meta.url), 'utf8');

test('Global Counsel clearly warns against entering sensitive case data', () => {
  assert.match(counsel, /لا تدخل أسماء كاملة أو أرقام هوية أو أسرارًا أو تفاصيل شديدة الحساسية/);
  assert.match(counsel, /لا يتم إرسال نموذجك إلى خادم في هذه النسخة/);
  assert.match(privacy, /غير جاهز لاستقبال ملفات حساسة/);
});

test('case organizer has no file-upload or client-side persistence path; network call is limited to payment session', () => {
  // Payment checkout has its own explicit API call. The case organizer must not submit case content.
  assert.match(counsel, /fetch\(['"]\/api\/adyen\/create-session['"]/);
  assert.doesNotMatch(counsel, /\bXMLHttpRequest\b/);
  assert.doesNotMatch(counsel, /\bsendBeacon\s*\(/i);
  assert.doesNotMatch(counsel, /\blocalStorage\b|\bsessionStorage\b/);
  assert.doesNotMatch(counsel, /<input[^>]+type=["']file["']/i);
  assert.doesNotMatch(counsel, /<form\b[^>]*\baction\s*=/i);
  assert.doesNotMatch(counsel, /fetch\s*\([^)]*(?:summary|caseText|caseDetails|evidence|documentContent)/is);
});

test('the clear control resets the case fields and generated summary', () => {
  assert.match(counsel, /id="clearBtn"/);
  assert.match(counsel, /document\.getElementById\("summary"\)\.value=""/);
  assert.match(counsel, /document\.getElementById\("goal"\)\.value=""/);
  assert.match(counsel, /delete o\.dataset\.generated/);
});

test('privacy checklist explicitly says checked boxes are not implementation evidence', () => {
  assert.match(privacy, /لا تمثل إثباتًا أن أي ضابط قد نُفذ/);
  assert.match(privacy, /لا تعتبر الخدمة جاهزة للملفات الحساسة إلا بعد تنفيذ المتطلبات/);
});
