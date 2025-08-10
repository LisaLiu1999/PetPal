import React, { useEffect, useState, useCallback } from 'react';
import { fetchBookingsForUser, cancelBooking, checkBookingExists } from '../services/strapi';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import './MyBookings.css';

// Add dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

export default function MyBookings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Get user's timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Memoized function to fetch bookings
  const fetchUserBookings = useCallback(async (userEmail) => {
    try {
      setError('');
      setLoading(true);
      console.log('Fetching bookings for:', userEmail);
      
      const fetchedBookings = await fetchBookingsForUser(userEmail);
      console.log('Fetched bookings:', fetchedBookings);
      setBookings(fetchedBookings || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('User authenticated:', firebaseUser.email);
        setUser(firebaseUser);
        await fetchUserBookings(firebaseUser.email);
      } else {
        console.log('User not authenticated');
        setUser(null);
        setBookings([]);
        setLoading(false);
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate, fetchUserBookings]);

  // Helper function to get image URL
  const getImageUrl = useCallback((service) => {
    if (!service) return 'https://via.placeholder.com/80?text=No+Image';
    
    let imageUrl = null;
    
    if (service.image) {
      if (typeof service.image === 'string') {
        imageUrl = service.image;
      } else if (service.image.url) {
        imageUrl = service.image.url;
      } else if (service.image.data && service.image.data.attributes && service.image.data.attributes.url) {
        imageUrl = service.image.data.attributes.url;
      } else if (service.image.attributes && service.image.attributes.url) {
        imageUrl = service.image.attributes.url;
      }
    }

    if (!imageUrl) {
      return 'https://via.placeholder.com/80?text=No+Image';
    }

    if (!imageUrl.startsWith('http')) {
      const strapiUrl = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';
      imageUrl = `${strapiUrl}${imageUrl}`;
    }

    return imageUrl;
  }, []);

  // Filter bookings by date and status
  const now = dayjs().tz(userTimezone);
  
  const upcomingBookings = bookings.filter(booking => {
    const bookingDate = dayjs(booking.scheduleTime || booking.date).tz(userTimezone);
    const status = booking.bookingStatus || booking.status || 'confirmed';
    return bookingDate.isAfter(now) && status !== 'cancelled';
  });
  
  const pastBookings = bookings.filter(booking => {
    const bookingDate = dayjs(booking.scheduleTime || booking.date).tz(userTimezone);
    const status = booking.bookingStatus || booking.status || 'confirmed';
    return bookingDate.isBefore(now) || status === 'cancelled';
  });

  const currentBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  // Handle booking management
  const handleManageBooking = (booking) => {
    console.log('Managing booking:', booking);
    setSelectedBooking(booking);
    setShowModal(true);
  };

  // Handle reschedule
  const handleRescheduleBooking = (booking) => {
    if (!booking.service) {
      alert('Service information not available for rescheduling');
      return;
    }

    try {
      console.log('Rescheduling booking:', booking);
      closeModal();
      
      navigate('/schedule', { 
        state: { 
          service: {
            id: booking.service.id || booking.service.documentId,
            title: booking.service.name || booking.service.title,
            duration: booking.service.duration,
            price: booking.service.price,
            backgroundColor: booking.service.backgroundColor || 'yellow'
          },
          originalBookingId: booking.id,
          isRescheduling: true
        } 
      });
    } catch (error) {
      console.error('Error navigating to schedule for rescheduling:', error);
      alert('Unable to navigate to rescheduling page. Please try again.');
    }
  };

  // Improved handle cancel booking function
  const handleCancelBooking = async (booking) => {
    const serviceName = booking.service?.name || booking.service?.title || 'this service';
    const bookingDate = formatBookingDate(booking.scheduleTime || booking.date);
    
    const confirmMessage = `Are you sure you want to cancel your "${serviceName}" appointment on ${bookingDate}?\n\nThis action cannot be undone.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setCancelling(true);
    
    try {
      const bookingId = booking.id;
      console.log('Cancelling booking:', bookingId);
      
      // First check if booking still exists on server
      const checkResult = await checkBookingExists(bookingId);
      
      if (!checkResult.exists) {
        console.log('Booking no longer exists on server, removing from local state');
        
        // Remove from local state immediately
        setBookings(prevBookings => 
          prevBookings.filter(b => b.id !== bookingId)
        );
        closeModal();
        
        alert('This booking no longer exists and has been removed from your list.');
        return;
      }
      
      // If booking exists, attempt to cancel it
      try {
        await cancelBooking(bookingId);
        console.log('Booking cancelled successfully via API');
        
        // Remove from local state after successful cancellation
        setBookings(prevBookings => 
          prevBookings.filter(b => b.id !== bookingId)
        );

        closeModal();
        alert('Booking cancelled successfully.');
        
      } catch (cancelError) {
        console.error('Cancel booking API error:', cancelError);
        
        // Handle different types of cancellation errors
        if (cancelError.message.includes('not found') || cancelError.message.includes('404')) {
          // Booking was deleted between our check and cancellation attempt
          console.log('Booking was deleted during cancellation process');
          
          setBookings(prevBookings => 
            prevBookings.filter(b => b.id !== bookingId)
          );
          closeModal();
          alert('This booking has already been cancelled or removed.');
          
        } else if (cancelError.message.includes('All cancellation methods failed')) {
          // Server is having issues but booking might still exist
          alert('Unable to cancel this booking at the moment. Please try again later or contact support.');
          
        } else {
          // Generic error
          alert('Failed to cancel booking. Please try again or contact support.');
        }
      }
      
    } catch (error) {
      console.error('Booking cancellation process failed:', error);
      alert('An unexpected error occurred. Please try again or contact support.');
    } finally {
      setCancelling(false);
    }
  };

  // Handle book again
  const handleBookAgain = (booking) => {
    if (!booking.service) {
      alert('Service information not available');
      return;
    }

    try {
      console.log('Booking again:', booking);
      
      navigate('/schedule', { 
        state: { 
          service: {
            id: booking.service.id || booking.service.documentId,
            title: booking.service.name || booking.service.title,
            duration: booking.service.duration,
            price: booking.service.price,
            backgroundColor: booking.service.backgroundColor || 'yellow'
          } 
        } 
      });
    } catch (error) {
      console.error('Error navigating to schedule:', error);
      alert('Unable to navigate to booking page. Please try again.');
    }
  };

  // Get status badge
  const getStatusBadge = (booking) => {
    const status = booking.bookingStatus || booking.status || 'pending';
    const statusText = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    return <span className={`status-badge ${status.toLowerCase()}`}>{statusText}</span>;
  };

  // Format date
  const formatBookingDate = (dateString) => {
    try {
      if (!dateString) return 'Invalid Date';
      return dayjs(dateString).tz(userTimezone).format('dddd, MMMM D, YYYY [at] h:mm A');
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Invalid Date';
    }
  };

  // Retry function
  const handleRetry = () => {
    if (user?.email) {
      console.log('Retrying to fetch bookings');
      fetchUserBookings(user.email);
    } else {
      console.log('Reloading page');
      window.location.reload();
    }
  };

  // Close modal
  const closeModal = () => {
    console.log('Closing modal');
    setShowModal(false);
    setSelectedBooking(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="my-bookings-page">
        <div className="container">
          <div className="bookings-loading">
            <div className="loading-spinner"></div>
            <p>Loading your bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="my-bookings-page">
        <div className="container">
          <div className="bookings-error">
            <h3>Oops! Something went wrong</h3>
            <p>{error}</p>
            <button onClick={handleRetry} disabled={loading}>
              {loading ? 'Retrying...' : 'Try Again'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-bookings-page">
      <div className="container">
        {/* Header */}
        <div className="bookings-header">
          <button className="back-btn" onClick={() => navigate('/services')}>
            ← Back to Services
          </button>
          
          <div className="header-content">
            <h1>My Bookings</h1>
            <p className="subtitle">
              Manage your appointments and view booking history
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bookings-tabs">
          <button 
            className={activeTab === 'upcoming' ? 'active' : ''}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming ({upcomingBookings.length})
          </button>
          <button 
            className={activeTab === 'past' ? 'active' : ''}
            onClick={() => setActiveTab('past')}
          >
            Past ({pastBookings.length})
          </button>
        </div>

        {/* Timezone Info */}
        <div className="timezone-info">
          All times shown in {userTimezone}
        </div>

        {/* Bookings List */}
        <div className="bookings-list">
          {currentBookings.length === 0 ? (
            <div className="no-bookings">
              <div className="no-bookings-icon">
                {activeTab === 'upcoming' ? '📅' : '📋'}
              </div>
              <h3>No {activeTab} bookings</h3>
              <p>
                {activeTab === 'upcoming' 
                  ? "You don't have any upcoming appointments." 
                  : "You don't have any past bookings yet."}
              </p>
              <button 
                className="cta-button"
                onClick={() => navigate('/services')}
              >
                Book a Service
              </button>
            </div>
          ) : (
            currentBookings.map((booking) => (
              <div key={booking.id} className="booking-card">
                <img 
                  src={getImageUrl(booking.service)}
                  alt={booking.service?.name || booking.service?.title || 'Service'}
                  className="booking-thumb"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/80?text=No+Image';
                  }}
                  loading="lazy"
                />
                
                <div className="booking-info">
                  <h3>{booking.service?.name || booking.service?.title || 'Service Information Unavailable'}</h3>
                  <p className="booking-date">
                    <span className="date-icon">🗓️</span>
                    {formatBookingDate(booking.scheduleTime || booking.date)}
                  </p>
                  <div className="booking-details">
                    <p><span className="detail-label">Duration:</span> {booking.service?.duration || 'N/A'} minutes</p>
                    <p><span className="detail-label">Price:</span> ${booking.service?.price || 'N/A'}</p>
                    <p><span className="detail-label">Booked by:</span> {booking.userEmail}</p>
                  </div>
                  {getStatusBadge(booking)}
                </div>

                <div className="booking-actions">
                  {activeTab === 'upcoming' ? (
                    <button 
                      className="manage-btn"
                      onClick={() => handleManageBooking(booking)}
                    >
                      Manage
                    </button>
                  ) : (
                    <button 
                      className="book-again-btn"
                      onClick={() => handleBookAgain(booking)}
                    >
                      Book Again
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Manage Booking Modal */}
        {showModal && selectedBooking && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="manage-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Manage Booking</h3>
                <button className="close-btn" onClick={closeModal} aria-label="Close modal">
                  ×
                </button>
              </div>
              
              <div className="modal-content">
                <div className="booking-summary">
                  <h4>{selectedBooking.service?.name || selectedBooking.service?.title}</h4>
                  <p className="booking-time">
                    {formatBookingDate(selectedBooking.scheduleTime || selectedBooking.date)}
                  </p>
                  <div className="booking-meta">
                    <p>Duration: {selectedBooking.service?.duration || 'N/A'} minutes</p>
                    <p>Price: ${selectedBooking.service?.price || 'N/A'}</p>
                    {getStatusBadge(selectedBooking)}
                  </div>
                </div>

                <div className="manage-actions">
                  {/* Reschedule Button */}
                  <button 
                    className="action-btn reschedule-btn"
                    onClick={() => handleRescheduleBooking(selectedBooking)}
                  >
                    📅 Reschedule Appointment
                  </button>
                  
                  {/* Cancel Button */}
                  <button 
                    className="action-btn cancel-btn"
                    onClick={() => handleCancelBooking(selectedBooking)}
                    disabled={cancelling}
                  >
                    {cancelling ? '⏳ Cancelling...' : '❌ Cancel Booking'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}