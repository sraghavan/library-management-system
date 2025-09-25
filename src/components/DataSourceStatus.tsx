import React, { useState, useEffect } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { Book, User } from '../types';

interface DataSourceStatusProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

interface DataDiff {
  books: {
    onlyInDB: Book[];
    onlyInCache: Book[];
    different: Array<{ db: Book; cache: Book; differences: string[] }>;
    identical: number;
  };
  users: {
    onlyInDB: User[];
    onlyInCache: User[];
    different: Array<{ db: User; cache: User; differences: string[] }>;
    identical: number;
  };
}

export const DataSourceStatus: React.FC<DataSourceStatusProps> = ({
  position = 'top-left'
}) => {
  const { state, loadFromAPI } = useLibrary();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [dbData, setDbData] = useState<{ books: Book[]; users: User[] } | null>(null);
  const [cacheData, setCacheData] = useState<{ books: Book[]; users: User[] } | null>(null);
  const [dataDiff, setDataDiff] = useState<DataDiff | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [dataSource, setDataSource] = useState<'cache' | 'db' | 'mixed'>('cache');

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Determine current data source
  useEffect(() => {
    const hasLocalData = state.books.length > 0 || state.users.length > 0;
    if (hasLocalData && !lastSync) {
      setDataSource('cache');
    } else if (hasLocalData && lastSync) {
      setDataSource('mixed');
    } else {
      setDataSource('db');
    }
  }, [state.books.length, state.users.length, lastSync]);

  // Get cache data (localStorage)
  const getCacheData = () => {
    try {
      const saved = localStorage.getItem('libraryData');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          books: parsed.books || [],
          users: parsed.users || []
        };
      }
    } catch (error) {
      console.error('Error reading cache:', error);
    }
    return { books: [], users: [] };
  };

  // Fetch DB data
  const fetchDbData = async () => {
    try {
      const [booksResponse, usersResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/books`),
        fetch(`${API_BASE_URL}/api/users`)
      ]);

      const books = await booksResponse.json();
      const users = await usersResponse.json();

      return { books, users };
    } catch (error) {
      console.error('Error fetching DB data:', error);
      return { books: [], users: [] };
    }
  };

  // Compare data and generate diff
  const generateDiff = (dbBooks: Book[], cacheBooks: Book[], dbUsers: User[], cacheUsers: User[]): DataDiff => {
    const booksDiff = {
      onlyInDB: dbBooks.filter(db => !cacheBooks.find(cache => cache.id === db.id)),
      onlyInCache: cacheBooks.filter(cache => !dbBooks.find(db => db.id === cache.id)),
      different: [] as Array<{ db: Book; cache: Book; differences: string[] }>,
      identical: 0
    };

    const usersDiff = {
      onlyInDB: dbUsers.filter(db => !cacheUsers.find(cache => cache.id === db.id)),
      onlyInCache: cacheUsers.filter(cache => !dbUsers.find(db => db.id === cache.id)),
      different: [] as Array<{ db: User; cache: User; differences: string[] }>,
      identical: 0
    };

    // Compare books
    dbBooks.forEach(dbBook => {
      const cacheBook = cacheBooks.find(c => c.id === dbBook.id);
      if (cacheBook) {
        const differences: string[] = [];
        Object.keys(dbBook).forEach(key => {
          if (dbBook[key as keyof Book] !== cacheBook[key as keyof Book]) {
            differences.push(key);
          }
        });

        if (differences.length > 0) {
          booksDiff.different.push({ db: dbBook, cache: cacheBook, differences });
        } else {
          booksDiff.identical++;
        }
      }
    });

    // Compare users
    dbUsers.forEach(dbUser => {
      const cacheUser = cacheUsers.find(c => c.id === dbUser.id);
      if (cacheUser) {
        const differences: string[] = [];
        Object.keys(dbUser).forEach(key => {
          if (JSON.stringify(dbUser[key as keyof User]) !== JSON.stringify(cacheUser[key as keyof User])) {
            differences.push(key);
          }
        });

        if (differences.length > 0) {
          usersDiff.different.push({ db: dbUser, cache: cacheUser, differences });
        } else {
          usersDiff.identical++;
        }
      }
    });

    return { books: booksDiff, users: usersDiff };
  };

  // Run diff comparison
  const runDiff = async () => {
    setIsLoading(true);
    try {
      const cache = getCacheData();
      const db = await fetchDbData();

      setCacheData(cache);
      setDbData(db);

      const diff = generateDiff(db.books, cache.books, db.users, cache.users);
      setDataDiff(diff);
      setShowDiff(true);
    } catch (error) {
      console.error('Error running diff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync data from DB
  const syncFromDB = async () => {
    setIsLoading(true);
    try {
      await loadFromAPI();
      setLastSync(new Date());
    } catch (error) {
      console.error('Error syncing from DB:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPositionStyles = () => {
    const base = {
      position: 'fixed' as const,
      zIndex: 10000,
      background: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      borderRadius: '8px',
      padding: '10px',
      fontSize: '12px',
      fontFamily: 'monospace',
      backdropFilter: 'blur(5px)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    };

    switch (position) {
      case 'top-left': return { ...base, top: '10px', left: '10px' };
      case 'top-right': return { ...base, top: '10px', right: '10px' };
      case 'bottom-left': return { ...base, bottom: '10px', left: '10px' };
      case 'bottom-right': return { ...base, bottom: '10px', right: '10px' };
      default: return { ...base, top: '10px', left: '10px' };
    }
  };

  const getDataSourceIcon = () => {
    switch (dataSource) {
      case 'db': return '🗄️';
      case 'cache': return '💾';
      case 'mixed': return '🔄';
      default: return '❓';
    }
  };

  const getDataSourceColor = () => {
    switch (dataSource) {
      case 'db': return '#4CAF50';
      case 'cache': return '#FFC107';
      case 'mixed': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  return (
    <div style={getPositionStyles()}>
      {/* Collapsed View */}
      {!isExpanded && (
        <div
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={() => setIsExpanded(true)}
        >
          <span style={{ fontSize: '16px' }}>{getDataSourceIcon()}</span>
          <span style={{ color: getDataSourceColor(), fontWeight: 'bold' }}>
            {dataSource.toUpperCase()}
          </span>
          <span style={{ opacity: 0.7 }}>
            📚{state.books.length} 👥{state.users.length}
          </span>
        </div>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div style={{ minWidth: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{getDataSourceIcon()}</span>
              Data Source Status
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              ✕
            </button>
          </div>

          {/* Current Status */}
          <div style={{ marginBottom: '15px', padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
              <span style={{ color: getDataSourceColor(), fontWeight: 'bold' }}>
                Current Source: {dataSource.toUpperCase()}
              </span>
            </div>
            <div>📚 Books: {state.books.length} | 👥 Users: {state.users.length}</div>
            {lastSync && (
              <div style={{ fontSize: '10px', opacity: 0.7 }}>
                Last sync: {lastSync.toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
            <button
              onClick={syncFromDB}
              disabled={isLoading}
              style={{
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '11px',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              {isLoading ? '⏳' : '🔄'} Sync from DB
            </button>

            <button
              onClick={runDiff}
              disabled={isLoading}
              style={{
                background: '#FF9800',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '11px',
                opacity: isLoading ? 0.6 : 1
              }}
            >
              {isLoading ? '⏳' : '🔍'} Compare DB vs Cache
            </button>
          </div>

          {/* Diff Results */}
          {showDiff && dataDiff && dbData && cacheData && (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>📊 Comparison Results</h4>

              {/* Books Diff */}
              <div style={{ marginBottom: '15px' }}>
                <h5 style={{ margin: '0 0 5px 0', color: '#FFC107' }}>📚 Books</h5>
                <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                  <div>✅ Identical: {dataDiff.books.identical}</div>
                  <div>🆕 Only in DB: {dataDiff.books.onlyInDB.length}</div>
                  <div>💾 Only in Cache: {dataDiff.books.onlyInCache.length}</div>
                  <div>⚠️ Different: {dataDiff.books.different.length}</div>

                  {dataDiff.books.different.length > 0 && (
                    <details style={{ marginTop: '5px' }}>
                      <summary style={{ cursor: 'pointer' }}>Show differences</summary>
                      {dataDiff.books.different.map((diff, idx) => (
                        <div key={idx} style={{ margin: '5px 0', padding: '5px', background: 'rgba(255,193,7,0.2)', borderRadius: '3px' }}>
                          <div style={{ fontWeight: 'bold' }}>{diff.db.title}</div>
                          <div>Changed fields: {diff.differences.join(', ')}</div>
                        </div>
                      ))}
                    </details>
                  )}
                </div>
              </div>

              {/* Users Diff */}
              <div>
                <h5 style={{ margin: '0 0 5px 0', color: '#2196F3' }}>👥 Users</h5>
                <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                  <div>✅ Identical: {dataDiff.users.identical}</div>
                  <div>🆕 Only in DB: {dataDiff.users.onlyInDB.length}</div>
                  <div>💾 Only in Cache: {dataDiff.users.onlyInCache.length}</div>
                  <div>⚠️ Different: {dataDiff.users.different.length}</div>

                  {dataDiff.users.different.length > 0 && (
                    <details style={{ marginTop: '5px' }}>
                      <summary style={{ cursor: 'pointer' }}>Show differences</summary>
                      {dataDiff.users.different.map((diff, idx) => (
                        <div key={idx} style={{ margin: '5px 0', padding: '5px', background: 'rgba(33,150,243,0.2)', borderRadius: '3px' }}>
                          <div style={{ fontWeight: 'bold' }}>{diff.db.name}</div>
                          <div>Changed fields: {diff.differences.join(', ')}</div>
                        </div>
                      ))}
                    </details>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};