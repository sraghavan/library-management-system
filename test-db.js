// Simple database connection test
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.REACT_APP_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testConnection() {
  try {
    console.log('Testing Neon database connection...');

    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Connected to Neon database!');

    // Test getting users
    const usersResult = await client.query('SELECT * FROM users LIMIT 3');
    console.log('\n📄 Sample users from database:');
    console.table(usersResult.rows);

    // Test getting books
    const booksResult = await client.query('SELECT title, author, genre FROM books LIMIT 3');
    console.log('\n📚 Sample books from database:');
    console.table(booksResult.rows);

    // Test inserting a new book
    const newBook = await client.query(`
      INSERT INTO books (title, author, genre, description, is_available)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, ['Test Book', 'Test Author', 'Test Genre', 'This is a test book', true]);

    console.log('\n✅ Successfully inserted new book:');
    console.table(newBook.rows);

    // Clean up - delete the test book
    await client.query('DELETE FROM books WHERE title = $1', ['Test Book']);
    console.log('✅ Cleaned up test data');

    client.release();
    await pool.end();

    console.log('\n🎉 Database test completed successfully!');
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  }
}

testConnection();