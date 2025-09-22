import { Book, User } from '../types';

export interface BackupData {
  books: Book[];
  users: User[];
  timestamp: number;
  version: string;
}

export class DataRecoveryService {
  private static readonly STORAGE_KEYS = [
    'libraryData',
    'libraryDataBackup',
    'libraryDataEmergency'
  ];

  // Find all available backups
  static findAllBackups(): BackupData[] {
    const backups: BackupData[] = [];

    // Check main storage keys
    this.STORAGE_KEYS.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          backups.push({
            books: parsed.books || [],
            users: parsed.users || [],
            timestamp: parsed.timestamp || Date.now(),
            version: key
          });
        }
      } catch (error) {
        console.warn(`Failed to parse backup from ${key}:`, error);
      }
    });

    // Check timestamped backups
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('libraryData_')) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            backups.push({
              books: parsed.books || [],
              users: parsed.users || [],
              timestamp: parsed.timestamp || parseInt(key.split('_')[1]) || Date.now(),
              version: key
            });
          }
        } catch (error) {
          console.warn(`Failed to parse timestamped backup from ${key}:`, error);
        }
      }
    });

    // Sort by timestamp (newest first)
    return backups.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Get the best available backup
  static getBestBackup(): BackupData | null {
    const backups = this.findAllBackups();

    // Find backup with most data
    let bestBackup = backups.reduce((best, current) => {
      const bestCount = (best?.books.length || 0) + (best?.users.length || 0);
      const currentCount = current.books.length + current.users.length;
      return currentCount > bestCount ? current : best;
    }, backups[0] || null);

    return bestBackup;
  }

  // Recover data from best available backup
  static recoverData(): { books: Book[]; users: User[] } | null {
    const backup = this.getBestBackup();
    if (backup) {
      console.log('🔄 Recovering data from backup:', {
        version: backup.version,
        books: backup.books.length,
        users: backup.users.length,
        timestamp: new Date(backup.timestamp).toLocaleString()
      });

      return {
        books: backup.books,
        users: backup.users
      };
    }
    return null;
  }

  // Export all data to file as emergency backup
  static exportEmergencyBackup(): void {
    try {
      const allBackups = this.findAllBackups();
      const exportData = {
        backups: allBackups,
        exportedAt: new Date().toISOString(),
        recoverInstructions: 'Import this file in case of data loss. Contact support for recovery assistance.'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `library-emergency-backup-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('💾 Emergency backup exported successfully');
    } catch (error) {
      console.error('❌ Failed to export emergency backup:', error);
    }
  }

  // Import data from emergency backup file
  static importEmergencyBackup(file: File): Promise<{ books: Book[]; users: User[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);

          // Find the backup with most data
          const bestBackup = parsed.backups.reduce((best: any, current: any) => {
            const bestCount = (best?.books?.length || 0) + (best?.users?.length || 0);
            const currentCount = (current?.books?.length || 0) + (current?.users?.length || 0);
            return currentCount > bestCount ? current : best;
          }, parsed.backups[0] || null);

          if (bestBackup) {
            resolve({
              books: bestBackup.books || [],
              users: bestBackup.users || []
            });
          } else {
            reject(new Error('No valid backup data found in file'));
          }
        } catch (error) {
          reject(new Error('Invalid backup file format'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read backup file'));
      reader.readAsText(file);
    });
  }

  // Clear all corrupted data and start fresh
  static clearAllData(): void {
    try {
      // Remove all library-related localStorage entries
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('libraryData')) {
          localStorage.removeItem(key);
        }
      });
      console.log('🗑️ All library data cleared from localStorage');
    } catch (error) {
      console.error('❌ Failed to clear data:', error);
    }
  }

  // Get storage usage information
  static getStorageInfo(): {
    totalKeys: number;
    mainData: boolean;
    backupKeys: string[];
    estimatedSize: number;
  } {
    const backupKeys = Object.keys(localStorage).filter(key =>
      key.startsWith('libraryData')
    );

    let estimatedSize = 0;
    backupKeys.forEach(key => {
      const data = localStorage.getItem(key);
      estimatedSize += data ? data.length : 0;
    });

    return {
      totalKeys: backupKeys.length,
      mainData: localStorage.getItem('libraryData') !== null,
      backupKeys,
      estimatedSize
    };
  }
}