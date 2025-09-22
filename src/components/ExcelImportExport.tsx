import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLibrary } from '../context/LibraryContext';
import { exportToExcel, exportBooksToExcel, exportUsersToExcel, importFromExcel, downloadTemplate, downloadBooksTemplate, downloadUsersTemplate, ImportResult } from '../services/excelService';
import './ExcelImportExport.css';

interface ExcelImportExportProps {
  type?: 'books' | 'users' | 'both';
}

const ExcelImportExport: React.FC<ExcelImportExportProps> = ({ type = 'both' }) => {
  const { state, dispatch } = useLibrary();
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showImportResult, setShowImportResult] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportBooks = () => {
    try {
      exportBooksToExcel(state.books);
      alert('Books exported successfully!');
    } catch (error) {
      console.error('Books export failed:', error);
      alert('Failed to export books. Please try again.');
    }
  };

  const handleExportUsers = () => {
    try {
      exportUsersToExcel(state.users);
      alert('Users exported successfully!');
    } catch (error) {
      console.error('Users export failed:', error);
      alert('Failed to export users. Please try again.');
    }
  };

  const handleExport = () => {
    try {
      exportToExcel(state.books, state.users);
      alert('Data exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const result = await importFromExcel(file);
      setImportResult(result);
      setShowImportResult(true);
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import data. Please check your file format and try again.');
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmImport = () => {
    if (!importResult) return;

    // Force immediate save to localStorage FIRST
    try {
      const dataToSave = {
        books: importResult.books,
        users: importResult.users,
        timestamp: Date.now()
      };
      localStorage.setItem('libraryData', JSON.stringify(dataToSave));

      // Also save to backup keys
      localStorage.setItem('libraryDataBackup', JSON.stringify(dataToSave));
      localStorage.setItem(`libraryData_${Date.now()}`, JSON.stringify(dataToSave));

      console.log('🔥 TRIPLE SAVE - Import data saved to localStorage:', {
        books: importResult.books.length,
        users: importResult.users.length,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.error('❌ Error force-saving import data:', error);
    }

    // Then update state
    dispatch({ type: 'LOAD_DATA', payload: { books: importResult.books, users: importResult.users } });

    setShowImportResult(false);
    setImportResult(null);
    alert(`Import completed! Added ${importResult.books.length} books and ${importResult.users.length} users.`);
  };

  const handleMergeImport = () => {
    if (!importResult) return;

    // Add imported books (avoid duplicates by checking IDs)
    const existingBookIds = new Set(state.books.map(book => book.id));
    const newBooks = importResult.books.filter(book => !existingBookIds.has(book.id));
    const mergedBooks = [...state.books, ...newBooks];

    // Add imported users (avoid duplicates by checking IDs)
    const existingUserIds = new Set(state.users.map(user => user.id));
    const newUsers = importResult.users.filter(user => !existingUserIds.has(user.id));
    const mergedUsers = [...state.users, ...newUsers];

    // Force immediate save to localStorage FIRST
    try {
      const dataToSave = {
        books: mergedBooks,
        users: mergedUsers,
        timestamp: Date.now()
      };
      localStorage.setItem('libraryData', JSON.stringify(dataToSave));

      // Also save to backup keys
      localStorage.setItem('libraryDataBackup', JSON.stringify(dataToSave));
      localStorage.setItem(`libraryData_${Date.now()}`, JSON.stringify(dataToSave));

      console.log('🔥 TRIPLE MERGE SAVE - Import data saved to localStorage:', {
        totalBooks: mergedBooks.length,
        totalUsers: mergedUsers.length,
        newBooks: newBooks.length,
        newUsers: newUsers.length,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.error('❌ Error force-saving merge data:', error);
    }

    // Then dispatch LOAD_DATA with merged data for atomic update
    dispatch({ type: 'LOAD_DATA', payload: { books: mergedBooks, users: mergedUsers } });

    setShowImportResult(false);
    setImportResult(null);
    alert(`Merge completed! Added ${newBooks.length} new books and ${newUsers.length} new users.`);
  };

  const handleCancelImport = () => {
    setShowImportResult(false);
    setImportResult(null);
  };

  const handleDownloadTemplate = () => {
    if (type === 'books') {
      downloadBooksTemplate();
    } else if (type === 'users') {
      downloadUsersTemplate();
    } else {
      downloadTemplate();
    }
  };

  return (
    <>
      <div className="excel-icons">
        {(type === 'both' || type === 'books') && (
          <button
            onClick={handleExportBooks}
            className="icon-btn"
            title="Export Books to Excel"
          >
            📚
          </button>
        )}

        {(type === 'both' || type === 'users') && (
          <button
            onClick={handleExportUsers}
            className="icon-btn"
            title="Export Users to Excel"
          >
            👥
          </button>
        )}

        {type === 'both' && (
          <button
            onClick={handleExport}
            className="icon-btn"
            title="Export All Data to Excel"
          >
            📊
          </button>
        )}

        <button
          onClick={() => fileInputRef.current?.click()}
          className="icon-btn"
          disabled={importing}
          title="Import from Excel"
        >
          {importing ? '⏳' : '📥'}
        </button>

        <button
          onClick={handleDownloadTemplate}
          className="icon-btn"
          title="Download Excel Template"
        >
          📋
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleImportFile}
          style={{ display: 'none' }}
        />
      </div>

      {showImportResult && importResult && createPortal(
        <div className="import-overlay">
          <div className="import-result-modal">
            <div className="modal-header">
              <h3>Import Results</h3>
              <button onClick={handleCancelImport} className="close-btn">×</button>
            </div>

            <div className="modal-content">
              <div className="import-summary">
                <div className="summary-item">
                  <span className="summary-label">Books found:</span>
                  <span className="summary-value">{importResult.books.length}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Users found:</span>
                  <span className="summary-value">{importResult.users.length}</span>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="summary-item error">
                    <span className="summary-label">Errors:</span>
                    <span className="summary-value">{importResult.errors.length}</span>
                  </div>
                )}
              </div>

              {importResult.errors.length > 0 && (
                <div className="errors-section">
                  <h4>Import Errors:</h4>
                  <ul className="error-list">
                    {importResult.errors.map((error, index) => (
                      <li key={index} className="error-item">{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="import-options">
                <h4>How would you like to proceed?</h4>
                <div className="option-buttons">
                  <button onClick={handleConfirmImport} className="replace-btn">
                    🔄 Replace All Data
                  </button>
                  <button onClick={handleMergeImport} className="merge-btn">
                    ➕ Merge with Existing
                  </button>
                  <button onClick={handleCancelImport} className="cancel-btn">
                    ❌ Cancel
                  </button>
                </div>
                <div className="option-descriptions">
                  <p><strong>Replace:</strong> Remove all current data and import new data</p>
                  <p><strong>Merge:</strong> Add imported data to existing data (skip duplicates)</p>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.getElementById('modal-root')!
      )}
    </>
  );
};

export default ExcelImportExport;