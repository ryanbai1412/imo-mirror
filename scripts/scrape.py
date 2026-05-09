#!/usr/bin/env python3
"""
Comprehensive scraper for imo-official.org data.
Uses Wayback Machine as primary source (faster), falls back to live site.
Outputs structured JSON files for the static mirror.
"""

import json
import os
import re
import sys
import time
import hashlib
from pathlib import Path
from urllib.parse import urlencode, quote

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.imo-official.org"
WAYBACK_PREFIX = "https://web.archive.org/web/2025"
DATA_DIR = Path(__file__).parent.parent / "data"
CACHE_DIR = Path(__file__).parent.parent / ".cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": "IMO-Mirror-Bot/1.0 (building static mirror of IMO results)"
})

# All IMO years (no IMO in 1980)
IMO_YEARS = list(range(1959, 2030))
IMO_YEARS = [y for y in IMO_YEARS if y != 1980]


def cache_path(url):
    h = hashlib.md5(url.encode()).hexdigest()
    return CACHE_DIR / f"{h}.html"


def fetch_page(path, use_wayback=True, timeout=30):
    """Fetch a page, trying Wayback Machine first, then live site."""
    url = f"{BASE_URL}/{path}"
    cp = cache_path(url)

    if cp.exists():
        return cp.read_text(encoding="utf-8")

    # Try Wayback Machine first
    if use_wayback:
        wb_url = f"{WAYBACK_PREFIX}/{url}"
        try:
            resp = SESSION.get(wb_url, timeout=timeout)
            if resp.status_code == 200 and "imo-official" in resp.text.lower():
                # Strip Wayback Machine toolbar/wrapper
                text = resp.text
                cp.write_text(text, encoding="utf-8")
                time.sleep(0.3)
                return text
        except Exception as e:
            print(f"  Wayback failed for {path}: {e}")

    # Fall back to live site
    try:
        resp = SESSION.get(url, timeout=timeout)
        if resp.status_code == 200:
            cp.write_text(resp.text, encoding="utf-8")
            time.sleep(1)  # Be nice to the slow server
            return resp.text
    except Exception as e:
        print(f"  Live site failed for {path}: {e}")

    return None


def clean_text(text):
    """Clean whitespace from text."""
    if text is None:
        return ""
    return re.sub(r'\s+', ' ', text.strip())


def parse_int(s):
    """Parse integer from string, return None if not possible."""
    if s is None:
        return None
    s = s.strip().replace('\xa0', '').replace(',', '')
    if not s:
        return None
    try:
        return int(s)
    except ValueError:
        return None


def parse_float(s):
    """Parse float from string."""
    if s is None:
        return None
    s = s.strip().replace('\xa0', '').replace(',', '').replace('%', '')
    if not s:
        return None
    try:
        return float(s)
    except ValueError:
        return None



def find_data_table(soup, min_rows=3):
    """Find the main data table. Wayback strips class='sortable'."""
    table = soup.find("table", class_="sortable")
    if table:
        return table
    tables = soup.find_all("table")
    best_table = None
    best_rows = 0
    for t in tables:
        rows = t.find_all("tr")
        td_rows = sum(1 for r in rows if r.find("td"))
        if td_rows > best_rows and td_rows >= min_rows:
            best_rows = td_rows
            best_table = t
    return best_table


def clean_href(href):
    """Clean Wayback Machine URLs from hrefs."""
    if not href:
        return href
    m = re.search(r'https?://www\.imo-official\.org/(.+)', href)
    if m:
        return m.group(1)
    return strip_wayback_prefix(href)


def strip_wayback_prefix(url):
    """Strip Wayback Machine prefix from any URL."""
    if not url:
        return url
    m = re.match(r'https?://web\.archive\.org/web/\d+/(https?://.+)', url)
    if m:
        return m.group(1)
    return url


def clean_wayback_html(html):
    """Strip Wayback Machine artifacts from HTML content (img src, etc.)."""
    if not html:
        return html
    html = re.sub(r'/web/\d+im_/(https?://)', r'\1', html)
    html = re.sub(
        r'((?:href|src)=["\'])(?:https?://web\.archive\.org)?/web/\d+(?:im_)?/(https?://)',
        r'\1\2', html,
    )
    return html


