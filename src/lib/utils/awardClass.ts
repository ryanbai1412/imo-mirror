export type AwardType =
  | "gold"
  | "silver"
  | "bronze"
  | "hm"
  | "special"
  | "none";

export function awardType(award: AwardType[]): AwardType {
  return award.find((a) => a !== "special") ?? "none";
}

const CLASS_MAP: Record<AwardType, string> = {
  gold: "award-gold-medal",
  silver: "award-silver-medal",
  bronze: "award-bronze-medal",
  hm: "award-honourable-mention",
  special: "",
  none: "",
};

export function awardClass(award: AwardType[]): string {
  return CLASS_MAP[awardType(award)];
}
