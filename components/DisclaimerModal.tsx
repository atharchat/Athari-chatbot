
import React from 'react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, onClose }) => {
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
        className="relative p-6 rounded-lg shadow-xl w-full max-w-lg m-4"
        style={{
          backgroundColor: 'var(--bg-container)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          maxHeight: '80vh',
          overflowY: 'auto'
        } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
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
          تنبيه وإخلاء مسؤولية
        </h3>

        <div className="space-y-4 text-lg" style={{fontFamily: "'Amiri Quran', serif"}}>
            <p>
                يجب ألا يتم الاعتماد على الفتاوى والأحكام من خلال هذا البوت لأنه ليس متأصلاً، وإنما هو مجرد مساعد آلي تدرب على كتب السلف.
            </p>
            <p>
                الاستفتاء يكون من أهل العلم المتأصلين. ولكن يمكن الانتفاع بالشات من خلال الاستفادة من النقول والآثار والأدلة.
            </p>
            <p className="font-bold" style={{color: 'var(--primary-accent)'}}>
                نبرأ إلى الله من أي استخدام خاطئ للبوت أو الاعتماد عليه حصرًا في المسائل الشرعية بدون الرجوع لأهل العلم فيها.
            </p>
            <p>
                تم تأسيس البوت لمساعدة طلبة العلم والباحثين عن الأدلة من كتب أهل الحديث والأثر.
            </p>
            <p className="text-center mt-4" style={{color: 'var(--text-secondary)'}}>
                وفقكم الله وبارك فيكم، نسألكم الدعاء.
            </p>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerModal;
