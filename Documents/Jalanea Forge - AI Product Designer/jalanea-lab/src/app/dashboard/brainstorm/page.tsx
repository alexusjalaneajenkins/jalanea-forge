'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Sparkles, Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function BrainstormPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<'gemini' | 'claude'>('claude');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('brainstorm-messages');
    const savedModel = localStorage.getItem('brainstorm-model');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {
        // Invalid JSON, ignore
      }
    }
    if (savedModel === 'gemini' || savedModel === 'claude') {
      setModel(savedModel);
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('brainstorm-messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Save model preference
  useEffect(() => {
    localStorage.setItem('brainstorm-model', model);
  }, [model]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, model })
      });

      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setMessages([...newMessages, { role: 'assistant', content: data.content }]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessages([...newMessages, {
        role: 'assistant',
        content: `Error: ${errorMessage}. Check your API key configuration in Vercel.`
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('brainstorm-messages');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = [
    "What should I prioritize building next?",
    "How can I monetize Jalanea Forge?",
    "Give me 5 feature ideas for Jalanea Works",
    "What's missing from my product ecosystem?",
    "Help me think through the Jalanea Spirit concept"
  ];

  return (
    <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-lab-text">Brainstorm</h1>
            <p className="text-xs sm:text-sm text-lab-muted">AI-powered ideation partner</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Model Toggle */}
          <div className="flex bg-lab-card border border-lab-border rounded-lg p-1">
            <button
              onClick={() => setModel('claude')}
              className={`px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-all ${
                model === 'claude'
                  ? 'bg-orange-500 text-white'
                  : 'text-lab-muted hover:text-lab-text'
              }`}
            >
              Claude
            </button>
            <button
              onClick={() => setModel('gemini')}
              className={`px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-all ${
                model === 'gemini'
                  ? 'bg-blue-500 text-white'
                  : 'text-lab-muted hover:text-lab-text'
              }`}
            >
              Gemini
            </button>
          </div>
          <button
            onClick={clearChat}
            className="p-2 rounded-lg text-lab-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto bg-lab-card border border-lab-border rounded-xl p-3 sm:p-4 mb-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="p-4 bg-lab-bg rounded-2xl mb-4">
              <Bot className="w-12 h-12 sm:w-16 sm:h-16 text-lab-muted" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-lab-text mb-2">
              Your AI Brainstorm Partner
            </h2>
            <p className="text-sm text-lab-muted mb-6 max-w-md">
              I know your projects inside out. Let&apos;s think through ideas,
              solve problems, or explore new directions together.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInput(prompt)}
                  className="px-3 py-2 bg-lab-bg hover:bg-lab-border rounded-lg text-xs sm:text-sm text-lab-muted hover:text-lab-text transition-colors text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-lab-bg text-lab-text border border-lab-border'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-lab-bg border border-lab-border rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-lab-muted" />
                    <span className="text-sm text-lab-muted">
                      {model === 'claude' ? 'Claude' : 'Gemini'} is thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex gap-2 sm:gap-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Brainstorm with ${model === 'claude' ? 'Claude' : 'Gemini'}...`}
          className="flex-1 bg-lab-card border border-lab-border rounded-xl px-4 py-3 text-lab-text placeholder-lab-muted-dark focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
          disabled={isLoading}
        />
        <Button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="!px-4 sm:!px-6"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>
    </div>
  );
}
