import React from 'react';
import { User, Book } from '../types';
import './UserCard.css';

interface UserCardProps {
  user: User;
  books: Book[];
}

const UserCard: React.FC<UserCardProps> = ({ user, books }) => {
  const borrowedBooks = books.filter(book => user.borrowedBooks.includes(book.id));

  return (
    <div className="user-card">
      <div className="user-header">
        <div className="user-avatar">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="user-info">
          <h3 className="user-name">{user.name}</h3>
          <p className="user-email">{user.email}</p>
          <p className="user-phone">{user.phone}</p>
        </div>
        <div className="user-stats">
          <div className="stat">
            <span className="stat-number">{borrowedBooks.length}</span>
            <span className="stat-label">Books</span>
          </div>
        </div>
      </div>

      {borrowedBooks.length > 0 && (
        <div className="borrowed-books">
          <h4>Currently Borrowed:</h4>
          <div className="book-list">
            {borrowedBooks.map(book => (
              <div key={book.id} className="borrowed-book-item">
                <span className="book-title">{book.title}</span>
                <span className="borrowed-date">
                  Since: {book.borrowedDate ? new Date(book.borrowedDate).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="user-details">
        <p className="registration-date">
          Member since: {new Date(user.registrationDate).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default UserCard;