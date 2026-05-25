# 0 6 * * * python server/scripts/update_abortion_status.py

import json
import logging
import os
from datetime import datetime, timezone, date

try:
    import httpx
except ImportError:
    raise SystemExit("httpx is required: pip install httpx")

GUTTMACHER_PAGES = [
    "https://www.guttmacher.org/state-policy/explore/abortion-bans-and-restrictions-term",
    "https://www.guttmacher.org/state-policy/explore/counseling-and-waiting-periods-abortion",
]

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_FILE = os.path.join(BASE_DIR, "data", "abortion_legal_status.json")
LOG_FILE = os.path.join(BASE_DIR, "logs", "abortion_status_updates.log")

os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)

logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)

now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
logging.info(f"--- Run started {now_str} ---")

# Load last_verified from the data file (earliest date across all states)
earliest_verified = None
try:
    with open(DATA_FILE, "r") as f:
        data = json.load(f)
    dates = [
        date.fromisoformat(s["last_verified"])
        for s in data.get("states", {}).values()
        if s.get("last_verified")
    ]
    if dates:
        earliest_verified = min(dates)
        logging.info(f"Earliest last_verified in data: {earliest_verified.isoformat()}")
except Exception as exc:
    logging.error(f"Could not read data file: {exc}")

for url in GUTTMACHER_PAGES:
    try:
        resp = httpx.get(url, timeout=15, follow_redirects=True)
        last_modified_raw = resp.headers.get("last-modified", "not provided")
        logging.info(
            f"url={url} | status={resp.status_code} | last-modified={last_modified_raw}"
        )

        # Parse last-modified and compare to earliest_verified
        if earliest_verified and last_modified_raw != "not provided":
            try:
                from email.utils import parsedate_to_datetime
                lm_dt = parsedate_to_datetime(last_modified_raw)
                lm_date = lm_dt.date()
                if lm_date > earliest_verified:
                    logging.warning(
                        f"ALERT: Page last-modified ({lm_date}) is newer than "
                        f"data last_verified ({earliest_verified}) — manual review required | url={url}"
                    )
            except Exception:
                logging.warning(f"Could not parse last-modified header: {last_modified_raw}")

    except Exception as exc:
        logging.error(f"Failed to fetch {url}: {exc}")

# NOTE: This script never auto-updates abortion_legal_status.json.
# After reviewing the pages above, manually update each state's fields and
# set last_verified to the review date (YYYY-MM-DD) before deploying.
logging.info(f"--- Run complete {now_str} — human review required before updating data file ---")
