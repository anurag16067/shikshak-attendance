const axios = require('axios');

// Update school boundary radius
async function updateBoundary() {
  try {
    const response = await axios.patch('http://localhost:5000/api/schools/687bfa1e987386c6f09bea6b/boundary', {
      boundaryRadius: 5000
    }, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    console.log('✅ Boundary updated successfully!');
    console.log('New boundary radius:', response.data.school.boundaryRadius, 'meters');
  } catch (error) {
    console.error('❌ Error updating boundary:', error.response?.data || error.message);
  }
}

// Run the update
updateBoundary(); 