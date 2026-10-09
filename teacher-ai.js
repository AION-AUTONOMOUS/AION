(function () {
  if (document.getElementById('teacherAI')) return;

  const HISTORY_KEY = 'teacherAIConversation_v2';
  const MAX_TURNS = 10;
  const MAX_CONTEXT_CHARS = 8500;
  const escapeHTML = (value) => String(value).replace(/[&<>"]/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
  }[c]));

  let history = [];
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    if (Array.isArray(saved)) history = saved.slice(-MAX_TURNS * 2);
  } catch (_) {}

  const style = document.createElement('style');
  style.textContent = '#teacherAI{position:fixed;left:16px;bottom:16px;z-index:99998}#teacherAI button{border:0;border-radius:999px;padding:12px 18px;background:#38bdf8;color:#020817;font-weight:900;box-shadow:0 8px 24px rgba(0,0,0,.25);cursor:pointer}#teacherAIBox{display:none;position:fixed;inset:auto 16px 72px 16px;max-width:520px;margin:auto;background:#071426;border:1px solid #38bdf8;border-radius:20px;padding:16px;box-shadow:0 20px 60px rgba(0,0,0,.5)}#teacherAIBox.open{display:block}#teacherAIMsg{height:260px;overflow:auto;background:#020817;border-radius:12px;padding:12px;margin-bottom:10px;line-height:1.7;font-size:14px;white-space:pre-wrap}#teacherAIInput{width:100%;min-height:70px;background:#020817;color:#fff;border:1px solid rgba(56,189,248,.5);border-radius:12px;padding:10px;font-family:inherit}#teacherAISend{margin-top:8px;width:100%;padding:12px;border:0;border-radius:12px;background:#38bdf8;color:#020817;font-weight:900}#teacherAISend:disabled{opacity:.6;cursor:wait}';
  document.head.appendChild(style);

  const widget = document.createElement('div');
  widget.id = 'teacherAI';
  widget.innerHTML = '<button type="button" id="teacherAIButton">🤖 المعلم الذكي</button><div id="teacherAIBox"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><strong style="color:#38bdf8">🤖 مساعد Teacher الذكي</strong><button id="teacherAIClose" style="border:0;background:none;color:#fff;font-size:20px">×</button></div><div id="teacherAIMsg"></div><textarea id="teacherAIInput" placeholder="اكتب سؤالك هنا..."></textarea><button id="teacherAISend">إرسال</button><button id="teacherAIClear" style="margin-top:8px;width:100%;background:transparent;color:#bae6fd;border:1px solid #38bdf8;border-radius:10px;padding:8px">بدء محادثة جديدة</button></div>';
  document.body.appendChild(widget);

  const box = document.getElementById('teacherAIBox');
  const msg = document.getElementById('teacherAIMsg');
  const input = document.getElementById('teacherAIInput');
  const sendButton = document.getElementById('teacherAISend');

  function saveHistory() {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-MAX_TURNS * 2))); } catch (_) {}
  }
  function renderHistory() {
    msg.innerHTML = '<div style="color:#bae6fd">مرحبًا! أنا مساعدك التعليمي. أستطيع شرح الدروس وإعداد الواجبات والاختبارات وتصحيحها. أتذكر سياق هذه المحادثة في الرسائل التالية.</div>';
    history.forEach((item) => {
      const label = item.role === 'user' ? 'أنت' : 'Teacher AI';
      const color = item.role === 'user' ? '#fff' : '#c8d5e7';
      msg.innerHTML += '<div style="margin-top:10px;color:' + color + '"><b>' + label + ':</b> ' + escapeHTML(item.content).replace(/\n/g, '<br>') + '</div>';
    });
    msg.scrollTop = msg.scrollHeight;
  }
  renderHistory();

  document.getElementById('teacherAIButton').onclick = () => box.classList.add('open');
  document.getElementById('teacherAIClose').onclick = () => box.classList.remove('open');
  document.getElementById('teacherAIClear').onclick = () => {
    history = [];
    saveHistory();
    renderHistory();
    input.focus();
  };

  async function send() {
    const question = input.value.trim();
    if (!question || sendButton.disabled) return;

    history.push({ role: 'user', content: question });
    history = history.slice(-MAX_TURNS * 2);
    saveHistory();
    renderHistory();
    input.value = '';
    sendButton.disabled = true;
    sendButton.textContent = 'جاري التفكير...';

    const loading = document.createElement('div');
    loading.id = 'teacherAILoading';
    loading.style.cssText = 'margin-top:8px;color:#38bdf8';
    loading.textContent = 'جاري التفكير...';
    msg.appendChild(loading);
    msg.scrollTop = msg.scrollHeight;

    try {
      let transcript = history.map((item) =>
        (item.role === 'user' ? 'الطالب' : 'المعلم') + ': ' + item.content
      ).join('\n\n');
      if (transcript.length > MAX_CONTEXT_CHARS) transcript = transcript.slice(-MAX_CONTEXT_CHARS);

      const prompt = 'أنت Teacher، معلم متخصص ودقيق. أجب مباشرة عن سؤال الطالب الأخير باللغة نفسها وبشرح واضح مناسب للمرحلة الدراسية.\\n' +
        'قواعد أساسية: 1) حل المسائل خطوة بخطوة وتحقق من الناتج بإعادة التعويض أو الحساب. 2) لا تخمّن إذا كانت المعطيات ناقصة؛ اسأل عن المطلوب فقط. 3) عند التصحيح، استخرج الأسئلة الأصلية ومفتاح الإجابة من سجل المحادثة، وصحح كل إجابة على حدة، واحسب الدرجة من مجموع الأسئلة، ولا تغيّر الأسئلة أو الدرجة اعتباطيًا. 4) فرّق بين الإجابة الصحيحة والخطأ والتقريب. 5) استخدم نصًا ومعادلات بسيطة واضحة وتجنب رموز Markdown/HTML المهروبة. 6) لا تقل إنك Content Agent أو وكيل برمجي ولا ترفض التعليم العادي.\\n\\nسجل المحادثة (الأحدث في النهاية):\\n' + transcript + '\\n\\nأجب عن آخر رسالة للطالب فقط، واستفد من السجل للتحقق من السياق.';
      const response = await fetch('/api/chat', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, role: 'teacher' })
      });
      const data = await response.json();
      if (!response.ok || data.success === false) throw new Error(data.error || 'تعذر الحصول على إجابة');
      const answer = String(data.reply || data.error || 'تعذر الحصول على إجابة');
      history.push({ role: 'assistant', content: answer });
      history = history.slice(-MAX_TURNS * 2);
      saveHistory();
      renderHistory();
    } catch (error) {
      history.pop();
      saveHistory();
      renderHistory();
      const err = document.createElement('div');
      err.style.cssText = 'margin-top:8px;color:#fca5a5';
      err.textContent = 'تعذر الاتصال بالمساعد الذكي: ' + (error.message || 'حاول مرة أخرى');
      msg.appendChild(err);
    } finally {
      const loadingEl = document.getElementById('teacherAILoading');
      if (loadingEl) loadingEl.remove();
      sendButton.disabled = false;
      sendButton.textContent = 'إرسال';
      msg.scrollTop = msg.scrollHeight;
      input.focus();
    }
  }

  sendButton.onclick = send;
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  });
})();