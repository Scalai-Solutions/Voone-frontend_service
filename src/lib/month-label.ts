/**
 * The Spanish month name for a "YYYY-MM" key, capitalised ("Octubre"). Null when the key is not
 * a valid year-month, so the caller can leave the label out instead of showing a wrong month.
 */
export const monthNameEs = (monthKey: string): string | null => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey)) return null;

  const name = new Date(`${monthKey}-01T00:00:00.000Z`).toLocaleDateString("es-ES", {
    month: "long",
    timeZone: "UTC",
  });

  return name.charAt(0).toLocaleUpperCase("es-ES") + name.slice(1);
};

/**
 * The "YYYY-MM" calendar month of an instant in a time zone. The backend counts "this month" in
 * Europe/Madrid, so the heading over those figures must name the month in the same zone.
 */
export const monthKeyIn = (timeZone: string, at: Date = new Date()): string => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit" }).formatToParts(at);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;

  return `${year}-${month}`;
};
