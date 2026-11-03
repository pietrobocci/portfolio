// What the widget says under an answer when tools ran.
//
// The badge is a claim about where a fact came from, so it has to track the
// tools exactly: saying "checked live on Sepolia" under an answer that only
// read GitHub would be a small lie in the one place this bot is supposed to
// be trustworthy.

/** Which live source each tool reads. */
const SOURCE_BY_TOOL: Record<string, string> = {
  get_contract_status: "Sepolia",
  list_certificates: "Sepolia",
  verify_document: "Sepolia",
  get_github_activity: "GitHub",
};

/**
 * "Checked live on Sepolia and GitHub (list_certificates, …)", or null when
 * nothing recognisable ran — an unknown name means this table is out of date,
 * and in that case the badge stays silent rather than guessing.
 */
export function sourceLabel(toolsUsed: readonly string[]): string | null {
  const known = toolsUsed.filter((name) => name in SOURCE_BY_TOOL);
  if (known.length === 0) return null;

  const sources = [...new Set(known.map((name) => SOURCE_BY_TOOL[name]))];
  const names = [...new Set(known)];

  return `Checked live on ${joinWithAnd(sources)} (${names.join(", ")})`;
}

function joinWithAnd(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
