import React, { useState } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onStop: () => void;
  placeholder?: string;
}

const StopIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5 5a1 1 0 011-1h8a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1V5z" clipRule="evenodd" />
    </svg>
);

const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
    </svg>
);


const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, onStop, placeholder }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSendMessage(text);
      setText('');
    }
  };

  return (
    <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-container)'}}>
        <form 
          onSubmit={handleSubmit} 
          className="flex items-center gap-3 p-1 rounded-lg chat-input-form transition-all duration-200"
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={placeholder || "اكتب سؤالك هنا..."}
            disabled={isLoading}
            rows={1}
            className="flex-1 bg-transparent border-0 focus:ring-0 resize-none px-3 py-2"
            style={{ color: 'var(--text-primary)', '::placeholder': { color: 'var(--text-secondary)'} } as any}
          />
          {isLoading ? (
             <button
                type="button"
                onClick={onStop}
                className="px-5 py-2 rounded-md flex items-center justify-center transition-all duration-300 min-w-[100px] gap-2 bg-[var(--destructive-color)]"
                style={{
                    color: 'var(--text-on-accent)',
                    fontWeight: 'bold',
                } as React.CSSProperties}
              >
                <StopIcon className="h-5 w-5" />
                <span>إيقاف</span>
              </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading || !text.trim()}
              className="px-5 py-2 rounded-md flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px] gap-2 bg-[var(--primary-accent)] hover:bg-[var(--primary-accent-hover)]"
              style={{
                  color: 'var(--text-on-accent)',
                  fontWeight: 'bold',
              } as React.CSSProperties}
            >
              <SendIcon className="w-5 h-5" />
              <span>أرسل</span>
            </button>
          )}
        </form>
    </div>
  );
};

export default ChatInput;