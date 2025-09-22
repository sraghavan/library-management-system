-- Library Management System Database Schema for PlanetScale (MySQL)
-- Run these commands in your PlanetScale database console

-- Create books table
CREATE TABLE books (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  isbn VARCHAR(50),
  description TEXT,
  published_date VARCHAR(50),
  image_url TEXT,
  genre VARCHAR(100),
  is_available BOOLEAN DEFAULT true,
  borrowed_by VARCHAR(36),
  borrowed_date TIMESTAMP NULL,
  source_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_title (title),
  INDEX idx_author (author),
  INDEX idx_is_available (is_available),
  INDEX idx_borrowed_by (borrowed_by)
);

-- Create users table
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_email (email)
);

-- Add foreign key constraint after both tables are created
ALTER TABLE books
ADD CONSTRAINT fk_books_borrowed_by
FOREIGN KEY (borrowed_by) REFERENCES users(id) ON DELETE SET NULL;

-- Insert sample data
INSERT INTO users (id, name, email, phone) VALUES
('user-1', 'John Doe', 'john.doe@example.com', '555-0123'),
('user-2', 'Jane Smith', 'jane.smith@example.com', '555-0456'),
('user-3', 'Bob Johnson', 'bob.johnson@example.com', '555-0789');

INSERT INTO books (id, title, author, isbn, description, genre, image_url) VALUES
('book-1', 'The Great Gatsby', 'F. Scott Fitzgerald', '978-0-7432-7356-5', 'A classic American novel set in the Jazz Age', 'Fiction', 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg'),
('book-2', 'To Kill a Mockingbird', 'Harper Lee', '978-0-06-112008-4', 'A gripping tale of racial injustice and childhood innocence', 'Fiction', 'https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg'),
('book-3', '1984', 'George Orwell', '978-0-452-28423-4', 'A dystopian social science fiction novel', 'Science Fiction', 'https://covers.openlibrary.org/b/isbn/9780452284234-L.jpg');