import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, Send, Volume2, VolumeX } from 'lucide-react';
import { voice as apiVoice } from '../../services/api.js';
import PremiumGuard from '../Shared/PremiumGuard.jsx';

export default function VoiceAIPage({ setCurrentTab }) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello! I am your ResQ AI companion. Ask me to outline your day, list your critical deadlines, or organize calendar blocks for you." }
  ]);
  const [inputText, setInputText] = useState('');
  const [textOnlyMode, setTextOnlyMode] = useState(false);
  const recognitionRef = useRef(null);

  const sampleQuestions = [
    { q: "What is due today?" },
    { q: "Organize my afternoon" },
    { q: "Check my habit strengths" }
  ];

  // Helper to select the polished female voice
  const speakResponse = (text) => {
    if (isMuted) return;
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    let voice = voices.find(v => v.name.includes('Google US English') && v.lang.startsWith('en'));
    if (!voice) {
      voice = voices.find(v => v.name.includes('Samantha') && v.lang.startsWith('en'));
    }
    if (!voice) {
      voice = voices.find(v => v.name.includes('Zira') && v.lang.startsWith('en'));
    }
    
    if (voice) {
      utterance.voice = voice;
    }
    utterance.pitch = 1.15;
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const handleVoiceResponse = (e) => {
      const result = e.detail;
      if (result && result.response) {
        setIsProcessing(false);
        setMessages(prev => [...prev, { role: 'ai', text: result.response }]);
        // GlobalVoiceAssistant handles speaking the response, so we don't call speakResponse here
      }
    };
    
    window.addEventListener('resq:voice-response-received', handleVoiceResponse);
    return () => window.removeEventListener('resq:voice-response-received', handleVoiceResponse);
  }, []);

  const handleSend = async (textVal) => {
    if (!textVal.trim() || isProcessing) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: textVal }]);
    setInputText('');
    setIsProcessing(true);

    // Dispatch event to GlobalVoiceAssistant
    window.dispatchEvent(new CustomEvent('resq:send-text-command', { detail: { text: textVal } }));
  };

  const startLocalRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // stopped
      }
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = (event) => {
      const speechText = event.results[0][0].transcript;
      handleSend(speechText);
    };

    rec.onerror = (event) => {
      console.error('Local speech error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        alert("Microphone access is blocked! Please allow microphone access in your browser settings URL bar.");
      } else if (event.error === 'no-speech') {
        console.warn("No speech detected.");
      }
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // stopped
        }
      }
      setIsListening(false);
    } else {
      startLocalRecognition();
    }
  };

  // Clean up any ongoing speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const content = (
    <div className="animate-fade-in flex flex-col h-full min-h-[75vh] lg:min-h-[82vh] font-sans">
      
      {/* Top Header */}
      <div className="border-b border-white/5 pb-4 lg:pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 lg:mb-8 shrink-0">
        <div>
          <span className="text-xs lg:text-sm font-tech font-bold tracking-[0.3em] text-[#E5B842] block mb-1.5 lg:mb-2 uppercase">COMMAND & ASK</span>
          <h2 className="text-2xl lg:text-3xl font-display font-black tracking-tight text-white leading-none">
            AI Companion
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {/* Text-Only Toggle */}
          <button
            onClick={() => {
              setTextOnlyMode(!textOnlyMode);
              if (!textOnlyMode) {
                // Switching to text-only mode
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                setIsMuted(true);
                if (isListening) toggleListening();
              }
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-2 ${
              textOnlyMode ? 'bg-[#E5B842]/10 border-[#E5B842]/30 text-[#E5B842] shadow-[0_0_10px_rgba(229,184,66,0.1)]' : 'bg-[#0B0B0B] border-white/10 text-white/50 hover:text-white hover:border-white/20'
            }`}
          >
            {textOnlyMode ? 'Text Mode ON' : 'Enable Text Mode'}
          </button>
          
          {/* Voice Output Mute Toggle */}
          <button 
            onClick={() => {
              if (!isMuted && 'speechSynthesis' in window) window.speechSynthesis.cancel();
              setIsMuted(!isMuted);
              if (textOnlyMode && isMuted) setTextOnlyMode(false); // Unmuting means leaving text-only mode
            }}
            className={`p-2.5 rounded-xl border transition-all duration-300 cursor-pointer ${
              isMuted ? 'bg-status-red/10 border-status-red/30 text-status-red hover:bg-status-red/20' : 'bg-[#E5B842]/10 border-[#E5B842]/30 text-[#E5B842] hover:bg-[#E5B842]/20'
            }`}
            title={isMuted ? "Unmute AI Voice" : "Mute AI Voice"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main chat window */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 p-4 lg:p-6 bg-[#090909] border border-white/[0.04] rounded-3xl layered-shadow-lg mb-5 lg:mb-8 min-h-[240px] lg:min-h-[300px]">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`max-w-xl p-4 rounded-2xl border leading-relaxed text-sm font-normal ${
              msg.role === 'ai' 
                ? 'bg-white/[0.01] border-[#E5B842]/20 text-white self-start relative overflow-hidden card-shine-sweep' 
                : 'bg-black/40 border border-white/[0.03] text-white/85 ml-auto'
            }`}
          >
            {msg.role === 'ai' && (
              <div className="flex items-center gap-1.5 mb-1.5 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-[#E5B842]" />
                <span className="text-sm font-bold text-white uppercase font-display">ResQ AI</span>
              </div>
            )}
            <p>{msg.text}</p>
          </div>
        ))}

        {isProcessing && (
          <div className="max-w-xs p-4 rounded-2xl bg-white/[0.01] border border-[#E5B842]/20 text-white/70 text-sm font-medium animate-pulse font-display relative overflow-hidden card-shine-sweep">
            Companion is formulating response...
          </div>
        )}
        
        {isListening && !isProcessing && (
          <div className="max-w-xs p-4 rounded-2xl bg-[#E5B842]/10 border border-[#E5B842]/30 text-[#E5B842] text-sm font-medium animate-pulse font-display relative overflow-hidden">
            Listening to your voice...
          </div>
        )}
      </div>

      {/* Bottom control controls */}
      <div className="space-y-6 shrink-0 mt-auto">
        {/* Suggested Queries */}
        <div className="flex flex-wrap justify-center gap-2">
          {sampleQuestions.map((qItem, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qItem.q)}
              className="px-3.5 py-2 bg-black/40 hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/20 text-sm text-white/60 hover:text-white rounded-xl transition-all flex items-center gap-1.5 focus:outline-hidden font-bold uppercase tracking-wider cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#E5B842]" /> {qItem.q}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className="flex items-center gap-3">
          {/* Pulsing Voice Mic */}
          {!textOnlyMode && (
            <button 
              onClick={toggleListening}
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 focus:outline-hidden cursor-pointer ${
                isListening 
                  ? 'bg-[#E5B842] border-[#E5B842] text-black shadow-lg shadow-[#E5B842]/20 animate-pulse' 
                  : 'bg-[#0B0B0B] border-white/10 text-white/50 hover:border-[#E5B842]/30 hover:text-white'
              }`}
              title="Toggle speech recording"
            >
              {isListening ? <Mic className="w-5 h-5 text-black" /> : <MicOff className="w-5 h-5" />}
            </button>
          )}

          {/* Text message fallback input */}
          <div className="flex-1 relative flex items-center">
            <input 
              type="text"
              placeholder={textOnlyMode ? "Type your command or question here..." : "Send instruction message..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
              className={`w-full bg-[#0B0B0B] border ${textOnlyMode ? 'border-[#E5B842]/20 focus:border-[#E5B842]/60 shadow-inner' : 'border-white/10 hover:border-white/20 focus:border-[#E5B842]/40'} rounded-xl pl-4 pr-12 py-3.5 text-sm text-white focus:outline-hidden transition-all duration-300`}
            />
            <button 
              onClick={() => handleSend(inputText)}
              className="absolute right-3 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );

  return (
    <PremiumGuard
      feature="voice_ai"
      onUpgrade={() => setCurrentTab ? setCurrentTab('subscription') : window.location.href = '/pricing'}
    >
      {content}
    </PremiumGuard>
  );
}
