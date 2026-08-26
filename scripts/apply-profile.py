#!/usr/bin/env python3
"""
Apply the account-level metadata that the profile README cannot set itself.

Everything generated on this profile lives in assets/ and is rebuilt by
scripts/build.mjs. The items below are account state rather than repo content,
so they sit outside that pipeline and have to be pushed through the API: the
bio, the location, and the description on every public repository.

Pinned repositories are deliberately absent. GitHub exposes pinnedItems as a
read-only field and ships no mutation for setting it, so pinning is a web UI
action that cannot be automated. Nothing here touches pins.

Usage:
    export GITHUB_TOKEN=ghp_xxxx        # classic PAT, scopes: public_repo, user
    python scripts/apply-profile.py                # apply
    python scripts/apply-profile.py --dry-run      # print the plan, change nothing
"""
import json
import os
import sys
import urllib.error
import urllib.request

USER = "ahmed-rehman-khan"
API = "https://api.github.com"

# ---- what gets written ------------------------------------------------------
# The bio does not repeat the location, because location is its own field below
# and duplicating it wastes characters in the one line that follows the account
# around GitHub. The hard cap is 160.
BIO = (
    "Full-stack, app and AI developer. I build AI systems end to end, "
    "from the database schema to the kill switch."
)
LOCATION = "Karachi, Pakistan"

# One line per public repository, each under 110 characters so none is truncated
# inside a pinned card, which is the narrowest place a description renders.
DESCRIPTIONS = {
    "V.O.I.C.E": "Desktop agent that reads the screen through a numbered coordinate grid and acts on what it sees.",
    "switchFYP": "IoT energy system that reconstructs per-appliance current and voltage waveforms from one sensor point.",
    "vantage-OTA": "ESP32-S3 firmware and over-the-air update channel for Vantage Hub.",
    "LogicLoom": "Chat platform with an input guardian for jailbreaks and an output guardian for prompt leaks.",
    "ISS-Overhead": "Tracks the ISS every five seconds and emails you on a double opt-in when it passes overhead.",
    "Due-Desk": "Deadline tracker with automated reminders and recurring assignments.",
    "Smart-Agent": "Token-streaming AI assistant with a persistent conversation store.",
    "BuildMyWeek": "Drag-and-drop weekly timetable planner, written without a framework.",
    "Space-Invaders": "Java arcade game for a data structures lab, built on a queue, ArrayList and Graphics2D.",
    "Brick-Breaker": "Java game for an OOP lab, deliberately over-decomposed to practise class design.",
    "Ticket-Traders": "CLI ticket booking system in C, with manual memory management.",
    "ahmed-rehman-khan": "My profile README. Every panel is an SVG regenerated daily from the GitHub API by an Action in this repo.",
}

# BuildMyWeek advertises build-my-week.vercel.app in its homepage field, which
# returns 404. The alias the README links is live, so the field is corrected to
# the one that actually resolves.
HOMEPAGES = {
    "BuildMyWeek": "https://buildmyweek.vercel.app",
}

DRY = "--dry-run" in sys.argv
TOKEN = ""


def call(method, path, body=None):
    """One request. Returns (status, parsed body or None, response headers)."""
    url = path if path.startswith("http") else API + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", "Bearer " + TOKEN)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    req.add_header("User-Agent", USER + "-profile-script")
    if data:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=45) as r:
            raw = r.read()
            return r.status, (json.loads(raw) if raw else None), dict(r.headers)
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            parsed = json.loads(raw)
        except Exception:
            parsed = {"message": raw.decode(errors="replace")[:300]}
        return e.code, parsed, dict(e.headers)
    except Exception as e:
        return 0, {"message": str(e)}, {}


def check_scopes(headers):
    """Report on token scopes. A scope problem should surface once, here, rather
    than as twelve identical 403s further down."""
    raw = headers.get("X-OAuth-Scopes", "")
    scopes = [s.strip() for s in raw.split(",") if s.strip()]
    if not scopes:
        print("Token scopes: none reported, so this is a fine-grained token.")
        print("              Repo edits should work. The bio and location call")
        print("              may be rejected; if it is, use a classic token.")
        return 0
    print("Token scopes: " + ", ".join(scopes))
    missing = []
    if "user" not in scopes and "user:email" not in scopes:
        missing.append("user (needed for bio and location)")
    if "repo" not in scopes and "public_repo" not in scopes:
        missing.append("public_repo (needed for repo descriptions)")
    if missing:
        for m in missing:
            print("WARN  token appears to be missing scope: " + m)
        return len(missing)
    return 0


