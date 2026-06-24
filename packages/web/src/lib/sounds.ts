// 音效工具 - 使用 Web Audio API 生成点击音效

const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

// 生成清脆的点击音效
export const playClick = (frequency = 800, duration = 0.05) => {
  if (!audioContext) return;
  
  // 恢复上下文（浏览器自动暂停）
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
};

// 滚轮音效
export const playScrollTick = () => {
  playClick(1200, 0.03);
};

// 确认音效
export const playConfirm = () => {
  if (!audioContext) return;
  if (audioContext.state === 'suspended') audioContext.resume();
  
  // 第一个音
  playClick(800, 0.08);
  
  // 第二个音（更高）
  setTimeout(() => playClick(1200, 0.1), 80);
};

// 取消音效
export const playCancel = () => {
  playClick(400, 0.08);
};