def scrape_timeline():
    """Scrape organizers.aspx to get timeline of all IMOs."""
    print("Scraping timeline...")
    html = fetch_page("organizers.aspx")
    if not html:
        print("  FAILED to fetch timeline")
        return []

    soup = BeautifulSoup(html, "html.parser")
    table = find_data_table(soup)
    if not table:
        # Try finding any table with year data
        tables = soup.find_all("table")
        for t in tables:
            if t.find("td", string=re.compile(r"^\d{4}$")):
                table = t
                break

    if not table:
        print("  Could not find timeline table")
        return []

    rows = table.find_all("tr")
    timeline = []
    for row in rows:
        cells = row.find_all("td")
        if len(cells) < 3:
            continue

        edition = parse_int(cells[0].get_text())
        year = parse_int(cells[1].get_text())
        if not year:
            continue

        country = clean_text(cells[2].get_text())
        city = clean_text(cells[3].get_text()) if len(cells) > 3 else ""
        date = clean_text(cells[4].get_text()) if len(cells) > 4 else ""
        num_countries = parse_int(cells[5].get_text()) if len(cells) > 5 else None
        num_contestants_all = parse_int(cells[6].get_text()) if len(cells) > 6 else None
        num_contestants_male = parse_int(cells[7].get_text()) if len(cells) > 7 else None
        num_contestants_female = parse_int(cells[8].get_text()) if len(cells) > 8 else None

        # Extract homepage link if present
        link_el = cells[2].find("a") if len(cells) > 2 else None
        homepage = strip_wayback_prefix(link_el["href"]) if link_el and link_el.has_attr("href") else None

        timeline.append({
            "edition": edition,
            "year": year,
            "country": country,
            "city": city,
            "date": date,
            "num_countries": num_countries,
            "contestants_all": num_contestants_all,
            "contestants_male": num_contestants_male,
            "contestants_female": num_contestants_female,
            "homepage": homepage,
        })

    print(f"  Found {len(timeline)} IMO editions")
    return timeline


def scrape_countries():
    """Scrape countries.aspx to get all country codes and info."""
    print("Scraping countries...")
    html = fetch_page("countries.aspx")
    if not html:
        print("  FAILED to fetch countries")
        return []

    soup = BeautifulSoup(html, "html.parser")
    table = find_data_table(soup)
    if not table:
        tables = soup.find_all("table")
        for t in tables:
            text = t.get_text()
            if "Code" in text and "Country" in text:
                table = t
                break

    if not table:
        print("  Could not find countries table")
        return []

    rows = table.find_all("tr")
    countries = []
    for row in rows:
        cells = row.find_all("td")
        if len(cells) < 2:
            continue

        code = clean_text(cells[0].get_text())
        if not code or len(code) != 3:
            continue

        country_name = clean_text(cells[1].get_text())
        contact = clean_text(cells[2].get_text()) if len(cells) > 2 else ""
        website = ""
        if len(cells) > 3:
            link = cells[3].find("a")
            website = strip_wayback_prefix(link["href"]) if link and link.has_attr("href") else ""
        host_years = clean_text(cells[4].get_text()) if len(cells) > 4 else ""

        # Extract flag URL
        flag_img = row.find("img")
        flag_url = flag_img["src"] if flag_img and flag_img.has_attr("src") else ""

        countries.append({
            "code": code,
            "name": country_name,
            "contact": contact,
            "website": website,
            "host_years": host_years,
            "flag_url": flag_url,
        })

    print(f"  Found {len(countries)} countries")
    return countries


