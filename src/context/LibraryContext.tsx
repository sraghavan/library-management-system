import React, { createContext, useContext, useReducer, ReactNode, useRef, useCallback } from 'react';
import { Book, User } from '../types';
import { DataRecoveryService } from '../services/dataRecovery';

interface LibraryState {
  books: Book[];
  users: User[];
  loading: boolean;
  error: string | null;
}

type LibraryAction =
  | { type: 'ADD_BOOK'; payload: Book }
  | { type: 'UPDATE_BOOK'; payload: Book }
  | { type: 'DELETE_BOOK'; payload: string }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'BORROW_BOOK'; payload: { bookId: string; userId: string } }
  | { type: 'RETURN_BOOK'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_DATA'; payload: { books: Book[]; users: User[] } };

// Load initial state from localStorage if available
const loadInitialState = (): LibraryState => {
  try {
    const savedData = localStorage.getItem('libraryData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      console.log('✅ Loaded data from localStorage:', {
        books: parsed.books?.length || 0,
        users: parsed.users?.length || 0
      });
      return {
        books: parsed.books || [],
        users: parsed.users || [],
        loading: false,
        error: null,
      };
    }
  } catch (error) {
    console.error('❌ Error loading data from localStorage:', error);
  }
  return {
    books: [],
    users: [],
    loading: false,
    error: null,
  };
};

const initialState: LibraryState = loadInitialState();

const libraryReducer = (state: LibraryState, action: LibraryAction): LibraryState => {
  switch (action.type) {
    case 'ADD_BOOK':
      return { ...state, books: [...state.books, action.payload] };
    case 'UPDATE_BOOK':
      return {
        ...state,
        books: state.books.map(book =>
          book.id === action.payload.id ? action.payload : book
        ),
      };
    case 'DELETE_BOOK':
      return {
        ...state,
        books: state.books.filter(book => book.id !== action.payload),
      };
    case 'ADD_USER':
      return { ...state, users: [...state.users, action.payload] };
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map(user =>
          user.id === action.payload.id ? action.payload : user
        ),
      };
    case 'DELETE_USER':
      return {
        ...state,
        users: state.users.filter(user => user.id !== action.payload),
      };
    case 'BORROW_BOOK':
      return {
        ...state,
        books: state.books.map(book =>
          book.id === action.payload.bookId
            ? {
                ...book,
                isAvailable: false,
                borrowedBy: action.payload.userId,
                borrowedDate: new Date().toISOString()
              }
            : book
        ),
        users: state.users.map(user =>
          user.id === action.payload.userId
            ? { ...user, borrowedBooks: [...user.borrowedBooks, action.payload.bookId] }
            : user
        ),
      };
    case 'RETURN_BOOK':
      const book = state.books.find(b => b.id === action.payload);
      return {
        ...state,
        books: state.books.map(b =>
          b.id === action.payload
            ? { ...b, isAvailable: true, borrowedBy: undefined, borrowedDate: undefined }
            : b
        ),
        users: state.users.map(user =>
          book?.borrowedBy === user.id
            ? { ...user, borrowedBooks: user.borrowedBooks.filter(id => id !== action.payload) }
            : user
        ),
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'LOAD_DATA':
      return { ...state, books: action.payload.books, users: action.payload.users };
    default:
      return state;
  }
};

interface LibraryContextType {
  state: LibraryState;
  dispatch: React.Dispatch<LibraryAction>;
  // API functions
  loadFromAPI: () => Promise<void>;
  addBookToAPI: (book: Omit<Book, 'id'>) => Promise<void>;
  updateBookInAPI: (id: string, updates: Partial<Book>) => Promise<void>;
  deleteBookFromAPI: (id: string) => Promise<void>;
  addUserToAPI: (user: Omit<User, 'id' | 'borrowedBooks'>) => Promise<void>;
  updateUserInAPI: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUserFromAPI: (id: string) => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(libraryReducer, initialState);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<string>('');

  // Enhanced save function with error handling and backup
  const saveToStorage = useCallback((books: Book[], users: User[]) => {
    try {
      const dataToSave = { books, users, timestamp: Date.now() };
      const serialized = JSON.stringify(dataToSave);

      // Only save if data has actually changed
      if (serialized !== lastSaveRef.current) {
        // Create backup before saving new data
        const existingData = localStorage.getItem('libraryData');
        if (existingData) {
          localStorage.setItem('libraryDataBackup', existingData);
        }

        localStorage.setItem('libraryData', serialized);
        lastSaveRef.current = serialized;

        console.log('💾 Data saved to localStorage:', {
          books: books.length,
          users: users.length,
          timestamp: new Date().toLocaleTimeString()
        });

        // Also save to multiple backup keys for extra safety
        localStorage.setItem(`libraryData_${Date.now()}`, serialized);

        // Clean up old backups (keep only last 5)
        const allKeys = Object.keys(localStorage).filter(key => key.startsWith('libraryData_'));
        if (allKeys.length > 5) {
          const sortedKeys = allKeys.sort();
          sortedKeys.slice(0, allKeys.length - 5).forEach(key => {
            localStorage.removeItem(key);
          });
        }
      }
    } catch (error) {
      console.error('❌ Error saving to localStorage:', error);
      // Try to save to a different key as fallback
      try {
        localStorage.setItem('libraryDataEmergency', JSON.stringify({ books, users }));
        console.log('💾 Emergency backup saved');
      } catch (emergencyError) {
        console.error('❌ Emergency save also failed:', emergencyError);
      }
    }
  }, []);

