import React, { useState, useCallback, useRef, useEffect } from "react";
import { Topic, Message as MessageType, BookEntry, ScholarEra } from "./types";
import TopicSelector from "./components/TopicSelector";
import ChatView from "./components/ChatView";
import DisclaimerModal from "./components/DisclaimerModal";
import ConversationList from "./components/ConversationList";
import {
  getBookContent,
  getBookTitlesForTopic,
  getBookEntriesForTopic,
  getSingleBookContent,
  getAvailableErasForTopic,
} from "./services/knowledgeService";
import {
  getSystemInstruction,
  classifyTopic,
} from "./services/geminiService";
import { TOPICS } from "./constants";

interface ConversationState {
  messages: MessageType[];
  isTyping: boolean;
  bookTitles: string[];
  knowledgeBase: string;
  scholarEra: ScholarEra;
  availableEras: ScholarEra[];
}

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<
    Partial<Record<Topic, ConversationState>>
  >({});
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const stopGenerationRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const initConversation = useCallback(
    async (topic: Topic) => {
      if (conversations[topic]) {
        setActiveTopic(topic);
        return;
      }

      const initialMessage =
        topic === Topic.Tafsir
          ? {
              id: "initial-tafsir",
              text: "عن أي آية كريمة تود أن تسأل في التفسير؟",
              sender: "bot",
            }
          : {
              id: "initial",
              text: `السلام عليكم ورحمة الله. حياك الله بالسلام يا طالب العلم، كيف يمكنني مساعدتك في تخصص ${topic}؟`,
              sender: "bot",
            };

      const defaultEra: ScholarEra = "all";

      setConversations((prev) => ({
        ...prev,
        [topic]: {
          messages: [initialMessage],
          isTyping: true,
          bookTitles: [],
          knowledgeBase: "",
          scholarEra: defaultEra,
          availableEras: [],
        },
      }));
      setActiveTopic(topic);

      try {
        const availableEras = await getAvailableErasForTopic(topic);
        const titles = await getBookTitlesForTopic(topic, defaultEra);
        const content =
          topic === Topic.Tafsir ? "" : await getBookContent(topic, defaultEra);

        if (content !== null) {
          setConversations((prev) => ({
            ...prev,
            [topic]: {
              ...prev[topic]!,
              bookTitles: titles,
              knowledgeBase: content,
              isTyping: false,
              availableEras,
            },
          }));
        } else {
          throw new Error(
            "عفوًا، لا يوجد محتوى متوفر لهذا التخصص في الوقت الحالي.",
          );
        }
      } catch (error) {
        const errorMessageText =
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع أثناء تحميل المصادر.";
        setConversations((prev) => {
          const newMessages = [
            ...prev[topic]!.messages,
            { id: "error-kb", text: errorMessageText, sender: "bot" },
          ];
          return {
            ...prev,
            [topic]: {
              ...prev[topic]!,
              isTyping: false,
              messages: newMessages,
            },
          };
        });
      }
    },
    [conversations],
  );

  const handleScholarEraChange = useCallback(
    async (newEra: ScholarEra) => {
      if (
        !activeTopic ||
        conversations[activeTopic]?.scholarEra === newEra ||
        conversations[activeTopic]?.isTyping
      )
        return;

      const currentConvo = conversations[activeTopic]!;
      setConversations((prev) => ({
        ...prev,
        [activeTopic]: { ...currentConvo, isTyping: true },
      }));

      let systemMessageText: string;
      if (newEra === "all") {
        systemMessageText = "تم التبديل إلى جميع المصادر.";
      } else if (newEra === "motaqdmeen") {
        systemMessageText = "تم التبديل إلى مصادر المتقدمين.";
      } else {
        systemMessageText = "تم التبديل إلى مصادر المتأخرين.";
      }

      const systemMessage: MessageType = {
        id: Date.now().toString(),
        text: systemMessageText,
        sender: "bot",
        isSystem: true,
      };

      try {
        const titles = await getBookTitlesForTopic(activeTopic, newEra);
        const content =
          activeTopic === Topic.Tafsir
            ? ""
            : await getBookContent(activeTopic, newEra);

        if (content !== null) {
          setConversations((prev) => {
            const updatedConvo = prev[activeTopic]!;
            return {
              ...prev,
              [activeTopic]: {
                ...updatedConvo,
                messages: [...updatedConvo.messages, systemMessage],
                bookTitles: titles,
                knowledgeBase: content,
                scholarEra: newEra,
                isTyping: false,
              },
            };
          });
        } else {
          throw new Error("تعذر تحميل المحتوى لهذه الفترة.");
        }
      } catch (error) {
        const errorMessageText =
          error instanceof Error
            ? error.message
            : "حدث خطأ أثناء تبديل المصادر.";
        const errorMessage: MessageType = {
          id: "error-era-switch",
          text: errorMessageText,
          sender: "bot",
          isSystem: true,
        };
        setConversations((prev) => {
          const updatedConvo = prev[activeTopic]!;
          return {
            ...prev,
            [activeTopic]: {
              ...updatedConvo,
              messages: [...updatedConvo.messages, errorMessage],
              isTyping: false,
            },
          };
        });
      }
    },
    [activeTopic, conversations],
  );

  const handleSelectTopic = useCallback(
    (topic: Topic) => {
      initConversation(topic);
      setIsSidebarOpen(false);
    },
    [initConversation],
  );

  const handleSwitchToTopic = useCallback((topic: Topic) => {
    setActiveTopic(topic);
    setIsSidebarOpen(false);
  }, []);

  const handleNewConversation = () => {
    setActiveTopic(null);
    setIsSidebarOpen(false);
  };

  const handleDeleteConversation = useCallback(
    (topicToDelete: Topic) => {
      setConversations((prev) => {
        const newConversations = { ...prev };
        delete newConversations[topicToDelete];
        return newConversations;
      });
      if (activeTopic === topicToDelete) {
        setActiveTopic(null);
      }
    },
    [activeTopic],
  );

  const handleClearConversation = useCallback(
    (topicToClear: Topic) => {
      if (!conversations[topicToClear]) return;

      const initialMessage =
        topicToClear === Topic.Tafsir
          ? {
              id: "initial-tafsir",
              text: "عن أي آية كريمة تود أن تسأل في التفسير؟",
              sender: "bot",
            }
          : {
              id: "initial",
              text: `السلام عليكم ورحمة الله. حياك الله بالسلام يا طالب العلم، كيف يمكنني مساعدتك في تخصص ${topicToClear}؟`,
              sender: "bot",
            };

      setConversations((prev) => ({
        ...prev,
        [topicToClear]: {
          ...prev[topicToClear]!,
          messages: [initialMessage],
          isTyping: false,
        },
      }));
    },
    [conversations],
  );

  const handleTafsirSelection = useCallback(
    async (book: BookEntry, ayah: string) => {
      if (!activeTopic || activeTopic !== Topic.Tafsir) return;

      const currentConvo = conversations[activeTopic]!;

      const selectionMessage: MessageType = {
        id: Date.now().toString(),
        text: `تفسير: ${book.title}`,
        sender: "user",
      };

      setConversations((prev) => {
        const currentMessages = prev[activeTopic]!.messages;
        const newMessages = currentMessages.filter((m) => !m.tafsirOptions);
        return {
          ...prev,
          [activeTopic]: {
            ...currentConvo,
            messages: [...newMessages, selectionMessage],
            isTyping: true,
          },
        };
      });

      stopGenerationRef.current = false;
      const botMessageId = (Date.now() + 1).toString();
      const loadingMessage: MessageType = {
        id: botMessageId,
        text: "",
        sender: "bot",
        isLoading: true,
      };
      setConversations((prev) => ({
        ...prev,
        [activeTopic]: {
          ...prev[activeTopic]!,
          messages: [...prev[activeTopic]!.messages, loadingMessage],
        },
      }));

      try {
        const bookContent = await getSingleBookContent(
          Topic.Tafsir,
          book.file,
          currentConvo.scholarEra,
        );
        if (!bookContent) {
          throw new Error(`تعذر تحميل محتوى كتاب: ${book.title}`);
        }

        const systemInstruction = `أنت مساعد متخصص في التفسير. مهمتك هي البحث في النص المرفق من كتاب "${book.title}" عن تفسير الآية التي طلبها المستخدم وهي: "${ayah}".
- **الإجابة المباشرة:** قدم التفسير المباشر للآية كما ورد في النص.
- **الاقتباس الأمين:** اقتبس النص بأمانة ودقة.
- **عدم الاجتهاد:** إذا لم تجد تفسيرًا صريحًا للآية المحددة في النص، فرد بهذه الرسالة الحرفية فقط: "المعذرة، لم أجد تفسيرًا لهذه الآية الكريمة في هذا الكتاب."
- **التنسيق:** حافظ على التنسيق الأصلي للنص المقتبس.`;

        const contents: any[] = [
          {
            role: "user",
            parts: [
              {
                text: `النص المتاح من كتاب "${book.title}":\n---\n${bookContent}\n---\n\nالرجاء تفسير هذه الآية فقط: "${ayah}"`,
              },
            ],
          },
          {
            role: "model",
            parts: [
              {
                text: "حسنًا، سأبحث في النص المقدم عن تفسير الآية المطلوبة وأقدمه لك.",
              },
            ],
          },
        ];

        const mockAnswer = "هذا تفسير تجريبي (Mock) للآية المطلوبة من كتاب " + book.title + ".\\n\\nالنظام حالياً قيد التحديث إلى نظام RAG مخصص.\\n\\n(المصدر: " + book.title + ", ص ١)\\n[Precision: 99%]";
        let messageReceived = false;

        for (let i = 0; i < mockAnswer.length; i++) {
          if (stopGenerationRef.current) break;
          const char = mockAnswer[i];

          setConversations((prev) => {
            const convo = prev[activeTopic]!;
            if (!convo) return prev;
            const newMessages = [...convo.messages];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.id === botMessageId) {
              newMessages[newMessages.length - 1] = {
                ...lastMessage,
                text: (lastMessage.text || "") + char,
                isLoading: false,
              };
            }
            return {
              ...prev,
              [activeTopic]: { ...convo, messages: newMessages },
            };
          });
          await new Promise((resolve) => setTimeout(resolve, 10)); // Typing effect
          messageReceived = true;
        }
      } catch (error) {
        const errorMessageText =
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
        setConversations((prev) => {
          const convo = prev[activeTopic]!;
          const newMessages = [...convo.messages];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.id === botMessageId) {
            newMessages[newMessages.length - 1] = {
              ...lastMessage,
              text: errorMessageText,
              isLoading: false,
            };
          } else {
            newMessages.push({
              id: botMessageId,
              text: errorMessageText,
              sender: "bot",
            });
          }
          return {
            ...prev,
            [activeTopic]: { ...convo, messages: newMessages },
          };
        });
      } finally {
        if (activeTopic) {
          setConversations((prev) => ({
            ...prev,
            [activeTopic]: { ...prev[activeTopic]!, isTyping: false },
          }));
        }
      }
    },
    [activeTopic, conversations],
  );

  const handleSendMessage = useCallback(
    async (text: string, skipClassification: boolean = false) => {
      if (
        !text.trim() ||
        !activeTopic ||
        !conversations[activeTopic] ||
        conversations[activeTopic]?.isTyping
      )
        return;

      const currentConvo = conversations[activeTopic]!;

      const userMessage: MessageType = {
        id: Date.now().toString(),
        text,
        sender: "user",
      };
      setConversations((prev) => ({
        ...prev,
        [activeTopic]: {
          ...currentConvo,
          messages: [...currentConvo.messages, userMessage],
        },
      }));

      if (activeTopic === Topic.Tafsir) {
        setConversations((prev) => ({
          ...prev,
          [activeTopic]: { ...prev[activeTopic]!, isTyping: true },
        }));
        try {
          const bookEntries = await getBookEntriesForTopic(
            Topic.Tafsir,
            currentConvo.scholarEra,
          );
          if (bookEntries.length === 0)
            throw new Error("لا توجد كتب تفسير متاحة حاليًا.");

          const optionsMessage: MessageType = {
            id: (Date.now() + 1).toString(),
            sender: "bot",
            text: "اختر من التفاسير المتاحة:",
            tafsirOptions: { ayah: text, books: bookEntries },
          };
          setConversations((prev) => ({
            ...prev,
            [activeTopic]: {
              ...prev[activeTopic]!,
              messages: [...prev[activeTopic]!.messages, optionsMessage],
              isTyping: false,
            },
          }));
        } catch (error) {
          const errorMessageText =
            error instanceof Error ? error.message : "حدث خطأ غير متوقع.";
          const errorMessage: MessageType = {
            id: (Date.now() + 1).toString(),
            text: errorMessageText,
            sender: "bot",
          };
          setConversations((prev) => ({
            ...prev,
            [activeTopic]: {
              ...prev[activeTopic]!,
              messages: [...prev[activeTopic]!.messages, errorMessage],
              isTyping: false,
            },
          }));
        }
        return;
      }

      setConversations((prev) => ({
        ...prev,
        [activeTopic]: { ...prev[activeTopic]!, isTyping: true },
      }));

      if (!skipClassification) {
        const classifiedTopic = await classifyTopic(text, TOPICS, activeTopic);
        if (classifiedTopic && classifiedTopic !== activeTopic) {
          const suggestionMessage: MessageType = {
            id: (Date.now() + 1).toString(),
            text: `يبدو أن سؤالك يتعلق بتخصص '${classifiedTopic}'. هل تود الانتقال إلى محادثة ${classifiedTopic} للإجابة على سؤالك؟`,
            sender: "bot",
            topicSwitchSuggestion: {
              newTopic: classifiedTopic,
              originalQuery: text,
            },
          };
          setConversations((prev) => ({
            ...prev,
            [activeTopic]: {
              ...prev[activeTopic]!,
              messages: [...prev[activeTopic]!.messages, suggestionMessage],
              isTyping: false,
            },
          }));
          return;
        }
      }

      stopGenerationRef.current = false;
      const botMessageId = (Date.now() + 1).toString();
      const loadingMessage: MessageType = {
        id: botMessageId,
        text: "",
        sender: "bot",
        isLoading: true,
      };
      setConversations((prev) => ({
        ...prev,
        [activeTopic]: {
          ...prev[activeTopic]!,
          messages: [...prev[activeTopic]!.messages, loadingMessage],
        },
      }));

      try {
        const systemInstruction = await getSystemInstruction();

        const MAX_HISTORY_MESSAGES = 20;
        let recentMessages = currentConvo.messages
          .slice(1)
          .slice(-MAX_HISTORY_MESSAGES);

        const lastSwitchIndex = recentMessages
          .map((m) => m.isSystem && m.text.includes("تم التبديل إلى مصادر"))
          .lastIndexOf(true);

        if (lastSwitchIndex > -1) {
          recentMessages = recentMessages.slice(lastSwitchIndex + 1);
        }

        const conversationHistory: any[] = recentMessages
          .filter(
            (msg) =>
              !msg.topicSwitchSuggestion &&
              !msg.isLoading &&
              !msg.isSystem &&
              msg.text,
          )
          .map((msg) => ({
            role: msg.sender === "bot" ? "model" : "user",
            parts: [{ text: msg.text }],
          }));

        let queryForSearch = text;
        const wordsCount = text.trim().split(/\s+/).length;
        if (wordsCount <= 5 && conversationHistory.length > 0) {
          const previousUserMessages = conversationHistory.filter(
            (m) => m.role === "user",
          );
          if (previousUserMessages.length > 0) {
            const lastUserQuery =
              previousUserMessages[previousUserMessages.length - 1].parts[0]
                .text;
            queryForSearch = `${lastUserQuery} ${text}`;
          }
        }

        // 1. Fetch relevant context from Vector DB (Backend)
        let mockAnswer = "عذراً، خدمة المحادثة غير متوفرة حالياً.";
        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: queryForSearch, topic: activeTopic }),
          });
          if (res.ok) {
            const data = await res.json();
            mockAnswer = data.answer || "لا توجد إجابة";
          }
        } catch (e) {
          console.error("Failed to query vector backend:", e);
        }

        let messageReceived = false;

        for (let i = 0; i < mockAnswer.length; i++) {
          if (stopGenerationRef.current) break;
          const char = mockAnswer[i];

          setConversations((prev) => {
            const convo = prev[activeTopic]!;
            if (!convo) return prev;
            const newMessages = [...convo.messages];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.id === botMessageId) {
              newMessages[newMessages.length - 1] = {
                ...lastMessage,
                text: (lastMessage.text || "") + char,
                isLoading: false,
              };
            }
            return {
              ...prev,
              [activeTopic]: { ...convo, messages: newMessages },
            };
          });
          await new Promise((resolve) => setTimeout(resolve, 10)); // Typing effect
          messageReceived = true;
        }

        if (!messageReceived && !stopGenerationRef.current) {
          setConversations((prev) => {
            const convo = prev[activeTopic]!;
            const newMessages = [...convo.messages];
            const lastMessage = newMessages[newMessages.length - 1];
            if (
              lastMessage &&
              lastMessage.id === botMessageId &&
              lastMessage.isLoading
            ) {
              newMessages[newMessages.length - 1] = {
                ...lastMessage,
                text: "لم يتم العثور على إجابة.",
                isLoading: false,
              };
            }
            return {
              ...prev,
              [activeTopic]: { ...convo, messages: newMessages },
            };
          });
        }
      } catch (error) {
        if (stopGenerationRef.current) {
          console.log("Stream stopped by user.");
          return;
        }
        const errorMessageText =
          error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
        setConversations((prev) => {
          const convo = prev[activeTopic]!;
          const newMessages = [...convo.messages];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.id === botMessageId) {
            newMessages[newMessages.length - 1] = {
              ...lastMessage,
              text: errorMessageText,
              isLoading: false,
            };
          } else {
            newMessages.push({
              id: botMessageId,
              text: errorMessageText,
              sender: "bot",
            });
          }
          return {
            ...prev,
            [activeTopic]: { ...convo, messages: newMessages },
          };
        });
      } finally {
        if (activeTopic) {
          setConversations((prev) => {
            const convo = prev[activeTopic]!;
            const newMessages = [...convo.messages];
            const lastMessage = newMessages[newMessages.length - 1];
            if (
              lastMessage &&
              lastMessage.id === botMessageId &&
              lastMessage.isLoading
            ) {
              lastMessage.text =
                lastMessage.text.length > 0
                  ? lastMessage.text
                  : "توقفت الاستجابة.";
              lastMessage.isLoading = false;
            }
            return {
              ...prev,
              [activeTopic]: {
                ...convo,
                messages: newMessages,
                isTyping: false,
              },
            };
          });
        }
      }
    },
    [activeTopic, conversations],
  );

  const handleStopGeneration = useCallback(() => {
    stopGenerationRef.current = true;
    if (activeTopic) {
      setConversations((prev) => ({
        ...prev,
        [activeTopic]: { ...prev[activeTopic]!, isTyping: false },
      }));
    }
  }, [activeTopic]);

  const handleTopicSwitchConfirm = useCallback(
    (newTopic: Topic) => {
      if (!activeTopic) return;

      const switchConfirmMessage: MessageType = {
        id: Date.now().toString(),
        text: `تمام، جاري نقلك إلى محادثة ${newTopic}...`,
        sender: "bot",
      };
      setConversations((prev) => {
        const currentMessages = prev[activeTopic!]?.messages || [];
        const newMessages = currentMessages.filter(
          (msg) => !msg.topicSwitchSuggestion,
        );
        return {
          ...prev,
          [activeTopic!]: {
            ...prev[activeTopic!]!,
            messages: [...newMessages, switchConfirmMessage],
          },
        };
      });

      setTimeout(() => {
        initConversation(newTopic);
      }, 1500);
    },
    [activeTopic, initConversation],
  );

  const handleTopicSwitchDecline = useCallback(
    async (messageId: string) => {
      if (!activeTopic) return;

      const currentConvo = conversations[activeTopic];
      if (!currentConvo) return;

      const suggestionMessage = currentConvo.messages.find(
        (m) => m.id === messageId,
      );
      const originalQuery =
        suggestionMessage?.topicSwitchSuggestion?.originalQuery;
      if (!originalQuery) return;

      const filteredMessages = currentConvo.messages.filter(
        (msg) => msg.id !== messageId,
      );

      setConversations((prev) => ({
        ...prev,
        [activeTopic]: { ...currentConvo, messages: filteredMessages },
      }));
      handleSendMessage(originalQuery, true);
    },
    [activeTopic, conversations, handleSendMessage],
  );

  const activeConversation = activeTopic ? conversations[activeTopic] : null;

  if (isLoading) {
    return (
      <div className="loading-screen">
        <img
          src="https://i.ibb.co/xSWrqcKS/13-1.png"
          alt="المحادثة السلفية"
          className="loading-logo"
          style={{ objectFit: "contain" }}
        />
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-4 flex flex-col min-h-screen app-container-visible">
        <header className="text-center mb-4 relative w-full max-w-7xl mx-auto">
          {Object.keys(conversations).length > 0 && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden absolute right-0 top-0 z-10 p-2 rounded-lg transition-colors bg-white shadow-sm hover:bg-[var(--bg-hover)]"
              aria-label="فتح قائمة المحادثات"
              style={{ color: "var(--primary-accent)" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}
          <img
            src="https://i.ibb.co/xSWrqcKS/13-1.png"
            alt="المحادثة السلفية"
            className="h-40 mx-auto"
            style={{ objectFit: "contain" }}
          />
        </header>

        <div
          className="flex flex-1 w-full max-w-7xl mx-auto rounded-lg overflow-hidden"
          style={{
            backgroundColor: "var(--bg-container)",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {isSidebarOpen && (
            <div
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
              aria-hidden="true"
            ></div>
          )}
          <ConversationList
            conversations={Object.keys(conversations) as Topic[]}
            activeTopic={activeTopic}
            onSelectTopic={handleSwitchToTopic}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
          <main
            key={activeTopic || "selector"}
            className="flex-1 flex flex-col content-transition relative min-w-0"
            style={{ backgroundColor: "var(--bg-container)" }}
          >
            {activeConversation ? (
              <ChatView
                topic={activeTopic!}
                messages={activeConversation.messages}
                isTyping={activeConversation.isTyping}
                bookTitles={activeConversation.bookTitles}
                onSendMessage={handleSendMessage}
                onStopGeneration={handleStopGeneration}
                onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
                onSwitchTopic={handleTopicSwitchConfirm}
                onTopicSwitchDecline={handleTopicSwitchDecline}
                onClearConversation={handleClearConversation}
                onTafsirSelection={handleTafsirSelection}
                scholarEra={activeConversation.scholarEra}
                availableEras={activeConversation.availableEras}
                onScholarEraChange={handleScholarEraChange}
              />
            ) : (
              <TopicSelector
                onSelectTopic={handleSelectTopic}
                onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
              />
            )}
          </main>
        </div>
      </div>
      <DisclaimerModal
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
      />
    </div>
  );
};

export default App;
