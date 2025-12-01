# Cafeteria Management System (CafePOS) — Detailed Project Report 

---

# 1. Introduction
The **Cafeteria Management System (CafePOS)** is a web-based application that automates daily cafeteria operations: menu management, order-taking, billing, inventory entry, and reporting.  
The provided codebase contains a multi-page front-end (index, billing, addMenu, inventory, report) built with HTML/CSS/Bootstrap and JavaScript. The project follows a **three-layer architecture** (Frontend → Backend → MySQL Database) and development uses an **Agile (Scrum)** process.

This report documents market context, purpose, requirements, architecture, detailed design (DB, UI, APIs), testing strategy, and other essential artifacts (diagrams, tables, and recommendations) for the project.

---

# 2. Market Survey / Gap Analysis

## 2.1 Market Summary
- Many small cafeterias use manual registers or spreadsheets; some use expensive POS systems.
- Existing commercial POS solutions are feature-rich but **costly**, often overkill for small cafes.
- Local vendors often use basic, non-integrated solutions that lack inventory linkage and reporting.

## 2.2 Key Competitors / Alternatives
- Cloud POS providers (e.g., Square, Toast): full-featured, paid subscriptions.
- Desktop POS applications: cheaper but less flexible, often require installation & maintenance.
- Manual systems: zero cost but error-prone and inefficient.

## 2.3 Gaps Identified (Opportunity)
1. **Affordability** — low-cost or one-time payment local system needed.  
2. **Simplicity** — non-technical staff require an intuitive interface.  
3. **Offline/Local-first Operation** — cafeterias often need local operations without internet dependency.  
4. **Inventory + Billing Integration** — many low-cost solutions separate inventory from billing.  
5. **Reporting & Analytics** — built-in daily/monthly summaries missing.  

## 2.4 How CafePOS Meets Gaps
- Lightweight UI, local-first approach (local storage / local DB), simple screens for Add Menu, Billing, Inventory, and Reports.
- Modular design allows adding online payments and analytics later.

---

# 3. Purpose
To replace manual, error-prone cafeteria workflows with an easy-to-use digital system that:
- Speeds up order-taking and billing.
- Centralizes menu management.
- Tracks inventory and reduces stockouts.
- Produces sales reports for managers.
- Supports later expansion (mobile app, online ordering).

---

# 4. Problem Statement
Manual processes in cafeterias cause:
- Slow service and long queues.
- Mistakes in orders and billing.
- No centralized transaction records.
- Poor stock visibility and waste.
- Time-consuming report generation.

**Goal:** Implement a maintainable, extendable system to automate/digitilize menu, order, billing, inventory, and reporting with a clean UI for non-technical staff.

---

# 5. Functional Requirements

## 5.1 
- **Admin** — manages menu, views reports, manages inventory.
- **Staff/Cashier** — takes orders, generates bills, receives payments.

## 5.2 Primary Functionalities 
1. **Navigation / Dashboard (index.html)**  
   - Central landing page linking to Billing, Menu, Inventory, Reports.

2. **Billing**  
   - Show menu items (populated by JS).  
   - Search & filter categories.  
   - Add items to cart, edit quantities.  
   - Cash/Online payment inputs, balance calculation.  
   - Checkout / Hold order functionality.  
   - Add custom items (modal) for ad-hoc entries.

3. **Add Menu**  
   - Form to add a menu item (name, category, price, image).  
   - List of current menu items with clear/ delete features.  
   - Statistics (counts by category).

4. **Inventory**  
   - Add/update stock items (ID, name, category, price, quantity, unit).  
   - Search & table view of inventory.  
   - Modal for add/update.

5. **Reports**  
   - Date range filters, payment method filter.  
   - Stat cards (Total Cash, Total Online, Total Amount, Total Orders).  
   - Charts (daily sales, payment method, top items).  
   - Detailed sales records and export functionality.

6. **Shared UI behavior**  
   - Highlights the active nav link across pages.

## 5.3 Secondary Functions
- Search, category filtering, responsive layout, modal dialogs for forms, export reports, and small utilities (refresh).

