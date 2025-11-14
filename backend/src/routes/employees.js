const express = require('express');
const mysql = require('mysql2');

const pool = require('../db/pool');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

const VALID_SORT_COLUMNS = new Set(['name', 'department', 'age', 'birthday', 'hire_date']);
const VALID_STATUSES = new Set(['Active', 'On Leave']);
const EXCLUDED_DEPARTMENTS = new Set(['Networking', 'Architecture', 'ဆရာ']);
const FIELD_MAP = {
  name: 'name',
  birthday: 'birthday',
  address: 'address',
  age: 'age',
  department: 'department',
  gender: 'gender',
  phone: 'phone',
  hireDate: 'hire_date',
  status: 'status',
};
const REQUIRED_CREATE_FIELDS = ['name', 'department'];

const formatDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  return value.toString().slice(0, 10);
};

function mapEmployee(row) {
  const formatPhone = (value) => {
    if (!value) return null;
    const digits = String(value).replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('09')) {
      return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    }
    return value;
  };

  return {
    id: row.id,
    name: row.name,
    birthday: formatDate(row.birthday),
    address: row.address,
    age: row.age,
    department: row.department,
    gender: row.gender,
    phone: formatPhone(row.phone),
    hireDate: formatDate(row.hire_date),
    status: row.status,
  };
}

function buildEmployeePayload(body = {}, { isCreate = false } = {}) {
  const columns = [];
  const values = [];

  if (isCreate) {
    REQUIRED_CREATE_FIELDS.forEach((field) => {
      if (!body[field] || !String(body[field]).trim()) {
        const error = new Error(`${field} is required`);
        error.status = 400;
        throw error;
      }
    });
  }

  Object.entries(FIELD_MAP).forEach(([field, column]) => {
    if (!Object.prototype.hasOwnProperty.call(body, field)) return;
    let value = body[field];
    if (value === null || value === undefined) return;

    if (typeof value === 'string') {
      value = value.trim();
    }

    if (value === '') {
      value = null;
    }

    if (field === 'age') {
      const numeric = Number(value);
      if (Number.isNaN(numeric)) {
        const error = new Error('Age must be a number');
        error.status = 400;
        throw error;
      }
      value = numeric;
    }

    if (field === 'status' && value && !VALID_STATUSES.has(value)) {
      const error = new Error('Invalid status');
      error.status = 400;
      throw error;
    }

    columns.push(column);
    values.push(column === 'phone' && value ? String(value).replace(/\D/g, '') : value);
  });

  if (isCreate && !columns.includes('status')) {
    columns.push('status');
    values.push('Active');
  }

  if (!columns.length) {
    const error = new Error('No fields provided');
    error.status = 400;
    throw error;
  }

  return { columns, values };
}

function buildIdentifierWhere(identifier) {
  const numeric = Number(identifier);
  if (!Number.isInteger(numeric)) {
    const error = new Error('Invalid employee ID');
    error.status = 400;
    throw error;
  }
  return { clause: 'id = ?', value: numeric };
}

async function assertUniqueName(name, excludeId = null) {
  if (!name && name !== '') return;
  const trimmed = String(name).trim();
  if (!trimmed) return;
  let sql = 'SELECT id FROM employees WHERE name = ?';
  const params = [trimmed];
  if (excludeId) {
    sql += ' AND id <> ?';
    params.push(excludeId);
  }
  const [rows] = await pool.execute(sql, params);
  if (rows.length) {
    const error = new Error('Employee name already exists');
    error.status = 409;
    throw error;
  }
}

async function fetchEmployeeBy({ clause, value }) {
  const [rows] = await pool.execute(
    `SELECT id, name, birthday, address, age, department, gender, phone, hire_date, status
     FROM employees
     WHERE ${clause}`,
    [value],
  );
  return rows[0] ? mapEmployee(rows[0]) : null;
}

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const requestedPage = Number(req.query.page || 1);
    const page = Number.isNaN(requestedPage) || requestedPage < 1 ? 1 : requestedPage;
    const parsedPageSize = Number(req.query.pageSize) || 10;
    const pageSize = Math.min(Math.max(parsedPageSize, 5), 50);
    const search = (req.query.search || '').trim();
    const department = (req.query.department || '').trim();
    const sortBy = VALID_SORT_COLUMNS.has(req.query.sortBy) ? req.query.sortBy : 'name';
    const sortDir = req.query.sortDir === 'desc' ? 'DESC' : 'ASC';
    const status = (req.query.status || '').trim();

    const offset = (page - 1) * pageSize;
    const filters = [];
    const params = [];

    if (search) {
      filters.push(`(name LIKE ? OR department LIKE ? OR address LIKE ? OR phone LIKE ?)`);
      for (let i = 0; i < 4; i += 1) {
        params.push(`%${search}%`);
      }
    }

    if (department) {
      filters.push(`department = ?`);
      params.push(department);
    }

    if (status && VALID_STATUSES.has(status)) {
      filters.push(`status = ?`);
      params.push(status);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const countSql = mysql.format(`SELECT COUNT(*) AS total FROM employees ${whereClause}`, params);
    const [countRows] = await pool.query(countSql);
    const totalItems = countRows[0]?.total || 0;

    const dataQuery = `
      SELECT id, name, birthday, address, age, department, gender, phone, hire_date, status
      FROM employees
      ${whereClause}
      ORDER BY ${sortBy} ${sortDir}
      LIMIT ${pageSize}
      OFFSET ${offset}`;
    const dataSql = mysql.format(dataQuery, params);
    const [rows] = await pool.query(dataSql);

    res.json({
      data: rows.map(mapEmployee),
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/departments', async (_req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT DISTINCT department FROM employees ORDER BY department ASC');
    const list = rows
      .map((row) => row.department)
      .filter((dept) => dept && !EXCLUDED_DEPARTMENTS.has(dept));
    res.json(list);
  } catch (err) {
    next(err);
  }
});

