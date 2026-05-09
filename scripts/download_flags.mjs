#!/usr/bin/env node
/**
 * Copy SVG flags from flag-icons into static/flags/
 * Maps IMO country codes → ISO 3166-1 alpha-2 codes
 */
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = join(root, "node_modules/flag-icons/flags/4x3");
const dest = join(root, "static/flags");

// IMO code → ISO 3166-1 alpha-2 (lowercase)
const IMO_TO_ISO = {
  AFG: "af",
  AGO: "ao",
  ALB: "al",
  ALG: "dz",
  ARG: "ar",
  ARM: "am",
  AUS: "au",
  AUT: "at",
  AZE: "az",
  BAH: "bs",
  BEL: "be",
  BEN: "bj",
  BFA: "bf",
  BGD: "bd",
  BGR: "bg",
  BIH: "ba",
  BLR: "by",
  BOL: "bo",
  BRA: "br",
  BRU: "bn",
  BTN: "bt",
  BWA: "bw",
  CAN: "ca",
  CHI: "cl",
  CHN: "cn",
  CIV: "ci",
  CMR: "cm",
  COL: "co",
  CRI: "cr",
  CUB: "cu",
  CYP: "cy",
  CZE: "cz",
  DEN: "dk",
  DOM: "do",
  ECU: "ec",
  EGY: "eg",
  ESP: "es",
  EST: "ee",
  FIN: "fi",
  FRA: "fr",
  GEO: "ge",
  GER: "de",
  GHA: "gh",
  GMB: "gm",
  GTM: "gt",
  HEL: "gr",
  HKG: "hk",
  HND: "hn",
  HRV: "hr",
  HUN: "hu",
  IDN: "id",
  IND: "in",
  IRL: "ie",
  IRN: "ir",
  IRQ: "iq",
  ISL: "is",
  ISR: "il",
  ITA: "it",
  JAM: "jm",
  JPN: "jp",
  KAZ: "kz",
  KEN: "ke",
  KGZ: "kg",
  KHM: "kh",
  KOR: "kr",
  KSV: "xk",
  KWT: "kw",
  LAO: "la",
  LBY: "ly",
  LIE: "li",
  LKA: "lk",
  LTU: "lt",
  LUX: "lu",
  LVA: "lv",
  MAC: "mo",
  MAR: "ma",
  MAS: "my",
  MDA: "md",
  MDG: "mg",
  MEX: "mx",
  MKD: "mk",
  MMR: "mm",
  MNE: "me",
  MNG: "mn",
  MOZ: "mz",
  MRT: "mr",
  NAM: "na",
  NGA: "ng",
  NIC: "ni",
  NLD: "nl",
  NOR: "no",
  NPL: "np",
  NZL: "nz",
  OMN: "om",
  PAK: "pk",
  PAN: "pa",
  PAR: "py",
  PER: "pe",
  PHI: "ph",
  POL: "pl",
  POR: "pt",
  PRI: "pr",
  PRK: "kp",
  PSE: "ps",
  QAT: "qa",
  ROU: "ro",
  RUS: "ru",
  RWA: "rw",
  SAF: "za",
  SAU: "sa",
  SEN: "sn",
  SGP: "sg",
  SLV: "sv",
  SRB: "rs",
  SUI: "ch",
  SVK: "sk",
  SVN: "si",
  SWE: "se",
  SYR: "sy",
  THA: "th",
  TJK: "tj",
  TKM: "tm",
  TTO: "tt",
  TUN: "tn",
  TUR: "tr",
  TWN: "tw",
  TZA: "tz",
  UAE: "ae",
  UGA: "ug",
  UKR: "ua",
  UNK: "gb",  // United Kingdom
  URY: "uy",
  USA: "us",
  UZB: "uz",
  VEN: "ve",
  VNM: "vn",
  YEM: "ye",
  ZWE: "zw",
};

if (!existsSync(dest)) mkdirSync(dest, { recursive: true });

let copied = 0;
let missing = 0;
for (const [imo, iso] of Object.entries(IMO_TO_ISO)) {
  const srcFile = join(src, `${iso}.svg`);
  const destFile = join(dest, `${imo}.svg`);
  if (existsSync(srcFile)) {
    copyFileSync(srcFile, destFile);
    copied++;
  } else {
    console.warn(`MISSING: ${imo} → ${iso}.svg`);
    missing++;
  }
}

console.log(`Copied ${copied} SVG flags, ${missing} missing`);
