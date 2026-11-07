/* ============================================================
   发音 —— 浏览器原生 Web Speech API（免费、无密钥、离线可用）
   ------------------------------------------------------------
   优先选择 en-US / en-GB 的本地语音；iOS 需在用户手势中调用。
   ============================================================ */
import * as store from './store.js';

let voices = [];
let loaded = false;

export function supported() {
  return typeof globalThis !== 'undefined'
    && typeof globalThis.speechSynthesis !== 'undefined'
    && typeof globalThis.SpeechSynthesisUtterance !== 'undefined';
}

export function refreshVoices() {
  if (!supported()) return [];
  try {
    voices = globalThis.speechSynthesis.getVoices() || [];
    loaded = voices.length > 0;
  } catch { voices = []; }
  return voices;
}

export function englishVoices() {
  if (!loaded) refreshVoices();
  const en = voices.filter(v => /^en([-_]|$)/i.test(v.lang || ''));
  return en.sort((a, b) => {
    const score = v => (v.localService ? 2 : 0) + (/en[-_]US/i.test(v.lang) ? 1 : 0);
    return score(b) - score(a);
  });
}

export function voiceOptions() {
  return englishVoices().map(v => ({ uri: v.voiceURI, name: `${v.name} (${v.lang})${v.localService ? ' · 本地' : ''}` }));
}

if (supported()) {
  refreshVoices();
  try { globalThis.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices); } catch {}
}

/** 朗读一段文本；返回 {ok, reason} */
export function speak(text, opts = {}) {
  const t = String(text || '').trim();
  if (!t) return { ok: false, reason: '没有可朗读的文本' };
  if (!supported()) return { ok: false, reason: '当前浏览器不支持语音合成，请换用 Safari 或 Chrome' };
  try {
    globalThis.speechSynthesis.cancel();
    const u = new globalThis.SpeechSynthesisUtterance(t);
    u.lang = opts.lang || 'en-US';
    u.rate = Number(opts.rate ?? store.get().settings.speechRate ?? 0.9);
    u.pitch = 1;
    u.volume = 1;
    const wanted = opts.voiceURI || store.get().settings.speechVoiceURI;
    if (!loaded) refreshVoices();
    const v = wanted ? voices.find(x => x.voiceURI === wanted) : englishVoices()[0];
    if (v) { u.voice = v; u.lang = v.lang || u.lang; }
    globalThis.speechSynthesis.speak(u);
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: '朗读失败：' + (e && e.message ? e.message : '未知错误') };
  }
}

export function stop() {
  if (!supported()) return;
  try { globalThis.speechSynthesis.cancel(); } catch {}
}

/** 供设置页显示状态 */
export function status() {
  if (!supported()) return { ok: false, text: '此浏览器不支持系统语音' };
  const n = englishVoices().length;
  return { ok: true, text: n ? `可用英语语音 ${n} 个（系统内置，无需联网）` : '系统暂未列出英语语音，仍可尝试朗读' };
}
