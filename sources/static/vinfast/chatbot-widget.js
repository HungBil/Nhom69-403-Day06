(function () {
  "use strict";

  const VINFAST_LOGO =
    "https://vinfastauto.com/themes/porto/img/new-home-page/VinFast-logo.svg";
  const BOT_AVATAR = "https://cdn-media.vinbase.ai/avatar/20250313024710_4.png";
  const BOT_NAME = "VinFast";
  const USER_PREFIX = "USER";
  const API_BASE = window.location.origin;
  const GRAPH_NAME = "agent";

  const VINFAST_GLB_MAP = {
    "vf 3": "vinfast_vf3.glb",
    vf3: "vinfast_vf3.glb",
    "vf 9": "vinfast_vf9.glb",
    vf9: "vinfast_vf9.glb",
    "lux a2": "vinfast_lux.glb",
    "lux sa2": "vinfast_lux.glb",
    lux: "vinfast_lux.glb",
  };

  const VINFAST_IMAGE_MAP = {
    "vinfast_vf3.glb": "vinfast_vf3.png",
    "vinfast_vf9.glb": "vinfast_vf9.png",
    "vinfast_lux.glb": "vinfast_lux.png",
  };

  const style = document.createElement("style");
  style.textContent = `
/* ─── OVERLAY ─── */
.vf-chatbot-overlay{position:fixed;inset:0;z-index:10000;display:none}
.vf-chatbot-overlay.open{display:block}

/* ─── WIDGET WINDOW ─── */
.vf-chatbot{
  position:fixed;bottom:100px;right:30px;
  width:min(520px,calc(100vw - 18px));height:650px;
  background:#fff;border-radius:12px;
  box-shadow:0 8px 40px rgba(0,0,0,0.18);
  display:none;flex-direction:column;
  z-index:10001;overflow:hidden;
  font-family:'Montserrat','Segoe UI',sans-serif;
}
.vf-chatbot.open{display:flex;animation:vf-slide-up .3s ease}
@keyframes vf-slide-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}

/* Header */
.vf-chat-header{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:#fff;border-bottom:1px solid #e8e8e8;flex-shrink:0}
.vf-chat-header-left{display:flex;align-items:center;gap:10px}
.vf-chat-header-logo{width:100%;object-fit:contain}
.vf-chat-header-title{font-size:16px;font-weight:700;color:#111;letter-spacing:.5px}
.vf-chat-minimize{background:none;border:none;cursor:pointer;font-size:22px;color:#999;padding:4px 8px;line-height:1;transition:color .2s}
.vf-chat-minimize:hover{color:#333}

/* Messages */
.vf-chat-messages{flex:1;overflow-y:auto;padding:20px 16px;overflow-x: hidden;display:flex;flex-direction:column;gap:16px;background:#f9f9f9}
.vf-chat-messages::-webkit-scrollbar{width:4px}
.vf-chat-messages::-webkit-scrollbar-thumb{background:#ccc;border-radius:4px}

/* Message row */
.vf-msg{display:flex;gap:10px;align-items:flex-start;max-width:100%}
.vf-msg.user{flex-direction:row-reverse}
.vf-msg-avatar{width:32px;height:32px;border-radius:50%;flex-shrink:0;object-fit:cover}
.vf-msg-avatar-placeholder{width:32px;height:32px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;background:#bbb}
.vf-msg-content{display:flex;flex-direction:column;gap:4px;max-width:75%;min-width:0}
.vf-msg.bot .vf-msg-content{max-width:100%;width:calc(100% - 42px)}
.vf-msg-sender{display:flex;align-items:center;gap:6px}
.vf-msg-sender-logo{width:20%;object-fit:contain}
.vf-msg-sender-name{font-size:12px;font-weight:600;color:#555}
.vf-msg.user .vf-msg-user-label{font-size:11px;color:#999;text-align:right;margin-bottom:2px}

/* Bubble */
.vf-msg-bubble{padding:12px 16px;border-radius:16px;font-size:14px;max-width:93%;line-height:1.6;word-break:break-word;white-space:pre-wrap}
.vf-msg.bot .vf-msg-bubble{background:#fff;color:#333;border:1px solid #e8e8e8;border-top-left-radius:4px}
.vf-msg.user .vf-msg-bubble{background:#4A7BF7;color:#fff;border-top-right-radius:4px}
.vf-msg-bubble code{background:#f0f0f0;padding:1px 5px;border-radius:4px;font-size:12px;font-family:'Consolas',monospace;color:#c7254e}
.vf-msg-bubble strong{color:#4A7BF7;font-weight:600}

/* Bot content wrapper (for tool badges + bubble + 3D cards) */
.vf-bot-content{display:flex;flex-direction:column;gap:6px;max-width:100%;width:100%;min-width:0}

/* Tool call badge */
.vf-tool-badge{display:inline-flex;align-items:center;gap:5px;background:#f0f4ff;border:1px solid #d0dcf5;border-radius:8px;padding:4px 10px;font-size:11px;color:#4A7BF7;margin-bottom:2px;width:fit-content}
.vf-tool-spinner{width:12px;height:12px;border:1.5px solid #d0dcf5;border-top-color:#4A7BF7;border-radius:50%;animation:vf-spin .7s linear infinite}
@keyframes vf-spin{to{transform:rotate(360deg)}}

/* Typing indicator */
.vf-typing{display:flex;gap:4px;padding:12px 16px;background:#fff;border:1px solid #e8e8e8;border-radius:16px;border-top-left-radius:4px;width:fit-content}
.vf-typing-dot{width:7px;height:7px;background:#bbb;border-radius:50%;animation:vf-bounce 1.4s infinite both}
.vf-typing-dot:nth-child(2){animation-delay:.2s}
.vf-typing-dot:nth-child(3){animation-delay:.4s}
@keyframes vf-bounce{0%,80%,100%{transform:scale(.6);opacity:.4}40%{transform:scale(1);opacity:1}}

/* ─── 3D MODEL CARD (in chat) ─── */
.vf-model-card{margin-top:8px;background:#fff;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden;width:100%;max-width:340px}
.vf-model-header{padding:8px 12px;background:#f5f7fa;border-bottom:1px solid #e8e8e8;display:flex;align-items:center;gap:8px;font-size:12px;color:#666}
.vf-model-header svg{width:16px;height:16px;opacity:.6;flex-shrink:0}
.vf-model-name{font-weight:600;flex:1}
.vf-model-fullscreen-btn{background:none;border:none;cursor:pointer;color:#4A7BF7;font-size:16px;padding:2px 4px;transition:color .2s;display:flex;align-items:center}
.vf-model-fullscreen-btn:hover{color:#2a5bd7}
.vf-model-canvas-wrap{position:relative;height:220px;background:#0a0a0a;cursor:grab}
.vf-model-canvas-wrap:active{cursor:grabbing}
.vf-model-canvas-wrap canvas{display:block;width:100%;height:100%}
.vf-loader-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:#0a0a0a;pointer-events:none}
.vf-loader-overlay.hidden{display:none}
.vf-loader-spinner{width:24px;height:24px;border:2px solid #333;border-top-color:#4A7BF7;border-radius:50%;animation:vf-spin .7s linear infinite}
.vf-loader-txt{font-size:11px;color:#888;font-family:monospace}
.vf-model-controls{padding:6px 10px;display:flex;align-items:center;gap:6px;border-top:1px solid #e8e8e8;flex-wrap:wrap}
.vf-ctrl-btn{background:#f5f7fa;border:1px solid #e0e0e0;color:#666;border-radius:8px;padding:4px 10px;font-size:11px;cursor:pointer;transition:all .15s;white-space:nowrap}
.vf-ctrl-btn:hover{background:#e8ecf2;color:#333}
.vf-ctrl-btn.active{background:#4A7BF7;border-color:#4A7BF7;color:#fff}

/* ─── FULLSCREEN 3D MODAL ─── */
.vf-3d-fullscreen{position:fixed;inset:0;z-index:20000;background:#0a0a0a;display:none;flex-direction:column;align-items:center;justify-content:center}
.vf-3d-fullscreen.open{display:flex}
.vf-3d-fs-header{position:absolute;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:16px 24px;z-index:1;background:rgba(10,10,10,0.85);backdrop-filter:blur(10px);border-bottom:1px solid rgba(255,255,255,0.08)}
.vf-3d-fs-title{color:#eee;font-size:18px;font-weight:700;letter-spacing:.5px}
.vf-3d-fs-close{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#ddd;border-radius:8px;padding:8px 16px;font-size:14px;cursor:pointer;transition:background .2s}
.vf-3d-fs-close:hover{background:rgba(255,255,255,0.15)}
.vf-3d-fs-canvas-wrap{width:100%;height:100%;position:relative;cursor:grab}
.vf-3d-fs-canvas-wrap:active{cursor:grabbing}
.vf-3d-fs-canvas-wrap canvas{display:block;width:100%;height:100%}
.vf-3d-fs-controls{position:absolute;bottom:24px;left:50%;transform:translateX(-50%);display:flex;gap:10px;z-index:1}
.vf-3d-fs-ctrl{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);color:#ddd;border-radius:10px;padding:8px 18px;font-size:13px;cursor:pointer;transition:all .2s;backdrop-filter:blur(8px);box-shadow:0 2px 8px rgba(0,0,0,0.3)}
.vf-3d-fs-ctrl:hover{background:rgba(255,255,255,0.18)}
.vf-3d-fs-ctrl.active{background:#4A7BF7;border-color:#4A7BF7;color:#fff}

/* Quick actions */
.vf-quick-actions{display:flex;justify-content:flex-end;align-items:center;padding:0 12px 12px;background:#f9f9f9}
.vf-quick-feed-wrap{display:inline-flex;align-items:stretch;border-radius:24px;border:1px solid #d9dce4;background:#fff;padding:4px;box-shadow:0 2px 8px rgba(0,0,0,0.04);transition:all .3s}
.vf-quick-btn{background:none;border:none;color:#2f5fd6;font-size:22px;line-height:0;width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;border-radius:50%;transition:background .2s;flex-shrink:0}
.vf-quick-btn:hover{background:#f0f4ff}
.vf-quick-btn.active{background:#e8efff}
.vf-quick-menu{display:flex;align-items:center;gap:12px;max-width:0;opacity:0;overflow:hidden;transition:max-width .4s cubic-bezier(.2,.7,.2,1),opacity .3s ease;pointer-events:none}
.vf-quick-menu.open{max-width:280px;opacity:1;margin-left:4px;pointer-events:auto}
.vf-quick-hint{font-size:12px;color:#2f5fd6;line-height:1.3;white-space:nowrap;margin-right:2px}
.vf-quick-menu-btn{background:#fff;border:1px solid #d9dce4;border-radius:18px;color:#2f5fd6;font-size:13px;font-weight:600;padding:6px 16px;cursor:pointer;white-space:nowrap;transition:all .2s;box-shadow:0 2px 6px rgba(47,95,214,.08)}
.vf-quick-menu-btn:hover{background:#f8faff;border-color:#b5c5ee}
.vf-quick-menu-btn:active{transform:translateY(1px);box-shadow:0 1px 3px rgba(47,95,214,.1)}

/* Feedback panel */
.vf-feedback-panel{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,0.5);z-index:10002;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .25s ease}
.vf-feedback-panel.open{opacity:1;visibility:visible;pointer-events:auto}
.vf-feedback-card{width:100%;background:#fff;border-radius:24px;position:relative;padding:32px 24px 24px;box-shadow:0 18px 40px rgba(0,0,0,0.22);transform:translateY(44px);opacity:0;transition:transform .35s cubic-bezier(.16,.84,.24,1),opacity .25s ease}
.vf-feedback-panel.open .vf-feedback-card{transform:translateY(0);opacity:1}
.vf-feedback-close{position:absolute;top:16px;right:18px;border:none;background:none;color:#000;font-size:24px;cursor:pointer;line-height:1;transition:opacity .2s}
.vf-feedback-close:hover{opacity:.6}
.vf-feedback-title{font-size:22px;font-weight:700;color:#333;text-align:center;margin:0 0 10px}
.vf-feedback-sub{font-size:14px;color:#888;text-align:center;margin-bottom:20px}
.vf-feedback-stars{display:flex;justify-content:center;gap:12px;margin:10px 0 24px}
.vf-feedback-star{border:none;background:transparent;font-size:46px;line-height:1;color:#cfd4db;cursor:pointer;transition:transform .15s,color .2s}
.vf-feedback-star:hover{transform:translateY(-3px)}
.vf-feedback-star.active{color:#f4c430}
.vf-feedback-text{width:100%;min-height:120px;border:1px solid #d9dce4;border-radius:12px;padding:16px;font-size:15px;font-family:inherit;resize:none;outline:none;color:#333;box-sizing:border-box}
.vf-feedback-text::placeholder{color:#aab2bd}
.vf-feedback-text:focus{border-color:#4A7BF7;box-shadow:0 0 0 3px rgba(74,123,247,0.1)}
.vf-feedback-submit{width:100%;margin-top:20px;border:none;border-radius:16px;background:#e9ecef;color:#9aa0aa;font-size:16px;font-weight:600;padding:16px;cursor:pointer;transition:all .2s;text-transform:uppercase}
.vf-feedback-submit:not(:disabled){background:#f0f4ff;color:#4A7BF7}
.vf-feedback-submit:not(:disabled):hover{background:#e0ebff}
.vf-feedback-submit:disabled{cursor:default;opacity:0.8}
.vf-feedback-status{min-height:18px;margin-top:10px;text-align:center;font-size:13px;color:#3c67d8}
.vf-feedback-status.error{color:#d74444}

/* Input area */
.vf-chat-input-area{display:flex;align-items:center;padding:12px 16px;border-top:1px solid #e8e8e8;background:#fff;gap:10px;flex-shrink:0}
.vf-chat-input{flex:1;border:none;outline:none;font-size:14px;font-family:inherit;color:#333;background:transparent;padding:6px 0}
.vf-chat-input::placeholder{color:#aaa}
.vf-chat-send{background:none;border:none;cursor:pointer;color:#4A7BF7;font-size:20px;padding:4px;display:flex;align-items:center;justify-content:center;transition:color .2s}
.vf-chat-send:hover{color:#2a5bd7}
.vf-chat-send:disabled{color:#ccc;cursor:default}

/* Footer */
.vf-chat-footer{text-align:center;padding:8px;font-size:11px;color:#aaa;background:#fff;border-top:1px solid #f0f0f0;flex-shrink:0}
.vf-chat-footer a{color:#4A7BF7;text-decoration:none;font-weight:500}
.vf-chat-footer a:hover{text-decoration:underline}

/* Suggestion Chips */
.vf-suggestion-chips{display:flex;flex-wrap:wrap;gap:8px;padding:4px 0;margin-left:42px}
.vf-chip{background:#f0f4ff;border:1px solid #d0dcf5;color:#4A7BF7;border-radius:18px;padding:6px 14px;font-size:12px;font-weight:500;cursor:pointer;transition:all .2s;white-space:nowrap;font-family:inherit}
.vf-chip:hover{background:#e0ebff;border-color:#4A7BF7}

/* Contact button (inline in bot bubble) */
.vf-contact-btn{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#4A7BF7,#2a5bd7);color:#fff;border:none;border-radius:20px;padding:8px 18px;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit;box-shadow:0 2px 8px rgba(74,123,247,0.3);margin-top:8px;text-decoration:none}
.vf-contact-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(74,123,247,0.4)}
.vf-contact-btn svg{width:14px;height:14px;flex-shrink:0;vertical-align:middle}

/* Model preview cards (image + 3D actions) */
.vf-model-preview-list{margin-top:8px;display:flex;gap:10px;overflow-x:auto;overflow-y:hidden;width:100%;max-width:100%;min-width:0;padding:2px 8px 8px 2px;box-sizing:border-box;scrollbar-width:thin;scrollbar-color:#c4cfdf transparent;-webkit-overflow-scrolling:touch;touch-action:pan-x;overscroll-behavior-x:contain}
.vf-model-preview-list::-webkit-scrollbar{height:6px}
.vf-model-preview-list::-webkit-scrollbar-thumb{background:#c4cfdf;border-radius:999px}
.vf-model-preview-list::after{content:"";flex:0 0 2px}
.vf-model-preview-card{margin-top:0;background:#f3f6fb;border:1px solid #d5dce8;border-radius:12px;width:240px;min-width:240px;max-width:240px;overflow:hidden;box-shadow:0 1px 4px rgba(8,26,63,0.08);flex:0 0 240px}
.vf-model-preview-image-wrap{height:145px;background:#dbe2ec}
.vf-model-preview-image{width:100%;height:100%;display:block;object-fit:cover}
.vf-model-preview-body{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px}
.vf-model-preview-name{font-size:14px;font-weight:700;color:#1f2530;line-height:1.25}
.vf-model-preview-btn{background:#1f7aff;border:1px solid #1f7aff;color:#fff;font-size:13px;font-weight:700;border-radius:10px;padding:7px 12px;cursor:pointer;transition:background .2s ease,border-color .2s ease,transform .15s ease;white-space:nowrap;flex-shrink:0;box-shadow:none}
.vf-model-preview-btn:hover{background:#0f69ee;border-color:#0f69ee;filter:none}
.vf-model-preview-btn:active{transform:translateY(1px)}
.vf-model-preview-btn.shown{background:#d7dce4;border-color:#c8ced8;color:#5f6875;box-shadow:none}

/* Responsive */
@media(max-width:480px){
  .vf-chatbot{width:calc(100vw - 20px);height:calc(100vh - 120px);bottom:80px;right:10px}
  .vf-quick-actions{padding:0 10px 10px}
  .vf-quick-menu.open{max-width:270px}
  .vf-quick-hint{font-size:11px}
  .vf-quick-menu-btn{padding:5px 12px;font-size:12px}
  .vf-feedback-title{font-size:20px}
  .vf-feedback-sub{font-size:13px}
  .vf-feedback-submit{font-size:15px}
  .vf-model-preview-card{width:210px;min-width:210px;max-width:210px;flex-basis:210px}
  .vf-model-preview-image-wrap{height:128px}
}
  `;
  document.head.appendChild(style);

  /* ================================================================
   *  LOAD THREE.JS + GLTFLoader
   * ================================================================ */
  function loadThreeJS(cb) {
    if (window.THREE) {
      cb();
      return;
    }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    s.onload = cb;
    document.head.appendChild(s);
  }

  function loadGLTFLoader(cb) {
    if (window.THREE && THREE.GLTFLoader) {
      cb();
      return;
    }
    loadThreeJS(function () {
      const s = document.createElement("script");
      s.src =
        "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js";
      s.onload = cb;
      document.head.appendChild(s);
    });
  }

  /* ================================================================
   *  BUILD DOM – Overlay
   * ================================================================ */
  const overlay = document.createElement("div");
  overlay.className = "vf-chatbot-overlay";
  overlay.addEventListener("click", function () {
    toggleChat(false);
  });
  document.body.appendChild(overlay);

  /* ================================================================
   *  BUILD DOM – Fullscreen 3D Modal
   * ================================================================ */
  const fsModal = document.createElement("div");
  fsModal.className = "vf-3d-fullscreen";
  fsModal.id = "vf3dFullscreen";
  fsModal.innerHTML = [
    '<div class="vf-3d-fs-header">',
    '  <span class="vf-3d-fs-title" id="vfFsTitle">VinFast 3D Viewer</span>',
    '  <button class="vf-3d-fs-close" id="vfFsClose">✕ Đóng</button>',
    "</div>",
    '<div class="vf-3d-fs-canvas-wrap" id="vfFsCanvasWrap">',
    '  <canvas id="vfFsCanvas"></canvas>',
    "</div>",
    '<div class="vf-3d-fs-controls">',
    '  <button class="vf-3d-fs-ctrl active" data-fs-action="rotate">⟳ Tự xoay</button>',
    '  <button class="vf-3d-fs-ctrl" data-fs-action="wire">⬡ Wireframe</button>',
    '  <button class="vf-3d-fs-ctrl" data-fs-action="reset">⌖ Reset</button>',
    "</div>",
  ].join("\n");
  document.body.appendChild(fsModal);

  /* ================================================================
   *  BUILD DOM – Chat Window
   * ================================================================ */
  const chatEl = document.createElement("div");
  chatEl.className = "vf-chatbot";
  chatEl.innerHTML = [
    "<!-- Header -->",
    '<div class="vf-chat-header">',
    '  <div class="vf-chat-header-left">',
    '    <img class="vf-chat-header-logo" src="' +
      VINFAST_LOGO +
      '" alt="VinFast" />',
    "  </div>",
    '  <button class="vf-chat-minimize" id="vfChatMinimize" title="Thu nhỏ">─</button>',
    "</div>",
    "<!-- Messages -->",
    '<div class="vf-chat-messages" id="vfChatMessages"></div>',
    "<!-- Quick actions -->",
    '<div class="vf-quick-actions">',
    '  <div class="vf-quick-feed-wrap">',
    '    <button class="vf-quick-btn" id="vfQuickToggle" title="Tùy chọn">»</button>',
    '    <div class="vf-quick-menu" id="vfQuickMenu">',
    '      <span class="vf-quick-hint">Trải nghiệm của bạn<br>thế nào?</span>',
    '      <button class="vf-quick-menu-btn" id="vfOpenFeedback" title="Đánh giá">Đánh giá</button>',
    "    </div>",
    "  </div>",
    "</div>",
    "<!-- Feedback panel -->",
    '<div class="vf-feedback-panel" id="vfFeedbackPanel">',
    '  <div class="vf-feedback-card">',
    '    <button class="vf-feedback-close" id="vfFeedbackClose" title="Đóng">×</button>',
    '    <h3 class="vf-feedback-title">Đánh giá trải nghiệm</h3>',
    '    <p class="vf-feedback-sub">Hãy cho biết trải nghiệm của bạn nhé!</p>',
    '    <div class="vf-feedback-stars" id="vfFeedbackStars">',
    '      <button class="vf-feedback-star" type="button" data-star="1" title="1 sao">★</button>',
    '      <button class="vf-feedback-star" type="button" data-star="2" title="2 sao">★</button>',
    '      <button class="vf-feedback-star" type="button" data-star="3" title="3 sao">★</button>',
    '      <button class="vf-feedback-star" type="button" data-star="4" title="4 sao">★</button>',
    '      <button class="vf-feedback-star" type="button" data-star="5" title="5 sao">★</button>',
    "    </div>",
    '    <textarea class="vf-feedback-text" id="vfFeedbackText" placeholder="Nhập góp ý..."></textarea>',
    '    <button class="vf-feedback-submit" id="vfFeedbackSubmit" type="button" disabled>Gửi phản hồi</button>',
    '    <p class="vf-feedback-status" id="vfFeedbackStatus"></p>',
    "  </div>",
    "</div>",
    "<!-- Input -->",
    '<div class="vf-chat-input-area">',
    '  <input class="vf-chat-input" id="vfChatInput" type="text" placeholder="Nhập tin nhắn..." autocomplete="off" />',
    '  <button class="vf-chat-send" id="vfChatSend" title="Gửi">',
    '    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
    '      <line x1="22" y1="2" x2="11" y2="13"></line>',
    '      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>',
    "    </svg>",
    "  </button>",
    "</div>",
    "<!-- Footer -->",
    '<div class="vf-chat-footer">Phát triển bởi <a href="#">VinBigdata</a></div>',
  ].join("\n");
  document.body.appendChild(chatEl);

  /* ── DOM REFS ── */
  var messagesEl = document.getElementById("vfChatMessages");
  var inputEl = document.getElementById("vfChatInput");
  var sendBtn = document.getElementById("vfChatSend");
  var minimizeBtn = document.getElementById("vfChatMinimize");
  var quickActionsEl = chatEl.querySelector(".vf-quick-actions");
  var quickToggleBtn = document.getElementById("vfQuickToggle");
  var quickMenuEl = document.getElementById("vfQuickMenu");
  var openFeedbackBtn = document.getElementById("vfOpenFeedback");
  var feedbackPanelEl = document.getElementById("vfFeedbackPanel");
  var feedbackCloseBtn = document.getElementById("vfFeedbackClose");
  var feedbackStarsEl = document.getElementById("vfFeedbackStars");
  var feedbackTextEl = document.getElementById("vfFeedbackText");
  var feedbackSubmitBtn = document.getElementById("vfFeedbackSubmit");
  var feedbackStatusEl = document.getElementById("vfFeedbackStatus");

  /* ── STATE ── */
  var userId =
    USER_PREFIX + Math.floor(Math.random() * 9000000000 + 1000000000);
  var isOpen = false;
  var isFirstOpen = true;
  var isSending = false;
  var threadId = null;
  var selectedStars = 0;
  var isSubmittingFeedback = false;

  /* ── 3D STATE ── */
  var glbCardCounter = 0;
  var cardStates = {};
  var fsState = null;

  /* ================================================================
   *  TOGGLE CHAT
   * ================================================================ */
  function toggleChat(forceState) {
    isOpen = forceState !== undefined ? forceState : !isOpen;
    chatEl.classList.toggle("open", isOpen);
    overlay.classList.toggle("open", isOpen);

    if (!isOpen) {
      toggleQuickMenu(false);
      closeFeedbackPanel();
    }

    if (isOpen && isFirstOpen) {
      isFirstOpen = false;
      addBotMessage(
        "Xin chào Quý khách! Vivi rất vui được hỗ trợ Quý khách. Quý khách cần tư vấn về sản phẩm, dịch vụ hay thông tin nào của VinFast ạ? 😊",
      );
    }

    if (isOpen) {
      setTimeout(function () {
        inputEl.focus();
      }, 100);
    }
  }

  // Expose globally for the FAB icon
  window.toggleVFChat = toggleChat;

  /* ── MINIMIZE ── */
  minimizeBtn.addEventListener("click", function () {
    toggleChat(false);
  });

  function toggleQuickMenu(forceState) {
    var nextState =
      forceState !== undefined
        ? forceState
        : !quickMenuEl.classList.contains("open");
    quickMenuEl.classList.toggle("open", nextState);
    quickToggleBtn.classList.toggle("active", nextState);
  }

  function setFeedbackStatus(msg, isError) {
    feedbackStatusEl.textContent = msg || "";
    feedbackStatusEl.classList.toggle("error", !!isError);
  }

  function updateSubmitState() {
    var hasStars = selectedStars >= 1 && selectedStars <= 5;
    var hasText = feedbackTextEl.value.trim().length > 0;
    feedbackSubmitBtn.disabled = !(hasStars && hasText);
  }

  function setSelectedStars(value) {
    selectedStars = value;
    var stars = feedbackStarsEl.querySelectorAll(".vf-feedback-star");
    for (var i = 0; i < stars.length; i++) {
      var n = Number(stars[i].dataset.star);
      stars[i].classList.toggle("active", n <= value);
    }
    updateSubmitState();
  }

  function resetFeedbackForm() {
    setSelectedStars(0);
    feedbackTextEl.value = "";
    setFeedbackStatus("", false);
    updateSubmitState();
  }

  function openFeedbackPanel() {
    feedbackPanelEl.classList.add("open");
    setFeedbackStatus("", false);
    setTimeout(function () {
      feedbackTextEl.focus();
    }, 30);
  }

  function closeFeedbackPanel() {
    feedbackPanelEl.classList.remove("open");
    setFeedbackStatus("", false);
  }

  async function submitFeedback() {
    if (isSubmittingFeedback) return;

    var uid = userId;
    var comment = feedbackTextEl.value.trim();

    if (selectedStars < 1 || selectedStars > 5) {
      setFeedbackStatus("Vui lòng chọn số sao đánh giá.", true);
      return;
    }
    if (!comment) {
      setFeedbackStatus("Vui lòng nhập phản hồi.", true);
      feedbackTextEl.focus();
      return;
    }

    isSubmittingFeedback = true;
    feedbackSubmitBtn.disabled = true;
    setFeedbackStatus("Đang gửi phản hồi...", false);

    try {
      var res = await fetch(API_BASE + "/feedbacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: uid,
          stars: selectedStars,
          feedback: comment,
          thread_id: threadId,
        }),
      });

      if (!res.ok) {
        var errMsg = "Gửi phản hồi thất bại (" + res.status + ")";
        try {
          var errJson = await res.json();
          if (errJson && errJson.error) errMsg = errJson.error;
        } catch (_) {}
        throw new Error(errMsg);
      }

      setFeedbackStatus("Đã gửi phản hồi. Cảm ơn bạn!", false);
      setTimeout(function () {
        closeFeedbackPanel();
        resetFeedbackForm();
      }, 700);
    } catch (err) {
      setFeedbackStatus(err.message || "Không thể gửi phản hồi.", true);
    }

    isSubmittingFeedback = false;
    feedbackSubmitBtn.disabled = false;
  }

  /* ================================================================
   *  LANGGRAPH API – Thread + Streaming
   * ================================================================ */
  async function ensureThread() {
    if (threadId) return threadId;
    var res = await fetch(API_BASE + "/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error("Không thể tạo thread: " + res.status);
    var data = await res.json();
    threadId = data.thread_id;
    console.log("[Thread created]", threadId);
    return threadId;
  }

  async function streamRun(userMessage) {
    var tid = await ensureThread();
    var res = await fetch(API_BASE + "/threads/" + tid + "/runs/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assistant_id: GRAPH_NAME,
        input: { messages: [{ role: "user", content: userMessage }] },
        stream_mode: "messages",
      }),
    });
    if (!res.ok) {
      var errText = await res.text();
      throw new Error("Stream lỗi (" + res.status + "): " + errText);
    }
    return res.body;
  }

  /* ── PARSE SSE STREAM ── */
  async function readSSEStream(body, onToken, onToolCall, onDone) {
    var reader = body.getReader();
    var decoder = new TextDecoder();
    var buffer = "";
    var fullText = "";
    var currentEvent = "";
    var seenToolCalls = new Set();

    while (true) {
      var chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });

      var lines = buffer.split("\n");
      buffer = lines.pop();

      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.startsWith("event:")) {
          currentEvent = line.slice(6).trim();
          continue;
        }
        if (!line.startsWith("data:")) continue;
        if (
          currentEvent !== "messages/partial" &&
          currentEvent !== "messages/complete"
        )
          continue;

        try {
          var raw = JSON.parse(line.slice(5).trim());
          var msg = Array.isArray(raw) ? raw[0] : raw;

          // AI text content (streaming tokens)
          if (msg.type === "ai" && msg.content) {
            var text = "";
            if (typeof msg.content === "string") {
              text = msg.content;
            } else if (Array.isArray(msg.content)) {
              text = msg.content
                .filter(function (c) {
                  return c.type === "text";
                })
                .map(function (c) {
                  return c.text;
                })
                .join("");
            }
            if (text && text !== fullText) {
              var delta = text.slice(fullText.length);
              fullText = text;
              if (delta) onToken(delta, fullText);
            }
          }

          // Tool calls
          if (msg.type === "ai" && msg.tool_calls && msg.tool_calls.length) {
            for (var j = 0; j < msg.tool_calls.length; j++) {
              var tc = msg.tool_calls[j];
              var signature =
                tc.id || tc.name + ":" + JSON.stringify(tc.args || {});
              if (!seenToolCalls.has(signature)) {
                seenToolCalls.add(signature);
                onToolCall(tc.name, tc.args);
              }
            }
          }
        } catch (_) {}
      }
    }
    onDone(fullText);
  }

  /* ================================================================
   *  DETECT VINFAST GLB FILES IN TEXT
   * ================================================================ */
  function detectVinfastGLB(text) {
    var lower = text.toLowerCase();
    var keys = Object.keys(VINFAST_GLB_MAP).sort(function (a, b) {
      return b.length - a.length;
    });
    var found = new Set();
    for (var i = 0; i < keys.length; i++) {
      if (lower.includes(keys[i])) found.add(VINFAST_GLB_MAP[keys[i]]);
    }
    return Array.from(found);
  }

  function parseToolArgs(args) {
    if (!args) return {};
    if (typeof args === "object") return args;
    if (typeof args !== "string") return {};
    try {
      return JSON.parse(args);
    } catch (_) {
      return { model_name: args };
    }
  }

  function extractGLBFromToolArgs(args) {
    var parsed = parseToolArgs(args);
    var modelName = "";
    if (parsed && typeof parsed.model_name === "string") {
      modelName = parsed.model_name;
    } else if (parsed && typeof parsed.model === "string") {
      modelName = parsed.model;
    }
    if (!modelName && typeof args === "string") modelName = args;
    return detectVinfastGLB(modelName || "");
  }

  function uniqueList(items) {
    var out = [];
    var seen = new Set();
    for (var i = 0; i < items.length; i++) {
      var val = items[i];
      if (!val || seen.has(val)) continue;
      seen.add(val);
      out.push(val);
    }
    return out;
  }

  /* ================================================================
   *  UI HELPERS
   * ================================================================ */
  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function formatBotText(text) {
    var html = escapeHtml(text);
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/`(.+?)`/g, "<code>$1</code>");
    html = html.replace(/\n/g, "<br>");
    /* Inline contact button – replace marker */
    html = html.replace(
      /\[LIÊN HỆ TƯ VẤN VIÊN\]/g,
      '<a class="vf-contact-btn" href="https://github.com/khvavuong" target="_blank" rel="noopener">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;">' +
        '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>' +
        "Liên hệ tư vấn viên</a>",
    );
    return html;
  }

  /* ── Messages ── */
  function addUserMessage(text) {
    var row = document.createElement("div");
    row.className = "vf-msg user";
    row.innerHTML =
      '<div class="vf-msg-content" style="align-items:flex-end;">' +
      '  <span class="vf-msg-user-label">' +
      userId +
      "</span>" +
      '  <div class="vf-msg-bubble" style="max-width:100%;">' +
      escapeHtml(text) +
      "</div>" +
      "</div>";
    messagesEl.appendChild(row);
    scrollToBottom();
  }

  function addBotMessage(text) {
    var row = document.createElement("div");
    row.className = "vf-msg bot";
    row.innerHTML =
      '<img class="vf-msg-avatar" src="' +
      BOT_AVATAR +
      '" alt="' +
      BOT_NAME +
      '" />' +
      '<div class="vf-msg-content">' +
      '  <div class="vf-msg-sender"></div>' +
      '  <div class="vf-msg-bubble">' +
      formatBotText(text) +
      "</div>" +
      "</div>";
    messagesEl.appendChild(row);
    scrollToBottom();
  }

  function createBotMsgEl() {
    var el = document.createElement("div");
    el.className = "vf-msg bot";
    el.innerHTML =
      '<img class="vf-msg-avatar" src="' +
      BOT_AVATAR +
      '" alt="' +
      BOT_NAME +
      '" />' +
      '<div class="vf-msg-content">' +
      '  <div class="vf-msg-sender"></div>' +
      '  <div class="vf-bot-content">' +
      '    <div class="vf-msg-bubble"></div>' +
      "  </div>" +
      "</div>";
    messagesEl.appendChild(el);
    return el;
  }

  function showTyping() {
    var row = document.createElement("div");
    row.className = "vf-msg bot";
    row.id = "vfTyping";
    row.innerHTML =
      '<img class="vf-msg-avatar" src="' +
      BOT_AVATAR +
      '" alt="' +
      BOT_NAME +
      '" />' +
      '<div class="vf-msg-content">' +
      '  <div class="vf-typing">' +
      '    <span class="vf-typing-dot"></span>' +
      '    <span class="vf-typing-dot"></span>' +
      '    <span class="vf-typing-dot"></span>' +
      "  </div>" +
      "</div>";
    messagesEl.appendChild(row);
    scrollToBottom();
  }

  function removeTyping() {
    var el = document.getElementById("vfTyping");
    if (el) el.remove();
  }

  function showToolCallBadge(parentEl, toolName) {
    var contentDiv = parentEl.querySelector(".vf-bot-content");
    if (
      !contentDiv ||
      contentDiv.querySelector('[data-tool="' + toolName + '"]')
    )
      return;
    var badge = document.createElement("div");
    badge.className = "vf-tool-badge";
    badge.setAttribute("data-tool", toolName);
    var friendly =
      {
        get_car_specs: "Tra cứu thông số xe",
        load_3d_model: "Tải mô hình 3D",
        calculate_car_match: "Tính toán mức phù hợp",
      }[toolName] || toolName;
    badge.innerHTML = '<div class="vf-tool-spinner"></div>' + friendly;
    contentDiv.insertBefore(badge, contentDiv.querySelector(".vf-msg-bubble"));
    scrollToBottom();
  }

  function removeToolSpinners(parentEl) {
    var spinners = parentEl.querySelectorAll(".vf-tool-spinner");
    for (var i = 0; i < spinners.length; i++)
      spinners[i].style.display = "none";
  }

  /* ================================================================
   *  THREE.JS – Shared helpers
   * ================================================================ */
  function setupOrbitControls(cv, st) {
    cv.addEventListener("mousedown", function (e) {
      st.isDragging = true;
      st.prevMouse = { x: e.clientX, y: e.clientY };
    });
    cv.addEventListener("mouseup", function () {
      st.isDragging = false;
    });
    cv.addEventListener("mouseleave", function () {
      st.isDragging = false;
    });
    cv.addEventListener("mousemove", function (e) {
      if (!st.isDragging) return;
      st.spherical.theta -= (e.clientX - st.prevMouse.x) * 0.007;
      st.spherical.phi = Math.max(
        0.15,
        Math.min(
          Math.PI - 0.15,
          st.spherical.phi + (e.clientY - st.prevMouse.y) * 0.007,
        ),
      );
      st.prevMouse = { x: e.clientX, y: e.clientY };
    });
    cv.addEventListener(
      "wheel",
      function (e) {
        e.preventDefault();
        st.spherical.r = Math.max(
          1,
          Math.min(10, st.spherical.r + e.deltaY * 0.005),
        );
      },
      { passive: false },
    );

    // Touch
    cv.addEventListener(
      "touchstart",
      function (e) {
        st.isDragging = true;
        st.prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      },
      { passive: true },
    );
    cv.addEventListener("touchend", function () {
      st.isDragging = false;
    });
    cv.addEventListener(
      "touchmove",
      function (e) {
        if (!st.isDragging) return;
        var t = e.touches[0];
        st.spherical.theta -= (t.clientX - st.prevMouse.x) * 0.007;
        st.spherical.phi = Math.max(
          0.15,
          Math.min(
            Math.PI - 0.15,
            st.spherical.phi + (t.clientY - st.prevMouse.y) * 0.007,
          ),
        );
        st.prevMouse = { x: t.clientX, y: t.clientY };
      },
      { passive: true },
    );
  }

  function createScene(cv, W, H) {
    var scene = new THREE.Scene();
    // ── Nền đen sang trọng ──
    scene.background = new THREE.Color(0x0a0a0a);
    scene.fog = new THREE.Fog(0x0a0a0a, 14, 28);

    var camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 1000);
    var ren = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
    ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    ren.setSize(W, H);
    ren.outputEncoding = THREE.sRGBEncoding;
    ren.toneMapping = THREE.ACESFilmicToneMapping;
    ren.toneMappingExposure = 1.2;
    ren.shadowMap.enabled = true;
    ren.shadowMap.type = THREE.PCFSoftShadowMap;

    // ── Ambient nhẹ – giữ xe không bị tối hoàn toàn ──
    scene.add(new THREE.AmbientLight(0xffffff, 0.15));

    // ── Key light – đèn chính phía trước trên ──
    var keyL = new THREE.DirectionalLight(0xffffff, 0.8);
    keyL.position.set(3, 6, 5);
    keyL.castShadow = true;
    keyL.shadow.mapSize.width = 1024;
    keyL.shadow.mapSize.height = 1024;
    keyL.shadow.camera.near = 0.5;
    keyL.shadow.camera.far = 20;
    keyL.shadow.camera.left = -5;
    keyL.shadow.camera.right = 5;
    keyL.shadow.camera.top = 5;
    keyL.shadow.camera.bottom = -5;
    keyL.shadow.bias = -0.002;
    scene.add(keyL);

    // ── Rim light trái – xanh dương nhẹ ──
    var rimL = new THREE.SpotLight(0x4a9eff, 1.2, 18, Math.PI / 5, 0.6, 1);
    rimL.position.set(-5, 3, 0);
    rimL.target.position.set(0, 0, 0);
    scene.add(rimL);
    scene.add(rimL.target);

    // ── Rim light phải – trắng ấm nhẹ ──
    var rimR = new THREE.SpotLight(0xffeedd, 0.9, 18, Math.PI / 5, 0.6, 1);
    rimR.position.set(5, 3, 0);
    rimR.target.position.set(0, 0, 0);
    scene.add(rimR);
    scene.add(rimR.target);

    // ── Back light – halo phía sau ──
    var backL = new THREE.SpotLight(0x6688ff, 0.8, 20, Math.PI / 6, 0.7, 1);
    backL.position.set(0, 4, -6);
    backL.target.position.set(0, 0, 0);
    scene.add(backL);
    scene.add(backL.target);

    // ── Top spot – rọi thẳng xuống xe ──
    var topL = new THREE.SpotLight(0xffffff, 0.7, 15, Math.PI / 7, 0.5, 1);
    topL.position.set(0, 8, 0);
    topL.target.position.set(0, 0, 0);
    topL.castShadow = true;
    scene.add(topL);
    scene.add(topL.target);

    // ── Front fill nhẹ ──
    var fillL = new THREE.DirectionalLight(0xffffff, 0.25);
    fillL.position.set(0, 2, 6);
    scene.add(fillL);

    // ── Sàn tối phản chiếu mờ (không lưới) ──
    var floorGeo = new THREE.PlaneGeometry(30, 30);
    var floorMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.25,
      metalness: 0.6,
    });
    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.2;
    floor.receiveShadow = true;
    scene.add(floor);

    return { scene: scene, camera: camera, renderer: ren };
  }

  function loadGLBIntoScene(st, glbUrl, onSuccess, onError) {
    loadGLTFLoader(function () {
      var ldr = new THREE.GLTFLoader();
      ldr.load(
        glbUrl,
        function (gltf) {
          if (st.rootMesh) st.scene.remove(st.rootMesh);
          st.rootMesh = gltf.scene;
          var box = new THREE.Box3().setFromObject(st.rootMesh);
          var sz = box.getSize(new THREE.Vector3());
          var maxD = Math.max(sz.x, sz.y, sz.z);
          var sc = 2.5 / maxD;
          st.rootMesh.scale.setScalar(sc);

          // Tính lại bounding box sau khi scale
          box.setFromObject(st.rootMesh);
          var ctr = box.getCenter(new THREE.Vector3());
          // Đặt xe chạm sàn: đáy box nằm trên floor (y = -1.2)
          st.rootMesh.position.x = -ctr.x;
          st.rootMesh.position.z = -ctr.z;
          st.rootMesh.position.y = -1.2 - box.min.y;

          st.rootMesh.traverse(function (child) {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          st.scene.add(st.rootMesh);
          if (onSuccess) onSuccess();
        },
        undefined,
        function (err) {
          console.error("GLB load error:", err);
          if (onError) onError(err);
        },
      );
    });
  }

  function startRenderLoop(st) {
    (function loop() {
      requestAnimationFrame(loop);
      if (st.autoRotate && st.rootMesh) st.rootMesh.rotation.y += 0.006;
      var s = st.spherical;
      st.camera.position.x = s.r * Math.sin(s.phi) * Math.sin(s.theta);
      st.camera.position.y = s.r * Math.cos(s.phi);
      st.camera.position.z = s.r * Math.sin(s.phi) * Math.cos(s.theta);
      st.camera.lookAt(0, 0, 0);
      st.renderer.render(st.scene, st.camera);
    })();
  }

  /* ================================================================
   *  THREE.JS – Inline 3D Card in chat
   * ================================================================ */
  function glbDisplayName(filename) {
    return filename
      .replace("vinfast_", "VinFast ")
      .replace(".glb", "")
      .replace("vf3", "VF 3")
      .replace("vf9", "VF 9")
      .replace("lux", "Lux");
  }

  function glbImageName(filename) {
    return VINFAST_IMAGE_MAP[filename] || "";
  }

  function make3DCardHTML(filename, cardId) {
    var name = glbDisplayName(filename);
    return [
      '<div class="vf-model-card" id="card-' +
        cardId +
        '" data-model-file="' +
        filename +
        '">',
      '  <div class="vf-model-header">',
      '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>',
      '    <span class="vf-model-name">' + escapeHtml(name) + "</span>",
      '    <button class="vf-model-fullscreen-btn" data-fs-open="' +
        cardId +
        '" data-filename="' +
        filename +
        '" title="Toàn màn hình">',
      '      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
      '        <polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline>',
      '        <line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line>',
      "      </svg>",
      "    </button>",
      "  </div>",
      '  <div class="vf-model-canvas-wrap" id="wrap-' + cardId + '">',
      '    <canvas id="cv-' + cardId + '"></canvas>',
      '    <div class="vf-loader-overlay" id="loader-' + cardId + '">',
      '      <div class="vf-loader-spinner"></div>',
      '      <span class="vf-loader-txt">Đang tải ' +
        escapeHtml(name) +
        "…</span>",
      "    </div>",
      "  </div>",
      '  <div class="vf-model-controls">',
      '    <button class="vf-ctrl-btn active" data-action="rotate" data-card="' +
        cardId +
        '">⟳ Tự xoay</button>',
      '    <button class="vf-ctrl-btn" data-action="wire" data-card="' +
        cardId +
        '">⬡ Wireframe</button>',
      '    <button class="vf-ctrl-btn" data-action="reset" data-card="' +
        cardId +
        '">⌖ Reset</button>',
      "  </div>",
      "</div>",
    ].join("\n");
  }

  function makeModelPreviewCardHTML(filename) {
    var name = glbDisplayName(filename);
    var imageName = glbImageName(filename);
    var imageHtml = imageName
      ? '<div class="vf-model-preview-image-wrap"><img class="vf-model-preview-image" src="' +
        API_BASE +
        "/data_vf/models/" +
        imageName +
        '" alt="' +
        escapeHtml(name) +
        '"></div>'
      : "";

    return [
      '<div class="vf-model-preview-card" data-preview-model="' +
        filename +
        '">',
      imageHtml,
      '  <div class="vf-model-preview-body">',
      '    <div class="vf-model-preview-name">' + escapeHtml(name) + "</div>",
      '    <button class="vf-model-preview-btn" type="button" data-show-model="' +
        filename +
        '">Xem trực tiếp</button>',
      "  </div>",
      "</div>",
    ].join("\n");
  }

  function initCardThree(cardId, glbUrl) {
    var wrap = document.getElementById("wrap-" + cardId);
    var cv = document.getElementById("cv-" + cardId);
    if (!wrap || !cv) return;

    var W = wrap.clientWidth || 340;
    var H = wrap.clientHeight || 220;
    cv.width = W;
    cv.height = H;

    loadThreeJS(function () {
      var created = createScene(cv, W, H);
      var st = {
        scene: created.scene,
        camera: created.camera,
        renderer: created.renderer,
        rootMesh: null,
        autoRotate: true,
        wireframeMode: false,
        spherical: { theta: 0.5, phi: 1.1, r: 3.5 },
        isDragging: false,
        prevMouse: { x: 0, y: 0 },
        glbUrl: glbUrl,
      };
      cardStates[cardId] = st;

      setupOrbitControls(cv, st);
      startRenderLoop(st);

      loadGLBIntoScene(
        st,
        glbUrl,
        function () {
          var lo = document.getElementById("loader-" + cardId);
          if (lo) lo.classList.add("hidden");
        },
        function () {
          var lo = document.getElementById("loader-" + cardId);
          if (lo) {
            lo.querySelector(".vf-loader-txt").textContent = "Lỗi tải model!";
            lo.querySelector(".vf-loader-spinner").style.display = "none";
          }
        },
      );
    });
  }

  /* ── Inline card control buttons ── */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-action]");
    if (!btn) return;
    var action = btn.dataset.action;
    var cid = btn.dataset.card;
    var st = cardStates[cid];
    if (!st) return;

    if (action === "rotate") {
      st.autoRotate = !st.autoRotate;
      btn.classList.toggle("active", st.autoRotate);
    } else if (action === "wire") {
      st.wireframeMode = !st.wireframeMode;
      btn.classList.toggle("active", st.wireframeMode);
      if (st.rootMesh)
        st.rootMesh.traverse(function (c) {
          if (c.isMesh && c.material) c.material.wireframe = st.wireframeMode;
        });
    } else if (action === "reset") {
      st.spherical = { theta: 0.5, phi: 1.1, r: 3.5 };
      if (st.rootMesh) st.rootMesh.rotation.set(0, 0, 0);
      st.autoRotate = true;
      var card = document.getElementById("card-" + cid);
      if (card)
        card.querySelector('[data-action="rotate"]').classList.add("active");
    }
  });

  /* ================================================================
   *  FULLSCREEN 3D VIEWER
   * ================================================================ */
  function openFullscreen3D(filename, glbUrl) {
    fsModal.classList.add("open");
    document.body.style.overflow = "hidden";

    document.getElementById("vfFsTitle").textContent = glbDisplayName(filename);

    var wrap = document.getElementById("vfFsCanvasWrap");
    var cv = document.getElementById("vfFsCanvas");
    var W = wrap.clientWidth || window.innerWidth;
    var H = wrap.clientHeight || window.innerHeight;
    cv.width = W;
    cv.height = H;

    // Destroy previous fullscreen state
    if (fsState && fsState.renderer) {
      fsState.renderer.dispose();
      if (fsState.rootMesh) fsState.scene.remove(fsState.rootMesh);
    }

    loadThreeJS(function () {
      var created = createScene(cv, W, H);
      fsState = {
        scene: created.scene,
        camera: created.camera,
        renderer: created.renderer,
        rootMesh: null,
        autoRotate: true,
        wireframeMode: false,
        spherical: { theta: 0.5, phi: 1.1, r: 3.5 },
        isDragging: false,
        prevMouse: { x: 0, y: 0 },
      };

      setupOrbitControls(cv, fsState);
      startRenderLoop(fsState);
      loadGLBIntoScene(fsState, glbUrl);

      // Reset control button states
      var ctrls = fsModal.querySelectorAll("[data-fs-action]");
      for (var i = 0; i < ctrls.length; i++) {
        ctrls[i].classList.toggle(
          "active",
          ctrls[i].dataset.fsAction === "rotate",
        );
      }
    });
  }

  function closeFullscreen3D() {
    fsModal.classList.remove("open");
    document.body.style.overflow = "";
  }

  document
    .getElementById("vfFsClose")
    .addEventListener("click", closeFullscreen3D);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && fsModal.classList.contains("open"))
      closeFullscreen3D();
  });

  // Fullscreen control buttons
  fsModal.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-fs-action]");
    if (!btn || !fsState) return;
    var action = btn.dataset.fsAction;

    if (action === "rotate") {
      fsState.autoRotate = !fsState.autoRotate;
      btn.classList.toggle("active", fsState.autoRotate);
    } else if (action === "wire") {
      fsState.wireframeMode = !fsState.wireframeMode;
      btn.classList.toggle("active", fsState.wireframeMode);
      if (fsState.rootMesh)
        fsState.rootMesh.traverse(function (c) {
          if (c.isMesh && c.material)
            c.material.wireframe = fsState.wireframeMode;
        });
    } else if (action === "reset") {
      fsState.spherical = { theta: 0.5, phi: 1.1, r: 3.5 };
      if (fsState.rootMesh) fsState.rootMesh.rotation.set(0, 0, 0);
      fsState.autoRotate = true;
      fsModal
        .querySelector('[data-fs-action="rotate"]')
        .classList.add("active");
    }
  });

  // Open fullscreen from card button
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-fs-open]");
    if (!btn) return;
    var cardId = btn.dataset.fsOpen;
    var filename = btn.dataset.filename;
    var st = cardStates[cardId];
    var glbUrl = st
      ? st.glbUrl
      : window.location.origin + "/data_vf/models/" + filename;
    openFullscreen3D(filename, glbUrl);
  });

  // Reveal 3D cards only after user clicks preview button
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-show-model]");
    if (!btn) return;

    var contentDiv = btn.closest(".vf-bot-content");
    if (!contentDiv) return;

    var filename = btn.dataset.showModel;
    if (!filename) return;

    if (btn.classList.contains("shown")) {
      remove3DCardsFromContent(contentDiv, [filename]);
      btn.classList.remove("shown");
      btn.textContent = "Xem trực tiếp";
      return;
    }

    append3DCardsToContent(contentDiv, [filename]);
    btn.classList.add("shown");
    btn.textContent = "Thu gọn";
  });

  // Resize handler for fullscreen
  window.addEventListener("resize", function () {
    if (!fsState || !fsModal.classList.contains("open")) return;
    var wrap = document.getElementById("vfFsCanvasWrap");
    var cv = document.getElementById("vfFsCanvas");
    var W = wrap.clientWidth;
    var H = wrap.clientHeight;
    cv.width = W;
    cv.height = H;
    fsState.camera.aspect = W / H;
    fsState.camera.updateProjectionMatrix();
    fsState.renderer.setSize(W, H);
  });

  /* ================================================================
   *  APPEND 3D CARDS TO BOT MESSAGE
   * ================================================================ */
  function append3DCardsToContent(contentDiv, glbFiles) {
    if (!contentDiv) return;
    var files = uniqueList(glbFiles || []);
    for (var i = 0; i < files.length; i++) {
      var filename = files[i];
      if (contentDiv.querySelector('[data-model-file="' + filename + '"]')) {
        continue;
      }

      var cardId = "vfglb" + ++glbCardCounter;
      var glbUrl = window.location.origin + "/data_vf/models/" + filename;
      contentDiv.insertAdjacentHTML(
        "beforeend",
        make3DCardHTML(filename, cardId),
      );
      (function (cid, url) {
        requestAnimationFrame(function () {
          initCardThree(cid, url);
          scrollToBottom();
        });
      })(cardId, glbUrl);
    }
    scrollToBottom();
  }

  function append3DCards(parentEl, glbFiles) {
    var contentDiv = parentEl.querySelector(".vf-bot-content");
    append3DCardsToContent(contentDiv, glbFiles);
  }

  function disposeCardState(cardId) {
    var st = cardStates[cardId];
    if (!st) return;
    if (st.rootMesh && st.scene) st.scene.remove(st.rootMesh);
    if (st.renderer) st.renderer.dispose();
    delete cardStates[cardId];
  }

  function remove3DCardsFromContent(contentDiv, glbFiles) {
    if (!contentDiv) return;
    var files = uniqueList(glbFiles || []);
    for (var i = 0; i < files.length; i++) {
      var filename = files[i];
      var cards = contentDiv.querySelectorAll(
        '[data-model-file="' + filename + '"]',
      );
      for (var j = 0; j < cards.length; j++) {
        var card = cards[j];
        var cardId =
          card.id && card.id.indexOf("card-") === 0 ? card.id.slice(5) : "";
        if (cardId) disposeCardState(cardId);
        card.remove();
      }
    }
    scrollToBottom();
  }

  function appendModelPreviewCards(parentEl, glbFiles) {
    var contentDiv = parentEl.querySelector(".vf-bot-content");
    if (!contentDiv) return;

    var previewList = contentDiv.querySelector(".vf-model-preview-list");
    if (!previewList) {
      previewList = document.createElement("div");
      previewList.className = "vf-model-preview-list";
      contentDiv.appendChild(previewList);
    }

    var files = uniqueList(glbFiles || []);
    for (var i = 0; i < files.length; i++) {
      var filename = files[i];
      if (
        previewList.querySelector('[data-preview-model="' + filename + '"]')
      ) {
        continue;
      }
      var cardHtml = makeModelPreviewCardHTML(filename);
      if (!cardHtml) continue;
      previewList.insertAdjacentHTML("beforeend", cardHtml);
    }
    scrollToBottom();
  }

  function renderModelCards(parentEl, text, glbFromToolCalls) {
    var files = uniqueList(glbFromToolCalls || []);
    if (files.length === 0 && text) {
      files = detectVinfastGLB(text);
    }
    if (files.length > 0) appendModelPreviewCards(parentEl, files);
  }

  /* ================================================================
   *  FALLBACK: fetch final answer from thread state
   * ================================================================ */
  async function fetchFinalAnswer(botEl, bubble, glbFromToolCalls) {
    try {
      var res = await fetch(API_BASE + "/threads/" + threadId + "/state");
      if (!res.ok) return;
      var data = await res.json();
      var msgs =
        data.values && data.values.messages ? data.values.messages : [];
      var lastAI = null;
      for (var i = msgs.length - 1; i >= 0; i--) {
        var m = msgs[i];
        if (
          m.type === "ai" &&
          m.content &&
          (!m.tool_calls || m.tool_calls.length === 0)
        ) {
          lastAI = m;
          break;
        }
      }
      if (!lastAI) return;
      var text =
        typeof lastAI.content === "string"
          ? lastAI.content
          : Array.isArray(lastAI.content)
            ? lastAI.content
                .filter(function (c) {
                  return c.type === "text";
                })
                .map(function (c) {
                  return c.text;
                })
                .join("")
            : "";
      if (text) {
        bubble.innerHTML = formatBotText(text);
        renderModelCards(botEl, text, glbFromToolCalls);
      }
    } catch (_) {}
  }

  /* ================================================================
   *  SUGGESTION CHIPS
   * ================================================================ */
  var _SUGGESTION_SETS = [
    [
      "Tư vấn xe cho gia đình",
      "Xe đi đô thị dưới 400 triệu",
      "So sánh VF 3 và VF 9",
    ],
    ["Xe cao cấp 7 chỗ", "Xem xe VF 9 3D", "Xe tiết kiệm chi phí"],
    ["Xe xăng hay xe điện?", "Ưu nhược điểm VF 3", "Xe cho người mới lái"],
  ];
  var _chipSetIndex = 0;

  function removeSuggestionChips() {
    var existing = messagesEl.querySelector(".vf-suggestion-chips");
    if (existing) existing.remove();
  }

  function showSuggestionChips() {
    removeSuggestionChips();
    var chips = _SUGGESTION_SETS[_chipSetIndex % _SUGGESTION_SETS.length];
    _chipSetIndex++;

    var wrap = document.createElement("div");
    wrap.className = "vf-suggestion-chips";
    for (var i = 0; i < chips.length; i++) {
      var btn = document.createElement("button");
      btn.className = "vf-chip";
      btn.textContent = chips[i];
      btn.addEventListener(
        "click",
        (function (text) {
          return function () {
            inputEl.value = text;
            sendMessage();
          };
        })(chips[i]),
      );
      wrap.appendChild(btn);
    }
    messagesEl.appendChild(wrap);
    scrollToBottom();
  }

  /* ================================================================
   *  SEND MESSAGE – main flow (LangGraph streaming)
   * ================================================================ */
  async function sendMessage() {
    var val = inputEl.value.trim();
    if (!val || isSending) return;
    inputEl.value = "";
    isSending = true;
    sendBtn.disabled = true;

    addUserMessage(val);
    removeSuggestionChips();
    showTyping();

    try {
      var body = await streamRun(val);
      removeTyping();

      var botEl = createBotMsgEl();
      var bubble = botEl.querySelector(".vf-msg-bubble");
      var receivedText = false;
      var glbFromToolCalls = [];

      await readSSEStream(
        body,
        // onToken – streaming text
        function (delta, fullText) {
          receivedText = true;
          bubble.innerHTML = formatBotText(fullText);
          scrollToBottom();
        },
        // onToolCall – show badge
        function (toolName, args) {
          showToolCallBadge(botEl, toolName);
          if (toolName === "load_3d_model") {
            glbFromToolCalls = glbFromToolCalls.concat(
              extractGLBFromToolArgs(args),
            );
          }
        },
        // onDone
        async function (fullText) {
          removeToolSpinners(botEl);
          renderModelCards(botEl, fullText, glbFromToolCalls);
        },
      );

      // Fallback: if stream didn't produce AI text, fetch from thread state
      if (!receivedText || !bubble.textContent.trim()) {
        await fetchFinalAnswer(botEl, bubble, glbFromToolCalls);
      }
    } catch (err) {
      console.error("Chat error:", err);
      removeTyping();
      var errEl = createBotMsgEl();
      errEl.querySelector(".vf-msg-bubble").innerHTML =
        '<span style="color:#e74c3c">⚠ Lỗi: ' +
        escapeHtml(err.message) +
        "</span>";
    }

    isSending = false;
    sendBtn.disabled = false;
    showSuggestionChips();
    scrollToBottom();
  }

  /* ── EVENT LISTENERS ── */
  quickToggleBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleQuickMenu();
  });

  openFeedbackBtn.addEventListener("click", function () {
    toggleQuickMenu(false);
    openFeedbackPanel();
  });

  feedbackCloseBtn.addEventListener("click", closeFeedbackPanel);

  feedbackPanelEl.addEventListener("click", function (e) {
    if (e.target === feedbackPanelEl) closeFeedbackPanel();
  });

  feedbackStarsEl.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-star]");
    if (!btn) return;
    setSelectedStars(Number(btn.dataset.star));
  });

  feedbackTextEl.addEventListener("input", updateSubmitState);

  feedbackSubmitBtn.addEventListener("click", submitFeedback);

  feedbackTextEl.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      submitFeedback();
    }
  });

  document.addEventListener("click", function (e) {
    if (!quickActionsEl.contains(e.target)) {
      toggleQuickMenu(false);
    }
  });

  sendBtn.addEventListener("click", sendMessage);
  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
})();
