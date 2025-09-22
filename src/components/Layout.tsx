import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">📚 My Library</h1>
          <nav className="nav">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              Books
            </Link>
            <Link to="/users" className={`nav-link ${isActive('/users') ? 'active' : ''}`}>
              Users
            </Link>
          </nav>
        </div>
      </header>
      <main className="main">
        <div className="container">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;