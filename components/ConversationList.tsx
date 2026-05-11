import React, { useState } from 'react';
import { Topic } from '../types';
import ConfirmationModal from './DeleteConfirmationModal';

interface ConversationListProps {
  conversations: Topic[];
  activeTopic: Topic | null;
  onSelectTopic: (topic: Topic) => void;
  onNewConversation: () => void;
  onDeleteConversation: (topic: Topic) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ conversations, activeTopic, onSelectTopic, onNewConversation, onDeleteConversation, isOpen, onClose }) => {
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);
  
  const responsiveClasses = `
    md:sticky md:top-4 md:translate-x-0
    fixed top-0 right-0 h-full z-30 
    transform transition-transform ease-in-out duration-300
    ${isOpen ? 'translate-x-0' : 'translate-x-full'}
  `;

  const handleDeleteConfirm = () => {
    if (topicToDelete) {
      onDeleteConversation(topicToDelete);
      setTopicToDelete(null);
    }
  };


  return (
    <>
      <aside 
        className={`w-56 flex-shrink-0 flex flex-col p-4 border-l md:h-[calc(100vh-2rem)] ${responsiveClasses}`} 
        style={{backgroundColor: 'var(--bg-container)', borderColor: 'var(--border-color)'}}
      >
        <div className="flex items-center justify-end mb-2 md:hidden">
            <button onClick={onClose} className="p-1" aria-label="إغلاق القائمة">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" style={{color: 'var(--text-secondary)'}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
        </div>
        <button
          onClick={onNewConversation}
          className="w-full text-center px-4 py-3 mb-4 rounded-lg font-semibold transition-colors"
          style={{
            backgroundColor: 'var(--primary-accent)',
            color: 'var(--text-on-accent)',
          }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-accent-hover)'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-accent)'; }}
        >
          محادثة جديدة +
        </button>
        <div className="flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {conversations.map((topic) => (
              <li 
                key={topic} 
                className="flex items-center justify-between group rounded-md transition-colors duration-200"
                style={{
                    backgroundColor: activeTopic === topic ? 'var(--secondary-accent)' : 'transparent',
                    borderRight: activeTopic === topic ? '3px solid var(--primary-accent)' : '3px solid transparent'
                  }}
                  onMouseOver={(e) => { if (topic !== activeTopic) e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                  onMouseOut={(e) => { if (topic !== activeTopic) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <button
                  onClick={() => onSelectTopic(topic)}
                  className="flex-grow text-right px-3 py-2 rounded-md text-base"
                  style={{
                    color: 'var(--text-primary)',
                    fontWeight: activeTopic === topic ? 'bold' : 'normal'
                  }}
                >
                  {topic}
                </button>
                <button 
                  onClick={() => setTopicToDelete(topic)}
                  className="px-2 py-0.5 text-xs rounded-md transition-all opacity-0 group-hover:opacity-100 mr-2"
                  aria-label={`حذف محادثة ${topic}`}
                  style={{
                    backgroundColor: 'var(--destructive-color-light-bg)',
                    color: 'var(--destructive-color-dark-text)'
                  }}
                >
                  حذف
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      {topicToDelete && (
        <ConfirmationModal
          isOpen={!!topicToDelete}
          onClose={() => setTopicToDelete(null)}
          onConfirm={handleDeleteConfirm}
          title="تأكيد الحذف"
          confirmText="نعم، حذف"
          confirmStyle={{ backgroundColor: 'var(--destructive-color)' }}
        >
          <p className="text-center mb-6 text-lg" style={{color: 'var(--text-primary)'}}>
            هل أنت متأكد من حذف محادثة <span className="font-bold" style={{color: 'var(--primary-accent)'}}>{topicToDelete}</span>؟
            <br />
            سيتم حذفها بشكل نهائي.
          </p>
        </ConfirmationModal>
      )}
    </>
  );
};

export default ConversationList;