def scrape_year_country_results(year):
    """Scrape year_country_r.aspx?year=YYYY for country results."""
    html = fetch_page(f"year_country_r.aspx?year={year}")
    if not html:
        return []

    soup = BeautifulSoup(html, "html.parser")
    table = find_data_table(soup)
    if not table:
        return []

    rows = table.find_all("tr")
    results = []

    for row in rows:
        cells = row.find_all("td")
        if len(cells) < 5:
            continue

        # First cell is country name with link
        country_cell = cells[0]
        country_link = country_cell.find("a")
        if not country_link:
            continue

        country_name = clean_text(country_link.get_text())
        if country_name == "Country" or not country_name:
            continue

        # Extract country code from team_r link
        href = country_link.get("href", "")
        code_match = re.search(r'code=([A-Z]+)', href)
        country_code = code_match.group(1) if code_match else ""

        # Parse the rest of the columns
        # Structure depends on the year - older years may have 7 problems
        idx = 1
        team_size_all = parse_int(cells[idx].get_text()) if idx < len(cells) else None
        idx += 1
        team_size_male = parse_int(cells[idx].get_text()) if idx < len(cells) else None
        idx += 1
        team_size_female = parse_int(cells[idx].get_text()) if idx < len(cells) else None
        idx += 1

        # Problem scores - could be P1-P6 or P1-P7 for older years
        num_problems = 6
        if year <= 1981:
            # Before 1982, some years had different numbers of problems
            # Check how many numeric columns there are
            pass

        scores = []
        for p in range(num_problems):
            if idx < len(cells):
                scores.append(parse_int(cells[idx].get_text()))
                idx += 1
            else:
                scores.append(None)

        # Some early years have P7
        p7 = None
        if year <= 1977 and idx < len(cells):
            next_val = cells[idx].get_text().strip()
            if next_val and next_val.isdigit():
                p7 = parse_int(next_val)
                idx += 1

        total = parse_int(cells[idx].get_text()) if idx < len(cells) else None
        idx += 1
        rank = parse_int(cells[idx].get_text()) if idx < len(cells) else None
        idx += 1

        # Awards
        gold = parse_int(cells[idx].get_text()) if idx < len(cells) else None
        idx += 1
        silver = parse_int(cells[idx].get_text()) if idx < len(cells) else None
        idx += 1
        bronze = parse_int(cells[idx].get_text()) if idx < len(cells) else None
        idx += 1
        hm = parse_int(cells[idx].get_text()) if idx < len(cells) else None
        idx += 1

        leader = clean_text(cells[idx].get_text()) if idx < len(cells) else ""
        idx += 1
        deputy = clean_text(cells[idx].get_text()) if idx < len(cells) else ""

        result = {
            "country": country_name,
            "code": country_code,
            "team_size_all": team_size_all,
            "team_size_male": team_size_male,
            "team_size_female": team_size_female,
            "p1": scores[0] if len(scores) > 0 else None,
            "p2": scores[1] if len(scores) > 1 else None,
            "p3": scores[2] if len(scores) > 2 else None,
            "p4": scores[3] if len(scores) > 3 else None,
            "p5": scores[4] if len(scores) > 4 else None,
            "p6": scores[5] if len(scores) > 5 else None,
            "p7": p7,
            "total": total,
            "rank": rank,
            "awards_gold": gold,
            "awards_silver": silver,
            "awards_bronze": bronze,
            "awards_hm": hm,
            "leader": leader,
            "deputy_leader": deputy,
        }
        results.append(result)

    return results


def scrape_year_individual_results(year):
    """Scrape year_individual_r.aspx?year=YYYY for individual results with participant IDs."""
    html = fetch_page(f"year_individual_r.aspx?year={year}")
    if not html:
        return []

    soup = BeautifulSoup(html, "html.parser")
    table = find_data_table(soup)
    if not table:
        return []

    rows = table.find_all("tr")
    results = []

    for row in rows:
        cells = row.find_all("td")
        if len(cells) < 5:
            continue

        # First cell: contestant name with link to participant page
        contestant_cell = cells[0]
        contestant_link = contestant_cell.find("a")
        if not contestant_link:
            continue

        name = clean_text(contestant_link.get_text())
        if name == "Contestant" or not name:
            continue

        # Extract participant ID from link
        href = contestant_link.get("href", "")
        id_match = re.search(r'id=(\d+)', href)
        participant_id = int(id_match.group(1)) if id_match else None

        # Check for gender indicator
        gender = None
        gender_img = contestant_cell.find("img")
        if gender_img:
            alt = gender_img.get("alt", "")
            src = gender_img.get("src", "")
            if "female" in alt.lower() or "female" in src.lower():
                gender = "F"
            elif "male" in alt.lower() or "male" in src.lower():
                gender = "M"

        # Country
        idx = 1
        country_cell = cells[idx]
        country_name = clean_text(country_cell.get_text())
        # Try to get country code from link
        country_link = country_cell.find("a")
        country_code = ""
        if country_link:
            href = country_link.get("href", "")
            code_match = re.search(r'code=([A-Z0-9]+)', href)
            country_code = code_match.group(1) if code_match else ""
        idx += 1

        # Problem scores
        scores = []
        for p in range(6):
            if idx < len(cells):
                scores.append(parse_int(cells[idx].get_text()))
                idx += 1

        # Check for P7 (older years)
        p7 = None
        # Total
        total = parse_int(cells[idx].get_text()) if idx < len(cells) else None
        idx += 1
        rank = parse_int(cells[idx].get_text()) if idx < len(cells) else None
        idx += 1
        award = clean_text(cells[idx].get_text()) if idx < len(cells) else ""

        result = {
            "name": name,
            "participant_id": participant_id,
            "gender": gender,
            "country": country_name,
            "country_code": country_code,
            "p1": scores[0] if len(scores) > 0 else None,
            "p2": scores[1] if len(scores) > 1 else None,
            "p3": scores[2] if len(scores) > 2 else None,
            "p4": scores[3] if len(scores) > 3 else None,
            "p5": scores[4] if len(scores) > 4 else None,
            "p6": scores[5] if len(scores) > 5 else None,
            "p7": p7,
            "total": total,
            "rank": rank,
            "award": award,
        }
        results.append(result)

    return results


