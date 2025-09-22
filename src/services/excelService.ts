import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Book, User } from '../types';

export interface ExportData {
  books: Book[];
  users: User[];
  exportDate: string;
  exportedBy: string;
}

export interface ImportResult {
  books: Book[];
  users: User[];
  errors: string[];
}

export const exportBooksToExcel = (books: Book[]): void => {
  try {
    // Prepare books data for export
    const booksData = books.map(book => ({
      ID: book.id,
      Title: book.title,
      Author: book.author,
      Description: book.description || '',
      'Image URL': book.imageUrl || '',
      ISBN: book.isbn || '',
      'Published Date': book.publishedDate || '',
      Genre: book.genre || '',
      'Is Available': book.isAvailable ? 'Yes' : 'No',
      'Borrowed By': book.borrowedBy || '',
      'Borrowed Date': book.borrowedDate || '',
      'Source URL': book.sourceUrl || '',
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Add books sheet
    const booksSheet = XLSX.utils.json_to_sheet(booksData);
    XLSX.utils.book_append_sheet(workbook, booksSheet, 'Books');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `books-export-${timestamp}.xlsx`;

    // Export file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename);

    console.log('Books export completed successfully');
  } catch (error) {
    console.error('Books export failed:', error);
    throw new Error('Failed to export books to Excel');
  }
};

export const exportUsersToExcel = (users: User[]): void => {
  try {
    // Prepare users data for export
    const usersData = users.map(user => ({
      ID: user.id,
      Name: user.name,
      Email: user.email,
      Phone: user.phone,
      'Registration Date': user.registrationDate,
      'Borrowed Books Count': user.borrowedBooks.length,
      'Borrowed Book IDs': user.borrowedBooks.join(', '),
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Add users sheet
    const usersSheet = XLSX.utils.json_to_sheet(usersData);
    XLSX.utils.book_append_sheet(workbook, usersSheet, 'Users');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `users-export-${timestamp}.xlsx`;

    // Export file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename);

    console.log('Users export completed successfully');
  } catch (error) {
    console.error('Users export failed:', error);
    throw new Error('Failed to export users to Excel');
  }
};

export const exportToExcel = (books: Book[], users: User[]): void => {
  try {
    // Prepare books data for export
    const booksData = books.map(book => ({
      ID: book.id,
      Title: book.title,
      Author: book.author,
      Description: book.description || '',
      'Image URL': book.imageUrl || '',
      ISBN: book.isbn || '',
      'Published Date': book.publishedDate || '',
      Genre: book.genre || '',
      'Is Available': book.isAvailable ? 'Yes' : 'No',
      'Borrowed By': book.borrowedBy || '',
      'Borrowed Date': book.borrowedDate || '',
      'Source URL': book.sourceUrl || '',
    }));

    // Prepare users data for export
    const usersData = users.map(user => ({
      ID: user.id,
      Name: user.name,
      Email: user.email,
      Phone: user.phone,
      'Registration Date': user.registrationDate,
      'Borrowed Books Count': user.borrowedBooks.length,
      'Borrowed Book IDs': user.borrowedBooks.join(', '),
    }));

    // Prepare summary data
    const summaryData = [
      { Metric: 'Total Books', Value: books.length },
      { Metric: 'Available Books', Value: books.filter(b => b.isAvailable).length },
      { Metric: 'Borrowed Books', Value: books.filter(b => !b.isAvailable).length },
      { Metric: 'Total Users', Value: users.length },
      { Metric: 'Active Borrowers', Value: users.filter(u => u.borrowedBooks.length > 0).length },
      { Metric: 'Export Date', Value: new Date().toISOString() },
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Add summary sheet
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Add books sheet
    const booksSheet = XLSX.utils.json_to_sheet(booksData);
    XLSX.utils.book_append_sheet(workbook, booksSheet, 'Books');

    // Add users sheet
    const usersSheet = XLSX.utils.json_to_sheet(usersData);
    XLSX.utils.book_append_sheet(workbook, usersSheet, 'Users');

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `library-export-${timestamp}.xlsx`;

    // Export file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename);

    console.log('Export completed successfully');
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error('Failed to export data to Excel');
  }
};

export const importFromExcel = (file: File): Promise<ImportResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const result: ImportResult = {
          books: [],
          users: [],
          errors: [],
        };

        // Import books
        if (workbook.SheetNames.includes('Books')) {
          const booksSheet = workbook.Sheets['Books'];
          const booksData = XLSX.utils.sheet_to_json(booksSheet) as any[];

          for (const row of booksData) {
            try {
              const book: Book = {
                id: row.ID || generateId(),
                title: row.Title || 'Unknown Title',
                author: row.Author || 'Unknown Author',
                description: row.Description || '',
                imageUrl: row['Image URL'] || '',
                isbn: row.ISBN || '',
                publishedDate: row['Published Date'] || '',
                genre: row.Genre || '',
                isAvailable: row['Is Available'] === 'Yes',
                borrowedBy: row['Borrowed By'] || undefined,
                borrowedDate: row['Borrowed Date'] || undefined,
                sourceUrl: row['Source URL'] || undefined,
              };

              // Validate required fields
              if (!book.title || !book.author) {
                result.errors.push(`Invalid book data: Missing title or author in row`);
                continue;
              }

              result.books.push(book);
            } catch (error) {
              result.errors.push(`Error processing book row: ${error}`);
            }
          }
        } else {
          result.errors.push('Books sheet not found in Excel file');
        }

        // Import users
        if (workbook.SheetNames.includes('Users')) {
          const usersSheet = workbook.Sheets['Users'];
          const usersData = XLSX.utils.sheet_to_json(usersSheet) as any[];

          for (const row of usersData) {
            try {
              const user: User = {
                id: row.ID || generateId(),
                name: row.Name || 'Unknown User',
                email: row.Email || '',
                phone: row.Phone || '',
                registrationDate: row['Registration Date'] || new Date().toISOString(),
                borrowedBooks: row['Borrowed Book IDs']
                  ? row['Borrowed Book IDs'].split(', ').filter((id: string) => id.trim())
                  : [],
              };

              // Validate required fields
              if (!user.name || !user.email) {
                result.errors.push(`Invalid user data: Missing name or email in row`);
                continue;
              }

              result.users.push(user);
            } catch (error) {
              result.errors.push(`Error processing user row: ${error}`);
            }
          }
        } else {
          result.errors.push('Users sheet not found in Excel file');
        }

        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
};

const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const downloadBooksTemplate = (): void => {
  const booksTemplate = [
    {
      ID: 'book1',
      Title: 'Sample Book Title',
      Author: 'Sample Author',
      Description: 'Sample description',
      'Image URL': 'https://example.com/image.jpg',
      ISBN: '1234567890',
      'Published Date': '2023-01-01',
      Genre: 'Fiction',
      'Is Available': 'Yes',
      'Borrowed By': '',
      'Borrowed Date': '',
      'Source URL': '',
    },
  ];

  const workbook = XLSX.utils.book_new();
  const booksSheet = XLSX.utils.json_to_sheet(booksTemplate);
  XLSX.utils.book_append_sheet(workbook, booksSheet, 'Books');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, 'books-import-template.xlsx');
};

export const downloadUsersTemplate = (): void => {
  const usersTemplate = [
    {
      ID: 'user1',
      Name: 'Sample User',
      Email: 'user@example.com',
      Phone: '+1234567890',
      'Registration Date': new Date().toISOString(),
      'Borrowed Books Count': 0,
      'Borrowed Book IDs': '',
    },
  ];

  const workbook = XLSX.utils.book_new();
  const usersSheet = XLSX.utils.json_to_sheet(usersTemplate);
  XLSX.utils.book_append_sheet(workbook, usersSheet, 'Users');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, 'users-import-template.xlsx');
};

export const downloadTemplate = (): void => {
  const booksTemplate = [
    {
      ID: 'book1',
      Title: 'Sample Book Title',
      Author: 'Sample Author',
      Description: 'Sample description',
      'Image URL': 'https://example.com/image.jpg',
      ISBN: '1234567890',
      'Published Date': '2023-01-01',
      Genre: 'Fiction',
      'Is Available': 'Yes',
      'Borrowed By': '',
      'Borrowed Date': '',
      'Source URL': '',
    },
  ];

  const usersTemplate = [
    {
      ID: 'user1',
      Name: 'Sample User',
      Email: 'user@example.com',
      Phone: '+1234567890',
      'Registration Date': new Date().toISOString(),
      'Borrowed Books Count': 0,
      'Borrowed Book IDs': '',
    },
  ];

  const workbook = XLSX.utils.book_new();

  const booksSheet = XLSX.utils.json_to_sheet(booksTemplate);
  XLSX.utils.book_append_sheet(workbook, booksSheet, 'Books');

  const usersSheet = XLSX.utils.json_to_sheet(usersTemplate);
  XLSX.utils.book_append_sheet(workbook, usersSheet, 'Users');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, 'library-import-template.xlsx');
};