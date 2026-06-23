import voicePersonality from './VoicePersonality.js';

class WakeWordEngine {
  constructor() {
    this.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.speechSupported = !!this.SpeechRecognition;
    this.isListening = false;
    this.isWoken = false;
    this.isAuthorized = false;
    this.userId = null;
    this.limitReached = false;
    this.cooldown = false;
    this.permissionStatus = null;
    this.consecutiveNetworkErrors = 0;
    
    // Recognition instances
    this.recognition = null;
    this.commandRecognition = null;
    
    // State/timers
    this.commandTimeoutTimer = null;
    this.reconnectTimer = null;
    this.latestTranscript = '';
    this.isTabVisible = true;
    this.isInitialized = false;
    this.awaitingClarification = false;
    this.clarificationTimeoutTimer = null;
    this.commandSilenceTimer = null;

    // Wake words for fuzzy matching
    this.wakeWords = ["hey resq", "hey rescue", "hey res q", "hey resk", "hey risq", "a resq", "hey risk", "hey wreck", "hey wresq", "hey raceq", "hey race q", "hey raise key", "hey raise cue", "hey req", "hey rec", "hey rex", "hey reqs", "hey rack", "hair rescue", "hair res", "hair sq", "hair s q", "he rescue", "he resq", "hair is cute", "haris", "harris", "hair is", "is cute", "hey is cute", "he is cute", "here is cute", "harry is", "harry s", "harish"];

    // Bind event handlers
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  get commandModeActive() {
    return this.isWoken;
  }

  set commandModeActive(val) {
    this.isWoken = val;
  }

  initialize(user) {
    console.log('[WakeWordEngine] Initializing voice node for user:', user._id);
    console.log('ResQ Wake Word Engine initialized');
    this.userId = user._id;
    this.isAuthorized = true;

    // Check if voice AI limit was already reached
    if (user.voiceAI && !user.voiceAI.enabled && user.voiceAI.disabledReason === 'limit_reached') {
      this.limitReached = true;
      // Emit locked state
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('resq:orb_state', { detail: { state: 'locked', reason: 'limit_reached' } }));
      }, 100);
    } else {
      this.limitReached = false;
    }
    
    if (!this.isInitialized) {
      this.init();
    } else {
      this.checkPermissionAndStart();
    }
  }

  destroy() {
    console.log('[WakeWordEngine] Destroying voice node and stopping listeners...');
    this.isAuthorized = false;
    this.userId = null;
    this.limitReached = false;
    this.cooldown = false;

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.commandTimeoutTimer) clearTimeout(this.commandTimeoutTimer);
    if (this.commandSilenceTimer) clearTimeout(this.commandSilenceTimer);
    if (this.clarificationTimeoutTimer) clearTimeout(this.clarificationTimeoutTimer);

    if (this.recognition) {
      this.recognition.onend = null;
      this.recognition.onerror = null;
      try {
        this.recognition.abort();
      } catch (e) {}
      this.recognition = null;
    }

    if (this.commandRecognition) {
      this.commandRecognition.onend = null;
      this.commandRecognition.onerror = null;
      try {
        this.commandRecognition.abort();
      } catch (e) {}
      this.commandRecognition = null;
    }

    // Stop all speech synthesis too
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    this.isListening = false;
    this.isWoken = false;
    this.awaitingClarification = false;
  }

  pauseForLimitReached() {
    console.warn('[WakeWordEngine] monthly command limit reached. Pausing engine.');
    this.limitReached = true;
    this.stopBackgroundListening();
    // Change orb to gray, show lock icon
    window.dispatchEvent(new CustomEvent('resq:orb_state', { detail: { state: 'locked', reason: 'limit_reached' } }));
  }

  async checkPermissionAndStart() {
    if (!navigator.permissions || !navigator.permissions.query) {
      console.warn('[WakeWordEngine] Permission Query API unsupported. Starting background listening.');
      this.startBackgroundListening();
      return;
    }

    try {
      this.permissionStatus = await navigator.permissions.query({ name: 'microphone' });
      console.log('[WakeWordEngine] Microphone permission state query:', this.permissionStatus.state);

      if (this.permissionStatus.state === 'granted') {
        this.startBackgroundListening();
      } else {
        console.warn('[WakeWordEngine] Microphone permission is:', this.permissionStatus.state, '- Deferring background listening.');
        
        // Listen for change events
        this.permissionStatus.onchange = () => {
          console.log('[WakeWordEngine] Microphone permission status changed to:', this.permissionStatus.state);
          if (this.permissionStatus.state === 'granted' && this.isAuthorized) {
            this.startBackgroundListening();
          } else {
            this.stopBackgroundListening();
          }
        };
      }
    } catch (err) {
      console.error('[WakeWordEngine] Error checking mic permission:', err);
      this.startBackgroundListening();
    }
  }

  init() {
    if (!this.isAuthorized) {
      console.warn('ResQ: Voice AI blocked — user not authenticated');
      return;
    }
    if (this.isInitialized) {
      if (!this.isListening && !this.isWoken) {
        this.checkPermissionAndStart();
      }
      return;
    }
    this.isInitialized = true;

    if (!this.speechSupported) {
      console.warn('[WakeWordEngine] SpeechRecognition is not supported in this browser.');
      this.showCompatibilityToast();
      return;
    }

    // Bind tab visibility listener
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Coordinate mic permission query and start background listening
    this.checkPermissionAndStart();
  }

  showCompatibilityToast() {
    // Show visual toast on screen
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-6 right-6 z-[99999] px-5 py-3.5 rounded-2xl border border-red-500/30 bg-black/90 text-red-500 backdrop-blur-md shadow-2xl animate-fade-in font-sans text-xs font-bold uppercase';
    toast.innerText = '⚠️ Voice features require Chrome or Edge';
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 5000);
  }

  showNetworkErrorToast() {
    const existing = document.getElementById('resq-network-toast');
    if (existing) return;

    const toast = document.createElement('div');
    toast.id = 'resq-network-toast';
    toast.className = 'fixed bottom-6 right-6 z-[99999] px-5 py-3.5 rounded-2xl border border-amber-500/30 bg-black/90 text-amber-500 backdrop-blur-md shadow-2xl animate-fade-in font-sans text-xs font-bold uppercase';
    toast.innerText = '⚠️ Speech Recognition Offline (Google speech servers blocked by VPN/firewall)';
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 8000);
  }

  async requestMicPermissionGracefully() {
    try {
      // Prompt native permission dialog
      await navigator.mediaDevices.getUserMedia({ audio: true });
      this.startBackgroundListening();
    } catch (err) {
      console.warn('[WakeWordEngine] Microphone access denied:', err);
      // Show graceful permission prompt
      const promptBox = document.createElement('div');
      promptBox.className = 'fixed inset-0 bg-black/85 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 font-sans';
      promptBox.innerHTML = `
        <div class="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 w-full max-w-sm text-center space-y-4">
          <h4 class="text-white text-lg font-black uppercase tracking-tight">Enable Mic Access</h4>
          <p class="text-white/60 text-xs leading-relaxed">ResQ Voice Assistant requires microphone permission to listen for wake words. Please enable it in your browser settings.</p>
          <button id="mic-grant-btn" class="w-full py-2.5 bg-[#E5B842] hover:bg-[#FFF2CC] text-black rounded-xl text-xs font-bold uppercase tracking-wider transition-all">Grant Mic Access</button>
        </div>
      `;
      document.body.appendChild(promptBox);
      
      const grantBtn = promptBox.querySelector('#mic-grant-btn');
      grantBtn.onclick = async () => {
        promptBox.remove();
        await this.requestMicPermissionGracefully();
      };
    }
  }

  startListening() {
    if (this.limitReached) return;
    if (!this.isAuthorized) {
      console.warn('ResQ: Voice AI blocked — user not authenticated');
      return;
    }
    this.startBackgroundListening();
  }

  startBackgroundListening() {
    if (this.limitReached) return;
    if (!this.isAuthorized) {
      console.warn('ResQ: Voice AI blocked — user not authenticated');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.showCompatibilityToast();
      return;
    }

    if (this.isListening || this.isWoken || !this.isTabVisible) return;
    
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    try {
      this.isListening = true; // Set synchronously immediately to prevent concurrent start triggers
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 5; // Enable up to 5 alternative transcriptions

      recognition.onstart = () => {
        console.log('[WakeWordEngine] Always-listening background word listener active...');
      };

      recognition.onresult = (event) => {
        this.consecutiveNetworkErrors = 0; // Reset network error count on successful result
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          for (let j = 0; j < result.length; j++) {
            const transcript = result[j].transcript.toLowerCase().trim();
            console.log(`[WakeWordEngine] Background heard (alt ${j}):`, transcript);
            const detected = this.wakeWords.some(w => transcript.includes(w));
            if (detected && !this.isWoken && !this.cooldown) {
              this.onWakeWordDetected();
              return; // Stop processing further alternatives once wake sequence triggers
            }
          }
        }
      };

      recognition.onerror = (event) => {
        console.warn('[WakeWordEngine] Background listener error:', event.error);
        if (event.error === 'aborted') {
          this.isListening = false; // Prevent restarting on the same instance
          // Schedule a clean restart after a short delay
          if (this.isAuthorized && !this.isWoken && !this.limitReached) {
            if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
            this.reconnectTimer = setTimeout(() => {
              this.startBackgroundListening();
            }, 1000);
          }
        }
        if (event.error === 'network') {
          this.consecutiveNetworkErrors++;
          if (this.consecutiveNetworkErrors >= 3) {
            console.error('[WakeWordEngine] Speech recognition unreachable. Google speech servers might be blocked by your network/firewall.');
            this.showNetworkErrorToast();
            this.isListening = false; // Stop restarting to prevent infinite loop
          }
        }
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          this.isListening = false;
        }
      };

      recognition.onend = () => {
        if (this.isListening && this.isAuthorized && !this.limitReached) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (err) {
              console.warn('[WakeWordEngine] Error restarting background listener:', err);
              // Fallback: reset and schedule fresh restart
              this.isListening = false;
              this.recognition = null;
              if (this.isAuthorized && !this.isWoken && !this.limitReached) {
                this.startBackgroundListening();
              }
            }
          }, 300);
        }
      };

      this.recognition = recognition;
      recognition.start();
    } catch (e) {
      this.isListening = false;
      this.recognition = null;
      console.error('[WakeWordEngine] Failed to start background listener:', e);
    }
  }

  stopBackgroundListening() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.isListening = false;
    if (this.recognition) {
      this.recognition.onend = null;
      this.recognition.onerror = null; // Clean up error handler to prevent abort restarts
      try {
        this.recognition.abort(); // Use abort for immediate stop
      } catch (e) {}
      this.recognition = null;
    }
  }

  onWakeWordDetected() {
    console.log('[WakeWordEngine] Wake word detected, triggering wake sequence.');
    this.cooldown = true;
    setTimeout(() => {
      this.cooldown = false;
    }, 2000);
    this.triggerWakeSequence();
  }

  triggerWakeSequence() {
    this.isWoken = true;
    this.stopBackgroundListening();
    this.playWakeChime();

    // Emit global event to update UI to Listening... state
    window.dispatchEvent(new CustomEvent('resq:awakened'));

    // Start capturing user command
    this.startCommandListening();
  }

  playWakeChime() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);

      // Play 880Hz for 80ms
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.start(ctx.currentTime);

      // Play 1046Hz for 120ms
      osc.frequency.setValueAtTime(1046, ctx.currentTime + 0.080);

      // Fade out
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime + 0.080);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.200);

      osc.stop(ctx.currentTime + 0.200);
    } catch (e) {
      console.warn('[WakeWordEngine] Failed to play chime:', e);
    }
  }

  startCommandListening() {
    if (!this.isAuthorized) {
      console.warn('ResQ: Voice AI blocked — user not authenticated');
      return;
    }

    if (this.commandTimeoutTimer) clearTimeout(this.commandTimeoutTimer);
    if (this.commandSilenceTimer) clearTimeout(this.commandSilenceTimer);
    this.latestTranscript = '';

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        this.showCompatibilityToast();
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('[WakeWordEngine] Command listener active...');
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          interimTranscript += event.results[i][0].transcript;
        }
        this.latestTranscript = interimTranscript;
        console.log('[WakeWordEngine] Command interim:', interimTranscript);
        window.dispatchEvent(new CustomEvent('resq:interim-transcript', { detail: { transcript: interimTranscript } }));

        if (this.commandSilenceTimer) clearTimeout(this.commandSilenceTimer);

        // Quick finalization after 800ms of silence when a final segment is detected
        const lastResult = event.results[event.results.length - 1];
        if (lastResult && lastResult.isFinal) {
          this.commandSilenceTimer = setTimeout(() => {
            console.log('[WakeWordEngine] 800ms speech silence detected, stopping command recognition.');
            if (this.commandRecognition) {
              try {
                this.commandRecognition.stop();
              } catch (e) {}
            }
          }, 800);
        }
      };

      recognition.onerror = (event) => {
        console.warn('[WakeWordEngine] Command listener error:', event.error);
      };

      recognition.onend = () => {
        this.finalizeCommand();
      };

      // 8 seconds absolute command timeout
      this.commandTimeoutTimer = setTimeout(() => {
        console.log('[WakeWordEngine] 8 seconds command timeout reached');
        if (this.commandRecognition) {
          try {
            this.commandRecognition.stop();
          } catch (e) {}
        }
      }, 8000);

      this.commandRecognition = recognition;
      recognition.start();
    } catch (e) {
      console.error('[WakeWordEngine] Failed to start command listener:', e);
      this.resetToIdle();
    }
  }

  stopCommandListening() {
    if (this.commandTimeoutTimer) clearTimeout(this.commandTimeoutTimer);
    if (this.commandSilenceTimer) clearTimeout(this.commandSilenceTimer);
    if (this.commandRecognition) {
      this.commandRecognition.onend = null;
      try {
        this.commandRecognition.stop();
      } catch (e) {}
      this.commandRecognition = null;
    }
  }

  finalizeCommand() {
    this.stopCommandListening();
    
    const transcript = this.latestTranscript.trim();
    
    if (this.awaitingClarification) {
      this.awaitingClarification = false;
      if (this.clarificationTimeoutTimer) {
        clearTimeout(this.clarificationTimeoutTimer);
        this.clarificationTimeoutTimer = null;
      }
    }

    this.isWoken = false;

    if (transcript) {
      console.log('[WakeWordEngine] Finalized command:', transcript);
      window.dispatchEvent(new CustomEvent('resq:command', { detail: { transcript } }));
      this.startBackgroundListening();
    } else {
      console.log('[WakeWordEngine] No speech detected in 8 seconds');
      window.dispatchEvent(new CustomEvent('resq:close'));
      this.speak("I'm here whenever you need me.");
    }
  }

  speak(text) {
    if (!this.isAuthorized) return; // Speak nothing if user is logged out or not authenticated
    voicePersonality.speak(text);
  }

  enterClarificationMode(onTimeout) {
    if (this.clarificationTimeoutTimer) {
      clearTimeout(this.clarificationTimeoutTimer);
    }
    
    this.awaitingClarification = true;
    this.isWoken = true;
    
    // Dispatch awakened event to visual console
    window.dispatchEvent(new CustomEvent('resq:awakened'));

    this.stopBackgroundListening();
    this.startCommandListening();

    // 15-second clarification window
    this.clarificationTimeoutTimer = setTimeout(() => {
      if (this.awaitingClarification) {
        console.log('[WakeWordEngine] Clarification window timed out');
        this.exitClarificationMode();
        if (typeof onTimeout === 'function') {
          onTimeout();
        }
      }
    }, 15000);
  }

  exitClarificationMode() {
    this.awaitingClarification = false;
    if (this.clarificationTimeoutTimer) {
      clearTimeout(this.clarificationTimeoutTimer);
      this.clarificationTimeoutTimer = null;
    }
    this.resetToIdle();
  }

  resetToIdle() {
    this.stopCommandListening();
    this.isWoken = false;
    this.startBackgroundListening();
  }

  handleVisibilityChange() {
    if (document.hidden) {
      console.log('[WakeWordEngine] Tab hidden. Pausing recognition.');
      this.isTabVisible = false;
      this.stopBackgroundListening();
      this.stopCommandListening();
    } else {
      console.log('[WakeWordEngine] Tab visible. Resuming recognition.');
      this.isTabVisible = true;
      this.resetToIdle();
    }
  }

  // Backward compatible method aliases
  startBackgroundListener() {
    this.startBackgroundListening();
  }

  stopBackgroundListener() {
    this.stopBackgroundListening();
  }

  startCommandListener() {
    this.startCommandListening();
  }

  stopCommandListener() {
    this.stopCommandListening();
  }
}

export const wakeWordEngine = new WakeWordEngine();
