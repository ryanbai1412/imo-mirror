#!/usr/bin/env python3
"""
Audit all IMO JSON data files for anomalies.

Checks performed:
  - Individual: score out of range, sum != total,
    missing fields, weird awards, placeholder countries
  - Country: sum vs individual totals, award counts,
    team sizes, rank gaps
  - Cross-file: year coverage, contestant counts,
    medal counts, male+female != all
  - Timeline: missing years, edition numbering
  - Results_year: cutoff ordering, medal fractions
  - Hall of fame: participation sanity
"""

import json
import sys
from pathlib import Path
from collections import Counter

DATA = Path(__file__).parent.parent / "data"
ISSUES = []


def warn(category, msg):
    ISSUES.append((category, msg))


def load(name):
    with open(DATA / name) as f:
        return json.load(f)


# ── Load all data ──────────────────────────────
iby = load("individual_results_by_year.json")
cby = load("country_results_by_year.json")
ry  = load("results_year.json")
rc  = load("results_country.json")
tl  = load("timeline.json")
yi  = load("year_info.json")
hof = load("hall_of_fame.json")
ys  = load("year_statistics.json")
prb = load("problems.json")
rm  = load("results_matrix.json")
ct  = load("countries.json")

# Known years with no IMO
NO_IMO = {1980}
ALL_YEARS = set(range(1959, 2026)) - NO_IMO


# ═══════════════════════════════════════════════
# 1. INDIVIDUAL RESULTS
# ═══════════════════════════════════════════════
print("=== Individual Results ===")
for yr_s, entries in sorted(iby.items(), key=lambda x: int(x[0])):
    yr = int(yr_s)
    if not entries:
        warn("indiv", f"{yr}: no entries")
        continue

    seen_ids = Counter()
    for e in entries:
        pid = e.get("participant_id")
        if pid:
            seen_ids[pid] += 1

        # Score range check (0-7 per problem)
        for p in ["p1","p2","p3","p4","p5","p6"]:
            v = e.get(p)
            if v is not None and (v < 0 or v > 7):
                warn("indiv",
                     f"{yr} {e['name']}: "
                     f"{p}={v} out of [0,7]")

        if e.get("p7") is not None and yr >= 1978:
            warn("indiv",
                 f"{yr} {e['name']}: "
                 f"p7={e['p7']} but year >= 1978")

        # Sum check
        scores = [e.get(f"p{i}") for i in range(1,7)]
        if e.get("p7") is not None:
            scores.append(e["p7"])
        if all(s is not None for s in scores):
            computed = sum(scores)
            total = e.get("total")
            if total is not None and computed != total:
                warn("indiv",
                     f"{yr} {e['name']}: "
                     f"sum={computed} != total={total}")

        # Missing total
        if e.get("total") is None:
            warn("indiv",
                 f"{yr} {e['name']}: "
                 f"total is null")

        # Award sanity
        award = (e.get("award") or "").strip()
        valid_awards = {
            "", "Gold medal", "Silver medal",
            "Bronze medal", "Honourable mention",
            "Honourable Mention",
        }
        if award and award not in valid_awards:
            warn("indiv",
                 f"{yr} {e['name']}: "
                 f"weird award '{award}'")

        # Placeholder country codes
        cc = e.get("country_code", "")
        if (cc and cc.startswith("C")
                and len(cc) <= 3
                and cc[1:].isdigit()):
            warn("indiv",
                 f"{yr} {e['name']}: "
                 f"placeholder code '{cc}', "
                 f"country='{e.get('country')}'")

        # Missing country
        if not e.get("country"):
            warn("indiv",
                 f"{yr} {e['name']}: "
                 f"missing country")

        # Missing name
        if not e.get("name"):
            warn("indiv",
                 f"{yr} pid={pid}: missing name")

        # Rank sanity
        rank = e.get("rank")
        if rank is not None and rank <= 0:
            warn("indiv",
                 f"{yr} {e['name']}: "
                 f"rank={rank} <= 0")

    # Duplicate participant IDs
    for pid, cnt in seen_ids.items():
        if cnt > 1:
            warn("indiv",
                 f"{yr}: participant_id {pid} "
                 f"appears {cnt} times")