  // Debounced save - saves immediately for critical operations, debounced for rapid updates
  const debouncedSave = useCallback((books: Book[], users: User[], immediate = false) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (immediate) {
      saveToStorage(books, users);
    } else {
      saveTimeoutRef.current = setTimeout(() => {
        saveToStorage(books, users);
      }, 100); // Very short debounce
    }
  }, [saveToStorage]);

  // Enhanced dispatch wrapper that ensures saving
  const enhancedDispatch = useCallback((action: LibraryAction) => {
    dispatch(action);
  }, []);

  // Save whenever state changes
  React.useEffect(() => {
    debouncedSave(state.books, state.users);
  }, [state.books, state.users, debouncedSave]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        // Force final save
        saveToStorage(state.books, state.users);
      }
    };
  }, [state.books, state.users, saveToStorage]);

  // Auto-save every 30 seconds as additional safety
  React.useEffect(() => {
    const interval = setInterval(() => {
      saveToStorage(state.books, state.users);
    }, 30000);

    return () => clearInterval(interval);
  }, [state.books, state.users, saveToStorage]);

  // API integration functions
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const loadFromAPI = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const [booksResponse, usersResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/books`),
        fetch(`${API_BASE_URL}/api/users`)
      ]);

      const books = await booksResponse.json();
      const users = await usersResponse.json();

      // Add borrowedBooks array to users for compatibility
      const usersWithBorrowedBooks = users.map(user => ({ ...user, borrowedBooks: [] }));

      dispatch({ type: 'LOAD_DATA', payload: { books, users: usersWithBorrowedBooks } });
      console.log('✅ Loaded data from API:', { books: books.length, users: users.length });
    } catch (error) {
      console.error('❌ Error loading from API:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load data from API' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const addBookToAPI = useCallback(async (book: Omit<Book, 'id'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await fetch(`${API_BASE_URL}/api/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book)
      });
      const newBook = await response.json();
      dispatch({ type: 'ADD_BOOK', payload: newBook });
      console.log('✅ Added book to API:', newBook.title);
    } catch (error) {
      console.error('❌ Error adding book to API:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add book to API' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const updateBookInAPI = useCallback(async (id: string, updates: Partial<Book>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await fetch(`${API_BASE_URL}/api/books/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updatedBook = await response.json();
      dispatch({ type: 'UPDATE_BOOK', payload: updatedBook });
      console.log('✅ Updated book in API:', updatedBook.title);
    } catch (error) {
      console.error('❌ Error updating book in API:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update book in API' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const deleteBookFromAPI = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await fetch(`${API_BASE_URL}/api/books/${id}`, { method: 'DELETE' });
      dispatch({ type: 'DELETE_BOOK', payload: id });
      console.log('✅ Deleted book from API');
    } catch (error) {
      console.error('❌ Error deleting book from API:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete book from API' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const addUserToAPI = useCallback(async (user: Omit<User, 'id' | 'borrowedBooks'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
      });
      const newUser = await response.json();
      const userWithBorrowedBooks = { ...newUser, borrowedBooks: [] };
      dispatch({ type: 'ADD_USER', payload: userWithBorrowedBooks });
      console.log('✅ Added user to API:', newUser.name);
    } catch (error) {
      console.error('❌ Error adding user to API:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add user to API' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const updateUserInAPI = useCallback(async (id: string, updates: Partial<User>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const updatedUser = await response.json();
      const localUser = state.users.find(u => u.id === id);
      const userWithBorrowedBooks = {
        ...updatedUser,
        borrowedBooks: updates.borrowedBooks || localUser?.borrowedBooks || []
      };
      dispatch({ type: 'UPDATE_USER', payload: userWithBorrowedBooks });
      console.log('✅ Updated user in API:', updatedUser.name);
    } catch (error) {
      console.error('❌ Error updating user in API:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update user in API' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.users]);

  const deleteUserFromAPI = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await fetch(`${API_BASE_URL}/api/users/${id}`, { method: 'DELETE' });
      dispatch({ type: 'DELETE_USER', payload: id });
      console.log('✅ Deleted user from API');
    } catch (error) {
      console.error('❌ Error deleting user from API:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete user from API' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  return (
    <LibraryContext.Provider value={{
      state,
      dispatch: enhancedDispatch,
      loadFromAPI,
      addBookToAPI,
      updateBookInAPI,
      deleteBookFromAPI,
      addUserToAPI,
      updateUserInAPI,
      deleteUserFromAPI
    }}>
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (context === undefined) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};