def scrape_year_info(year):
    """Scrape year_info.aspx?year=YYYY for general year info."""
    html = fetch_page(f"year_info.aspx?year={year}")
    if not html:
        return {}

    soup = BeautifulSoup(html, "html.parser")

    # Extract general info text
    content = soup.find("div", id="content") or soup.find("div", class_="content") or soup
    text = content.get_text()

    info = {"year": year}

    # Try to extract structured data
    # "Number of participating countries: NNN"
    m = re.search(r'Number of participating countries:\s*(\d+)', text)
    if m:
        info["num_countries"] = int(m.group(1))

    m = re.search(r'Number of contestants:\s*(\d+)', text)
    if m:
        info["num_contestants"] = int(m.group(1))

    # Award cutoffs
    m = re.search(r'Gold medals:\s*(\d+)\s*\(score\s*[≥>=]+\s*(\d+)', text)
    if m:
        info["gold_count"] = int(m.group(1))
        info["gold_cutoff"] = int(m.group(2))

    m = re.search(r'Silver medals:\s*(\d+)\s*\(score\s*[≥>=]+\s*(\d+)', text)
    if m:
        info["silver_count"] = int(m.group(1))
        info["silver_cutoff"] = int(m.group(2))

    m = re.search(r'Bronze medals:\s*(\d+)\s*\(score\s*[≥>=]+\s*(\d+)', text)
    if m:
        info["bronze_count"] = int(m.group(1))
        info["bronze_cutoff"] = int(m.group(2))

    m = re.search(r'Honourable mentions:\s*(\d+)', text)
    if m:
        info["hm_count"] = int(m.group(1))

    # Homepage link
    link = soup.find("a", string=re.compile(r'Home\s*Page', re.I))
    if link:
        info["homepage"] = strip_wayback_prefix(link.get("href", ""))

    # Problem languages
    languages = []
    select = soup.find("select")
    if select:
        for option in select.find_all("option"):
            lang = option.get_text().strip()
            if lang:
                languages.append(lang)
    info["problem_languages"] = languages

    return info


def scrape_year_statistics(year):
    """Scrape year_statistics.aspx?year=YYYY for problem statistics."""
    html = fetch_page(f"year_statistics.aspx?year={year}")
    if not html:
        return {}

    soup = BeautifulSoup(html, "html.parser")
    table = find_data_table(soup, min_rows=2)
    if not table:
        return {}

    rows = table.find_all("tr")
    stats = {"year": year, "problems": {}}

    for row in rows:
        cells = row.find_all("td")
        if not cells:
            # Try th
            cells = row.find_all("th")
        if len(cells) < 2:
            continue

        label = clean_text(cells[0].get_text())
        if not label:
            continue

        values = {}
        for i, cell in enumerate(cells[1:], 1):
            values[f"p{i}"] = clean_text(cell.get_text())

        stats["problems"][label] = values

    return stats


