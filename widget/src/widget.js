(function () {
  const script = document.currentScript;
  const botId = script?.getAttribute('data-bot-id');
  const apiUrl = script?.getAttribute('data-api-url') || script?.src.replace(/\/widget\.js.*/, '');

  if (!botId) {
    console.error('Cleo Widget: data-bot-id is required');
    return;
  }

  let config = null;
  let sessionId = localStorage.getItem('cleo_session_' + botId) || null;
  let isOpen = false;
  let messages = [];

  // Fetch bot config
  fetch(`${apiUrl}/api/widget/config/${botId}`)
    .then((r) => r.json())
    .then((data) => {
      config = data;
      init();
    })
    .catch((err) => console.error('Cleo Widget: Failed to load config', err));

  function init() {
    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
      #cleo-widget-btn {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: ${config.widget_color};
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        transition: transform 0.2s;
      }
      #cleo-widget-btn:hover { transform: scale(1.1); }
      #cleo-widget-btn svg { width: 24px; height: 24px; fill: white; }
      #cleo-widget-box {
        position: fixed;
        bottom: 88px;
        right: 20px;
        width: 370px;
        height: 520px;
        border-radius: 16px;
        background: #1e293b;
        border: 1px solid #334155;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        display: none;
        flex-direction: column;
        z-index: 99999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow: hidden;
      }
      #cleo-widget-box.open { display: flex; }
      #cleo-widget-header {
        padding: 16px;
        background: ${config.widget_color};
        color: white;
        font-weight: 700;
        font-size: 15px;
      }
      #cleo-widget-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }
      .cleo-msg {
        margin-bottom: 10px;
        display: flex;
      }
      .cleo-msg.user { justify-content: flex-end; }
      .cleo-msg-bubble {
        max-width: 80%;
        padding: 8px 12px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.4;
        color: #f8fafc;
        word-wrap: break-word;
      }
      .cleo-msg.assistant .cleo-msg-bubble { background: #334155; }
      .cleo-msg.user .cleo-msg-bubble { background: ${config.widget_color}; }
      #cleo-widget-input-area {
        padding: 12px;
        border-top: 1px solid #334155;
        display: flex;
        gap: 8px;
      }
      #cleo-widget-input {
        flex: 1;
        border: 1px solid #334155;
        border-radius: 8px;
        padding: 8px 12px;
        background: #0f172a;
        color: #f8fafc;
        font-size: 14px;
        outline: none;
      }
      #cleo-widget-input:focus { border-color: ${config.widget_color}; }
      #cleo-widget-send {
        background: ${config.widget_color};
        border: none;
        border-radius: 8px;
        padding: 8px 14px;
        color: white;
        font-weight: 600;
        cursor: pointer;
        font-size: 14px;
      }
      #cleo-widget-send:disabled { opacity: 0.5; cursor: not-allowed; }
    `;
    document.head.appendChild(style);

    // Create toggle button
    const btn = document.createElement('button');
    btn.id = 'cleo-widget-btn';
    btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>';
    btn.onclick = toggle;
    document.body.appendChild(btn);

    // Create chat box
    const box = document.createElement('div');
    box.id = 'cleo-widget-box';
    box.innerHTML = `
      <div id="cleo-widget-header">${config.widget_title}</div>
      <div id="cleo-widget-messages"></div>
      <div id="cleo-widget-input-area">
        <input id="cleo-widget-input" placeholder="Escribe un mensaje..." />
        <button id="cleo-widget-send">Enviar</button>
      </div>
    `;
    document.body.appendChild(box);

    // Add greeting
    addMessage('assistant', config.widget_greeting);

    // Event listeners
    document.getElementById('cleo-widget-send').onclick = sendMessage;
    document.getElementById('cleo-widget-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  function toggle() {
    isOpen = !isOpen;
    document.getElementById('cleo-widget-box').classList.toggle('open', isOpen);
  }

  function addMessage(role, content) {
    messages.push({ role, content });
    const container = document.getElementById('cleo-widget-messages');
    const div = document.createElement('div');
    div.className = `cleo-msg ${role}`;
    div.innerHTML = `<div class="cleo-msg-bubble">${escapeHtml(content)}</div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async function sendMessage() {
    const input = document.getElementById('cleo-widget-input');
    const sendBtn = document.getElementById('cleo-widget-send');
    const text = input.value.trim();
    if (!text) return;

    addMessage('user', text);
    input.value = '';
    sendBtn.disabled = true;

    try {
      const res = await fetch(`${apiUrl}/api/widget/message/${botId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId }),
      });
      const data = await res.json();
      sessionId = data.sessionId;
      localStorage.setItem('cleo_session_' + botId, sessionId);
      addMessage('assistant', data.response);
    } catch (err) {
      addMessage('assistant', 'Lo siento, hubo un error. Intenta de nuevo.');
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }
})();
