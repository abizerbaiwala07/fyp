import { tenthStandardAPI } from './api';

class StreakService {
  constructor() {
    this.streakData = new Map();
  }

  /**
   * Get streak data for a student
   * @param {string} studentId - The student ID
   * @returns {Promise<Object>} Streak data
   */
  async getStreak(studentId) {
    try {
      // Try to get from cache first
      if (this.streakData.has(studentId)) {
        const cachedData = this.streakData.get(studentId);
        const now = new Date();
        
        // If cached data is less than 5 minutes old, return it
        if (now - cachedData.timestamp < 5 * 60 * 1000) {
          return cachedData.data;
        }
      }
      
      // Fetch from backend
      const response = await tenthStandardAPI.getStreak(studentId);
      const data = response.data;
      
      // Cache the data
      this.streakData.set(studentId, {
        data: data,
        timestamp: new Date()
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching streak data:', error);
      
      // Fallback to localStorage
      const localStorageKey = `streak_${studentId}`;
      const storedData = localStorage.getItem(localStorageKey);
      
      if (storedData) {
        try {
          return JSON.parse(storedData);
        } catch (parseError) {
          console.error('Error parsing localStorage streak data:', parseError);
        }
      }
      
      // Return default data
      return {
        success: true,
        streak_count: 0,
        last_click: null,
        can_update: true,
        next_update_allowed: null
      };
    }
  }

  /**
   * Update streak for a student
   * @param {string} studentId - The student ID
   * @param {Date} timestamp - The timestamp of the click
   * @returns {Promise<Object>} Updated streak data
   */
  async updateStreak(studentId, timestamp) {
    try {
      // Send request to backend
      const response = await tenthStandardAPI.updateStreak(studentId, {
        timestamp: timestamp.toISOString()
      });
      
      const data = response.data;
      
      // Update cache
      this.streakData.set(studentId, {
        data: data,
        timestamp: new Date()
      });
      
      // Update localStorage as backup
      const localStorageKey = `streak_${studentId}`;
      localStorage.setItem(localStorageKey, JSON.stringify(data));
      
      return data;
    } catch (error) {
      console.error('Error updating streak:', error);
      
      // Check if it's a rate limiting error (429 or specific message)
      if (error.response && (error.response.status === 429 || 
          (error.response.data && error.response.data.detail && 
           error.response.data.detail.includes('24 hours')))) {
        // Fetch current streak data
        return await this.getStreak(studentId);
      }
      
      // Handle server errors (500)
      if (error.response && error.response.status >= 500) {
        // Show user-friendly message
        console.error('Server error occurred while updating streak. Please try again later.');
        
        // Return current streak data
        return await this.getStreak(studentId);
      }
      
      // Fallback to localStorage
      const localStorageKey = `streak_${studentId}`;
      const storedData = localStorage.getItem(localStorageKey);
      
      if (storedData) {
        try {
          const data = JSON.parse(storedData);
          
          // Check if 24 hours have passed
          if (data.last_click) {
            const lastClickTime = new Date(data.last_click);
            const currentTime = timestamp;
            const hoursSinceLastClick = (currentTime - lastClickTime) / (1000 * 60 * 60);
            
            if (hoursSinceLastClick >= 24) {
              // Update streak
              const newData = {
                ...data,
                streak_count: data.streak_count + 1,
                last_click: timestamp.toISOString(),
                can_update: false,
                next_update_allowed: new Date(timestamp.getTime() + 24 * 60 * 60 * 1000).toISOString()
              };
              
              localStorage.setItem(localStorageKey, JSON.stringify(newData));
              return newData;
            }
          } else {
            // First click
            const newData = {
              success: true,
              streak_count: 1,
              last_click: timestamp.toISOString(),
              can_update: false,
              next_update_allowed: new Date(timestamp.getTime() + 24 * 60 * 60 * 1000).toISOString()
            };
            
            localStorage.setItem(localStorageKey, JSON.stringify(newData));
            return newData;
          }
        } catch (parseError) {
          console.error('Error parsing localStorage streak data:', parseError);
        }
      }
      
      // Return error response
      throw error;
    }
  }

  /**
   * Check if streak can be updated
   * @param {string} studentId - The student ID
   * @returns {Promise<boolean>} Whether streak can be updated
   */
  async canUpdateStreak(studentId) {
    const streakData = await this.getStreak(studentId);
    return streakData.can_update;
  }

  /**
   * Get time until next streak update is allowed
   * @param {string} studentId - The student ID
   * @returns {Promise<Date|null>} Time until next update is allowed
   */
  async getNextUpdateAllowedTime(studentId) {
    const streakData = await this.getStreak(studentId);
    return streakData.next_update_allowed ? new Date(streakData.next_update_allowed) : null;
  }

  /**
   * Get formatted time until next streak update
   * @param {string} studentId - The student ID
   * @returns {Promise<string>} Formatted time until next update
   */
  async getFormattedTimeUntilNextUpdate(studentId) {
    const nextUpdate = await this.getNextUpdateAllowedTime(studentId);
    
    if (!nextUpdate) {
      return 'Click daily to maintain streak';
    }
    
    const now = new Date();
    const diffMs = nextUpdate - now;
    
    if (diffMs <= 0) {
      return 'Available now';
    }
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `Available in ${diffDays}d ${diffHours}h`;
    } else if (diffHours > 0) {
      return `Available in ${diffHours}h ${diffMinutes}m`;
    } else {
      return `Available in ${diffMinutes}m`;
    }
  }
}

// Create a singleton instance
const streakService = new StreakService();

export default streakService;