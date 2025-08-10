import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged, updateProfile, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import './AccountSettings.css';

function AccountSettings() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('account');
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Personal Information Form Data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  // Password Change Form Data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const navigate = useNavigate();

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Parse display name if available
        const displayName = currentUser.displayName || '';
        const nameParts = displayName.split(' ');
        setFormData({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: currentUser.email || '',
          phone: currentUser.phoneNumber || ''
        });
      } else {
        navigate('/login');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle password input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save personal information
  const handleSaveInfo = async () => {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const displayName = `${formData.firstName} ${formData.lastName}`.trim();
      
      // Update profile
      await updateProfile(user, {
        displayName: displayName
      });

      // Update email if changed
      if (formData.email !== user.email) {
        await updateEmail(user, formData.email);
      }

      // Note: Phone number cannot be updated through Firebase Auth updateProfile
      // It requires re-authentication with phone provider or custom backend solution
      
      setMessage('Personal information updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Update failed:', error);
      let errorMessage = 'Update failed, please try again';
      
      // Handle specific error cases
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'For security reasons, please log in again before updating information';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    // Reset form data to original values
    const displayName = user?.displayName || '';
    const nameParts = displayName.split(' ');
    setFormData({
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: user?.email || '',
      phone: user?.phoneNumber || ''
    });
    setIsEditing(false);
    setError('');
    setMessage('');
  };

  // Update password
  const handleUpdatePassword = async () => {
    setIsLoading(true);
    setError('');
    setMessage('');

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New password and confirm password do not match');
      setIsLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setError('New password cannot be the same as current password');
      setIsLoading(false);
      return;
    }

    try {
      // Re-authenticate user before updating password
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, passwordData.newPassword);
      setMessage('Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Password update failed:', error);
      let errorMessage = 'Password update failed, please try again';
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'For security reasons, please log in again before changing password';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'New password is too weak, please choose a stronger password';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is signed in with Google
  const isGoogleUser = user?.providerData?.some(provider => provider.providerId === 'google.com');

  if (isLoading && !user) {
    return (
      <div className="account-settings-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="account-settings-container">
      {/* Header */}
      <div className="settings-header">
        <h1>Account Settings</h1>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        <div className="account-tab">
          {/* Account Section */}
          <div className="section">
            <div className="section-header">
              <div className="section-title">
                <h2>Account</h2>
                <p className="section-description">View and edit your personal information below.</p>
              </div>
              {/* Quick Edit Button moved here */}
              <div className="quick-edit-btn">
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={isLoading}
                >
                  {isEditing ? 'Cancel Edit' : 'Quick Edit'}
                </button>
              </div>
            </div>

            {/* Personal Information */}
            <div className="info-section">
              <h3>Personal Information</h3>
              <p className="info-description">Update your personal information.</p>
              
              {(message || error) && (
                <div className={`message ${error ? 'error' : 'success'}`}>
                  {message || error}
                </div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={!isEditing || isLoading}
                    placeholder="Enter your first name"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={!isEditing || isLoading}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing || isLoading || isGoogleUser}
                  placeholder="Enter your email"
                  required
                />
                {isGoogleUser && (
                  <small className="form-hint">
                    Google account email cannot be changed here
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing || isLoading}
                  placeholder="Enter your phone number"
                />
                <small className="form-hint">
                  Note: Phone number update requires additional verification, feature in development
                </small>
              </div>

              {isEditing && (
                <div className="button-group">
                  <button 
                    className="cancel-btn"
                    onClick={handleCancelEdit}
                    disabled={isLoading}
                  >
                    Discard Changes
                  </button>
                  <button 
                    className="save-btn"
                    onClick={handleSaveInfo}
                    disabled={isLoading || !formData.firstName.trim() || !formData.email.trim()}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            {/* Password Change Section - Only show for email/password users */}
            {!isGoogleUser && (
              <div className="info-section">
                <h3>Change Password</h3>
                <p className="info-description">Update your login password.</p>

                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password *</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    disabled={isLoading}
                    placeholder="Enter current password"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="newPassword">New Password *</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    disabled={isLoading}
                    placeholder="Enter new password (at least 6 characters)"
                    minLength="6"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password *</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    disabled={isLoading}
                    placeholder="Enter new password again"
                    minLength="6"
                    required
                  />
                </div>
                
                <button 
                  className="update-password-btn"
                  onClick={handleUpdatePassword}
                  disabled={
                    isLoading || 
                    !passwordData.currentPassword || 
                    !passwordData.newPassword || 
                    !passwordData.confirmPassword ||
                    passwordData.newPassword !== passwordData.confirmPassword
                  }
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountSettings;