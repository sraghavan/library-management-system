# 📚 Personal Library Management System

A modern React-based library management system for tracking your personal book collection and managing borrowers.

## Features

- 📖 **Book Management**: Add books manually or by URL (Amazon, Goodreads, etc.)
- 👥 **User Management**: Simple user registration and management
- 🔄 **Borrowing System**: Track who has borrowed which books and when
- 🔍 **Search & Filter**: Find books by title, author, or availability status
- 💾 **Local Storage**: All data is saved locally in your browser
- 📱 **Responsive Design**: Works perfectly on desktop and mobile devices

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository or navigate to the project directory
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## How to Use

### Adding Books

1. **From URL**: Click "Add New Book" and paste a URL from Amazon, Goodreads, or other book sites. The system will automatically extract book details.
2. **Manually**: Fill in the book details manually in the form.

### Managing Users

1. Go to the "Users" page to see all registered members
2. Users can register themselves via the "Register" page
3. View borrowing history and current borrowed books for each user

### Borrowing & Returning Books

1. On the Books page, select a user from the dropdown for available books to assign them
2. For borrowed books, click "Mark as Returned" to return them to the library

### Features Overview

- **Books Page**: View all books, search, filter by availability
- **Users Page**: Manage library members and see their borrowing status
- **Register Page**: Allow new users to self-register

## Available Scripts

### `npm start`
Runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it.

### `npm run build`
Builds the app for production to the `build` folder.

### `npm test`
Launches the test runner in interactive watch mode.

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Routing**: React Router DOM
- **State Management**: React Context + useReducer
- **Storage**: Local Storage for data persistence
- **Styling**: CSS3 with modern design patterns
- **Metadata Extraction**: Custom URL parser for book details

## Data Storage

**Current**: All data is stored locally in your browser's localStorage.
**Upcoming**: Integration with Supabase database for cloud storage and multi-device sync.

**LocalStorage features**:
- No server setup required
- Data persists between sessions
- Each browser/device has its own data
- Excel import/export for data backup

## Deployment

Ready for deployment on Vercel with zero configuration.
Live demo: Coming soon!

## Browser Compatibility

Works on all modern browsers including:
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+
