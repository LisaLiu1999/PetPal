const STRAPI_URL = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';

// ===== Fetch Bookings for User =====
export const fetchBookingsForUser = async (userEmail) => {
  try {
    console.log('Fetching bookings for user:', userEmail);
    
    const response = await fetch(
      `${STRAPI_URL}/api/bookings?filters[userEmail][$eq]=${userEmail}&populate=service.image&sort=scheduleTime:desc`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Fetched bookings result:', result);
    
    // Normalize booking data to use documentId as the primary ID
    const normalizedBookings = (result.data || []).map(booking => {
      return {
        // Use documentId as primary ID for API operations
        id: booking.documentId || booking.id,
        documentId: booking.documentId,
        strapiId: booking.id, // Keep original DB ID for reference
        
        // Other properties
        userEmail: booking.userEmail,
        userName: booking.userName || booking.user_name,
        scheduleTime: booking.scheduleTime,
        date: booking.scheduleTime,
        bookingStatus: booking.bookingStatus,
        status: booking.bookingStatus,
        service: booking.service
      };
    });
    
    console.log('Normalized bookings:', normalizedBookings);
    return normalizedBookings;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
};

// ===== Check if Booking Exists (Improved) =====
export const checkBookingExists = async (bookingIdentifier) => {
  try {
    console.log('Checking if booking exists:', bookingIdentifier);
    
    // Method 1: Direct query with provided ID (likely documentId)
    try {
      const response1 = await fetch(`${STRAPI_URL}/api/bookings/${bookingIdentifier}?populate=*`);
      
      if (response1.ok) {
        const result = await response1.json();
        if (result.data) {
          console.log('Booking found via direct query');
          return { exists: true, booking: result.data };
        }
      } else if (response1.status === 404) {
        console.log('Direct query returned 404 - booking not found');
        // Continue to filter query to be thorough
      }
    } catch (error) {
      console.log('Direct query failed:', error.message);
    }
    
    // Method 2: Filter query by documentId (fallback)
    try {
      const response2 = await fetch(
        `${STRAPI_URL}/api/bookings?filters[documentId][$eq]=${bookingIdentifier}&populate=*`
      );
      
      if (response2.ok) {
        const result = await response2.json();
        if (result.data && result.data.length > 0) {
          console.log('Booking found via documentId filter');
          return { exists: true, booking: result.data[0] };
        }
      }
    } catch (error) {
      console.log('DocumentId filter query failed:', error.message);
    }
    
    console.log('Booking not found via any method');
    return { exists: false, booking: null };
    
  } catch (error) {
    console.error('Error checking booking existence:', error);
    // In case of network errors, assume booking might exist to be safe
    return { exists: true, booking: null };
  }
};

// ===== Cancel Booking (Improved) =====
// 在 strapi.js 中替換現有的 cancelBooking 函數

export const cancelBooking = async (bookingIdentifier) => {
  try {
    console.log('Starting booking cancellation:', bookingIdentifier);
    
    // First, find the actual booking and correct ID
    let actualBooking = null;
    let actualId = null;
    
    // Strategy 1: Direct query
    try {
      const response = await fetch(`${STRAPI_URL}/api/bookings/${bookingIdentifier}?populate=*`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          actualBooking = result.data;
          actualId = bookingIdentifier;
          console.log('Direct query successful, using ID:', actualId);
        }
      } else if (response.status === 404) {
        console.log('Direct query returned 404 - booking not found on server');
        throw new Error('Booking not found on server');
      }
    } catch (error) {
      if (error.message.includes('not found')) {
        throw error;
      }
      console.log('Direct query failed:', error.message);
    }
    
    // Strategy 2: Filter query if direct query failed
    if (!actualBooking) {
      try {
        const searchResponse = await fetch(
          `${STRAPI_URL}/api/bookings?filters[documentId][$eq]=${bookingIdentifier}&populate=*`
        );
        
        if (searchResponse.ok) {
          const searchResult = await searchResponse.json();
          if (searchResult.data && searchResult.data.length > 0) {
            actualBooking = searchResult.data[0];
            actualId = actualBooking.documentId || actualBooking.id;
            console.log('Filter query successful, found actual ID:', actualId);
          } else {
            console.log('Filter query returned no results');
            throw new Error('Booking not found on server');
          }
        }
      } catch (error) {
        if (error.message.includes('not found')) {
          throw error;
        }
        console.log('Filter query failed:', error.message);
      }
    }
    
    // If booking not found, throw error
    if (!actualBooking || !actualId) {
      throw new Error('Booking not found on server');
    }
    
    console.log('Found booking, attempting cancellation with ID:', actualId);
    
    // Try cancellation methods with improved error handling
    const cancelMethods = [
      // Method 1: Delete
      async () => {
        console.log('Trying DELETE method...');
        const response = await fetch(`${STRAPI_URL}/api/bookings/${actualId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Booking not found on server');
          }
          throw new Error(`DELETE failed: ${response.status}`);
        }
        
        // Check if response has content before parsing JSON
        const contentType = response.headers.get('content-type');
        let result = null;
        
        if (contentType && contentType.includes('application/json')) {
          const text = await response.text();
          if (text.trim()) {
            try {
              result = JSON.parse(text);
            } catch (parseError) {
              console.log('JSON parse failed but DELETE was successful');
              result = { success: true, message: 'Booking deleted successfully' };
            }
          } else {
            result = { success: true, message: 'Booking deleted successfully' };
          }
        } else {
          result = { success: true, message: 'Booking deleted successfully' };
        }
        
        return result;
      },
      
      // Method 2: Update status (only if DELETE failed)
      async () => {
        console.log('Trying status update method...');
        const response = await fetch(`${STRAPI_URL}/api/bookings/${actualId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: { bookingStatus: 'cancelled' }
          })
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            // If we get 404 here, it might mean the DELETE method actually worked
            console.log('PUT returned 404 - booking might have been deleted by previous method');
            throw new Error('Booking already deleted');
          }
          throw new Error(`PUT failed: ${response.status}`);
        }
        
        return await response.json();
      }
    ];
    
    // Try each cancellation method
    let lastError = null;
    
    for (let i = 0; i < cancelMethods.length; i++) {
      try {
        const result = await cancelMethods[i]();
        console.log('Cancellation successful:', result);
        return result;
      } catch (error) {
        console.log(`Cancellation method ${i + 1} failed:`, error.message);
        lastError = error;
        
        // If we get "already deleted" error, treat it as success
        if (error.message.includes('already deleted')) {
          console.log('Booking was already deleted, treating as success');
          return { success: true, message: 'Booking cancelled successfully' };
        }
        
        // If we get 404 on the second method, the first method likely succeeded
        if (i === 1 && error.message.includes('not found')) {
          console.log('Second method failed with 404, first method likely succeeded');
          return { success: true, message: 'Booking cancelled successfully' };
        }
        
        // If booking not found, don't try other methods
        if (error.message.includes('not found')) {
          throw error;
        }
      }
    }
    
    // If all methods failed, throw the last error
    throw lastError || new Error('All cancellation methods failed');
    
  } catch (error) {
    console.error('Booking cancellation failed:', error);
    throw error;
  }
};

