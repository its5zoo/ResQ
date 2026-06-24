import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Send } from 'lucide-react';

export default function VoiceSection() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello! I am your ResQ AI companion. Ask me to outline your day, list your critical deadlines, or organize calendar blocks for you." }
  ]);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isProcessing, isListening]);

  useEffect(() => {
    let step = 0;
    let isActive = true;
    
    const conversationLoop = [
      { q: "What is due today?", a: "You have one item due today: 'Bring vegetable'. You're all caught up on your other tasks!" },
      { q: "Organize my afternoon", a: "I have blocked 2:00 PM to 4:00 PM for Deep Work, and scheduled a 15-minute break at 4:00 PM." }
    ];

    const runAnimation = async () => {
      while (isActive) {
        const currentPrompt = conversationLoop[step % conversationLoop.length];

        await new Promise(r => setTimeout(r, 2000));
        if (!isActive) break;

        setIsListening(true);
        await new Promise(r => setTimeout(r, 1500));
        if (!isActive) break;
        setIsListening(false);
        setMessages(prev => [...prev, { role: 'user', text: currentPrompt.q }]);

        setIsProcessing(true);
        await new Promise(r => setTimeout(r, 1000));
        if (!isActive) break;
        setIsProcessing(false);

        setMessages(prev => [...prev, { role: 'ai', text: currentPrompt.a }]);

        await new Promise(r => setTimeout(r, 4000));
        step++;
      }
    };

    runAnimation();

    return () => { isActive = false; };
  }, []);

  return (
    <section id="voice" className="voice-section py-20 lg:py-44 relative overflow-hidden border-t border-white/[0.03]">
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] voice-section-glow rounded-full blur-[130px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        
        {/* Left Column: Voice Assistant Auto-Animation */}
        <div className="lg:col-span-7 flex flex-col p-5 lg:p-8 voice-card rounded-3xl h-[520px] lg:h-[580px] relative transition-all duration-500 font-sans pointer-events-none">
          
          {/* Top Header */}
          <div className="voice-card-header border-b pb-4 lg:pb-5 flex items-center justify-between mb-5 lg:mb-6 shrink-0 relative z-10">
            <div>
              <span className="text-xs lg:text-sm font-tech font-bold tracking-[0.3em] voice-label block mb-1">AUDIO SHIELD</span>
              <h2 className="text-xl lg:text-2xl font-display font-black tracking-tight voice-heading leading-none">
                Hands-Free Voice Assistant
              </h2>
            </div>
            <div className="p-2.5 rounded-xl border bg-[#E5B842]/10 border-[#E5B842]/30 text-[#E5B842]">
              <Volume2 className="w-4 h-4" />
            </div>
          </div>

          {/* Main chat window */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto space-y-4 pr-2 mb-6 relative z-10 custom-scrollbar flex flex-col justify-end scroll-smooth"
          >
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`max-w-[90%] lg:max-w-[85%] p-4 rounded-2xl border leading-relaxed text-sm font-normal animate-fade-in-up voice-msg ${
                    msg.role === 'ai' ? 'self-start' : 'ml-auto'
                  }`}
                >
                  {msg.role === 'ai' && (
                    <div className="flex items-center gap-1.5 mb-2 shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-[#E5B842]" />
                      <span className="text-xs font-bold voice-ai-label uppercase font-display">Guardian AI</span>
                    </div>
                  )}
                  <p className="voice-msg-text font-medium">{msg.text}</p>
                </div>
              ))}

              {isProcessing && (
                <div className="max-w-[85%] p-4 rounded-2xl voice-msg voice-processing text-sm font-medium animate-pulse font-display relative">
                  Companion is formulating response...
                </div>
              )}
              
              {isListening && !isProcessing && (
                <div className="max-w-[85%] p-4 rounded-2xl bg-[#E5B842]/10 border border-[#E5B842]/30 text-[#E5B842] text-sm font-medium animate-pulse font-display relative">
                  Listening to your voice...
                </div>
              )}
            </div>
          </div>

          {/* Bottom control mock */}
          <div className="space-y-4 shrink-0 mt-auto relative z-10 pt-4">
            {/* Suggested Queries Mock */}
            <div className="flex flex-wrap justify-center gap-2">
              {["What is due today?", "Organize my afternoon", "Check my habit streaks"].map((label, i) => (
                <div key={i} className={`px-3 py-1.5 lg:px-4 lg:py-2.5 voice-chip rounded-xl flex items-center gap-1.5 font-bold uppercase tracking-wider ${i === 2 ? 'hidden sm:flex' : ''}`}>
                  <Volume2 className="w-3.5 h-3.5 text-[#E5B842]" />
                  <span className="text-xs lg:text-sm">{label}</span>
                </div>
              ))}
            </div>

            {/* Input area mock */}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 ${
                isListening 
                  ? 'bg-[#E5B842] border-[#E5B842] text-black shadow-lg shadow-[#E5B842]/20' 
                  : 'voice-mic-idle'
              }`}>
                {isListening ? <Mic className="w-4 h-4 lg:w-5 lg:h-5 text-black" /> : <MicOff className="w-4 h-4 lg:w-5 lg:h-5" />}
              </div>

              <div className="flex-1 relative flex items-center">
                <div className="w-full voice-input rounded-xl pl-4 pr-12 py-2.5 lg:py-3.5 text-xs lg:text-sm">
                  Send instruction message...
                </div>
                <div className="absolute right-3 voice-input-icon">
                  <Send className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Title and Context */}
        <div className="lg:col-span-5 flex flex-col justify-center pl-0 lg:pl-6">
          <span className="text-sm font-tech font-bold tracking-[0.3em] uppercase voice-label block mb-5 font-sans">
            AI VOICE CAPABILITIES
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black mb-8 leading-tight tracking-tight voice-heading">
            Command your <br />
            workflow with <br />
            <span className="text-[#E5B842]">natural speech.</span>
          </h2>
          <p className="voice-body text-lg font-light leading-relaxed mb-8 max-w-md">
            Experience hands-free control. Our AI understands complex requests, from organizing detailed calendar events to summarizing your critical deadlines on the fly.
          </p>
        </div>

      </div>
    </section>
  );
}
