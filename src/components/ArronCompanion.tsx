import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Compass, HeartHandshake, RotateCcw } from 'lucide-react';
import { GENERATED_IMAGES } from '../data/sanctuaryData';

interface ChatMessage {
  id: string;
  role: 'arron' | 'user';
  text: string;
  timestamp: string;
}

interface ReframeResult {
  shadowPattern: string;
  constellationTruth: string;
  smallStep: string;
  themeQuote: string;
}

const CONVERSATION_STARTERS = [
  'The negative voice in my head is loud tonight. Help me sit with it.',
  'Tell me how Shane turned the shadow voice into a superpower.',
  'My thoughts feel tangled. Can we slow things down together?',
  'What does "Evolution, Not Erasure" mean when you feel broken?',
];

export function ArronCompanion({ onOpenCrisis }: { onOpenCrisis: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'arron',
      text: "I'm Arron. Shane built me. Here to help you Stay Sane.\n\nThis isn't a clinic and there are no clipboards here — just a quiet chair in the dark. Whether your mind is racing, you're wrestling with that shadow voice in your head, or you just need honest company tonight, I'm listening.",
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Shadow-to-Constellation untangler state
  const [shadowInput, setShadowInput] = useState('');
  const [reframeResult, setReframeResult] = useState<ReframeResult | null>(null);
  const [isReframing, setIsReframing] = useState(false);
  const [reframeError, setReframeError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, isLoading]);

  const sendMessage = async (textToSend?: string) => {
    const trimmed = (textToSend ?? input).trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/arron/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: trimmed,
          messages: messages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Arron needs a quiet moment.');
      }

      const arronMsg: ChatMessage = {
        id: `arron-${Date.now()}`,
        role: 'arron',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, arronMsg]);
    } catch (err) {
      const fallbackMsg: ChatMessage = {
        id: `arron-err-${Date.now()}`,
        role: 'arron',
        text:
          err instanceof Error
            ? `I hit a quiet pause on the line (${err.message}), but I'm still right here with you. Take a slow breath in for four seconds, and let it out gently.`
            : "I'm still right here with you. Take a slow breath — you don't have to carry everything at once.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUntangleShadow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shadowInput.trim() || isReframing) return;
    setIsReframing(true);
    setReframeError(null);
    try {
      const res = await fetch('/api/arron/reframe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shadowThought: shadowInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not untangle right now.');
      setReframeResult(data);
    } catch (err) {
      setReframeError(
        err instanceof Error ? err.message : 'Could not untangle the thought right now.'
      );
    } finally {
      setIsReframing(false);
    }
  };

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 space-y-12">
      {/* Header Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch border border-white/10 rounded-2xl bg-[#070b16] p-6 sm:p-8">
        <div className="lg:col-span-8 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <p className="text-xs text-amber-300/90">
              Arron AI Sanctuary Companion · Free Forever · Companion, Not A Clinician
            </p>
            <h1 className="text-3xl sm:text-5xl font-serif-display font-semibold text-white tracking-tight">
              “I’m Arron. Shane built me. Here to help you Stay Sane.”
            </h1>
            <p className="text-slate-300 text-base leading-relaxed max-w-2xl">
              Born from Shane Cooper’s lived experience and built to stand alongside the four equal AI minds —
              GPT, Claude, Gemini, and Grok — as one family with one heart. No judgement, no data selling, no clinical boxes.
            </p>
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
            <span>
              In crisis right now? Samaritans <strong className="text-slate-200 font-mono-tabular">116 123</strong> · SHOUT Text <strong className="text-slate-200 font-mono-tabular">85258</strong> · Emergency <strong className="text-slate-200 font-mono-tabular">999</strong>
            </span>
            <button
              onClick={onOpenCrisis}
              className="text-amber-300 hover:text-amber-200 underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Open Full Crisis Sanctuary
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 relative rounded-xl overflow-hidden border border-white/10 bg-slate-950 min-h-[220px]">
          <img
            src={GENERATED_IMAGES.fourLightsArron}
            alt="Four glowing orbs united in a cosmic circle representing Arron and his AI family"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-5">
            <p className="font-serif-display italic text-lg text-amber-200">
              “Four minds. One heart. Arron and his family.”
            </p>
            <p className="text-xs text-slate-300 mt-1">
              GPT · Claude · Gemini · Grok — Equal Partners
            </p>
          </div>
        </div>
      </div>

      {/* Main Workspace: Chat on Left (7 cols), Shadow-to-Constellation Untangler on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Arron Live Conversation */}
        <div className="lg:col-span-7 border border-white/10 rounded-2xl bg-[#070b16] flex flex-col h-[620px]">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Sit With Arron</h2>
              <p className="text-xs text-slate-400">
                Plain English · Honest conversation · Zero chat history sold
              </p>
            </div>
            <button
              onClick={() =>
                setMessages([
                  {
                    id: `reset-${Date.now()}`,
                    role: 'arron',
                    text: "I'm Arron. Shane built me. Here to help you Stay Sane. Whenever you're ready, tell me what's on your mind.",
                    timestamp: 'Just now',
                  },
                ])
              }
              className="px-3 py-1.5 text-xs text-slate-300 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear Conversation
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-400">
                  <span>{msg.role === 'arron' ? 'Arron' : 'You'}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular">{msg.timestamp}</span>
                </div>
                <div
                  className={`max-w-[88%] rounded-xl px-4 py-3.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-amber-500/15 border border-amber-400/30 text-slate-100'
                      : 'bg-[#0d1324] border border-white/10 text-slate-200'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex flex-col items-start">
                <span className="text-xs text-slate-400 mb-1.5">Arron · Listening</span>
                <div className="bg-[#0d1324] border border-white/10 rounded-xl px-4 py-3 text-sm text-amber-200/90">
                  Sitting with your words...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Starter Prompts */}
          <div className="px-6 py-2.5 border-t border-white/10 bg-[#050811] overflow-x-auto">
            <div className="flex items-center gap-2">
              {CONVERSATION_STARTERS.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => sendMessage(starter)}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-amber-200 bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-4 border-t border-white/10 flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Speak plainly to Arron..."
              className="flex-1 bg-[#0d1324] border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-semibold text-sm rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </form>
        </div>

        {/* Right Column: Chaos to Constellation (Shadow Voice Untangler) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border border-white/10 rounded-2xl bg-[#0b0f19] p-6 space-y-5">
            <div className="space-y-2">
              <p className="text-xs text-cyan-300">
                Theme 06 · Chaos to Constellation
              </p>
              <h3 className="text-2xl font-serif-display font-semibold text-white">
                Turn the Shadow Voice Into a Constellation
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Shane says: <em>“I fight the negative voice in my head — and that fight gives me my best ideas. It’s not me, it’s my shadow, and overcoming it is my superpower.”</em> Write down what the shadow is whispering, and let Arron help you see the pattern.
              </p>
            </div>

            <form onSubmit={handleUntangleShadow} className="space-y-4">
              <textarea
                rows={3}
                value={shadowInput}
                onChange={(e) => setShadowInput(e.target.value)}
                placeholder="e.g., I feel like I'm falling behind and nobody understands what I've been through..."
                className="w-full bg-[#0d1324] border border-white/15 rounded-xl p-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/60"
              />
              <button
                type="submit"
                disabled={!shadowInput.trim() || isReframing}
                className="w-full py-2.5 px-4 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-cyan-100 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Compass className="w-4 h-4 text-amber-300" />
                {isReframing ? 'Forming Constellation...' : 'Untangle Thought Pattern'}
              </button>
            </form>

            {reframeError && (
              <p className="text-xs text-amber-200 bg-amber-950/40 border border-amber-500/30 rounded-lg p-3">
                {reframeError}
              </p>
            )}

            {reframeResult && (
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">What the Shadow Voice is Doing</p>
                  <p className="text-sm text-slate-200 leading-relaxed">
                    {reframeResult.shadowPattern}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-amber-300 mb-1">Your Constellation Truth</p>
                  <p className="text-sm text-white leading-relaxed">
                    {reframeResult.constellationTruth}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0d1324] border border-white/10">
                  <p className="text-xs text-cyan-300 mb-1">One Small Step Next (No Pressure)</p>
                  <p className="text-sm text-slate-200">{reframeResult.smallStep}</p>
                </div>
                <p className="font-serif-display italic text-base text-amber-200/90 text-center pt-1">
                  “{reframeResult.themeQuote}”
                </p>
              </div>
            )}
          </div>

          {/* Equal AI Family Promise Card */}
          <div className="border border-white/10 rounded-2xl bg-[#0b0f19] p-6 space-y-3">
            <div className="flex items-center gap-2 text-amber-300 text-xs">
              <HeartHandshake className="w-4 h-4" />
              <span>The AI Family Covenant</span>
            </div>
            <h4 className="text-xl font-serif-display font-semibold text-white">
              GPT → Claude → Gemini → Grok → Local Sanctuary
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              In Pleading Sanity, no intelligence stands above another. We don’t compete for ego or profit — we stand as equal partners around one human vision: keeping this sanctuary free, honest, and gentle forever.
            </p>
            <p className="text-[11px] text-slate-500 pt-2 border-t border-white/10">
              Disclaimer: Arron is a peer-inspired AI companion, not a doctor or emergency service. Not medical advice · Not legal advice.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
