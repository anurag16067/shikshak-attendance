/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Check if a location is within the specified radius of a school
 * @param {number} teacherLat - Teacher's latitude
 * @param {number} teacherLon - Teacher's longitude
 * @param {number} schoolLat - School's latitude
 * @param {number} schoolLon - School's longitude
 * @param {number} radius - Radius in meters (default: 100)
 * @param {number} accuracy - GPS accuracy in meters (optional)
 * @returns {object} { distance: number, isWithinBoundary: boolean, accuracy: number }
 */
function isWithinSchoolBoundary(teacherLat, teacherLon, schoolLat, schoolLon, radius = 100, accuracy = null) {
  const distance = calculateDistance(teacherLat, teacherLon, schoolLat, schoolLon);
  
  // Determine if within boundary based on GPS accuracy
  let isWithinBoundary = false;
  
  if (accuracy) {
    // If GPS accuracy is available, use it for more intelligent boundary checking
    if (accuracy > 1000) {
      // Poor GPS accuracy (>1km) - likely laptop/desktop testing
      // Allow check-in only if distance is reasonable (within 2km)
      isWithinBoundary = distance <= 2000;
    } else if (accuracy > 100) {
      // Medium GPS accuracy (100m-1km) - mobile device with poor signal
      // Allow check-in if within 500m
      isWithinBoundary = distance <= 500;
    } else {
      // Good GPS accuracy (<100m) - mobile device with good signal
      // Use strict school boundary
      isWithinBoundary = distance <= radius;
    }
  } else {
    // No accuracy data available - use conservative approach
    // Allow check-in if within 500m (reasonable for testing)
    isWithinBoundary = distance <= radius || distance <= 500;
  }
  
  return {
    distance: Math.round(distance),
    isWithinBoundary: isWithinBoundary,
    accuracy: accuracy
  };
}

module.exports = {
  calculateDistance,
  isWithinSchoolBoundary
}; 