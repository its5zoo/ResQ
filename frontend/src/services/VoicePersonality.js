class VoicePersonality {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.selectedVoice = null;
    this.voices = [];
    
    if (this.synth) {
      this.voices = this.synth.getVoices();
      this.selectedVoice = this.selectVoice();
      
      const updateVoices = () => {
        this.voices = this.synth.getVoices();
        this.selectedVoice = this.selectVoice();
      };

      if (this.synth.addEventListener) {
        this.synth.addEventListener('voiceschanged', updateVoices);
      } else {
        this.synth.onvoiceschanged = updateVoices;
      }
    }
  }

  selectVoice() {
    if (!this.synth) return null;
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return null;

    // 1. Prioritize Microsoft Edge Online (Natural) Voices - extremely realistic human voice
    const edgeNaturalVoice = voices.find(v => v.name.includes('Online (Natural)') && v.lang.startsWith('en'));
    if (edgeNaturalVoice) return edgeNaturalVoice;

    // 2. Google Cloud High-Quality Voices in Chrome
    const googleUSVoice = voices.find(v => v.name === 'Google US English');
    if (googleUSVoice) return googleUSVoice;

    const googleUKVoice = voices.find(v => v.name === 'Google UK English Female');
    if (googleUKVoice) return googleUKVoice;

    // 3. Apple/MacOS High-Quality Voice
    const samanthaVoice = voices.find(v => v.name === 'Samantha');
    if (samanthaVoice) return samanthaVoice;

    // 4. Windows Local SAPI Clear Offline Voices
    const hazelVoice = voices.find(v => v.name.includes('Microsoft Hazel'));
    if (hazelVoice) return hazelVoice;

    const ziraVoice = voices.find(v => v.name.includes('Microsoft Zira'));
    if (ziraVoice) return ziraVoice;

    // 5. Fallback English Female / English / Default
    return voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
        || voices.find(v => v.lang.startsWith('en'))
        || voices[0]
        || null;
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
        
        // Select voice
        let voice = this.selectedVoice || this.selectVoice();
        if (!voice) {
          // Chrome bug fallback - try one more time
          voice = this.selectVoice();
        }
        
        if (voice) {
          utterance.voice = voice;
        }

        // Voice parameters (Keep premium cloud voices untuned to let them play at natural speed/pitch, tune legacy local robotic voices)
        const isPremiumVoice = voice && (voice.name.includes('Google') || voice.name.includes('Online (Natural)'));
        utterance.rate = this.rate !== undefined ? this.rate : (isPremiumVoice ? 1.0 : 0.95);
        utterance.pitch = this.pitch !== undefined ? this.pitch : (isPremiumVoice ? 1.0 : 1.02);
        utterance.volume = 0.95;

        // Handle Chrome bug: re-select voice if utterance.voice is null on speak
        if (!utterance.voice) {
          const reSelected = this.selectVoice();
          if (reSelected) {
            utterance.voice = reSelected;
          }
        }

        let speakTimeout = null;

        const handleEnd = () => {
          if (speakTimeout) {
            clearTimeout(speakTimeout);
            speakTimeout = null;
          }
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

        // Fallback safety timeout in case the browser SpeechSynthesis gets stuck
        speakTimeout = setTimeout(() => {
          console.warn('[VoicePersonality] Speech synthesis got stuck or timed out. Forcing end event recovery.');
          handleEnd();
        }, Math.max(6000, text.length * 100)); // minimum 6 seconds, or 100ms per character

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
