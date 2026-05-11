import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Topic, Message as MessageType, BookEntry, ScholarEra } from '../types';
import Message from './Message';
import ChatInput from './ChatInput';
import ResourcesModal from './ResourcesModal';
import ConfirmationModal from './DeleteConfirmationModal';

interface ChatViewProps {
  topic: Topic;
  messages: MessageType[];
  isTyping: boolean;
  bookTitles: string[];
  scholarEra: ScholarEra;
  availableEras: ScholarEra[];
  onSendMessage: (text: string) => void;
  onStopGeneration: () => void;
  onOpenDisclaimer: () => void;
  onSwitchTopic: (topic: Topic) => void;
  onTopicSwitchDecline: (messageId: string) => void;
  onClearConversation: (topic: Topic) => void;
  onTafsirSelection: (book: BookEntry, ayah: string) => void;
  onScholarEraChange: (newEra: ScholarEra) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ 
  topic, 
  messages, 
  isTyping,
  bookTitles,
  scholarEra,
  availableEras,
  onSendMessage,
  onStopGeneration,
  onOpenDisclaimer, 
  onSwitchTopic,
  onTopicSwitchDecline,
  onClearConversation,
  onTafsirSelection,
  onScholarEraChange
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);
  
  const handleClear = () => {
    onClearConversation(topic);
    setIsClearConfirmOpen(false);
  };
  
  const placeholderText = topic === Topic.Tafsir ? "اكتب الآية هنا..." : "اكتب سؤالك هنا...";


  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col items-center p-4 border-b gap-3" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-container)'}}>
        <h2 className="text-xl font-bold text-center" style={{color: 'var(--primary-accent)'}}>سؤال في {topic}</h2>
        
        <div className="flex items-center justify-center gap-2 flex-wrap">
           <button
              onClick={() => setIsClearConfirmOpen(true)}
              className="px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 hover:bg-[var(--bg-hover)]"
              style={{color: 'var(--text-secondary)'}}
              aria-label="محو المحادثة"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011 1v6a1 1 0 11-2 0V9a1 1 0 011-1zm4 0a1 1 0 011 1v6a1 1 0 11-2 0V9a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>محو المحادثة</span>
          </button>
           <button
              onClick={onOpenDisclaimer}
              className="px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 hover:bg-[var(--bg-hover)]"
              style={{color: 'var(--text-secondary)'}}
              aria-label="تنبيه هام"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>تنبيه</span>
          </button>
          <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 hover:bg-[var(--bg-hover)]"
              style={{color: 'var(--text-secondary)'}}
              aria-label="عرض مصادر التعلم"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
              <span>المصادر</span>
          </button>
        </div>

        {availableEras.length > 1 && (
            <div className="flex items-center rounded-lg p-1" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)'}}>
                <button
                    onClick={() => onScholarEraChange('all')}
                    disabled={isTyping}
                    className={`px-3 py-1 text-sm rounded-md transition-colors disabled:opacity-50 ${scholarEra === 'all' ? 'font-bold text-white' : 'text-[var(--text-secondary)]'}`}
                    style={{ backgroundColor: scholarEra === 'all' ? 'var(--primary-accent)' : 'transparent' }}
                    aria-pressed={scholarEra === 'all'}
                >
                    الكل
                </button>
                <button
                    onClick={() => onScholarEraChange('motaqdmeen')}
                    disabled={isTyping}
                    className={`px-3 py-1 text-sm rounded-md transition-colors disabled:opacity-50 ${scholarEra === 'motaqdmeen' ? 'font-bold text-white' : 'text-[var(--text-secondary)]'}`}
                    style={{ backgroundColor: scholarEra === 'motaqdmeen' ? 'var(--primary-accent)' : 'transparent' }}
                    aria-pressed={scholarEra === 'motaqdmeen'}
                >
                    متقدمين
                </button>
                <button
                    onClick={() => onScholarEraChange('motakhreen')}
                    disabled={isTyping}
                    className={`px-3 py-1 text-sm rounded-md transition-colors disabled:opacity-50 ${scholarEra === 'motakhreen' ? 'font-bold text-white' : 'text-[var(--text-secondary)]'}`}
                    style={{ backgroundColor: scholarEra === 'motakhreen' ? 'var(--primary-accent)' : 'transparent' }}
                    aria-pressed={scholarEra === 'motakhreen'}
                >
                    متأخرين
                </button>
            </div>
          )}
      </div>
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4" 
      >
        {messages.map((msg) => (
          <Message 
            key={msg.id} 
            message={msg} 
            onTopicSwitchConfirm={onSwitchTopic}
            onTopicSwitchDecline={onTopicSwitchDecline}
            onTafsirSelection={onTafsirSelection}
          />
        ))}
        {isTyping && messages[messages.length - 1]?.sender !== 'bot' && (
             <Message message={{id: 'typing', text: '', sender: 'bot', isLoading: true}} />
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSendMessage={onSendMessage} isLoading={isTyping} onStop={onStopGeneration} placeholder={placeholderText} />
       <ResourcesModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        books={bookTitles}
        topic={topic}
        scholarEra={scholarEra}
      />
      <ConfirmationModal
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={handleClear}
        title="تأكيد محو المحادثة"
        confirmText="نعم، محو"
      >
        <p className="text-center mb-6 text-lg" style={{ color: 'var(--text-primary)' }}>
          هل أنت متأكد من رغبتك في محو هذه المحادثة؟
          <br />
          سيتم حذف جميع الرسائل والبدء من جديد.
        </p>
      </ConfirmationModal>
    </div>
  );
};

export default ChatView;