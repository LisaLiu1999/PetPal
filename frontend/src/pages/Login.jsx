import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import "./Login.css";

function Login() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // 監聽使用者登入／登出狀態
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Email LogIn/SignUp
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    // Validation for sign up
    if (isSignUp) {
      if (!firstName.trim() || !lastName.trim()) {
        setError("Please enter both first name and last name.");
        setIsLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setIsLoading(false);
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        setIsLoading(false);
        return;
      }
    }
    
    try {
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        console.log("User created:", { firstName, lastName, email, user: result.user });
        // 這裡你可以將用戶的姓名保存到 Firestore 或其他數據庫
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // navigate("/dashboard");
    } catch (error) {
      console.error("Email authentication failed:", error);
      setError(getErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  // 錯誤訊息處理
  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'User not found. Please check your email or register a new account.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'This email is already in use. Please use a different email.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 6 characters.';
      case 'auth/invalid-email':
        return 'Invalid Email Format';
      case 'auth/too-many-requests':
        return 'Too many login attempts. Please try again later.';
      case 'auth/popup-closed-by-user':
        return 'Google sign-in was cancelled.';
      case 'auth/popup-blocked':
        return 'Pop-up blocked. Please allow pop-ups for this site.';
      default:
        return 'Authentication failed. Please try again.';
    }
  };

  // Google 登入
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google Sign-In successful:", result.user);
      // navigate("/dashboard");
    } catch (error) {
      console.error("Google Sign-In Failed:", error);
      setError(getErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  // 登出
  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      console.log("User signed out");
      // navigate("/");
    } catch (error) {
      console.error("Sign-Out Failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 清除表單
  const clearForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFirstName("");
    setLastName("");
    setError("");
  };

  // 切換登入/註冊模式
  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    clearForm();
  };

  // 如果還在檢查登入狀態，顯示載入畫面
  if (isLoading && !user) {
    return (
      <div className="login-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // 登入界面
  const renderLoginUI = () => (
    <div className="login-section">
      <div className="welcome-message">
        <h2>{isSignUp ? "Join Pet Pal Family!" : "Welcome Back to Pet Pal!"}</h2>
        <p>
          {isSignUp 
            ? "Create your account and start finding the best care for your furry friend" 
            : "Find the Best Care Services for Your Furry Friend"
          }
        </p>
      </div>
      
      <div className="login-form-container">
        <form onSubmit={handleEmailSignIn} className="login-form">
          {isSignUp && (
            <>
              <div className="form-row">
                <div className="form-group half-width">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                    required
                  />
                </div>
                <div className="form-group half-width">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                    required
                  />
                </div>
              </div>
            </>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignUp ? "Create a password (min 6 characters)" : "Enter your password"}
              required
            />
          </div>

          {isSignUp && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </div>
          )}
          
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            className="email-login-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner"></span>
            ) : (
              isSignUp ? "Create Account" : "Log In"
            )}
          </button>
          
          <div className="auth-switch">
            <span>
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
            </span>
            <button
              type="button"
              className="switch-btn"
              onClick={toggleAuthMode}
            >
              {isSignUp ? "Log In" : "Sign Up"}
            </button>
          </div>
        </form>

        <div className="divider">
          <span>OR</span>
        </div>

        <button 
          className="google-login-btn" 
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="loading-spinner"></span>
          ) : (
            <>
              <svg className="google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isSignUp ? "Sign Up with Google" : "Log In with Google"}
            </>
          )}
        </button>
      </div>
    </div>
  );

  // 簡化的用戶資料界面
  const renderUserProfile = () => {
    // 獲取用戶頭像URL，確保處理可能的空值
    const avatarUrl = user?.photoURL;
    
    // 生成用戶姓名縮寫
    const getUserInitials = () => {
      if (user?.displayName) {
        return user.displayName
          .split(' ')
          .map(name => name.charAt(0))
          .join('')
          .toUpperCase()
          .slice(0, 2); // 最多取兩個字母
      }
      if (firstName && lastName) {
        return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
      }
      if (user?.email) {
        return user.email.charAt(0).toUpperCase();
      }
      return '👤';
    };

    return (
      <div className="user-profile">
        <div className="profile-header">
          {/* <h2> Welcome {isSignUp ? "to Pet Pal!" : "Back to Pet Pal!"}</h2> */}
          <div className="user-info">
            <div className="user-avatar-container">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="User profile"
                  className="user-avatar"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    console.log('Avatar loading failed, switching to fallback');
                    e.target.style.display = 'none';
                    e.target.parentElement.querySelector('.user-avatar-fallback').style.display = 'flex';
                  }}
                  onLoad={(e) => {
                    console.log('Avatar loaded successfully');
                    e.target.style.display = 'block';
                    e.target.parentElement.querySelector('.user-avatar-fallback').style.display = 'none';
                  }}
                />
              ) : null}
              <div 
                className="user-avatar-fallback"
                style={{ display: avatarUrl ? 'none' : 'flex' }}
              >
                {getUserInitials()}
              </div>
            </div>
            <div className="user-details">
              <h3>{user?.displayName || `${firstName} ${lastName}` || "Dear User"}</h3>
              <p className="user-email">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <div className="action-buttons">
            <button 
              className="dashboard-btn" 
              onClick={() => navigate('/my-bookings')}
            >
              My Bookings
            </button>
            
            <button 
              className="logout-btn" 
              onClick={handleSignOut}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading-spinner"></span>
              ) : (
                "Sign Out"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <div className="logo-section">
          <img src="./petpalprofile.svg" alt="Petpal Logo" className="logo-icon"/>
        </div>
        <p className="tagline">Your Pet's Best Friend</p>
      </div>

      {user ? renderUserProfile() : renderLoginUI()}
    </div>
  );
}

export default Login;