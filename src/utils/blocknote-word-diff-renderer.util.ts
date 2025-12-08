import { PartialBlock } from "@blocknote/core";
import { DiffBlock, WordDiff } from "./blocknote-diff.util";

export class BlockNoteWordDiffRendererUtil {
  static renderWordDiffs(
    diffBlocks: DiffBlock[],
    onAcceptChange?: (diffId: string) => void,
    onRejectChange?: (diffId: string) => void,
    acceptedChanges?: Set<string>,
    rejectedChanges?: Set<string>,
  ): PartialBlock[] {
    if (acceptedChanges || rejectedChanges) {
      diffBlocks = this.updateWordDiffStates(diffBlocks, acceptedChanges, rejectedChanges);
    }
    return diffBlocks.map((block) => this.renderDiffBlock(block, onAcceptChange, onRejectChange));
  }

  private static updateWordDiffStates(
    diffBlocks: DiffBlock[],
    acceptedChanges?: Set<string>,
    rejectedChanges?: Set<string>,
  ): DiffBlock[] {
    return diffBlocks.map((block) => {
      const updatedBlock = { ...block };

      if (updatedBlock.diffId) {
        updatedBlock.accepted = acceptedChanges?.has(updatedBlock.diffId) || false;
        updatedBlock.rejected = rejectedChanges?.has(updatedBlock.diffId) || false;
      }

      if (updatedBlock.wordDiffs) {
        updatedBlock.wordDiffs = updatedBlock.wordDiffs.map((wordDiff) => ({
          ...wordDiff,
          accepted: acceptedChanges?.has(wordDiff.diffId) || false,
          rejected: rejectedChanges?.has(wordDiff.diffId) || false,
        }));
      }

      if (updatedBlock.children) {
        updatedBlock.children = this.updateWordDiffStates(
          updatedBlock.children as DiffBlock[],
          acceptedChanges,
          rejectedChanges,
        );
      }

      return updatedBlock;
    });
  }

  private static renderDiffBlock(
    block: DiffBlock,
    onAcceptChange?: (diffId: string) => void,
    onRejectChange?: (diffId: string) => void,
  ): PartialBlock {
    if (block.diffType === "modified" && block.wordDiffs) {
      return this.renderWordLevelDiff(block, onAcceptChange, onRejectChange);
    }

    if (block.diffType === "added" || block.diffType === "removed") {
      return this.renderBlockLevelDiff(block, onAcceptChange, onRejectChange);
    }

    const baseBlock: PartialBlock = {
      id: block.id || crypto.randomUUID(),
      type: (block.type as any) || "paragraph",
      props: this.getBlockProps(block),
      content: Array.isArray(block.content) ? block.content : [],
      children: block.children?.map((child) =>
        this.renderDiffBlock(child as DiffBlock, onAcceptChange, onRejectChange),
      ),
    };

    return baseBlock;
  }

  private static renderBlockLevelDiff(
    block: DiffBlock,
    onAcceptChange?: (diffId: string) => void,
    onRejectChange?: (diffId: string) => void,
  ): PartialBlock {
    if (!block.diffId) {
      return {
        id: block.id || crypto.randomUUID(),
        type: (block.type as any) || "paragraph",
        props: block.props || {},
        content: Array.isArray(block.content) ? block.content : [],
        children: block.children?.map((child) =>
          this.renderDiffBlock(child as DiffBlock, onAcceptChange, onRejectChange),
        ),
      };
    }

    const blockAccepted = block.accepted || false;
    const blockRejected = block.rejected || false;

    let content = Array.isArray(block.content) ? [...block.content] : [];

    if (block.diffType === "added") {
      if (blockRejected) {
        return {
          id: block.id || crypto.randomUUID(),
          type: "paragraph",
          props: {},
          content: [],
          children: [],
        };
      } else if (!blockAccepted) {
        content = content.map((item: any) => ({
          ...item,
          styles: { ...item.styles, bold: true },
        }));

        content.push({
          type: "diffActions",
          props: { diffIds: block.diffId },
        });
      }
    } else if (block.diffType === "removed") {
      if (blockAccepted) {
        return {
          id: block.id || crypto.randomUUID(),
          type: "paragraph",
          props: {},
          content: [],
          children: [],
        };
      } else if (!blockRejected) {
        content = content.map((item: any) => ({
          ...item,
          styles: { ...item.styles, strike: true },
        }));

        content.push({
          type: "diffActions",
          props: { diffIds: block.diffId },
        });
      }
    }

    const baseBlock: PartialBlock = {
      id: block.id || crypto.randomUUID(),
      type: (block.type as any) || "paragraph",
      props: this.getBlockProps(block),
      content: content,
      children: block.children?.map((child) =>
        this.renderDiffBlock(child as DiffBlock, onAcceptChange, onRejectChange),
      ),
    };

    return baseBlock;
  }

  private static renderWordLevelDiff(
    block: DiffBlock,
    onAcceptChange?: (diffId: string) => void,
    onRejectChange?: (diffId: string) => void,
  ): PartialBlock {
    if (!block.wordDiffs) {
      return {
        id: block.id || crypto.randomUUID(),
        type: (block.type as any) || "paragraph",
        props: block.props || {},
        content: Array.isArray(block.content) ? block.content : [],
        children: [],
      };
    }

    const content = this.groupAndRenderWordDiffs(block.wordDiffs);

    return {
      id: block.id || crypto.randomUUID(),
      type: (block.type as any) || "paragraph",
      props: block.props || {},
      content: Array.isArray(content) ? content : [],
      children:
        block.children?.map((child) => this.renderDiffBlock(child as DiffBlock, onAcceptChange, onRejectChange)) || [],
    };
  }

