-- Library Management System Database Schema for Neon PostgreSQL
-- Run these commands in your Neon SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create books table
CREATE TABLE books (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  isbn VARCHAR(50),
  description TEXT,
  published_date VARCHAR(50),
  image_url TEXT,
  genre VARCHAR(100),
  is_available BOOLEAN DEFAULT true,
  borrowed_by UUID REFERENCES users(id),
  borrowed_date TIMESTAMP,
  source_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create users table
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  registration_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_author ON books(author);
CREATE INDEX idx_books_is_available ON books(is_available);
CREATE INDEX idx_books_borrowed_by ON books(borrowed_by);
CREATE INDEX idx_users_name ON users(name);
CREATE INDEX idx_users_email ON users(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO users (name, email, phone) VALUES
('John Doe', 'john.doe@example.com', '555-0123'),
('Jane Smith', 'jane.smith@example.com', '555-0456'),
('Bob Johnson', 'bob.johnson@example.com', '555-0789');

INSERT INTO books (title, author, isbn, description, genre, image_url) VALUES
('The Great Gatsby', 'F. Scott Fitzgerald', '978-0-7432-7356-5', 'A classic American novel set in the Jazz Age', 'Fiction', 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg'),
('To Kill a Mockingbird', 'Harper Lee', '978-0-06-112008-4', 'A gripping tale of racial injustice and childhood innocence', 'Fiction', 'https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg'),
('1984', 'George Orwell', '978-0-452-28423-4', 'A dystopian social science fiction novel', 'Science Fiction', 'https://covers.openlibrary.org/b/isbn/9780452284234-L.jpg');