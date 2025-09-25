import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';

export const DatabaseTest: React.FC = () => {
  const { state, loadFromAPI, addBookToAPI, addUserToAPI } = useLibrary();
  const [testResult, setTestResult] = useState<string>('');

  const runAPITest = async () => {
    try {
      setTestResult('🔄 Testing API connection...');

      // Test loading data from API
      await loadFromAPI();
      setTestResult(prev => prev + '\n✅ Loaded data from API');

      // Test adding a user
      const testUser = {
        name: 'Test User API',
        email: 'testapi@example.com',
        phone: '555-API'
      };
      await addUserToAPI(testUser);
      setTestResult(prev => prev + '\n✅ Added test user to API');

      // Test adding a book
      const testBook = {
        title: 'API Test Book',
        author: 'Test Author',
        isbn: '123-API',
        description: 'A book for testing API integration',
        genre: 'Test',
        imageUrl: '',
        isAvailable: true,
        publishedDate: '2024'
      };
      await addBookToAPI(testBook);
      setTestResult(prev => prev + '\n✅ Added test book to API');

      setTestResult(prev => prev + '\n\n🎉 All API tests passed!');
      setTestResult(prev => prev + `\nBooks in state: ${state.books.length}`);
      setTestResult(prev => prev + `\nUsers in state: ${state.users.length}`);

    } catch (error) {
      setTestResult(prev => prev + `\n❌ API test failed: ${error}`);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'white',
      border: '2px solid #ddd',
      borderRadius: '8px',
      padding: '15px',
      maxWidth: '300px',
      zIndex: 10000,
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h3>🔧 Database Test Panel</h3>
      <button
        onClick={runDatabaseTest}
        style={{
          background: '#007bff',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '10px'
        }}
      >
        Test Neon Database
      </button>

      <button
        onClick={() => loadFromDatabase()}
        style={{
          background: '#28a745',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginLeft: '8px',
          marginBottom: '10px'
        }}
      >
        Load from DB
      </button>

      {state.loading && <div style={{color: '#ffc107'}}>⏳ Loading...</div>}
      {state.error && <div style={{color: '#dc3545'}}>❌ {state.error}</div>}

      <div style={{
        background: '#f8f9fa',
        padding: '8px',
        borderRadius: '4px',
        marginTop: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
        maxHeight: '200px',
        overflow: 'auto'
      }}>
        <strong>Status:</strong>
        <br />
        Books: {state.books.length} | Users: {state.users.length}
        <br />
        <br />
        {testResult}
      </div>
    </div>
  );
};