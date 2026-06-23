class VoicePersonality {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.selectedVoice = null;
    
    if (this.synth) {
      this.selectedVoice = this.selectVoice();
      
      // Re-evaluate when voices change (necessary for Chrome/Edge asynchronous loading)
      if (this.synth.addEventListener) {
        this.synth.addEventListener('voiceschanged', () => {
          this.selectedVoice = this.selectVoice();
        });
      } else {
        this.synth.onvoiceschanged = () => {
          this.selectedVoice = this.selectVoice();
        };
      }
    }
  }

  selectVoice() {
    if (!this.synth) return null;
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return null;

    // Priority Order
    // 1. "Google UK English Female"
    // 2. "Microsoft Sonia Online (Natural)"
    // 3. "Samantha" (macOS)
    // 4. "Karen" (macOS)
    // 5. Any voice where lang starts with 'en' and name includes 'Female'
    // 6. First English voice available
    const priorities = [
      v => v.name === 'Google UK English Female',
      v => v.name === 'Microsoft Sonia Online (Natural)',
      v => v.name === 'Samantha',
      v => v.name === 'Karen',
      v => v.lang.toLowerCase().startsWith('en') && v.name.toLowerCase().includes('female'),
      v => v.lang.toLowerCase().startsWith('en')
    ];

    for (const matchFn of priorities) {
      const found = voices.find(matchFn);
      if (found) return found;
    }

    return voices[0] || null;
  }

  speak(text, options = {}) {
    return new Promise((resolve) => {
      if (!this.synth) {
        resolve();
        return;
      }

      // Cancel any ongoing speech first (interrupt current speech immediately if priority is true or by default)
      this.synth.cancel();

      // 120ms delay before speaking (feels more natural, not instant)
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Voice parameters
        utterance.rate = this.rate !== undefined ? this.rate : 0.92;   // slightly slower than default — clear and unhurried
        utterance.pitch = this.pitch !== undefined ? this.pitch : 1.08;  // slightly above neutral — warm, bright
        utterance.volume = 0.95;

        // Select voice
        let voice = this.selectedVoice || this.selectVoice();
        if (!voice) {
          // Chrome bug fallback - try one more time
          voice = this.selectVoice();
        }
        
        if (voice) {
          utterance.voice = voice;
        }

        // Handle Chrome bug: re-select voice if utterance.voice is null on speak
        if (!utterance.voice) {
          const reSelected = this.selectVoice();
          if (reSelected) {
            utterance.voice = reSelected;
          }
        }

        const handleEnd = () => {
          if (options.onEnd) {
            try {
              options.onEnd();
            } catch (e) {
              console.error('[VoicePersonality] Error in onEnd callback:', e);
            }
          }
          resolve();
        };

        utterance.onend = handleEnd;
        utterance.onerror = (e) => {
          console.warn('[VoicePersonality] Speech synthesis error:', e);
          handleEnd();
        };

        this.synth.speak(utterance);
      }, 120);
    });
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
