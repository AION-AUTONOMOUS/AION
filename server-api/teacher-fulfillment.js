import { getJson, setJson, addToIndex } from '../config/aion-stack-store.js';

function text(v, max=16000) { return String(v ?? '').trim().slice(0, max); }

function outputFormat(serviceId) {
  const map = {
    'lesson-plan': 'تحضير درس منظم: الأهداف، التمهيد، الشرح، الأنشطة، الوسائل، التقويم، الواجب، والإجابات.',
    'five-lesson-plan': 'خمس خطط دروس كاملة ومنفصلة.',
    'unit-plan': 'خطة وحدة تعليمية شاملة مع الأهداف والتسلسل والأنشطة والتقويم.',
    'worksheet': 'ورقة عمل جاهزة مع أسئلة متنوعة ثم نموذج إجابة.',
    'class-questions': '20 سؤال مشاركة صفية مع إجابات مختصرة.',
    'homework-questions': '20 سؤال واجب مع الإجابات.',
    'monthly-test': 'اختبار شهري متوازن مع نموذج الإجابة.',
    'term-test': 'اختبار فصلي شامل مع نموذج الإجابة.',
    'final-test': 'اختبار نهائي شامل مع نموذج الإجابة.',
    'question-bank': 'بنك أسئلة كبير ومصنف حسب المهارة مع الإجابات.',
    'lesson-review': 'مراجعة درس مركزة: مفاهيم، نقاط مهمة، أسئلة وإجابات.',
    'unit-review': 'مراجعة وحدة شاملة مع أسئلة وإجابات.',
    'lesson-solutions': 'حلول واضحة ومتدرجة لأسئلة الدرس المقدمة.',
    'book-solutions': 'حلول منظمة للأسئلة التي يمكن استخراجها من المحتوى المقدم.',
    'monthly-prediction': 'نموذج توقع تدريبي للاختبار الشهري مع تبرير تربوي، وليس ادعاء معرفة الأسئلة الحقيقية.',
    'term-prediction': 'نموذج توقع تدريبي للاختبار الفصلي مع تبرير تربوي، وليس ادعاء معرفة الأسئلة الحقيقية.',
    'final-prediction': 'نموذج توقع تدريبي للاختبار النهائي مع تبرير تربوي، وليس ادعاء معرفة الأسئلة الحقيقية.',
    'exam-review': 'مراجعة اختبار شاملة مع تصحيح وشرح ونقاط تحسين.',
    'hard-concept': 'شرح مبسط ومتدرج للمفهوم الصعب مع مثال وتمرين.',
    'weekly-study-plan': 'خطة مذاكرة أسبوعية يومية قابلة للتنفيذ.',
    'subject-summary': 'ملخص شامل للمادة اعتمادًا على المحتوى المقدم.'
  };
  return map[serviceId] || 'منتج تعليمي احترافي كامل.';
}

export async function fulfillTeacherOrder(orderId) {
  const order = await getJson('teacher-orders:' + text(orderId, 100));
  if (!order) throw new Error('Teacher order not found');
  if (order.paymentStatus !== 'confirmed') throw new Error('Teacher fulfillment requires confirmed payment');
  if (order.deliveryStatus === 'delivered' && order.deliveryContent) return {status:'delivered',content:order.deliveryContent};

  if (!process.env.GROQ_API_KEY) {
    const blocked = {...order, status:'FULFILLMENT_BLOCKED', fulfillmentStatus:'blocked', fulfillmentError:'AI provider is not configured', updatedAt:new Date().toISOString()};
    await setJson('teacher-orders:' + order.id, blocked);
    return {status:'blocked',reason:'AI provider is not configured'};
  }

  const processing = {...order, status:'PROCESSING', fulfillmentStatus:'processing', updatedAt:new Date().toISOString()};
  await setJson('teacher-orders:' + order.id, processing);

  const system = 'أنت محرك AION Teacher لتنفيذ خدمات تعليمية مدفوعة. أنشئ منتجًا تعليميًا عربيًا دقيقًا اعتمادًا فقط على البيانات المقدمة. لا تدّع معرفة أسئلة امتحان حقيقية أو معلومات غير موجودة. إذا كان المحتوى ناقصًا، اذكر ذلك بوضوح وقدم أفضل منتج ممكن دون اختلاق مصادر.';
  const user = [
    'الخدمة: ' + order.serviceTitle,
    'نوع الخدمة: ' + order.serviceId,
    'الدولة: ' + order.country,
    'الصف: ' + order.grade,
    'المادة: ' + order.subject,
    'الفصل: ' + order.term,
    'متطلبات العميل: ' + order.details,
    'محتوى PDF المستخرج: ' + order.pdfText,
    'صيغة الإخراج المطلوبة: ' + outputFormat(order.serviceId)
  ].join('\n\n');

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:'POST',
      headers:{Authorization:'Bearer '+process.env.GROQ_API_KEY,'Content-Type':'application/json'},
      body:JSON.stringify({
        model: process.env.AION_TEACHER_MODEL || 'openai/gpt-oss-120b',
        messages:[{role:'system',content:system},{role:'user',content:user}],
        temperature:0.35
      })
    });
    const raw=await response.text();
    let data={}; try{data=JSON.parse(raw)}catch{}
    if(!response.ok) throw new Error(data?.error?.message||'AI provider error');
    const content=data.choices?.[0]?.message?.content;
    if(typeof content!=='string'||!content.trim()) throw new Error('AI provider returned no educational product');

    const delivery={
      id:'AION-TCH-DEL-'+Date.now().toString(36).toUpperCase(),
      orderId:order.id,
      serviceId:order.serviceId,
      status:'delivered',
      content:text(content,30000),
      generatedAt:new Date().toISOString(),
      provider:'groq',
      model:process.env.AION_TEACHER_MODEL || 'openai/gpt-oss-120b'
    };
    await setJson('teacher-delivery:'+order.id,delivery);
    await addToIndex('teacher-revenue', order.id);
    const completed={...processing,status:'DELIVERED',fulfillmentStatus:'completed',deliveryStatus:'delivered',deliveryId:delivery.id,deliveryContent:delivery.content,deliveredAt:delivery.generatedAt,updatedAt:delivery.generatedAt};
    await setJson('teacher-orders:'+order.id,completed);
    return {status:'delivered',content:delivery.content,deliveryId:delivery.id};
  } catch(error) {
    const failed={...processing,status:'FULFILLMENT_FAILED',fulfillmentStatus:'failed',fulfillmentError:String(error?.message||error),updatedAt:new Date().toISOString()};
    await setJson('teacher-orders:'+order.id,failed);
    return {status:'failed',reason:String(error?.message||error)};
  }
}

