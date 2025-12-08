import { PartialBlock } from "@blocknote/core";

export interface WordDiff {
  type: "added" | "removed" | "unchanged";
  text: string;
  diffId: string;
  accepted?: boolean;
  rejected?: boolean;
}

export interface DiffBlock {
  id?: string;
  type?: string;
  props?: any;
  content?: any;
  children?: DiffBlock[];
  diffType?: "added" | "removed" | "modified" | "unchanged";
  originalContent?: any;
  diffId?: string;
  wordDiffs?: WordDiff[];
  accepted?: boolean;
  rejected?: boolean;
}

export interface DiffResult {
  blocks: DiffBlock[];
  hasChanges: boolean;
}

export interface BlockDiffOptions {
  ignoreIds?: boolean;
  compareContent?: boolean;
  similarityThreshold?: number;
}

/**
 * BlockNote Diff Utility
 * Implements a sophisticated diff algorithm for BlockNote document structures
 */
export class BlockNoteDiffUtil {
  private static readonly DEFAULT_OPTIONS: BlockDiffOptions = {
    ignoreIds: false,
    compareContent: true,
    similarityThreshold: 0.8,
  };

  /**
   * Compare two BlockNote documents and return diff result
   */
  static diff(
    originalBlocks: PartialBlock[] = [],
    newBlocks: PartialBlock[] = [],
    options: BlockDiffOptions = {},
  ): DiffResult {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    // Create a map for efficient lookups
    const originalMap = new Map<string, PartialBlock>();
    const newMap = new Map<string, PartialBlock>();

    // Build maps based on block IDs
    originalBlocks.forEach((block) => {
      if (block.id) {
        originalMap.set(block.id, block);
      }
    });

    newBlocks.forEach((block) => {
      if (block.id) {
        newMap.set(block.id, block);
      }
    });

    const diffBlocks: DiffBlock[] = [];
    const processedNewIds = new Set<string>();

    // Process original blocks to find removed and modified blocks
    for (const originalBlock of originalBlocks) {
      const blockId = originalBlock.id;

      // Generate ID if missing
      const processId = blockId || crypto.randomUUID();
      const newBlock = blockId ? newMap.get(blockId) : null;

      if (!newBlock) {
        // Block was removed
        const removedBlock: DiffBlock = {
          ...originalBlock,
          id: processId,
          diffType: "removed",
          diffId: `removed-${processId}`,
        };
        diffBlocks.push(removedBlock);
      } else {
        // Block exists in both, check for modifications
        if (blockId) {
          processedNewIds.add(blockId);
        }

        if (this.areBlocksEqual(originalBlock, newBlock, opts)) {
          // Block is unchanged
          const unchangedBlock: DiffBlock = {
            ...newBlock,
            diffType: "unchanged",
          };
          diffBlocks.push(unchangedBlock);
        } else {
          // Block was modified - perform word-level diff
          const wordDiffs = this.generateWordDiffs(originalBlock.content, newBlock.content, processId);
          const modifiedBlock: DiffBlock = {
            ...newBlock,
            diffType: "modified",
            originalContent: originalBlock.content as any,
            diffId: `modified-${processId}`,
            wordDiffs: wordDiffs,
          };
          diffBlocks.push(modifiedBlock);
        }
      }
    }

    // Process new blocks to find added blocks
    for (const newBlock of newBlocks) {
      const blockId = newBlock.id;

      // Skip if block was already processed (has ID and was found in original)
      if (blockId && processedNewIds.has(blockId)) continue;

      // This is a new block (either no ID or ID not found in original)
      const generatedId = blockId || crypto.randomUUID();
      const addedBlock: DiffBlock = {
        ...newBlock,
        id: generatedId,
        diffType: "added",
        diffId: `added-${generatedId}`,
      };
      diffBlocks.push(addedBlock);
    }

    // Sort blocks to maintain original order as much as possible
    const sortedDiffBlocks = this.sortDiffBlocks(diffBlocks, originalBlocks, newBlocks);

    return {
      blocks: sortedDiffBlocks,
      hasChanges: sortedDiffBlocks.some((block) => block.diffType !== "unchanged"),
    };
  }