def scrape_hall_of_fame():
    """Scrape hall.aspx for global hall of fame."""
    print("Scraping hall of fame...")
    all_entries = []
    page = 0

    while True:
        path = f"hall.aspx?from={page * 100 + 1}" if page > 0 else "hall.aspx"
        html = fetch_page(path)
        if not html:
            break

        soup = BeautifulSoup(html, "html.parser")
        table = find_data_table(soup)
        if not table:
            break

        rows = table.find_all("tr")
        found_entries = False

        for row in rows:
            cells = row.find_all("td")
            if len(cells) < 3:
                continue

            contestant_cell = cells[0]
            link = contestant_cell.find("a")
            if not link:
                continue

            name = clean_text(link.get_text())
            if name == "Contestant" or not name:
                continue

            found_entries = True

            href = link.get("href", "")
            id_match = re.search(r'id=(\d+)', href)
            participant_id = int(id_match.group(1)) if id_match else None

            # Country code
            code_cell = cells[1]
            code = clean_text(code_cell.get_text())

            # Awards
            idx = 2
            gold = parse_int(cells[idx].get_text()) if idx < len(cells) else 0
            idx += 1
            silver = parse_int(cells[idx].get_text()) if idx < len(cells) else 0
            idx += 1
            bronze = parse_int(cells[idx].get_text()) if idx < len(cells) else 0
            idx += 1
            hm = parse_int(cells[idx].get_text()) if idx < len(cells) else 0
            idx += 1

            # Special prizes
            special = parse_int(cells[idx].get_text()) if idx < len(cells) else 0
            idx += 1
            # Perfect scores
            perfect = parse_int(cells[idx].get_text()) if idx < len(cells) else 0
            idx += 1
            # Participations
            participations = parse_int(cells[idx].get_text()) if idx < len(cells) else 0

            all_entries.append({
                "name": name,
                "participant_id": participant_id,
                "country_code": code,
                "gold": gold or 0,
                "silver": silver or 0,
                "bronze": bronze or 0,
                "hm": hm or 0,
                "special_prizes": special or 0,
                "perfect_scores": perfect or 0,
                "participations": participations or 0,
            })

        if not found_entries:
            break

        # Check for next page link
        next_link = soup.find("a", string=re.compile(r'Next|►'))
        if not next_link:
            break

        page += 1
        if page > 300:  # Safety limit (22000/100 = 220 pages max)
            break

    print(f"  Found {len(all_entries)} hall of fame entries")
    return all_entries


def scrape_results_matrix():
    """Scrape results.aspx for the country ranking matrix."""
    print("Scraping results matrix...")
    html = fetch_page("results.aspx")
    if not html:
        return {}

    soup = BeautifulSoup(html, "html.parser")
    table = find_data_table(soup)
    if not table:
        return {}

    rows = table.find_all("tr")
    matrix = {}

    # First row has years
    header_row = rows[0] if rows else None
    years = []
    if header_row:
        cells = header_row.find_all(["th", "td"])
        for cell in cells:
            text = cell.get_text().strip()
            yr = parse_int(text)
            if yr and 59 <= yr <= 99:
                years.append(1900 + yr)
            elif yr and 0 <= yr <= 30:
                years.append(2000 + yr)

    for row in rows[1:]:
        cells = row.find_all("td")
        if len(cells) < 3:
            continue

        # First cell is country code
        code = clean_text(cells[0].get_text())
        if not code or code == "Year":
            continue

        rankings = {}
        for i, cell in enumerate(cells[1:-1]):  # Skip first and last (both are code)
            if i < len(years):
                rank = parse_int(cell.get_text())
                if rank is not None:
                    rankings[str(years[i])] = rank

        if rankings:
            matrix[code] = rankings

    print(f"  Found rankings for {len(matrix)} countries")
    return matrix


def scrape_problems():
    """Scrape problems.aspx for problem data."""
    print("Scraping problems list...")
    html = fetch_page("problems.aspx")
    if not html:
        return []

    soup = BeautifulSoup(html, "html.parser")
    table = find_data_table(soup)
    if not table:
        return []

    rows = table.find_all("tr")
    problems = []

    for row in rows:
        cells = row.find_all("td")
        if len(cells) < 2:
            continue

        year = parse_int(cells[0].get_text())
        if not year:
            continue

        # Languages available
        languages = []
        if len(cells) > 1:
            lang_cell = cells[1]
            for link in lang_cell.find_all("a"):
                lang_name = clean_text(link.get_text())
                lang_href = link.get("href", "")
                if lang_name:
                    languages.append({"name": lang_name, "url": lang_href})

        # Download PDF
        pdf_url = ""
        if len(cells) > 2:
            pdf_link = cells[2].find("a")
            if pdf_link:
                pdf_url = pdf_link.get("href", "")

        # Shortlist
        shortlist_url = ""
        if len(cells) > 3:
            sl_link = cells[3].find("a")
            if sl_link:
                shortlist_url = sl_link.get("href", "")

        problems.append({
            "year": year,
            "languages": languages,
            "pdf_url": pdf_url,
            "shortlist_url": shortlist_url,
        })

    print(f"  Found problems for {len(problems)} years")
    return problems


