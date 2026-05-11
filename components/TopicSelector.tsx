import React, { useState, useEffect } from 'react';
import { Topic } from '../types';
import { TOPICS } from '../constants';
import { checkAvailableTopics } from '../services/knowledgeService';

interface TopicSelectorProps {
  onSelectTopic: (topic: Topic) => void;
  onOpenDisclaimer: () => void;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({ onSelectTopic, onOpenDisclaimer }) => {
  const [availableTopics, setAvailableTopics] = useState<Set<Topic>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const topics = await checkAvailableTopics();
        setAvailableTopics(topics);
      } catch (error) {
        console.error("Failed to check for available topics:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTopics();
  }, []);


  if (isLoading) {
    return (
        <div className="p-8 text-center" style={{color: 'var(--primary-accent)'}}>
            <div className="flex justify-center items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>جاري تحميل التخصصات المتاحة...</span>
            </div>
        </div>
    );
  }

  return (
    <div className="p-8 text-center">
       <button
            onClick={onOpenDisclaimer}
            className="mb-8 mx-auto py-2 px-4 rounded-lg transition-colors hover:bg-[var(--bg-hover)] flex items-center gap-2"
            aria-label="تنبيه هام"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">تنبيه</span>
        </button>
      <h2 className="text-3xl font-bold mb-6" style={{color: 'var(--primary-accent)'}}>اختر التخصص للبدء</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {TOPICS.map((topic) => {
          const isEnabled = availableTopics.has(topic);
          return (
            <button
              key={topic}
              onClick={() => onSelectTopic(topic)}
              disabled={!isEnabled}
              className="p-4 rounded-lg shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed border topic-button"
              style={{
                borderColor: isEnabled ? 'var(--border-color)' : '#cccccc',
                '--tw-ring-color': 'var(--primary-accent)',
                '--tw-ring-offset-color': 'var(--bg-container)'
              } as React.CSSProperties}
            >
              <span className="text-xl font-semibold">{topic}</span>
              {!isEnabled && <span className="block text-xs mt-1">(قريبا)</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TopicSelector;