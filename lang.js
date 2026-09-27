
// AION — Global Language Selector (Fixed)
(function () {
  "use strict";

  var languages = [
    ["ar", "العربية"],
    ["en", "English"],
    ["fr", "Français"],
    ["de", "Deutsch"],
    ["es", "Español"],
    ["it", "Italiano"],
    ["pt", "Português"],
    ["ru", "Русский"],
    ["zh-CN", "中文"],
    ["ja", "日本語"],
    ["ko", "한국어"],
    ["hi", "हिन्दी"],
    ["tr", "Türkçe"],
    ["id", "Bahasa Indonesia"],
    ["nl", "Nederlands"],
    ["pl", "Polski"],
    ["uk", "Українська"],
    ["vi", "Tiếng Việt"],
    ["th", "ไทย"],
    ["he", "עברית"],
    ["fa", "فارسی"],
    ["ur", "اردو"],
    ["bn", "বাংলা"],
    ["ms", "Melayu"],
    ["sw", "Kiswahili"],
    ["el", "Ελληνικά"],
    ["cs", "Čeština"],
    ["ro", "Română"],
    ["hu", "Magyar"],
    ["sv", "Svenska"],
    ["da", "Dansk"],
    ["no", "Norsk"],
    ["fi", "Suomi"],
    ["sk", "Slovenčina"],
    ["bg", "Български"],
    ["sr", "Српски"],
    ["ca", "Català"],
    ["fil", "Filipino"]
  ];

  function addStyles() {
    if (document.getElementById("aion-language-styles")) return;

    var style = document.createElement("style");
    style.id = "aion-language-styles";

    style.textContent = `
      #aion-language-box {
        position: fixed;
        top: 78px;
        left: 20px;
        z-index: 999999;
        width: 210px;
        padding: 14px;
        background: linear-gradient(145deg, #061c3c, #020817);
        border: 1px solid rgba(0, 200, 255, .65);
        border-radius: 16px;
        box-shadow: 0 0 35px rgba(0, 150, 255, .3);
        display: none;
        font-family: Tahoma, Arial, sans-serif;
        max-height: 500px;
      }

      #aion-language-box.open {
        display: block;
      }

      #aion-language-box h3 {
        margin: 0 0 10px;
        color: #f5c542;
        font-size: 14px;
        text-align: center;
      }

      #aion-language-list {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        max-height: 360px;
        overflow-y: auto;
      }

      #aion-language-list button {
        padding: 8px 5px;
        color: #dcecff;
        background: rgba(0, 180, 255, .08);
        border: 1px solid rgba(0, 200, 255, .2);
        border-radius: 8px;
        cursor: pointer;
        font-size: 11px;
        font-family: inherit;
      }

      #aion-language-list button:hover {
        color: #020817;
        background: #00c8ff;
      }

      #aion-language-close {
        width: 100%;
        margin-top: 10px;
        padding: 8px;
        color: #020817;
        background: #f5c542;
        border: 0;
        border-radius: 20px;
        cursor: pointer;
        font-weight: bold;
      }

      /* ===== HIDE GOOGLE TRANSLATE BANNER COMPLETELY ===== */
      .skiptranslate,
      .goog-te-banner-frame,
      iframe.goog-te-banner-frame,
      iframe.skiptranslate,
      body > .skiptranslate,
      .goog-te-balloon-frame,
      #goog-gt-tt,
      .goog-tooltip,
      .goog-tooltip:hover,
      .goog-te-spinner-pos,
      .VIpgJd-ZVi9od-ORHb-OEVmcd,
      .VIpgJd-ZVi9od-l4eHX-hSRGPd,
      .VIpgJd-ZVi9od-aZ2wEe-wOHMyf,
      .VIpgJd-ZVi9od-aZ2wEe-OiiCO,
      .VIpgJd-ZVi9od-xl07Ob-OEVmcd,
      .VIpgJd-ZVi9od-SmfZ-OEVmcd {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        width: 0 !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }

      body,
      html {
        top: 0 !important;
        margin-top: 0 !important;
        padding-top: 0 !important;
        position: static !important;
      }

      .goog-logo-link,
      .goog-te-gadget span,
      .goog-te-gadget img,
      .goog-te-gadget > span > a {
        display: none !important;
      }

      .goog-te-gadget {
        font-size: 0 !important;
        color: transparent !important;
        height: 0 !important;
      }

      .goog-te-combo {
        display: none !important;
      }

      .goog-text-highlight {
        background: none !important;
        box-shadow: none !important;
      }

      iframe[name="google_translate_frame"] {
        display: none !important;
      }

      @media (max-width: 600px) {
        #aion-language-box {
          top: 70px;
          left: 10px;
          width: 200px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function forceHideBanner() {
    // Force hide banner via JS - runs multiple times to catch late loading
    var checkHide = function () {
      var banners = document.querySelectorAll(
        '.skiptranslate, .goog-te-banner-frame, iframe.skiptranslate, .VIpgJd-ZVi9od-ORHb-OEVmcd, .goog-te-balloon-frame, #goog-gt-tt'
      );
      banners.forEach(function (el) {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.style.height = '0';
        el.style.width = '0';
      });

      if (document.body) {
        document.body.style.top = '0';
        document.body.style.marginTop = '0';
        document.body.style.position = 'static';
      }
      if (document.documentElement) {
        document.documentElement.style.marginTop = '0';
        document.documentElement.style.top = '0';
      }
    };

    checkHide();
    setTimeout(checkHide, 500);
    setTimeout(checkHide, 1500);
    setTimeout(checkHide, 3000);
    setTimeout(checkHide, 5000);
    setInterval(checkHide, 1000);
  }

  function createLanguageBox() {
    if (document.getElementById("aion-language-box")) return;

    var box = document.createElement("div");
    box.id = "aion-language-box";

    var title = document.createElement("h3");
    title.textContent = "🌐 اختر لغة AION";
    box.appendChild(title);

    var list = document.createElement("div");
    list.id = "aion-language-list";

    languages.forEach(function (language) {
      var button = document.createElement("button");
      button.type = "button";
      button.textContent = language[1];

      button.addEventListener("click", function () {
        translatePage(language[0]);
        box.classList.remove("open");
      });

      list.appendChild(button);
    });

    box.appendChild(list);

    var close = document.createElement("button");
    close.id = "aion-language-close";
    close.type = "button";
    close.textContent = "إغلاق";
    close.addEventListener("click", function () {
      box.classList.remove("open");
    });

    box.appendChild(close);
    document.body.appendChild(box);
  }

  var pendingLanguage = null;
  var translationTimer = null;

  function getTranslateSelect() {
    return document.querySelector(".goog-te-combo");
  }

  function setTranslationStatus(message) {
    var title = document.querySelector("#aion-language-box h3");
    if (title) title.textContent = message;
  }

  function applyTranslation(languageCode) {
    var select = getTranslateSelect();
    if (!select) return false;

    select.value = languageCode;
    select.dispatchEvent(new Event("change", { bubbles: true }));

    try {
      document.cookie =
        "googtrans=/ar/" + languageCode + ";path=/;max-age=31536000;SameSite=Lax";
    } catch (e) {}

    pendingLanguage = null;
    setTranslationStatus("🌐 اختر لغة AION");
    return true;
  }

  function translatePage(languageCode) {
    pendingLanguage = languageCode;

    if (applyTranslation(languageCode)) return;

    setTranslationStatus("⏳ جاري تشغيل الترجمة...");

    if (translationTimer) clearInterval(translationTimer);
    var attempts = 0;

    translationTimer = setInterval(function () {
      attempts += 1;
      if (applyTranslation(languageCode) || attempts >= 30) {
        clearInterval(translationTimer);
        translationTimer = null;
        if (attempts >= 30 && pendingLanguage) {
          setTranslationStatus("⚠️ تعذر تحميل الترجمة — أعد المحاولة");
        }
      }
    }, 500);
  }

  function createGoogleTranslate() {
    if (document.getElementById("google_translate_element")) return;

    var hiddenContainer = document.createElement("div");
    hiddenContainer.id = "google_translate_element";
    hiddenContainer.setAttribute("aria-hidden", "true");
    hiddenContainer.style.cssText =
      "position:fixed;left:-10000px;top:-10000px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;";
    document.body.appendChild(hiddenContainer);

    window.googleTranslateElementInit = function () {
      if (!window.google || !google.translate) return;

      new google.translate.TranslateElement(
        {
          pageLanguage: "ar",
          includedLanguages: languages.map(function (item) {
            return item[0];
          }).join(","),
          autoDisplay: false,
          multilanguagePage: true
        },
        "google_translate_element"
      );

      forceHideBanner();

      var readyAttempts = 0;
      var readyTimer = setInterval(function () {
        readyAttempts += 1;
        if (getTranslateSelect()) {
          clearInterval(readyTimer);
          if (pendingLanguage) applyTranslation(pendingLanguage);
        } else if (readyAttempts >= 20) {
          clearInterval(readyTimer);
        }
      }, 250);
    };

    var script = document.createElement("script");
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    script.onerror = function () {
      setTranslationStatus("⚠️ خدمة الترجمة غير متاحة الآن");
    };

    document.body.appendChild(script);
  }

  function connectButton() {
    var button =
      document.getElementById("languageBtn") ||
      document.querySelector(".lang-btn");

    if (!button || button.dataset.aionLanguageReady === "true") return;

    button.dataset.aionLanguageReady = "true";
    button.textContent = "🌐 اللغات";
    button.href = "#";
    button.addEventListener("click", function (event) {
      event.preventDefault();

      var box = document.getElementById("aion-language-box");
      if (box) box.classList.toggle("open");
    });
  }

  function start() {
    addStyles();
    createLanguageBox();
    createGoogleTranslate();
    connectButton();
    forceHideBanner();

    setTimeout(connectButton, 1500);
    setTimeout(connectButton, 3500);
    setTimeout(forceHideBanner, 2000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
