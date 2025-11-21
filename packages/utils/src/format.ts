import { format, isSameYear } from "date-fns";

type FormatAmountParams = {
  currency: string;
  amount: number;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

export function formatAmount({
  currency,
  amount,
  locale = "en-US",
  minimumFractionDigits,
  maximumFractionDigits,
}: FormatAmountParams) {
  if (!currency) {
    return;
  }

  return Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

export function formatDate(
  date: string,
  dateFormat?: string | null,
  checkYear = true,
) {
  if (checkYear && isSameYear(new Date(), new Date(date))) {
    return format(new Date(date), "MMM d");
  }

  return format(new Date(date), dateFormat ?? "P");
}

export function getInitials(value: string) {
  const formatted = value.toUpperCase().replace(/[\s.-]/g, "");

  if (formatted.split(" ").length > 1) {
    return `${formatted.charAt(0)}${formatted.charAt(1)}`;
  }

  if (value.length > 1) {
    return formatted.charAt(0) + formatted.charAt(1);
  }

  return formatted.charAt(0);
}

/**
 * Get the first alphabetic character from a string as an initial
 * @param name - The name to extract the initial from
 * @returns The first alphabetic character in uppercase, or "?" if none found
 */
export function getFirstInitial(name: string): string {
  const match = name.match(/[a-zA-Z]/);
  return match ? match[0].toUpperCase() : "?";
}

/**
 * Generate a consistent Tailwind color class based on an ID
 * @param id - The ID to generate a color from
 * @returns A Tailwind background color class
 */
export function getAvatarColorClass(id: string): string {
  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
  ];
  
  const colorIndex = id
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  
  return colors[colorIndex];
}
