import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Database configuration with better timeout handling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 60000, // 60 seconds
  idleTimeoutMillis: 600000, // 10 minutes
  max: 3, // Maximum number of clients in the pool
  allowExitOnIdle: true
});

// Middleware
app.use(cors());
app.use(express.json());

// Retry function for database operations
const retryOperation = async (operation, maxRetries = 3, delay = 2000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      console.log(`⚠️ Database operation failed (attempt ${i + 1}/${maxRetries}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 1.5; // Exponential backoff
    }
  }
};

// Test database connection with retry
const testConnection = async () => {
  try {
    await retryOperation(async () => {
      const client = await pool.connect();
      console.log('✅ Connected to Neon PostgreSQL database');
      client.release();
    });
  } catch (error) {
    console.error('❌ Error connecting to database after retries:', error.message);
  }
};

testConnection();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Library Management API is running' });
});

// Books endpoints
app.get('/api/books', async (req, res) => {
  try {
    const result = await retryOperation(async () => {
      return await pool.query('SELECT * FROM books ORDER BY created_at DESC');
    });
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting books:', error);
    res.status(500).json({ error: 'Failed to get books', details: error.message });
  }
});

app.post('/api/books', async (req, res) => {
  try {
    const { title, author, isbn, description, published_date, image_url, genre, is_available, source_url } = req.body;
    const result = await pool.query(
      `INSERT INTO books (title, author, isbn, description, published_date, image_url, genre, is_available, source_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [title, author, isbn, description, published_date, image_url, genre, is_available !== false, source_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ error: 'Failed to create book' });
  }
});

app.put('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const keys = Object.keys(updates);
    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
    const values = Object.values(updates);

    await pool.query(
      `UPDATE books SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1}`,
      [...values, id]
    );

    const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ error: 'Failed to update book' });
  }
});

app.delete('/api/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM books WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

// Users endpoints
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const result = await pool.query(
      `INSERT INTO users (name, email, phone, registration_date)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [name, email, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const keys = Object.keys(updates);
    const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
    const values = Object.values(updates);

    await pool.query(
      `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1}`,
      [...values, id]
    );

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Test endpoint
app.post('/api/test', async (req, res) => {
  try {
    console.log('🔄 Running database test with retry logic...');

    // Get current data with retry
    const [booksResult, usersResult] = await Promise.all([
      retryOperation(() => pool.query('SELECT COUNT(*) FROM books')),
      retryOperation(() => pool.query('SELECT COUNT(*) FROM users'))
    ]);

    // Test creating a user with retry
    const testUser = await retryOperation(() =>
      pool.query(
        `INSERT INTO users (name, email, phone, registration_date)
         VALUES ($1, $2, $3, NOW()) RETURNING *`,
        ['Test User API', 'testapi@example.com', '555-API']
      )
    );

    // Test creating a book with retry
    const testBook = await retryOperation(() =>
      pool.query(
        `INSERT INTO books (title, author, isbn, description, genre, is_available)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        ['API Test Book', 'Test Author', '123-API', 'A book for testing API', 'Test', true]
      )
    );

    // Clean up test data
    await retryOperation(() => pool.query('DELETE FROM books WHERE title = $1', ['API Test Book']));
    await retryOperation(() => pool.query('DELETE FROM users WHERE name = $1', ['Test User API']));

    res.json({
      success: true,
      message: 'Database test completed successfully!',
      data: {
        booksCount: booksResult.rows[0].count,
        usersCount: usersResult.rows[0].count,
        testUserCreated: testUser.rows[0],
        testBookCreated: testBook.rows[0]
      }
    });
  } catch (error) {
    console.error('❌ Database test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Database test failed',
      details: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Library Management API running on http://localhost:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`🧪 Test endpoint: http://localhost:${port}/api/test`);
});