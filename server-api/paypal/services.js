// Server-authoritative AION Teacher service catalog.
// Client input is matched against this allowlist; prices are never trusted from the browser.

export const SERVICE_CATALOG = Object.freeze({
  "تحضير درس كامل": Object.freeze({ id: "lesson-plan", price: 1.33, description: "تحضير درس احترافي." }),
  "تحضير 5 دروس": Object.freeze({ id: "five-lesson-plan", price: 2.67, description: "باقة 5 دروس." }),
  "خطة وحدة كاملة": Object.freeze({ id: "unit-plan", price: 1.87, description: "خطة وحدة كاملة." }),
  "ورقة عمل كاملة": Object.freeze({ id: "worksheet", price: 1.33, description: "ورقة عمل + إجابات." }),
  "أسئلة مشاركة صفية": Object.freeze({ id: "class-questions", price: 1.33, description: "20 سؤال تفاعلي." }),
  "20 سؤال واجب": Object.freeze({ id: "homework-questions", price: 1.33, description: "20 سؤال واجب." }),
  "اختبار شهري": Object.freeze({ id: "monthly-test", price: 1.87, description: "اختبار شهري كامل." }),
  "اختبار فصلي": Object.freeze({ id: "term-test", price: 2.13, description: "اختبار فصلي شامل." }),
  "اختبار نهائي": Object.freeze({ id: "final-test", price: 2.67, description: "اختبار نهائي كامل." }),
  "بنك أسئلة كامل": Object.freeze({ id: "question-bank", price: 2.67, description: "بنك أسئلة شامل." }),
  "مراجعة درس كامل": Object.freeze({ id: "lesson-review", price: 0.53, description: "مراجعة درس." }),
  "مراجعة وحدة كاملة": Object.freeze({ id: "unit-review", price: 0.8, description: "مراجعة وحدة." }),
  "حل جميع أسئلة درس": Object.freeze({ id: "lesson-solutions", price: 0.8, description: "حل أسئلة درس." }),
  "حل كتاب كامل": Object.freeze({ id: "book-solutions", price: 1.33, description: "حل كتاب كامل." }),
  "توقع اختبار شهري": Object.freeze({ id: "monthly-prediction", price: 2.13, description: "توقع اختبار شهري." }),
  "توقع اختبار فصلي": Object.freeze({ id: "term-prediction", price: 2.13, description: "توقع اختبار فصلي." }),
  "توقع اختبار نهائي": Object.freeze({ id: "final-prediction", price: 2.13, description: "توقع اختبار نهائي." }),
  "مراجعة اختبار شاملة": Object.freeze({ id: "exam-review", price: 2.13, description: "مراجعة شاملة." }),
  "شرح مفهوم صعب": Object.freeze({ id: "hard-concept", price: 0.53, description: "شرح مبسط." }),
  "خطة مذاكرة أسبوعية": Object.freeze({ id: "weekly-study-plan", price: 0.53, description: "خطة مذاكرة." }),
  "ملخص شامل لمادة": Object.freeze({ id: "subject-summary", price: 0.8, description: "ملخص مادة." })
});

export function getService(title) {
  if (typeof title !== "string") return null;
  return SERVICE_CATALOG[title.trim()] || null;
}
