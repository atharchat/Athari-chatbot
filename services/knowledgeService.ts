import { Topic, TopicFolderMap, BookEntry, ScholarEra } from "../types";

type EraData = Record<ScholarEra, BookEntry[]>;
type Manifest = Record<string, EraData | BookEntry[]>; // Support both old and new structure for robustness

// Base URL for the knowledge base files.
const KNOWLEDGE_BASE_URL = "/data/";

// Caches
const bookCache = new Map<string, string>();
let manifestCache: Manifest | null = null;
const availableTopicsCache = new Set<Topic>();
let topicsChecked = false;
let scholarsConfigCache: string[] | null = null;

/**
 * Fetches and parses the manifest.json file, caching the result.
 * @returns A promise that resolves to the manifest object.
 */
const getManifest = async (): Promise<Manifest> => {
  if (manifestCache) {
    return manifestCache;
  }
  try {
    const response = await fetch(`${KNOWLEDGE_BASE_URL}books/manifest.json`);
    if (!response.ok) {
      throw new Error(
        `manifest.json not found or failed to load: ${response.statusText}`,
      );
    }
    const manifest = await response.json();
    manifestCache = manifest;
    return manifest;
  } catch (error) {
    console.error("Failed to fetch or parse manifest.json:", error);
    return {}; // Return empty object on failure to prevent crashes
  }
};

/**
 * Fetches the list of scholars for whom honorifics should be avoided.
 * @returns A promise that resolves to an array of scholar names.
 */
export const getScholarsToAvoidHonorifics = async (): Promise<string[]> => {
  if (scholarsConfigCache) {
    return scholarsConfigCache;
  }
  try {
    const response = await fetch(`${KNOWLEDGE_BASE_URL}scholars_config.json`);
    if (!response.ok) {
      console.warn(
        "scholars_config.json not found. No honorific rules will be applied.",
      );
      scholarsConfigCache = [];
      return [];
    }
    const config = await response.json();
    const scholars = config?.scholars_to_avoid_honorifics_for || [];
    scholarsConfigCache = Array.isArray(scholars) ? scholars : [];
    return scholarsConfigCache;
  } catch (error) {
    console.error("Failed to fetch or parse scholars_config.json:", error);
    scholarsConfigCache = [];
    return [];
  }
};

/**
 * Checks which topics are available by reading the keys from manifest.json.
 * @returns A promise that resolves to a Set of available topics.
 */
export const checkAvailableTopics = async (): Promise<Set<Topic>> => {
  if (topicsChecked) {
    return availableTopicsCache;
  }

  const manifest = await getManifest();
  const availableFolders = Object.keys(manifest);

  const folderToTopicMap = new Map<string, Topic>();
  for (const key in TopicFolderMap) {
    const topic = key as Topic;
    const folder = TopicFolderMap[topic];
    folderToTopicMap.set(folder, topic);
  }

  availableFolders.forEach((folder) => {
    if (folderToTopicMap.has(folder)) {
      availableTopicsCache.add(folderToTopicMap.get(folder)!);
    }
  });

  topicsChecked = true;
  return availableTopicsCache;
};

/**
 * Parses HTML book content to extract clean text.
 * @param htmlString The HTML content of the book.
 * @returns A clean string representation of the book content.
 */
const parseHtmlBookContent = (htmlString: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");

  // Attempt to find the main content, otherwise use the body
  const mainContent = doc.querySelector(".Main") || doc.body;

  // Remove script and style elements
  mainContent.querySelectorAll("script, style").forEach((el) => el.remove());

  // A simple heuristic to remove headers/footers/intros if they exist in a structured way
  // This is a basic example; more specific selectors might be needed for different book formats
  mainContent.querySelectorAll(".PageHead, .title, .footnote").forEach((el) => {
    if (
      el.textContent &&
      (el.textContent.includes("مقدمة") || el.textContent.includes("فهرس"))
    ) {
      el.parentElement?.remove();
    }
  });

  // Replace block elements with newlines for better readability
  mainContent.querySelectorAll("p, div, br, hr").forEach((el) => {
    const suffix = el.tagName.toLowerCase() === "br" ? "" : "\n";
    el.insertAdjacentText("afterend", suffix);
  });

  return (mainContent.textContent || "").replace(/\s\s+/g, " ").trim();
};

/**
 * Fetches, concatenates, and caches the content of all books for a given topic and era.
 * @param topic The topic for which to get the book content.
 * @param era The scholar era ('motaqdmeen', 'motakhreen', or 'all').
 * @returns A promise that resolves to the combined book content as a string, or null if not found.
 */
