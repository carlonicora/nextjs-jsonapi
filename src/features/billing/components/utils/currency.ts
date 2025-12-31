/**
 * Format currency amount from cents to localized currency string
 * @param amount - Amount in cents
 * @param currency - Currency code (e.g., "USD", "EUR", "GBP")
 * @returns Formatted currency string (e.g., "$9.99", "€9,99")
 */
export function formatCurrency(amount: number | undefined, currency: string): string {
  if (amount === undefined) return "$0.00";

  // Convert cents to dollars
  const dollars = amount / 100;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(dollars);
  } catch (error) {
    console.error("Error formatting currency:", error);
    // Fallback if currency code is invalid
    return `$${dollars.toFixed(2)}`;
  }
}