def scrape_results_country():
    """Scrape results_country.aspx for cumulative country results."""
    print("Scraping cumulative results by country...")
    html = fetch_page("results_country.aspx")
    if not html:
        return []

    soup = BeautifulSoup(html, "html.parser")
    table = find_data_table(soup)
    if not table:
        return []

    rows = table.find_all("tr")
    results = []

    for row in rows:
        cells = row.find_all("td")
        if len(cells) < 5:
            continue

        code_cell = cells[0]
        code_link = code_cell.find("a")
        if not code_link:
            continue

        code = clean_text(code_link.get_text())
        if not code or len(code) > 4:
            continue

        idx = 1
        country = clean_text(cells[idx].get_text()) if idx < len(cells) else ""
        idx += 1
        first_participation = parse_int(cells[idx].get_text()) if idx < len(cells) else None
        idx += 1
        participations = parse_int(cells[idx].get_text()) if idx < len(cells) else None
        idx += 1
        contestants_all = parse_int(cells[idx].get_text()) if idx < len(cells) else None
        idx += 1
        contestants_male = parse_int(cells[idx].get_text()) if idx < len(cells) else None
        idx += 1
        contestants_female = parse_int(cells[idx].get_text()) if idx < len(cells) else None
        idx += 1
        distinct = parse_int(cells[idx].get_text()) if idx < len(cells) else None
        idx += 1
        avg_persistence = parse_float(cells[idx].get_text()) if idx < len(cells) else None
        idx += 1
        gold = parse_int(cells[idx].get_text()) if idx < len(cells) else 0
        idx += 1
        silver = parse_int(cells[idx].get_text()) if idx < len(cells) else 0
        idx += 1
        bronze = parse_int(cells[idx].get_text()) if idx < len(cells) else 0
        idx += 1
        hm = parse_int(cells[idx].get_text()) if idx < len(cells) else 0

        results.append({
            "code": code,
            "country": country,
            "first_participation": first_participation,
            "participations": participations,
            "contestants_all": contestants_all,
            "contestants_male": contestants_male,
            "contestants_female": contestants_female,
            "distinct_contestants": distinct,
            "avg_persistence": avg_persistence,
            "gold": gold,
            "silver": silver,
            "bronze": bronze,
            "hm": hm,
        })

    print(f"  Found {len(results)} countries in cumulative results")
    return results


def scrape_results_year():
    """Scrape results_year.aspx for cumulative year results."""
    print("Scraping cumulative results by year...")
    html = fetch_page("results_year.aspx")
    if not html:
        return []

    soup = BeautifulSoup(html, "html.parser")
    table = find_data_table(soup)
    if not table:
        return []

    rows = table.find_all("tr")
    results = []

    for row in rows:
        cells = row.find_all("td")
        if len(cells) < 5:
            continue

        year = parse_int(cells[0].get_text())
        if not year:
            continue

        idx = 1
        country = clean_text(cells[idx].get_text()) if idx < len(cells) else ""
        idx += 1
        num_countries = parse_int(cells[idx].get_text()) if idx < len(cells) else None
        idx += 1
        contestants_all = parse_int(cells[idx].get_text()) if idx < len(cells) else None
        idx += 1
        contestants_male = parse_int(cells[idx].get_text()) if idx < len(cells) else None
        idx += 1
        contestants_female = parse_int(cells[idx].get_text()) if idx < len(cells) else None
        idx += 1
        gold = parse_int(cells[idx].get_text()) if idx < len(cells) else 0
        idx += 1
        silver = parse_int(cells[idx].get_text()) if idx < len(cells) else 0
        idx += 1
        bronze = parse_int(cells[idx].get_text()) if idx < len(cells) else 0
        idx += 1
        hm = parse_int(cells[idx].get_text()) if idx < len(cells) else 0
        idx += 1
        max_points = parse_int(cells[idx].get_text()) if idx < len(cells) else None
        idx += 1

        # Efficiency (might be a percentage)
        efficiency = None
        if idx < len(cells):
            eff_text = cells[idx].get_text().strip()
            if '%' in eff_text:
                efficiency = parse_float(eff_text)
            else:
                efficiency = parse_float(eff_text)
        idx += 1

        # Cutoffs
        gold_cutoff = parse_int(cells[idx].get_text()) if idx < len(cells) else None
        idx += 1
        silver_cutoff = parse_int(cells[idx].get_text()) if idx < len(cells) else None
        idx += 1
        bronze_cutoff = parse_int(cells[idx].get_text()) if idx < len(cells) else None

        results.append({
            "year": year,
            "host_country": country,
            "num_countries": num_countries,
            "contestants_all": contestants_all,
            "contestants_male": contestants_male,
            "contestants_female": contestants_female,
            "gold": gold,
            "silver": silver,
            "bronze": bronze,
            "hm": hm,
            "max_points": max_points,
            "efficiency": efficiency,
            "gold_cutoff": gold_cutoff,
            "silver_cutoff": silver_cutoff,
            "bronze_cutoff": bronze_cutoff,
        })

    print(f"  Found {len(results)} years in cumulative results")
    return results