# ═══════════════════════════════════════════════
# 2. COUNTRY RESULTS
# ═══════════════════════════════════════════════
print("=== Country Results ===")
for yr_s, entries in sorted(cby.items(), key=lambda x: int(x[0])):
    yr = int(yr_s)
    if not entries:
        warn("country", f"{yr}: no entries")
        continue

    indivs = iby.get(yr_s, [])

    for e in entries:
        code = e.get("code", "?")
        name = e.get("country", "?")

        # Problem scores: each should be <= 7 * team_size
        ts = e.get("team_size_all")
        if ts and ts > 0:
            for p in ["p1","p2","p3","p4","p5","p6"]:
                v = e.get(p)
                if v is not None and v > 7 * ts:
                    warn("country",
                         f"{yr} {code}: "
                         f"{p}={v} > 7*{ts}")
                if v is not None and v < 0:
                    warn("country",
                         f"{yr} {code}: {p}={v} < 0")

        # p7 should be null for modern years
        if e.get("p7") is not None and yr >= 1978:
            warn("country",
                 f"{yr} {code}: "
                 f"p7={e['p7']} non-null "
                 f"(year >= 1978)")

        # Total vs sum of problem scores
        pscores = [e.get(f"p{i}") for i in range(1,7)]
        if all(s is not None for s in pscores):
            csum = sum(pscores)
            if e.get("p7") is not None:
                csum += e["p7"]
            total = e.get("total")
            if total is not None and csum != total:
                warn("country",
                     f"{yr} {code}: "
                     f"p-sum={csum} != total={total}")

        # Cross-check total vs individual sums
        if indivs:
            team = [i for i in indivs
                    if i.get("country_code") == code]
            if team:
                itotal = sum(
                    i.get("total") or 0 for i in team)
                ctotal = e.get("total")
                if (ctotal is not None
                        and itotal > 0
                        and abs(ctotal - itotal) > 0):
                    warn("country",
                         f"{yr} {code}: "
                         f"team total={ctotal} != "
                         f"sum(indiv)={itotal}")
                # Team size check
                actual_ts = len(team)
                if ts and ts != actual_ts:
                    warn("country",
                         f"{yr} {code}: "
                         f"team_size={ts} but "
                         f"{actual_ts} individuals")

        # Award counts: G+S+B+HM <= team_size
        g = e.get("awards_gold") or 0
        s = e.get("awards_silver") or 0
        b = e.get("awards_bronze") or 0
        h = e.get("awards_hm") or 0
        award_total = g + s + b + h
        if ts and award_total > ts:
            warn("country",
                 f"{yr} {code}: "
                 f"awards({award_total}) > "
                 f"team_size({ts})")

        # male + female = all check
        m = e.get("team_size_male")
        f = e.get("team_size_female")
        if (ts is not None
                and m is not None
                and f is not None
                and m + f != ts):
            warn("country",
                 f"{yr} {code}: "
                 f"male({m})+female({f}) "
                 f"!= all({ts})")

        # rank sanity
        rank = e.get("rank")
        if rank is not None and rank <= 0:
            warn("country",
                 f"{yr} {code}: rank={rank} <= 0")

    # Check for duplicate country codes
    codes = [e["code"] for e in entries if e.get("code")]
    dups = [c for c, n in Counter(codes).items() if n > 1]
    if dups:
        warn("country",
             f"{yr}: duplicate codes {dups}")


