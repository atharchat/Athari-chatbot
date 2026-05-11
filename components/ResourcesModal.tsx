
import React from 'react';
import { Topic, ScholarEra } from '../types';

interface ResourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: string[];
  topic: Topic;
  scholarEra: ScholarEra;
}

const ResourcesModal: React.FC<ResourcesModalProps> = ({ isOpen, onClose, books, topic, scholarEra }) => {
  if (!isOpen) {
    return null;
  }

  const getTitle = () => {
    switch (scholarEra) {
      case 'motaqdmeen':
        return `المصادر المعتمدة من كتب المتقدمين في تخصص: ${topic}`;
      case 'motakhreen':
        return `المصادر المعتمدة من كتب المتأخرين في تخصص: ${topic}`;
      default:
        return `المصادر المعتمدة في تخصص: ${topic}`;
    }
  };


  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="relative p-6 rounded-lg shadow-xl w-full max-w-lg m-4"
        style={{
          backgroundColor: 'var(--bg-container)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          maxHeight: '80vh',
          overflowY: 'auto'
        } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <button 
          onClick={onClose}
          className="absolute top-2 left-2 text-2xl font-bold transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          aria-label="إغلاق"
        >
          &times;
        </button>

        <h3 
          className="text-2xl font-bold mb-4 pb-2 text-center" 
          style={{ 
            color: 'var(--primary-accent)', 
            borderBottom: '1px solid var(--border-color)'
          }}
        >
          {getTitle()}
        </h3>

        {books.length > 0 ? (
          <ul className="space-y-3 list-disc list-inside pr-4" style={{fontFamily: "'Amiri Quran', serif"}}>
            {books.map((title, index) => (
              <li key={index} className="text-lg">
                {title}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-lg">لا توجد مصادر محددة لهذا التخصص حاليًا.</p>
        )}
      </div>
    </div>
  );
};

export default ResourcesModal;