// ===== Create New Booking =====
export const createBooking = async (bookingData) => {
  try {
    console.log('Creating booking:', bookingData);
    
    const response = await fetch(`${STRAPI_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: bookingData
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create booking: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Booking created successfully:', result);
    return result;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

// ===== Update Booking =====
export const updateBooking = async (bookingId, updateData) => {
  try {
    console.log('Updating booking:', bookingId, updateData);
    
    const response = await fetch(`${STRAPI_URL}/api/bookings/${bookingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: updateData
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update booking: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Booking updated successfully:', result);
    return result;
  } catch (error) {
    console.error('Error updating booking:', error);
    throw error;
  }
};

// ===== Fetch Services =====
export const fetchServices = async () => {
  try {
    console.log('Fetching services...');
    
    const response = await fetch(`${STRAPI_URL}/api/services?populate=*`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Fetched services:', result);
    return result.data || [];
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
};

// ===== Utility Functions =====
export const getImageUrl = (imageData, fallback = 'https://via.placeholder.com/300x200?text=No+Image') => {
  if (!imageData) return fallback;
  
  let imageUrl = null;
  
  if (typeof imageData === 'string') {
    imageUrl = imageData;
  } else if (imageData.url) {
    imageUrl = imageData.url;
  } else if (imageData.data && imageData.data.attributes && imageData.data.attributes.url) {
    imageUrl = imageData.data.attributes.url;
  } else if (imageData.attributes && imageData.attributes.url) {
    imageUrl = imageData.attributes.url;
  }

  if (!imageUrl) return fallback;

  if (!imageUrl.startsWith('http')) {
    imageUrl = `${STRAPI_URL}${imageUrl}`;
  }

  return imageUrl;
};

export const testConnection = async () => {
  try {
    console.log('Testing Strapi connection...');
    
    const response = await fetch(`${STRAPI_URL}/api/bookings?pagination[pageSize]=1`);
    
    if (!response.ok) {
      throw new Error(`Connection test failed: ${response.status}`);
    }
    
    console.log('Strapi connection successful');
    return true;
  } catch (error) {
    console.error('Strapi connection failed:', error);
    return false;
  }
};

export default {
  fetchBookingsForUser,
  createBooking,
  checkBookingExists,
  cancelBooking,
  updateBooking,
  fetchServices,
  getImageUrl,
  testConnection
};