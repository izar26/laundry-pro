import { useCallback } from 'react';

export default function useSynth() {
  const playTone = useCallback((freq: number, type: 'sine' | 'square' | 'sawtooth' | 'triangle', duration: number) => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }, []);

  const playSuccess = () => {
    // Suara "Kaching" (High pitch arpeggio)
    playTone(1200, 'sine', 0.1);
    setTimeout(() => playTone(1600, 'sine', 0.2), 100);
  };

  const playAdd = () => {
    // Suara "Pop"
    playTone(600, 'triangle', 0.1);
  };

  const playRemove = () => {
    // Suara "Swoosh/Delete" (Low pitch)
    playTone(150, 'sawtooth', 0.15);
  };

  const playError = () => {
    // Suara "Buzzer"
    playTone(150, 'square', 0.1);
    setTimeout(() => playTone(100, 'square', 0.2), 100);
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 1.1; // Sedikit lebih cepat agar natural
      window.speechSynthesis.speak(utterance);
    }
  };

  return { playSuccess, playAdd, playRemove, playError, speak };
}