export const getBookContent = async (
  topic: Topic,
  era: ScholarEra,
): Promise<string | null> => {
  const cacheKey = `${topic}-${era}`;
  if (bookCache.has(cacheKey)) {
    return bookCache.get(cacheKey)!;
  }

  const folderName = TopicFolderMap[topic];
  if (!folderName) return null;

  let bookEntries: BookEntry[] = [];
  if (era === "all") {
    const motaqdmeenEntries = await getBookEntriesForTopic(topic, "motaqdmeen");
    const motakhreenEntries = await getBookEntriesForTopic(topic, "motakhreen");
    bookEntries = [...motaqdmeenEntries, ...motakhreenEntries];
  } else {
    bookEntries = await getBookEntriesForTopic(topic, era);
  }

  if (bookEntries.length === 0) {
    return ""; // Return empty string if no books are listed to prevent errors
  }

  try {
    const fetchPromises = bookEntries.map((book) =>
      fetch(`${KNOWLEDGE_BASE_URL}books/${folderName}/${book.file}`).then(
        (res) => {
          if (!res.ok)
            throw new Error(
              `Failed to fetch book: ${KNOWLEDGE_BASE_URL}books/${folderName}/${book.file}`,
            );
          return res
            .text()
            .then((text) => ({ text, file: book.file, title: book.title }));
        },
      ),
    );

    const bookResults = await Promise.all(fetchPromises);

    const processedContents = bookResults.map(({ text, file, title }) => {
      let content;
      if (file.endsWith(".html")) {
        content = parseHtmlBookContent(text);
      } else {
        content = text;
      }

      const sourceName = title;
      const cleanedContent = content.trim();
      return `[مقتبس من كتاب: ${sourceName}]\n${cleanedContent}`;
    });

    const fullContent = processedContents.join(
      "\n\n========================================\n\n",
    );
    bookCache.set(cacheKey, fullContent);
    return fullContent;
  } catch (error) {
    console.error(`Error loading book content for ${topic} (${era}):`, error);
    return null;
  }
};

/**
 * Fetches the content of a single book.
 * @param topic The topic of the book.
 * @param file The file name of the book.
 * @param era The scholar era.
 * @returns A promise that resolves to the book content as a string, or null if not found.
 */
export const getSingleBookContent = async (
  topic: Topic,
  file: string,
  era: ScholarEra,
): Promise<string | null> => {
  const cacheKey = `${topic}-${era}-${file}`;
  if (bookCache.has(cacheKey)) {
    return bookCache.get(cacheKey)!;
  }

  const folderName = TopicFolderMap[topic];
  if (!folderName) return null;

  const bookEntries = await getBookEntriesForTopic(topic, era);
  const bookEntry = bookEntries?.find((b) => b.file === file);

  if (!bookEntry) return null;

  try {
    const response = await fetch(
      `${KNOWLEDGE_BASE_URL}books/${folderName}/${bookEntry.file}`,
    );
    if (!response.ok)
      throw new Error(
        `Failed to fetch book: ${KNOWLEDGE_BASE_URL}books/${folderName}/${bookEntry.file}`,
      );
    const text = await response.text();

    let content = file.endsWith(".html") ? parseHtmlBookContent(text) : text;
    const cleanedContent = content.trim();
    const fullContent = `[مقتبس من كتاب: ${bookEntry.title}]\n${cleanedContent}`;

    bookCache.set(cacheKey, fullContent);
    return fullContent;
  } catch (error) {
    console.error(`Error loading book content for ${topic} - ${file}:`, error);
    return null;
  }
};

/**
 * Fetches the book entries for a given topic and era from the manifest.
 * @param topic The topic to get book entries for.
 * @param era The scholar era.
 * @returns A promise that resolves to an array of BookEntry objects.
 */
export const getBookEntriesForTopic = async (
  topic: Topic,
  era: ScholarEra,
): Promise<BookEntry[]> => {
  const folderName = TopicFolderMap[topic];
  if (!folderName) return [];

  const manifest = await getManifest();
  const topicData = manifest[folderName];

  if (topicData && !Array.isArray(topicData) && topicData[era]) {
    return topicData[era];
  }
  // Fallback for old manifest structure
  if (Array.isArray(topicData) && era === "motaqdmeen") {
    return topicData;
  }

  return [];
};

/**
 * Fetches the titles of all books for a given topic and era from the manifest.
 * @param topic The topic to get book titles for.
 * @param era The scholar era.
 * @returns A promise that resolves to an array of book titles.
 */
export const getBookTitlesForTopic = async (
  topic: Topic,
  era: ScholarEra,
): Promise<string[]> => {
  try {
    const folderName = TopicFolderMap[topic];
    const response = await fetch(
      "https://api.github.com/repos/atharchat/salafi-library/git/trees/main?recursive=1",
    );
    if (!response.ok) return [];
    const data = await response.json();
    const tree = data.tree || [];

    const books = new Set<string>();
    tree.forEach((item: any) => {
      if (
        item.path.startsWith(`books/${folderName}/`) &&
        item.type === "blob"
      ) {
        const fileName = item.path.split("/").pop() || "";
        if (
          fileName.endsWith(".txt") ||
          fileName.endsWith(".htm") ||
          fileName.endsWith(".html")
        ) {
          const title = fileName.replace(/\.[^/.]+$/, "");
          books.add(title);
        }
      }
    });
    return Array.from(books);
  } catch (error) {
    console.error("Failed to fetch book titles from GitHub:", error);
    return [];
  }
};

/**
 * Gets the available scholar eras for a given topic from the manifest.
 * @param topic The topic to check.
 * @returns A promise resolving to an array of available ScholarEra strings.
 */
export const getAvailableErasForTopic = async (
  topic: Topic,
): Promise<ScholarEra[]> => {
  const folderName = TopicFolderMap[topic];
  if (!folderName) return [];

  const manifest = await getManifest();
  const topicData = manifest[folderName];
  if (topicData && typeof topicData === "object" && !Array.isArray(topicData)) {
    const eras = Object.keys(topicData).filter(
      (k) => k === "motaqdmeen" || k === "motakhreen",
    ) as ScholarEra[];
    return eras;
  }
  // If it's the old array format, assume it's 'motaqdmeen'
  if (Array.isArray(topicData) && topicData.length > 0) {
    return ["motaqdmeen"];
  }
  return [];
};
