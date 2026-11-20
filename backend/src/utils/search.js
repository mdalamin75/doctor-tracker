/**
 * Index-friendly search.
 *
 * Every searchable document stores a `keywords` array of lowercase tokens
 * (words of the name, hospital, email parts, phone digits...). A query is split
 * into tokens and each token must prefix-match one keyword:
 *
 *   { keywords: { $all: [/^ayes/, /^card/] } }
 *
 * Anchored, case-sensitive regexes on a multikey index are turned into tight
 * index range scans by MongoDB, unlike `/term/i`, which forces a full scan.
 */
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function tokenize(...values) {
  const tokens = new Set();
  for (const value of values) {
    if (value == null) continue;
    const text = String(value).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");
    for (const t of text.split(/[^a-z0-9]+/)) if (t) tokens.add(t);
  }
  return [...tokens];
}

/**
 * Phone numbers are matched on digits. We store the full number plus its
 * last 10/11 digits so "01711…" finds "+8801711…".
 */
export function phoneTokens(phone) {
  const digits = phone ? String(phone).replace(/\D/g, "") : "";
  if (!digits) return [];
  return [...new Set([digits, digits.slice(-11), digits.slice(-10)])];
}

export function buildKeywords({ text = [], emails = [], phones = [] }) {
  return [
    ...new Set([
      ...tokenize(...text, ...emails),
      ...emails.filter(Boolean).map((e) => String(e).toLowerCase()),
      ...phones.flatMap(phoneTokens),
    ]),
  ];
}

export function keywordFilter(q) {
  const tokens = tokenize(q).slice(0, 6);
  if (!tokens.length) return {};
  return { keywords: { $all: tokens.map((t) => new RegExp(`^${escapeRegex(t)}`)) } };
}
