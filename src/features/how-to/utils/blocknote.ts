export type TocHeading = {
  id: string;
  text: string;
  level: number;
};

/**
 * Extracts all text content from a BlockNote block recursively
 */
function extractTextFromContent(content: any): string {
  if (!content) return "";

  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content.map(extractTextFromContent).join("");
  }

  if (content.text) return content.text;

  if (content.content) {
    return extractTextFromContent(content.content);
  }

  return "";
}

/**
 * Extracts all text from BlockNote content for word counting
 */
export function extractAllText(blocks: any[] | undefined): string {
  if (!blocks || !Array.isArray(blocks)) return "";

  return blocks
    .map((block) => {
      let text = extractTextFromContent(block.content);

      // Recursively get text from children blocks
      if (block.children && Array.isArray(block.children)) {
        text += " " + extractAllText(block.children);
      }

      return text;
    })
    .join(" ")
    .trim();
}

/**
 * Calculates estimated reading time based on word count
 * Assumes average reading speed of 200 words per minute
 */
export function calculateReadingTime(blocks: any[] | undefined): number {
  const text = extractAllText(blocks);
  const wordCount = text.split(/\s+/).filter((word: string) => word.length > 0).length;
  const minutes = Math.ceil(wordCount / 200);
  return Math.max(1, minutes); // Minimum 1 minute
}

/**
 * Generates a URL-friendly slug from text
 */
function generateSlug(text: string, index: number): string {
  const baseSlug = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  return baseSlug || `heading-${index}`;
}

/**
 * Extracts headings from BlockNote content for table of contents
 */
export function extractHeadings(blocks: any[] | undefined): TocHeading[] {
  if (!blocks || !Array.isArray(blocks)) return [];

  const headings: TocHeading[] = [];
  let headingIndex = 0;

  function processBlocks(blockArray: any[]) {
    for (const block of blockArray) {
      if (block.type === "heading") {
        const level = block.props?.level || 1;
        const text = extractTextFromContent(block.content);

        if (text.trim()) {
          headings.push({
            id: generateSlug(text, headingIndex),
            text: text.trim(),
            level,
          });
          headingIndex++;
        }
      }

      // Process children blocks recursively
      if (block.children && Array.isArray(block.children)) {
        processBlocks(block.children);
      }
    }
  }

  processBlocks(blocks);
  return headings;
}
