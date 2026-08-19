/**
 * Quản lý Web Audio API Context & Audio Engine bridge
 */
import { webAudioEngine } from './WebAudioEngine';

export class AudioManager {
  private static instance: AudioManager;

  private constructor() {}

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public init(): AudioContext {
    return webAudioEngine.getAudioContext();
  }

  public playTone(freq = 440, duration = 0.2): void {
    webAudioEngine.playSyntheticTone('tone', 'ngang', duration * 1000, 1.0, freq);
  }

  public playClickSound(): void {
    webAudioEngine.playCue(780, 70);
  }

  public playSuccessChime(): void {
    webAudioEngine.playCue(523.25, 120);
    setTimeout(() => webAudioEngine.playCue(659.25, 120), 100);
    setTimeout(() => webAudioEngine.playCue(783.99, 250), 220);
  }

  public stop(): void {
    webAudioEngine.stop();
  }
}

export const audioManager = AudioManager.getInstance();
