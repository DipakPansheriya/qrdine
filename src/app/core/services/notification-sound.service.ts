import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationSoundService {
  private audioMap = new Map<string, HTMLAudioElement>();
  private defaultAudio = new Audio('assets/sounds/mixkit-correct-answer-tone-2870.wav'); // Fallback

  private isMuted = false;
  private lastPlayedMap = new Map<string, number>();
  private PLAY_COOLDOWN_MS = 2000; // Prevent spamming same sound within 2s

  constructor() {
    this.preloadSounds();
  }

  private preloadSounds() {
    const sounds = [
      { key: 'new-order', path: 'assets/sounds/mixkit-correct-answer-tone-2870.wav' },
      { key: 'food-ready', path: 'assets/sounds/mixkit-correct-answer-tone-2870.wav' },
      { key: 'customer-request', path: 'assets/sounds/mixkit-correct-answer-tone-2870.wav' },
      { key: 'bill-request', path: 'assets/sounds/mixkit-correct-answer-tone-2870.wav' },
      { key: 'payment-success', path: 'assets/sounds/mixkit-correct-answer-tone-2870.wav' },
      { key: 'critical-alert', path: 'assets/sounds/mixkit-correct-answer-tone-2870.wav' }
    ];

    sounds.forEach(sound => {
      const audio = new Audio(sound.path);
      audio.preload = 'auto'; // Help browser preload it
      this.audioMap.set(sound.key, audio);
    });
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  playSoundForNotification(type: string, priority: string) {
    if (this.isMuted) return;

    let soundKey = '';

    // Critical Priority overrides generic types if we want it to, 
    // but specific overrides requested by user:
    if (priority === 'CRITICAL') {
      soundKey = 'critical-alert';
    } else {
      switch (type) {
        case 'NEW_ORDER':
          soundKey = 'new-order';
          break;
        case 'ORDER_READY':
        case 'ITEM_READY':
          soundKey = 'food-ready';
          break;
        case 'CUSTOMER_REQUEST':
        case 'CALL_WAITER':
        case 'WATER_REQUEST':
        case 'CUTLERY_REQUEST':
          soundKey = 'customer-request';
          break;
        case 'BILL_REQUEST':
          soundKey = 'bill-request';
          break;
        case 'PAYMENT_SUCCESS':
          soundKey = 'payment-success';
          break;
        default:
          soundKey = 'default';
      }
    }

    this.playThrottled(soundKey);
  }

  private playThrottled(key: string) {
    const now = Date.now();
    const lastPlayed = this.lastPlayedMap.get(key) || 0;

    if (now - lastPlayed < this.PLAY_COOLDOWN_MS) {
      // Ignore if played too recently
      return;
    }

    this.lastPlayedMap.set(key, now);

    try {
      let audio = this.audioMap.get(key) || this.defaultAudio;
      
      // If it's already playing, reset to start
      if (!audio.paused) {
        audio.currentTime = 0;
      }
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Browser auto-play policy error
          console.warn('Audio playback prevented by browser policy (user must interact first):', error);
        });
      }
    } catch (e) {
      console.warn('Error playing sound:', e);
    }
  }
}