  /**
   * Compare two blocks for equality
   */
  private static areBlocksEqual(block1: PartialBlock, block2: PartialBlock, options: BlockDiffOptions): boolean {
    // Compare block type
    if (block1.type !== block2.type) {
      return false;
    }

    // Compare props (excluding diffType specific props)
    if (!this.deepEqual(block1.props, block2.props)) {
      return false;
    }

    // Compare content if enabled
    if (options.compareContent) {
      if (!this.deepEqual(block1.content, block2.content)) {
        return false;
      }
    }

    // Compare children recursively
    const children1 = block1.children || [];
    const children2 = block2.children || [];

    if (children1.length !== children2.length) {
      return false;
    }

    for (let i = 0; i < children1.length; i++) {
      if (!this.areBlocksEqual(children1[i], children2[i], options)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Deep equality comparison for objects
   */
  private static deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;

    if (obj1 == null || obj2 == null) return obj1 === obj2;

    if (typeof obj1 !== typeof obj2) return false;

    if (typeof obj1 !== "object") return obj1 === obj2;

    if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

    if (Array.isArray(obj1)) {
      if (obj1.length !== obj2.length) return false;
      for (let i = 0; i < obj1.length; i++) {
        if (!this.deepEqual(obj1[i], obj2[i])) return false;
      }
      return true;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!this.deepEqual(obj1[key], obj2[key])) return false;
    }

    return true;
  }

  /**
   * Sort diff blocks to maintain logical order
   */
  private static sortDiffBlocks(
    diffBlocks: DiffBlock[],
    originalBlocks: PartialBlock[],
    newBlocks: PartialBlock[],
  ): DiffBlock[] {
    // Create position maps
    const originalPositions = new Map<string, number>();
    const newPositions = new Map<string, number>();

    originalBlocks.forEach((block, index) => {
      if (block.id) {
        originalPositions.set(block.id, index);
      }
    });

    newBlocks.forEach((block, index) => {
      if (block.id) {
        newPositions.set(block.id, index);
      }
    });

    return diffBlocks.sort((a, b) => {
      const aId = a.id;
      const bId = b.id;

      if (!aId || !bId) return 0;

      // Prioritize by new positions, fallback to original positions
      const aPos = newPositions.get(aId) ?? originalPositions.get(aId) ?? Infinity;
      const bPos = newPositions.get(bId) ?? originalPositions.get(bId) ?? Infinity;

      return aPos - bPos;
    });
  }

  /**
   * Calculate similarity between two text contents
   */
  private static calculateSimilarity(content1: any[], content2: any[]): number {
    if (!content1 || !content2) return 0;

    const text1 = this.extractTextFromContent(content1);
    const text2 = this.extractTextFromContent(content2);

    if (text1 === text2) return 1;
    if (!text1 || !text2) return 0;

    // Simple Levenshtein distance-based similarity
    const maxLength = Math.max(text1.length, text2.length);
    const distance = this.levenshteinDistance(text1, text2);

    return 1 - distance / maxLength;
  }

  /**
   * Extract plain text from BlockNote content array
   */
  private static extractTextFromContent(content: any[]): string {
    if (!Array.isArray(content)) return "";

    return content
      .map((item) => {
        if (item.type === "text") {
          return item.text || "";
        }
        return "";
      })
      .join("");
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + substitutionCost, // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Generate word-level diffs between two content arrays
   */
  static generateWordDiffs(originalContent: any, newContent: any, blockId: string): WordDiff[] {
    const originalText = this.extractTextFromContent(originalContent || []);
    const newText = this.extractTextFromContent(newContent || []);

    if (!originalText && !newText) return [];
    if (!originalText) {
      return newText
        .split(/\s+/)
        .filter((word) => word.trim())
        .map((word, index) => ({
          type: "added" as const,
          text: word,
          diffId: `${blockId}-add-${index}`,
          accepted: false,
          rejected: false,
        }));
    }
    if (!newText) {
      return originalText
        .split(/\s+/)
        .filter((word) => word.trim())
        .map((word, index) => ({
          type: "removed" as const,
          text: word,
          diffId: `${blockId}-remove-${index}`,
          accepted: false,
          rejected: false,
        }));
    }

    return this.diffWords(originalText, newText, blockId);
  }

  /**
   * Perform word-level diff using word-only approach (no space tokenization)
   */
  private static diffWords(text1: string, text2: string, blockId: string): WordDiff[] {
    const words1 = text1.split(/\s+/).filter((word) => word.length > 0);
    const words2 = text2.split(/\s+/).filter((word) => word.length > 0);

    const diffs = this.myersDiff(words1, words2);

    // Consolidate adjacent changes to reduce fragmentation
    const consolidatedDiffs = this.consolidateAdjacentChanges(diffs);

    const result: WordDiff[] = [];
    let diffIndex = 0;

    for (let i = 0; i < consolidatedDiffs.length; i++) {
      const diff = consolidatedDiffs[i];
      const isLastDiff = i === consolidatedDiffs.length - 1;

      switch (diff.type) {
        case "equal":
          result.push({
            type: "unchanged",
            text: diff.value,
            diffId: `${blockId}-unchanged-${diffIndex++}`,
            accepted: true,
            rejected: false,
          });

          // Add space after word if not the last diff
          if (!isLastDiff) {
            result.push({
              type: "unchanged",
              text: " ",
              diffId: `${blockId}-space-${diffIndex++}`,
              accepted: true,
              rejected: false,
            });
          }
          break;

        case "delete":
          // Check if this is a consolidated change or regular change
          if ((diff as any).consolidated) {
            // This is a consolidated deletion - check if next is consolidated insertion
            const nextDiff = i + 1 < consolidatedDiffs.length ? consolidatedDiffs[i + 1] : null;
            const isConsolidatedReplacement = nextDiff && nextDiff.type === "insert" && (nextDiff as any).consolidated;

            if (isConsolidatedReplacement) {
              // Use single shared diff ID for the entire consolidated change
              const replacementId = `${blockId}-replace-${diffIndex++}`;

              // Add the removed text
              result.push({
                type: "removed",
                text: diff.value,
                diffId: replacementId,
                accepted: false,
                rejected: false,
              });

              // Add the new text with same diff ID
              result.push({
                type: "added",
                text: nextDiff.value,
                diffId: replacementId,
                accepted: false,
                rejected: false,
              });

              // Skip the next insert since we handled it
              i++;

              // Add space after replacement if not the last
              if (i < consolidatedDiffs.length - 1) {
                result.push({
                  type: "unchanged",
                  text: " ",
                  diffId: `${blockId}-space-${diffIndex++}`,
                  accepted: true,
                  rejected: false,
                });
              }
            } else {
              // Consolidated deletion without replacement
              result.push({
                type: "removed",
                text: diff.value,
                diffId: `${blockId}-remove-${diffIndex++}`,
                accepted: false,
                rejected: false,
              });

              // Add space after deletion if not the last
              if (!isLastDiff) {
                result.push({
                  type: "unchanged",
                  text: " ",
                  diffId: `${blockId}-space-${diffIndex++}`,
                  accepted: true,
                  rejected: false,
                });
              }
            }
          } else {
            // Regular single-word processing
            const nextDiff = i + 1 < consolidatedDiffs.length ? consolidatedDiffs[i + 1] : null;
            const isReplacement =
              nextDiff && nextDiff.type === "insert" && this.areWordsSimilar(diff.value, nextDiff.value);

            if (isReplacement) {
              // Use single shared diff ID for both operations
              const replacementId = `${blockId}-replace-${diffIndex++}`;

              // Add the removed word
              result.push({
                type: "removed",
                text: diff.value,
                diffId: replacementId,
                accepted: false,
                rejected: false,
              });

              // Add the new word with same diff ID (no space between them)
              result.push({
                type: "added",
                text: nextDiff.value,
                diffId: replacementId,
                accepted: false,
                rejected: false,
              });

              // Skip the next insert since we handled it
              i++;

              // Add space after replacement if not the last
              if (i < consolidatedDiffs.length - 1) {
                result.push({
                  type: "unchanged",
                  text: " ",
                  diffId: `${blockId}-space-${diffIndex++}`,
                  accepted: true,
                  rejected: false,
                });
              }
            } else {
              // Regular deletion
              result.push({
                type: "removed",
                text: diff.value,
                diffId: `${blockId}-remove-${diffIndex++}`,
                accepted: false,
                rejected: false,
              });

              // Add space after deletion if not the last
              if (!isLastDiff) {
                result.push({
                  type: "unchanged",
                  text: " ",
                  diffId: `${blockId}-space-${diffIndex++}`,
                  accepted: true,
                  rejected: false,
                });
              }
            }
          }
          break;

        case "insert":
          // Only handle if not already processed as part of replacement or consolidation
          if ((diff as any).consolidated) {
            // This should have been handled in the delete case above
            const prevDiff = i > 0 ? consolidatedDiffs[i - 1] : null;
            const wasProcessedAsConsolidatedReplacement =
              prevDiff && prevDiff.type === "delete" && (prevDiff as any).consolidated;

            if (!wasProcessedAsConsolidatedReplacement) {
              // Standalone consolidated insertion
              result.push({
                type: "added",
                text: diff.value,
                diffId: `${blockId}-add-${diffIndex++}`,
                accepted: false,
                rejected: false,
              });

              // Add space after insertion if not the last
              if (!isLastDiff) {
                result.push({
                  type: "unchanged",
                  text: " ",
                  diffId: `${blockId}-space-${diffIndex++}`,
                  accepted: true,
                  rejected: false,
                });
              }
            }
          } else {
            // Regular single-word processing
            const prevDiff = i > 0 ? consolidatedDiffs[i - 1] : null;
            const wasProcessedAsReplacement =
              prevDiff && prevDiff.type === "delete" && this.areWordsSimilar(prevDiff.value, diff.value);

            if (!wasProcessedAsReplacement) {
              result.push({
                type: "added",
                text: diff.value,
                diffId: `${blockId}-add-${diffIndex++}`,
                accepted: false,
                rejected: false,
              });

              // Add space after insertion if not the last
              if (!isLastDiff) {
                result.push({
                  type: "unchanged",
                  text: " ",
                  diffId: `${blockId}-space-${diffIndex++}`,
                  accepted: true,
                  rejected: false,
                });
              }
            }
          }
          break;
      }
    }

    return result;
  } /**
   * Improved diff algorithm that better handles word insertions
   * Uses a combination of LCS and heuristics to minimize false changes
   */
  private static myersDiff(a: string[], b: string[]): Array<{ type: "equal" | "delete" | "insert"; value: string }> {
    if (a.length === 0) {
      return b.map((value) => ({ type: "insert" as const, value }));
    }
    if (b.length === 0) {
      return a.map((value) => ({ type: "delete" as const, value }));
    }

    // Use dynamic programming for optimal diff
    const dp = this.computeEditScript(a, b);
    return this.reconstructDiff(a, b, dp);
  }

  /**
   * Compute edit script using dynamic programming
   */
  private static computeEditScript(a: string[], b: string[]): number[][] {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    // Initialize base cases
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    // Fill the DP table
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1]; // No operation needed
        } else {
          dp[i][j] =
            1 +
            Math.min(
              dp[i - 1][j], // Delete from a
              dp[i][j - 1], // Insert into a
              dp[i - 1][j - 1], // Replace
            );
        }
      }
    }

    return dp;
  }

  /**
   * Reconstruct the actual diff from the DP table
   */
  private static reconstructDiff(
    a: string[],
    b: string[],
    dp: number[][],
  ): Array<{ type: "equal" | "delete" | "insert"; value: string; sharedDiffId?: boolean }> {
    const result: Array<{ type: "equal" | "delete" | "insert"; value: string; sharedDiffId?: boolean }> = [];
    let i = a.length;
    let j = b.length;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
        // Equal
        result.unshift({ type: "equal", value: a[i - 1] });
        i--;
        j--;
      } else {
        // Determine the best operation with preference for insert/delete over replace
        const deleteCost = i > 0 ? dp[i - 1][j] : Infinity;
        const insertCost = j > 0 ? dp[i][j - 1] : Infinity;
        const replaceCost = i > 0 && j > 0 ? dp[i - 1][j - 1] : Infinity;

        const minCost = Math.min(deleteCost, insertCost, replaceCost);

        // Prefer insertions and deletions over replacements when costs are equal
        if (minCost === insertCost && j > 0) {
          // Insert
          result.unshift({ type: "insert", value: b[j - 1] });
          j--;
        } else if (minCost === deleteCost && i > 0) {
          // Delete
          result.unshift({ type: "delete", value: a[i - 1] });
          i--;
        } else if (minCost === replaceCost && i > 0 && j > 0) {
          // Only use replace for similar words, otherwise prefer separate operations
          if (this.areWordsSimilar(a[i - 1], b[j - 1])) {
            // Similar words - treat as replacement with shared diffId
            result.unshift({ type: "insert", value: b[j - 1], sharedDiffId: true });
            result.unshift({ type: "delete", value: a[i - 1], sharedDiffId: true });
            i--;
            j--;
          } else {
            // Different words - prefer insert over delete when costs are equal
            result.unshift({ type: "insert", value: b[j - 1] });
            j--;
          }
        }
      }
    }

    return result;
  }

  /**
   * Consolidate adjacent changes to reduce fragmentation
   * e.g., if we have: delete "Key", insert "Key!", delete "Challenges"
   * We can consolidate this into: replace ["Key", "Challenges"] with ["Key!"]
   */
  private static consolidateAdjacentChanges(
    diffs: Array<{ type: "equal" | "delete" | "insert"; value: string }>,
  ): Array<{ type: "equal" | "delete" | "insert"; value: string; consolidated?: boolean }> {
    const result = [];
    let i = 0;

    while (i < diffs.length) {
      const current = diffs[i];

      if (current.type === "equal") {
        result.push(current);
        i++;
        continue;
      }

      // Look for patterns of adjacent changes that can be consolidated
      const changeSequence = [];
      let j = i;

      // Collect adjacent non-equal changes
      while (j < diffs.length && diffs[j].type !== "equal") {
        changeSequence.push(diffs[j]);
        j++;
      }

      if (changeSequence.length <= 1) {
        // Single change, no consolidation needed
        result.push(current);
        i++;
        continue;
      }

      // Check if we should consolidate this sequence
      const shouldConsolidate = this.shouldConsolidateChanges(
        changeSequence as Array<{ type: "delete" | "insert"; value: string }>,
      );

      if (shouldConsolidate) {
        // Create consolidated changes
        const deletedWords = changeSequence.filter((c) => c.type === "delete").map((c) => c.value);
        const insertedWords = changeSequence.filter((c) => c.type === "insert").map((c) => c.value);

        if (deletedWords.length > 0) {
          result.push({
            type: "delete" as const,
            value: deletedWords.join(" "),
            consolidated: true,
          });
        }

        if (insertedWords.length > 0) {
          result.push({
            type: "insert" as const,
            value: insertedWords.join(" "),
            consolidated: true,
          });
        }
      } else {
        // Don't consolidate, add individual changes
        changeSequence.forEach((change) => result.push(change));
      }

      i = j;
    }

    return result;
  }

  /**
   * Determine if a sequence of changes should be consolidated
   */
  private static shouldConsolidateChanges(changes: Array<{ type: "delete" | "insert"; value: string }>): boolean {
    // Consolidate if we have both deletions and insertions in the same sequence
    const hasDeletes = changes.some((c) => c.type === "delete");
    const hasInserts = changes.some((c) => c.type === "insert");

    // Only consolidate if we have both types of changes (replacements/modifications)
    // Pure additions or pure deletions are fine as separate changes
    return hasDeletes && hasInserts;
  }

  /**
   * Check if two words are similar enough to be considered a replacement
   */
  private static areWordsSimilar(word1: string, word2: string): boolean {
    // If words are exactly the same, they're similar
    if (word1 === word2) return true;

    // Consider words similar if they share more than 70% of their characters
    const maxLen = Math.max(word1.length, word2.length);
    const minLen = Math.min(word1.length, word2.length);

    // If one word is much longer than the other, they're not similar
    if (maxLen > minLen * 2) {
      return false;
    }

    // Special case: if one word is just the other plus punctuation, treat as separate changes
    // e.g., "Key" and "Key!" should not be considered similar for replacement
    const word1Clean = word1.replace(/[^\w]/g, "");
    const word2Clean = word2.replace(/[^\w]/g, "");

    if (word1Clean === word2Clean && word1 !== word2) {
      // One word is just the other with added punctuation - don't treat as replacement
      return false;
    }

    // Calculate character overlap using Levenshtein distance
    const distance = this.levenshteinDistance(word1, word2);
    const similarity = 1 - distance / maxLen;

    return similarity > 0.7; // Increased threshold to be more conservative
  }
}
