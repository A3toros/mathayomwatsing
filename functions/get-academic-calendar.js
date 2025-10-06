/**
 * Get Academic Calendar
 * 
 * Serves academic calendar data from static JSON file.
 * Eliminates database queries for academic period detection.
 * 
 * @param {Object} event - Netlify function event
 * @param {Object} context - Netlify function context
 * @returns {Object} Response with academic calendar data
 */

const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  try {
    // Read academic calendar from JSON file (no database query)
    const academicYearPath = path.join(__dirname, 'academic_year.json');
    const academicCalendar = JSON.parse(fs.readFileSync(academicYearPath, 'utf8'));
    
    console.log('📅 Academic calendar loaded:', academicCalendar.length, 'terms');
    
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        academic_calendar: academicCalendar,
        total_terms: academicCalendar.length,
        message: 'Academic calendar loaded successfully'
      })
    };
  } catch (error) {
    console.error('📅 Error loading academic calendar:', error);
    
    return {
      statusCode: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({ 
        success: false,
        error: 'Failed to load academic calendar',
        message: error.message
      })
    };
  }
};
