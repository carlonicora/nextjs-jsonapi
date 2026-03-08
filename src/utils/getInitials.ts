export function getInitials(name: string): string;
export function getInitials(firstName: string, lastName: string): string;
export function getInitials(firstOrName: string, lastName?: string): string {
  if (lastName !== undefined) {
    const first = firstOrName?.trim()?.[0] ?? "";
    const last = lastName?.trim()?.[0] ?? "";
    if (first && last) return (first + last).toUpperCase();
    return (firstOrName || lastName || "").slice(0, 2).toUpperCase();
  }

  const words = firstOrName.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return firstOrName.slice(0, 2).toUpperCase();
}
