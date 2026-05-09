#!/usr/bin/env python3
"""
Fix data issues across IMO JSON files.

COUNTRY RESULTS (country_results_by_year.json):
  1. 1959,1961,1963-1977 ("ordinal/p7-shifted years"):
     The scraper's p7 detection ate the Total column,
     shifting every subsequent column by 1:
       p7        = actual team total
       total     = ordinal placement
       rank      = gold count
       awards_gold   = silver count
       awards_silver = bronze count
       awards_bronze = HM count
       awards_hm     = garbage
     Fix: unshift all columns, recompute total from
     individuals, assign proper ranks.

  2. 1960, 1962 ("swapped years", no p7 shift):
     Table had an extra Rank column the scraper
     didn't expect:
       rank          = team total score
       awards_gold   = ordinal rank
       awards_silver = real gold count
       awards_bronze = real silver count
       awards_hm     = real bronze count
       (HM count lost)
     Fix: unshift awards, move rank→total.
     Special case: 1962 CZS has p7 shift (mixed).

  3. rank = 0 → null (all years)

INDIVIDUAL RESULTS (individual_results_by_year.json):
  4. 1960, 1962:
     rank = individual score, award = ordinal placement
     Fix: rank→total, recompute ranks, award→null

  5. 2005: two awards have trailing '§' footnote marker
     Fix: strip '§'

  6. 2022-2025: Russian contestants competing as
     individuals have placeholder codes (C01-C36)
     and country names like 'C05'.
     Fix: set country to 'Individual Participant'

  7. 1960, 1962: these years had 7 problems but
     only 6 score columns were scraped.
     Fix: compute p7 = total - sum(p1..p6) where
     all 6 scores and total are available.
"""

import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "src" / "lib" / "data"
MASSIVE_DIR = DATA_DIR / "massive"


def load(name):
    path = MASSIVE_DIR / name if name in (
        "country_results_by_year.json",
        "individual_results_by_year.json",
    ) else DATA_DIR / name
    with open(path) as f:
        return json.load(f)


