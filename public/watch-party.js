/* =====================================================================
   Artemis II Watch Party — real-time chat via Firebase Realtime Database
   =====================================================================

   HOW TO INSTALL (paste these lines into your index.html):

   In <head>:
     <link rel="stylesheet" href="/watch-party.css">

   Just before </body> (must be in this order):
     <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
     <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js"></script>
     <script src="/watch-party.js"></script>

   That's it. The widget will:
     1. Show a modal popup 5 seconds after page load
     2. Let users join with optional name/email
     3. Show a floating chat widget bottom-right after they join
     4. Sync messages in real time across all visitors
     5. Show a "X watching" presence count

   Firebase Realtime Database rules required (set in Firebase Console):
     {
       "rules": {
         "watchparty": {
           ".read": true,
           ".write": true
         }
       }
     }
   ===================================================================== */

(function () {
  "use strict";

  // ── Firebase config ────────────────────────────────────────────────
  var firebaseConfig = {
    apiKey: "AIzaSyBeHXhrsbwNmNwWtdR93Css3oMyfNaJjP0",
    authDomain: "artemis-watch-party.firebaseapp.com",
    databaseURL: "https://artemis-watch-party-default-rtdb.firebaseio.com",
    projectId: "artemis-watch-party",
    storageBucket: "artemis-watch-party.firebasestorage.app",
    messagingSenderId: "1083215102139",
    appId: "1:1083215102139:web:4a7c6f1c45ccfe71a7a99e",
  };

  // ── Generate or retrieve session ID + name ─────────────────────────
  function generateId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return "wp-" + Math.random().toString(36).slice(2) + "-" + Date.now().toString(36);
  }

  var STORAGE_KEY = "wp-session-v1";
  function loadSession() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }
  function saveSession(s) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch (e) {}
  }

  var session = loadSession() || { id: generateId(), name: null, email: null, joined: false };

  // ── Wait for Firebase compat SDK to load ───────────────────────────
  function waitForFirebase(cb, attempts) {
    attempts = attempts || 0;
    if (typeof firebase !== "undefined" && firebase.database) {
      cb();
    } else if (attempts < 60) {
      setTimeout(function () {
        waitForFirebase(cb, attempts + 1);
      }, 100);
    } else {
      console.warn("[WatchParty] Firebase failed to load after 6 seconds.");
    }
  }

  // ── Initialize Firebase + Realtime Database ────────────────────────
  var db = null;
  var messagesRef = null;
  var presenceRef = null;
  var mySessionRef = null;

  function initFirebase() {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.database();
      messagesRef = db.ref("watchparty/messages");
      presenceRef = db.ref("watchparty/presence");
      mySessionRef = presenceRef.child(session.id);
    } catch (e) {
      console.warn("[WatchParty] Firebase init error:", e);
    }
  }

  // ── Build the modal popup ──────────────────────────────────────────
  function showJoinModal() {
    if (document.getElementById("wp-modal")) return;
    if (session.joined) return;

    var overlay = document.createElement("div");
    overlay.className = "wp-modal-overlay";
    overlay.id = "wp-modal";

    overlay.innerHTML =
      '<div class="wp-modal" role="dialog" aria-labelledby="wp-modal-title">' +
      '  <button class="wp-modal-close" aria-label="Close">&times;</button>' +
      '  <h2 class="wp-modal-title" id="wp-modal-title">🚀 Join the Artemis II Watch Party</h2>' +
      '  <p class="wp-modal-subtitle">Chat with other space fans watching the mission live. Both fields are optional.</p>' +
      '  <form class="wp-modal-form" id="wp-modal-form">' +
      '    <input type="text" class="wp-input" id="wp-name-input" placeholder="Your name (optional)" autocomplete="off" maxlength="40">' +
      '    <input type="email" class="wp-input" id="wp-email-input" placeholder="Email (optional)" autocomplete="off" maxlength="80">' +
      '    <button type="submit" class="wp-btn-primary">Join Watch Party</button>' +
      '    <button type="button" class="wp-btn-secondary" id="wp-just-watch">Just watch</button>' +
      '  </form>' +
      "</div>";

    document.body.appendChild(overlay);

    function closeModal(joined) {
      var form = document.getElementById("wp-modal-form");
      var name = form.querySelector("#wp-name-input").value.trim();
      var email = form.querySelector("#wp-email-input").value.trim();
      session.name = name || "Guest";
      session.email = email || null;
      session.joined = joined;
      saveSession(session);
      overlay.remove();
      if (joined) {
        showChatWidget();
        registerPresence();
      }
    }

    overlay.querySelector(".wp-modal-close").addEventListener("click", function () {
      overlay.remove();
    });
    document.getElementById("wp-just-watch").addEventListener("click", function () {
      closeModal(true);
    });
    document.getElementById("wp-modal-form").addEventListener("submit", function (e) {
      e.preventDefault();
      closeModal(true);
    });
  }

  // ── Build the chat widget (collapsed by default = toggle button) ───
  var chatExpanded = false;
  var unreadCount = 0;
  var loadedMessages = [];

  function showChatWidget() {
    if (document.getElementById("wp-toggle") || document.getElementById("wp-chat")) return;
    renderToggle();
    listenToMessages();
  }

  function renderToggle() {
    var existing = document.getElementById("wp-toggle");
    if (existing) existing.remove();

    var btn = document.createElement("button");
    btn.id = "wp-toggle";
    btn.className = "wp-toggle";
    btn.setAttribute("aria-label", "Open watch party chat");
    btn.innerHTML = "🚀";
    if (unreadCount > 0) {
      var badge = document.createElement("span");
      badge.className = "wp-toggle-badge";
      badge.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
      btn.appendChild(badge);
    }
    btn.addEventListener("click", function () {
      chatExpanded = true;
      unreadCount = 0;
      btn.remove();
      renderChat();
    });
    document.body.appendChild(btn);
  }

  function renderChat() {
    var existing = document.getElementById("wp-chat");
    if (existing) existing.remove();

    var chat = document.createElement("div");
    chat.id = "wp-chat";
    chat.className = "wp-chat";
    chat.innerHTML =
      '<div class="wp-chat-header">' +
      '  <div class="wp-chat-title">' +
      '    <span class="wp-chat-title-emoji">🚀</span>' +
      '    <div>' +
      '      <div class="wp-chat-title-text">Watch Party</div>' +
      '      <div class="wp-chat-presence">' +
      '        <span class="wp-chat-presence-dot"></span>' +
      '        <span id="wp-presence-count">— watching</span>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '  <button class="wp-chat-collapse" id="wp-collapse" aria-label="Collapse chat">&times;</button>' +
      '</div>' +
      '<div class="wp-chat-messages" id="wp-messages">' +
      '  <div class="wp-chat-empty" id="wp-empty">No messages yet. Be the first to say hi!</div>' +
      "</div>" +
      '<form class="wp-chat-input-row" id="wp-input-form">' +
      '  <input type="text" class="wp-chat-input" id="wp-input" placeholder="Type a message…" autocomplete="off" maxlength="500">' +
      '  <button type="submit" class="wp-chat-send" id="wp-send">Send</button>' +
      "</form>";

    document.body.appendChild(chat);

    document.getElementById("wp-collapse").addEventListener("click", function () {
      chatExpanded = false;
      chat.remove();
      renderToggle();
    });

    document.getElementById("wp-input-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var input = document.getElementById("wp-input");
      var text = input.value.trim();
      if (!text) return;
      sendMessage(text);
      input.value = "";
    });

    // Render any messages we already have
    renderAllMessages();
    listenToPresence();
  }

  // ── Render messages into the chat panel ────────────────────────────
  function renderAllMessages() {
    var container = document.getElementById("wp-messages");
    if (!container) return;
    var empty = document.getElementById("wp-empty");
    if (loadedMessages.length === 0) {
      if (empty) empty.style.display = "";
      return;
    }
    if (empty) empty.style.display = "none";

    // Only re-render if message count differs (cheap incremental approach)
    var existingCount = container.querySelectorAll(".wp-msg").length;
    if (existingCount === loadedMessages.length) return;

    // Append only new messages from existingCount onward
    for (var i = existingCount; i < loadedMessages.length; i++) {
      var msg = loadedMessages[i];
      container.appendChild(buildMsgElement(msg));
    }
    container.scrollTop = container.scrollHeight;
  }

  function buildMsgElement(msg) {
    var div = document.createElement("div");
    var isOwn = msg.sessionId === session.id;
    div.className = "wp-msg" + (isOwn ? " wp-msg-own" : "");

    var meta = document.createElement("div");
    meta.className = "wp-msg-meta";

    var name = document.createElement("span");
    name.className = "wp-msg-name";
    name.textContent = msg.name || "Guest";
    meta.appendChild(name);

    var time = document.createElement("span");
    time.className = "wp-msg-time";
    time.textContent = formatTime(msg.timestamp);
    meta.appendChild(time);

    var text = document.createElement("div");
    text.className = "wp-msg-text";
    text.textContent = msg.text;

    div.appendChild(meta);
    div.appendChild(text);
    return div;
  }

  function formatTime(ts) {
    if (!ts) return "";
    var d = new Date(ts);
    var h = d.getHours();
    var m = d.getMinutes();
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }

  // ── Subscribe to messages ──────────────────────────────────────────
  function listenToMessages() {
    if (!messagesRef) return;
    messagesRef.limitToLast(100).on("value", function (snapshot) {
      var arr = [];
      snapshot.forEach(function (child) {
        var v = child.val();
        if (v && v.text) arr.push(v);
      });
      arr.sort(function (a, b) {
        return (a.timestamp || 0) - (b.timestamp || 0);
      });

      var prevCount = loadedMessages.length;
      loadedMessages = arr;

      if (chatExpanded) {
        renderAllMessages();
      } else {
        // Count new messages from others as unread
        var newOnes = arr.slice(prevCount);
        var newFromOthers = newOnes.filter(function (m) {
          return m.sessionId !== session.id;
        }).length;
        if (newFromOthers > 0) {
          unreadCount += newFromOthers;
          renderToggle();
        }
      }
    });
  }

  // ── Send a message ─────────────────────────────────────────────────
  function sendMessage(text) {
    if (!messagesRef) return;
    var msg = {
      sessionId: session.id,
      name: session.name || "Guest",
      text: text.slice(0, 500),
      timestamp: Date.now(),
    };
    messagesRef.push(msg).catch(function (e) {
      console.warn("[WatchParty] Failed to send:", e);
    });
  }

  // ── Presence (live "X watching" count) ─────────────────────────────
  function registerPresence() {
    if (!mySessionRef) return;
    try {
      mySessionRef.set({ name: session.name || "Guest", since: Date.now() });
      mySessionRef.onDisconnect().remove();

      // Heartbeat — keeps presence fresh and survives tab focus changes
      setInterval(function () {
        mySessionRef.set({ name: session.name || "Guest", since: Date.now() });
      }, 30000);
    } catch (e) {
      console.warn("[WatchParty] Presence error:", e);
    }
  }

  function listenToPresence() {
    if (!presenceRef) return;
    presenceRef.on("value", function (snapshot) {
      var count = 0;
      snapshot.forEach(function () {
        count++;
      });
      var el = document.getElementById("wp-presence-count");
      if (el) el.textContent = count + (count === 1 ? " watching" : " watching");
    });
  }

  // ── Boot ───────────────────────────────────────────────────────────
  function boot() {
    waitForFirebase(function () {
      initFirebase();
      // If returning user already joined, skip the modal
      if (session.joined) {
        showChatWidget();
        registerPresence();
      } else {
        setTimeout(showJoinModal, 5000);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
