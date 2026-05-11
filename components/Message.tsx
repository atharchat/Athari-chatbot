import React, { useState } from 'react';
import { Message as MessageType, Topic, BookEntry } from '../types';

interface MessageProps {
  message: MessageType;
  onTopicSwitchConfirm?: (newTopic: Topic) => void;
  onTopicSwitchDecline?: (messageId: string) => void;
  onTafsirSelection?: (book: BookEntry, ayah: string) => void;
}

const PenIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-2 opacity-70" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);

const BookIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4 inline-block ml-2 opacity-80"} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
    </svg>
);

const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 flex-shrink-0" style={{color: 'var(--primary-accent)'}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const CopyIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
);

const Message: React.FC<MessageProps> = ({ message, onTopicSwitchConfirm, onTopicSwitchDecline, onTafsirSelection }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.sender === 'user';

  if (message.isLoading) {
    return (
      <div className="flex justify-start">
        <div className="max-w-none px-4 py-3 rounded-2xl rounded-bl-lg" style={{backgroundColor: 'var(--bot-message-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)'}}>
           <div className="font-bold text-base mb-2 pb-2 flex items-center gap-2" style={{color: 'var(--primary-accent)', borderBottom: '1px solid var(--border-color)'}}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>الجواب</span>
            </div>
            <div className="loading-dots flex items-center justify-center h-6">
              <span>.</span><span>.</span><span>.</span>
            </div>
        </div>
      </div>
    );
  }

  if (message.isSystem) {
    return (
        <div className="text-center text-sm italic" style={{ color: 'var(--text-secondary)' }}>
            {message.text}
        </div>
    );
  }

  let fullText = message.text;
  let shortAnswerText: string | null = null;
  let mainText: string = fullText;
  let precisionText = null;
  
  const shortAnswerMarker = '**الجواب المختصر:**';
  const detailMarkerNew = '**الدليل التفصيلي:**';
  const detailMarkerOld = '@@الدليل التفصيلي:@@';
  
  const shortAnswerStartIndex = fullText.indexOf(shortAnswerMarker);
  let detailStartIndex = fullText.indexOf(detailMarkerNew);
  if (detailStartIndex === -1) {
    detailStartIndex = fullText.indexOf(detailMarkerOld);
  }

  if (shortAnswerStartIndex !== -1) {
    const endOfShortAnswer = detailStartIndex !== -1 ? detailStartIndex : fullText.length;
    shortAnswerText = fullText.substring(shortAnswerStartIndex + shortAnswerMarker.length, endOfShortAnswer).trim();
    mainText = detailStartIndex !== -1 ? fullText.substring(detailStartIndex) : '';
  } else {
    mainText = fullText;
  }

  const precisionRegex = /\s*\[Precision: (\d{1,3}%?)\]\s*$/m;
  const precisionMatch = mainText.match(precisionRegex);
  if (precisionMatch && precisionMatch[1]) {
    precisionText = precisionMatch[1];
    mainText = mainText.replace(precisionRegex, '').trim();
  }
  
  const formatTextForCopying = (short: string | null, main: string): string => {
    let result = '';

    if (short) {
        result += `**الجواب المختصر:** ${short}\n\n`;
    }

    // A more robust regex to remove footnote numbers that might follow various quote styles
    let processedMain = main.replace(/([﴾}"»])\s*\d+\.?/g, '$1');

    processedMain = processedMain
        .replace(/@@(.*?)@@/g, '**$1**')
        .replace(/\*\*قال (.*?):\*\*/g, '🖋️ قال $1:')
        .replace(/__/g, '') // Remove underline markers
        .replace(/\(المصدر:(.*?)\)/g, '📖 (المصدر:$1)');

    result += processedMain;
    return result.trim();
  };


  const handleCopy = () => {
    const textToCopy = formatTextForCopying(shortAnswerText, mainText);
    navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    });
  };

  const renderFormattedText = (text: string) => {
    // For topic switch suggestions, just return the text as is.
    if (message.topicSwitchSuggestion || message.tafsirOptions) {
      return <p className="text-lg whitespace-pre-wrap leading-relaxed" style={{ fontFamily: "'El Messiri', sans-serif" }}>{text}</p>;
    }
      
    const regex = /(@@.*?@@|\*\*قال .*?:\*\*|__.*?__|\*\*.*?\*\*|﴿.*?﴾|\{.*?\}|«.*?»|\(المصدر:.*?\)\n?|\n)/g;
    const parts = text.split(regex).filter(Boolean);

    return parts.map((part, index) => {
      if (part === '\n') {
        return <br key={index} />;
      }
      if (part.startsWith('@@') && part.endsWith('@@')) {
        return <span key={index} style={{ color: 'var(--primary-accent)', fontWeight: 'bold' }}>{part.slice(2, -2)}</span>;
      }
      if (part.startsWith('**قال ') && part.endsWith(':**')) {
        return <span key={index}><PenIcon />{part.slice(2, -2)}:</span>;
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('__') && part.endsWith('__')) {
        return <span key={index} className="underline" style={{ textDecorationColor: 'var(--primary-accent)', textDecorationThickness: '1.5px', textUnderlineOffset: '3px' }}>{part.slice(2, -2)}</span>;
      }
      if (part.startsWith('﴿') || part.startsWith('{')) {
        return <span key={index} style={{ color: 'var(--primary-accent)', fontWeight: 600, opacity: 0.9 }}>{part}</span>;
      }
      if (part.startsWith('«')) {
        return <span key={index} style={{ fontWeight: 600, opacity: 0.9 }}>{part}</span>;
      }
      if (part.trim().startsWith('(المصدر:')) {
        return (
          <p key={index} className="source-citation-inline">
            <BookIcon className="h-5 w-5" />
            <span>{part.trim()}</span>
          </p>
        );
      }
      return part;
    });
  };
  
  const userStyle: React.CSSProperties = {
    backgroundColor: 'var(--user-message-bg)',
    color: 'var(--text-primary)',
    boxShadow: 'var(--shadow-sm)',
  };
  const botStyle: React.CSSProperties = {
    backgroundColor: 'var(--bot-message-bg)',
    color: 'var(--text-primary)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border-color)',
  };


  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`${isUser ? 'max-w-2xl' : 'max-w-none'} px-4 py-3 relative ${isUser ? 'rounded-2xl rounded-br-lg' : 'rounded-2xl rounded-bl-lg'}`}
        style={isUser ? userStyle : botStyle}
      >
        {!isUser && !message.topicSwitchSuggestion && !message.tafsirOptions && (
            <div className="font-bold text-base mb-2 pb-2 flex items-center justify-between" style={{borderBottom: '1px solid var(--border-color)'}}>
                <div className="flex items-center gap-2" style={{color: 'var(--primary-accent)'}}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>الجواب</span>
                </div>
                 <button onClick={handleCopy} className="p-1 rounded-full hover:bg-[var(--bg-hover)] transition-colors" aria-label={copied ? "تم النسخ" : "نسخ النص"}>
                    {copied ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" style={{color: 'var(--primary-accent)'}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                       <CopyIcon className="h-5 w-5" style={{color: 'var(--text-secondary)'}} />
                    )}
                </button>
            </div>
        )}

        {shortAnswerText && !isUser && (
            <div className="mb-4 p-3 rounded-lg border" style={{ backgroundColor: 'var(--secondary-accent)', borderColor: 'var(--border-color)'}}>
                <div className="flex items-start gap-3">
                    <CheckIcon />
                    <div className="flex-1">
                        <p className="text-lg whitespace-pre-wrap leading-relaxed" style={{fontFamily: "'Amiri Quran', serif", fontWeight: 'bold'}}>{shortAnswerText}</p>
                    </div>
                </div>
            </div>
        )}
        
        <div className="text-lg whitespace-pre-wrap leading-relaxed" style={{fontFamily: "'Amiri Quran', serif"}}>{renderFormattedText(mainText)}</div>
        
        {message.topicSwitchSuggestion && !isUser && onTopicSwitchConfirm && onTopicSwitchDecline && (
            <div className="mt-4 flex gap-3">
                <button
                    onClick={() => onTopicSwitchConfirm(message.topicSwitchSuggestion!.newTopic)}
                    className="px-4 py-2 rounded-md text-sm font-semibold transition-colors"
                    style={{
                        backgroundColor: 'var(--primary-accent)',
                        color: 'var(--text-on-accent)',
                    }}
                >
                    نعم، انتقل
                </button>
                <button
                    onClick={() => onTopicSwitchDecline(message.id)}
                    className="px-4 py-2 rounded-md text-sm font-semibold transition-colors hover:bg-[var(--bg-hover)]"
                    style={{
                        backgroundColor: 'transparent',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)'
                    }}
                >
                    لا، ابق هنا
                </button>
            </div>
        )}
        
        {message.tafsirOptions && !isUser && onTafsirSelection && (
          <div className="mt-4 flex flex-wrap gap-3">
            {message.tafsirOptions.books.map(book => (
              <button
                key={book.file}
                onClick={() => onTafsirSelection(book, message.tafsirOptions!.ayah)}
                className="px-4 py-2 rounded-md text-sm font-semibold transition-colors hover:bg-[var(--primary-accent-hover)]"
                style={{
                  backgroundColor: 'var(--primary-accent)',
                  color: 'var(--text-on-accent)',
                }}
              >
                {book.title}
              </button>
            ))}
          </div>
        )}


        {precisionText && !isUser && (
            <div className="source-citation mt-2 pt-2 text-sm">
                <span>الدقة: {precisionText}</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default Message;