def main():
    ok = skip = fail = 0

    status, me, headers = call("GET", "/user")
    if status != 200:
        print("FAIL  token rejected (" + str(status) + "): " + str(me.get("message")))
        return 1
    if str(me.get("login", "")).lower() != USER.lower():
        print("FAIL  token belongs to " + str(me.get("login")) + ", expected " + USER)
        print("      refusing to write to an account this script was not written for")
        return 1

    print("Authenticated as " + me["login"])
    warn = check_scopes(headers)
    print("Mode: " + ("DRY RUN, nothing will be changed" if DRY else "APPLY"))
    print("-" * 76)

    # ---- bio and location ---------------------------------------------------
    want = {}
    if me.get("bio") != BIO:
        want["bio"] = BIO
    if me.get("location") != LOCATION:
        want["location"] = LOCATION

    if not want:
        print("SKIP  profile: bio and location already correct")
        skip += 1
    elif DRY:
        for key, value in want.items():
            print("PLAN  profile: " + key + " -> " + value)
    else:
        st, res, _ = call("PATCH", "/user", want)
        if st == 200:
            print("OK    profile: updated " + " and ".join(sorted(want)))
            ok += 1
        else:
            print("FAIL  profile: " + str(st) + " " + str(res.get("message")))
            print("      this call is the one that needs the user scope")
            fail += 1

    # ---- descriptions, plus the single homepage correction ------------------
    print("-" * 76)
    for name in sorted(DESCRIPTIONS, key=str.lower):
        st, repo, _ = call("GET", "/repos/" + USER + "/" + name)
        if st != 200:
            print("FAIL  " + name + ": cannot read repo (" + str(st) + ")")
            fail += 1
            continue

        # Only the fields that actually differ are sent. A PATCH carrying just
        # these keys leaves every other repo setting untouched.
        payload = {}
        if repo.get("description") != DESCRIPTIONS[name]:
            payload["description"] = DESCRIPTIONS[name]
        if name in HOMEPAGES and repo.get("homepage") != HOMEPAGES[name]:
            payload["homepage"] = HOMEPAGES[name]

        if not payload:
            print("SKIP  " + name + ": already correct")
            skip += 1
            continue
        if DRY:
            print("PLAN  " + name + ": set " + ", ".join(sorted(payload)))
            continue

        st, res, _ = call("PATCH", "/repos/" + USER + "/" + name, payload)
        if st == 200:
            print("OK    " + name + ": set " + ", ".join(sorted(payload)))
            ok += 1
        else:
            print("FAIL  " + name + ": " + str(st) + " " + str(res.get("message")))
            fail += 1

    print("-" * 76)
    if DRY:
        print("Dry run finished. Nothing changed. Re-run without --dry-run to apply.")
        return 0

    print(
        "Applied " + str(ok)
        + " | already correct " + str(skip)
        + " | warnings " + str(warn)
        + " | failed " + str(fail)
    )
    print("")
    print("One step is still manual, because GitHub ships no API for it:")
    print("  Pin V.O.I.C.E. Open your profile, click Customize your pins, tick")
    print("  V.O.I.C.E alongside the five already selected, and save. Five of the")
    print("  six slots are in use, so this is an addition and nothing is displaced.")
    return 1 if fail else 0


if __name__ == "__main__":
    TOKEN = os.environ.get("GITHUB_TOKEN", "").strip()
    if not TOKEN:
        print("GITHUB_TOKEN is not set.")
        print("")
        print("Create a classic token: https://github.com/settings/tokens/new")
        print("Tick two scopes: public_repo and user")
        print("")
        print("  Git Bash:    export GITHUB_TOKEN=ghp_xxxx")
        print("  PowerShell:  $env:GITHUB_TOKEN = 'ghp_xxxx'")
        print("")
        print("Then re-run. Use --dry-run first if you want to see the plan.")
        sys.exit(1)
    sys.exit(main())
