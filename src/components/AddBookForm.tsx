import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useLibrary } from '../context/LibraryContext';
import { extractBookMetadata } from '../services/bookMetadata';
import { Book, BookMetadata } from '../types';
import AdvancedPhotoScanModal from './AdvancedPhotoScanModal';
import './AddBookForm.css';

const AddBookForm: React.FC = () => {
  const { dispatch } = useLibrary();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPhotoScan, setShowPhotoScan] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    imageUrl: '',
    isbn: '',
    sourceUrl: ''
  });

  const handleUrlExtract = async () => {
    if (!formData.sourceUrl) return;

    setLoading(true);
    try {
      const metadata = await extractBookMetadata(formData.sourceUrl);
      setFormData(prev => ({
        ...prev,
        title: metadata.title,
        author: metadata.author,
        description: metadata.description || '',
        imageUrl: metadata.imageUrl || '',
        isbn: metadata.isbn || ''
      }));
    } catch (error) {
      console.error('Failed to extract metadata:', error);
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newBook: Book = {
      id: uuidv4(),
      title: formData.title,
      author: formData.author,
      description: formData.description,
      imageUrl: formData.imageUrl,
      isbn: formData.isbn,
      isAvailable: true,
      sourceUrl: formData.sourceUrl
    };

    dispatch({ type: 'ADD_BOOK', payload: newBook });
    setFormData({
      title: '',
      author: '',
      description: '',
      imageUrl: '',
      isbn: '',
      sourceUrl: ''
    });
    setIsOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleBooksDetected = (books: BookMetadata[]) => {
    books.forEach(bookMetadata => {
      const newBook: Book = {
        id: uuidv4(),
        title: bookMetadata.title,
        author: bookMetadata.author,
        description: bookMetadata.description || '',
        imageUrl: bookMetadata.imageUrl || '',
        isbn: bookMetadata.isbn || '',
        publishedDate: bookMetadata.publishedDate || '',
        isAvailable: true,
      };
      dispatch({ type: 'ADD_BOOK', payload: newBook });
    });
  };

  return (
    <>
      <div className="add-book-buttons">
        <button onClick={() => setIsOpen(true)} className="add-book-btn">
          ➕ Add New Book
        </button>
        <button onClick={() => setShowPhotoScan(true)} className="photo-scan-btn">
          🚀 Advanced Scan
        </button>
      </div>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Book</h3>
              <button onClick={() => setIsOpen(false)} className="close-btn">×</button>
            </div>

            <form onSubmit={handleSubmit} className="add-book-form">
              <div className="url-section">
                <label>Book URL (Amazon, Goodreads, etc.)</label>
                <div className="url-input-group">
                  <input
                    type="url"
                    name="sourceUrl"
                    value={formData.sourceUrl}
                    onChange={handleChange}
                    placeholder="https://amazon.com/book-title"
                  />
                  <button
                    type="button"
                    onClick={handleUrlExtract}
                    disabled={!formData.sourceUrl || loading}
                    className="extract-btn"
                  >
                    {loading ? '🔄' : '📥'} Extract
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Author *</label>
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>ISBN</label>
                <input
                  type="text"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleChange}
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setIsOpen(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Add Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AdvancedPhotoScanModal
        isOpen={showPhotoScan}
        onClose={() => setShowPhotoScan(false)}
        onBooksDetected={handleBooksDetected}
      />
    </>
  );
};

export default AddBookForm;