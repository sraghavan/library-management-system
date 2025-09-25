import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LibraryProvider } from './context/LibraryContext';
import BooksPage from './pages/BooksPage';
import UsersPage from './pages/UsersPage';
import { DatabaseTest } from './components/DatabaseTest';
import { DataSourceStatus } from './components/DataSourceStatus';
import './App.css';

function App() {
  return (
    <LibraryProvider>
      <Router>
        <div className="App">
          <DatabaseTest />
          <DataSourceStatus position="top-left" />
          <Routes>
            <Route path="/" element={<BooksPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </LibraryProvider>
  );
}

export default App;
