import React, { useState } from 'react';
import { X, Send, Sparkles, Bot, User } from 'lucide-react';

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedHypothesisId?: string;
  selectedEventId?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  source?: string;
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({
  isOpen,
  onClose,
  selectedHypothesisId,
  selectedEventId
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello, I am Aegis Copilot. I analyze correlated attack graphs and evidence-linked hypotheses strictly grounded in your stored telemetry. Ask me any threat hunting question or select a quick query below.',
      timestamp: new Date().toLocaleTimeString(),
      source: 'Aegis Platform'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const quickQueries = [
    'Explain the attack kill chain in hypothesis H-2026-001',
    'Why is LSASS dumping linked to the DCSync alert on DC01?',
    'What critical telemetry is missing for FIN7 POS exfiltration?',
    'Evaluate false positive risk for the LOLBAS certutil rule'
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend,
          hypothesisId: selectedHypothesisId,
          eventId: selectedEventId
        })
      });

      const data = await res.json();
      const botMsg: Message = {
        role: 'assistant',
        content: data.answer || 'No analysis available for this query.',
        timestamp: new Date().toLocaleTimeString(),
        source: data.source
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg: Message = {
        role: 'assistant',
        content: 'Unable to reach the threat hunting reasoning engine. Verify server connectivity.',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">Aegis Threat Hunter Copilot</h2>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-5 py-2.5 bg-slate-950/70 border-b border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          <span className="text-slate-500">Active Grounding:</span>
          <span className="font-mono text-cyan-300 truncate">
            {selectedHypothesisId ? `Hypothesis ${selectedHypothesisId}` : 'All Correlated Telemetry'}
          </span>
        </div>
        <span className="text-[11px] text-emerald-400 font-mono">Zero-Hallucination Mode</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-lg p-3 text-slate-200 leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-cyan-900/60 text-cyan-50 border border-cyan-700/60'
                  : 'bg-slate-800/90 border border-slate-700/80'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                <span>{msg.timestamp}</span>
                {msg.source && <span className="font-mono">{msg.source}</span>}
              </div>
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 items-center text-slate-400 text-xs py-2">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>Analyzing stored telemetry records...</span>
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/50">
        <div className="text-[11px] text-slate-500 mb-1.5 font-medium">Suggested Hunting Inquiries:</div>
        <div className="flex flex-wrap gap-1.5">
          {quickQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-[11px] text-left px-2 py-1 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded border border-slate-700/60 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-950">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Copilot to explain telemetry or attack path..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-md transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
