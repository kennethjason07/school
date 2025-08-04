/**
 * Helper functions for the school management system
 */

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency symbol (default: '$')
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, currency = '$') => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${currency}0.00`;
  }
  
  return `${currency}${Number(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
};

/**
 * Format a date string to a readable format
 * @param {string|Date} date - The date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '';

  try {
    // Fix common invalid dates before parsing
    let dateString = date;
    if (typeof date === 'string') {
      // Fix invalid dates like 2025-07-32
      dateString = fixInvalidDate(date);
    }

    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date:', date);
      return 'Invalid Date';
    }

    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('Error formatting date:', date, error);
    return 'Invalid Date';
  }
};

/**
 * Fix invalid date strings
 * @param {string} dateString - The date string to fix
 * @returns {string} - Fixed date string
 */
export const fixInvalidDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return dateString;

  // Fix common invalid dates
  const fixes = {
    '2025-07-32': '2025-07-31',
    '2025-06-31': '2025-06-30',
    '2025-04-31': '2025-04-30',
    '2025-09-31': '2025-09-30',
    '2025-11-31': '2025-11-30',
    // Add more fixes as needed
  };

  for (const [invalid, valid] of Object.entries(fixes)) {
    if (dateString.includes(invalid)) {
      console.warn(`Fixing invalid date: ${invalid} -> ${valid}`);
      dateString = dateString.replace(invalid, valid);
    }
  }

  return dateString;
};

/**
 * Validate and parse a date safely
 * @param {string|Date} date - The date to validate
 * @returns {Date|null} - Valid date object or null
 */
export const parseDate = (date) => {
  if (!date) return null;

  try {
    let dateString = date;
    if (typeof date === 'string') {
      dateString = fixInvalidDate(date);
    }

    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) {
      console.warn('Could not parse date:', date);
      return null;
    }

    return dateObj;
  } catch (error) {
    console.warn('Error parsing date:', date, error);
    return null;
  }
};

/**
 * Format date for database storage (YYYY-MM-DD)
 * @param {string|Date} date - The date to format
 * @returns {string|null} - Formatted date string or null
 */
export const formatDateForDb = (date) => {
  const parsedDate = parseDate(date);
  if (!parsedDate) return null;

  return parsedDate.toISOString().split('T')[0];
};

/**
 * Capitalize the first letter of a string
 * @param {string} str - The string to capitalize
 * @returns {string} - Capitalized string
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Generate a random ID
 * @returns {string} - Random ID string
 */
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Validate email format
 * @param {string} email - The email to validate
 * @returns {boolean} - Whether the email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Calculate percentage
 * @param {number} value - The value
 * @param {number} total - The total
 * @returns {number} - Percentage
 */
export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
};
