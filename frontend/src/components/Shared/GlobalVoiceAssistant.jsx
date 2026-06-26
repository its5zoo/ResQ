import { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, X, Sparkles, AlertTriangle, CalendarDays, RefreshCw,
  Flame, CheckSquare, Trash2,
  Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { voice, settings, auth } from '../../services/api.js';
import { socket } from '../../services/socket.js';
import { wakeWordEngine } from '../../services/WakeWordEngine.js';
import voicePersonality, { INSTANT_RESPONSES } from '../../services/VoicePersonality.js';
import { VoiceActionExecutor } from '../../services/VoiceActionExecutor.js';
import FocusSessionOverlay from './FocusSessionOverlay.jsx';
import './GlobalVoiceAssistant.css';

// State metadata lookup for executed intent confirmation
const getIntentActionMeta = (intent) => {
  switch (intent) {
    case 'create_task':
      return { label: 'Task Created', icon: CheckSquare, color: 'text-emerald-400' };
    case 'complete_task':
      return { label: 'Task Completed', icon: CheckSquare, color: 'text-emerald-400' };
    case 'delete_task':
      return { label: 'Task Deleted', icon: Trash2, color: 'text-red-400' };
    case 'schedule_event':
    case 'reschedule_event':
      return { label: 'Calendar Synced', icon: CalendarDays, color: 'text-blue-400' };
    case 'cancel_event':
      return { label: 'Event Cancelled', icon: CalendarDays, color: 'text-red-400' };
    case 'start_focus_session':
      return { label: 'Focus Mode Engaged', icon: Flame, color: 'text-amber-500' };
    case 'stop_focus_session':
      return { label: 'Focus Mode Disengaged', icon: Flame, color: 'text-gray-400' };
    case 'get_free_time':
      return { label: 'Checked Availability', icon: RefreshCw, color: 'text-cyan-400' };
    case 'get_daily_summary':
      return { label: 'Briefing Loaded', icon: Sparkles, color: 'text-purple-400' };
    default:
      return null;
  }
};

function WaveVisualizer({ micState }) {
  if (micState === 'idle') return null;
  const isListening = micState === 'listening';
  if (!isListening) return null;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
      <div className="absolute w-32 h-32 rounded-full border border-[#00E5FF]/40 animate-ping" style={{ animationDuration: '3s' }}></div>
      <div className="absolute w-40 h-40 rounded-full border border-[#00E5FF]/20 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }}></div>
      <div className="absolute w-48 h-48 rounded-full bg-[#00E5FF]/5 animate-pulse"></div>
    </div>
  );
}

// Sub-component for the hover/state tooltip label
function StateLabel({ orbState }) {
  let labelText;
  switch (orbState) {
    case 'idle':
      labelText = 'Hey ResQ';
      break;
    case 'listening':
      labelText = 'Listening...';
      break;
    case 'processing':
      labelText = 'Thinking...';
      break;
    case 'speaking':
      labelText = 'Speaking...';
      break;
    case 'alert':
      labelText = 'Alert!';
      break;
    case 'focus_active':
      labelText = 'Focus Shield';
      break;
    case 'disabled':
      labelText = 'Voice AI Off';
      break;
    default:
      labelText = '';
  }

  return (
    <span className={`absolute right-16 top-1/2 -translate-y-1/2 bg-[#09090b]/90 backdrop-blur-md border border-white/10 px-3 py-1 rounded-lg text-sm font-tech font-bold uppercase tracking-wider text-white whitespace-nowrap shadow-lg transition-all duration-300 pointer-events-none ${
      orbState !== 'idle' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'
    }`}>
      {labelText}
    </span>
  );
}

