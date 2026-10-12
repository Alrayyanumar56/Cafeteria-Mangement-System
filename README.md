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

## Second screen for the kitchen
- Easiest: plug a second monitor/TV into the same PC and keep the Kitchen page open on it. No network needed.
- Or run `start-lan.bat` instead of `start.bat`. The black window prints an address like
  `http://192.168.1.20:3000/pages/kitchen.html` to open on a tablet or second PC on the same Wi-Fi.
  There is no login yet, so anyone on that network could open the app. Use it only on a network you trust.

## Backups
`backend/data/backups/` gets one copy per day (last 14 kept). They sit on the same disk, so copy the `backend/data`
folder to a USB stick now and then.

## Not done yet
Login and roles (manager vs counter). Needs Windows 10 or later (Node 22.13+).


## Login and roles
- First run: the login page asks you to create the manager (name + 6 to 10 digit PIN). This can only happen once.
- Staff log in by tapping their name and typing a PIN (counter: 4 to 6 digits, manager: 6 to 10 digits). Sessions last 12 hours. 5 wrong PINs lock that person for 2 minutes.
- Manager: everything, plus the Staff page (add people, change PINs, turn accounts off).
- Counter: Billing, Kitchen and Orders only. The server refuses menu, category, inventory, report and staff actions from a counter, even if someone tries the URLs by hand.
- Each sale remembers who rang it up (shown on the Orders page).
- PINs are stored as salted scrypt hashes. If the manager PIN is forgotten, delete `backend/data/cafepos.db` only if you accept losing all data, or ask the developer to reset it.
