export const exists = <T>(itemOrArray: T | T[] | null | undefined): boolean => {
  if (!itemOrArray) return false;
  if (Array.isArray(itemOrArray)) {
    return itemOrArray.length > 0;
  }
  return true;
};
