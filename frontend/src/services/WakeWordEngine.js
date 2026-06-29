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
    this.idleConversationTimer = null;
    this.isAiSpeaking = false;
    this.isProcessingBackend = false;

    this.handleVoiceStart = () => {
      this.isAiSpeaking = true;
      this.isProcessingBackend = false;
      this.latestTranscript = '';
      if (this.commandSilenceTimer) {
        clearTimeout(this.commandSilenceTimer);
        this.commandSilenceTimer = null;
      }
      
      // Zero-Echo Implementation: Aggressively shut off the mic while speaking
      this.stopCommandListening();
    };
    this.handleVoiceEnd = () => {
      this.isAiSpeaking = false;
      // Brief cooldown before opening the mic again to discard any hardware audio tail
      this.postSpeechCooldown = true;
      if (this.postSpeechCooldownTimer) clearTimeout(this.postSpeechCooldownTimer);
      this.postSpeechCooldownTimer = setTimeout(() => {
        this.postSpeechCooldown = false;
        this.latestTranscript = '';
        // If still in command mode, reopen the mic instantly
        if (this.isWoken) {
          this.startCommandListening();
        }
      }, 300);
      this.resetIdleTimer();
    };
    this.handleVoiceResponseReceived = () => { this.isProcessingBackend = false; this.resetIdleTimer(); };
    this.handleNotificationsBlock = (e) => {
      this.isSuspended = e.detail?.blocked ?? false;
      if (this.isSuspended) {
        this.stopBackgroundListening();
        this.stopCommandListening();
      } else {
        this.resetToIdle();
      }
    };
    
    window.addEventListener('resq:voice-start', this.handleVoiceStart);
    window.addEventListener('resq:voice-end', this.handleVoiceEnd);
    window.addEventListener('resq:voice-response-received', this.handleVoiceResponseReceived);
    window.addEventListener('resq:notifications-block', this.handleNotificationsBlock);

    // Wake words for fuzzy matching (excluding dangerous substrings like 'he rescue' or 'a resq')
    this.wakeWords = ["rescue", "resq", "hey resq", "hey rescue", "hey res q", "hey resk", "hey risq", "hey risk", "hey wresq", "hey raceq", "hey race q", "hey req", "hey rec", "hey rex", "hey rack", "hair rescue", "air rescue", "okay resq", "ok resq", "hey risk you", "ok rescue", "hey ask you", "hey rest cue"];

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

    // Check if voice AI limit was already reached (only for non-premium users)
    const isPremium = user.isPremiumActive || user.voiceAI?.monthlyLimit === -1;
    if (!isPremium && user.voiceAI && !user.voiceAI.enabled && user.voiceAI.disabledReason === 'limit_reached') {
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

  /**
   * Re-sync limit state after subscription changes (e.g. after buying Premium).
   * Call this after refreshSubscription() resolves with a fresh user object.
   */
  refreshState(user) {
    if (!user) return;
    console.log('[WakeWordEngine] Refreshing state for user plan:', user.plan, 'isPremiumActive:', user.isPremiumActive);
    const isPremium = user.isPremiumActive || user.voiceAI?.monthlyLimit === -1;
    if (isPremium) {
      // Unlock the engine
      this.limitReached = false;
      // Dispatch unlocked orb state
      window.dispatchEvent(new CustomEvent('resq:orb_state', { detail: { state: 'idle' } }));
      console.log('[WakeWordEngine] Premium detected — voice AI limits unlocked.');
    } else if (user.voiceAI && !user.voiceAI.enabled && user.voiceAI.disabledReason === 'limit_reached') {
      this.limitReached = true;
      window.dispatchEvent(new CustomEvent('resq:orb_state', { detail: { state: 'locked', reason: 'limit_reached' } }));
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
      } catch { /* ignore */ }
      this.recognition = null;
    }

    if (this.commandRecognition) {
      this.commandRecognition.onend = null;
      this.commandRecognition.onerror = null;
      try {
        this.commandRecognition.abort();
      } catch { /* ignore */ }
      this.commandRecognition = null;
    }

    // Stop all speech synthesis too
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch { /* ignore */ }
    }

    this.isListening = false;
    this.isWoken = false;
    this.awaitingClarification = false;

    window.removeEventListener('resq:voice-start', this.handleVoiceStart);
    window.removeEventListener('resq:voice-end', this.handleVoiceEnd);
  }

  pauseForLimitReached() {
    console.warn('[WakeWordEngine] monthly command limit reached. Pausing engine.');
    this.limitReached = true;
    this.stopBackgroundListening();
    
    // Change orb to gray, show lock icon
    window.dispatchEvent(new CustomEvent('resq:orb_state', { detail: { state: 'locked', reason: 'limit_reached' } }));
    
    // Trigger the Premium Upgrade Modal in GlobalVoiceAssistant
    window.dispatchEvent(new CustomEvent('resq:limit_reached', { detail: { used: 30, limit: 30 } }));
    
    // Voice notification
    voicePersonality.speak("Your monthly voice command limit has been reached. Please upgrade to premium to continue.");
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

    if (this.isListening || this.isWoken || !this.isTabVisible || this.isSuspended) return;
    
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    try {
      this.isListening = true; // Set synchronously immediately to prevent concurrent start triggers
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 5; // Enable up to 5 alternative transcriptions for better accuracy

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
      } catch { /* ignore */ }
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
    this.resetIdleTimer();
  }

  triggerProactiveWake() {
    this.isWoken = true;
    this.stopBackgroundListening();
    
    // Start capturing user command
    this.startCommandListening();
    this.resetIdleTimer();
  }

  resetIdleTimer() {
    if (this.idleConversationTimer) clearTimeout(this.idleConversationTimer);
    this.idleConversationTimer = setTimeout(() => {
      if (this.isWoken && !this.isAiSpeaking && !this.isProcessingBackend) {
        console.log('[WakeWordEngine] 30 seconds idle timeout reached. Going to sleep.');
        
        if (this.awaitingClarification) {
           this.exitClarificationMode();
        }

        window.dispatchEvent(new CustomEvent('resq:close'));
        this.resetToIdle();
      }
    }, 60000); // Increased from 30s to 60s
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
    if (this.isSuspended) return;

    if (this.commandSilenceTimer) clearTimeout(this.commandSilenceTimer);
    this.latestTranscript = '';

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        this.showCompatibilityToast();
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('[WakeWordEngine] Command listener active in conversational mode...');
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        const latest = finalTranscript || interimTranscript;
        const currentTranscript = latest.trim().toLowerCase();

        // 1. Interruptibility / Barge-In and Echo Cancellation
        if (this.isAiSpeaking) {
          const spokenText = (voicePersonality.currentSpokenText || '').toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
          const cleanedTranscript = currentTranscript.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

          // Detect if it is echo/self-hearing (high overlap or substring of AI response)
          const isEcho = cleanedTranscript.length > 0 && (
            spokenText.includes(cleanedTranscript) || 
            cleanedTranscript.split(' ').every(word => word.length <= 2 || spokenText.includes(word))
          );

          if (isEcho) {
            console.log('[WakeWordEngine] Echo/Self-hearing detected — ignoring.');
            return;
          }

          // Real user interrupt - make it more robust against random background noise
          const words = cleanedTranscript.split(' ').filter(w => w.length > 0);
          if (words.length >= 3 || (words.length === 2 && cleanedTranscript.length > 8) || cleanedTranscript.length > 15) {
            console.log('[WakeWordEngine] User barge-in! Stopping AI speech.');
            voicePersonality.cancel();
            this.isAiSpeaking = false;
            this.postSpeechCooldown = false;
          } else {
            console.log('[WakeWordEngine] Ignoring short noise during speech:', cleanedTranscript);
            return; // Ignore tiny noises/clicks
          }
        }

        // 2. Discard if AI is speaking or in post-speech cooldown
        if (this.isAiSpeaking || this.postSpeechCooldown) {
          return;
        }

        this.latestTranscript = latest;
        
        if (interimTranscript) {
          window.dispatchEvent(new CustomEvent('resq:interim-transcript', { detail: { transcript: interimTranscript } }));
        }

        this.resetIdleTimer();

        if (this.commandSilenceTimer) clearTimeout(this.commandSilenceTimer);

        if (latest.trim()) {
          // Snappier conversation timeouts (like ChatGPT)
          const wordCount = latest.trim().split(/\s+/).length;
          const silenceMs = wordCount <= 3 ? 800 : wordCount <= 8 ? 1200 : 1500;
          
          this.commandSilenceTimer = setTimeout(() => {
            if (this.isAiSpeaking || this.postSpeechCooldown) return;
            console.log(`[WakeWordEngine] ${silenceMs}ms natural pause detected, sending turn to backend.`);
            if (this.latestTranscript.trim()) {
              const lowerTranscript = this.latestTranscript.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
              if (lowerTranscript === 'bye' || lowerTranscript === 'okay bye' || lowerTranscript === 'goodbye' || lowerTranscript === 'bye bye') {
                console.log('[WakeWordEngine] User said bye, closing assistant.');
                window.dispatchEvent(new CustomEvent('resq:close'));
                this.resetToIdle();
                this.latestTranscript = '';
                return;
              }
              this.finalizeConversationTurn(this.latestTranscript);
              this.latestTranscript = '';
            }
          }, silenceMs);
        }
      };

      recognition.onerror = (event) => {
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          console.warn('[WakeWordEngine] Command listener error:', event.error);
        }
      };

      recognition.onend = () => {
        // If we are still woken, restart the recognition to keep the loop open
        if (this.isWoken) {
           setTimeout(() => {
             if (this.isWoken && this.commandRecognition) {
                try { this.commandRecognition.start(); } catch { /* ignore */ }
             }
           }, 200);
        }
      };

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
    if (this.idleConversationTimer) clearTimeout(this.idleConversationTimer);
    if (this.commandRecognition) {
      this.commandRecognition.onend = null;
      try {
        this.commandRecognition.abort();
      } catch { /* ignore */ }
      this.commandRecognition = null;
    }
  }

  finalizeConversationTurn(transcript) {
    const text = transcript.trim();
    if (text) {
      this.isProcessingBackend = true;
      if (this.idleConversationTimer) clearTimeout(this.idleConversationTimer);

      console.log('[WakeWordEngine] Sending conversation turn:', text);
      window.dispatchEvent(new CustomEvent('resq:command', { detail: { transcript: text } }));
    }
  }

  finalizeCommand() {
    // Legacy single-turn fallback
  }

  speak(text) {
    if (!this.isAuthorized) return; // Speak nothing if user is logged out or not authenticated
    voicePersonality.speak(text);
  }

  enterClarificationMode() {
    this.awaitingClarification = true;
    
    // In continuous conversational mode, the idleTimer handles timeouts natively.
    if (!this.isWoken) {
      this.triggerWakeSequence();
    } else {
      this.resetIdleTimer();
    }
  }

  exitClarificationMode() {
    this.awaitingClarification = false;
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
