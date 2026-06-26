import { useContext, createContext } from 'react';
import { 
  Info, Lightbulb, AlertTriangle, CheckCircle,
  Mic, Bot, Zap, Disc, Target, Flame, Calendar,
  CheckSquare, LayoutDashboard, BookOpen, Shield, Bell
} from 'lucide-react';

const DocsActiveSectionContext = createContext('');

// ─── Reusable Doc Components ─────────────────────────────────

function SectionHeading({ id, label, icon: Icon, children }) {
  const activeSection = useContext(DocsActiveSectionContext);
  if (activeSection && activeSection !== id) {
    return null;
  }
  return (
    <section id={id} className="scroll-mt-28 mb-20">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/8">
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-[#E5B842]/10 border border-[#E5B842]/20 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-[#E5B842]" />
          </div>
        )}
        <div>
          <p className="text-[10px] font-tech font-bold uppercase tracking-[0.25em] text-[#E5B842]/70">{label}</p>
          <h2 className="text-2xl md:text-3xl font-display font-black text-white tracking-tight">{id.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function H3({ children }) {
  return <h3 className="text-lg font-display font-bold text-white mt-8 mb-3">{children}</h3>;
}

function P({ children }) {
  return <p className="text-white/70 leading-relaxed mb-4 text-[15px]">{children}</p>;
}

function Callout({ type = 'info', title, children }) {
  const styles = {
    info:    { bg: 'bg-blue-500/8 border-blue-500/25',    icon: Info,         iconColor: 'text-blue-400',   titleColor: 'text-blue-300'   },
    tip:     { bg: 'bg-[#E5B842]/8 border-[#E5B842]/25',  icon: Lightbulb,    iconColor: 'text-[#E5B842]',  titleColor: 'text-[#E5B842]'  },
    warning: { bg: 'bg-orange-500/8 border-orange-500/25',icon: AlertTriangle, iconColor: 'text-orange-400', titleColor: 'text-orange-300' },
    success: { bg: 'bg-emerald-500/8 border-emerald-500/25', icon: CheckCircle, iconColor: 'text-emerald-400', titleColor: 'text-emerald-300' },
  };
  const s = styles[type];
  const Icon = s.icon;
  return (
    <div className={`rounded-xl border p-4 mb-6 flex gap-3 ${s.bg}`}>
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${s.iconColor}`} />
      <div>
        {title && <p className={`text-sm font-bold mb-1 ${s.titleColor}`}>{title}</p>}
        <p className="text-sm text-white/70 leading-relaxed">{children}</p>
      </div>
    </div>
  );
}

function CodeBlock({ children }) {
  return (
    <div className="relative rounded-xl bg-white/[0.03] border border-white/10 mb-6 overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/5">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
      </div>
      <pre className="p-4 text-sm text-[#E5B842]/90 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">
        {children}
      </pre>
    </div>
  );
}

function Badge({ children, color = 'yellow' }) {
  const colors = {
    yellow: 'bg-[#E5B842]/10 text-[#E5B842] border-[#E5B842]/20',
    blue:   'bg-blue-500/10 text-blue-300 border-blue-500/20',
    green:  'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    red:    'bg-red-500/10 text-red-300 border-red-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${colors[color]}`}>
      {children}
    </span>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="rounded-xl bg-white/[0.025] border border-white/8 p-5 flex gap-4 hover:bg-white/[0.04] transition-colors">
      <div className="w-9 h-9 rounded-lg bg-[#E5B842]/10 flex items-center justify-center shrink-0">
        <Icon className="w-4.5 h-4.5 text-[#E5B842]" />
      </div>
      <div>
        <p className="text-sm font-bold text-white mb-1">{title}</p>
        <p className="text-sm text-white/55 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function ExampleBox({ title, children }) {
  return (
    <div className="rounded-xl bg-[#0d0d0d] border border-white/8 p-5 mb-6">
      {title && <p className="text-xs font-tech font-bold uppercase tracking-widest text-[#E5B842]/70 mb-3">{title}</p>}
      {children}
    </div>
  );
}

// ─── Main Content ─────────────────────────────────────────────

export default function DocsContent({ activeSection }) {
  return (
    <DocsActiveSectionContext.Provider value={activeSection}>
      <div className="max-w-3xl mx-auto lg:mx-0">

      {/* ── Introduction ── */}
      <SectionHeading id="introduction" label="Overview" icon={BookOpen}>
        <P>
          <strong className="text-white">ResQ</strong> is a next-generation AI-powered productivity assistant built to help you take full control of your time, tasks, habits, goals, and calendar — all from a single unified workspace. It combines a clean, modern interface with a deeply intelligent AI layer that understands natural language, learns from your patterns, and proactively helps you make better decisions every day.
        </P>
        <P>
          Unlike traditional to-do apps that simply store your lists, ResQ actively prioritizes your workload, alerts you to potential conflicts, suggests the best times to focus, and even converses with you through voice — so you can stay in flow without ever touching a keyboard.
        </P>
        <Callout type="success" title="What Makes ResQ Different">
          ResQ isn't just a task manager. It's a cognitive productivity partner. The AI understands context, history, and urgency — generating ranked priority lists, smart schedules, and actionable insights automatically every single day.
        </Callout>

        <H3>Vision & Purpose</H3>
        <P>
          The vision behind ResQ is simple: eliminate the mental overhead of managing your day. Most people spend significant time and cognitive energy deciding what to work on next, when to take breaks, how to handle conflicting priorities, and remembering all the things they need to do. ResQ offloads all of that to an intelligent AI agent so you can focus entirely on doing the actual work.
        </P>
        <P>
          ResQ is built for students, professionals, founders, and anyone who wants to operate at their highest level without burning out. Whether you're managing a heavy academic schedule, running a business, or simply trying to build better daily habits, ResQ adapts to your workflow.
        </P>

        <H3>Core Capabilities at a Glance</H3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <FeatureCard icon={Bot} title="Conversational AI" desc="Talk to your AI assistant in plain English to manage everything — tasks, events, habits, and goals." />
          <FeatureCard icon={Mic} title="Hands-Free Voice Mode" desc="Operate the entire app with your voice. Start focus sessions, create tasks, and check your schedule without touching your device." />
          <FeatureCard icon={Disc} title="AI Priority Stack" desc="Every morning your AI generates a ranked list of what needs your attention most urgently today." />
          <FeatureCard icon={Zap} title="Focus Sessions" desc="Start a timed deep work session with AI-powered hands-free controls, real-time timer, and distraction blocking." />
        </div>
      </SectionHeading>

      {/* ── Getting Started ── */}
      <SectionHeading id="getting-started" label="Onboarding" icon={Zap}>
        <P>Getting started with ResQ takes less than two minutes. Follow the steps below to create your account, set up your workspace, and make your first interaction with the AI.</P>

        <H3>1. Creating an Account</H3>
        <P>Navigate to the ResQ landing page and click <Badge>Get Started</Badge> or <Badge>Sign Up</Badge>. You can register with your email address. After submitting the form, you'll be redirected directly to your personal dashboard — no email confirmation required for immediate access.</P>

        <H3>2. Logging In</H3>
        <P>Return to the ResQ homepage and click <Badge>Log In</Badge>. Enter the email and password you registered with. Your session is securely maintained using JWT tokens stored in your browser's local storage. You will remain logged in across browser sessions until you explicitly log out.</P>

        <Callout type="info" title="Session Security">
          ResQ uses secure HTTP-only cookies and JWT authentication tokens to maintain your session. If you share a device with others, always use the Logout option in the navigation to protect your data.
        </Callout>

        <H3>3. Initial Setup & Navigation</H3>
        <P>On your first visit to the dashboard, you'll see an empty but fully functional workspace. The main navigation tabs are located at the bottom of the screen on mobile, or in the left sidebar on desktop:</P>
        <ul className="list-none space-y-2 mb-6">
          {[
            ['Home', 'Your main dashboard with AI priority stack and daily overview'],
            ['Tasks', 'Create and manage all your tasks with deadlines and priorities'],
            ['Calendar', 'Schedule events, time blocks, and manage your agenda'],
            ['Habits', 'Track daily habits and build powerful streaks'],
            ['Goals', 'Set long-term goals and monitor your progress'],
            ['Settings', 'Customize notifications, themes, and account preferences'],
          ].map(([tab, desc]) => (
            <li key={tab} className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#E5B842]/60 shrink-0" />
              <span className="text-sm text-white/70"><strong className="text-white">{tab}</strong> — {desc}</span>
            </li>
          ))}
        </ul>

        <H3>4. Personalizing Your Workspace</H3>
        <P>ResQ supports <Badge>Dark Mode</Badge>, <Badge>Light Mode</Badge>, and <Badge color="green">Matrix Mode</Badge> — a special high-contrast green terminal theme. Toggle between them using the sun/moon icon in the top navigation bar. Your preference is saved automatically and persists across all sessions.</P>

        <H3>5. Your First AI Interaction</H3>
        <P>Click the microphone icon or use the chat interface to speak to your AI for the first time. Try saying:</P>
        <CodeBlock>{`"Hey ResQ, add a task to review my project proposal, due tomorrow, urgency 8 out of 10."

"Set a focus session for 25 minutes."

"What should I work on today?"`}</CodeBlock>
        <Callout type="tip" title="Pro Tip">
          The AI works best when you give it context. Instead of "add task," try "add a high-urgency task to submit my biology report by Friday afternoon." The richer the detail, the smarter the response.
        </Callout>
      </SectionHeading>

      {/* ── Dashboard ── */}
      <SectionHeading id="dashboard" label="Overview Screen" icon={LayoutDashboard}>
        <P>The Dashboard is your mission control — a real-time, AI-curated view of everything important happening today. It is designed to give you a complete picture of your workload at a glance, without requiring you to dig through multiple tabs.</P>

        <H3>AI Priority Stack</H3>
        <P>The centerpiece of the Dashboard is the <strong className="text-white">AI Priority Stack</strong> — a ranked list of your most important tasks, events, habits, and goals for today. Every item is scored from 0 to 100 based on urgency, deadline proximity, goal alignment, and historical completion patterns. The AI refreshes this list automatically every hour and whenever you make a change.</P>
        <Callout type="info" title="How Priority Scores Work">
          A task due in 2 hours with urgency 9/10 scores significantly higher than a task due next week with urgency 3/10. The AI also boosts items tied to active goals or long streaks to help you maintain momentum.
        </Callout>

        <H3>Daily Completion Rate</H3>
        <P>A circular progress indicator at the top of the dashboard shows your <strong className="text-white">Daily Completion Rate</strong> — the percentage of today's scheduled tasks and habits you've completed so far. This gives you instant motivation and accountability without any manual tracking.</P>

        <H3>Today's Focus Slots</H3>
        <P>This timeline panel shows only your <strong className="text-white">upcoming events for today</strong> — any event whose start time is after the current moment. Past events are automatically filtered out, keeping the view clean and forward-looking. Events are sorted chronologically so you always know what's coming next.</P>

        <H3>Habit & Streak Overview</H3>
        <P>The dashboard displays your current <strong className="text-white">perfect streak</strong> — the number of consecutive days you've completed all scheduled habits. This is calculated using a strict "all or nothing" rule: a day counts only if every habit scheduled for that day was completed.</P>

        <H3>AI Daily Summary</H3>
        <P>At the top of the dashboard, a natural language summary written by the AI explains the key highlights of your day — what needs urgent attention, what you're doing well, and what patterns the AI has noticed. This summary is generated fresh every hour.</P>

        <H3>Smart Notifications</H3>
        <P>Real-time toast notifications appear on the dashboard whenever a deadline approaches, a new AI insight is available, or an important reminder fires. These are entirely suppressed during active Focus Sessions so you're never interrupted during deep work.</P>
      </SectionHeading>

      {/* ── Tasks ── */}
      <SectionHeading id="tasks" label="Task Management" icon={CheckSquare}>
        <P>The Tasks section is the core of your daily productivity workflow. ResQ's task system is designed to be simultaneously simple to use and powerful enough for complex project management.</P>

        <H3>Creating a Task</H3>
        <P>Click the <Badge>+ New Task</Badge> button or tell the AI to create one. Every task requires:</P>
        <ul className="list-none space-y-2 mb-6">
          {[
            ['Title', 'A clear, descriptive name for the task'],
            ['Urgency', 'A score from 1 to 10 indicating how urgent this task is'],
            ['Due Date', 'The deadline or target completion date'],
            ['Category', 'e.g. Work, Study, Personal, Health, Finance'],
            ['Estimated Duration', 'How many minutes you expect it to take (optional)'],
          ].map(([field, desc]) => (
            <li key={field} className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#E5B842]/60 shrink-0" />
              <span className="text-sm text-white/70"><strong className="text-white">{field}</strong> — {desc}</span>
            </li>
          ))}
        </ul>

        <H3>AI-Assisted Task Creation</H3>
        <P>You can create tasks entirely through natural language with the AI assistant. The AI will extract all relevant fields automatically from your message:</P>
        <ExampleBox title="Voice / Text Examples">
          <div className="space-y-3">
            {[
              '"Create a task to finish the product design mockup, due Friday, urgency 8."',
              '"Remind me to call the bank tomorrow morning, it\'s very important."',
              '"Add a study task for calculus revision this weekend, medium priority."',
            ].map((ex, i) => (
              <p key={i} className="text-sm text-[#E5B842]/80 font-mono bg-black/30 rounded-lg px-4 py-2.5 border border-white/5">→ {ex}</p>
            ))}
          </div>
        </ExampleBox>

        <H3>Subtasks</H3>
        <P>Break down complex tasks into smaller, actionable <strong className="text-white">Subtasks</strong>. Each subtask can be independently checked off. The parent task remains active until all subtasks (and the task itself) are marked complete.</P>

        <H3>Completing & Editing Tasks</H3>
        <P>Click the checkbox next to any task to mark it complete. The AI Priority Stack updates in real-time, animating the completed task out of the list. To edit a task, click on it to open the detail panel where you can modify any field.</P>

        <Callout type="tip" title="Smart Organization">
          The AI automatically deprioritizes tasks whose due dates have passed if you consistently reschedule them. Use the AI chat to ask "what tasks should I reschedule?" to get intelligent recommendations.
        </Callout>

        <H3>Urgency & Priority System</H3>
        <P>Urgency is a 1–10 scale that you assign manually. However, the AI combines your urgency score with the due date proximity and goal alignment to compute a final <strong className="text-white">AI Priority Score</strong>. This means a task you marked as urgency 5 might rise to the top of the stack if its deadline is tomorrow.</P>

        <H3>Categories & Filtering</H3>
        <P>Tasks are organized into categories such as Work, Study, Personal, Health, and Finance. Use the filter bar at the top of the Tasks page to view tasks by category, urgency level, or completion status.</P>
      </SectionHeading>

      {/* ── Calendar ── */}
      <SectionHeading id="calendar" label="Scheduling" icon={Calendar}>
        <P>The Calendar section gives you full control over your schedule. It supports event creation, time blocking, deadline tracking, and AI-powered scheduling suggestions.</P>

        <H3>Creating Events</H3>
        <P>Click any time slot on the calendar or press <Badge>+ New Event</Badge>. Events require a title, start time, and end time. You can also specify an event type: Meeting, Focus Block, Personal, Deadline, or Reminder.</P>

        <H3>Time Blocking</H3>
        <P><strong className="text-white">Time blocking</strong> is the practice of reserving dedicated slots in your calendar for specific work. In ResQ, every focus session you start is automatically logged as a time block. You can also manually create focus blocks for future planning.</P>

        <H3>AI Scheduling Suggestions</H3>
        <P>Ask the AI to find the best time for a task or meeting:</P>
        <CodeBlock>{`"Schedule 2 hours of deep work for my thesis tomorrow morning."

"When is the best time this week for a 90-minute study session?"`}</CodeBlock>
        <P>The AI analyzes your existing calendar, your peak productivity patterns, and your task deadlines to suggest optimal slots.</P>

        <H3>Today's Focus Slots on Dashboard</H3>
        <P>Your upcoming events for the current day are surfaced directly on the Dashboard in the "Today's Focus Slots" timeline. Only events starting after the current time are shown, keeping your view clean and forward-focused.</P>

        <Callout type="warning" title="Calendar Event Limits">
          For best performance, avoid creating more than 50 events per day. The calendar is optimized for daily and weekly planning, not long-range scheduling of hundreds of events.
        </Callout>

        <H3>Editing & Deleting Events</H3>
        <P>Click any event on the calendar to open its detail card. From there you can edit any field or delete the event entirely. You can also ask the AI: <em className="text-white/60">"Delete my 3 PM meeting"</em> or <em className="text-white/60">"Move tomorrow's standup to 10 AM."</em></P>
      </SectionHeading>

      {/* ── Habits ── */}
      <SectionHeading id="habits" label="Habit Tracking" icon={Flame}>
        <P>The Habits section helps you build and maintain powerful daily routines. Unlike simple checklists, ResQ tracks your streaks, analyzes your patterns, and uses AI to provide personalized insights and tips.</P>

        <H3>Creating a Habit</H3>
        <P>Click <Badge>+ New Habit</Badge> and give it a name. You can set which days of the week the habit should be tracked (e.g., Mon–Fri for work habits, daily for health habits). ResQ will track your completion every day automatically.</P>

        <H3>Daily Habit Completion</H3>
        <P>Each day, your scheduled habits appear in the Dashboard's Focus Slots and the Habits page. Click the checkmark to log a completion. Completions are timestamped and stored permanently so your historical data is always available.</P>

        <H3>Streaks</H3>
        <P>ResQ tracks two types of streaks:</P>
        <ul className="list-none space-y-2 mb-6">
          {[
            ['Individual Streak', 'The number of consecutive days you\'ve completed a specific habit'],
            ['Perfect Streak', 'The number of consecutive days you\'ve completed ALL scheduled habits (shown on Dashboard)'],
          ].map(([name, desc]) => (
            <li key={name} className="flex items-start gap-3">
              <Flame className="w-4 h-4 text-[#E5B842] mt-0.5 shrink-0" />
              <span className="text-sm text-white/70"><strong className="text-white">{name}</strong> — {desc}</span>
            </li>
          ))}
        </ul>

        <Callout type="tip" title="Building Momentum">
          The AI automatically boosts the priority score of habits that are part of a long streak, making it more likely they'll appear prominently in your daily Priority Stack. Protect your streaks!
        </Callout>

        <H3>AI Insights & Tips</H3>
        <P>Each habit card displays an <strong className="text-white">AI Insight</strong> and an <strong className="text-white">AI Tip</strong> — personalized observations generated by the Gemini model based on your completion history. These might include observations like "You tend to skip this habit on weekends" or "Your streak is at risk — you haven't completed this in 2 days."</P>

        <H3>Recurring Routines</H3>
        <P>The AI recognizes recurring routines automatically. If you consistently start your day with a specific task or habit at the same time, the AI can suggest converting it into a formal habit to ensure it's tracked and maintained over time.</P>
      </SectionHeading>

      {/* ── Goals ── */}
      <SectionHeading id="goals" label="Goal Planning" icon={Target}>
        <P>Goals represent your bigger-picture ambitions — the projects, milestones, and achievements you're working toward over weeks, months, or years. The Goals system in ResQ connects your daily tasks and habits to your long-term vision, giving every action deeper meaning.</P>

        <H3>Creating a Goal</H3>
        <P>Click <Badge>+ New Goal</Badge> and fill in the title, description, and target date. Goals also accept milestones — intermediate checkpoints that mark meaningful progress toward the final objective.</P>

        <H3>Milestones</H3>
        <P>Break your goal into <strong className="text-white">Milestones</strong> to track incremental progress. Each milestone has its own target date and completion status. The goal's progress bar updates automatically as you complete milestones.</P>

        <ExampleBox title="Goal Example">
          <p className="text-sm text-white/80 mb-2 font-bold">Goal: Become a React Native Developer</p>
          <div className="space-y-1.5">
            {['Complete React Native basics course','Build first mobile app prototype','Deploy to App Store','Land first freelance client'].map((m, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-white/60">
                <div className={`w-3 h-3 rounded-full border ${i < 1 ? 'bg-[#E5B842] border-[#E5B842]' : 'border-white/30'}`} />
                {m}
              </div>
            ))}
          </div>
        </ExampleBox>

        <H3>AI Goal Guidance</H3>
        <P>The AI Assistant can help you plan goals strategically. Ask it to break down a vague goal into specific milestones, suggest daily tasks that contribute to your goal, or estimate a realistic timeline based on your current workload.</P>
        <CodeBlock>{`"Help me plan a goal to pass my AWS certification exam in 3 months."

"What tasks should I add this week to make progress on my fitness goal?"`}</CodeBlock>

        <H3>Goal Tracking & Status</H3>
        <P>Goals have three statuses: <Badge color="blue">Active</Badge>, <Badge color="green">Completed</Badge>, and <Badge color="red">Paused</Badge>. Completed goals are archived but remain accessible in your history. The AI uses your active goals to influence which tasks and habits it prioritizes in the daily stack.</P>
      </SectionHeading>

      {/* ── AI Assistant ── */}
      <SectionHeading id="ai-assistant" label="Core Intelligence" icon={Bot}>
        <P>The AI Assistant is the most powerful feature in ResQ. It's not a simple chatbot that responds to keywords — it's a fully context-aware, multi-turn conversational agent powered by Google Gemini that understands the full state of your tasks, events, habits, and goals, and can take real action on your behalf.</P>

        <H3>Accessing the AI Assistant</H3>
        <P>The AI is accessible through two channels:</P>
        <ul className="list-none space-y-2 mb-6">
          {[
            ['Chat Interface', 'Type your message in the AI chat panel on the right side of the dashboard.'],
            ['Voice Mode', 'Say "Hey ResQ" (or your configured wake word) to activate hands-free voice conversation.'],
          ].map(([method, desc]) => (
            <li key={method} className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#E5B842]/60 shrink-0" />
              <span className="text-sm text-white/70"><strong className="text-white">{method}</strong> — {desc}</span>
            </li>
          ))}
        </ul>

        <H3>Natural Language Understanding</H3>
        <P>The AI understands how people actually talk. You don't need to use exact commands or specific keywords. Just describe what you want in plain English and the AI will interpret your intent, extract the relevant data, and perform the appropriate action.</P>

        <ExampleBox title="Natural Language Examples">
          <div className="space-y-2">
            {[
              ['"I need to email my professor tomorrow morning about the extension"', '→ Creates a task with due date tomorrow, urgency detected from context'],
              ['"Block 2 hours this afternoon for deep work on the design"', '→ Creates a calendar event from ~2 PM for 2 hours'],
              ['"I want to start meditating every morning"', '→ Creates a daily habit scheduled for every day'],
              ['"Set me a 45-minute focus session right now"', '→ Launches Focus Session overlay with 45-minute timer'],
            ].map(([input, result], i) => (
              <div key={i} className="text-sm">
                <p className="text-[#E5B842]/80 font-mono">{input}</p>
                <p className="text-white/40 text-xs mt-0.5 mb-2">{result}</p>
              </div>
            ))}
          </div>
        </ExampleBox>

        <H3>Full CRUD Operations via AI</H3>
        <P>The AI can <strong className="text-white">Create, Read, Update, and Delete</strong> any item in your workspace:</P>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {[
            ['Create', '"Add a task...", "Create an event...", "Start a new habit..."'],
            ['Read', '"What tasks do I have today?", "Show my calendar for tomorrow"'],
            ['Update', '"Change the due date of my report task to Friday"'],
            ['Delete', '"Delete my 3 PM meeting", "Remove the running habit"'],
          ].map(([op, ex]) => (
            <div key={op} className="rounded-lg bg-white/[0.02] border border-white/8 p-3">
              <Badge>{op}</Badge>
              <p className="text-xs text-white/50 mt-2 leading-relaxed">{ex}</p>
            </div>
          ))}
        </div>

        <H3>Multi-Turn Conversations</H3>
        <P>The AI maintains full context across the entire conversation session. You can refer to items from earlier in the chat without repeating details:</P>
        <ExampleBox title="Multi-Turn Conversation">
          <div className="space-y-2 text-sm">
            <div><span className="text-[#E5B842] font-bold">You:</span> <span className="text-white/70">"Add a task to finish the quarterly report, due Thursday."</span></div>
            <div><span className="text-white/50 font-bold">AI:</span> <span className="text-white/50">Done! I've added "Finish quarterly report" due Thursday.</span></div>
            <div><span className="text-[#E5B842] font-bold">You:</span> <span className="text-white/70">"Actually make it due Wednesday, it's more urgent."</span></div>
            <div><span className="text-white/50 font-bold">AI:</span> <span className="text-white/50">Updated! The deadline is now Wednesday. Should I also increase the urgency score?</span></div>
          </div>
        </ExampleBox>

        <H3>Context Awareness</H3>
        <P>The AI has full awareness of your current data state at all times. When you ask "what should I work on next?", it doesn't give a generic answer — it looks at your actual tasks, their urgencies, deadlines, your goal alignment, and your current time of day to give you a specific, personalized recommendation.</P>

        <H3>Smart Planning</H3>
        <P>Beyond basic CRUD, the AI can reason about your schedule holistically. It can detect if you've overloaded a particular day, suggest moving tasks to earlier in the week to reduce deadline stress, or recommend creating a habit when it notices you do the same thing repeatedly.</P>

        <H3>Intelligent Suggestions</H3>
        <P>The AI proactively generates intelligent suggestions without being asked:</P>
        <ul className="list-none space-y-2 mb-6">
          {[
            'AI Priority Score for every task and event updated hourly',
            'Daily natural language summary of your day\'s landscape',
            'Habit insights based on completion patterns',
            'Smart deadline warnings 24 and 48 hours before due dates',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <Disc className="w-4 h-4 text-[#E5B842] mt-0.5 shrink-0" />
              <span className="text-sm text-white/70">{item}</span>
            </li>
          ))}
        </ul>

        <Callout type="tip" title="Best Practice: Be Specific">
          The more context you provide, the better the AI performs. Instead of "add task," say "add a high-priority task to review the contract for the Smith deal, due by end of business Friday, category: Work." The AI will use every piece of information to schedule, prioritize, and contextualize correctly.
        </Callout>
      </SectionHeading>

      {/* ── Voice Mode ── */}
      <SectionHeading id="voice-mode" label="Hands-Free Control" icon={Mic}>
        <P>Voice Mode is ResQ's hands-free productivity engine. Using your browser's built-in speech recognition technology combined with the ResQ AI, you can manage your entire workspace without ever touching your keyboard or mouse.</P>

        <H3>Activating Voice Mode</H3>
        <P>Voice Mode activates automatically when you load the dashboard if you've granted microphone permissions. The system uses a wake word engine that continuously listens for your activation phrase in the background without sending audio to any server.</P>
        <Callout type="info" title="Wake Word">
          Say <strong>"Hey ResQ"</strong> to wake the assistant. The interface will show a pulsing indicator to confirm it's listening. You then have a few seconds to speak your command naturally.
        </Callout>

        <H3>Voice Commands During Focus Sessions</H3>
        <P>When a Focus Session is active, the Voice Mode shifts into a dedicated command-listening mode. The standard global assistant is paused and replaced with a lightweight local listener that only responds to session control commands:</P>
        <CodeBlock>{`"Stop" or "End" → Ends the focus session
"Pause"         → Pauses the timer
"Resume"        → Resumes a paused timer
"How much time left?" → AI reads out remaining time`}</CodeBlock>

        <H3>Hands-Free Productivity</H3>
        <P>Voice Mode is especially powerful when you're cooking, exercising, commuting, or in any situation where your hands aren't free. You can:</P>
        <ul className="list-none space-y-2 mb-6">
          {[
            'Create tasks and events while on the go',
            'Check what\'s on your agenda without looking at a screen',
            'Start and control focus sessions completely hands-free',
            'Get AI-generated summaries read aloud to you',
            'Log habit completions verbally',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <Mic className="w-4 h-4 text-[#E5B842] mt-0.5 shrink-0" />
              <span className="text-sm text-white/70">{item}</span>
            </li>
          ))}
        </ul>

        <H3>Natural Conversations</H3>
        <P>Voice Mode supports full natural language — not just simple commands. You can speak in full sentences, use filler words, correct yourself, and refer to context from earlier in the conversation. The AI processes the semantic meaning, not just keywords.</P>

        <H3>Continuous Listening Architecture</H3>
        <P>The wake word engine runs entirely in the browser using the Web Speech API. It listens in the background at all times while the dashboard is open, allowing instantaneous activation without any server round-trips. Only after you say the wake word does the system begin processing your speech and sending it for AI interpretation.</P>

        <Callout type="warning" title="Browser Support">
          Voice Mode requires a Chromium-based browser (Google Chrome, Microsoft Edge, Brave) for optimal speech recognition. Firefox has limited Web Speech API support. Safari on iOS is partially supported.
        </Callout>
      </SectionHeading>

      {/* ── Notifications ── */}
      <SectionHeading id="notifications" label="Alerts & Reminders" icon={Bell}>
        <P>ResQ's notification system is smart, contextual, and non-intrusive. Rather than bombarding you with generic reminders, it delivers timely, AI-curated alerts at exactly the right moment.</P>

        <H3>Types of Notifications</H3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {[
            ['Deadline Warnings', 'Fires 48 hours and 24 hours before a task or event deadline'],
            ['AI Priority Updates', 'Delivered when the AI recalculates your priority stack'],
            ['Habit Reminders', 'Sent at your scheduled habit times if not yet completed'],
            ['Focus Session Alerts', 'Phase transitions, completion sounds, and break reminders'],
          ].map(([type, desc]) => (
            <div key={type} className="rounded-lg bg-white/[0.02] border border-white/8 p-3">
              <p className="text-sm font-bold text-white mb-1">{type}</p>
              <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <H3>Focus Session Notification Blocking</H3>
        <P>When a Focus Session is active, <strong className="text-white">all dashboard notifications are automatically suppressed</strong>. This ensures your deep work sessions are genuinely distraction-free. Notifications queue up silently and resume delivery once the session ends.</P>

        <H3>Web Push Notifications</H3>
        <P>ResQ requests permission to send native browser push notifications so you can receive deadline warnings and reminders even when the browser tab is in the background or closed. You can manage push notification permissions in your browser settings or within ResQ's Settings page.</P>

        <Callout type="tip" title="Custom Reminders">
          Use the AI to set custom reminders: <em className="text-white/60">"Remind me to take my medication every day at 8 PM"</em> or <em className="text-white/60">"Alert me 2 hours before my team meeting on Thursday."</em>
        </Callout>
      </SectionHeading>

      {/* ── Productivity Features ── */}
      <SectionHeading id="productivity-features" label="Feature Reference" icon={Zap}>
        <P>ResQ combines a comprehensive suite of productivity tools into a single, unified workspace. Here is a complete reference of every core feature available.</P>

        <H3>Focus Sessions</H3>
        <P>A Focus Session is a timed, distraction-free deep work mode. When active, a full-screen overlay takes over the screen showing a live countdown timer, your current task name, a progress ring, and session controls. All notifications are blocked. The session supports pause, resume, +1 min, -1 min adjustments, and an end confirmation.</P>

        <H3>Pomodoro-Compatible Timing</H3>
        <P>You can configure Focus Sessions to match the Pomodoro Technique: 25-minute focus blocks followed by 5-minute breaks. The AI manages the transition between focus and break phases automatically, playing distinct audio tones to signal each phase change.</P>

        <H3>AI Daily Summary</H3>
        <P>Every day, the AI generates a personalized natural language summary of your day's priorities, upcoming deadlines, habit status, and any notable patterns. This summary is displayed prominently at the top of the Dashboard and refreshed hourly.</P>

        <H3>Smart Scheduling</H3>
        <P>ResQ's smart scheduler analyzes your existing calendar commitments and suggests optimal times for new tasks based on your available windows, energy patterns, and deadline urgency. Ask the AI to schedule anything and it will find the best slot automatically.</P>

        <H3>Multi-Platform Design</H3>
        <P>ResQ is fully responsive and works on desktop, laptop, tablet, and mobile devices. The bottom navigation bar on mobile makes it easy to switch between sections with one thumb. The desktop layout uses a wider sidebar-based design for richer context.</P>

        <H3>Theme System</H3>
        <P>Three themes are available:</P>
        <ul className="list-none space-y-2 mb-6">
          {[
            ['Dark Mode (Default)', 'Sleek dark background with gold accent colors. Optimized for low-light environments.'],
            ['Light Mode', 'Clean white background with subtle dark UI elements. Better for bright environments.'],
            ['Matrix Mode', 'High-contrast green terminal aesthetic for developers who want a distinctive look.'],
          ].map(([theme, desc]) => (
            <li key={theme} className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#E5B842]/60 shrink-0" />
              <span className="text-sm text-white/70"><strong className="text-white">{theme}</strong> — {desc}</span>
            </li>
          ))}
        </ul>
      </SectionHeading>

      {/* ── AI Features ── */}
      <SectionHeading id="ai-features" label="AI Capabilities" icon={Disc}>
        <P>This section provides a dedicated breakdown of every AI-powered capability in ResQ, explaining the underlying technology and how each feature improves your productivity.</P>

        <div className="space-y-4 mb-8">
          {[
            {
              title: 'Gemini-Powered Intelligence',
              desc: 'All AI reasoning in ResQ is powered by Google\'s Gemini large language model, accessed via the Gemini API. This gives ResQ access to state-of-the-art natural language understanding, reasoning, and generation capabilities.'
            },
            {
              title: 'Intent Classification',
              desc: 'Every message you send to the AI is analyzed for intent — whether you want to create, read, update, or delete a task/event/habit/goal — and the AI routes your request to the appropriate handler automatically.'
            },
            {
              title: 'Entity Extraction',
              desc: 'The AI extracts structured data from your natural language. Dates, times, durations, urgency levels, and categories are pulled from conversational sentences and converted into database records.'
            },
            {
              title: 'Contextual Memory',
              desc: 'Within a conversation session, the AI remembers everything you\'ve said. You can reference "the task I just created" or "that meeting we discussed" and the AI will understand exactly what you mean.'
            },
            {
              title: 'AI Priority Scoring',
              desc: 'Every task, event, habit, and goal is scored by the AI on a 0–100 scale. The score considers urgency, deadline proximity, goal alignment, and historical patterns to surface the most important items.'
            },
            {
              title: 'Daily Intelligence Summary',
              desc: 'The AI generates a fresh natural language summary of your day each hour, identifying the 2–3 most critical items, any risks (overdue items, streak breaks), and positive momentum to maintain.'
            },
            {
              title: 'Voice Intent Processing',
              desc: 'Voice commands are transcribed, parsed for intent, and executed as real database actions — all within 1–2 seconds. The AI speaks back confirmations in natural language.'
            },
            {
              title: 'Habit Pattern Analysis',
              desc: 'The AI analyzes your habit completion history to generate personalized insights: when you tend to skip, which habits are at risk, and what tips might help you maintain consistency.'
            },
            {
              title: 'Smart Goal Planning',
              desc: 'When you describe a goal, the AI can automatically generate a milestone roadmap, suggest tasks to create, estimate timelines, and connect daily habits to long-term objectives.'
            },
            {
              title: 'Natural Language Date Parsing',
              desc: 'You can say "next Monday", "end of the month", "in 3 days", or "this coming Friday" — the AI converts all natural date expressions into precise timestamps automatically.'
            },
          ].map(({ title, desc }) => (
            <div key={title} className="rounded-xl bg-white/[0.02] border border-white/8 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Disc className="w-4 h-4 text-[#E5B842]" />
                <p className="text-sm font-bold text-white">{title}</p>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </SectionHeading>

      {/* ── Best Practices ── */}
      <SectionHeading id="best-practices" label="Tips & Guidance" icon={Lightbulb}>
        <P>Follow these best practices to get the maximum value from ResQ and build a genuinely powerful productivity system.</P>

        <H3>1. Review the Dashboard First Thing</H3>
        <P>Start every morning by opening the ResQ Dashboard. Spend 2–3 minutes reviewing the AI Priority Stack, reading the daily summary, and confirming today's schedule. This short ritual sets clear intentions for the day and takes advantage of the AI's overnight analysis.</P>

        <H3>2. Let the AI Schedule, Not Just Store</H3>
        <P>Instead of manually adding tasks and figuring out when to do them, describe your work to the AI and ask it to schedule it: <em className="text-white/60">"I need about 3 hours to finish the proposal. Can you find time for it this week?"</em></P>

        <H3>3. Use Focus Sessions Aggressively</H3>
        <P>The biggest productivity gains come from uninterrupted deep work. Use Focus Sessions for any work that requires concentration. The notification blocking and voice controls make it easy to stay in flow for extended periods.</P>

        <H3>4. Build Habits Incrementally</H3>
        <P>Don't create 10 habits at once. Start with 2–3 non-negotiable daily habits and maintain them for 3 weeks before adding more. ResQ's streak system will motivate you to maintain consistency.</P>

        <H3>5. Connect Tasks to Goals</H3>
        <P>Every significant task you create should tie back to one of your long-term goals. This gives the AI more context for prioritization and gives your daily work a sense of larger purpose and direction.</P>

        <H3>6. Use Voice for Low-Friction Capture</H3>
        <P>The best time to capture a task is the moment you think of it. Use Voice Mode to instantly add tasks, ideas, and reminders without breaking your current workflow. Say <em className="text-white/60">"Hey ResQ, remind me to follow up with Sarah about the project contract on Monday."</em></P>

        <H3>7. Respect the AI's Priority Ranking</H3>
        <P>The AI Priority Stack is computed from real data. When the AI ranks something as the top priority, trust it and work on that first. Resist the urge to always pick the easiest or most comfortable item.</P>

        <Callout type="success" title="The Compound Effect">
          Users who consistently use ResQ's daily dashboard review, focus sessions, and habit tracking for 30+ consecutive days report dramatically improved completion rates, reduced stress around deadlines, and significantly stronger habit consistency compared to their first week.
        </Callout>
      </SectionHeading>

      {/* ── FAQ ── */}
      <SectionHeading id="faq" label="Common Questions" icon={null}>
        <P>Here are answers to the most frequently asked questions about ResQ.</P>

        <div className="space-y-4">
          {[
            {
              q: 'Can I use ResQ without the AI features?',
              a: 'Yes. The Tasks, Calendar, Habits, and Goals sections work entirely independently. The AI features (priority scoring, daily summary, voice assistant) are layered on top and enhance the experience but are not required for basic functionality.'
            },
            {
              q: 'Does ResQ work offline?',
              a: 'Core UI interactions work offline momentarily due to browser caching, but ResQ requires an internet connection for all AI features, data synchronization, and real-time updates. Offline support is planned for a future release.'
            },
            {
              q: 'What browsers are supported?',
              a: 'ResQ works best on Google Chrome, Microsoft Edge, and Brave (Chromium-based browsers). Firefox is supported for non-voice features. Voice Mode requires Chromium-based browsers for full Web Speech API support.'
            },
            {
              q: 'Is the AI reading my data?',
              a: 'The AI only accesses your data to process your explicit requests and generate priority scores and summaries. Your data is never used to train AI models. See the Privacy & Security section for full details.'
            },
            {
              q: 'Can I use ResQ on mobile?',
              a: 'Yes. ResQ is fully responsive and optimized for mobile use. The mobile layout uses a bottom navigation bar, touch-friendly controls, and a collapsible sidebar. Voice Mode may have limited functionality on some iOS devices.'
            },
            {
              q: 'How often does the AI Priority Stack update?',
              a: 'The AI Priority Stack refreshes automatically every hour. It also refreshes immediately whenever you create, update, or delete a task, habit, or goal, or whenever you complete a focus session.'
            },
            {
              q: 'Can I delete my account and all data?',
              a: 'Yes. Navigate to Settings → Account and use the Delete Account option. This permanently deletes all your tasks, events, habits, goals, and AI data from our servers with no recovery option.'
            },
          ].map(({ q, a }, i) => (
            <div key={i} className="rounded-xl bg-white/[0.02] border border-white/8 p-5">
              <p className="text-sm font-bold text-white mb-2 flex items-start gap-2">
                <span className="text-[#E5B842] shrink-0 font-tech">Q.</span>
                {q}
              </p>
              <p className="text-sm text-white/60 leading-relaxed pl-5">{a}</p>
            </div>
          ))}
        </div>
      </SectionHeading>

      {/* ── Troubleshooting ── */}
      <SectionHeading id="troubleshooting" label="Problem Solving" icon={AlertTriangle}>
        <P>If you're experiencing issues with ResQ, use this guide to identify and resolve the most common problems.</P>

        <H3>Voice Mode Not Responding</H3>
        <P><strong className="text-white">Symptoms:</strong> Saying the wake word does nothing, or the microphone icon shows an error.</P>
        <P><strong className="text-white">Solutions:</strong></P>
        <ul className="list-none space-y-2 mb-6">
          {[
            'Check that your browser has microphone permissions (click the lock icon in the address bar)',
            'Ensure you\'re using a Chromium-based browser (Chrome, Edge, or Brave)',
            'Check that no other application is currently using the microphone exclusively',
            'Refresh the page — the wake word engine sometimes needs to reinitialize after background system activity',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400/60 shrink-0" />
              <span className="text-sm text-white/70">{item}</span>
            </li>
          ))}
        </ul>

        <H3>Focus Session Not Recognizing "Pause" or "Stop"</H3>
        <P><strong className="text-white">Symptoms:</strong> Voice commands during Focus Sessions have no effect.</P>
        <P><strong className="text-white">Solutions:</strong></P>
        <ul className="list-none space-y-2 mb-6">
          {[
            'The local speech listener needs ~500ms to initialize after the session starts — wait a moment before issuing the first command',
            'Speak clearly and directly toward the microphone',
            'If the issue persists, use the on-screen Pause and End buttons as fallback',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400/60 shrink-0" />
              <span className="text-sm text-white/70">{item}</span>
            </li>
          ))}
        </ul>

        <H3>AI Not Responding or Slow</H3>
        <P><strong className="text-white">Solutions:</strong></P>
        <ul className="list-none space-y-2 mb-6">
          {[
            'Check your internet connection',
            'The Gemini API can occasionally be slow during high-traffic periods — wait 10–15 seconds and try again',
            'Refresh the dashboard and try your request again',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400/60 shrink-0" />
              <span className="text-sm text-white/70">{item}</span>
            </li>
          ))}
        </ul>

        <H3>Tasks or Events Not Saving</H3>
        <P><strong className="text-white">Solutions:</strong></P>
        <ul className="list-none space-y-2 mb-6">
          {[
            'Check your internet connection — all data operations require a live connection to the backend server',
            'Ensure all required fields are filled in (Title, Urgency, Due Date for tasks)',
            'Check the browser console for specific error messages and report them if unclear',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400/60 shrink-0" />
              <span className="text-sm text-white/70">{item}</span>
            </li>
          ))}
        </ul>

        <H3>Habit Streak Not Updating</H3>
        <P>Streaks are recalculated dynamically on every page load. If your streak appears incorrect, refresh the page. If the issue persists, verify that your habit completions have the correct date stored (visible in the habit's detail view).</P>

        <Callout type="info" title="Need More Help?">
          If you encounter an issue not covered in this guide, use the AI Assistant to describe your problem. The AI can often diagnose configuration issues and walk you through a resolution in real-time.
        </Callout>
      </SectionHeading>

      {/* ── Privacy & Security ── */}
      <SectionHeading id="privacy-security" label="Trust & Safety" icon={Shield}>
        <P>ResQ takes your privacy and data security seriously. This section explains exactly what data we collect, how it's used, and how it's protected.</P>

        <H3>Data Storage</H3>
        <P>All your personal data — tasks, events, habits, goals, and account information — is stored in a MongoDB database hosted on a secure cloud server. Data is associated with your user account and is never shared with any third party.</P>

        <H3>Authentication & Session Security</H3>
        <P>ResQ uses JSON Web Tokens (JWT) for authentication. Passwords are hashed using bcrypt with a strong salt factor before storage. We never store plain-text passwords. JWT tokens expire after a configurable period and are refreshed securely.</P>

        <H3>AI Interactions</H3>
        <P>When you interact with the AI Assistant, your messages and relevant context data (your tasks, events, habits, and goals) are sent to the Google Gemini API for processing. This data is used solely to generate your response and is subject to Google's API Privacy Policy. No data is used to train Gemini models.</P>

        <Callout type="warning" title="Sensitive Information">
          Avoid sharing highly sensitive personal or financial information directly in AI chats or task descriptions. While data is encrypted in transit, treat the AI chat similarly to how you'd treat any cloud-based productivity tool.
        </Callout>

        <H3>Voice Data</H3>
        <P>The wake word detection phase runs entirely locally in your browser using the Web Speech API. During this phase, no audio is transmitted to ResQ's servers. Audio is only transcribed and sent when you've explicitly activated the assistant by saying the wake word, and only the transcribed text (not raw audio) is processed by the AI.</P>

        <H3>Data Encryption</H3>
        <P>All data in transit between your browser and ResQ's servers is encrypted using HTTPS/TLS. Database connections use encrypted channels. Sensitive configuration secrets (API keys, database URIs) are stored in environment variables, never in source code.</P>

        <H3>Your Rights</H3>
        <ul className="list-none space-y-2 mb-6">
          {[
            ['Access', 'You can view all your stored data at any time through the ResQ interface.'],
            ['Export', 'Contact support to request a full data export in JSON format.'],
            ['Deletion', 'Delete your account and all associated data permanently via Settings → Account.'],
            ['Correction', 'Edit or correct any data stored in ResQ at any time through the app interface.'],
          ].map(([right, desc]) => (
            <li key={right} className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-[#E5B842] mt-0.5 shrink-0" />
              <span className="text-sm text-white/70"><strong className="text-white">{right}</strong> — {desc}</span>
            </li>
          ))}
        </ul>

        <H3>Permissions Required</H3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {[
            ['Microphone', 'Required for Voice Mode. Used only when you explicitly activate the AI assistant.', 'Optional'],
            ['Push Notifications', 'Required for native deadline reminders. Can be declined without losing core functionality.', 'Optional'],
            ['LocalStorage', 'Used to persist your theme preference and current tab state. No personal data is stored here.', 'Required'],
          ].map(([perm, desc, req]) => (
            <div key={perm} className="rounded-lg bg-white/[0.02] border border-white/8 p-4">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-bold text-white">{perm}</p>
                <Badge color={req === 'Required' ? 'red' : 'green'}>{req}</Badge>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </SectionHeading>

      {/* Bottom nav hint */}
      <div className="text-center py-12 border-t border-white/5">
        <p className="text-sm text-white/30">ResQ Documentation · v1.0</p>
        <p className="text-xs text-white/20 mt-1">Built with ❤ by 5zoo</p>
      </div>

      </div>
    </DocsActiveSectionContext.Provider>
  );
}