def save_json(data, filename):
    """Save data as JSON file."""
    filepath = DATA_DIR / filename
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  Saved {filepath}")


def main():
    print("=" * 60)
    print("IMO Data Scraper")
    print("=" * 60)

    # Stage 1: Scrape index pages
    timeline = scrape_timeline()
    save_json(timeline, "timeline.json")

    countries = scrape_countries()
    save_json(countries, "countries.json")

    # Stage 2: Scrape results pages
    results_matrix = scrape_results_matrix()
    save_json(results_matrix, "results_matrix.json")

    results_country = scrape_results_country()
    save_json(results_country, "results_country.json")

    results_year = scrape_results_year()
    save_json(results_year, "results_year.json")

    # Stage 3: Scrape per-year data
    years_with_results = [t["year"] for t in timeline if t.get("contestants_all")]
    if not years_with_results:
        # Fallback: use known range
        years_with_results = [y for y in range(1959, 2026) if y != 1980]

    all_country_results = {}
    all_individual_results = {}
    all_year_info = {}
    all_year_stats = {}
    participant_index = {}  # id -> {name, country_code, ...}

    for year in years_with_results:
        print(f"\nScraping year {year}...")

        # Country results
        cr = scrape_year_country_results(year)
        if cr:
            all_country_results[str(year)] = cr
            print(f"  Country results: {len(cr)} countries")

        # Individual results
        ir = scrape_year_individual_results(year)
        if ir:
            all_individual_results[str(year)] = ir
            print(f"  Individual results: {len(ir)} contestants")

            # Build participant index
            for entry in ir:
                pid = entry.get("participant_id")
                if pid:
                    if pid not in participant_index:
                        participant_index[pid] = {
                            "id": pid,
                            "name": entry["name"],
                            "results": [],
                        }
                    participant_index[pid]["results"].append({
                        "year": year,
                        "country": entry["country"],
                        "country_code": entry.get("country_code", ""),
                        "p1": entry["p1"],
                        "p2": entry["p2"],
                        "p3": entry["p3"],
                        "p4": entry["p4"],
                        "p5": entry["p5"],
                        "p6": entry["p6"],
                        "p7": entry.get("p7"),
                        "total": entry["total"],
                        "rank": entry["rank"],
                        "award": entry["award"],
                    })

        # Year info
        yi = scrape_year_info(year)
        if yi:
            all_year_info[str(year)] = yi

        # Year statistics
        ys = scrape_year_statistics(year)
        if ys:
            all_year_stats[str(year)] = ys

    # Save per-year data
    save_json(all_country_results, "country_results_by_year.json")
    save_json(all_individual_results, "individual_results_by_year.json")
    save_json(all_year_info, "year_info.json")
    save_json(all_year_stats, "year_statistics.json")

    # Save participant index
    save_json(participant_index, "participants.json")
    print(f"\nParticipant index: {len(participant_index)} unique participants")

    # Stage 4: Hall of fame
    hall = scrape_hall_of_fame()
    save_json(hall, "hall_of_fame.json")

    # Stage 5: Problems
    problems = scrape_problems()
    save_json(problems, "problems.json")

    print("\n" + "=" * 60)
    print("Scraping complete!")
    print(f"Data saved to {DATA_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