# ═══════════════════════════════════════════════
# 3. RESULTS_YEAR
# ═══════════════════════════════════════════════
print("=== Results Year ===")
for entry in ry:
    yr = entry.get("year")
    if not yr:
        warn("ry", "entry with no year")
        continue

    # male + female = all
    a = entry.get("contestants_all")
    m = entry.get("contestants_male")
    f = entry.get("contestants_female")
    if a and m is not None and f is not None:
        if m + f != a:
            warn("ry",
                 f"{yr}: male({m})+female({f})"
                 f" != all({a})")

    # Cutoff ordering: gold > silver > bronze
    gc = entry.get("gold_cutoff")
    sc = entry.get("silver_cutoff")
    bc = entry.get("bronze_cutoff")
    if gc and sc and bc:
        if not (gc >= sc >= bc):
            warn("ry",
                 f"{yr}: cutoffs not ordered "
                 f"G={gc} S={sc} B={bc}")

    # Medal counts should be reasonable
    g = entry.get("gold") or 0
    s = entry.get("silver") or 0
    b = entry.get("bronze") or 0
    h = entry.get("hm") or 0
    total_medals = g + s + b + h
    if a and total_medals > a:
        warn("ry",
             f"{yr}: medals({total_medals})"
             f" > contestants({a})")

    # Cross-check with individual data
    indivs = iby.get(str(yr), [])
    if indivs and a:
        if len(indivs) != a:
            warn("ry",
                 f"{yr}: results_year says "
                 f"{a} contestants but "
                 f"{len(indivs)} individuals")

    # Cross-check medal counts with individual awards
    if indivs:
        ig = sum(1 for i in indivs
                 if "Gold" in (i.get("award") or ""))
        is_ = sum(1 for i in indivs
                  if "Silver" in (i.get("award") or ""))
        ib = sum(1 for i in indivs
                 if "Bronze" in (i.get("award") or ""))
        ih = sum(1 for i in indivs
                 if "Honourable" in (i.get("award") or "")
                 or "Honorable" in (i.get("award") or ""))
        if g and ig != g:
            warn("ry",
                 f"{yr}: gold count {g} "
                 f"!= indiv golds {ig}")
        if s and is_ != s:
            warn("ry",
                 f"{yr}: silver count {s} "
                 f"!= indiv silvers {is_}")
        if b and ib != b:
            warn("ry",
                 f"{yr}: bronze count {b} "
                 f"!= indiv bronzes {ib}")

    # Efficiency sanity (should be 0-100)
    eff = entry.get("efficiency")
    if eff is not None and (eff < 0 or eff > 100):
        warn("ry",
             f"{yr}: efficiency={eff} "
             f"out of [0,100]")


# ═══════════════════════════════════════════════
# 4. TIMELINE
# ═══════════════════════════════════════════════
print("=== Timeline ===")
tl_years = {e["year"] for e in tl if e.get("year")}

# Check edition numbering
for e in tl:
    yr = e.get("year")
    ed = e.get("edition")
    if yr and ed:
        # Edition 1 = 1959, no IMO in 1980
        expected = yr - 1959 + 1
        if yr > 1980:
            expected -= 1
        if ed != expected:
            warn("timeline",
                 f"{yr}: edition={ed}, "
                 f"expected={expected}")

# Male+female=all
for e in tl:
    yr = e.get("year")
    a = e.get("contestants_all")
    m = e.get("contestants_male")
    f = e.get("contestants_female")
    if (a is not None and m is not None
            and f is not None and m + f != a):
        warn("timeline",
             f"{yr}: male({m})+female({f})"
             f" != all({a})")


# ═══════════════════════════════════════════════
# 5. YEAR COVERAGE
# ═══════════════════════════════════════════════
print("=== Year Coverage ===")
past_years = {y for y in ALL_YEARS if y <= 2025}

iby_years = set(int(k) for k in iby.keys())
cby_years = set(int(k) for k in cby.keys())
ry_years = {e["year"] for e in ry if e.get("year")}
yi_years = set(int(k) for k in yi.keys())

missing_iby = past_years - iby_years
missing_cby = past_years - cby_years
if missing_iby:
    warn("coverage",
         f"individual_results missing years: "
         f"{sorted(missing_iby)}")
if missing_cby:
    warn("coverage",
         f"country_results missing years: "
         f"{sorted(missing_cby)}")


