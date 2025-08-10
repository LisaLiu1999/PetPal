import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase"; // 根據你的 firebase.js 位置調整路徑
import "./Navbar.css";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  // 監聽 Firebase 認證狀態
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsUserMenuOpen(false);
      setIsOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // 關閉所有菜單
  const closeAllMenus = () => {setIsOpen(false);setIsUserMenuOpen(false);};

  return (
    <nav className="navbar">
      <div className="logo">
        <Link to="/" onClick={closeAllMenus}>
          <img  src="./petpallogo.svg" alt="Logo" className="logo-img" />
        </Link>
      </div>

      <div className="hamburger" onClick={toggleMenu}>☰</div>

      <ul className={`nav-links ${isOpen ? 'open' : ''}`}>
        <li>
          <Link to="/" onClick={closeAllMenus}>Home</Link>
        </li>
        
        <li>
          <Link to="/contact" onClick={closeAllMenus}>Contact </Link>
        </li>

        <li>
          <Link to="/services" onClick={closeAllMenus}>Services </Link>
        </li>
        
        {user ? (
          <li className="user-menu-container">
            <div className="user-avatar-container" onClick={toggleUserMenu}>
              <img 
                src={user.photoURL || '/path/to/default/avatar.png'} alt="User Avatar"
                 className="user-avatar"
              />
              <span className="dropdown-arrow">▼</span>
            </div>
            
            {isUserMenuOpen && (
              <div className="user-dropdown">
                <Link to="/my-bookings"onClick={closeAllMenus}>My Bookings
                </Link>

                <Link to="/account-settings" onClick={closeAllMenus}>Account Settings
                </Link>
                <button 
                  className="logout-btn"onClick={handleLogout} > Log Out</button>
              </div>
            )}
          </li>
        ) : 
        (
          <li>
            <Link  to="/login" className="login-btn"onClick={closeAllMenus} > Log In</Link>
          </li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;