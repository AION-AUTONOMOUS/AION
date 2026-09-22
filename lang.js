// AION — Global Language Selector
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

      .goog-te-banner-frame {
        display: none !important;
      }

      body {
        top: 0 !important;
      }

      .goog-logo-link,
      .goog-te-gadget span {
        display: none !important;
      }

      .goog-te-gadget {
        font-size: 0 !important;
      }

      .goog-te-combo {
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

  function translatePage(languageCode) {
    var select = document.querySelector(".goog-te-combo");

    if (!select) {
      alert("جارٍ تحميل نظام الترجمة، حاول مرة أخرى بعد لحظات.");
      return;
    }

    select.value = languageCode;
    select.dispatchEvent(new Event("change"));
  }

  function createGoogleTranslate() {
    if (document.getElementById("google_translate_element")) return;

    var hiddenContainer = document.createElement("div");
    hiddenContainer.id = "google_translate_element";
    hiddenContainer.style.display = "none";
    document.body.appendChild(hiddenContainer);

    window.googleTranslateElementInit = function () {
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
    };

    var script = document.createElement("script");
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;

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

    setTimeout(connectButton, 1500);
    setTimeout(connectButton, 3500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
