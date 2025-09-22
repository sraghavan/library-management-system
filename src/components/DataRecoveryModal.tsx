import React, { useState, useRef } from 'react';
import { DataRecoveryService, BackupData } from '../services/dataRecovery';
import { useLibrary } from '../context/LibraryContext';
import './DataRecoveryModal.css';

interface DataRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DataRecoveryModal: React.FC<DataRecoveryModalProps> = ({ isOpen, onClose }) => {
  const { dispatch } = useLibrary();
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      const availableBackups = DataRecoveryService.findAllBackups();
      setBackups(availableBackups);
      setMessage('');
    }
  }, [isOpen]);

  const handleRecoverFromBackup = (backup: BackupData) => {
    try {
      dispatch({
        type: 'LOAD_DATA',
        payload: {
          books: backup.books,
          users: backup.users
        }
      });
      setMessage(`✅ Successfully recovered ${backup.books.length} books and ${backup.users.length} users from ${backup.version}`);

      // Close after a delay to show the success message
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setMessage(`❌ Failed to recover data: ${error}`);
    }
  };

  const handleAutoRecover = () => {
    setLoading(true);
    try {
      const recovered = DataRecoveryService.recoverData();
      if (recovered) {
        dispatch({
          type: 'LOAD_DATA',
          payload: recovered
        });
        setMessage(`✅ Auto-recovery successful! Restored ${recovered.books.length} books and ${recovered.users.length} users.`);

        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setMessage('❌ No recoverable data found in localStorage.');
      }
    } catch (error) {
      setMessage(`❌ Auto-recovery failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportEmergencyBackup = () => {
    try {
      DataRecoveryService.exportEmergencyBackup();
      setMessage('💾 Emergency backup exported to downloads folder.');
    } catch (error) {
      setMessage(`❌ Export failed: ${error}`);
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const recovered = await DataRecoveryService.importEmergencyBackup(file);
      dispatch({
        type: 'LOAD_DATA',
        payload: recovered
      });
      setMessage(`✅ Successfully imported ${recovered.books.length} books and ${recovered.users.length} users from backup file.`);

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setMessage(`❌ Import failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const storageInfo = DataRecoveryService.getStorageInfo();

  if (!isOpen) return null;

  return (
    <div className="data-recovery-overlay" onClick={onClose}>
      <div className="data-recovery-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🔄 Data Recovery Center</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="modal-content">
          <div className="recovery-section">
            <h4>Storage Information</h4>
            <div className="storage-info">
              <div className="info-item">
                <span className="label">Main Data Available:</span>
                <span className={`value ${storageInfo.mainData ? 'success' : 'error'}`}>
                  {storageInfo.mainData ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Total Backup Keys:</span>
                <span className="value">{storageInfo.totalKeys}</span>
              </div>
              <div className="info-item">
                <span className="label">Estimated Size:</span>
                <span className="value">{Math.round(storageInfo.estimatedSize / 1024)} KB</span>
              </div>
            </div>
          </div>

          {message && (
            <div className={`message ${message.includes('❌') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <div className="recovery-section">
            <h4>Quick Recovery</h4>
            <p>Try to automatically recover from the best available backup:</p>
            <button
              onClick={handleAutoRecover}
              disabled={loading}
              className="recovery-btn primary"
            >
              {loading ? '🔄 Recovering...' : '🚀 Auto-Recover Data'}
            </button>
          </div>

          {backups.length > 0 && (
            <div className="recovery-section">
              <h4>Available Backups ({backups.length})</h4>
              <div className="backups-list">
                {backups.map((backup, index) => (
                  <div key={index} className="backup-item">
                    <div className="backup-info">
                      <div className="backup-version">{backup.version}</div>
                      <div className="backup-details">
                        📚 {backup.books.length} books • 👥 {backup.users.length} users
                      </div>
                      <div className="backup-timestamp">
                        {new Date(backup.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRecoverFromBackup(backup)}
                      className="recovery-btn secondary"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="recovery-section">
            <h4>Emergency Backup</h4>
            <div className="emergency-actions">
              <button
                onClick={handleExportEmergencyBackup}
                className="recovery-btn secondary"
              >
                💾 Export All Backups
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="recovery-btn secondary"
              >
                📥 Import Backup File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <div className="recovery-section danger">
            <h4>⚠️ Danger Zone</h4>
            <p>Only use if you want to completely start over:</p>
            <button
              onClick={() => {
                if (window.confirm('This will permanently delete ALL data. Are you sure?')) {
                  DataRecoveryService.clearAllData();
                  setMessage('🗑️ All data cleared. Page will reload.');
                  setTimeout(() => window.location.reload(), 1000);
                }
              }}
              className="recovery-btn danger"
            >
              🗑️ Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataRecoveryModal;