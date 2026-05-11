
export type ScholarEra = 'motaqdmeen' | 'motakhreen' | 'all';

export enum Topic {
  Aqeedah = 'عقيدة',
  Tafsir = 'تفسير',
  Hadith = 'حديث',
  Fiqh = 'فقه',
  Seerah = 'سيرة وتراجم',
  History = 'تاريخ',
}

// Maps topics to their corresponding folder names in the /data/books/ directory.
// The folder name must be in English and lowercase.
export const TopicFolderMap: Record<Topic, string> = {
  [Topic.Aqeedah]: 'aqeedah',
  [Topic.Tafsir]: 'tafsir',
  [Topic.Hadith]: 'hadith',
  [Topic.Fiqh]: 'fiqh',
  [Topic.Seerah]: 'seerah',
  [Topic.History]: 'history',
};

export interface BookEntry {
  file: string;
  title: string;
}

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  isLoading?: boolean;
  isSystem?: boolean;
  topicSwitchSuggestion?: {
    newTopic: Topic;
    originalQuery: string;
  };
  tafsirOptions?: {
    ayah: string;
    books: BookEntry[];
  };
}