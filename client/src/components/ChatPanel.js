import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const NO_CONTEXT_SUBSTRING = "I don't have a vetted guideline";

function SourcePill({ source }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#e8f4f8] text-[#1a5f7a] border border-[#b8dce8]">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {source.filename}
      {source.score && (
        <span className="text-[#5a9ab5] font-normal">· {(source.score * 100).toFixed(0)}%</span>
      )}
    </span>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  const isNoContext =
    !isUser && msg.text.includes(NO_CONTEXT_SUBSTRING);

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-[#1a5f7a] text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed shadow-sm">
          {msg.text}
        </div>
      </div>
    );
  }

  if (isNoContext) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[90%]">
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
            <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-amber-800 leading-relaxed">{msg.text}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%]">
        <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-gray-800 leading-relaxed shadow-sm">
          {msg.text}
        </div>
        {msg.sources && msg.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5 px-1">
            {msg.sources.map((s, i) => (
              <SourcePill key={i} source={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPanel({ pathway, institution }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("/api/chat", {
        message: text,
        pathway: pathway || "",
        institution: institution || "",
        context: "",
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: res.data.response,
          sources: res.data.sources || [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Unable to reach the server. Please check your connection and try again.",
          sources: [],
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-t lg:border-t-0 lg:border-l border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#1a5f7a]" aria-hidden="true" />
          <span className="text-sm font-semibold text-gray-700">Ask Yukti</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5 ml-4">
          Responses drawn only from approved guidelines
        </p>
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-10 h-10 rounded-full bg-[#e8f4f8] flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-[#1a5f7a]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">
              Ask a clinical question about the active pathway.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a clinical question…"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a5f7a] focus:border-transparent disabled:opacity-50 max-h-32 overflow-y-auto leading-relaxed"
            style={{ minHeight: "42px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="shrink-0 w-10 h-10 rounded-xl bg-[#1a5f7a] text-white flex items-center justify-center hover:bg-[#155068] active:bg-[#0f3d4f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          For clinical decision support only · Not a substitute for clinical judgment
        </p>
      </div>
    </div>
  );
}
