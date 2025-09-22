import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
  host: process.env.REACT_APP_DB_HOST,
  username: process.env.REACT_APP_DB_USERNAME,
  password: process.env.REACT_APP_DB_PASSWORD,
  database: process.env.REACT_APP_DB_NAME,
  ssl: {
    rejectUnauthorized: true
  }
};

// Create connection pool
let pool;

const getConnection = () => {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
};

// Books operations
export const booksAPI = {
  async getAll() {
    const connection = getConnection();
    const [rows] = await connection.execute('SELECT * FROM books ORDER BY created_at DESC');
    return rows;
  },

  async create(book) {
    const connection = getConnection();
    const [result] = await connection.execute(
      `INSERT INTO books (id, title, author, isbn, description, published_date, image_url, genre, is_available, source_url)
       VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [book.title, book.author, book.isbn, book.description, book.published_date, book.image_url, book.genre, book.is_available, book.source_url]
    );
    return { id: result.insertId, ...book };
  },

  async update(id, updates) {
    const connection = getConnection();
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);

    await connection.execute(
      `UPDATE books SET ${setClause}, updated_at = NOW() WHERE id = ?`,
      [...values, id]
    );

    const [rows] = await connection.execute('SELECT * FROM books WHERE id = ?', [id]);
    return rows[0];
  },

  async delete(id) {
    const connection = getConnection();
    await connection.execute('DELETE FROM books WHERE id = ?', [id]);
    return { success: true };
  }
};

// Users operations
export const usersAPI = {
  async getAll() {
    const connection = getConnection();
    const [rows] = await connection.execute('SELECT * FROM users ORDER BY created_at DESC');
    return rows;
  },

  async create(user) {
    const connection = getConnection();
    const [result] = await connection.execute(
      `INSERT INTO users (id, name, email, phone, registration_date)
       VALUES (UUID(), ?, ?, ?, NOW())`,
      [user.name, user.email, user.phone]
    );
    return { id: result.insertId, ...user };
  },

  async update(id, updates) {
    const connection = getConnection();
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);

    await connection.execute(
      `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = ?`,
      [...values, id]
    );

    const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  },

  async delete(id) {
    const connection = getConnection();
    await connection.execute('DELETE FROM users WHERE id = ?', [id]);
    return { success: true };
  }
};