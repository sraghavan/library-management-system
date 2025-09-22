import { Pool } from 'pg';

// Database configuration
const dbConfig = {
  connectionString: process.env.REACT_APP_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
};

// Create connection pool
let pool;

const getConnection = () => {
  if (!pool) {
    pool = new Pool(dbConfig);
  }
  return pool;
};

// Books operations
export const booksAPI = {
  async getAll() {
    const connection = getConnection();
    const result = await connection.query('SELECT * FROM books ORDER BY created_at DESC');
    return result.rows;
  },

  async create(book) {
    const connection = getConnection();
    const result = await connection.query(
      `INSERT INTO books (title, author, isbn, description, published_date, image_url, genre, is_available, source_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [book.title, book.author, book.isbn, book.description, book.published_date, book.image_url, book.genre, book.is_available, book.source_url]
    );
    return result.rows[0];
  },

  async update(id, updates) {
    const connection = getConnection();
    const keys = Object.keys(updates);
    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
    const values = Object.values(updates);

    await connection.query(
      `UPDATE books SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1}`,
      [...values, id]
    );

    const result = await connection.query('SELECT * FROM books WHERE id = $1', [id]);
    return result.rows[0];
  },

  async delete(id) {
    const connection = getConnection();
    await connection.query('DELETE FROM books WHERE id = $1', [id]);
    return { success: true };
  }
};

// Users operations
export const usersAPI = {
  async getAll() {
    const connection = getConnection();
    const result = await connection.query('SELECT * FROM users ORDER BY created_at DESC');
    return result.rows;
  },

  async create(user) {
    const connection = getConnection();
    const result = await connection.query(
      `INSERT INTO users (name, email, phone, registration_date)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [user.name, user.email, user.phone]
    );
    return result.rows[0];
  },

  async update(id, updates) {
    const connection = getConnection();
    const keys = Object.keys(updates);
    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
    const values = Object.values(updates);

    await connection.query(
      `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1}`,
      [...values, id]
    );

    const result = await connection.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  },

  async delete(id) {
    const connection = getConnection();
    await connection.query('DELETE FROM users WHERE id = $1', [id]);
    return { success: true };
  }
};