def save(name, data):
    path = MASSIVE_DIR / name if name in (
        "country_results_by_year.json",
        "individual_results_by_year.json",
    ) else DATA_DIR / name
    with open(path, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  Saved {path}")


def assign_ranks(entries, score_key="total"):
    """Assign dense ranks by descending score."""
    by_score = sorted(
        entries,
        key=lambda e: -(e.get(score_key) or 0),
    )
    rank = 1
    for i, e in enumerate(by_score):
        if e.get(score_key) is None:
            e["rank"] = None
            continue
        if i > 0 and (e.get(score_key) or 0) < (by_score[i - 1].get(score_key) or 0):
            rank = i + 1
        e["rank"] = rank


def fix_country_results(iby):
    """Fix country results using raw individual data for totals."""
    cby = load("country_results_by_year.json")

    changes = 0
    for yr_str in sorted(cby.keys(), key=int):
        yr = int(yr_str)
        entries = cby[yr_str]
        indivs = iby.get(yr_str, [])
        n = len(entries)

        # Detect ordinal years: total in [1..N]
        non_null_totals = [e["total"] for e in entries if e.get("total") is not None]
        max_t = max(non_null_totals) if non_null_totals else None
        all_null = len(non_null_totals) == 0

        is_ordinal = (not all_null and max_t is not None and max_t <= n + 2 and n >= 3)
        # "swapped" if most entries have null total and large rank (team score)
        null_total_count = sum(1 for e in entries if e.get("total") is None)
        has_large_ranks = any((e.get("rank") or 0) > n + 5 for e in entries)
        is_swapped = (null_total_count >= n - 1 and has_large_ranks and not is_ordinal)

        if is_swapped:
            # 1960, 1962: rank=team_total, awards shifted by 1
            print(f"  {yr}: SWAPPED — unshifting columns")
            for e in entries:
                has_p7_shift = e.get("p7") is not None

                if has_p7_shift:
                    # 1962 CZS: p7 is a real problem 7 score
                    # (1962 had 7 problems). The remaining
                    # columns (total, rank, awards) are
                    # correctly aligned — no unshifting needed.
                    # Just keep everything as-is.
                    changes += 1
                else:
                    # Normal swapped: rank=team_total
                    # awards_gold=ordinal_rank (discard)
                    # awards_silver=real_gold, etc.
                    real_gold = e["awards_silver"]
                    real_silver = e["awards_bronze"]
                    real_bronze = e["awards_hm"]
                    e["total"] = e["rank"] if (e.get("rank") or 0) > n + 5 else None
                    e["rank"] = None
                    e["awards_gold"] = real_gold
                    e["awards_silver"] = real_silver
                    e["awards_bronze"] = real_bronze
                    e["awards_hm"] = None  # lost, can't recover
                    changes += 1

            # Try to fill missing totals from individuals
            for e in entries:
                if e.get("total") is None:
                    code = e["code"]
                    team = [i for i in indivs if i.get("country_code") == code]
                    if team:
                        computed = sum(i.get("total") or 0 for i in team)
                        if computed > 0:
                            e["total"] = computed
                            changes += 1
            assign_ranks(entries)
            changes += len(entries)

        elif is_ordinal:
            # 1959, 1961, 1963-1977: p7 shift
            # p7=total, total=rank, rank=G, G=S, S=B, B=HM
            print(f"  {yr}: ORDINAL/P7-SHIFTED — unshifting columns")
            for e in entries:
                saved_p7 = e["p7"]  # team total
                real_gold = e["rank"]
                real_silver = e["awards_gold"]
                real_bronze = e["awards_silver"]
                real_hm = e["awards_bronze"]

                e["awards_gold"] = real_gold
                e["awards_silver"] = real_silver
                e["awards_bronze"] = real_bronze
                e["awards_hm"] = real_hm
                e["p7"] = None
                e["rank"] = None
                changes += 1

                # Compute real total from individuals,
                # fall back to saved p7 (was team total)
                code = e["code"]
                team = [i for i in indivs if i.get("country_code") == code]
                computed = sum(i.get("total") or 0 for i in team)
                if computed > 0:
                    e["total"] = computed
                else:
                    e["total"] = saved_p7
                changes += 1
            assign_ranks(entries)
            changes += len(entries)

        # Fix rank=0 → null for all years
        for e in entries:
            if e.get("rank") == 0:
                e["rank"] = None
                changes += 1

    print(f"  Country results: {changes} fields fixed")
    save("country_results_by_year.json", cby)


def fix_individual_results():
    """Load raw individual data, apply all individual fixes, save once.

    Returns the fixed iby dict (needed by fix_country_results
    to compute totals from individual scores).
    """
    iby = load("individual_results_by_year.json")
    changes = 0

    # --- Fix 1: swapped years (1960, 1962) ---
    for yr_str in sorted(iby.keys(), key=int):
        yr = int(yr_str)
        entries = iby[yr_str]

        numeric_awards = sum(
            1 for e in entries
            if str(e.get("award", "")).strip().isdigit()
        )

        if numeric_awards > len(entries) * 0.8:
            print(f"  {yr}: SWAPPED — rank=score, award=rank")
            for e in entries:
                score = e.get("rank")
                e["total"] = score
                e["award"] = None
                e["rank"] = None
                changes += 1
            assign_ranks(entries)
            changes += len(entries)

        # Fix rank=0 → null
        for e in entries:
            if e.get("rank") == 0:
                e["rank"] = None
                changes += 1

    print(f"  Swapped years: {changes} fields fixed")

    # --- Fix 2: strip § from awards ---
    sect_changes = 0
    for yr_str, entries in iby.items():
        for e in entries:
            award = e.get("award", "") or ""
            if "§" in award:
                e["award"] = award.replace("§", "")
                print(f"  {yr_str} {e['name']}: "
                      f"'{award}' → '{e['award']}'")
                sect_changes += 1
    print(f"  Stripped § from {sect_changes} awards")

    # --- Fix 3: placeholder country codes ---
    label = "Individual Participant"
    code_changes = 0
    for yr_str, entries in iby.items():
        for e in entries:
            cc = e.get("country_code", "")
            if (cc
                    and cc.startswith("C")
                    and len(cc) <= 3
                    and cc[1:].isdigit()):
                old_country = e["country"]
                e["country"] = label
                print(f"  {yr_str} {e['name']}: "
                      f"'{old_country}' → '{label}'")
                code_changes += 1
    print(f"  Relabelled {code_changes} placeholder countries")

    # --- Fix 4: recover p7 for 7-problem years ---
    # 1960 (max 44) and 1962 (max 46) had 7 problems.
    # Where we have all p1-p6 and a total, compute
    # p7 = total - sum(p1..p6).
    p7_years = {"1960", "1962"}
    p7_changes = 0
    for yr_str in p7_years:
        entries = iby.get(yr_str, [])
        for e in entries:
            if e.get("p7") is not None:
                continue
            scores = [e.get(f"p{i}") for i in range(1, 7)]
            total = e.get("total")
            if total is None or any(s is None for s in scores):
                continue
            implied = total - sum(scores)
            if implied >= 0:
                e["p7"] = implied
                p7_changes += 1
    print(f"  Recovered p7 for {p7_changes} entries "
          f"in {sorted(p7_years)}")

    save("individual_results_by_year.json", iby)
    return iby


def main():
    print("Fixing data issues...")
    print()
    print("=== Individual Results ===")
    iby = fix_individual_results()
    print()
    print("=== Country Results ===")
    fix_country_results(iby)
    print()
    print("Done!")


if __name__ == "__main__":
    main()
