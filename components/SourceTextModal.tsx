
import React from 'react';

interface SourceTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

const SourceTextModal: React.FC<SourceTextModalProps> = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative p-6 rounded-lg shadow-xl w-full max-w-2xl m-4 flex flex-col"
        style={{
          backgroundColor: 'var(--bg-container)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          maxHeight: '90vh',
        } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <button
          onClick={onClose}
          className="absolute top-2 left-2 text-3xl font-bold transition-colors leading-none"
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
            borderBottom: '1px solid var(--border-color)',
            fontFamily: "'Qahiri', sans-serif"
          }}
        >
          النص المقتبس من: {title}
        </h3>

        <div className="overflow-y-auto pr-2" style={{ fontFamily: "'Amiri Quran', serif" }}>
            <p className="text-lg whitespace-pre-wrap leading-relaxed text-right">
                {content}
            </p>
        </div>
      </div>
    </div>
  );
};

export default SourceTextModal;
