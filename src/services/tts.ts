import { supabase } from '../lib/supabase';

class TTSService {
  private audioContext: AudioContext | null = null;
  private audioQueue: HTMLAudioElement[] = [];
  private isPlaying = false;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  async speak(text: string, voiceType: string = 'default'): Promise<void> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/tts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voiceType,
        }),
      });

      if (!response.ok) {
        throw new Error('TTS request failed');
      }

      const audioBlob = await response.blob();
      await this.playAudio(audioBlob);
    } catch (error) {
      console.error('TTS error:', error);
      throw error;
    }
  }

  private async playAudio(audioBlob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        this.isPlaying = false;
        this.playNext();
        resolve();
      };

      audio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        this.isPlaying = false;
        reject(error);
      };

      if (this.isPlaying) {
        this.audioQueue.push(audio);
      } else {
        this.isPlaying = true;
        audio.play();
      }
    });
  }

  private playNext() {
    if (this.audioQueue.length > 0) {
      const nextAudio = this.audioQueue.shift();
      if (nextAudio) {
        this.isPlaying = true;
        nextAudio.play();
      }
    }
  }

  stop() {
    this.audioQueue = [];
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const ttsService = new TTSService();