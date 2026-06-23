import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, Send, Volume2 } from 'lucide-react';
import { voice as apiVoice } from '../../services/api.js';

export default function VoiceAIPage() {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello! I am your ResQ AI companion. Ask me to outline your day, list your critical deadlines, or organize calendar blocks for you." }
  ]);
  const [inputText, setInputText] = useState('');
  const recognitionRef = useRef(null);

  const sampleQuestions = [
    { q: "What is due today?" },
    { q: "Organize my afternoon" },
    { q: "Check my habit strengths" }
  ];

  // Helper to select the polished female voice
  const speakResponse = (text) => {
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

  const handleSend = async (textVal) => {
    if (!textVal.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: textVal }]);
    setInputText('');
    setIsListening(true);

    try {
      const result = await apiVoice.sendCommand(textVal);
      setIsListening(false);
      
      setMessages(prev => [...prev, { role: 'ai', text: result.response }]);
      speakResponse(result.response);
    } catch (err) {
      console.error('Error in Voice AI page command:', err);
      setIsListening(false);
      const errReply = "Sorry, I had trouble communicating with the Gemini brain.";
      setMessages(prev => [...prev, { role: 'ai', text: errReply }]);
      speakResponse(errReply);
    }
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
      } catch (e) {}
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
        } catch (e) {}
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

  return (
    <div className="space-y-8 animate-fade-in flex flex-col justify-between h-[82vh] font-sans">
      
      {/* Top Header */}
      <div className="border-b border-white/5 pb-6">
        <span className="text-xs font-tech font-bold tracking-[0.3em] text-[#E5B842] block mb-2">AUDIO SHIELD</span>
        <h2 className="text-3xl font-display font-black tracking-tight text-white leading-none">
          Hands-Free Voice Assistant
        </h2>
      </div>

      {/* Main chat window */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-[50vh] p-6 bg-[#090909] border border-white/[0.04] rounded-3xl layered-shadow-lg">
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
                <span className="text-xs font-bold text-white uppercase font-display">Guardian AI</span>
              </div>
            )}
            <p>{msg.text}</p>
          </div>
        ))}

        {isListening && (
          <div className="max-w-xs p-4 rounded-2xl bg-white/[0.01] border border-[#E5B842]/20 text-white/70 text-sm font-medium animate-pulse font-display relative overflow-hidden card-shine-sweep">
            Companion is formulated or listening...
          </div>
        )}
      </div>

      {/* Bottom control controls */}
      <div className="space-y-6">
        {/* Suggested Queries */}
        <div className="flex flex-wrap justify-center gap-2">
          {sampleQuestions.map((qItem, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qItem.q)}
              className="px-3.5 py-2 bg-black/40 hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/20 text-xs text-white/60 hover:text-white rounded-xl transition-all flex items-center gap-1.5 focus:outline-hidden font-bold uppercase tracking-wider cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#E5B842]" /> {qItem.q}
            </button>
          ))}
        </div>

        {/* Input area */}
        <div className="flex items-center gap-3">
          {/* Pulsing Voice Mic */}
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

          {/* Text message fallback input */}
          <div className="flex-1 relative flex items-center">
            <input 
              type="text"
              placeholder="Send instruction message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
              className="w-full bg-[#0B0B0B] border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl pl-4 pr-12 py-3.5 text-sm text-white focus:outline-hidden transition-all duration-300"
            />
            <button 
              onClick={() => handleSend(inputText)}
              className="absolute right-3 text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