---

# 6. Non-Functional Requirements

- **Performance:** UI actions (add to cart, totals) respond within 1–2 seconds.
- **Usability:** Intuitive Bootstrap-based interface; minimal steps for checkout.
- **Security:** Server-side auth (to be implemented); sanitize inputs; hashed passwords.
- **Reliability:** Persist orders in MySQL to prevent data loss.
- **Maintainability:** Modular JS files and separated backend enable easier maintenance.
- **Scalability:** MySQL + Node.js backend can support adding more terminals or users.

---

# 7. Software Architecture

## 7.1 Overview — Three-Tier
- Frontend: HTML/CSS/JS/Bootstrap] <--> [Backend: Node.js / Express API] <--> [Database: MySQL

## 7.2 Components
- **Frontend**: Static pages + JS (index, billing, addMenu, inventory, report). Handles UI & calls APIs.
- **Backend**: REST API (Node.js/Express) — handles CRUD, orders, reports, auth.
- **Database**: MySQL for persistent storage.


---

# 8. Detail Design

## 8.1 File-to-Feature Mapping
| File            | Role / Feature                             |
|-----------------|--------------------------------------------|
| index.html      | Dashboard — navigation to pages            |
| billing.html    | Billing UI — product grid, cart, checkout  |
| addMenu.html    | Add/Edit menu items, view current items    |
| inventory.html  | Inventory CRUD and listing                 |
| report.html     | Sales reports & charts                     |
| navbarActive.js | Highlights active nav links                | 
| billing.js      | Client-side billing logic                  |
| addMenu.js      | Menu manipulation + storage                |
| inventory.js    | Inventory functions                        |
| report.js       | Data visualization & export                |

## 8.2 Database Schema (MySQL) — recommended

### menu_items
CREATE TABLE menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  image_url VARCHAR(512),
  available BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
### inventory
CREATE TABLE inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  price DECIMAL(10,2),
  quantity DECIMAL(10,2),
  unit VARCHAR(20),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
### orders
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_type VARCHAR(50), -- dinein, takeaway
  total DECIMAL(10,2),
  cash_amount DECIMAL(10,2),
  online_amount DECIMAL(10,2),
  created_by INT, -- user id
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

## 8.4 UI Flows (Checkout)

- Staff selects items → add to cart.
- Staff fills cash/online fields → balance computed.
- On Checkout, frontend validates and sends POST /api/orders.
- Backend writes orders, order_details, payments, and updates inventory.
- Backend returns order confirmation and printable receipt.

---

# 9. Software Testing

## 9.1 Testing Strategy

- Unit Tests for calculation and data logic (totals, taxes, discounts).
- Integration Tests for API endpoints (order creation and inventory updates).
- System Tests for end-to-end user flows (add menu → order → report).
- User Acceptance Tests with cafeteria staff to ensure usability.
- Performance Tests for page response times and chart rendering.
- Security Tests for authentication, input validation, and SQL injection prevention.

## 9.2 Example Test Cases
| ID    | Test Case     | Steps                        | Expected Result                          |
| ----- | ------------- | ---------------------------- | ---------------------------------------- |
| TC-01 | Add Menu Item | Fill add menu form, submit   | Item appears in menu list                |
| TC-02 | Create Order  | Add items to cart & Checkout | Order saved, inventory decremented       |
| TC-03 | Custom Item   | Add via custom item modal    | Item present in cart for that order only |
| TC-04 | Payment Split | Enter cash & online amounts  | Balance equals total - (cash+online)     |
| TC-05 | Report Filter | Apply date filters           | Charts & lists reflect selected range    |
| TC-06 | Active Nav    | Open page                    | Correct nav item has `.active` class     |

# 10. Conclusion

CafePOS is a practical, extendable cafeteria solution tailored to small and medium cafeterias. The front-end demonstrates key workflows; to be production-ready, implement a secure Node.js backend, persistent MySQL storage, authentication & authorization, backup strategy, and deploy to a reliable hosting environment.