  private static groupAndRenderWordDiffs(wordDiffs: WordDiff[]): any[] {
    const content: any[] = [];

    for (let i = 0; i < wordDiffs.length; i++) {
      const wordDiff = wordDiffs[i];

      const isLastOfGroup = this.isLastDiffInGroup(wordDiffs, i);

      const textContent = this.createTextContent(wordDiff, isLastOfGroup);
      if (textContent) {
        if (Array.isArray(textContent)) {
          content.push(...textContent);
        } else {
          content.push(textContent);
        }
      }
    }

    const cleanedContent = this.cleanupSpaces(content);

    return cleanedContent;
  }

  private static cleanupSpaces(content: any[]): any[] {
    const filtered = content.filter((item) => item !== null && item !== undefined);

    const cleaned: any[] = [];

    for (let i = 0; i < filtered.length; i++) {
      const current = filtered[i];

      if (current.type === "text" && current.text === " ") {
        const lastItem = cleaned[cleaned.length - 1];

        if (
          i === 0 ||
          i === filtered.length - 1 ||
          (lastItem && lastItem.type === "text" && lastItem.text === " ") ||
          (lastItem && lastItem.type === "diffActions")
        ) {
          continue;
        }
      }

      if (current.type === "diffActions") {
        const nextItem = i + 1 < filtered.length ? filtered[i + 1] : null;

        cleaned.push(current);

        if (nextItem && nextItem.type === "text" && nextItem.text !== " " && nextItem.type !== "diffActions") {
          cleaned.push({
            type: "text",
            text: " ",
            styles: {},
          });
        }

        continue;
      }

      cleaned.push(current);
    }

    return cleaned;
  }

  private static isLastDiffInGroup(wordDiffs: WordDiff[], currentIndex: number): boolean {
    const currentDiff = wordDiffs[currentIndex];

    if (currentDiff.type === "unchanged") {
      return false;
    }

    for (let i = currentIndex + 1; i < wordDiffs.length; i++) {
      const nextDiff = wordDiffs[i];

      if (nextDiff.diffId === currentDiff.diffId && (nextDiff.type === "added" || nextDiff.type === "removed")) {
        return false;
      }

      if (nextDiff.type !== "unchanged" && nextDiff.diffId !== currentDiff.diffId) {
        break;
      }
    }

    return true;
  }

  private static createTextContent(wordDiff: WordDiff, isLastOfGroup?: boolean): any[] | any {
    switch (wordDiff.type) {
      case "added":
        if (wordDiff.accepted) {
          return {
            type: "text",
            text: wordDiff.text,
            styles: {},
          };
        } else if (wordDiff.rejected) {
          return null;
        } else {
          if (wordDiff.text.trim() === "") {
            return {
              type: "text",
              text: wordDiff.text,
              styles: { backgroundColor: "#dcfce7" },
            };
          } else {
            const baseContent = {
              type: "text",
              text: wordDiff.text,
              styles: { bold: true },
            };

            if (isLastOfGroup) {
              return [
                baseContent,
                {
                  type: "diffActions",
                  props: { diffIds: wordDiff.diffId },
                },
              ];
            } else {
              return baseContent;
            }
          }
        }

      case "removed":
        if (wordDiff.accepted) {
          return null;
        } else if (wordDiff.rejected) {
          return {
            type: "text",
            text: wordDiff.text,
            styles: {},
          };
        } else {
          if (wordDiff.text.trim() === "") {
            return {
              type: "text",
              text: wordDiff.text,
              styles: { strike: true },
            };
          } else {
            const baseContent = {
              type: "text",
              text: wordDiff.text,
              styles: { strike: true },
            };

            if (isLastOfGroup) {
              return [
                baseContent,
                {
                  type: "diffActions",
                  props: { diffIds: wordDiff.diffId },
                },
              ];
            } else {
              return baseContent;
            }
          }
        }

      case "unchanged":
      default:
        return {
          type: "text",
          text: wordDiff.text,
          styles: {},
        };
    }
  }

  private static getBlockProps(block: DiffBlock): any {
    const baseProps = block.props || {};

    return baseProps;
  }

  static generateChangeSummary(diffBlocks: DiffBlock[]): {
    totalWords: number;
    addedWords: number;
    removedWords: number;
    acceptedChanges: number;
    rejectedChanges: number;
    pendingChanges: number;
  } {
    let totalWords = 0;
    let addedWords = 0;
    let removedWords = 0;
    let acceptedChanges = 0;
    let rejectedChanges = 0;
    let pendingChanges = 0;

    const processBlock = (block: DiffBlock) => {
      if (block.wordDiffs) {
        block.wordDiffs.forEach((wordDiff) => {
          totalWords++;

          if (wordDiff.type === "added") {
            addedWords++;
          } else if (wordDiff.type === "removed") {
            removedWords++;
          }

          if (wordDiff.accepted) {
            acceptedChanges++;
          } else if (wordDiff.rejected) {
            rejectedChanges++;
          } else if (wordDiff.type !== "unchanged") {
            pendingChanges++;
          }
        });
      }

      if (block.children) {
        block.children.forEach((child) => processBlock(child as DiffBlock));
      }
    };

    diffBlocks.forEach(processBlock);

    return {
      totalWords,
      addedWords,
      removedWords,
      acceptedChanges,
      rejectedChanges,
      pendingChanges,
    };
  }
}
