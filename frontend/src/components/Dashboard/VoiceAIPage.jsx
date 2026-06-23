import React, { useState } from 'react';
import { Mic, MicOff, Sparkles, Send, Volume2, ArrowRight } from 'lucide-react';

export default function VoiceAIPage() {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello! I am your ResQ AI companion. Ask me to outline your day, list your critical deadlines, or organize calendar blocks for you." }
  ]);

  const [inputText, setInputText] = useState('');

  const sampleQuestions = [
    { q: "What is due today?", a: "Your Vibe2Ship submission is due in 2 hours. I have scheduled a focus block for you at 4 PM." },
    { q: "Organize my afternoon", a: "I have block-booked 2:00 PM for database migration and 4:00 PM for UI designs. All set!" },
    { q: "Check my habit strengths", a: "Drink Water habit is completed today. Gym Workout is pending. Should I create a reminder?" }
  ];

  const handleSend = (textVal) => {
    if (!textVal.trim()) return;
    
    // Add user message
    const newMsg = { role: 'user', text: textVal };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setIsListening(true);

    setTimeout(() => {
      setIsListening(false);
      // Determine AI response
      const matched = sampleQuestions.find(q => q.q.toLowerCase() === textVal.toLowerCase());
      const aiReply = matched 
        ? matched.a 
        : `I've registered your request: "${textVal}". I will coordinate your priorities and schedule calendar slots accordingly.`;
      
      setMessages(prev => [...prev, { role: 'ai', text: aiReply }]);

      // TTS voice feedback
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(aiReply);
        window.speechSynthesis.speak(utterance);
      }
    }, 1200);
  };

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
            Companion is formulating response...
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
            onClick={() => {
              setIsListening(!isListening);
              if (!isListening) {
                // Mock listening action
                setTimeout(() => {
                  handleSend("What is due today?");
                }, 2000);
              }
            }}
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

