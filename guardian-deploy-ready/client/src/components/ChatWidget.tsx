import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, CheckCircle2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<'intro' | 'chat' | 'sent'>('intro');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ from: 'visitor' | 'system'; text: string }>>([
    { from: 'system', text: "Hi — I'm here to answer any questions about Guardian OS. What's your name?" },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      setMessages(prev => [
        ...prev,
        { from: 'system', text: `Thanks ${name}! Richard Cruz will follow up personally. In the meantime, try uploading an engineering drawing to see Guardian OS in action.` },
      ]);
      setStep('sent');
    },
    onError: () => {
      toast.error('Message failed to send. Please try again.');
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (step === 'intro') {
      if (!name.trim()) return;
      setMessages(prev => [
        ...prev,
        { from: 'visitor', text: name },
        { from: 'system', text: `Nice to meet you, ${name}. What's on your mind? Ask anything about Guardian OS — how it works, pricing, integration, or just tell me about your shop.` },
      ]);
      setStep('chat');
      return;
    }

    if (step === 'chat') {
      if (!message.trim()) return;
      setMessages(prev => [...prev, { from: 'visitor', text: message }]);
      sendMessage.mutate({
        name,
        email: email || undefined,
        message,
        page: window.location.pathname,
      });
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const resetChat = () => {
    setStep('intro');
    setName('');
    setEmail('');
    setMessage('');
    setMessages([
      { from: 'system', text: "Hi — I'm here to answer any questions about Guardian OS. What's your name?" },
    ]);
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent text-accent-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
          title="Ask a question"
        >
          <MessageCircle className="w-6 h-6" />
          {/* Pulse indicator */}
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-background animate-pulse" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-h-[500px] rounded-xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-accent/10 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Guardian OS</p>
                <p className="text-[10px] text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  Online — typically replies in minutes
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-[320px]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.from === 'visitor' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                    msg.from === 'visitor'
                      ? 'bg-accent text-accent-foreground rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {sendMessage.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground px-3 py-2 rounded-lg rounded-bl-sm text-sm">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-border px-3 py-3">
            {step === 'intro' && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Your name..."
                  className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  autoFocus
                />
                <button
                  onClick={handleSend}
                  disabled={!name.trim()}
                  className="px-3 py-2 rounded-lg bg-accent text-accent-foreground disabled:opacity-40 hover:bg-accent/80"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}

            {step === 'chat' && (
              <div className="space-y-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email (optional — for follow-up)"
                  className="w-full px-3 py-1.5 rounded-lg bg-muted border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <div className="flex gap-2">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your question..."
                    rows={2}
                    className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSend}
                    disabled={!message.trim() || sendMessage.isPending}
                    className="px-3 self-end py-2 rounded-lg bg-accent text-accent-foreground disabled:opacity-40 hover:bg-accent/80"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 'sent' && (
              <div className="text-center py-2 space-y-2">
                <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Message sent</span>
                </div>
                <button
                  onClick={resetChat}
                  className="text-xs text-accent hover:underline"
                >
                  Send another message
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-1.5 border-t border-border/50 bg-muted/30">
            <p className="text-[9px] text-muted-foreground text-center">
              Powered by Guardian OS — Richard Cruz • (951) 233-5475
            </p>
          </div>
        </div>
      )}
    </>
  );
}
