
// AION Language Switcher — Global Multi-Language Support
(function() {
  // 1. Create container
  var container = document.createElement('div');
  container.id = 'aion-lang-container';
  container.style.cssText = 'position:fixed;bottom:20px;left:20px;z-index:99999;background:linear-gradient(135deg,#020817,#0B1D3A);padding:12px;border-radius:15px;border:1px solid #D4AF37;box-shadow:0 0 25px rgba(212,175,55,0.6);font-family:Arial,sans-serif;';

  // 2. Label
  var label = document.createElement('div');
  label.textContent = '🌐 Language';
  label.style.cssText = 'color:#D4AF37;font-size:11px;font-weight:bold;margin-bottom:6px;text-align:center;letter-spacing:1px;';
  container.appendChild(label);

  // 3. Google translate element
  var transDiv = document.createElement('div');
  transDiv.id = 'google_translate_element';
  container.appendChild(transDiv);

  // 4. Append to body
  document.body.appendChild(container);

  // 5. Google Translate init
  window.googleTranslateElementInit = function() {
    new google.translate.TranslateElement({
      pageLanguage: 'ar',
      includedLanguages: '',
      layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
      autoDisplay: false,
      multilanguagePage: true
    }, 'google_translate_element');
  };

  // 6. Load script
  var script = document.createElement('script');
  script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  script.async = true;
  document.body.appendChild(script);

  // 7. Hide Google banner + customize
  var style = document.createElement('style');
  style.innerHTML = `
    .goog-te-banner-frame {display:none !important;}
    body {top:0 !important;position:static !important;}
    .goog-logo-link {display:none !important;}
    .goog-te-gadget {color:transparent !important;font-size:0 !important;}
    .goog-te-gadget .goog-te-combo {
      background:#020817 !important;
      color:#D4AF37 !important;
      border:1px solid #D4AF37 !important;
      border-radius:20px !important;
      padding:8px 12px !important;
      font-size:12px !important;
      font-weight:bold !important;
      font-family:Arial,sans-serif !important;
      cursor:pointer !important;
      outline:none !important;
      min-width:150px !important;
    }
    .goog-te-gadget .goog-te-combo option {
      background:#020817 !important;
      color:#fff !important;
    }
    .goog-tooltip {display:none !important;}
    .goog-tooltip:hover {display:none !important;}
    .goog-text-highlight {background:none !important;box-shadow:none !important;}
    #goog-gt-tt {display:none !important;}
  `;
  document.head.appendChild(style);
})();
```

