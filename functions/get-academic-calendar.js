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
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Try multiple filesystem locations (Netlify may not bundle root files into function dir)
    const candidatePaths = [
      path.join(__dirname, 'academic_year.json'),
      path.resolve(__dirname, '../../academic_year.json'),
      path.resolve(process.cwd(), 'academic_year.json')
    ];
    let raw = null;
    for (const p of candidatePaths) {
      try {
        if (fs.existsSync(p)) {
          raw = fs.readFileSync(p, 'utf8');
          break;
        }
      } catch (_) {}
    }

    let academicCalendar = null;
    if (raw) {
      academicCalendar = JSON.parse(raw);
    } else {
      // Fallback: fetch from public site
      const https = require('https');
      const url = process.env.PUBLIC_ACAD_CAL_URL || 'https://mathayomwatsing.netlify.app/academic_year.json';
      academicCalendar = await new Promise((resolve, reject) => {
        https.get(url, (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }
          const ct = res.headers['content-type'] || '';
          if (!ct.includes('application/json')) {
            reject(new Error('Non-JSON response'));
            return;
          }
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
          });
        }).on('error', reject);
      });
    }

    if (!Array.isArray(academicCalendar)) {
      throw new Error('Invalid academic calendar format');
    }

    console.log('📅 Academic calendar loaded:', academicCalendar.length, 'terms');
    return {
      statusCode: 200,
      headers,
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
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to load academic calendar',
        message: error.message
      })
    };
  }
};
