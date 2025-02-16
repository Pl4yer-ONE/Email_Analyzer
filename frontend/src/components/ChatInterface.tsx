import { useState } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { nanoid } from 'nanoid';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const sendToOllama = async (prompt: string) => {
    setIsLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'deepseek-r1:1.5b',
          prompt,
          stream: false
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: nanoid(),
        content: data.response,
        isUser: false
      }]);

    } catch (error) {
      setMessages(prev => [...prev, {
        id: nanoid(),
        content: `Error: ${error.message}`,
        isUser: false
      }]);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = {
      id: nanoid(),
      content: input,
      isUser: true
    };

    setMessages(prev => [...prev, newMessage]);
    await sendToOllama(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      {/* Add container div for chat messages */}
      <div className="flex-1 overflow-auto">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.isUser ? 'justify' : ''}`}>
            <div className={`p-4 rounded-lg ${message.isUser 
              ? 'bg-purple-800/30' 
              : 'bg-gray-800/50'}`}>
              <div className="whitespace-pre-wrap break-words text-white">
                {message.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="p-4 rounded-lg bg-gray-800/50 animate-pulse text-white">
              <Loader2 className="animate-spin" />
            </div>
          </div>
        )}
      </div> {/* Added closing div for chat container */}

      {/* Analysis Results */}
      {analysis && (
        <div className="p-2">
          <DataDisplay 
            spf={analysis.spf}
            dkim={analysis.dkim}
            dmarc={analysis.dmarc}
            riskScore={analysis.riskScore}
          />
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mt-2">
        <div className="flex gap-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-gray-900/50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
} 