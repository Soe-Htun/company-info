# Employee Info Platform

React + Tailwind front-end talking to an Express + MySQL API that keeps your employee directory searchable, filterable, and exportable. A lightweight authentication layer gates access via admin accounts stored in MySQL (seeded demo credentials `99admin` / `StrongPassword`).

## Project Structure

```
employee-info/
├── backend/   # Express API, authentication, MySQL queries
└── frontend/  # Vite + React dashboard styled with Tailwind CSS
```

## Prerequisites

- Node.js 18+
- MySQL 8 (or compatible)

## 1. Configure Environment Variables

```bash
cd backend
cp .env.example .env         # edit with your DB credentials

cd ../frontend
cp .env.example .env         # update VITE_API_URL if needed
```

Key `.env` values:

- `CLIENT_ORIGIN` – set to `*` (default) to allow any origin while developing, or provide a comma-separated allow-list.
- `DB_PASSWORD` – seeded to `StrongPass123` per request; make sure the MySQL user you connect with uses this password.
- `JWT_SECRET` – change in production.

## 2. Provision the Database

1. Start MySQL/MariaDB locally (or in Docker) and ensure you can connect as a privileged user.
2. Create the database, an app-specific user, and seed demo employees plus at least one login account:
   ```bash
   mysql -u root -p <<'SQL'
   CREATE DATABASE IF NOT EXISTS employee_info;
   CREATE USER IF NOT EXISTS 'employee_admin'@'%' IDENTIFIED BY 'StrongPass123';
   CREATE USER IF NOT EXISTS 'employee_admin'@'localhost' IDENTIFIED BY 'StrongPass123';
   GRANT ALL PRIVILEGES ON employee_info.* TO 'employee_admin'@'%';
   GRANT ALL PRIVILEGES ON employee_info.* TO 'employee_admin'@'localhost';
   FLUSH PRIVILEGES;
   SQL

   mysql -u employee_admin -pStrongPass123 employee_info < backend/sql/schema.sql
   ```
   That script now creates both `employees` and `users` (with the default `99admin` / `StrongPassword` account).
   If you provisioned an earlier version of the schema, bring it up to date with:
   ```sql
   -- clean up legacy statuses before tightening the enum
   UPDATE employees SET status = 'On Leave' WHERE status NOT IN ('Active','On Leave');
   ALTER TABLE employees DROP COLUMN email;
   ALTER TABLE employees MODIFY status ENUM('Active','On Leave') DEFAULT 'Active';
   -- drop unwanted departments
   DELETE FROM employees WHERE department IN ('Networking','Architecture');
   ```
3. Verify that the `employees` and `users` tables contain data. Generate hashes for new passwords with `node -e "console.log(require('bcryptjs').hashSync('MyPassword', 10))"`. Once logged in, you can also add accounts from the new “User Accounts” tab in the dashboard.

## 3. Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

## 4. Run the Stack

Start the API (port 5000 by default):

```bash
cd backend
npm run dev
```

Launch the React dashboard (port 5173):

```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173`, log in with the demo credentials you inserted into `users`, and explore the dashboard. Use the “User Accounts” toggle to add more logins without touching SQL.

## Available API Routes

- `POST /api/auth/login` – returns a JWT when the supplied credentials match a user stored in the `users` table (bcrypt hashed passwords).
- `GET /api/users` – list existing login accounts (admin only).
- `POST /api/users` – create a new login (admin only, hashes passwords automatically).
- `GET /api/employees` – paginated employees with `page`, `pageSize`, `search`, `department`, `status`, `sortBy`, `sortDir`.
- `POST /api/employees` – insert a new employee record (admin only).
- `PUT /api/employees/:id` – update an existing employee (admin only).
- `DELETE /api/employees/:id` – remove an employee (admin only).
- `GET /api/employees/:id` – fetch a single employee.
- `GET /api/employees/departments` – unique department list for the filter dropdown (Networking/Architecture are filtered out).
- `GET /api/employees/stats` – summary metrics plus upcoming birthdays (30‑day window).

All `/api/employees/*` routes expect a valid `Authorization: Bearer <token>` header.

## Frontend Highlights

- Secure login screen with a “Fill Demo Credentials” shortcut.
- Paginated table (name, employee id, code, birthday, hire date, address, age, department, status) with sorting and CSV export.
- Filter bar with search, department picklist, status filter, and bottom pagination controls (including rows-per-page selector).
- Live metrics (total staff + on-leave counts), department distribution progress bars, upcoming birthday callouts, and a slide-in detail panel per employee.
- Modal-driven add/edit workflow with pill-style dropdowns for departments/statuses, row-level icon actions (edit/delete), and CSV export tools.
- Authenticated toggle exposes a “User Accounts” form to create additional dashboard logins without writing SQL.

## Verification

- `frontend`: `npm run build` succeeds (checks Vite + Tailwind configuration).
- `backend`: `npm run lint` placeholder executed to ensure scripts work; API boot verified via dependency check in `src/server.js`.

Adjust the instructions as you tailor the app to your infrastructure (e.g., Docker, CI, or managed MySQL). Happy shipping!
