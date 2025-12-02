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

# 6. Non-Functional Requirements (Detailed — IEEE-style)

This section expands each non-functional requirement with measurable constraints, verification methods, and acceptance criteria following IEEE style guidelines.

## 6.1 Performance
- Definition: The system shall provide acceptable response times under 1-second for UI actions and backend endpoints.
- Constraints: The server runs on commodity hardware with a single-node MySQL database.
- Measurable Targets:
   - Average API latency (GET/POST) under 200ms for simple reads/writes under normal load.
   - UI actions such as Add-to-Cart and Cart total update shall complete within 300ms (perceived instant) on a modern browser.
   - Checkout (POST /api/sales + inventory update) shall complete within 1.5 seconds under normal load.
- Verification Method: Automated load testing (e.g., k6, Artillery) and manual timing with network throttling.
- Acceptance Criteria: 95% of API calls meet the latency target under a simulated 100-concurrent-requests throughput.

## 6.2 Reliability
- Definition: The system should operate correctly over time, with no data loss or inconsistent state.
- Measurable Targets:
   - Transactions (sales) committed to the database shall persist with ACID guarantees.
   - Inventory updates shall be atomic with the sale operation.
- Verification Method: Integration tests that perform multi-step transactions, power-off tests, and DB transaction logs.
- Acceptance Criteria: No lost sales or mismatched inventory numbers during test transactions; rollback successfully occurs upon failure.

## 6.3 Availability & Uptime
- Definition: The system shall be available for cashier operations during business hours.
- Measurable Targets:
   - Minimum 99% uptime during business hours (7:00–19:00), excluding scheduled maintenance.
- Verification Method: Periodic synthetic checks and uptime monitoring (Prometheus / UptimeRobot).
- Acceptance Criteria: Logs indicate no more than ~7 minutes of downtime per week during monitored hours.

## 6.4 Scalability
- Definition: The system can scale to support additional terminals and increased load.
- Measurable Targets:
   - Support at least 50 concurrent terminals (clients) performing normal POS activity with acceptable performance.
- Verification Method: Load testing (k6 / Artillery) and benchmarking infrastructure.
- Acceptance Criteria: No more than a 20% performance degradation when scaling up concurrent clients to the target.

## 6.5 Security
- Definition: The system must protect data both in transit and at rest and prevent common vulnerabilities.
- Requirements:
   - Transport-level encryption: HTTPS/TLS for all API calls.
   - Authentication: Server-side user authentication and roles (admin / staff) with session or JWTs.
   - Authorization: Role-based access for sensitive endpoints (menu changes, inventory updates, report access).
   - Input validation & sanitization for all server endpoints.
   - Hash password storage using bcrypt or equivalent.
   - SQL parameterized queries / prepared statements to prevent SQL injection (mysql2 already uses placeholders).
- Verification Method: Security review, automated vulnerability scans (e.g., OWASP ZAP), and penetration testing.
- Acceptance Criteria: No critical or high OWASP vulnerabilities remain unaddressed; user passwords cannot be retrieved in plaintext.

## 6.6 Data Integrity & Consistency
- Definition: The data in MySQL must remain consistent — sales and inventory changes occur atomically.
- Measurable Targets:
   - No negative inventory quantities allowed; inventory decrements are validated at server-side.
- Verification Method: Unit and integration tests that simulate concurrent sale operations.
- Acceptance Criteria: For concurrent sales, total inventory never goes negative; conflict resolution or serializable transaction isolation ensures consistent totals.

## 6.7 Maintainability & Testability
- Definition: The system must be easy to maintain and extend; developers can test functions easily.
- Requirements:
   - Modular file structure, separation of concerns (controllers, models, routes), and unit tests for logic.
   - Continuous Integration pipelines (CI) with automated tests.
- Verification Method: Code reviews, unit test coverage metrics (target 60%+), and CI run pass rates.
- Acceptance Criteria: PRs must pass test suite and code linting before merge; documented coding style and README updates.

## 6.8 Usability & Accessibility
- Definition: The UI should be easy to learn and accessible for non-technical staff.
- Measurable Targets:
   - A new staff member should be able to perform basic POS tasks (take order, checkout, print receipt) within 5 minutes of onboarding.
   - Accessibility: Contrast ratios meet WCAG AA for primary UI elements.
- Verification Method: Usability testing sessions, observational studies, and automated accessibility checks.
- Acceptance Criteria: Task completion rates > 90% for core tasks; no WCAG AA violations found for critical components.

## 6.9 Portability & Platform Support
- Definition: The system should be deployable on typical Windows/Linux setups and accessible from modern browsers.
- Requirements:
   - Backend runs on Node.js 18+ and MySQL 8+.
   - Frontend usable on Chrome, Edge, Firefox (latest two versions) and responsive for tablets.
- Verification Method: Cross-platform smoke tests and browser compatibility checks.
- Acceptance Criteria: No critical differences in functionality across supported platforms; responsive UI scales properly on common tablet sizes.

## 6.10 Recoverability & Backup
- Definition: Protect against data loss and provide a path to restore services.
- Requirements:
   - Daily automated database backups.
   - Backup retention policy: at least 14 days.
   - Recovery test at least monthly.
- Verification Method: Scheduled backups and restore tests in a staging environment.
- Acceptance Criteria: A successful restore of database backups within a pre-defined RTO (Recovery Time Objective) of 4 hours.

## 6.11 Efficiency & Resource Usage
- Definition: The system should use resources efficiently.
- Measurable Targets:
   - CPU utilization under 70% and memory under 80% for normal loads.
- Verification Method: Monitoring during load tests and production.
- Acceptance Criteria: No single process consumes more than the threshold under normal usage.

## 6.12 Legal & Privacy
- Definition: Comply with local data protection regulations for customer data (if any payment data is stored).
- Requirements:
   - No unnecessary storage of payment card details; use tokens from payment providers if integrating online payments.
   - Protect personally identifiable information (PII) appropriately.
- Verification Method: Policy review and security audits.
- Acceptance Criteria: No storage of raw payment card numbers; PII is encrypted/hashed as required by applicable regulation.

---

# 7. Software Architecture

## 7.1 Overview — Three-Tier
- Frontend: HTML/CSS/JS/Bootstrap] <--> [Backend: Node.js / Express API] <--> [Database: MySQL
- (Detailed UML-diagrams/Flow-diagrams can be seen in the Github repository.)
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