# ═══════════════════════════════════════════════
# 6. RESULTS_COUNTRY
# ═══════════════════════════════════════════════
print("=== Results Country ===")
for e in rc:
    code = e.get("code")
    a = e.get("contestants_all")
    m = e.get("contestants_male")
    f = e.get("contestants_female")
    if (a and m is not None and f is not None
            and m + f != a and m > 0):
        warn("rc",
             f"{code}: male({m})+female({f})"
             f" != all({a})")

    # Participations vs first year
    fp = e.get("first_participation")
    p = e.get("participations")
    if fp and p:
        max_possible = 2025 - fp + 1
        if fp > 1980:
            pass  # no adjustment needed
        elif fp <= 1979:
            max_possible -= 1  # skip 1980
        if p > max_possible:
            warn("rc",
                 f"{code}: participations={p}"
                 f" > possible={max_possible}"
                 f" (first={fp})")


# ═══════════════════════════════════════════════
# 7. HALL OF FAME
# ═══════════════════════════════════════════════
print("=== Hall of Fame ===")
for e in hof:
    name = e.get("name")
    p = e.get("participations", 0)
    total_awards = (
        (e.get("gold") or 0)
        + (e.get("silver") or 0)
        + (e.get("bronze") or 0)
        + (e.get("hm") or 0)
    )
    if p > 0 and total_awards > p:
        warn("hof",
             f"{name}: awards({total_awards})"
             f" > participations({p})")
    if p > 7:
        warn("hof",
             f"{name}: {p} participations"
             f" (suspiciously high)")
    if e.get("perfect_scores", 0) > e.get("gold", 0):
        warn("hof",
             f"{name}: perfect_scores"
             f"({e['perfect_scores']}) > "
             f"gold({e['gold']})")


# ═══════════════════════════════════════════════
# 8. PROBLEMS
# ═══════════════════════════════════════════════
print("=== Problems ===")
prob_years = {p["year"] for p in prb}
for yr in past_years:
    if yr not in prob_years:
        warn("problems",
             f"{yr}: missing from problems.json")

# All languages are empty
all_empty_langs = all(
    not p.get("languages") for p in prb)
if all_empty_langs:
    warn("problems",
         "ALL years have empty languages[]")


# ═══════════════════════════════════════════════
# 9. YEAR STATISTICS
# ═══════════════════════════════════════════════
print("=== Year Statistics ===")
for yr_s, stats in sorted(
        ys.items(), key=lambda x: int(x[0])):
    yr = int(yr_s)
    probs = stats.get("problems", {})
    if not probs:
        warn("ystats",
             f"{yr}: empty statistics")
        continue

    # Check score distribution sums
    n_contestants = None
    indivs = iby.get(yr_s, [])
    if indivs:
        n_contestants = len(indivs)

    for pi in range(1, 7):
        pk = f"p{pi}"
        total_by_score = 0
        for score in range(8):
            key = f"Num( P# = {score} )"
            row = probs.get(key, {})
            val = row.get(pk)
            if val:
                try:
                    total_by_score += int(val)
                except ValueError:
                    pass
        if (n_contestants
                and total_by_score > 0
                and total_by_score != n_contestants):
            warn("ystats",
                 f"{yr} {pk}: score dist sums "
                 f"to {total_by_score}, expected "
                 f"{n_contestants}")


# ═══════════════════════════════════════════════
#  REPORT
# ═══════════════════════════════════════════════
print()
print("=" * 55)
print(f"AUDIT COMPLETE: {len(ISSUES)} issues found")
print("=" * 55)

by_cat = {}
for cat, msg in ISSUES:
    by_cat.setdefault(cat, []).append(msg)

for cat in sorted(by_cat.keys()):
    msgs = by_cat[cat]
    print(f"\n── {cat} ({len(msgs)} issues) ──")
    for m in msgs[:80]:  # cap output
        print(f"  • {m}")
    if len(msgs) > 80:
        print(f"  ... and {len(msgs)-80} more")

print()
if ISSUES:
    sys.exit(1)
