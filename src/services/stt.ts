import { supabase } from '../lib/supabase';

class STTService {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private isRecording = false;
  private recognition: any = null;
  private onRecordingStateChange: ((isRecording: boolean) => void) | null = null;

  constructor() {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;

      this.recognition.onstart = () => {
        this.onRecordingStateChange?.(true);
      };

      this.recognition.onend = () => {
        this.onRecordingStateChange?.(false);
      };
    }
  }

  setRecordingStateCallback(callback: (isRecording: boolean) => void) {
    this.onRecordingStateChange = callback;
  }

  async startRecording(stream: MediaStream) {
    if (this.isRecording) return;

    this.mediaRecorder = new MediaRecorder(stream);
    this.chunks = [];
    this.isRecording = true;
    this.onRecordingStateChange?.(true);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    if (this.recognition) {
      this.recognition.start();
    }

    this.mediaRecorder.start();
  }

  async stopRecording(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('No recording in progress'));
        return;
      }

      if (this.recognition) {
        this.recognition.stop();
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(this.chunks, { type: 'audio/webm' });
          const text = await this.transcribeAudio(audioBlob);
          this.isRecording = false;
          this.onRecordingStateChange?.(false);
          resolve(text);
        } catch (error) {
          console.error('Error in stopRecording:', error);
          reject(error);
        } finally {
          this.isRecording = false;
          this.chunks = [];
        }
      };

      this.mediaRecorder.stop();
    });
  }

  private async transcribeAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whisper`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const data = await response.json();
      return data.text || '';
    } catch (error) {
      console.error('Transcription error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }
}

export const sttService = new STTService();