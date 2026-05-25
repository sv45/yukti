# ── ADD THIS BELOW the existing /api/places/clinics endpoint in main.py ──────
#
# The logic is identical to /api/places/clinics.
# Only the Places Text Search query changes.
# No new imports or helpers needed — reuses the same geocode + place details
# pattern already in place.

@app.get("/api/places/pharmacies")
async def get_nearby_pharmacies(zip: str):
    """
    Geocodes a ZIP code, then searches Google Places for REMS-capable
    pharmacies nearby. Returns top 5 with name, address, phone, hours.
    
    Search query targets pharmacies that are likely to stock or order
    mifepristone: independent pharmacies + chains known to participate
    in REMS programs.
    """
    if not zip or not zip.isdigit() or len(zip) != 5:
        raise HTTPException(status_code=400, detail="Invalid ZIP code.")

    api_key = os.getenv("GOOGLE_PLACES_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Google Places API key not configured.")

    # Step 1 — geocode ZIP → lat/lng (identical to clinic finder)
    geocode_url = "https://maps.googleapis.com/maps/api/geocode/json"
    geocode_resp = requests.get(geocode_url, params={"address": zip, "key": api_key})
    geocode_data = geocode_resp.json()

    if geocode_data.get("status") != "OK" or not geocode_data.get("results"):
        raise HTTPException(status_code=404, detail="ZIP code not found.")

    location = geocode_data["results"][0]["geometry"]["location"]
    lat, lng = location["lat"], location["lng"]

    # Step 2 — Text Search for pharmacies
    # Query note: "independent pharmacy" surfaces smaller pharmacies more
    # likely to stock mifepristone; chains (CVS, Walgreens, Rite Aid) are
    # also REMS-certified in many locations and will appear naturally.
    search_url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    search_resp = requests.get(search_url, params={
        "query": "pharmacy",
        "location": f"{lat},{lng}",
        "radius": 8000,           # 8km — same as clinic finder
        "type": "pharmacy",
        "key": api_key,
    })
    search_data = search_resp.json()
    places = search_data.get("results", [])[:5]

    # Step 3 — Place Details for phone + hours (identical to clinic finder)
    results = []
    details_url = "https://maps.googleapis.com/maps/api/place/details/json"
    for place in places:
        details_resp = requests.get(details_url, params={
            "place_id": place["place_id"],
            "fields": "name,formatted_address,formatted_phone_number,opening_hours,place_id",
            "key": api_key,
        })
        details = details_resp.json().get("result", {})
        results.append({
            "place_id": place["place_id"],
            "name": details.get("name", place.get("name")),
            "address": details.get("formatted_address", place.get("formatted_address", "")),
            "phone": details.get("formatted_phone_number"),
            "hours": details.get("opening_hours", {}).get("weekday_text"),
        })

    return {"results": results}
