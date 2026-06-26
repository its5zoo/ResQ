class VoicePersonality {
  constructor() {
    this.currentAudio = null;
  }

  speak(text, options = {}) {
    this.currentSpokenText = text;
    // Fire voice-start IMMEDIATELY so WakeWordEngine mutes the mic right away.
    // This closes the 1-2 second gap while TTS audio is being fetched from the server.
    window.dispatchEvent(new CustomEvent('resq:voice-start'));

    return new Promise((resolve) => {
      // Cancel any ongoing speech first
      this.cancel();

      // 120ms delay before speaking (feels more natural, not instant)
      setTimeout(async () => {
        try {
          const token = localStorage.getItem('token');
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
          window.dispatchEvent(new CustomEvent('resq:voice-end'));
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
