import { useState, useEffect } from 'react';
import { 
  Settings, 
  Bell, 
  Palette, 
  LayoutGrid, 
  Volume2, 
  CreditCard, 
  HardDrive, 
  Shield, 
  Heart, 
  User, 
  Check,
  AlertCircle,
  X
} from 'lucide-react';
import { settings as apiSettings, auth, google as apiGoogle, voice } from '../../services/api.js';
import { wakeWordEngine } from '../../services/WakeWordEngine.js';
import voicePersonality from '../../services/VoicePersonality.js';

export default function SettingsPage() {
  const [activeSubTab, setActiveSubTab] = useState('general');
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [googleCalendarDefaultIntegrated, setGoogleCalendarDefaultIntegrated] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);

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

  // Working Hours State
  const [workingHours, setWorkingHours] = useState({
    start: '09:00',
    end: '18:00'
  });

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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [language, setLanguage] = useState('en');
  const [soundVolume, setSoundVolume] = useState(80);

  // Voice AI
  const [aiVoiceEnabled, setAiVoiceEnabled] = useState(true);
  const [voiceSpeed, setVoiceSpeed] = useState(0.92);
  const [voicePitch, setVoicePitch] = useState(1.08);
  const [ambientSound, setAmbientSound] = useState(true);
  const [proactiveAlerts, setProactiveAlerts] = useState(true);
  const [voiceUsage, setVoiceUsage] = useState({ used: 0, limit: 30, remaining: 30, lastResetDate: new Date() });

  // Available voices for selection
  const [voices, setVoices] = useState([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState(() => {
    return localStorage.getItem('resq-selected-voice-name') || '';
  });

  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const list = window.speechSynthesis.getVoices();
        // Filter for English voices
        const englishVoices = list.filter(v => v.lang.startsWith('en'));
        setVoices(englishVoices);
        
        const currentSelected = localStorage.getItem('resq-selected-voice-name');
        if (!currentSelected) {
          if (englishVoices.length > 0) {
            setSelectedVoiceName(englishVoices[0].name);
          }
        }
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (window.speechSynthesis.addEventListener) {
        window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
      } else {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        if (window.speechSynthesis.removeEventListener) {
          window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
        } else {
          window.speechSynthesis.onvoiceschanged = null;
        }
      }
    };
  }, []);

  const handleVoiceChange = (e) => {
    const name = e.target.value;
    setSelectedVoiceName(name);
    localStorage.setItem('resq-selected-voice-name', name);
    
    // Test speak with local browser TTS if available
    if (window.speechSynthesis) {
      const vList = window.speechSynthesis.getVoices();
      const match = vList.find(v => v.name === name);
      if (match) {
        const msg = new SpeechSynthesisUtterance("Voice updated. How does this sound?");
        msg.voice = match;
        window.speechSynthesis.speak(msg);
      }
    }
  };



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

  // Fetch settings from API on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const data = await auth.getMe();
        if (data) {
          setProfile({
            name: data.name || 'Faizaan Khan',
            email: data.email || 'faizaan@gmail.com',
            role: data.plan === 'premium' ? 'Premium Account' : 'Developer Account',
            googleEmail: data.googleEmail || null
          });
          setTheme(data.theme || 'dark');
          setSelectedPlan(data.plan || 'free');
          setFontSize(data.fontSize || 16);
          setIsGoogleConnected(!!data.googleAccessToken);
          setAiVoiceEnabled(data.aiVoiceEnabled !== false);
          if (data.voiceAI) {
            setAiVoiceEnabled(data.voiceAI.enabled !== false);
            setVoiceSpeed(data.voiceAI.voiceSpeed ?? 0.92);
            setVoicePitch(data.voiceAI.voicePitch ?? 1.08);
            setAmbientSound(data.voiceAI.ambientSound !== false);
            setProactiveAlerts(data.voiceAI.proactiveAlerts !== false);
            setVoiceUsage({
              used: data.voiceAI.monthlyCommandsUsed || 0,
              limit: data.voiceAI.monthlyLimit || 30,
              remaining: Math.max(0, (data.voiceAI.monthlyLimit || 30) - (data.voiceAI.monthlyCommandsUsed || 0)),
              lastResetDate: data.voiceAI.lastResetDate
            });
          }
          if (data.workingHours) {
            setWorkingHours({
              start: data.workingHours.start || '09:00',
              end: data.workingHours.end || '18:00'
            });
          }
          try {
            const usage = await voice.getUsage();
            setVoiceUsage(usage);
          } catch (e) {
            console.warn('[SettingsPage] Error fetching voice usage:', e);
          }
        }
      } catch (err) {
        console.error('Failed to load user profile settings:', err);
      }
    };
    fetchUserProfile();
  }, []);

  // Check URL query parameters for Google sync status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sync = params.get('sync');
    if (sync) {
      setTimeout(() => {
        if (sync === 'success') {
          showToast('Google Calendar linked and synchronized successfully!');
        } else if (sync === 'email_mismatch') {
          showToast('Google account email must match your ResQ registration email.', 'error');
        } else if (sync === 'error') {
          showToast('Failed to link Google Calendar. Please try again.', 'error');
        }
        params.delete('sync');
        const newSearch = params.toString();
        window.history.replaceState({}, document.title, window.location.pathname + (newSearch ? `?${newSearch}` : ''));
      }, 0);
    }
  }, []);

  const handleLinkGoogle = async () => {
    try {
      const response = await apiGoogle.getAuthUrl();
      if (response && response.url) {
        window.location.href = response.url; // Redirect to Google OAuth
      } else {
        showToast('Could not retrieve Google Authorization URL.', 'error');
      }
    } catch (err) {
      console.error('Google Link Error:', err);
      showToast('Failed to retrieve authorization URL.', 'error');
    }
  };

  const handleSyncGoogle = async () => {
    try {
      setSyncLoading(true);
      showToast('Syncing Google Calendar events...', 'info');
      const response = await apiGoogle.sync();
      if (response && response.success) {
        showToast(`Sync complete! Synced ${response.googleEventCount} events.`);
      }
    } catch (err) {
      console.error('Google Sync Error:', err);
      showToast('Failed to sync Google Calendar.', 'error');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleToggleAiVoice = async () => {
    const newValue = !aiVoiceEnabled;
    if (!newValue) {
      await voicePersonality.speak("Voice AI disabled. You can re-enable me anytime in Settings.");
      wakeWordEngine.destroy();
      try {
        await apiSettings.updateVoiceSettings({ enabled: false });
        setAiVoiceEnabled(false);
        showToast("Voice AI disabled.");
        window.dispatchEvent(new CustomEvent('resq:ai-voice-toggle', { detail: { enabled: false } }));
      } catch (err) {
        console.error('Failed to update Voice AI toggle:', err);
        showToast('Failed to update Voice AI setting.', 'error');
      }
    } else {
      try {
        const response = await apiSettings.updateVoiceSettings({ enabled: true });
        
        if (response.blocked && response.reason === 'limit_reached') {
          showToast("Usage limit reached. Upgrade to Premium to enable Voice AI.", "error");
          setIsPaymentModalOpen(true);
          return;
        }
        
        setAiVoiceEnabled(true);
        const userData = await auth.getMe();
        if (userData) {
          wakeWordEngine.initialize(userData);
        }
        showToast("Voice AI enabled successfully!");
        window.dispatchEvent(new CustomEvent('resq:ai-voice-toggle', { detail: { enabled: true } }));
        
        await voicePersonality.speak("I'm back. Just say Hey ResQ whenever you need me.");
      } catch (err) {
        console.error('Failed to update Voice AI toggle:', err);
        showToast('Failed to update Voice AI setting.', 'error');
      }
    }
  };

  const handleVoiceSpeedChange = (e) => {
    const val = parseFloat(e.target.value);
    setVoiceSpeed(val);
  };

  const handleVoiceSpeedSave = async () => {
    try {
      await apiSettings.updateVoiceSettings({ voiceSpeed });
      showToast("Voice speed updated.");
    } catch (err) {
      console.error(err);
      showToast("Failed to save voice speed", "error");
    }
  };

  const handleVoicePitchChange = (e) => {
    const val = parseFloat(e.target.value);
    setVoicePitch(val);
  };

  const handleVoicePitchSave = async () => {
    try {
      await apiSettings.updateVoiceSettings({ voicePitch });
      showToast("Voice pitch updated.");
    } catch (err) {
      console.error(err);
      showToast("Failed to save voice pitch", "error");
    }
  };

  const handleToggleAmbientSound = async () => {
    const val = !ambientSound;
    setAmbientSound(val);
    try {
      await apiSettings.updateVoiceSettings({ ambientSound: val });
      showToast(`Ambient Focus Sound ${val ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error(err);
      setAmbientSound(!val);
      showToast("Failed to update ambient sound setting.", "error");
    }
  };

  const handleToggleProactiveAlerts = async () => {
    const val = !proactiveAlerts;
    setProactiveAlerts(val);
    try {
      await apiSettings.updateVoiceSettings({ proactiveAlerts: val });
      showToast(`Proactive Alerts ${val ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error(err);
      setProactiveAlerts(!val);
      showToast("Failed to update proactive alerts setting.", "error");
    }
  };

  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1:  return "st";
      case 2:  return "nd";
      case 3:  return "rd";
      default: return "th";
    }
  };

  const getNextResetDateStr = (lastResetDate) => {
    const date = lastResetDate ? new Date(lastResetDate) : new Date();
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    const month = nextMonth.toLocaleDateString('en-US', { month: 'long' });
    const day = nextMonth.getDate();
    return `${month} ${day}${getOrdinalSuffix(day)}`;
  };

  const handleDisconnectGoogle = async () => {
    if (window.confirm('Are you sure you want to disconnect Google Calendar?')) {
      try {
        await apiGoogle.disconnect();
        setIsGoogleConnected(false);
        setProfile(prev => ({ ...prev, googleEmail: null }));
        showToast('Google Calendar disconnected.');
      } catch (err) {
        console.error('Google Disconnect Error:', err);
        showToast('Failed to disconnect Google Calendar.', 'error');
      }
    }
  };

  const handleToggleGoogleDefaultIntegrated = async () => {
    try {
      const newValue = !googleCalendarDefaultIntegrated;
      await apiSettings.updateGoogleCalendarDefaultIntegrated(newValue);
      setGoogleCalendarDefaultIntegrated(newValue);
      showToast(newValue ? 'Google Calendar auto-sync enabled by default' : 'Google Calendar auto-sync disabled by default');
    } catch (err) {
      console.error('Failed to update integration preference:', err);
      showToast('Failed to update integration preference', 'error');
    }
  };

  // Apply root font-size change
  const handleFontSizeChange = async (size) => {
    try {
      await apiSettings.updateFontSize(size);
      setFontSize(size);
      localStorage.setItem('resq-font-size', size);
      document.documentElement.style.fontSize = `${size}px`;
      document.documentElement.style.setProperty('--base-font-size', `${size}px`);
    } catch (err) {
      console.error('Error updating font size:', err);
      showToast('Failed to update font size', 'error');
    }
  };

  const handleThemeChange = async (newTheme) => {
    try {
      await apiSettings.updateTheme(newTheme);
      setTheme(newTheme);
      showToast(`Theme updated to ${newTheme} successfully!`);
    } catch (err) {
      console.error('Error updating theme:', err);
      showToast('Failed to update theme', 'error');
    }
  };

  // Apply font size on mount
  useEffect(() => {
    const saved = localStorage.getItem('resq-font-size');
    if (saved) {
      document.documentElement.style.fontSize = `${saved}px`;
      document.documentElement.style.setProperty('--base-font-size', `${saved}px`);
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

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      await apiSettings.updateWorkingHours(workingHours.start, workingHours.end);
      showToast("Profile settings and working hours updated successfully!");
    } catch (err) {
      console.error('Error saving settings:', err);
      showToast("Failed to save settings", "error");
    }
  };

  const handleResetData = () => {
    if (window.confirm("Are you sure you want to reset all workspace data? This cannot be undone.")) {
      showToast("Workspace data cleared.", "error");
    }
  };

  // Settings Sidebar tabs definition
  const sidebarTabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'personalization', label: 'Personalization', icon: Palette },
    { id: 'apps', label: 'Apps', icon: LayoutGrid },
    { id: 'voice', label: 'Voice AI', icon: Volume2 },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'account', label: 'Account', icon: User }
  ];

  // Render content area based on active tab
  const renderTabContent = () => {
    switch (activeSubTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-display font-black text-white">General Settings</h3>
              <p className="text-sm text-white/50">Manage your profile information and main workspace defaults.</p>
            </div>
            
            <form onSubmit={handleProfileSave} className="space-y-4 max-w-lg">
              <div>
                <label className="text-sm font-tech font-bold uppercase tracking-wider text-white/70 block mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full bg-[#0B0B0B] border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-tech font-bold uppercase tracking-wider text-white/70 block mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={profile.email}
                  disabled
                  className="w-full bg-[#0B0B0B] border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl px-4 py-2.5 text-sm text-white/50 cursor-not-allowed outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-tech font-bold uppercase tracking-wider text-white/70 block mb-1.5">Working Hours Start <span className="text-white/40 font-sans normal-case tracking-normal">(Optional)</span></label>
                  <input 
                    type="text" 
                    placeholder="e.g. 09:00"
                    value={workingHours.start}
                    onChange={(e) => setWorkingHours({ ...workingHours, start: e.target.value })}
                    className="w-full bg-[#0B0B0B] border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-tech font-bold uppercase tracking-wider text-white/70 block mb-1.5">Working Hours End <span className="text-white/40 font-sans normal-case tracking-normal">(Optional)</span></label>
                  <input 
                    type="text" 
                    placeholder="e.g. 18:00"
                    value={workingHours.end}
                    onChange={(e) => setWorkingHours({ ...workingHours, end: e.target.value })}
                    className="w-full bg-[#0B0B0B] border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-tech font-bold uppercase tracking-wider text-white/70 block mb-1.5">Language</label>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-[#0B0B0B] border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-colors cursor-pointer"
                  >
                    <option value="en">English (US)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                className="py-2.5 px-6 bg-[#E5B842] hover:bg-[#FFF2CC] text-black font-bold uppercase tracking-wider text-sm rounded-xl transition-colors cursor-pointer mt-4"
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
              <p className="text-sm text-white/50">Configure where and how you receive alerts and summaries.</p>
            </div>

            <div className="space-y-4 max-w-lg">
              <div className="flex items-center justify-between p-4 bg-black/40 border border-white/[0.03] rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white/85">Push Notifications</span>
                  <span className="text-sm text-white/70">In web browser panel</span>
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
                  <span className="text-sm font-semibold text-white/85">Phone Screen Push Sync</span>
                  <span className="text-sm text-white/70">Receive notifications on companion mobile app</span>
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
                  <span className="text-sm font-semibold text-white/85">Daily Email Briefings</span>
                  <span className="text-sm text-white/70">Recap metrics & completed tasks</span>
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
                  <span className="text-sm font-semibold text-white/85">Critical Deadline Warnings</span>
                  <span className="text-sm text-white/70">Warning alerts for upcoming deadlines</span>
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
              <p className="text-sm text-white/50">Customize display themes, accents, and accessibility scales.</p>
            </div>

            <div className="space-y-5 max-w-lg">
              {/* Theme selection */}
              <div>
                <label className="text-sm font-tech font-bold uppercase tracking-wider text-white/70 block mb-2.5">Display Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {['dark', 'light', 'matrix'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleThemeChange(t)}
                      className={`py-2.5 px-1 text-sm font-bold uppercase tracking-wider rounded-xl border text-center transition-all cursor-pointer ${
                        theme === t 
                          ? 'border-[#E5B842] bg-[#E5B842]/10 text-[#E5B842] shadow-[0_0_12px_rgba(229,184,66,0.1)]' 
                          : 'border-white/5 bg-white/[0.02] text-white/70 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>


              {/* Font Size slider */}
              <div className="space-y-2.5 pt-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/50">Interface Font Size:</span>
                  <div className="flex items-center gap-3">
                    {fontSize !== 16 && (
                      <button 
                        type="button"
                        onClick={() => handleFontSizeChange(16)}
                        className="text-sm font-tech text-white/70 hover:text-white uppercase tracking-wider border border-white/10 hover:border-white/30 px-2 py-0.5 rounded transition-colors cursor-pointer focus:outline-hidden"
                      >
                        Reset
                      </button>
                    )}
                    <span className="text-[#E5B842] font-bold uppercase w-8 text-right">{fontSize}px</span>
                  </div>
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
                <div className="flex justify-between text-sm font-tech text-white/60 uppercase">
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
              <p className="text-sm text-white/50">Sync connected calendars and authorize third-party workspace integrations.</p>
            </div>

            <div className="space-y-5 max-w-lg">
              {/* Google Calendar Sync */}
              <div className="space-y-3 p-5 bg-black/40 border border-white/[0.03] rounded-3xl">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <div>
                    <span className="text-sm font-tech font-bold text-[#E5B842] uppercase tracking-wider">CALENDAR LAYERS</span>
                    <h4 className="text-sm font-bold text-white mt-0.5">Google Calendar Sync</h4>
                  </div>
                  <span className={`px-2 py-0.5 font-tech font-bold text-sm uppercase tracking-wider rounded-lg ${
                    isGoogleConnected ? 'bg-[#E5B842]/10 text-[#E5B842] border border-[#E5B842]/20' : 'bg-white/5 text-white/70 border border-white/10'
                  }`}>
                    {isGoogleConnected ? 'CONNECTED' : 'DISCONNECTED'}
                  </span>
                </div>

                <p className="text-sm text-white/50 leading-relaxed font-normal">
                  Link your Google Calendar to synchronize your schedule. Focus Blocks booked in ResQ will be automatically pushed to Google Calendar, and your external meetings will be synced back.
                </p>

                {isGoogleConnected && profile.googleEmail && (
                  <div className="flex items-center gap-2 text-sm text-white/70 font-semibold bg-[#E5B842]/5 border border-[#E5B842]/10 rounded-xl px-3 py-2 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E5B842] animate-pulse" />
                    <span>Connected account: <strong className="text-white">{profile.googleEmail}</strong></span>
                  </div>
                )}

                {/* Auto-Integrate Toggle */}
                <div className="flex items-center justify-between p-3.5 bg-black/40 border border-white/[0.03] rounded-2xl mt-2">
                  <div className="flex flex-col pr-4">
                    <span className="text-sm font-semibold text-white/85">Integrate Google Calendar by Default</span>
                    <span className="text-sm text-white/70 leading-normal">Automatically sync events in the background when viewing the calendar.</span>
                  </div>
                  <button 
                    type="button"
                    onClick={handleToggleGoogleDefaultIntegrated}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 relative cursor-pointer border shrink-0 ${googleCalendarDefaultIntegrated ? 'bg-[#E5B842] border-[#E5B842]' : 'bg-transparent border-white/20'}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-black transition-transform duration-300 ${googleCalendarDefaultIntegrated ? 'translate-x-4 bg-black' : 'translate-x-0 bg-white/40'}`} />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {isGoogleConnected ? (
                    <>
                      <button 
                        onClick={handleSyncGoogle}
                        disabled={syncLoading}
                        className="px-4 py-2 bg-[#E5B842] hover:bg-[#FFF2CC] disabled:opacity-50 text-black text-sm font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        {syncLoading ? 'Syncing...' : 'Sync Now'}
                      </button>
                      <button 
                        onClick={handleDisconnectGoogle}
                        className="px-4 py-2 bg-transparent text-red-400 border border-red-500/20 hover:bg-red-500/10 hover:border-transparent text-sm font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={handleLinkGoogle}
                      className="px-5 py-2.5 bg-transparent text-[#E5B842] border border-[#E5B842]/40 hover:bg-[#E5B842] hover:text-black hover:border-transparent text-sm font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer font-bold"
                    >
                      Link Google Calendar
                    </button>
                  )}
                </div>
              </div>

              {/* Extra Integrations removed per feedback */}
            </div>
          </div>
        );

      case 'voice':
        return (
          <div className="space-y-6">
            <div className="border-b border-white/5 pb-4">
              <h3 className="text-lg font-display font-black text-white flex items-center gap-2">
                🎙️ AI Voice Assistant
              </h3>
              <p className="text-sm text-white/50 mt-1">Control how ResQ listens and responds</p>
            </div>

            <div className="space-y-6 max-w-lg">
              {/* Enable Voice AI Toggle */}
              <div className="flex items-center justify-between p-4 bg-black/40 border border-white/[0.03] rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white/85">Enable Voice AI</span>
                  <span className="text-sm text-white/70">Activate hands-free 'Hey ResQ' control</span>
                </div>
                <button 
                  onClick={handleToggleAiVoice}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 relative cursor-pointer border shrink-0 ${aiVoiceEnabled ? 'bg-[#E5B842] border-[#E5B842]' : 'bg-transparent border-white/20'}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-black transition-transform duration-300 ${aiVoiceEnabled ? 'translate-x-4 bg-black' : 'translate-x-0 bg-white/40'}`} />
                </button>
              </div>

              {/* Monthly Usage (Free Plan Only) */}
              {selectedPlan === 'free' && voiceUsage && (
                <div className="space-y-2.5 p-5 bg-black/40 border border-white/[0.03] rounded-3xl">
                  <div className="flex justify-between items-center text-sm font-tech font-bold uppercase tracking-wider text-white/70">
                    <span>Monthly Usage (Free Plan)</span>
                    <span className="text-white/60">{voiceUsage.used} / {voiceUsage.limit} commands used</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        voiceUsage.remaining === 0 ? 'bg-red-500' : voiceUsage.remaining < 5 ? 'bg-amber-500' : 'bg-[#E5B842]'
                      }`}
                      style={{ width: `${Math.min(100, (voiceUsage.used / voiceUsage.limit) * 100)}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-sm text-white/70 font-medium">
                      Resets on {getNextResetDateStr(voiceUsage.lastResetDate)}
                    </span>
                    <button
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="text-[#E5B842] hover:text-[#FFF2CC] font-tech font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Upgrade to Premium — Unlimited Voice AI
                    </button>
                  </div>
                </div>
              )}

              {/* Configurations List */}
              <div className="space-y-4">
                {/* Wake Word (fixed) */}
                <div className="flex justify-between items-center p-3.5 bg-black/40 border border-white/[0.03] rounded-xl">
                  <span className="text-sm text-white/70">Wake Word</span>
                  <span className="px-3 py-1 bg-black/60 border border-white/10 rounded-lg text-sm font-tech font-bold text-[#E5B842]">
                    "Hey ResQ" (fixed)
                  </span>
                </div>

                {/* Voice Selection Dropdown removed per feedback */}

                {/* Voice Speed Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/50">Voice Speed</span>
                    <span className="text-[#E5B842] font-bold uppercase text-sm">
                      {voiceSpeed === 0.92 ? 'Normal (0.92x)' : `${voiceSpeed}x`}
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="2.0"
                    step="0.05"
                    value={voiceSpeed} 
                    onChange={handleVoiceSpeedChange}
                    onMouseUp={handleVoiceSpeedSave}
                    onTouchEnd={handleVoiceSpeedSave}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#E5B842]"
                  />
                  <div className="flex justify-between text-sm font-tech text-white/60 uppercase">
                    <span>Slow</span>
                    <span>Fast</span>
                  </div>
                </div>

                {/* Voice Pitch Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/50">Voice Pitch</span>
                    <span className="text-[#E5B842] font-bold uppercase text-sm">
                      {voicePitch === 1.08 ? 'Natural (1.08x)' : `${voicePitch}x`}
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="2.0"
                    step="0.05"
                    value={voicePitch} 
                    onChange={handleVoicePitchChange}
                    onMouseUp={handleVoicePitchSave}
                    onTouchEnd={handleVoicePitchSave}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#E5B842]"
                  />
                  <div className="flex justify-between text-sm font-tech text-white/60 uppercase">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>

                {/* Ambient Focus Sound Toggle */}
                <div className="flex items-center justify-between p-4 bg-black/40 border border-white/[0.03] rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white/85">Ambient Focus Sound</span>
                    <span className="text-sm text-white/70">Play white noise automatically in focus mode</span>
                  </div>
                  <button 
                    onClick={handleToggleAmbientSound}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 relative cursor-pointer border shrink-0 ${ambientSound ? 'bg-[#E5B842] border-[#E5B842]' : 'bg-transparent border-white/20'}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-black transition-transform duration-300 ${ambientSound ? 'translate-x-4 bg-black' : 'translate-x-0 bg-white/40'}`} />
                  </button>
                </div>

                {/* Proactive Alerts Toggle */}
                <div className="flex items-center justify-between p-4 bg-black/40 border border-white/[0.03] rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white/85">Proactive Alerts</span>
                    <span className="text-sm text-white/70">Guardian can suggest schedule modifications</span>
                  </div>
                  <button 
                    onClick={handleToggleProactiveAlerts}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 relative cursor-pointer border shrink-0 ${proactiveAlerts ? 'bg-[#E5B842] border-[#E5B842]' : 'bg-transparent border-white/20'}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-black transition-transform duration-300 ${proactiveAlerts ? 'translate-x-4 bg-black' : 'translate-x-0 bg-white/40'}`} />
                  </button>
                </div>
              </div>

              {/* What Voice AI can do / cannot do details card removed per feedback */}
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-display font-black text-white">Billing & Subscriptions</h3>
              <p className="text-sm text-white/50">Manage subscription accounts, update card credentials, and select your workspace plan.</p>
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
                        <span className="text-sm font-tech font-bold text-white/70 uppercase tracking-wider">STANDARD TIER</span>
                        <h4 className="text-sm font-display font-black text-white mt-1">Free Plan</h4>
                      </div>
                      {selectedPlan === 'free' && (
                        <span className="px-2 py-0.5 bg-white/10 text-white font-tech font-bold text-sm uppercase tracking-wider rounded-lg">ACTIVE</span>
                      )}
                    </div>
                    <div className="text-xl font-display font-black text-white">
                      $0.00 <span className="text-sm font-normal text-white/70">/ month</span>
                    </div>
                    <p className="text-sm text-white/50 leading-relaxed font-normal">
                      Includes manual calendar integrations, standard priority queues, and basic analytics.
                    </p>
                  </div>
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
                        <span className="text-sm font-tech font-bold text-[#E5B842]/70 uppercase tracking-wider">AI AUTOMATED TIER</span>
                        <h4 className="text-sm font-display font-black text-white mt-1">Premium Plan</h4>
                      </div>
                      {selectedPlan === 'premium' && (
                        <span className="px-2 py-0.5 bg-[#E5B842] text-black font-tech font-bold text-sm uppercase tracking-wider rounded-lg">ACTIVE</span>
                      )}
                    </div>
                    <div className="text-xl font-display font-black text-white">
                      $19.00 <span className="text-sm font-normal text-white/70">/ month</span>
                    </div>
                    <p className="text-sm text-white/50 leading-relaxed font-normal">
                      Unlocks ResQ Autopilot scheduling, AI Guard Rails safety filters, real-time sync, and companion app telemetry.
                    </p>
                  </div>
                  {selectedPlan !== 'premium' && (
                    <button 
                      onClick={() => {
                        setIsPaymentModalOpen(true);
                      }}
                      className="w-full py-2 bg-[#E5B842] hover:bg-[#FFF2CC] text-black text-sm font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer mt-4"
                    >
                      Upgrade to Premium
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Card Details Removed */}

              {/* Invoice Actions Removed */}
            </div>
          </div>
        );



      case 'account':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-display font-black text-white">Account Status</h3>
              <p className="text-sm text-white/50">Manage subscription parameters and clear database defaults.</p>
            </div>

            <div className="space-y-5 max-w-lg">
              <div className="p-4 bg-black/40 border border-white/[0.03] rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-sm font-semibold block text-white/95">Account Level: Developer Account</span>
                  <span className="text-sm text-white/70">faizaan@gmail.com</span>
                </div>
                <span className="px-2 py-0.5 bg-[#E5B842]/10 border border-[#E5B842]/30 text-[#E5B842] text-sm font-tech font-bold uppercase rounded-lg">GOLD TIER</span>
              </div>

              <div className="p-6 bg-[#090909] border border-status-red/10 rounded-3xl space-y-4">
                <h4 className="text-sm font-bold text-status-red tracking-widest uppercase">Danger Zone</h4>
                <p className="text-sm text-white/45 leading-relaxed font-normal">
                  Permanently erase all historical telemetry logs, completed habits matrices, scheduled tasks, and reset workspace defaults. This action is immediate and non-reversible.
                </p>
                <button 
                  type="button"
                  onClick={handleResetData}
                  className="w-full py-2.5 bg-status-red/10 hover:bg-status-red text-status-red hover:text-white border border-status-red/20 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Clear Workspace Database
                </button>
              </div>
            </div>
          </div>
        );


      default:
        return null;
    }
  };

  return (
    <div className="space-y-5 lg:space-y-8 animate-fade-in font-sans pb-12">
      
      {/* Header */}
      <div className="sticky -top-6 bg-black z-30 border-b border-white/5 pb-4 lg:pb-6 pt-4 lg:pt-6 -mt-2 lg:-mt-6">
        <span className="text-xs lg:text-sm font-tech font-bold tracking-[0.3em] text-[#E5B842] block mb-1.5 lg:mb-2">CONFIG SYSTEM</span>
        <h2 className="text-2xl lg:text-3xl font-display font-black tracking-tight text-white leading-none">
          Workspace Settings
        </h2>
      </div>

      {/* Settings Grid Panel Layout */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-start">
        
        {/* Settings Tabs — Horizontal scroll on mobile, vertical sidebar on desktop */}
        <div className="w-full lg:w-64 shrink-0">
          {/* Mobile: horizontal scrollable tabs */}
          <div className="flex lg:hidden gap-2 overflow-x-auto scrollbar-none pb-2 -mx-1 px-1">
            {sidebarTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  style={{ minHeight: 'auto' }}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-xl whitespace-nowrap border shrink-0 transition-all cursor-pointer ${
                    active
                      ? 'bg-[#E5B842]/10 border-[#E5B842]/20 text-[#E5B842]'
                      : 'border-white/5 text-white/50 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#E5B842]' : 'text-white/40'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Desktop: vertical sidebar */}
          <div className="hidden lg:flex flex-col bg-[#090909] border border-white/[0.04] rounded-3xl p-4 layered-shadow-lg space-y-1 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
            {sidebarTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeSubTab === tab.id;
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer ${
                    active 
                      ? 'bg-[#E5B842]/10 border border-[#E5B842]/20 text-[#E5B842] shadow-[0_4px_12px_rgba(229,184,66,0.04)]' 
                      : 'border border-transparent text-white/50 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#E5B842]' : 'text-white/70'}`} />
                  <span>{tab.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Content Panel */}
        <div className="flex-1 w-full bg-[#090909] border border-white/[0.04] rounded-3xl p-4 lg:p-6 layered-shadow-lg min-h-[400px] lg:min-h-[520px]">
          {renderTabContent()}
        </div>

      </div>

      {/* Payment Charges Modal (Mock checkout for Premium) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div 
            className="bg-[#0A0A0A] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 w-full sm:max-w-md shadow-2xl relative space-y-5 sm:space-y-6 animate-slide-up-sheet sm:animate-scale-up max-h-[95vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <span className="text-sm font-tech font-bold uppercase tracking-[0.2em] text-[#E5B842]">SECURE GATEWAY</span>
                <h3 className="text-lg font-display font-black tracking-tight text-white leading-none mt-1">
                  ResQ Premium Checkout
                </h3>
              </div>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1.5 hover:bg-white/5 rounded-xl transition-colors text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              setPaymentLoading(true);
              try {
                // Simulate secure payment processing
                await new Promise(resolve => setTimeout(resolve, 1500));
                await apiSettings.updatePlan('premium');
                setPaymentLoading(false);
                setSelectedPlan('premium');
                setIsPaymentModalOpen(false);
                showToast("Payment successful! Premium activated.");
              } catch (err) {
                setPaymentLoading(false);
                console.error('Error upgrading plan:', err);
                showToast('Failed to upgrade plan', 'error');
              }
            }} className="space-y-4">
              
              <div>
                <label className="text-sm font-tech font-bold uppercase tracking-wider text-white/70 block mb-1.5">Cardholder Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Faizaan Khan"
                  required
                  value={paymentCard.name}
                  onChange={e => setPaymentCard(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-black/60 border border-white/10 hover:border-white/20 focus:border-[#E5B842]/50 focus:ring-1 focus:ring-[#E5B842] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-sm font-tech font-bold uppercase tracking-wider text-white/70 block mb-1.5">Card Number</label>
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
                    className="w-full bg-black/60 border border-white/10 hover:border-white/20 focus:border-[#E5B842]/50 focus:ring-1 focus:ring-[#E5B842] rounded-xl pl-4 pr-10 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-all"
                  />
                  <CreditCard className="w-4 h-4 text-white/60 absolute right-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-tech font-bold uppercase tracking-wider text-white/70 block mb-1.5">Expiry Date</label>
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
                    className="w-full bg-black/60 border border-white/10 hover:border-white/20 focus:border-[#E5B842]/50 focus:ring-1 focus:ring-[#E5B842] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-tech font-bold uppercase tracking-wider text-white/70 block mb-1.5">Security Code (CVV)</label>
                  <input 
                    type="password"
                    placeholder="•••"
                    required
                    maxLength="3"
                    value={paymentCard.cvv}
                    onChange={e => setPaymentCard(prev => ({ ...prev, cvv: e.target.value }))}
                    className="w-full bg-black/60 border border-white/10 hover:border-white/20 focus:border-[#E5B842]/50 focus:ring-1 focus:ring-[#E5B842] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Total cost detail */}
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex justify-between items-center text-sm">
                <span className="text-white/50">Amount Due:</span>
                <span className="text-white font-tech font-bold">$19.00 USD</span>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 bg-[#0F0F0F] border border-white/10 hover:bg-white/[0.05] rounded-xl text-sm font-bold uppercase tracking-wider transition-all text-white/70 hover:text-white cursor-pointer"
                  disabled={paymentLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-[#E5B842] hover:bg-[#FFF2CC] disabled:bg-white/10 disabled:text-white/70 text-black rounded-xl text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer font-bold min-w-[120px]"
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
        <div className={`fixed bottom-20 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-50 px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center gap-3 animate-fade-in ${
          toast.type === 'error' 
            ? 'bg-status-red/10 border-status-red/30 text-status-red' 
            : 'bg-black/90 border-[#E5B842]/30 text-[#E5B842]'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          <span className="text-sm font-bold tracking-wide uppercase">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
