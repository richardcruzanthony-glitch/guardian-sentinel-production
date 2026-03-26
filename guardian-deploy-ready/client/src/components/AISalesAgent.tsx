import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export function AISalesAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'agent',
      content: 'Hi! 👋 I\'m the Guardian OS Sales Agent. We offer three distinct value propositions:\n\n🚀 **Right to Execute** ($1,499) - Turn engineering drawings into AS9102 FAI in 3.2 seconds\n\n🛡️ **Deterministic Shield** ($5,000/yr) - Insurance policy for compliance with 0% logic drift\n\n🤖 **Digital Twin** ($15,000+/yr) - Simulate your entire value chain before spending a dollar\n\nWhich resonates most with your needs?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const createLicenseLead = trpc.sales.createLicenseLead.useMutation();
  const getSalesResponse = trpc.sales.getSalesResponse.useMutation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Get AI response from sales agent
      const response = await getSalesResponse.mutateAsync({
        userMessage: input,
        conversationHistory: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: response.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, agentMessage]);

      // If agent detected a lead opportunity, capture it
      if (response.isLead) {
        try {
          await createLicenseLead.mutateAsync({
            name: response.leadInfo?.name || 'Prospect',
            email: response.leadInfo?.email || 'contact@company.com',
            company: response.leadInfo?.company || 'Unknown',
            industry: response.leadInfo?.industry,
            tiersInterested: response.leadInfo?.tiersInterested || [],
            message: input,
          });
        } catch (leadError) {
          console.error('Failed to create lead:', leadError);
        }
      }
    } catch (error) {
      console.error('Error getting sales response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'agent',
        content: 'Sorry, I encountered an error. Please try again or contact our sales team at sales@guardiansentinel.io',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center hover:scale-110 z-40"
        title="Chat with Sales Agent"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-background border border-border rounded-lg shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-cyan-500/10 to-blue-600/10">
        <div>
          <h3 className="font-bold text-foreground">Guardian OS Sales</h3>
          <p className="text-[12px] text-muted-foreground">AI-Powered Licensing Assistant</p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-muted rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-muted text-foreground border border-border'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              <p className="text-[10px] mt-1 opacity-70">
                {msg.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted text-foreground border border-border px-4 py-2 rounded-lg flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4 space-y-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                handleSendMessage();
              }
            }}
            placeholder="Ask about licensing..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            size="sm"
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          Powered by Guardian AI — Available 24/7
        </p>
      </div>
    </div>
  );
}
