let voicesReady = false;
if (typeof speechSynthesis !== 'undefined') {
  speechSynthesis.onvoiceschanged = () => {
    voicesReady = true;
  };
}

export function canSpeak(): boolean {
  return typeof speechSynthesis !== 'undefined';
}

export function speak(text: string, lang: string): void {
  if (!canSpeak() || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.92;
  const voices = speechSynthesis.getVoices();
  const base = lang.split('-')[0];
  const v = voices.find((x) => x.lang === lang) ?? voices.find((x) => x.lang.startsWith(base));
  if (v) u.voice = v;
  void voicesReady;
  speechSynthesis.speak(u);
}

export function stopSpeaking(): void {
  if (canSpeak()) speechSynthesis.cancel();
}
