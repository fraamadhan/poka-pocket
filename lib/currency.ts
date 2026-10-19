/**
 * Robust currency parser supporting Indonesian format (Rp 50.000)
 * as well as standard decimal formats (50000.50, 50,000).
 */
export function parseCurrencyInput(input: string | number | null | undefined): number {
  if (input === null || input === undefined) return NaN;
  if (typeof input === "number") return input;

  let str = input.trim();
  if (str === "") return NaN;

  // Remove currency prefixes/suffixes like "Rp", "rp", spaces
  str = str.replace(/^[rR][pP]\.?\s*/, "").trim();

  const dotCount = (str.match(/\./g) || []).length;
  const commaCount = (str.match(/,/g) || []).length;

  if (dotCount > 1 || (dotCount === 1 && commaCount === 1 && str.indexOf(".") < str.indexOf(","))) {
    // Indonesian thousand separator: e.g. "1.000.000" or "1.500.000,50"
    str = str.replace(/\./g, "").replace(",", ".");
  } else if (commaCount > 1 || (commaCount === 1 && dotCount === 1 && str.indexOf(",") < str.indexOf("."))) {
    // Standard US thousand separator: e.g. "1,000,000" or "1,500,000.50"
    str = str.replace(/,/g, "");
  } else if (dotCount === 1 && commaCount === 0) {
    // Single dot: e.g. "50.000" (50k) vs "50.5" (decimal)
    // If dot is followed by exactly 3 digits at the end, it's almost certainly thousand separator in Rupiah
    if (/\.\d{3}$/.test(str)) {
      str = str.replace(".", "");
    }
  } else if (commaCount === 1 && dotCount === 0) {
    // Single comma: e.g. "50,000" (50k) vs "50,5" (decimal)
    if (/,\d{3}$/.test(str)) {
      str = str.replace(",", "");
    } else {
      str = str.replace(",", ".");
    }
  }

  const result = parseFloat(str);
  return result;
}
