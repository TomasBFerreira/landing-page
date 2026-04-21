#!/usr/bin/env python3
"""
LP-F4 Phase 2 seeder.

Creates the landing-page content collections in Directus + seeds them with
the copy currently hard-coded in the Angular components, and opens
read-only access on them for the public (unauth) role so the browser can
fetch without a token.

Idempotent:
- Collection exists?   Skip create.
- Field exists?        Skip create.
- Collection empty?    Seed items. Non-empty? Leave alone.
- Public role has read on the collection? Skip.

Env:
  CMS_URL        base URL (default https://cms.databaes.net)
  CMS_EMAIL      admin email
  CMS_PASSWORD   admin password

Usage:
  CMS_EMAIL=... CMS_PASSWORD=... ./seed.py
"""
import json
import os
import sys
import urllib.request
import urllib.error

CMS = os.environ.get("CMS_URL", "https://cms.databaes.net").rstrip("/")
EMAIL = os.environ["CMS_EMAIL"]
PASSWORD = os.environ["CMS_PASSWORD"]
HERE = os.path.dirname(os.path.abspath(__file__))


def req(method: str, path: str, token: str | None = None, body=None):
    url = f"{CMS}{path}"
    data = json.dumps(body).encode() if body is not None else None
    headers = {
        "Content-Type": "application/json",
        # CF bot-fight rejects Python's default user-agent (1010).
        "User-Agent": "databaes-landing-seed/1.0",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=20) as resp:
            raw = resp.read().decode()
            return resp.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            body = json.loads(raw)
        except json.JSONDecodeError:
            body = {"raw": raw}
        return e.code, body


def login() -> str:
    status, body = req("POST", "/auth/login", body={"email": EMAIL, "password": PASSWORD})
    if status != 200:
        sys.exit(f"login failed (HTTP {status}): {body}")
    return body["data"]["access_token"]


def ensure_collection(token: str, c: dict) -> bool:
    """Return True if created, False if already existed.

    Directus v11 returns 403 for GET /collections/{name} when the collection
    doesn't exist (even as admin). So we try POST first and treat the
    duplicate-name error as a no-op.
    """
    name = c["collection"]
    status, body = req("POST", "/collections", token, body=c)
    if status in (200, 201):
        print(f"  collection {name}: created")
        return True
    # Directus v11 returns 400 INVALID_PAYLOAD with "already exists" in the
    # message when the collection is present. Match on that wording — the
    # extensions.code for duplicates isn't RECORD_NOT_UNIQUE at the
    # /collections endpoint.
    errs = (body or {}).get("errors") or []
    already = any("already exists" in (e.get("message") or "") for e in errs)
    if status == 400 and already:
        print(f"  collection {name}: exists")
        return False
    sys.exit(f"  collection {name}: create failed (HTTP {status}): {body}")


def ensure_items(token: str, collection: str, items, singleton: bool):
    """Seed items if the collection is empty."""
    if singleton:
        status, body = req("GET", f"/items/{collection}", token)
        # For a brand-new singleton Directus returns {"data":{"id":null}};
        # consider "has more than just id, or id is non-null" as populated.
        data = (body or {}).get("data") or {}
        populated = any(v not in (None, "", []) for k, v in data.items() if k != "id")
        if status == 200 and populated:
            print(f"  items/{collection}: already populated (singleton)")
            return
        status, body = req("PATCH", f"/items/{collection}", token, body=items)
        if status not in (200, 201):
            sys.exit(f"  items/{collection}: singleton seed failed (HTTP {status}): {body}")
        print(f"  items/{collection}: seeded singleton")
        return

    status, body = req("GET", f"/items/{collection}?limit=1", token)
    if status == 200 and body and body.get("data"):
        print(f"  items/{collection}: already populated (rows present)")
        return
    for it in items:
        s, b = req("POST", f"/items/{collection}", token, body=it)
        if s not in (200, 201):
            sys.exit(f"  items/{collection}: create row failed (HTTP {s}): {b}")
    print(f"  items/{collection}: seeded {len(items)} rows")


def get_public_policy_id(token: str) -> str:
    """Directus v11: anonymous traffic is governed by a policy named
    '$t:public_label' (the translation key, not a display string). Admin
    policy is the other one. Return the non-Administrator policy's id.
    """
    status, body = req("GET", "/policies", token)
    if status != 200:
        sys.exit(f"  policies: lookup failed (HTTP {status}): {body}")
    rows = (body or {}).get("data", [])
    for p in rows:
        if p.get("name") != "Administrator":
            return p["id"]
    sys.exit("  policies: no non-Administrator policy found")


def ensure_public_read(token: str, policy_id: str, collection: str):
    """Idempotent: attach a read permission on {collection} to the public
    policy if none exists yet. Fields='*' allows reading every column."""
    q = f"/permissions?filter[policy][_eq]={policy_id}&filter[collection][_eq]={collection}&filter[action][_eq]=read"
    status, body = req("GET", q, token)
    if status == 200 and body and body.get("data"):
        print(f"  perms/{collection}: public read already allowed")
        return
    status, body = req(
        "POST", "/permissions", token,
        body={
            "policy":     policy_id,
            "collection": collection,
            "action":     "read",
            "fields":     ["*"],
        },
    )
    if status not in (200, 201):
        sys.exit(f"  perms/{collection}: create failed (HTTP {status}): {body}")
    print(f"  perms/{collection}: public read granted")


def main():
    with open(os.path.join(HERE, "schema.json")) as f:
        schema = json.load(f)
    with open(os.path.join(HERE, "seed-items.json")) as f:
        seeds = json.load(f)

    token = login()
    print(f"Logged into {CMS} as {EMAIL}")

    print("\n== Collections ==")
    singletons = {}
    for c in schema["collections"]:
        is_singleton = bool(c.get("meta", {}).get("singleton"))
        singletons[c["collection"]] = is_singleton
        ensure_collection(token, c)

    print("\n== Items ==")
    for name, data in seeds.items():
        if name.startswith("_"):
            continue
        ensure_items(token, name, data, singleton=singletons.get(name, False))

    print("\n== Public permissions ==")
    policy_id = get_public_policy_id(token)
    for name in singletons:
        ensure_public_read(token, policy_id, name)

    print("\nDone.")


if __name__ == "__main__":
    main()
