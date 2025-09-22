import React from 'react';
import { Book, User } from '../types';
import { useLibrary } from '../context/LibraryContext';
import './BookCard.css';

interface BookCardProps {
  book: Book;
  users: User[];
}

const BookCard: React.FC<BookCardProps> = ({ book, users }) => {
  const { dispatch } = useLibrary();

  const handleBorrow = (userId: string) => {
    dispatch({ type: 'BORROW_BOOK', payload: { bookId: book.id, userId } });
  };

  const handleReturn = () => {
    dispatch({ type: 'RETURN_BOOK', payload: book.id });
  };

  const borrowedUser = users.find(user => user.id === book.borrowedBy);

  return (
    <div className={`book-card ${!book.isAvailable ? 'borrowed' : ''}`}>
      <div className="book-image">
        {book.imageUrl ? (
          <img src={book.imageUrl} alt={book.title} />
        ) : (
          <div className="book-placeholder">📖</div>
        )}
      </div>
      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">by {book.author}</p>
        {book.description && (
          <p className="book-description">{book.description.substring(0, 100)}...</p>
        )}
        <div className="book-status">
          {book.isAvailable ? (
            <div className="available-actions">
              <span className="status-badge available">Available</span>
              <select
                onChange={(e) => e.target.value && handleBorrow(e.target.value)}
                defaultValue=""
                className="user-select"
              >
                <option value="">Assign to user</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="borrowed-info">
              <span className="status-badge borrowed">Borrowed</span>
              <p className="borrowed-by">
                By: {borrowedUser?.name || 'Unknown'}
              </p>
              <p className="borrowed-date">
                Since: {book.borrowedDate ? new Date(book.borrowedDate).toLocaleDateString() : 'Unknown'}
              </p>
              <button onClick={handleReturn} className="return-btn">
                Mark as Returned
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookCard;