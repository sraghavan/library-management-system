import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Layout from '../components/Layout';
import { useLibrary } from '../context/LibraryContext';
import { User } from '../types';
import ExcelImportExport from '../components/ExcelImportExport';
import DataRecoveryModal from '../components/DataRecoveryModal';
import '../pages/RegisterPage.css';

const UsersPage: React.FC = () => {
  const { state, dispatch } = useLibrary();
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    notes: ''
  });
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editData, setEditData] = useState<{name?: string; email?: string; phone?: string}>({});
  const [sortField, setSortField] = useState<'name' | 'borrowedCount'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showRecovery, setShowRecovery] = useState(false);

  const handleNewUserChange = (field: string, value: string) => {
    setNewUser(prev => ({ ...prev, [field]: value }));
  };

  const handleNewUserSave = () => {
    if (newUser.name.trim()) {
      const user: User = {
        id: uuidv4(),
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        registrationDate: new Date().toISOString(),
        borrowedBooks: []
      };
      dispatch({ type: 'ADD_USER', payload: user });
      setNewUser({ name: '', email: '', phone: '', department: '', notes: '' });
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user.id);
    setEditData({
      name: user.name,
      email: user.email,
      phone: user.phone
    });
  };

  const saveEdit = () => {
    if (editingUser && editData.name && editData.name.trim()) {
      const updatedUser: User = {
        ...state.users.find(u => u.id === editingUser)!,
        name: editData.name,
        email: editData.email || '',
        phone: editData.phone || ''
      };
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    }
    setEditingUser(null);
    setEditData({});
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setEditData({});
  };

  const handleSort = (field: 'name' | 'borrowedCount') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getBorrowedBookTitles = (bookIds: string[]) => {
    if (bookIds.length === 0) return 'No books borrowed';
    const titles = bookIds.map(bookId => {
      const book = state.books.find(b => b.id === bookId);
      return book ? book.title : 'Unknown Book';
    });
    return titles.join('\n• ');
  };

  const sortedUsers = [...state.users].sort((a, b) => {
    let aValue, bValue;

    if (sortField === 'borrowedCount') {
      aValue = a.borrowedBooks.length;
      bValue = b.borrowedBooks.length;
    } else {
      aValue = a.name.toLowerCase();
      bValue = b.name.toLowerCase();
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
          <h3>👥 User Management</h3>
          <p>Manage library users - add new users or edit existing ones. All fields optional except name.</p>

          <div className="action-icons">
            <ExcelImportExport type="users" />
            <button
              onClick={() => setShowRecovery(true)}
              className="icon-btn"
              title="Data Recovery & Backup"
            >
              🔄
            </button>
          </div>
        </div>

        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  style={{ cursor: 'pointer' }}
                >
                  Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th>Email</th>
                <th>Phone</th>
                <th>Registration Date</th>
                <th
                  onClick={() => handleSort('borrowedCount')}
                  style={{ cursor: 'pointer' }}
                >
                  Books Borrowed {sortField === 'borrowedCount' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* New User Row */}
              <tr className="new-user-row">
                <td>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => handleNewUserChange('name', e.target.value)}
                    placeholder="Enter name..."
                    className="table-input"
                  />
                </td>
                <td>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => handleNewUserChange('email', e.target.value)}
                    placeholder="email@example.com"
                    className="table-input"
                  />
                </td>
                <td>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => handleNewUserChange('phone', e.target.value)}
                    placeholder="Phone number"
                    className="table-input"
                  />
                </td>
                <td>-</td>
                <td>-</td>
                <td>
                  <button
                    onClick={handleNewUserSave}
                    disabled={!newUser.name.trim()}
                    className="save-btn"
                  >
                    💾 Add
                  </button>
                </td>
              </tr>

              {/* Existing Users */}
              {sortedUsers.map(user => (
                <tr key={user.id}>
                  <td>
                    {editingUser === user.id ? (
                      <input
                        type="text"
                        value={editData.name || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                        className="table-input"
                      />
                    ) : (
                      user.name
                    )}
                  </td>
                  <td>
                    {editingUser === user.id ? (
                      <input
                        type="email"
                        value={editData.email || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                        className="table-input"
                      />
                    ) : (
                      user.email || '-'
                    )}
                  </td>
                  <td>
                    {editingUser === user.id ? (
                      <input
                        type="tel"
                        value={editData.phone || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                        className="table-input"
                      />
                    ) : (
                      user.phone || '-'
                    )}
                  </td>
                  <td>
                    {new Date(user.registrationDate).toLocaleDateString()}
                  </td>
                  <td>
                    <span
                      className={`book-count ${user.borrowedBooks.length > 0 ? 'has-books' : ''}`}
                      title={user.borrowedBooks.length > 0 ? `Borrowed books:\n• ${getBorrowedBookTitles(user.borrowedBooks)}` : 'No books borrowed'}
                    >
                      {user.borrowedBooks.length}
                    </span>
                  </td>
                  <td>
                    {editingUser === user.id ? (
                      <div className="edit-actions">
                        <button onClick={saveEdit} className="save-btn">💾</button>
                        <button onClick={cancelEdit} className="cancel-btn">❌</button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(user)} className="edit-btn">✏️</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <p>📊 Total Users: {state.users.length} | Active Borrowers: {state.users.filter(u => u.borrowedBooks.length > 0).length}</p>
          <p>💡 Click column headers to sort. Click ✏️ to edit user details.</p>
        </div>
      </div>

      {showRecovery && (
        <DataRecoveryModal isOpen={showRecovery} onClose={() => setShowRecovery(false)} />
      )}
    </Layout>
  );
};

export default UsersPage;