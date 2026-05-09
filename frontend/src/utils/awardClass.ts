export function awardClass(award: string): string {
  const a = (award || "").toLowerCase();
  if (a.includes("gold")) return "award-gold-medal";
  if (a.includes("silver")) return "award-silver-medal";
  if (a.includes("bronze")) return "award-bronze-medal";
  if (a.includes("honourable") || a.includes("hm"))
    return "award-honourable-mention";
  return "";
}
