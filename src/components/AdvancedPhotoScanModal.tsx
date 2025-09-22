import React, { useState, useRef } from 'react';
import { extractBookMetadata } from '../services/bookMetadata';
import { advancedOCR, BookSpine, TextRegion } from '../services/advancedOCR';
import { BookMetadata } from '../types';
import './AdvancedPhotoScanModal.css';

interface AdvancedPhotoScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBooksDetected: (books: BookMetadata[]) => void;
}

interface DetectedBook extends BookSpine {
  metadata?: BookMetadata;
  loading: boolean;
  selected: boolean;
}

const AdvancedPhotoScanModal: React.FC<AdvancedPhotoScanModalProps> = ({
  isOpen,
  onClose,
  onBooksDetected,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [detectedBooks, setDetectedBooks] = useState<DetectedBook[]>([]);
  const [textRegions, setTextRegions] = useState<TextRegion[]>([]);
  const [visualizationUrl, setVisualizationUrl] = useState<string>('');
  const [extractingMetadata, setExtractingMetadata] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
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

      // Reset previous results
      setDetectedBooks([]);
      setTextRegions([]);
      setVisualizationUrl('');
    }
  };

  const performAdvancedOCR = async () => {
    if (!selectedFile) return;

    setScanning(true);
    setScanProgress(0);
    setDetectedBooks([]);

    try {
      const result = await advancedOCR.processBookshelfImage(
        selectedFile,
        (progress) => setScanProgress(Math.round(progress))
      );

      // Convert BookSpines to DetectedBooks
      const books: DetectedBook[] = result.bookSpines.map(spine => ({
        ...spine,
        loading: false,
        selected: true, // Auto-select all detected books
      }));

      setDetectedBooks(books);
      setTextRegions(result.textRegions);

      // Create visualization
      if (preview) {
        const img = new Image();
        img.onload = async () => {
          const visualUrl = await advancedOCR.createVisualization(
            preview,
            result.bookSpines,
            img.width,
            img.height
          );
          setVisualizationUrl(visualUrl);
        };
        img.src = preview;
      }

    } catch (error) {
      console.error('Advanced OCR failed:', error);
      alert('Failed to scan image. Please try again with a clearer image.');
    } finally {
      setScanning(false);
      setScanProgress(0);
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
      const searchQuery = `"${book.title}" book`;

      // For now, create basic metadata since we can't search actual APIs in this environment
      const metadata: BookMetadata = {
        title: book.title,
        author: 'Unknown Author', // Would normally extract from additional OCR or API
        description: `Book detected from advanced OCR scan: ${book.title}`,
        imageUrl: '',
      };

      updatedBooks[bookIndex] = {
        ...book,
        metadata,
        loading: false,
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
      if (!detectedBooks[i].metadata) {
        await fetchBookMetadata(i);
      }
    }

    setExtractingMetadata(false);
  };

  const handleAddSelectedBooks = () => {
    const selectedBooks = detectedBooks
      .filter(book => book.selected && book.metadata)
      .map(book => book.metadata!);

    onBooksDetected(selectedBooks);
    handleClose();
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview('');
    setDetectedBooks([]);
    setTextRegions([]);
    setVisualizationUrl('');
    setScanning(false);
    setScanProgress(0);
    setExtractingMetadata(false);
    setShowVisualization(false);
    onClose();
  };

  const toggleBookSelection = (index: number) => {
    const updatedBooks = [...detectedBooks];
    updatedBooks[index] = {
      ...updatedBooks[index],
      selected: !updatedBooks[index].selected
    };
    setDetectedBooks(updatedBooks);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="advanced-photo-scan-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📸 Advanced Book Spine Scanner</h3>
          <button onClick={handleClose} className="close-btn">×</button>
        </div>

        <div className="modal-content">
          {!selectedFile ? (
            <div className="upload-section">
              <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
                <div className="upload-icon">📷</div>
                <h4>Upload Photo of Your Bookshelf</h4>
                <p>Advanced OCR will detect book spines with better accuracy and boundary detection</p>
                <div className="features-list">
                  <div className="feature">✨ Enhanced text detection</div>
                  <div className="feature">🔄 Handles horizontal & vertical text</div>
                  <div className="feature">📐 Smart boundary detection</div>
                  <div className="feature">🎯 Individual book separation</div>
                </div>
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
              <div className="image-preview-section">
                <div className="preview-controls">
                  <button
                    onClick={() => setShowVisualization(!showVisualization)}
                    disabled={!visualizationUrl}
                    className="toggle-view-btn"
                  >
                    {showVisualization ? '🖼️ Original' : '🎯 Show Detection'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview('');
                      setDetectedBooks([]);
                      setVisualizationUrl('');
                    }}
                    className="change-photo-btn"
                  >
                    Change Photo
                  </button>
                </div>

                <div className="image-preview">
                  <img
                    src={showVisualization && visualizationUrl ? visualizationUrl : preview}
                    alt="Book scan preview"
                  />
                </div>
              </div>

              {!scanning && detectedBooks.length === 0 && (
                <button onClick={performAdvancedOCR} className="scan-btn">
                  🚀 Start Advanced Scan
                </button>
              )}

              {scanning && (
                <div className="scanning-progress">
                  <div className="progress-header">
                    <h4>Processing with Advanced OCR...</h4>
                    <span className="progress-percent">{scanProgress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${scanProgress}%` }}
                    ></div>
                  </div>
                  <div className="progress-steps">
                    <div className={`step ${scanProgress >= 10 ? 'completed' : ''}`}>
                      Image Preprocessing
                    </div>
                    <div className={`step ${scanProgress >= 30 ? 'completed' : ''}`}>
                      OCR Text Detection
                    </div>
                    <div className={`step ${scanProgress >= 85 ? 'completed' : ''}`}>
                      Boundary Analysis
                    </div>
                    <div className={`step ${scanProgress >= 90 ? 'completed' : ''}`}>
                      Book Spine Detection
                    </div>
                  </div>
                </div>
              )}

              {detectedBooks.length > 0 && (
                <div className="detected-books">
                  <div className="books-header">
                    <h4>📚 Detected Book Spines ({detectedBooks.length})</h4>
                    <div className="detection-stats">
                      <span className="stat">
                        Avg Confidence: {Math.round(
                          detectedBooks.reduce((sum, book) => sum + book.confidence, 0) / detectedBooks.length
                        )}%
                      </span>
                      <span className="stat">
                        Text Regions: {textRegions.length}
                      </span>
                    </div>
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
                        disabled={!detectedBooks.some(book => book.selected)}
                        className="add-selected-btn"
                      >
                        Add Selected ({detectedBooks.filter(b => b.selected).length})
                      </button>
                    </div>
                  </div>

                  <div className="books-list">
                    {detectedBooks.map((book, index) => (
                      <div key={index} className={`book-item ${book.selected ? 'selected' : ''}`}>
                        <div className="book-checkbox">
                          <input
                            type="checkbox"
                            checked={book.selected}
                            onChange={() => toggleBookSelection(index)}
                          />
                        </div>
                        <div className="book-info">
                          <div className="book-title">{book.title}</div>
                          <div className="book-details">
                            <span className="confidence">
                              Confidence: {Math.round(book.confidence)}%
                            </span>
                            <span className="orientation">
                              {book.orientation === 'vertical' ? '↕️' : '↔️'} {book.orientation}
                            </span>
                            <span className="regions">
                              {book.textRegions.length} regions
                            </span>
                          </div>
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

export default AdvancedPhotoScanModal;