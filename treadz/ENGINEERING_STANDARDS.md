# Treadz Engineering Standards & "High Level Thinking"

To maintain the high level of quality established in the Towing module, all future development in the `treadz` repository should adhere to the following principles.

## 1. The "Waterfall" Strategy (Local First, Then Global)
**Concept:** When searching or querying data, always prioritize the most relevant local context before expanding scope.
**Application:**
- **Search:** Check local 50km radius first. If < 2 results, auto-expand to 500 miles.
- **Data Lookup:** Check local browser cache/history first, then fetch from API.
- **Customer Lookup:** Search recent active customers first, then full database.

## 2. Single Source of Truth (Config Management)
**Concept:** Never hardcode business logic values (Tax Rates, Fees, Shop Address) in individual files.
**Application:**
- All constants must live in `js/treadz-core.js` (or similar shared file).
- **Bad:** `const TAX_RATE = 0.0975;` in 5 different HTML files.
- **Good:** `TreadzConfig.TAX_RATE` imported from a shared script.

## 3. Resilience & Self-Healing
**Concept:** The app should handle failures gracefully without stopping the user.
**Application:**
- **Geocoding:** If the API fails, allow manual entry.
- **Storage:** If `localStorage` is full, handle the error and warn the user instead of crashing.
- **Connectivity:** If offline, queue data for sync (Future).

## 4. User-Centric Defaults
**Concept:** Pre-fill fields with the most likely values to save clicks.
**Application:**
- **Towing:** Pickup defaults to empty, but Dropoff defaults to *Shop Location*.
- **Quote:** Quantity defaults to *4* (most common tire sale).
- **Map:** Center on the shop immediately, don't wait for GPS if we know where we are.

## 5. Future-Proofing
**Concept:** Write code that assumes the business will grow.
**Application:**
- Don't just look for "Mount Carmel, TN". Look for *Shop Coordinates* + Radius.
- If the shop moves, we change one config value (`SHOP_COORDS`), and the whole search logic updates automatically.

## 6. Smart History & Data Consistency (UPSERT)
**Concept:** When editing existing records, always update the ORIGINAL entry rather than creating duplicates. Preserve the unique identifier.
**Application:**
- **Quotes/Receipts:** If a user recalls a quote from history, edits it, and saves, find the original ID and update it in place.
- **Move to Top:** Updated items should move to the top of history (LRU behavior) but keep their original ID.
- **Sequential IDs:** Use a shared global counter for transaction IDs to avoid collisions and gaps. Generate IDs only when saving/finalizing to avoid wasting numbers on abandoned drafts.

---
## Implementation Roadmap
1. **Extract Config:** Move fees, tax rates, and address to `js/treadz-core.js`.
2. **Standardize Utils:** Move money formatting, date formatting, and geocoding logic to shared utils.
3. **Refactor Modules:** Update Quote, Receipt, and Towing to use these shared resources.
4. **Enforce Upsert:** Audit all save functions to ensure they check for existing IDs before creating new ones.
