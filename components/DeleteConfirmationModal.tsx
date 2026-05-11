import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmStyle?: React.CSSProperties;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  children,
  confirmText = 'نعم',
  cancelText = 'إلغاء',
  confirmStyle = { backgroundColor: 'var(--destructive-color)' }
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative p-6 rounded-lg shadow-xl w-full max-w-md m-4"
        style={{
          backgroundColor: 'var(--bg-container)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
        } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-4 text-center" style={{ color: 'var(--primary-accent)' }}>
          {title}
        </h3>
        {children}
        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg font-semibold transition-colors hover:bg-[var(--bg-hover)]"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)'
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 rounded-lg font-semibold transition-colors text-white"
            style={{
              ...confirmStyle
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;