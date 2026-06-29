import { API_BASE_URL as API_URL } from '../config/apiConfig.js';

class VoicePersonality {
  constructor() {
    this.currentAudio = null;
    this.abortController = null;
  }

  async speak(text, options = {}) {
    this.currentSpokenText = text;
    window.dispatchEvent(new CustomEvent('resq:voice-start'));

    // ALWAYS cancel browser TTS and current audio first
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (_err) {}
      this.currentAudio = null;
    }

    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/voice/tts`, {
        method: 'POST',
        signal: this.abortController.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });

      if (response.ok) {
        // Use ElevenLabs — do NOT also call speechSynthesis
        const arrayBuffer = await response.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        
        this.currentAudio = new Audio(url);
        this.currentAudio.volume = 0.95;

        this.currentAudio.onended = () => {
          window.dispatchEvent(new CustomEvent('resq:voice-end'));
          URL.revokeObjectURL(url);
          this.currentAudio = null;
          if (options.onEnd) try { options.onEnd(); } catch {}
        };
        
        this.currentAudio.onerror = () => {
          window.dispatchEvent(new CustomEvent('resq:voice-end'));
          URL.revokeObjectURL(url);
          this.currentAudio = null;
          if (options.onEnd) try { options.onEnd(); } catch {}
        };

        await this.currentAudio.play();
        // STOP HERE — do not fall through to speechSynthesis
        return;
      }
    } catch (error) {
      if (error.name === 'AbortError') return; // Silently ignore aborted requests
      console.warn('[VoicePersonality] ElevenLabs failed, falling back to TTS', error);
    }

    // Only reach here if ElevenLabs failed or unavailable
    let safetyTimeout = null;
    const clearSafety = () => {
      if (safetyTimeout) {
        clearTimeout(safetyTimeout);
        safetyTimeout = null;
      }
    };

    safetyTimeout = setTimeout(() => {
      console.warn('[VoicePersonality] Speech synthesis timeout reached — releasing state.');
      if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch {}
      }
      window.dispatchEvent(new CustomEvent('resq:voice-end'));
      if (options.onEnd) {
        try { options.onEnd(); } catch {}
      }
    }, Math.max(8000, text.length * 120));

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      
      utterance.onend = () => {
        clearSafety();
        window.dispatchEvent(new CustomEvent('resq:voice-end'));
        if (options.onEnd) try { options.onEnd(); } catch {}
      };
      
      utterance.onerror = () => {
        clearSafety();
        window.dispatchEvent(new CustomEvent('resq:voice-end'));
        if (options.onEnd) try { options.onEnd(); } catch {}
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      clearSafety();
      window.dispatchEvent(new CustomEvent('resq:voice-end'));
      if (options.onEnd) try { options.onEnd(); } catch {}
    }
  }

  playAudioBuffer(base64Audio, mimeType, text) {
    this.currentSpokenText = text;
    window.dispatchEvent(new CustomEvent('resq:voice-start'));

    return new Promise((resolve) => {
      this.cancel();

      try {
        const binary = atob(base64Audio);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          array[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([array], { type: mimeType || 'audio/mpeg' });
        const url = URL.createObjectURL(blob);

        this.currentAudio = new Audio(url);
        this.currentAudio.volume = 0.95;

        this.currentAudio.onended = () => {
          window.dispatchEvent(new CustomEvent('resq:voice-end'));
          URL.revokeObjectURL(url);
          this.currentAudio = null;
          resolve();
        };

        this.currentAudio.onerror = (e) => {
          console.warn('[VoicePersonality] Audio buffer playback error:', e);
          window.dispatchEvent(new CustomEvent('resq:voice-end'));
          URL.revokeObjectURL(url);
          this.currentAudio = null;
          resolve();
        };

        this.currentAudio.play().catch(() => {
          window.dispatchEvent(new CustomEvent('resq:voice-end'));
          this.currentAudio = null;
          resolve();
        });
      } catch (err) {
        console.error('[VoicePersonality] Error playing audio buffer:', err);
        window.dispatchEvent(new CustomEvent('resq:voice-end'));
        resolve();
      }
    });
  }

  speakFallback(text, options = {}) {
    this.currentSpokenText = text;
    window.dispatchEvent(new CustomEvent('resq:voice-start'));
    this.cancel();

    let safetyTimeout = null;
    const clearSafety = () => {
      if (safetyTimeout) {
        clearTimeout(safetyTimeout);
        safetyTimeout = null;
      }
    };

    safetyTimeout = setTimeout(() => {
      console.warn('[VoicePersonality] Fallback speech synthesis timeout reached — releasing state.');
      if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch {}
      }
      window.dispatchEvent(new CustomEvent('resq:voice-end'));
      if (options.onEnd) {
        try { options.onEnd(); } catch {}
      }
    }, Math.max(8000, text.length * 120));

    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch {}

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        clearSafety();
        window.dispatchEvent(new CustomEvent('resq:voice-end'));
        if (options.onEnd) {
          try { options.onEnd(); } catch (_e) {}
        }
      };

      utterance.onerror = () => {
        clearSafety();
        window.dispatchEvent(new CustomEvent('resq:voice-end'));
        if (options.onEnd) {
          try { options.onEnd(); } catch (_e) {}
        }
      };

      window.speechSynthesis.speak(utterance);
    } else {
      clearSafety();
      window.dispatchEvent(new CustomEvent('resq:voice-end'));
      if (options.onEnd) {
        try { options.onEnd(); } catch (_e) {}
      }
    }
  }

  cancel() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (_err) {}
      this.currentAudio = null;
      window.dispatchEvent(new CustomEvent('resq:voice-end'));
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_err) {}
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
  wake_acknowledged: "Yes? I'm listening.",
  thinking: "Let me check on that for you.",
  task_created: "Done. I've added that to your task list.",
  event_scheduled: "Scheduled. You're all set for {time}.",
  conflict_found: "There's a conflict at {time}. Would you prefer {alt}?",
  priority_updated: "Task priorities have been updated.",
  out_of_scope: "I can't {action}, but I'm built to help you with tasks, reminders, alarms, your calendar, habits, goals, and staying focused. What would you like to tackle?",
  no_free_time: "Your schedule looks fully blocked today. Want me to find time tomorrow instead?",
  good_morning: "Good morning, {name}. You have {count} tasks today. Your first focus block starts at {time}.",
};

// Varied personality response pools - randomly selected to avoid repetition
export const RESPONSE_VARIANTS = {
  wake: [
    "Yes? I'm listening.",
    "Hey! What's up?",
    "I'm here, go ahead.",
    "Right here, shoot.",
    "Yep, what do you need?",
  ],
  task_created: [
    "On it! Added to your task list.",
    "Done! Consider it added.",
    "Got it, task's on the list.",
    "Yep, added that for you.",
    "Done. Your future self will thank you.",
    "Added! Now go crush it.",
  ],
  event_scheduled: [
    "Locked in! Calendar's updated.",
    "Booked it. You're all set.",
    "Scheduled! You're good to go.",
    "Done, it's on your calendar.",
    "Added to the calendar. No excuses now!",
  ],
  habit_created: [
    "New habit added! Consistency is key.",
    "Habit's set. Let's build that streak!",
    "Got it, added to your habits.",
    "Done! One habit closer to greatness.",
  ],
  goal_created: [
    "Goal locked in! Let's make it happen.",
    "Added to your goals. Big things ahead!",
    "Goal set. You've got this.",
    "Noted! Now let's crush that goal.",
  ],
  summary: [
    "Here's your day...",
    "So here's what you've got...",
    "Let me break it down for you...",
    "Alright, here's the rundown...",
  ],
  encouragement: [
    "You're on a roll!",
    "That's the spirit!",
    "Look at you being productive!",
    "Nice, keep it up!",
  ],
  funny: [
    "Done! I do the boring work so you don't have to.",
    "Added! See, we make a great team.",
    "Handled. You're welcome.",
    "Easy. Next?",
  ],
  error: [
    "Hmm, something went off. Try again?",
    "That didn't quite work. One more time?",
    "Oops, had a hiccup there.",
  ]
};

// Returns a random response from a given pool key
export const pickVariant = (poolKey) => {
  const pool = RESPONSE_VARIANTS[poolKey];
  if (!pool || pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
};

const voicePersonalityInstance = new VoicePersonality();
export default voicePersonalityInstance;
