import voicePersonality from './VoicePersonality.js';
import { wakeWordEngine } from './WakeWordEngine.js';
import { tasks as apiTasks, calendar as apiCalendar, ai as apiAi, voice as apiVoice, settings as apiSettings } from './api.js';
import { socket } from './socket.js';

export class VoiceActionExecutor {
  constructor(navigationCallback, queryClient) {
    this.navigationCallback = navigationCallback;
    this.queryClient = queryClient; // Might be null/mocked as app uses custom hooks or direct fetch
    this.awaitingClarification = false;
    this.onClarificationTimeout = null;
  }

  async execute(intentObject) {
    if (!intentObject) return;

    const { intent, confidence, extractedData, missingFields, clarificationQuestion, voiceResponse, uiAction, navigationTarget, suggestAlternative } = intentObject;

    // 1. Speak the voice response IMMEDIATELY (don't wait for actions)
    if (voiceResponse) {
      voicePersonality.speak(voiceResponse);
    }

    // 2. Navigate if needed
    if (navigationTarget) {
      if (typeof this.navigationCallback === 'function') {
        this.navigationCallback(navigationTarget);
      } else {
        window.dispatchEvent(new CustomEvent('resq:navigate', { detail: { target: navigationTarget } }));
      }
    }

    // 3. Execute the action
    switch (intent) {
      case 'create_task': {
        try {
          const created = await apiTasks.create(extractedData || {});
          // Invalidate/Refetch
          window.dispatchEvent(new CustomEvent('resq:refetch-tasks'));
          if (created && created._id) {
            // Briefly highlight task card in gold
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('resq:highlight-task', { detail: { taskId: created._id } }));
            }, 500);
          }
          // Emit socket 'tasks:updated'
          if (socket && socket.connected) {
            socket.emit('tasks:updated');
          }
        } catch (e) {
          console.error('[VoiceActionExecutor] create_task failed:', e);
        }
        break;
      }

      case 'complete_task': {
        try {
          let taskId = extractedData?.taskId || extractedData?.id;
          const allTasks = await apiTasks.getAll();
          
          // Fuzzy match task by title if no ID
          if (!taskId && extractedData?.title && allTasks) {
            const matchTitle = extractedData.title.toLowerCase();
            const matched = allTasks.find(t => t.title.toLowerCase().includes(matchTitle));
            if (matched) taskId = matched._id;
          }

          if (taskId) {
            await apiTasks.update(taskId, { completed: true });
            window.dispatchEvent(new CustomEvent('resq:refetch-tasks'));
            // Trigger strikethrough + fade styling
            window.dispatchEvent(new CustomEvent('resq:task-completed-animation', { detail: { taskId } }));
            voicePersonality.speak("Marked as done. Great work.");
          } else {
            voicePersonality.speak("I couldn't find that task in your list.");
          }
          
          if (socket && socket.connected) {
            socket.emit('tasks:updated');
          }
        } catch (e) {
          console.error('[VoiceActionExecutor] complete_task failed:', e);
        }
        break;
      }

      case 'schedule_event': {
        try {
          const created = await apiCalendar.create(extractedData || {});
          window.dispatchEvent(new CustomEvent('resq:refetch-calendar'));
          
          // Switch to calendar
          if (typeof this.navigationCallback === 'function') {
            this.navigationCallback('calendar');
          } else {
            window.dispatchEvent(new CustomEvent('resq:navigate', { detail: { target: 'calendar' } }));
          }

          if (created && created._id) {
            // Highlight new event slot with pulse animation
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('resq:highlight-event', { detail: { eventId: created._id } }));
            }, 600);
          }
        } catch (e) {
          console.error('[VoiceActionExecutor] schedule_event failed:', e);
        }
        break;
      }

      case 'needs_clarification': {
        this.awaitingClarification = true;
        // Display clarification question as text in orb drawer
        window.dispatchEvent(new CustomEvent('resq:clarification-prompt', { 
          detail: { question: clarificationQuestion || voiceResponse } 
        }));

        // Re-activate command listener (don't require wake word again)
        wakeWordEngine.enterClarificationMode(() => {
          this.awaitingClarification = false;
          if (typeof this.onClarificationTimeout === 'function') {
            this.onClarificationTimeout();
          }
        });
        break;
      }

      case 'auto_schedule_tasks': {
        try {
          await apiCalendar.autoSchedule();
          window.dispatchEvent(new CustomEvent('resq:refetch-calendar'));
          
          if (typeof this.navigationCallback === 'function') {
            this.navigationCallback('calendar');
          } else {
            window.dispatchEvent(new CustomEvent('resq:navigate', { detail: { target: 'calendar' } }));
          }
          voicePersonality.speak("I've blocked out focus time for your top priorities.");
        } catch (e) {
          console.error('[VoiceActionExecutor] auto_schedule_tasks failed:', e);
        }
        break;
      }

      case 'show_free_time': {
        try {
          const date = extractedData?.date || new Date().toISOString().split('T')[0];
          const response = await fetch(`http://localhost:5000/api/calendar/free-slots?date=${date}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          const freeSlots = await response.json();
          
          if (Array.isArray(freeSlots) && freeSlots.length > 0) {
            const slotDescriptions = freeSlots.map(s => {
              const start = new Date(s.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const end = new Date(s.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return `${start} to ${end}`;
            });
            const slotsText = `You have ${freeSlots.length} free blocks today: ${slotDescriptions.slice(0, 3).join(', and ')}.`;
            voicePersonality.speak(slotsText);
            window.dispatchEvent(new CustomEvent('resq:display-free-time', { detail: { text: slotsText } }));
          } else {
            const noFreeText = "Your schedule looks fully blocked today.";
            voicePersonality.speak(noFreeText);
            window.dispatchEvent(new CustomEvent('resq:display-free-time', { detail: { text: noFreeText } }));
          }
        } catch (e) {
          console.error('[VoiceActionExecutor] show_free_time failed:', e);
        }
        break;
      }

      case 'set_focus_session': {
        // Create fullscreen focus overlay component
        const duration = parseInt(extractedData?.durationMinutes) || 25;
        const taskName = extractedData?.taskName || extractedData?.taskId || 'Deep Work Session';
        
        window.dispatchEvent(new CustomEvent('resq:start-focus', {
          detail: { task: taskName, duration }
        }));
        break;
      }

      case 'show_summary': {
        try {
          const summaryData = await apiAi.getDailySummary();
          if (summaryData?.summary) {
            voicePersonality.speak(summaryData.summary);
            window.dispatchEvent(new CustomEvent('resq:show-summary', { detail: { summary: summaryData.summary } }));
          }
        } catch (e) {
          console.error('[VoiceActionExecutor] show_summary failed:', e);
        }
        break;
      }

      case 'navigate': {
        const target = uiAction?.payload?.target || extractedData?.target;
        if (target) {
          if (typeof this.navigationCallback === 'function') {
            this.navigationCallback(target);
          } else {
            window.dispatchEvent(new CustomEvent('resq:navigate', { detail: { target } }));
          }
          voicePersonality.speak(`Opening your ${target}.`);
        }
        break;
      }

      case 'permission_denied': {
        voicePersonality.speak(intentObject.voiceResponse || voiceResponse);
        break;
      }

      case 'change_theme': {
        const theme = uiAction?.payload?.theme || extractedData?.theme;
        if (theme) {
          document.documentElement.setAttribute('data-theme', theme);
          localStorage.setItem('theme', theme);

          const root = document.documentElement;
          root.classList.remove('light', 'matrix');
          if (theme === 'light') {
            root.classList.add('light');
            localStorage.setItem('resq-theme', 'light');
          } else if (theme === 'matrix') {
            root.classList.add('matrix');
            localStorage.setItem('resq-theme', 'matrix');
          } else {
            localStorage.setItem('resq-theme', 'dark');
          }

          try {
            await apiSettings.updateTheme(theme);
          } catch (e) {
            console.error('[VoiceActionExecutor] Failed to persist theme:', e);
          }

          voicePersonality.speak(`Switched to ${theme} mode. Looks great.`);
        }
        break;
      }

      case 'out_of_scope': {
        // Speak voiceResponse (polite decline + redirects)
        if (voiceResponse) {
          voicePersonality.speak(voiceResponse);
        }
        break;
      }

      case 'show_deadlines': {
        try {
          // Navigate to tasks tab
          if (typeof this.navigationCallback === 'function') {
            this.navigationCallback('tasks');
          } else {
            window.dispatchEvent(new CustomEvent('resq:navigate', { detail: { target: 'tasks' } }));
          }
          
          // Trigger highlights
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('resq:highlight-deadlines'));
          }, 500);

          // Get deadlines summary
          const allTasks = await apiTasks.getAll();
          const critical = allTasks.filter(t => !t.completed && t.urgency >= 9);
          if (critical.length > 0) {
            const summary = `You have ${critical.length} critical deadlines remaining today. I recommend engaging your focus shield.`;
            voicePersonality.speak(summary);
          } else {
            voicePersonality.speak("Excellent news, you have no critical task deadlines looming today.");
          }
        } catch (e) {
          console.error('[VoiceActionExecutor] show_deadlines failed:', e);
        }
        break;
      }

      default:
        break;
    }
  }
}
