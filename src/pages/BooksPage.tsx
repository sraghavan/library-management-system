import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Layout from '../components/Layout';
import ExcelImportExport from '../components/ExcelImportExport';
import DataRecoveryModal from '../components/DataRecoveryModal';
import { useLibrary } from '../context/LibraryContext';
import { Book } from '../types';
import './BooksPage.css';

const BooksPage: React.FC = () => {
  const { state, dispatch } = useLibrary();
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
    publishedDate: '',
    imageUrl: '',
    genre: ''
  });
  const [editingBook, setEditingBook] = useState<string | null>(null);
  const [editData, setEditData] = useState<{title?: string; author?: string; isbn?: string; description?: string; publishedDate?: string; imageUrl?: string; genre?: string}>({});
  const [sortField, setSortField] = useState<'title' | 'author' | 'status'>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'borrowed'>('all');
  const [showRecovery, setShowRecovery] = useState(false);
  const [borrowingBook, setBorrowingBook] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showAddBookModal, setShowAddBookModal] = useState(false);

  const handleNewBookChange = (field: string, value: string) => {
    setNewBook(prev => ({ ...prev, [field]: value }));
  };

  const handleNewBookSave = () => {
    if (newBook.title.trim() && newBook.author.trim()) {
      const book: Book = {
        id: uuidv4(),
        title: newBook.title,
        author: newBook.author,
        isbn: newBook.isbn,
        description: newBook.description,
        publishedDate: newBook.publishedDate,
        imageUrl: newBook.imageUrl,
        genre: newBook.genre,
        isAvailable: true // New books are available by default
      };
      dispatch({ type: 'ADD_BOOK', payload: book });
      setNewBook({
        title: '',
        author: '',
        isbn: '',
        description: '',
        publishedDate: '',
        imageUrl: '',
        genre: ''
      });
      setShowAddBookModal(false);
    }
  };

  const handleCancelAddBook = () => {
    setNewBook({
      title: '',
      author: '',
      isbn: '',
      description: '',
      publishedDate: '',
      imageUrl: '',
      genre: ''
    });
    setShowAddBookModal(false);
  };

  const startEdit = (book: Book) => {
    setEditingBook(book.id);
    setEditData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      description: book.description,
      publishedDate: book.publishedDate,
      imageUrl: book.imageUrl,
      genre: book.genre
    });
  };

  const saveEdit = () => {
    if (editingBook && editData.title && editData.title.trim() && editData.author && editData.author.trim()) {
      const updatedBook: Book = {
        ...state.books.find(b => b.id === editingBook)!,
        title: editData.title,
        author: editData.author,
        isbn: editData.isbn || '',
        description: editData.description || '',
        publishedDate: editData.publishedDate || '',
        imageUrl: editData.imageUrl || '',
        genre: editData.genre || ''
      };
      dispatch({ type: 'UPDATE_BOOK', payload: updatedBook });
    }
    setEditingBook(null);
    setEditData({});
  };

  const cancelEdit = () => {
    setEditingBook(null);
    setEditData({});
  };

  const handleBorrowBook = (bookId: string, userId: string) => {
    dispatch({ type: 'BORROW_BOOK', payload: { bookId, userId } });
    setBorrowingBook(null);
  };

  const handleReturnBook = (bookId: string) => {
    dispatch({ type: 'RETURN_BOOK', payload: bookId });
  };

  const handleBookTitleClick = (book: Book) => {
    setSelectedBook(book);
    setShowBookModal(true);
  };

  const handleCloseModal = () => {
    setShowBookModal(false);
    setSelectedBook(null);
  };

  const handleSort = (field: 'title' | 'author' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getBorrowedByName = (borrowedBy?: string) => {
    if (!borrowedBy) return '-';
    const user = state.users.find(u => u.id === borrowedBy);
    return user ? user.name : 'Unknown User';
  };

  // Filter books based on search and status
  const filteredBooks = state.books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (book.isbn && book.isbn.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterStatus === 'available') return matchesSearch && book.isAvailable;
    if (filterStatus === 'borrowed') return matchesSearch && !book.isAvailable;
    return matchesSearch;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    let aValue, bValue;

    if (sortField === 'status') {
      aValue = a.isAvailable ? 'Available' : 'Borrowed';
      bValue = b.isAvailable ? 'Available' : 'Borrowed';
    } else if (sortField === 'author') {
      aValue = a.author.toLowerCase();
      bValue = b.author.toLowerCase();
    } else {
      aValue = a.title.toLowerCase();
      bValue = b.title.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return (
    <Layout title="Library Management">
      <div className="register-page">
        <div className="register-header">
          <h3>📚 Book Management</h3>
          <p>Manage library books - add new books or edit existing ones. Title and author are required.</p>

          <div className="action-icons">
            <button
              onClick={() => setShowAddBookModal(true)}
              className="icon-btn add-book-btn"
              title="Add New Book"
            >
              ➕
            </button>
            <ExcelImportExport type="books" />
            <button
              onClick={() => setShowRecovery(true)}
              className="icon-btn"
              title="Recover lost data"
            >
              🔄
            </button>
          </div>
        </div>

        <div className="books-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search books by title, author, or ISBN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-controls">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'available' | 'borrowed')}
              className="status-filter"
            >
              <option value="all">All Books ({state.books.length})</option>
              <option value="available">Available ({state.books.filter(b => b.isAvailable).length})</option>
              <option value="borrowed">Borrowed ({state.books.filter(b => !b.isAvailable).length})</option>
            </select>
          </div>
        </div>

        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Image</th>
                <th
                  onClick={() => handleSort('title')}
                  style={{ cursor: 'pointer' }}
                >
                  Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('author')}
                  style={{ cursor: 'pointer' }}
                >
                  Author {sortField === 'author' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th>Genre</th>
                <th>Published Date</th>
                <th
                  onClick={() => handleSort('status')}
                  style={{ cursor: 'pointer' }}
                >
                  Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th>Borrowed By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedBooks.map(book => (
                <tr key={book.id}>
                  <td>
                    {editingBook === book.id ? (
                      <input
                        type="url"
                        value={editData.imageUrl || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, imageUrl: e.target.value }))}
                        className="table-input"
                        placeholder="Image URL"
                      />
                    ) : (
                      <div className="book-image-cell">
                        {book.imageUrl ? (
                          <img src={book.imageUrl} alt={book.title} className="book-thumbnail" />
                        ) : (
                          <div className="book-placeholder-small">📖</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    {editingBook === book.id ? (
                      <input
                        type="text"
                        value={editData.title || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                        className="table-input"
                      />
                    ) : (
                      <button
                        onClick={() => handleBookTitleClick(book)}
                        className="book-title-link"
                        title="Click to view book details"
                      >
                        {book.title}
                      </button>
                    )}
                  </td>
                  <td>
                    {editingBook === book.id ? (
                      <input
                        type="text"
                        value={editData.author || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, author: e.target.value }))}
                        className="table-input"
                      />
                    ) : (
                      book.author
                    )}
                  </td>
                  <td>
                    {editingBook === book.id ? (
                      <input
                        type="text"
                        value={editData.genre || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, genre: e.target.value }))}
                        className="table-input"
                      />
                    ) : (
                      book.genre || '-'
                    )}
                  </td>
                  <td>
                    {editingBook === book.id ? (
                      <input
                        type="text"
                        value={editData.publishedDate || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, publishedDate: e.target.value }))}
                        className="table-input"
                      />
                    ) : (
                      book.publishedDate || '-'
                    )}
                  </td>
                  <td>
                    <span className={`book-count ${book.isAvailable ? '' : 'has-books'}`}>
                      {book.isAvailable ? 'Available' : 'Borrowed'}
                    </span>
                  </td>
                  <td>
                    {getBorrowedByName(book.borrowedBy)}
                  </td>
                  <td>
                    {editingBook === book.id ? (
                      <div className="edit-actions">
                        <button onClick={saveEdit} className="save-btn">💾</button>
                        <button onClick={cancelEdit} className="cancel-btn">❌</button>
                      </div>
                    ) : (
                      <div className="book-actions">
                        <button onClick={() => startEdit(book)} className="edit-btn" title="Edit book">✏️</button>
                        {book.isAvailable ? (
                          borrowingBook === book.id ? (
                            <div className="borrow-dropdown">
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleBorrowBook(book.id, e.target.value);
                                  }
                                }}
                                className="user-select"
                                defaultValue=""
                              >
                                <option value="">Select user...</option>
                                {state.users.map(user => (
                                  <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                              </select>
                              <button onClick={() => setBorrowingBook(null)} className="cancel-btn">❌</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setBorrowingBook(book.id)}
                              className="borrow-btn"
                              title="Borrow this book"
                            >
                              📤
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => handleReturnBook(book.id)}
                            className="return-btn"
                            title="Return this book"
                          >
                            📥
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedBooks.length === 0 && (
          <div className="empty-table">
            <p>
              {searchTerm || filterStatus !== 'all'
                ? 'No books match your search criteria'
                : 'No books in the library yet'
              }
            </p>
            <p>Add your first book using the ➕ button above</p>
          </div>
        )}

        <div className="table-footer">
          <p>📊 Total Books: {state.books.length} | Available: {state.books.filter(b => b.isAvailable).length} | Borrowed: {state.books.filter(b => !b.isAvailable).length}</p>
          <p>💡 Click column headers to sort. Click ✏️ to edit book details. Use search to find books by title, author, or ISBN.</p>
        </div>

        <DataRecoveryModal
          isOpen={showRecovery}
          onClose={() => setShowRecovery(false)}
        />

        {showAddBookModal && (
          <div className="book-modal-overlay" onClick={handleCancelAddBook}>
            <div className="book-details-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>📚 Add New Book</h2>
                <button onClick={handleCancelAddBook} className="close-btn">×</button>
              </div>

              <div className="modal-content">
                <div className="add-book-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Title *</label>
                      <input
                        type="text"
                        value={newBook.title}
                        onChange={(e) => handleNewBookChange('title', e.target.value)}
                        placeholder="Enter book title"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Author *</label>
                      <input
                        type="text"
                        value={newBook.author}
                        onChange={(e) => handleNewBookChange('author', e.target.value)}
                        placeholder="Enter author name"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Genre</label>
                      <input
                        type="text"
                        value={newBook.genre}
                        onChange={(e) => handleNewBookChange('genre', e.target.value)}
                        placeholder="e.g., Fiction, Mystery, Romance"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>ISBN</label>
                      <input
                        type="text"
                        value={newBook.isbn}
                        onChange={(e) => handleNewBookChange('isbn', e.target.value)}
                        placeholder="Enter ISBN"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Published Date</label>
                      <input
                        type="date"
                        value={newBook.publishedDate}
                        onChange={(e) => handleNewBookChange('publishedDate', e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Image URL</label>
                      <input
                        type="url"
                        value={newBook.imageUrl}
                        onChange={(e) => handleNewBookChange('imageUrl', e.target.value)}
                        placeholder="Enter book cover image URL"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      value={newBook.description}
                      onChange={(e) => handleNewBookChange('description', e.target.value)}
                      placeholder="Enter book description"
                      className="form-textarea"
                      rows={4}
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      onClick={handleCancelAddBook}
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleNewBookSave}
                      disabled={!newBook.title.trim() || !newBook.author.trim()}
                      className="save-btn"
                    >
                      Add Book
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showBookModal && selectedBook && (
          <div className="book-modal-overlay" onClick={handleCloseModal}>
            <div className="book-details-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedBook.title}</h2>
                <button onClick={handleCloseModal} className="close-btn">×</button>
              </div>

              <div className="modal-content">
                <div className="book-details-grid">
                  <div className="book-image-section">
                    {selectedBook.imageUrl ? (
                      <img src={selectedBook.imageUrl} alt={selectedBook.title} className="book-cover" />
                    ) : (
                      <div className="book-placeholder">
                        <span>📖</span>
                        <p>No Image Available</p>
                      </div>
                    )}
                  </div>

                  <div className="book-info-section">
                    <div className="info-group">
                      <label>Author</label>
                      <p>{selectedBook.author}</p>
                    </div>

                    {selectedBook.genre && (
                      <div className="info-group">
                        <label>Genre</label>
                        <p>{selectedBook.genre}</p>
                      </div>
                    )}

                    {selectedBook.isbn && (
                      <div className="info-group">
                        <label>ISBN</label>
                        <p>{selectedBook.isbn}</p>
                      </div>
                    )}

                    {selectedBook.publishedDate && (
                      <div className="info-group">
                        <label>Published Date</label>
                        <p>{selectedBook.publishedDate}</p>
                      </div>
                    )}

                    <div className="info-group">
                      <label>Status</label>
                      <p className={`status-badge ${selectedBook.isAvailable ? 'available' : 'borrowed'}`}>
                        {selectedBook.isAvailable ? '✅ Available' : '📤 Borrowed'}
                      </p>
                    </div>

                    {!selectedBook.isAvailable && selectedBook.borrowedBy && (
                      <div className="info-group">
                        <label>Borrowed By</label>
                        <p>{getBorrowedByName(selectedBook.borrowedBy)}</p>
                      </div>
                    )}

                    {!selectedBook.isAvailable && selectedBook.borrowedDate && (
                      <div className="info-group">
                        <label>Borrowed Date</label>
                        <p>{new Date(selectedBook.borrowedDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedBook.description && (
                  <div className="description-section">
                    <label>Description</label>
                    <p>{selectedBook.description}</p>
                  </div>
                )}

                {selectedBook.sourceUrl && (
                  <div className="source-section">
                    <label>Source</label>
                    <a href={selectedBook.sourceUrl} target="_blank" rel="noopener noreferrer" className="source-link">
                      🔗 View Original Source
                    </a>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                {selectedBook.isAvailable ? (
                  <div className="borrow-section">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleBorrowBook(selectedBook.id, e.target.value);
                          handleCloseModal();
                        }
                      }}
                      className="user-select-modal"
                      defaultValue=""
                    >
                      <option value="">📤 Borrow this book...</option>
                      {state.users.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      handleReturnBook(selectedBook.id);
                      handleCloseModal();
                    }}
                    className="return-btn-modal"
                  >
                    📥 Return Book
                  </button>
                )}

                <button
                  onClick={() => {
                    startEdit(selectedBook);
                    handleCloseModal();
                  }}
                  className="edit-btn-modal"
                >
                  ✏️ Edit Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BooksPage;