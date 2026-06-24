class VoicePersonality {
  constructor() {
    this.currentAudio = null;
  }

  speak(text, options = {}) {
    return new Promise((resolve) => {
      // Cancel any ongoing speech first
      this.cancel();

      // 120ms delay before speaking (feels more natural, not instant)
      setTimeout(async () => {
        try {
          const token = localStorage.getItem('token');
          // In production, use relative URL or env var. For this dev environment, use localhost:5000.
          const response = await fetch('http://localhost:5000/api/voice/tts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ text })
          });

          if (!response.ok) {
            console.error('[VoicePersonality] TTS API failed', response.status);
            window.dispatchEvent(new CustomEvent('resq:voice-end'));
            resolve();
            return;
          }

          const arrayBuffer = await response.arrayBuffer();
          const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
          const url = URL.createObjectURL(blob);

          this.currentAudio = new Audio(url);
          this.currentAudio.volume = 0.95;

          this.currentAudio.onplay = () => {
            window.dispatchEvent(new CustomEvent('resq:voice-start'));
          };

          this.currentAudio.onended = () => {
            window.dispatchEvent(new CustomEvent('resq:voice-end'));
            if (options.onEnd) {
              try { options.onEnd(); } catch(e) {}
            }
            URL.revokeObjectURL(url);
            this.currentAudio = null;
            resolve();
          };

          this.currentAudio.onerror = (e) => {
            console.warn('[VoicePersonality] Audio playback error:', e);
            window.dispatchEvent(new CustomEvent('resq:voice-end'));
            URL.revokeObjectURL(url);
            this.currentAudio = null;
            resolve();
          };

          await this.currentAudio.play();
        } catch (error) {
          console.error('[VoicePersonality] Error playing ElevenLabs TTS:', error);
          resolve();
        }
      }, 120);
    });
  }

  cancel() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      window.dispatchEvent(new CustomEvent('resq:voice-end'));
    }
  }

  interpolate(template, data = {}) {
    if (!template) return '';
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  }
}

export const INSTANT_RESPONSES = {
  wake_acknowledged:  "Yes? I'm listening.",
  thinking:           "Let me check on that for you.",
  task_created:       "Done. I've added that to your task list.",
  event_scheduled:    "Scheduled. You're all set for {time}.",
  conflict_found:     "There's a conflict at {time}. Would you prefer {alt}?",
  priority_updated:   "Task priorities have been updated.",
  out_of_scope:       "I can't {action}, but I'm built to help you with tasks, your calendar, habits, goals, and staying focused. What would you like to tackle?",
  no_free_time:       "Your schedule looks fully blocked today. Want me to find time tomorrow instead?",
  good_morning:       "Good morning, {name}. You have {count} tasks today. Your first focus block starts at {time}.",
};

const voicePersonalityInstance = new VoicePersonality();
export default voicePersonalityInstance;
