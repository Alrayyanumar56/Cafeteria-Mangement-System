# CafePOS (offline cafeteria POS)

Runs fully on one PC. No internet, no MySQL. Data lives in `backend/data/cafepos.db` (one file), with an automatic daily copy in `backend/data/backups/` (last 14 days).

## Run
1. Install Node.js 22.13 or newer (once). Double-click `start.bat`. First run needs internet once to install packages.
2. The browser opens http://localhost:3000. Keep the black window open while the cafeteria works.

## Pages
- Billing: tap pictures, pick Cash / Online / Split, get an order number (token). Tokens restart at 1 every day.
- Kitchen: shows paid orders for items marked "kitchen" (shawarma, rolls, shakes, plated food). Staff tap Ready, then Handed over. Open it on the kitchen PC/tablet at the counter PC's address.
- Orders: type a token to see its status.
- Menu: manager creates categories and items (with photos) and marks which items go to the kitchen.
- Inventory, Reports: as before; reports show the last 90 days unless dates are chosen.

## Dev
`cd backend && npm install && npm test`. All database code is in `backend/db.js` plus SQL in the controllers.
Not built yet: login and roles (manager vs counter).