export default function GlobalVoiceAssistant({ navigate: propNavigate, setCurrentTab }) {
  const routerNavigate = useNavigate();
  const navigate = propNavigate || routerNavigate;
  const [isWoken, setIsWoken] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('How can I help you today? Try saying "Hey ResQ" or click the mic button.');
  const [speechSupported] = useState(!!(window.SpeechRecognition || window.webkitSpeechRecognition));
  const [micState, setMicState] = useState('idle');
  const [choices, setChoices] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [conversationThread, setConversationThread] = useState([]); // [{role:'user'|'ai', text:string}]
  const threadEndRef = useRef(null);

  // Proactive Alerts State
  const [proactivePulseType, setProactivePulseType] = useState(null); // 'meeting' | 'deadline' | 'focus' | null
  const [pendingDeadlineTaskId, setPendingDeadlineTaskId] = useState(null);
  const [awaitingIdleFocusConfirmation, setAwaitingIdleFocusConfirmation] = useState(false);

  // User Profile Name State
  const [userContextName, setUserContextName] = useState('User');

  // Focus Session State
  const [focusActive, setFocusActive] = useState(false);
  const [focusTask, setFocusTask] = useState('Deep Work Session');
  const [focusDuration, setFocusDuration] = useState(25);

  // Microphone Permission States
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [aiVoiceEnabled, setAiVoiceEnabled] = useState(true);

  // Gating & Monthly Limits States
  const [isLocked, setIsLocked] = useState(false);
  const [usageStats, setUsageStats] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  
  const executorRef = useRef(null);
  if (!executorRef.current) {
    executorRef.current = new VoiceActionExecutor(
      (target) => {
        if (setCurrentTab) {
          setCurrentTab(target);
        }
        navigate(`/dashboard?tab=${target}`);
      },
      (text) => speakBack(text)
    );
  }

  // Keep executor callbacks fresh on every render
  if (executorRef.current) {
    executorRef.current.navigationCallback = (target) => {
      if (setCurrentTab) {
        setCurrentTab(target);
      }
      navigate(`/dashboard?tab=${target}`);
    };
    executorRef.current.speakCallback = (text) => speakBack(text);
  }

  // Check Microphone Permission status on mount
  useEffect(() => {
    const checkMicPermissionStatus = async () => {
      if (!navigator.permissions || !navigator.permissions.query) {
        console.warn('[GlobalVoiceAssistant] Permissions API not supported.');
        wakeWordEngine.init();
        return;
      }

      try {
        const result = await navigator.permissions.query({ name: 'microphone' });
        console.log('[GlobalVoiceAssistant] Microphone permission status:', result.state);
        
        const handleStatusChange = () => {
          console.log('[GlobalVoiceAssistant] Microphone permission changed to:', result.state);
          if (result.state === 'granted') {
            setPermissionDenied(false);
            setShowPermissionModal(false);
            wakeWordEngine.init();
          } else if (result.state === 'denied') {
            const hasSeen = localStorage.getItem('resq:mic-denied-seen');
            setPermissionDenied(!hasSeen);
            setShowPermissionModal(false);
          } else if (result.state === 'prompt') {
            setPermissionDenied(false);
            setShowPermissionModal(true);
          }
        };

        result.onchange = handleStatusChange;
        handleStatusChange();
      } catch (err) {
        console.warn('[GlobalVoiceAssistant] Error querying mic permissions:', err);
        wakeWordEngine.init();
      }
    };

    checkMicPermissionStatus();
  }, []);

  const handleGrantPermission = async () => {
    localStorage.setItem('resq:mic-prompt-seen', 'true');
    setShowPermissionModal(false);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionDenied(false);
      console.log('[GlobalVoiceAssistant] Mic permission granted successfully.');
      wakeWordEngine.init();
    } catch (err) {
      console.warn('[GlobalVoiceAssistant] Microphone permission request denied:', err);
      setPermissionDenied(true);
    }
  };

  const isWokenRef = useRef(isWoken);
  const focusActiveRef = useRef(focusActive);
  const focusTaskRef = useRef(focusTask);

  const pendingDeadlineTaskIdRef = useRef(pendingDeadlineTaskId);
  const awaitingIdleFocusConfirmationRef = useRef(awaitingIdleFocusConfirmation);
  const lastInteractionTimeRef = useRef(Date.now());
  const suggestedFocusRef = useRef(false);

  useEffect(() => { isWokenRef.current = isWoken; }, [isWoken]);
  useEffect(() => { focusActiveRef.current = focusActive; }, [focusActive]);
  useEffect(() => { focusTaskRef.current = focusTask; }, [focusTask]);

  useEffect(() => { pendingDeadlineTaskIdRef.current = pendingDeadlineTaskId; }, [pendingDeadlineTaskId]);
  useEffect(() => { awaitingIdleFocusConfirmationRef.current = awaitingIdleFocusConfirmation; }, [awaitingIdleFocusConfirmation]);

  // Fetch user profile and usage stats on mount
  useEffect(() => {
    const fetchUserAndUsage = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await auth.getMe();
          if (userData) {
            if (userData.name) {
              setUserContextName(userData.name);
            }
            
            // Sync isLocked with user's voiceAI properties
            if (userData.voiceAI) {
              const { enabled, monthlyCommandsUsed, monthlyLimit, disabledReason, voiceSpeed, voicePitch } = userData.voiceAI;
              const limitHit = !enabled && disabledReason === 'limit_reached';
              setIsLocked(limitHit);
              if (limitHit) {
                wakeWordEngine.pauseForLimitReached();
              } else {
                wakeWordEngine.limitReached = false;
              }
              
              if (voiceSpeed !== undefined) voicePersonality.rate = voiceSpeed;
              if (voicePitch !== undefined) voicePersonality.pitch = voicePitch;
              
              setUsageStats({
                enabled,
                used: monthlyCommandsUsed,
                limit: monthlyLimit,
                remaining: Math.max(0, monthlyLimit - monthlyCommandsUsed),
                plan: userData.plan || 'free',
                disabledReason
              });
            }
            
            if (userData.aiVoiceEnabled !== undefined) {
              setAiVoiceEnabled(userData.aiVoiceEnabled);
              if (!userData.aiVoiceEnabled) {
                wakeWordEngine.stopBackgroundListener();
                wakeWordEngine.stopCommandListener();
              }
            }
          }

          // Fetch explicit usage endpoint for accuracy
          const usage = await voice.getUsage();
          setUsageStats(usage);
          if (usage.plan === 'free' && usage.used >= usage.limit) {
            setIsLocked(true);
            wakeWordEngine.pauseForLimitReached();
          }
        } catch (e) {
          console.warn('[GlobalVoiceAssistant] Failed to fetch user data or usage stats:', e);
        }
      }
    };
    fetchUserAndUsage();
  }, []);

  // Listen for settings toggles, socket updates, limits, and orb state events
  useEffect(() => {
    const handleVoiceAiToggle = (e) => {
      const { enabled } = e.detail;
      setAiVoiceEnabled(enabled);
      if (!enabled) {
        wakeWordEngine.stopBackgroundListener();
        wakeWordEngine.stopCommandListener();
      } else {
        if (!wakeWordEngine.limitReached) {
          setIsLocked(false);
          wakeWordEngine.init();
        }
      }
    };

    const handleSettingsUpdated = (data) => {
      if (data && data.aiVoiceEnabled !== undefined) {
        setAiVoiceEnabled(data.aiVoiceEnabled);
        if (!data.aiVoiceEnabled) {
          wakeWordEngine.stopBackgroundListener();
          wakeWordEngine.stopCommandListener();
        } else {
          if (!wakeWordEngine.limitReached) {
            setIsLocked(false);
            wakeWordEngine.init();
          }
        }
      }
      if (data && data.voiceAI) {
        const { enabled, monthlyCommandsUsed, monthlyLimit, disabledReason, voiceSpeed, voicePitch } = data.voiceAI;
        const limitHit = !enabled && disabledReason === 'limit_reached';
        setIsLocked(limitHit);
        if (limitHit) {
          wakeWordEngine.pauseForLimitReached();
        } else {
          wakeWordEngine.limitReached = false;
        }
        if (voiceSpeed !== undefined) voicePersonality.rate = voiceSpeed;
        if (voicePitch !== undefined) voicePersonality.pitch = voicePitch;
        setUsageStats({
          enabled,
          used: monthlyCommandsUsed,
          limit: monthlyLimit,
          remaining: Math.max(0, monthlyLimit - monthlyCommandsUsed),
          plan: data.plan || 'free',
          disabledReason
        });
      }
    };

    const handleLimitReached = (e) => {
      setIsLocked(true);
      setShowUpgradeModal(true);
      if (e.detail) {
        setUsageStats(prev => ({
          ...prev,
          used: e.detail.used || 30,
          limit: e.detail.limit || 30,
          remaining: 0
        }));
      }
    };

    const handleOrbState = (e) => {
      const { state, reason } = e.detail;
      if (state === 'locked' && reason === 'limit_reached') {
        setIsLocked(true);
      } else if (state === 'idle') {
        setIsLocked(false);
      }
    };

    window.addEventListener('resq:ai-voice-toggle', handleVoiceAiToggle);
    window.addEventListener('resq:limit_reached', handleLimitReached);
    window.addEventListener('resq:orb_state', handleOrbState);
    socket.on('settings:updated', handleSettingsUpdated);

    return () => {
      window.removeEventListener('resq:ai-voice-toggle', handleVoiceAiToggle);
      window.removeEventListener('resq:limit_reached', handleLimitReached);
      window.removeEventListener('resq:orb_state', handleOrbState);
      socket.off('settings:updated', handleSettingsUpdated);
    };
  }, []);

  // Initialize and listen to custom wakeWordEngine events
  useEffect(() => {
    const handleAwakened = () => {
      setIsWoken(true);
      setMicState('listening');
      setTranscript('');
      setChoices([]);
      setConversationThread([]); // Clear conversation history when newly opened
      const welcome = INSTANT_RESPONSES.wake_acknowledged;
      setAiResponse(welcome);
      // DO NOT speak back "Yes? I'm listening" out loud to allow the user to speak immediately without interruption!
    };

    const handleCommand = (e) => {
      const { transcript } = e.detail;
      setTranscript(transcript);

      // Add user message to conversation thread immediately
      if (transcript && !pendingDeadlineTaskIdRef.current && !awaitingIdleFocusConfirmationRef.current) {
        setConversationThread(prev => [...prev, { role: 'user', text: transcript }].slice(-10));
      }

      // Check if we are awaiting confirmation for a deadline alert
      if (pendingDeadlineTaskIdRef.current) {
        const clean = transcript.toLowerCase();
        const isAffirmative = clean.includes('yes') || clean.includes('yeah') || clean.includes('sure') || clean.includes('ok') || clean.includes('confirm') || clean.includes('do it');
        if (isAffirmative) {
          const taskId = pendingDeadlineTaskIdRef.current;
          setPendingDeadlineTaskId(null);
          socket.emit('resq:create_deadline_focus', { taskId });
          setAiResponse("Focus block scheduled. Let's get to work.");
          speakBack("Absolutely. I've scheduled a focus block for you on the calendar.");
        } else {
          setPendingDeadlineTaskId(null);
          setAiResponse("Understood. Let me know if you need help scheduling it later.");
          speakBack("No problem. Let me know if you change your mind.");
        }
        return;
      }

      // Check if we are awaiting confirmation for idle focus session
      if (awaitingIdleFocusConfirmationRef.current) {
        const clean = transcript.toLowerCase();
        const isAffirmative = clean.includes('yes') || clean.includes('yeah') || clean.includes('sure') || clean.includes('ok') || clean.includes('confirm') || clean.includes('do it');
        if (isAffirmative) {
          setAwaitingIdleFocusConfirmation(false);
          startFocusSession('Deep Work Focus Block', 25);
          setAiResponse("Focus session started. Let's do this.");
          speakBack("Starting your focus session now. Twenty-five minutes on the clock.");
        } else {
          setAwaitingIdleFocusConfirmation(false);
          setAiResponse("No problem. Let me know when you're ready.");
          speakBack("Alright. Let me know whenever you're ready.");
        }
        return;
      }

      setMicState('processing');
      sendTranscriptToBackend(transcript);
    };

    const handleClose = () => {
      closeAssistant();
    };

    const handleStartFocus = (e) => {
      const { task, duration } = e.detail;
      startFocusSession(task, duration);
    };
    const handleStopFocus = () => {
      stopFocusSession();
    };
    const handleClarificationPrompt = (e) => {
      const { question } = e.detail;
      setAiResponse(question);
    };
    const handleNavigation = (e) => {
      const { target } = e.detail;
      navigate(`/dashboard?tab=${target}`);
    };
    const handleDisplayFreeTime = (e) => {
      const { text } = e.detail;
      setAiResponse(text);
    };
    const handleShowSummary = (e) => {
      const { summary } = e.detail;
      setAiResponse(summary);
    };
    const handleInterimTranscript = (e) => {
      const { transcript } = e.detail;
      setTranscript(transcript);
    };

    if (executorRef.current) {
      executorRef.current.onClarificationTimeout = () => {
        const timeoutMsg = "No worries — just say Hey ResQ whenever you're ready.";
        setAiResponse(timeoutMsg);
        voicePersonality.speak(timeoutMsg);
      };
    }

    const handleTextCommand = (e) => {
      const { text } = e.detail;
      if (!text) return;
      setIsWoken(true);
      setMicState('processing');
      sendTranscriptToBackend(text);
    };

    window.addEventListener('resq:awakened', handleAwakened);
    window.addEventListener('resq:command', handleCommand);
    window.addEventListener('resq:send-text-command', handleTextCommand);
    window.addEventListener('resq:close', handleClose);
    window.addEventListener('resq:interim-transcript', handleInterimTranscript);
    window.addEventListener('resq:start-focus', handleStartFocus);
    window.addEventListener('resq:stop-focus', handleStopFocus);
    window.addEventListener('resq:clarification-prompt', handleClarificationPrompt);
    window.addEventListener('resq:navigate', handleNavigation);
    window.addEventListener('resq:display-free-time', handleDisplayFreeTime);
    window.addEventListener('resq:show-summary', handleShowSummary);

    return () => {
      window.removeEventListener('resq:awakened', handleAwakened);
      window.removeEventListener('resq:command', handleCommand);
      window.removeEventListener('resq:send-text-command', handleTextCommand);
      window.removeEventListener('resq:close', handleClose);
      window.removeEventListener('resq:interim-transcript', handleInterimTranscript);
      window.removeEventListener('resq:start-focus', handleStartFocus);
      window.removeEventListener('resq:stop-focus', handleStopFocus);
      window.removeEventListener('resq:clarification-prompt', handleClarificationPrompt);
      window.removeEventListener('resq:navigate', handleNavigation);
      window.removeEventListener('resq:display-free-time', handleDisplayFreeTime);
      window.removeEventListener('resq:show-summary', handleShowSummary);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll conversation thread to bottom when new messages arrive
  useEffect(() => {
    if (threadEndRef.current) {
      threadEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationThread]);

  // Socket listener for voice:response and proactive alerts
  useEffect(() => {
    const handleVoiceResponse = (result) => {
      console.log('[Socket Voice] voice:response received:', result);
      handleVoiceResult(result);
    };

    const handleProactiveAlert = (data) => {
      console.log('[Socket Proactive] Alert received:', data);
      const { message, type, taskId } = data;
      if (!message) return;

      // DND Suppression: Mute all non-critical alerts (like deadline warnings, focus suggestions) during focus sessions
      if (focusActiveRef.current && type !== 'meeting') {
        console.log('[Socket Proactive] DND Active: Suppressing non-critical proactive alert:', message);
        return;
      }

      // Speak message immediately
      speakBack(message);

      // Pulse orb in different color per type
      setProactivePulseType(type);

      // Wake up the command listener silently so it waits for user response
      wakeWordEngine.triggerProactiveWake();

      // Show alert banner
      setAiResponse(message);
      setIsWoken(true);

      // 10s confirmation window for deadline alerts
      if (type === 'deadline' && taskId) {
        setPendingDeadlineTaskId(taskId);
        setTimeout(() => {
          setPendingDeadlineTaskId(null);
        }, 10000);
      }
    };

    socket.on('voice:response', handleVoiceResponse);
    socket.on('resq:proactive_alert', handleProactiveAlert);

    const handleTextCommand = (e) => {
      if (e.detail && e.detail.text) {
        sendTranscriptToBackend(e.detail.text);
      }
    };
    window.addEventListener('resq:send-text-command', handleTextCommand);

    return () => {
      socket.off('voice:response', handleVoiceResponse);
      socket.off('resq:proactive_alert', handleProactiveAlert);
      window.removeEventListener('resq:send-text-command', handleTextCommand);
    };
  }, []);

  async function handleVoiceResult(result) {
    if (!result) return;
    
    window.dispatchEvent(new CustomEvent('resq:voice-response-received', { detail: result }));

    // Check if blocked by limit
    if (result.blocked) {
      if (result.reason === 'limit_reached') {
        wakeWordEngine.pauseForLimitReached();
        setIsLocked(true);
        voicePersonality.speak(
          "You've used all 30 of your monthly voice commands. Upgrade to Premium for unlimited access. I'll be here once you do."
        );
        window.dispatchEvent(new CustomEvent('resq:limit_reached', { detail: { used: result.used || 30, limit: result.limit || 30 } }));
      } else if (result.reason === 'user_disabled') {
        voicePersonality.speak(
          "Voice AI is currently disabled. You can turn it back on in your settings."
        );
      }
      setMicState('idle');
      return;
    }

    if (result.voiceUsage) {
      setUsageStats(result.voiceUsage);
    } else {
      try {
        const usage = await voice.getUsage();
        setUsageStats(usage);
      } catch { /* ignore */ }
    }

    setLastResult(result);
    setAiResponse(result.response);
    
    // Add AI response to conversation thread
    if (result.response) {
      setConversationThread(prev => [...prev, { role: 'ai', text: result.response }].slice(-10));
    }
    
    // Delegate all speech and visual actions to VoiceActionExecutor
    await executorRef.current.execute(result);
  }

  const sendTranscriptToBackend = async (text) => {
    if (!text) return;
    setMicState('processing');
    
    // Include timezone info so backend correctly resolves "today", "tonight", "10 PM" in the user's local time
    const tzOffsetMinutes = new Date().getTimezoneOffset(); // positive = west of UTC
    const localISOTime = new Date().toLocaleString('en-US', { timeZoneName: 'longOffset' });

    // Check socket first for lower latency
    if (socket && socket.connected) {
      console.log('[Socket Voice] Emitting voice:transcript:', text);
      socket.emit('voice:transcript', { transcript: text, tzOffsetMinutes, localISOTime });
    } else {
      // HTTP fallback
      console.log('[HTTP Voice] Sending voice command:', text);
      try {
        const result = await voice.sendCommand(text);
        handleVoiceResult(result);
      } catch (error) {
        console.error('Error sending voice command via HTTP:', error);
        if (error.response?.status === 403) {
          const { reason, used, limit } = error.response.data || {};
          
          if (reason === 'limit_reached') {
            // 1. Stop the wake word engine
            wakeWordEngine.pauseForLimitReached();
            setIsLocked(true);
            
            // 2. Speak the message
            voicePersonality.speak(
              "You've used all 30 of your monthly voice commands. Upgrade to Premium for unlimited access. I'll be here once you do."
            );
            
            // 3. Show upgrade modal
            window.dispatchEvent(new CustomEvent('resq:limit_reached', { detail: { used: used || 30, limit: limit || 30 } }));
            
          } else if (reason === 'user_disabled') {
            voicePersonality.speak(
              "Voice AI is currently disabled. You can turn it back on in your settings."
            );
          }
        } else {
          setAiResponse("Sorry, I had trouble connecting to the server.");
          speakBack("Sorry, I had trouble connecting to the server.");
        }
        setMicState('idle');
      }
    }
  };

  // Voice synthesis feedback helper delegating to voicePersonality
  const speakBack = (text, priority = false) => {
    setMicState('speaking');

    const resumeListening = () => {
      setMicState(isWokenRef.current ? 'listening' : 'idle');
    };

    voicePersonality.speak(text, {
      priority,
      onEnd: resumeListening
    });
  };

  const handleUpgradeToPremium = async () => {
    setUpgradeLoading(true);
    try {
      // Simulate secure checkout delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update plan to premium on backend
      await settings.updatePlan('premium');
      
      // Re-enable Voice AI setting on backend
      await settings.updateAiVoice(true);
      
      // Reset local engine limits
      wakeWordEngine.limitReached = false;
      setIsLocked(false);
      setAiVoiceEnabled(true);
      
      // Fetch latest profile details
      const freshUser = await auth.getMe();
      if (freshUser) {
        setUserContextName(freshUser.name || 'User');
        // Restart WakeWordEngine
        wakeWordEngine.initialize(freshUser);
      }

      // Fetch fresh usage stats
      const usage = await voice.getUsage();
      setUsageStats(usage);
      
      // Show success response
      setAiResponse("Premium Activated! Voice AI is now unlocked with unlimited commands.");
      speakBack("Thank you for upgrading! Your unlimited voice commands are now active.");
      
      setShowUpgradeModal(false);
      
      // Broadcast settings update to other pages (like SettingsPage)
      window.dispatchEvent(new CustomEvent('resq:ai-voice-toggle', { detail: { enabled: true } }));
      
    } catch (err) {
      console.error('Failed to upgrade via voice assistant checkout:', err);
      alert('Upgrade failed. Please try again or visit Settings page.');
    } finally {
      setUpgradeLoading(false);
    }
  };

  // Wake up assistant
  const triggerWakeUp = () => {
    setConversationThread([]); // Clear chat on every new session
    setAiResponse(INSTANT_RESPONSES.wake_acknowledged);
    wakeWordEngine.triggerWakeSequence();
  };

  // Close assistant
  const closeAssistant = () => {
    wakeWordEngine.resetToIdle();
    setIsWoken(false);
    setMicState('idle');
    setTranscript('');
    setChoices([]);
    setConversationThread([]);
  };

  // Focus Session Helpers
  const startFocusSession = (taskName, durationMinutes) => {
    setFocusTask(taskName || 'Deep Work Session');
    const mins = parseInt(durationMinutes) || 25;
    setFocusDuration(mins);
    setFocusActive(true);
    navigate('/dashboard?tab=dashboard');
  };

  function stopFocusSession() {
    setFocusActive(false);
  }

  // Alt+V shortcut to wake/close assistant
  useEffect(() => {
    const handleAltVShortcut = (e) => {
      if (e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        if (isWoken) {
          closeAssistant();
        } else {
          triggerWakeUp();
        }
      }
    };
    window.addEventListener('keydown', handleAltVShortcut);
    return () => {
      window.removeEventListener('keydown', handleAltVShortcut);
    };
  }, [isWoken]);

  // Cleanup on component unmount and handle Proactive/Idle triggers
  useEffect(() => {
    const updateActivity = () => {
      lastInteractionTimeRef.current = Date.now();
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);

    // Interval checker running every 30 seconds
    const interval = setInterval(() => {
      const idleTime = Date.now() - lastInteractionTimeRef.current;
      const twentyMins = 20 * 60 * 1000;
      
      // If idle for > 20 minutes, and we haven't already suggested it in this idle streak
      if (idleTime > twentyMins && !suggestedFocusRef.current && !focusActiveRef.current) {
        suggestedFocusRef.current = true;
        
        // Suggest focus session
        const msg = "You've been quiet for a bit. Would you like me to start a focus session?";
        setAiResponse(msg);
        
        wakeWordEngine.triggerProactiveWake();
        setIsWoken(true);
        setProactivePulseType('focus'); // Gold pulse
        speakBack(msg);

        // Listen for "yes" to start a focus session
        setAwaitingIdleFocusConfirmation(true);
        setTimeout(() => {
          setAwaitingIdleFocusConfirmation(false);
        }, 10000); // 10s window
      }
      
      // Reset suggestion flag once they become active again
      if (idleTime < twentyMins && suggestedFocusRef.current) {
        suggestedFocusRef.current = false;
      }
    }, 30000); // Check every 30s

    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      clearInterval(interval);
    };
  }, []);

  // Clear proactivePulseType after 10 seconds
  useEffect(() => {
    if (proactivePulseType) {
      const timer = setTimeout(() => {
        setProactivePulseType(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [proactivePulseType]);

  const getOrbState = () => {
    if (!aiVoiceEnabled) return 'disabled';
    if (isLocked) return 'locked';
    if (focusActive) return 'focus_active';
    if (proactivePulseType) return 'alert';
    return micState;
  };

  const triggerScenario = (phrase) => {
    setTranscript(`[Scenario Click]: "${phrase}"`);
    sendTranscriptToBackend(phrase);
  };

  const orbState = getOrbState();
  const alertColor = proactivePulseType === 'meeting' ? 'var(--orb-blue)' : proactivePulseType === 'deadline' ? 'var(--orb-red)' : 'var(--orb-gold)';
  const alertGlow = proactivePulseType === 'meeting' ? 'var(--orb-blue-glow)' : proactivePulseType === 'deadline' ? 'var(--orb-red-glow)' : 'var(--orb-gold-glow)';
  const actionMeta = lastResult ? getIntentActionMeta(lastResult.intent) : null;

  return (
    <>
      {/* Once-only Microphone Permission Denied Pop-up */}
      {permissionDenied && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-[#0c0c0e] border border-red-500/20 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-fade-in-up relative overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <MicOff className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-white text-sm font-tech font-bold tracking-wide">Microphone Access Denied</h3>
            <p className="text-white/80 text-sm leading-relaxed pb-2 font-sans font-medium">
              If you don't turn on the mic, you won't be able to talk to the AI using voice or do related tasks.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  localStorage.setItem('resq:mic-denied-seen', 'true');
                  setPermissionDenied(false);
                }}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                I Understand
              </button>
              <a 
                href="https://support.google.com/chrome/answer/2693767" 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => {
                  localStorage.setItem('resq:mic-denied-seen', 'true');
                  setPermissionDenied(false);
                }}
                className="flex-1 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold text-sm uppercase tracking-wider rounded-xl transition-all border border-red-500/30 cursor-pointer flex items-center justify-center"
              >
                How to Enable
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Friendly microphone permission request modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="bg-[#0c0c0e] border border-white/10 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-fade-in-up">
            <div className="w-12 h-12 rounded-full bg-[var(--orb-gold)]/10 border border-[var(--orb-gold)]/20 flex items-center justify-center mx-auto">
              <Mic className="w-6 h-6 text-[var(--orb-gold)]" />
            </div>
            <h3 className="text-white text-sm font-tech font-bold uppercase tracking-wide">Microphone Permission Needed</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              ResQ needs microphone access to listen for 'Hey ResQ'. Allow it to enable hands-free control.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  localStorage.setItem('resq:mic-prompt-seen', 'true');
                  setShowPermissionModal(false);
                }}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all cursor-pointer"
              >
                Not Now
              </button>
              <button
                onClick={handleGrantPermission}
                className="flex-1 py-2.5 bg-[var(--orb-gold)] hover:bg-[#FFF2CC] text-black rounded-xl text-sm font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Allow Mic
              </button>
            </div>
          </div>
        </div>
      )}

      {isWoken && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-end bg-black/70 backdrop-blur-xl animate-fade-in font-sans" onClick={(e) => { if (e.target === e.currentTarget) closeAssistant(); }}>
          
          {/* Premium glass card — bottom sheet */}
          <div className="w-full max-w-2xl mx-auto mb-0 sm:mb-8 bg-[#070709]/95 backdrop-blur-2xl border border-white/[0.08] rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-[0_-20px_80px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.04)] overflow-hidden relative">
            
            {/* Top accent line */}
            <div className={`absolute top-0 left-0 right-0 h-[1.5px] transition-all duration-700 ${micState === 'listening' ? 'bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent shadow-[0_0_20px_rgba(0,240,255,0.6)]' : micState === 'processing' ? 'bg-gradient-to-r from-transparent via-[#E5B842] to-transparent shadow-[0_0_20px_rgba(229,184,66,0.6)]' : 'bg-gradient-to-r from-transparent via-[#E5B842]/60 to-transparent'}`}></div>

            {/* Drag handle (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-white/20"></div>
            </div>

            <div className="px-8 pt-5 pb-8">
              
              {/* Header row */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <span className="font-display font-black text-lg tracking-tighter flex items-center">
                    <span className="text-white/80">Res</span>
                    <span className="text-[#E5B842]">Q</span>
                  </span>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-tech font-bold uppercase tracking-widest border transition-all duration-500 ${
                    micState === 'listening' ? 'bg-[#00F0FF]/10 border-[#00F0FF]/30 text-[#00F0FF]' 
                    : micState === 'processing' ? 'bg-[#E5B842]/10 border-[#E5B842]/30 text-[#E5B842]'
                    : micState === 'speaking' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-white/5 border-white/10 text-white/50'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${micState === 'listening' ? 'bg-[#00F0FF] animate-pulse' : micState === 'processing' ? 'bg-[#E5B842] animate-spin' : micState === 'speaking' ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'}`}></span>
                    {micState === 'listening' ? 'Listening' : micState === 'processing' ? 'Thinking' : micState === 'speaking' ? 'Speaking' : 'Ready'}
                  </div>
                </div>
                <button onClick={closeAssistant} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/50 hover:text-white transition-all duration-200 flex items-center justify-center cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Central mic visualizer */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative flex items-center justify-center mb-5">
                  {micState === 'listening' && (
                    <>
                      <div className="absolute w-28 h-28 rounded-full border border-[#00F0FF]/15 animate-ping" style={{ animationDuration: '2.5s' }}></div>
                      <div className="absolute w-36 h-36 rounded-full border border-[#00F0FF]/08 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.8s' }}></div>
                      <div className="absolute w-20 h-20 rounded-full bg-[#00F0FF]/5 animate-pulse" style={{ animationDuration: '1.5s' }}></div>
                    </>
                  )}
                  {micState === 'processing' && (
                    <>
                      <div className="absolute w-24 h-24 rounded-full border-2 border-dashed border-[#E5B842]/30 animate-spin" style={{ animationDuration: '3s' }}></div>
                      <div className="absolute w-20 h-20 rounded-full bg-[#E5B842]/5 animate-pulse"></div>
                    </>
                  )}
                  <div className={`relative w-20 h-20 rounded-[1.75rem] flex items-center justify-center z-10 transition-all duration-500 ${micState === 'listening' ? 'bg-[#00F0FF]/10 border-2 border-[#00F0FF]/40 shadow-[0_0_50px_rgba(0,240,255,0.2)]' : micState === 'processing' ? 'bg-[#E5B842]/10 border-2 border-[#E5B842]/40 shadow-[0_0_50px_rgba(229,184,66,0.2)]' : micState === 'speaking' ? 'bg-emerald-500/10 border-2 border-emerald-500/40 shadow-[0_0_50px_rgba(52,199,89,0.2)]' : 'bg-white/5 border-2 border-white/10'}`}>
                    <Mic className={`w-8 h-8 transition-colors duration-300 ${micState === 'listening' ? 'text-[#00F0FF]' : micState === 'processing' ? 'text-[#E5B842]' : micState === 'speaking' ? 'text-emerald-400' : 'text-white/60'}`} />
                  </div>
                </div>

                {/* Animated waveform bars */}
                <div className={`flex items-center gap-[3px] h-8 mb-4 transition-opacity duration-300 ${micState === 'listening' ? 'opacity-100' : 'opacity-0'}`}>
                  {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 1, 0.7, 0.4, 0.6, 0.9, 0.5].map((h, i) => (
                    <div key={i} className="w-[3px] rounded-full bg-[#00F0FF]" style={{ height: `${h * 100}%`, animation: `voiceBar 0.8s ease-in-out infinite alternate`, animationDelay: `${i * 0.07}s`, opacity: 0.5 + h * 0.5 }}></div>
                  ))}
                </div>

                <h2 className="text-xl font-display font-black tracking-tight text-white mb-1">
                  {micState === 'speaking' ? 'ResQ is responding' : micState === 'processing' ? 'Processing your request...' : "I'm listening..."}
                </h2>
                <p className="text-sm text-white/40 font-tech uppercase tracking-widest">
                  {transcript ? `"${transcript}"` : micState === 'listening' ? 'Speak your command' : micState === 'processing' ? 'Analyzing intent...' : 'Say anything'}
                </p>
              </div>

              {/* Conversation Thread — scrollable chat history */}
              {conversationThread.length > 0 && (
                <div className="mb-4 max-h-[220px] overflow-y-auto flex flex-col gap-2 pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {conversationThread.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                      {msg.role === 'ai' && (
                        <div className="w-6 h-6 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center shrink-0 mr-2 mt-0.5">
                          <Sparkles className="w-3 h-3 text-[#00F0FF]" />
                        </div>
                      )}
                      <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed font-sans ${
                        msg.role === 'user'
                          ? 'bg-white/8 border border-white/10 text-white/80 rounded-tr-sm'
                          : 'bg-[#00F0FF]/6 border border-[#00F0FF]/15 text-white/85 rounded-tl-sm'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={threadEndRef} />
                </div>
              )}

              {/* Latest AI Response (always visible) */}
              {conversationThread.length === 0 && (
                <div className={`transition-all duration-500 transform mb-4 ${aiResponse ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0 pointer-events-none'}`}>
                  <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00F0FF]/30 to-transparent"></div>
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4 text-[#00F0FF]" />
                      </div>
                      <p className="text-white/85 text-sm leading-relaxed font-sans font-medium tracking-wide flex-1">{aiResponse}</p>
                    </div>
                    {actionMeta && (
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                        <actionMeta.icon className={`w-3.5 h-3.5 ${actionMeta.color}`} />
                        <span className="text-white/40 text-xs font-tech uppercase tracking-wider">Action:</span>
                        <span className="text-white/70 text-xs font-tech font-bold uppercase tracking-wider">{actionMeta.label}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action meta badge (when thread is active) */}
              {conversationThread.length > 0 && actionMeta && (
                <div className="flex items-center gap-2 mb-3 px-1">
                  <actionMeta.icon className={`w-3.5 h-3.5 ${actionMeta.color}`} />
                  <span className="text-white/40 text-xs font-tech uppercase tracking-wider">Last action:</span>
                  <span className="text-white/70 text-xs font-tech font-bold uppercase tracking-wider">{actionMeta.label}</span>
                </div>
              )}

              {/* Text input fallback for typing (mobile/accessibility) */}
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/80 placeholder-white/20 outline-none focus:border-[#00F0FF]/40 focus:bg-white/[0.06] transition-all font-sans"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      const text = e.target.value.trim();
                      e.target.value = '';
                      setConversationThread(prev => [...prev, { role: 'user', text }].slice(-10));
                      window.dispatchEvent(new CustomEvent('resq:send-text-command', { detail: { text } }));
                    }
                  }}
                />
              </div>

              {/* Bottom hint */}
              <div className="flex items-center justify-center gap-4 mt-4 text-[10px] font-tech text-white/20 uppercase tracking-widest">
                <span>Alt + V to toggle</span>
                <span>·</span>
                <span>Tap outside to close</span>
              </div>


            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Focus HUD Overlay */}
      {focusActive && (
        <FocusSessionOverlay
          taskName={focusTask}
          duration={focusDuration}
          userName={userContextName || 'User'}
          onClose={stopFocusSession}
        />
      )}

      {/* Premium Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0c0c0e] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl animate-fade-in-up relative">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-white/5 rounded-lg text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-14 h-14 rounded-full bg-[var(--orb-gold)]/10 border border-[var(--orb-gold)]/20 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7 text-[var(--orb-gold)] animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-white text-lg font-display font-black uppercase tracking-wide">Upgrade to Premium</h3>
              <p className="text-white/60 text-sm leading-relaxed font-sans">
                You've used all 30 of your monthly voice commands. Upgrade to Premium for unlimited voice commands, smart conflict resolutions, and autopilot scheduling.
              </p>
            </div>
            <button
              onClick={handleUpgradeToPremium}
              disabled={upgradeLoading}
              className="w-full py-3 bg-[var(--orb-gold)] hover:bg-[#FFF2CC] text-black font-tech font-bold text-sm uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {upgradeLoading ? (
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
              ) : (
                "Unlock Unlimited Commands"
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
