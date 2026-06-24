import voicePersonality from './VoicePersonality.js';
import { wakeWordEngine } from './WakeWordEngine.js';
import { tasks as apiTasks, calendar as apiCalendar, ai as apiAi, settings as apiSettings } from './api.js';

export class VoiceActionExecutor {
  constructor(navigationCallback, speakCallback) {
    this.navigationCallback = navigationCallback;
    this.speakCallback = speakCallback;
    this.awaitingClarification = false;
    this.onClarificationTimeout = null;
  }

  speak(text) {
    if (typeof this.speakCallback === 'function') {
      this.speakCallback(text);
    } else {
      voicePersonality.speak(text);
    }
  }

  async execute(intentObject) {
    if (!intentObject) return;

    const { intent, extractedData, clarificationQuestion, voiceResponse, uiAction, navigationTarget } = intentObject;

    // 1. Speak the voice response IMMEDIATELY (don't wait for actions)
    const responseText = voiceResponse || intentObject.response || clarificationQuestion;
    if (responseText) {
      this.speak(responseText);
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
          // Refetch tasks lists to render the newly created task
          window.dispatchEvent(new CustomEvent('resq:refetch-tasks'));
          
          const createdTaskId = intentObject.createdTaskId;
          if (createdTaskId) {
            // Briefly highlight task card in gold
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('resq:highlight-task', { detail: { taskId: createdTaskId } }));
            }, 500);
          }
        } catch (e) {
          console.error('[VoiceActionExecutor] create_task UI update failed:', e);
        }
        break;
      }

      case 'complete_task': {
        try {
          // Refetch tasks lists
          window.dispatchEvent(new CustomEvent('resq:refetch-tasks'));
          
          let taskId = extractedData?.taskId || extractedData?.id;
          if (taskId) {
            // Trigger strikethrough + fade styling
            window.dispatchEvent(new CustomEvent('resq:task-completed-animation', { detail: { taskId } }));
          }
        } catch (e) {
          console.error('[VoiceActionExecutor] complete_task UI update failed:', e);
        }
        break;
      }

      case 'schedule_event': {
        try {
          window.dispatchEvent(new CustomEvent('resq:refetch-calendar'));
          
          // Switch to calendar
          if (typeof this.navigationCallback === 'function') {
            this.navigationCallback('calendar');
          } else {
            window.dispatchEvent(new CustomEvent('resq:navigate', { detail: { target: 'calendar' } }));
          }

          const createdEventId = intentObject.createdEventId;
          if (createdEventId) {
            // Highlight new event slot with pulse animation
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('resq:highlight-event', { detail: { eventId: createdEventId } }));
            }, 600);
          }
        } catch (e) {
          console.error('[VoiceActionExecutor] schedule_event UI update failed:', e);
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
          this.speak("I've blocked out focus time for your top priorities.");
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
              const start = new Date(s.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
              const end = new Date(s.end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
              return `${start} to ${end}`;
            });
            const slotsText = `You have ${freeSlots.length} free blocks today: ${slotDescriptions.slice(0, 3).join(', and ')}.`;
            this.speak(slotsText);
            window.dispatchEvent(new CustomEvent('resq:display-free-time', { detail: { text: slotsText } }));
          } else {
            const noFreeText = "Your schedule looks fully blocked today.";
            this.speak(noFreeText);
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
            this.speak(summaryData.summary);
            window.dispatchEvent(new CustomEvent('resq:show-summary', { detail: { summary: summaryData.summary } }));
          }
        } catch (e) {
          console.error('[VoiceActionExecutor] show_summary failed:', e);
        }
        break;
      }

      case 'create_goal': {
        try {
          // Refetch goals list
          window.dispatchEvent(new CustomEvent('resq:refetch-goals'));
          
          if (typeof this.navigationCallback === 'function') {
            this.navigationCallback('goals');
          } else {
            window.dispatchEvent(new CustomEvent('resq:navigate', { detail: { target: 'goals' } }));
          }
        } catch (e) {
          console.error('[VoiceActionExecutor] create_goal UI update failed:', e);
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
          this.speak(`Opening your ${target}.`);
        }
        break;
      }

      case 'permission_denied': {
        this.speak(intentObject.voiceResponse || voiceResponse || intentObject.response);
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

          this.speak(`Switched to ${theme} mode. Looks great.`);
        }
        break;
      }

      case 'out_of_scope': {
        // Speak voiceResponse (polite decline + redirects)
        const scopeText = voiceResponse || intentObject.response;
        if (scopeText) {
          this.speak(scopeText);
        }
        break;
      }

      case 'close_intent': {
        const text = voiceResponse || intentObject.response || "Going to sleep.";
        this.speak(text);
        window.dispatchEvent(new CustomEvent('resq:close'));
        wakeWordEngine.resetToIdle();
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
            this.speak(summary);
          } else {
            this.speak("Excellent news, you have no critical task deadlines looming today.");
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
