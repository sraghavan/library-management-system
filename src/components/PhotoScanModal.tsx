import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { extractBookMetadata } from '../services/bookMetadata';
import { BookMetadata } from '../types';
import './PhotoScanModal.css';

interface PhotoScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBooksDetected: (books: BookMetadata[]) => void;
}

interface DetectedBook {
  title: string;
  confidence: number;
  metadata?: BookMetadata;
  loading: boolean;
  validated: boolean;
}

const PhotoScanModal: React.FC<PhotoScanModalProps> = ({ isOpen, onClose, onBooksDetected }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [detectedBooks, setDetectedBooks] = useState<DetectedBook[]>([]);
  const [extractingMetadata, setExtractingMetadata] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const extractBookTitles = (text: string): string[] => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const bookTitles: string[] = [];

    // Common book title patterns
    const titlePatterns = [
      /^[A-Z][a-zA-Z\s:&-]{10,}/,  // Starts with capital, has reasonable length
      /[A-Z][a-zA-Z\s]{5,}(?=\s+by|\s+By|\s+BY)/,  // Title followed by "by author"
      /^"[^"]+"/,  // Quoted titles
      /^[A-Z][^.!?]*[a-z]/,  // Starts with capital, ends with lowercase (likely title)
    ];

    // Filter out common non-title words
    const excludeWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];

    for (const line of lines) {
      // Skip very short lines or lines that look like ISBNs
      if (line.length < 8 || /^\d{10,13}$/.test(line.replace(/[-\s]/g, ''))) {
        continue;
      }

      // Check if line matches title patterns
      const matchesPattern = titlePatterns.some(pattern => pattern.test(line));

      if (matchesPattern) {
        // Clean up the title
        let cleanTitle = line
          .replace(/^\d+\.?\s*/, '') // Remove leading numbers
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim();

        // Remove "by Author" suffix if present
        cleanTitle = cleanTitle.replace(/\s+by\s+.+$/i, '');

        if (cleanTitle.length >= 8) {
          bookTitles.push(cleanTitle);
        }
      }
    }

    // Remove duplicates and return unique titles
    return Array.from(new Set(bookTitles)).slice(0, 10); // Limit to 10 books max
  };

  const performOCR = async () => {
    if (!selectedFile) return;

    setScanning(true);
    setOcrProgress(0);
    setDetectedBooks([]);

    try {
      const result = await Tesseract.recognize(selectedFile, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });

      const extractedTitles = extractBookTitles(result.data.text);

      const books: DetectedBook[] = extractedTitles.map(title => ({
        title,
        confidence: 0.8, // Base confidence for OCR extraction
        loading: false,
        validated: false,
      }));

      setDetectedBooks(books);
    } catch (error) {
      console.error('OCR failed:', error);
      alert('Failed to scan image. Please try again with a clearer image.');
    } finally {
      setScanning(false);
      setOcrProgress(0);
    }
  };

  const fetchBookMetadata = async (bookIndex: number) => {
    const book = detectedBooks[bookIndex];
    if (!book || book.loading) return;

    const updatedBooks = [...detectedBooks];
    updatedBooks[bookIndex] = { ...book, loading: true };
    setDetectedBooks(updatedBooks);

    try {
      // Create a search query for the book
      const searchQuery = `${book.title} book`;
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

      // Try to extract metadata (this is a simplified approach)
      // In a real app, you'd use a proper book API like Google Books API
      const metadata: BookMetadata = {
        title: book.title,
        author: 'Unknown Author',
        description: `Book detected from image scan: ${book.title}`,
        imageUrl: '',
      };

      updatedBooks[bookIndex] = {
        ...book,
        metadata,
        loading: false,
        validated: true,
      };
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
      updatedBooks[bookIndex] = { ...book, loading: false };
    }

    setDetectedBooks(updatedBooks);
  };

  const handleValidateAll = async () => {
    setExtractingMetadata(true);

    for (let i = 0; i < detectedBooks.length; i++) {
      if (!detectedBooks[i].validated) {
        await fetchBookMetadata(i);
      }
    }

    setExtractingMetadata(false);
  };

  const handleAddSelectedBooks = () => {
    const validatedBooks = detectedBooks
      .filter(book => book.validated && book.metadata)
      .map(book => book.metadata!);

    onBooksDetected(validatedBooks);
    handleClose();
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview('');
    setDetectedBooks([]);
    setScanning(false);
    setOcrProgress(0);
    setExtractingMetadata(false);
    onClose();
  };

  const toggleBookSelection = (index: number) => {
    const updatedBooks = [...detectedBooks];
    updatedBooks[index] = { ...updatedBooks[index], validated: !updatedBooks[index].validated };
    setDetectedBooks(updatedBooks);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="photo-scan-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📸 Scan Books from Photo</h3>
          <button onClick={handleClose} className="close-btn">×</button>
        </div>

        <div className="modal-content">
          {!selectedFile ? (
            <div className="upload-section">
              <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
                <div className="upload-icon">📷</div>
                <h4>Upload Photo of Your Bookshelf</h4>
                <p>Take a clear photo of book spines and we'll extract the titles for you</p>
                <button type="button" className="upload-btn">
                  Choose Photo
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className="scan-section">
              <div className="image-preview">
                <img src={preview} alt="Selected" />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview('');
                    setDetectedBooks([]);
                  }}
                  className="change-photo-btn"
                >
                  Change Photo
                </button>
              </div>

              {!scanning && detectedBooks.length === 0 && (
                <button onClick={performOCR} className="scan-btn">
                  🔍 Scan for Book Titles
                </button>
              )}

              {scanning && (
                <div className="scanning-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${ocrProgress}%` }}
                    ></div>
                  </div>
                  <p>Scanning image... {ocrProgress}%</p>
                </div>
              )}

              {detectedBooks.length > 0 && (
                <div className="detected-books">
                  <div className="books-header">
                    <h4>Detected Books ({detectedBooks.length})</h4>
                    <div className="action-buttons">
                      <button
                        onClick={handleValidateAll}
                        disabled={extractingMetadata}
                        className="validate-all-btn"
                      >
                        {extractingMetadata ? 'Getting Details...' : '📚 Get Book Details'}
                      </button>
                      <button
                        onClick={handleAddSelectedBooks}
                        disabled={!detectedBooks.some(book => book.validated)}
                        className="add-selected-btn"
                      >
                        Add Selected Books ({detectedBooks.filter(b => b.validated).length})
                      </button>
                    </div>
                  </div>

                  <div className="books-list">
                    {detectedBooks.map((book, index) => (
                      <div key={index} className={`book-item ${book.validated ? 'validated' : ''}`}>
                        <div className="book-checkbox">
                          <input
                            type="checkbox"
                            checked={book.validated}
                            onChange={() => toggleBookSelection(index)}
                          />
                        </div>
                        <div className="book-info">
                          <div className="book-title">{book.title}</div>
                          {book.metadata && (
                            <div className="book-author">by {book.metadata.author}</div>
                          )}
                        </div>
                        <div className="book-actions">
                          {book.loading ? (
                            <div className="loading-spinner">⏳</div>
                          ) : !book.metadata ? (
                            <button
                              onClick={() => fetchBookMetadata(index)}
                              className="get-details-btn"
                            >
                              Get Details
                            </button>
                          ) : (
                            <div className="status-indicator">✅</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoScanModal;