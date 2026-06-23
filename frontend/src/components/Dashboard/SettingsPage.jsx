import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Bell, 
  Palette, 
  LayoutGrid, 
  Volume2, 
  CreditCard, 
  Database, 
  HardDrive, 
  Shield, 
  Key, 
  Lock, 
  Heart, 
  User, 
  Keyboard,
  Check,
  AlertCircle,
  X
} from 'lucide-react';

export default function SettingsPage() {
  const [activeSubTab, setActiveSubTab] = useState('general');

  const [selectedPlan, setSelectedPlan] = useState(() => {
    const saved = localStorage.getItem('resq-plan');
    return saved || 'free';
  });
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentCard, setPaymentCard] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  // Profile settings
  const [profile, setProfile] = useState({
    name: 'Faizaan Khan',
    email: 'faizaan@gmail.com',
    role: 'Developer Account'
  });

  // AI Guardian Settings
  const [proactivity, setProactivity] = useState(3); // 1 to 5 scale
  const proactivityLabels = [
    'Gentle (Alerts only)',
    'Balanced (Alerts + Nudges)',
    'Optimal (Autonomic scheduling)',
    'Aggressive (Double-booking resolution)',
    'Relentless (Full calendar control)'
  ];

  // Connected Calendars
  const [selectedCalendars, setSelectedCalendars] = useState(['primary', 'work']);
  const handleCalToggle = (id) => {
    setSelectedCalendars(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Notification states
  const [allowWebPush, setAllowWebPush] = useState(true);
  const [allowPhonePush, setAllowPhonePush] = useState(true); // "need notification in phone or not"
  const [allowEmail, setAllowEmail] = useState(true);
  const [allowDeadlineAlerts, setAllowDeadlineAlerts] = useState(true);

  // App settings
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('resq-theme');
    return saved || 'dark';
  });
  const [accentColor, setAccentColor] = useState('gold');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [language, setLanguage] = useState('en');
  const [soundVolume, setSoundVolume] = useState(80);

  // Voice AI
  const [voiceFeedback, setVoiceFeedback] = useState(true);
  const [micSensitivity, setMicSensitivity] = useState('high');

  // Security
  const [twoFactor, setTwoFactor] = useState(false);

  // Storage
  const [autoPurgeLogs, setAutoPurgeLogs] = useState(true);

  // Parental controls
  const [screenLimit, setScreenLimit] = useState(4);
  const [hardFocusLock, setHardFocusLock] = useState(false);

  // Trusted Contact
  const [trustedEmail, setTrustedEmail] = useState('emergency-delegate@resq.io');
  const [notifyTrusted, setNotifyTrusted] = useState(true);

  // Keyboard shortcut state
  const [voiceShortcut, setVoiceShortcut] = useState('Alt + V');

  // Font size scale
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('resq-font-size');
    return saved ? parseInt(saved) : 16;
  });

  // Toast notifications
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Apply root font-size change
  const handleFontSizeChange = (size) => {
    setFontSize(size);
    localStorage.setItem('resq-font-size', size);
    document.documentElement.style.fontSize = `${size}px`;
  };

  // Apply font size on mount
  useEffect(() => {
    const saved = localStorage.getItem('resq-font-size');
    if (saved) {
      document.documentElement.style.fontSize = `${saved}px`;
    }
  }, []);

  // Sync theme and plan active states to root html class attributes and localStorage
  useEffect(() => {
    const root = document.documentElement;
    
    // Toggle theme classes
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
    
    // Toggle active plan classes
    root.classList.remove('premium-active', 'free-active');
    if (selectedPlan === 'premium') {
      root.classList.add('premium-active');
      localStorage.setItem('resq-plan', 'premium');
    } else {
      root.classList.add('free-active');
      localStorage.setItem('resq-plan', 'free');
    }
  }, [theme, selectedPlan]);

  const handleProfileSave = (e) => {
    e.preventDefault();
    showToast("Profile settings updated successfully!");
  };

  const handleResetData = () => {
    if (window.confirm("Are you sure you want to reset all workspace data? This cannot be undone.")) {
      showToast("Workspace data cleared.", "error");
    }
  };

  const handleGenerateApiKey = () => {
    const key = `resq_live_${Math.random().toString(36).substring(2, 15)}`;
    navigator.clipboard.writeText(key);
    showToast("API Key copied to clipboard!");
  };

  const handleExportData = () => {
    showToast("Backup metadata package exported!");
  };

  // Settings Sidebar tabs definition
  const sidebarTabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'personalization', label: 'Personalization', icon: Palette },
    { id: 'apps', label: 'Apps', icon: LayoutGrid },
    { id: 'voice', label: 'Voice', icon: Volume2 },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'data', label: 'Data controls', icon: Database },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'safety', label: 'Safety', icon: Shield },
    { id: 'security', label: 'Security and login', icon: Key },
    { id: 'parental', label: 'Parental controls', icon: Lock },
    { id: 'trusted', label: 'Trusted contact', icon: Heart },
    { id: 'account', label: 'Account', icon: User },
    { id: 'keyboard', label: 'Keyboard', icon: Keyboard }
  ];

  // Render content area based on active tab
  const renderTabContent = () => {
    switch (activeSubTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-display font-black text-white">General Settings</h3>
              <p className="text-xs text-white/50">Manage your profile information and main workspace defaults.</p>
            </div>
            
            <form onSubmit={handleProfileSave} className="space-y-4 max-w-lg">
              <div>
                <label className="text-[10px] font-tech font-bold uppercase tracking-wider text-white/40 block mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full bg-[#0B0B0B] border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-tech font-bold uppercase tracking-wider text-white/40 block mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full bg-[#0B0B0B] border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-tech font-bold uppercase tracking-wider text-white/40 block mb-1.5">Account Role</label>
                <input 
                  type="text" 
                  value={profile.role}
                  onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                  className="w-full bg-[#0B0B0B] border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl px-4 py-2.5 text-xs text-white/50 outline-none transition-colors"
                />
              </div>

              <div className="pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-tech font-bold uppercase tracking-wider text-white/40 block mb-1.5">Language</label>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-[#0B0B0B] border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl px-3 py-2.5 text-xs text-white outline-none transition-colors cursor-pointer"
                  >
                    <option value="en">English (US)</option>
                    <option value="de">Deutsch</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="ja">日本語 (Japanese)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-tech font-bold uppercase tracking-wider text-white/40 block mb-1.5">Sound Chimes Volume</label>
                  <div className="flex items-center gap-3 mt-1.5">
                    <button 
                      type="button"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 relative cursor-pointer border shrink-0 ${soundEnabled ? 'bg-[#E5B842] border-[#E5B842]' : 'bg-transparent border-white/20'}`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-black transition-transform duration-300 ${soundEnabled ? 'translate-x-4' : 'translate-x-0 bg-white/40'}`} />
                    </button>
                    <input 
                      type="range" 
                      min="0" 
                      max="100"
                      value={soundVolume}
                      disabled={!soundEnabled}
                      onChange={(e) => setSoundVolume(parseInt(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#E5B842] disabled:opacity-30"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="py-2.5 px-6 bg-[#E5B842] hover:bg-[#FFF2CC] text-black font-bold uppercase tracking-wider text-[10px] rounded-xl transition-colors cursor-pointer mt-4"
              >
                Save Profile Changes
              </button>
            </form>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-display font-black text-white">Notification Settings</h3>
              <p className="text-xs text-white/50">Configure where and how you receive alerts and summaries.</p>
            </div>

            <div className="space-y-4 max-w-lg">
              <div className="flex items-center justify-between p-4 bg-black/40 border border-white/[0.03] rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white/85">Push Notifications</span>
                  <span className="text-[10px] text-white/40">In web browser panel</span>
                </div>
                <button 
                  onClick={() => setAllowWebPush(!allowWebPush)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 relative cursor-pointer border ${allowWebPush ? 'bg-[#E5B842] border-[#E5B842]' : 'bg-transparent border-white/20'}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-black transition-transform duration-300 ${allowWebPush ? 'translate-x-4 bg-black' : 'translate-x-0 bg-white/40'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/40 border border-white/[0.03] rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white/85">Phone Screen Push Sync</span>
                  <span className="text-[10px] text-white/40">Receive notifications on companion mobile app</span>
                </div>
                <button 
                  onClick={() => setAllowPhonePush(!allowPhonePush)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 relative cursor-pointer border ${allowPhonePush ? 'bg-[#E5B842] border-[#E5B842]' : 'bg-transparent border-white/20'}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-black transition-transform duration-300 ${allowPhonePush ? 'translate-x-4 bg-black' : 'translate-x-0 bg-white/40'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/40 border border-white/[0.03] rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white/85">Daily Email Briefings</span>
                  <span className="text-[10px] text-white/40">Recap metrics & completed tasks</span>
                </div>
                <button 
                  onClick={() => setAllowEmail(!allowEmail)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 relative cursor-pointer border ${allowEmail ? 'bg-[#E5B842] border-[#E5B842]' : 'bg-transparent border-white/20'}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-black transition-transform duration-300 ${allowEmail ? 'translate-x-4 bg-black' : 'translate-x-0 bg-white/40'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/40 border border-white/[0.03] rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white/85">Critical Deadline Hazards</span>
                  <span className="text-[10px] text-white/40">Warning cues for upcoming deadlines</span>
                </div>
                <button 
                  onClick={() => setAllowDeadlineAlerts(!allowDeadlineAlerts)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 relative cursor-pointer border ${allowDeadlineAlerts ? 'bg-[#E5B842] border-[#E5B842]' : 'bg-transparent border-white/20'}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-black transition-transform duration-300 ${allowDeadlineAlerts ? 'translate-x-4 bg-black' : 'translate-x-0 bg-white/40'}`} />
                </button>
              </div>
            </div>
          </div>
        );

      case 'personalization':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-display font-black text-white">Personalization Settings</h3>
              <p className="text-xs text-white/50">Customize display themes, accents, and accessibility scales.</p>
            </div>

            <div className="space-y-5 max-w-lg">
              {/* Theme selection */}
              <div>
                <label className="text-[10px] font-tech font-bold uppercase tracking-wider text-white/40 block mb-2.5">Display Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {['dark', 'light', 'matrix'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTheme(t)}
                      className={`py-2.5 px-1 text-[10px] font-bold uppercase tracking-wider rounded-xl border text-center transition-all cursor-pointer ${
                        theme === t 
                          ? 'border-[#E5B842] bg-[#E5B842]/10 text-[#E5B842] shadow-[0_0_12px_rgba(229,184,66,0.1)]' 
                          : 'border-white/5 bg-white/[0.02] text-white/40 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color selection */}
              <div>
                <label className="text-[10px] font-tech font-bold uppercase tracking-wider text-white/40 block mb-2.5">System Accent Color</label>
                <div className="flex gap-3">
                  {[
                    { key: 'gold', color: 'bg-[#E5B842]', label: 'Gold' },
                    { key: 'platinum', color: 'bg-[#EAEAEA]', label: 'Platinum' },
                    { key: 'red', color: 'bg-status-red', label: 'Red' },
                    { key: 'blue', color: 'bg-status-blue', label: 'Blue' }
                  ].map(item => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setAccentColor(item.key)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                        accentColor === item.key ? 'border-white bg-white/5 scale-105' : 'border-white/5 bg-black/40 opacity-60 hover:opacity-100'
                      }`}
                      title={item.label}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${item.color}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size slider */}
              <div className="space-y-2.5 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/50">Interface Font Size:</span>
                  <span className="text-[#E5B842] font-bold uppercase">{fontSize}px</span>
                </div>
                <input 
                  type="range" 
                  min="12" 
                  max="20"
                  step="1"
                  value={fontSize} 
                  onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#E5B842]"
                />
                <div className="flex justify-between text-[9px] font-tech text-white/30 uppercase">
                  <span>Small (12px)</span>
                  <span>Medium (16px)</span>
                  <span>Large (20px)</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'apps':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-display font-black text-white">Apps & Integrations</h3>
              <p className="text-xs text-white/50">Sync connected calendars and authorize third-party workspace integrations.</p>
            </div>

            <div className="space-y-5 max-w-lg">
              {/* Connected Calendars */}
              <div className="space-y-3">
                <label className="text-[10px] font-tech font-bold uppercase tracking-wider text-white/40 block mb-1">Google Calendar Sync</label>
                {[
                  { id: 'primary', name: 'Primary Account (faizaan@gmail.com)' },
                  { id: 'work', name: 'Work Calendar (CN Hackathon)' },
                  { id: 'holidays', name: 'Indian Holidays' }
                ].map((cal) => {
                  const active = selectedCalendars.includes(cal.id);
                  return (
                    <div 
                      key={cal.id}
                      onClick={() => handleCalToggle(cal.id)}
                      className="flex items-center justify-between p-3.5 bg-black/40 border border-white/[0.03] rounded-xl cursor-pointer hover:border-white/10 transition-all duration-300"
                    >
                      <span className="text-xs text-white/85">{cal.name}</span>
                      <div className={`w-9 h-5 rounded-full p-0.5 transition-all duration-300 border ${active ? 'bg-[#E5B842] border-[#E5B842]' : 'bg-transparent border-white/20'}`}>
                        <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${active ? 'translate-x-4 bg-black' : 'translate-x-0 bg-white/40'}`}></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Extra Integrations */}
              <div className="space-y-3 pt-2">
                <label className="text-[10px] font-tech font-bold uppercase tracking-wider text-white/40 block mb-1">Other Integrations</label>
                {[
                  { name: 'Slack Automation Bot', status: 'Connected', desc: 'Allows commands via Slack channels' },
                  { name: 'Notion Database Sync', status: 'Connected', desc: 'Sync tasks to Notion workspaces' },
                  { name: 'Discord Webhook Notifier', status: 'Disconnected', desc: 'Post daily reviews to Discord' }
                ].map((app) => (
                  <div key={app.name} className="flex items-center justify-between p-3.5 bg-black/40 border border-white/[0.03] rounded-xl">
                    <div>
                      <span className="text-xs font-semibold block text-white/85">{app.name}</span>
                      <span className="text-[9px] text-white/40">{app.desc}</span>
                    </div>
                    <button 
                      onClick={() => showToast(`${app.name} status updated.`)}
                      className={`px-3 py-1.5 border rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                        app.status === 'Connected' 
                          ? 'border-[#E5B842]/30 text-[#E5B842] bg-[#E5B842]/5 hover:bg-[#E5B842] hover:text-black hover:border-transparent' 
                          : 'border-white/10 text-white/40 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {app.status === 'Connected' ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'voice':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-display font-black text-white">Voice AI Configs</h3>
              <p className="text-xs text-white/50">Customize voice parameters and proactivity parameters for the Guardian assistant.</p>
            </div>

            <div className="space-y-5 max-w-lg">
              {/* AI Guardian Settings */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/50">Proactivity Scale Factor:</span>
                  <span className="text-[#E5B842] font-bold uppercase">{proactivityLabels[proactivity - 1]}</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="5"
                  value={proactivity} 
                  onChange={(e) => setProactivity(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#E5B842]"
                />
                <p className="text-[10px] text-white/40 leading-relaxed">
                  This dictates the autonomy level of the scheduling engine. Level 3 permits auto-sync booking. Level 5 allows full reorganization of overlapping slots.
                </p>
              </div>

              {/* Voice responses */}
              <div className="flex items-center justify-between p-4 bg-black/40 border border-white/[0.03] rounded-2xl pt-2">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white/85">Voice Speech Feedback</span>
                  <span className="text-[10px] text-white/40">Guardian assistant answers vocally</span>
                </div>
                <button 
                  onClick={() => setVoiceFeedback(!voiceFeedback)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 relative cursor-pointer border ${voiceFeedback ? 'bg-[#E5B842] border-[#E5B842]' : 'bg-transparent border-white/20'}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-black transition-transform duration-300 ${voiceFeedback ? 'translate-x-4 bg-black' : 'translate-x-0 bg-white/40'}`} />
                </button>
              </div>

              {/* Mic sensitivity */}
              <div>
                <label className="text-[10px] font-tech font-bold uppercase tracking-wider text-white/40 block mb-1.5">Microphone Input Level</label>
                <select 
                  value={micSensitivity}
                  onChange={(e) => setMicSensitivity(e.target.value)}
                  className="w-full bg-[#0B0B0B] border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl px-3 py-2.5 text-xs text-white outline-none transition-colors cursor-pointer"
                >
                  <option value="low">Low sensitivity (Shield ambient noise)</option>
                  <option value="medium">Medium sensitivity (Quiet office space)</option>
                  <option value="high">High sensitivity (Active voice trigger)</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-display font-black text-white">Billing & Subscriptions</h3>
              <p className="text-xs text-white/50">Manage subscription accounts, update card credentials, and select your workspace plan.</p>
            </div>

            <div className="space-y-6 max-w-xl">
              {/* Plan Cards selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Free Plan Card */}
                <div className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
                  selectedPlan === 'free'
                    ? 'border-white/20 bg-white/[0.02] text-white shadow-lg'
                    : 'border-white/5 bg-black/40 text-white/60 hover:border-white/10'
                }`}>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-tech font-bold text-white/40 uppercase tracking-wider">STANDARD TIER</span>
                        <h4 className="text-base font-display font-black text-white mt-1">Free Plan</h4>
                      </div>
                      {selectedPlan === 'free' && (
                        <span className="px-2 py-0.5 bg-white/10 text-white font-tech font-bold text-[8px] uppercase tracking-wider rounded-lg">ACTIVE</span>
                      )}
                    </div>
                    <div className="text-xl font-display font-black text-white">
                      $0.00 <span className="text-xs font-normal text-white/40">/ month</span>
                    </div>
                    <p className="text-[10px] text-white/50 leading-relaxed font-normal">
                      Includes manual calendar integrations, standard priority queues, and basic analytics.
                    </p>
                  </div>
                  {selectedPlan !== 'free' && (
                    <button 
                      onClick={() => {
                        setSelectedPlan('free');
                        showToast("Switched to Free Plan.");
                      }}
                      className="w-full py-2 bg-transparent text-white border border-white/20 hover:bg-white/10 hover:border-transparent text-[9px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer mt-4"
                    >
                      Downgrade to Free
                    </button>
                  )}
                </div>

                {/* Premium Plan Card */}
                <div className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
                  selectedPlan === 'premium'
                    ? 'border-[#E5B842]/40 bg-[#E5B842]/5 text-[#E5B842] shadow-lg shadow-[#E5B842]/5'
                    : 'border-white/5 bg-black/40 text-white/60 hover:border-white/10'
                }`}>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-tech font-bold text-[#E5B842]/70 uppercase tracking-wider">AI AUTOMATED TIER</span>
                        <h4 className="text-base font-display font-black text-white mt-1">Premium Plan</h4>
                      </div>
                      {selectedPlan === 'premium' && (
                        <span className="px-2 py-0.5 bg-[#E5B842] text-black font-tech font-bold text-[8px] uppercase tracking-wider rounded-lg">ACTIVE</span>
                      )}
                    </div>
                    <div className="text-xl font-display font-black text-white">
                      $19.00 <span className="text-xs font-normal text-white/40">/ month</span>
                    </div>
                    <p className="text-[10px] text-white/50 leading-relaxed font-normal">
                      Unlocks ResQ Autopilot scheduling, AI Guard Rails safety filters, real-time sync, and companion app telemetry.
                    </p>
                  </div>
                  {selectedPlan !== 'premium' && (
                    <button 
                      onClick={() => {
                        setIsPaymentModalOpen(true);
                      }}
                      className="w-full py-2 bg-[#E5B842] hover:bg-[#FFF2CC] text-black text-[9px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer mt-4"
                    >
                      Upgrade to Premium
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Card Details Container */}
              <div className="p-4 bg-black/40 border border-white/[0.03] rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-[#E5B842]" />
                  {selectedPlan === 'premium' && paymentCard.number ? (
                    <div>
                      <span className="text-xs font-semibold block text-white/95">
                        Card ending in {paymentCard.number.slice(-4)}
                      </span>
                      <span className="text-[9px] text-white/40">
                        Expires {paymentCard.expiry || '12/28'} • {paymentCard.name || 'Faizaan Khan'}
                      </span>
                    </div>
                  ) : selectedPlan === 'premium' ? (
                    <div>
                      <span className="text-xs font-semibold block text-white/95">Mastercard ending in 4242</span>
                      <span className="text-[9px] text-white/40">Expires 12 / 2028 • Faizaan Khan</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-semibold block text-white/40">No Payment Method Connected</span>
                      <span className="text-[9px] text-white/30">Link payment method to activate Premium Tier.</span>
                    </div>
                  )}
                </div>
                {selectedPlan === 'premium' && (
                  <button 
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="px-3 py-1.5 border border-white/10 rounded-lg text-[9px] font-bold uppercase tracking-wider text-white/60 hover:text-white hover:border-white/20 transition-all cursor-pointer"
                  >
                    Update Card
                  </button>
                )}
              </div>

              {/* Invoice Actions */}
              <div className="flex gap-2">
                <button 
                  onClick={() => showToast("Downloading last receipt...")}
                  className="flex-1 py-2 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl text-[10px] font-bold uppercase tracking-wider text-white/80 transition-all cursor-pointer text-center"
                >
                  Download Last Invoice
                </button>
                <button 
                  onClick={() => showToast("Redirecting to Stripe portal...")}
                  className="flex-1 py-2 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl text-[10px] font-bold uppercase tracking-wider text-white/80 transition-all cursor-pointer text-center"
                >
                  View Billing Portal
                </button>
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-display font-black text-white">Data Controls</h3>
              <p className="text-xs text-white/50">Export your local databases or opt-in to system backup syncs.</p>
            </div>

            <div className="space-y-5 max-w-lg">
              <div className="p-5 bg-black/40 border border-white/[0.03] rounded-3xl space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Local Workspace Data Package</h4>
                <p className="text-[10px] text-white/50 leading-relaxed">
                  Export all dynamic events, completed habits, streak stats, and local profile configurations into an encrypted JSON backup folder.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={handleExportData}
                    className="px-4 py-2 bg-transparent text-[#E5B842] border border-[#E5B842]/40 hover:bg-[#E5B842] hover:text-black hover:border-transparent text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Export Workspace (JSON)
                  </button>
                  <button 
                    onClick={() => showToast("Browse metadata package trigger.")}
                    className="px-4 py-2 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-wider text-white/60 hover:text-white hover:border-white/20 transition-all cursor-pointer"
                  >
                    Import Backup
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/40 border border-white/[0.03] rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white/85">Automatic Cloud Backups</span>
                  <span className="text-[10px] text-white/40">Secure sync to ResQ Cloud servers hourly</span>
                </div>
                <button 
                  onClick={() => showToast("Cloud backup toggled")}
                  className="w-9 h-5 rounded-full p-0.5 bg-[#E5B842] border border-[#E5B842] relative cursor-pointer"
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-black translate-x-4 transition-transform duration-300" />
                </button>
              </div>
            </div>
          </div>
        );

      case 'storage':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-display font-black text-white">Storage Allocation</h3>
              <p className="text-xs text-white/50">Monitor space used by telemetry files, audio snippets, and logs.</p>
            </div>

            <div className="space-y-5 max-w-lg">
              <div className="p-5 bg-black/40 border border-white/[0.03] rounded-3xl space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/70">Telemetry File Capacity:</span>
                  <span className="text-[#E5B842] font-bold uppercase">1.2 GB of 10.0 GB</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#E5B842] h-full rounded-full w-[12%]" />
                </div>
                <div className="grid grid-cols-2 gap-3 text-[9px] text-white/40 uppercase pt-2">
                  <div>• Voice Snippets: 800 MB</div>
                  <div>• Tasks Database: 120 MB</div>
                  <div>• Habit matrices: 10 MB</div>
                  <div>• Goals files: 270 MB</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/40 border border-white/[0.03] rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white/85">Auto-Purge Telemetry Logs</span>
                  <span className="text-[10px] text-white/40">Clean files older than 30 days</span>
                </div>
                <button 
                  onClick={() => setAutoPurgeLogs(!autoPurgeLogs)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 relative cursor-pointer border ${autoPurgeLogs ? 'bg-[#E5B842] border-[#E5B842]' : 'bg-transparent border-white/20'}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-black transition-transform duration-300 ${autoPurgeLogs ? 'translate-x-4 bg-black' : 'translate-x-0 bg-white/40'}`} />
                </button>
              </div>
            </div>
          </div>
        );

      case 'safety':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-display font-black text-white">Safety Configs</h3>
              <p className="text-xs text-white/50">Manage Guardian AI safety defaults and risk alerts.</p>
            </div>

            <div className="space-y-5 max-w-lg">
              <div className="p-4 bg-black/40 border border-white/[0.03] rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-white/85">Proactive Deadline Shield</span>
                    <span className="text-[10px] text-white/40">Alert when tasks are within 1 hour of deadline</span>
                  </div>
                  <button 
                    onClick={() => showToast("Deadline shield updated")}
                    className="w-9 h-5 rounded-full p-0.5 bg-[#E5B842] border border-[#E5B842] relative cursor-pointer"
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-black translate-x-4 transition-transform duration-300" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-tech font-bold uppercase tracking-wider text-white/40 block mb-1.5">Emergency Response Level</label>
                <select className="w-full bg-[#0B0B0B] border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl px-3 py-2.5 text-xs text-white outline-none transition-colors cursor-pointer">
                  <option>Mute alerts inside scheduled Calendar meetings (Safe Mode)</option>
                  <option>High priority alerts bypass system focus modes (Critical Mode)</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-display font-black text-white">Security & API Access</h3>
              <p className="text-xs text-white/50">Generate authorization credentials and configure two-factor authentication.</p>
            </div>

            <div className="space-y-5 max-w-lg">
              <div className="p-5 bg-black/40 border border-white/[0.03] rounded-3xl space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Developer API Token</h4>
                <p className="text-[10px] text-white/50 leading-relaxed">
                  Authorize third-party scripts or automate notifications via ResQ webhooks. Keep this token private.
                </p>
                <button 
                  type="button"
                  onClick={handleGenerateApiKey}
                  className="w-full py-2.5 bg-transparent text-[#E5B842] border border-[#E5B842]/40 hover:bg-[#E5B842] hover:text-black hover:border-transparent text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer"
                >
                  Generate Live API Key
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/40 border border-white/[0.03] rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white/85">Two-Factor Authentication (2FA)</span>
                  <span className="text-[10px] text-white/40">Secure login checks via companion app authentication</span>
                </div>
                <button 
                  onClick={() => setTwoFactor(!twoFactor)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 relative cursor-pointer border ${twoFactor ? 'bg-[#E5B842] border-[#E5B842]' : 'bg-transparent border-white/20'}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-black transition-transform duration-300 ${twoFactor ? 'translate-x-4 bg-black' : 'translate-x-0 bg-white/40'}`} />
                </button>
              </div>
            </div>
          </div>
        );

      case 'parental':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-display font-black text-white">Focus & Parental Controls</h3>
              <p className="text-xs text-white/50">Enforce workspace usage timers and restrict distractive habits.</p>
            </div>

            <div className="space-y-5 max-w-lg">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/50">Daily Dashboard Access Cap:</span>
                  <span className="text-[#E5B842] font-bold uppercase">{screenLimit} hours</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="12"
                  step="1"
                  value={screenLimit} 
                  onChange={(e) => setScreenLimit(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#E5B842]"
                />
                <p className="text-[10px] text-white/40 leading-relaxed">
                  Enforces a lockout after reaching daily usage caps to ensure a healthy work-life integration.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/40 border border-white/[0.03] rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white/85">Hard Focus Lockout passcode</span>
                  <span className="text-[10px] text-white/40">Require delegate passcode override to change goals</span>
                </div>
                <button 
                  onClick={() => setHardFocusLock(!hardFocusLock)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 relative cursor-pointer border ${hardFocusLock ? 'bg-[#E5B842] border-[#E5B842]' : 'bg-transparent border-white/20'}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-black transition-transform duration-300 ${hardFocusLock ? 'translate-x-4 bg-black' : 'translate-x-0 bg-white/40'}`} />
                </button>
              </div>
            </div>
          </div>
        );

      case 'trusted':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-display font-black text-white">Trusted Contacts</h3>
              <p className="text-xs text-white/50">Delegate emergency task management to authorized colleagues.</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); showToast("Trusted contact saved."); }} className="space-y-4 max-w-lg">
              <div>
                <label className="text-[10px] font-tech font-bold uppercase tracking-wider text-white/40 block mb-1.5">Delegate Email</label>
                <input 
                  type="email" 
                  value={trustedEmail}
                  onChange={(e) => setTrustedEmail(e.target.value)}
                  className="w-full bg-[#0B0B0B] border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-black/40 border border-white/[0.03] rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white/85">Delegate Deadline Breaches</span>
                  <span className="text-[10px] text-white/40">Pings your trusted contact if a critical path task is missed</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setNotifyTrusted(!notifyTrusted)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 relative cursor-pointer border ${notifyTrusted ? 'bg-[#E5B842] border-[#E5B842]' : 'bg-transparent border-white/20'}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-black transition-transform duration-300 ${notifyTrusted ? 'translate-x-4 bg-black' : 'translate-x-0 bg-white/40'}`} />
                </button>
              </div>

              <button 
                type="submit"
                className="py-2.5 px-6 bg-[#E5B842] hover:bg-[#FFF2CC] text-black font-bold uppercase tracking-wider text-[10px] rounded-xl transition-colors cursor-pointer"
              >
                Save Network Config
              </button>
            </form>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-display font-black text-white">Account Status</h3>
              <p className="text-xs text-white/50">Manage subscription parameters and clear database defaults.</p>
            </div>

            <div className="space-y-5 max-w-lg">
              <div className="p-4 bg-black/40 border border-white/[0.03] rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold block text-white/95">Account Level: Developer Account</span>
                  <span className="text-[9px] text-white/40">faizaan@gmail.com</span>
                </div>
                <span className="px-2 py-0.5 bg-[#E5B842]/10 border border-[#E5B842]/30 text-[#E5B842] text-[8px] font-tech font-bold uppercase rounded-lg">GOLD TIER</span>
              </div>

              <div className="p-6 bg-[#090909] border border-status-red/10 rounded-3xl space-y-4">
                <h4 className="text-xs font-bold text-status-red tracking-widest uppercase">Danger Zone</h4>
                <p className="text-[10px] text-white/45 leading-relaxed font-normal">
                  Permanently erase all historical telemetry logs, completed habits matrices, scheduled tasks, and reset workspace defaults. This action is immediate and non-reversible.
                </p>
                <button 
                  type="button"
                  onClick={handleResetData}
                  className="w-full py-2.5 bg-status-red/10 hover:bg-status-red text-status-red hover:text-white border border-status-red/20 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Clear Workspace Database
                </button>
              </div>
            </div>
          </div>
        );

      case 'keyboard':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-display font-black text-white">Keyboard Shortcuts</h3>
              <p className="text-xs text-white/50">Configure keys to trigger features instantly without cursor clicks.</p>
            </div>

            <div className="space-y-5 max-w-lg">
              <div className="p-4 bg-black/40 border border-white/[0.03] rounded-2xl space-y-3.5">
                {[
                  { action: 'Go to Dashboard Home', keys: 'G' },
                  { action: 'Switch to Tasks Tab', keys: 'T' },
                  { action: 'Switch to Calendar Tab', keys: 'C' },
                  { action: 'Dismiss Active Modals / Popups', keys: 'Esc' }
                ].map((item) => (
                  <div key={item.action} className="flex justify-between items-center text-xs">
                    <span className="text-white/70">{item.action}</span>
                    <span className="px-2 py-1 bg-black/60 border border-white/10 rounded-lg text-[9px] font-tech font-bold text-white/60">{item.keys}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center p-4 bg-black/40 border border-white/[0.03] rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white/95">Voice Listener Activation</span>
                  <span className="text-[10px] text-white/40">Toggle micro voice recorder activation</span>
                </div>
                <input 
                  type="text" 
                  value={voiceShortcut}
                  onChange={(e) => setVoiceShortcut(e.target.value)}
                  className="w-24 bg-black/60 border border-white/10 focus:border-[#E5B842]/40 rounded-lg px-2.5 py-1.5 text-center text-[10px] font-tech font-bold text-[#E5B842] outline-none"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-12">
      
      {/* Header */}
      <div className="sticky -top-6 bg-black z-30 border-b border-white/5 pb-6 pt-6 -mt-6">
        <span className="text-xs font-tech font-bold tracking-[0.3em] text-[#E5B842] block mb-2">CONFIG SYSTEM</span>
        <h2 className="text-3xl font-display font-black tracking-tight text-white leading-none">
          Workspace Settings
        </h2>
      </div>

      {/* Settings Grid Panel Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Sub-Sidebar */}
        <div className="w-full lg:w-64 bg-[#090909] border border-white/[0.04] rounded-3xl p-4 layered-shadow-lg flex flex-col space-y-1 shrink-0 lg:sticky lg:top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-1">
          {sidebarTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer ${
                  active 
                    ? 'bg-[#E5B842]/10 border border-[#E5B842]/20 text-[#E5B842] shadow-[0_4px_12px_rgba(229,184,66,0.04)]' 
                    : 'border border-transparent text-white/50 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#E5B842]' : 'text-white/40'}`} />
                <span>{tab.label}</span>
              </div>
            );
          })}
        </div>

        {/* Right Content Panel */}
        <div className="flex-1 w-full bg-[#090909] border border-white/[0.04] rounded-3xl p-6 layered-shadow-lg min-h-[520px]">
          {renderTabContent()}
        </div>

      </div>

      {/* Payment Charges Modal (Mock checkout for Premium) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-6 animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <span className="text-[8px] font-tech font-bold uppercase tracking-[0.2em] text-[#E5B842]">SECURE GATEWAY</span>
                <h3 className="text-lg font-display font-black tracking-tight text-white leading-none mt-1">
                  ResQ Premium Checkout
                </h3>
              </div>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1.5 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={(e) => {
              e.preventDefault();
              setPaymentLoading(true);
              // Simulate loading spinner
              setTimeout(() => {
                setPaymentLoading(false);
                setSelectedPlan('premium');
                setIsPaymentModalOpen(false);
                showToast("Payment successful! Premium activated.");
              }, 2000);
            }} className="space-y-4">
              
              <div>
                <label className="text-[10px] font-tech font-bold uppercase tracking-wider text-white/40 block mb-1.5">Cardholder Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Faizaan Khan"
                  required
                  value={paymentCard.name}
                  onChange={e => setPaymentCard(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-black/60 border border-white/10 hover:border-white/20 focus:border-[#E5B842]/50 focus:ring-1 focus:ring-[#E5B842] rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/25 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-tech font-bold uppercase tracking-wider text-white/40 block mb-1.5">Card Number</label>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="4242 4242 4242 4242"
                    required
                    maxLength="19"
                    value={paymentCard.number}
                    onChange={e => {
                      // format card number with spaces
                      const val = e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
                      setPaymentCard(prev => ({ ...prev, number: val }));
                    }}
                    className="w-full bg-black/60 border border-white/10 hover:border-white/20 focus:border-[#E5B842]/50 focus:ring-1 focus:ring-[#E5B842] rounded-xl pl-4 pr-10 py-2.5 text-xs text-white placeholder-white/25 outline-none transition-all"
                  />
                  <CreditCard className="w-4 h-4 text-white/30 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-tech font-bold uppercase tracking-wider text-white/40 block mb-1.5">Expiry Date</label>
                  <input 
                    type="text"
                    placeholder="MM / YY"
                    required
                    maxLength="5"
                    value={paymentCard.expiry}
                    onChange={e => {
                      const val = e.target.value;
                      setPaymentCard(prev => ({ ...prev, expiry: val }));
                    }}
                    className="w-full bg-black/60 border border-white/10 hover:border-white/20 focus:border-[#E5B842]/50 focus:ring-1 focus:ring-[#E5B842] rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/25 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-tech font-bold uppercase tracking-wider text-white/40 block mb-1.5">Security Code (CVV)</label>
                  <input 
                    type="password"
                    placeholder="•••"
                    required
                    maxLength="3"
                    value={paymentCard.cvv}
                    onChange={e => setPaymentCard(prev => ({ ...prev, cvv: e.target.value }))}
                    className="w-full bg-black/60 border border-white/10 hover:border-white/20 focus:border-[#E5B842]/50 focus:ring-1 focus:ring-[#E5B842] rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/25 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Total cost detail */}
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex justify-between items-center text-xs">
                <span className="text-white/50">Amount Due:</span>
                <span className="text-white font-tech font-bold">$19.00 USD</span>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 bg-[#0F0F0F] border border-white/10 hover:bg-white/[0.05] rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-white/70 hover:text-white cursor-pointer"
                  disabled={paymentLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-[#E5B842] hover:bg-[#FFF2CC] disabled:bg-white/10 disabled:text-white/40 text-black rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer font-bold min-w-[120px]"
                  disabled={paymentLoading}
                >
                  {paymentLoading ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Confirm Pay'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center gap-3 animate-fade-in ${
          toast.type === 'error' 
            ? 'bg-status-red/10 border-status-red/30 text-status-red' 
            : 'bg-black/90 border-[#E5B842]/30 text-[#E5B842]'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          <span className="text-xs font-bold tracking-wide uppercase">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
