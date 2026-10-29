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