router.get('/stats', async (_req, res, next) => {
  try {
    const [[{ totalEmployees = 0 } = {}]] = await pool.execute('SELECT COUNT(*) AS totalEmployees FROM employees');
    const [[{ avgAge = null } = {}]] = await pool.execute('SELECT AVG(age) AS avgAge FROM employees');
    const [[{ totalOnLeave = 0 } = {}]] = await pool.execute(
      "SELECT COUNT(*) AS totalOnLeave FROM employees WHERE status = 'On Leave'",
    );
    const [rawDepartmentDistribution] = await pool.execute(
      'SELECT department, COUNT(*) AS count FROM employees GROUP BY department ORDER BY count DESC',
    );
    const departmentDistribution = rawDepartmentDistribution.filter(
      (row) => row.department && !EXCLUDED_DEPARTMENTS.has(row.department),
    );

    const [birthdayRows] = await pool.execute(
      'SELECT id, name, department, birthday FROM employees WHERE birthday IS NOT NULL',
    );

    const today = new Date();
    const upcoming = birthdayRows
      .map((row) => {
        const birthday = new Date(row.birthday);
        const nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
        if (nextBirthday < today) {
          nextBirthday.setFullYear(today.getFullYear() + 1);
        }
        const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
        return {
          id: row.id,
          name: row.name,
          department: row.department,
          birthday: formatDate(row.birthday),
          daysUntil,
        };
      })
      .filter((row) => row.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 5);

    res.json({
      totalEmployees,
      avgAge: avgAge ? Number(avgAge).toFixed(1) : null,
      totalOnLeave,
      departmentDistribution,
      upcomingBirthdays: upcoming,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    await assertUniqueName(req.body.name);
    const { columns, values } = buildEmployeePayload(req.body, { isCreate: true });
    const placeholders = columns.map(() => '?').join(', ');
    const query = `INSERT INTO employees (${columns.join(', ')}) VALUES (${placeholders})`;
    const [result] = await pool.execute(query, values);
    const employee = await fetchEmployeeBy({ clause: 'id = ?', value: result.insertId });
    res.status(201).json(employee);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const message = err.sqlMessage || '';
      if (message.includes('employee_name_unique')) {
        return res.status(409).json({ message: 'Employee name already exists' });
      }
      return res.status(409).json({ message: 'Duplicate employee entry' });
    }
    return next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { columns, values } = buildEmployeePayload(req.body, { isCreate: false });
    const setClause = columns.map((column) => `${column} = ?`).join(', ');
    const identifier = buildIdentifierWhere(req.params.id);
    if (Object.prototype.hasOwnProperty.call(req.body, 'name')) {
      await assertUniqueName(req.body.name, identifier.value);
    }
    const query = `UPDATE employees SET ${setClause} WHERE ${identifier.clause}`;
    const [result] = await pool.execute(query, [...values, identifier.value]);
    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    const employee = await fetchEmployeeBy(identifier);
    return res.json(employee);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      const message = err.sqlMessage || '';
      if (message.includes('employee_name_unique')) {
        return res.status(409).json({ message: 'Employee name already exists' });
      }
      return res.status(409).json({ message: 'Duplicate employee entry' });
    }
    return next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const identifier = buildIdentifierWhere(req.params.id);
    const employee = await fetchEmployeeBy(identifier);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    return res.json(employee);
  } catch (err) {
    return next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const identifier = buildIdentifierWhere(req.params.id);
    const [result] = await pool.execute(`DELETE FROM employees WHERE ${identifier.clause}`, [identifier.value]);
    if (!result.affectedRows) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
