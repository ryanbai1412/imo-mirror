export type AwardType =
  | "gold"
  | "silver"
  | "bronze"
  | "hm"
  | "none";

export function awardType(award: string): AwardType {
  const a = (award || "").toLowerCase();
  if (a.includes("gold")) return "gold";
  if (a.includes("silver")) return "silver";
  if (a.includes("bronze")) return "bronze";
  if (a.includes("honourable") || a.includes("hm"))
    return "hm";
  return "none";
}

const CLASS_MAP: Record<AwardType, string> = {
  gold: "award-gold-medal",
  silver: "award-silver-medal",
  bronze: "award-bronze-medal",
  hm: "award-honourable-mention",
  none: "",
};

export function awardClass(award: string): string {
  return CLASS_MAP[awardType(award)];
}
