import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { FaCamera, FaMapMarkerAlt, FaCheckCircle, FaTimesCircle, FaSpinner, FaClock, FaCheck, FaTimes, FaSignOutAlt, FaHistory } from 'react-icons/fa';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API_BASE_URL from '../config/api';
import { useAuth } from '../context/AuthContext';
import TeacherAttendanceHistory from './TeacherAttendanceHistory';

const TeacherDashboard = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'history'
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false); // eslint-disable-line no-unused-vars
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  const webcamRef = useRef(null);
  const submitButtonRef = useRef(null);

  // Use user data from AuthContext instead of fetching separately
  useEffect(() => {
    console.log('👤 AuthContext user data:', user);
    console.log('👤 AuthContext token:', token);
    if (user) {
      setUserInfo(user);
      console.log('👤 User info set from AuthContext:', user);
    } else {
      console.log('👤 No user data in AuthContext');
    }
  }, [user, token]);

  // Prevent automatic scrolling when capturedImage changes
  useEffect(() => {
    if (capturedImage && location) {
      // Prevent any automatic scrolling
      const currentScrollY = window.scrollY;
      
      // Prevent scrolling multiple times
      const preventScroll = () => {
        window.scrollTo(0, currentScrollY);
      };
      
      // Prevent scrolling immediately and after a short delay
      preventScroll();
      setTimeout(preventScroll, 50);
      setTimeout(preventScroll, 100);
      setTimeout(preventScroll, 200);
    }
  }, [capturedImage, location]);

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      console.log('📍 Requesting location permission...');
      
      // First check if we have permission
      navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
        console.log('📍 Permission status:', permissionStatus.state);
        
        if (permissionStatus.state === 'denied') {
          reject(new Error('Location permission denied. Please enable location in your browser settings.'));
          return;
        }
        
        // Request location
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('📍 Location obtained:', {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
          },
          (error) => {
            console.error('📍 Location error:', error);
            let errorMessage = 'Error getting location: ';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage += 'Location permission denied. Please allow location access in your browser settings.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage += 'Location information unavailable. Please try again.';
                break;
              case error.TIMEOUT:
                errorMessage += 'Location request timed out. Please try again.';
                break;
              default:
                errorMessage += error.message;
            }
            reject(new Error(errorMessage));
          },
          {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0
          }
        );
      }).catch((err) => {
        console.error('📍 Permission check error:', err);
        // Fallback to direct location request
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('📍 Location obtained (fallback):', {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
          },
          (error) => {
            console.error('📍 Location error (fallback):', error);
            reject(new Error('Location permission denied. Please enable location in your browser settings.'));
          },
          {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0
          }
        );
      });
    });
  };

  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    setShowCamera(false);
    console.log('📸 Photo captured successfully');
    
    // Prevent automatic scrolling immediately
    const currentScrollY = window.scrollY;
    window.scrollTo(0, currentScrollY);
    
    // Prevent automatic scrolling after state update
    setTimeout(() => {
      console.log('📸 After photo capture - checking states:');
      console.log('📸 Captured image:', !!imageSrc);
      console.log('📸 Location:', location);
      console.log('📸 Is checking in:', isCheckingIn);
      console.log('📸 Is checking out:', isCheckingOut);
      
      // Prevent any automatic scrolling
      window.scrollTo(0, currentScrollY);
    }, 100);
  };

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      // Get location
      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);
      // Show camera
      setShowCamera(true);
      setIsCheckingIn(true);
      setIsCheckingOut(false); // Ensure only check-in is active
      setLoading(false);
    } catch (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setLoading(true);
      // Get location
      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);
      // Show camera
      setShowCamera(true);
      setIsCheckingOut(true);
      setIsCheckingIn(false); // Ensure only check-out is active
      setLoading(false);
    } catch (error) {
      toast.error('Error getting location: ' + error.message);
      setLoading(false);
    }
  };

  const submitAttendance = async () => {
    console.log('🔄 Submit button clicked!');
    console.log('📸 Captured image:', !!capturedImage);
    console.log('📍 Location:', location);
    console.log('🔍 Is checking in:', isCheckingIn);
    console.log('🔍 Is checking out:', isCheckingOut);
    console.log('🔄 Loading state:', loading);
    console.log('🔄 Show camera state:', showCamera);
    console.log('🔐 Auth check:');
    console.log('🔐 - User:', user);
    console.log('🔐 - Token exists:', !!token);
    console.log('🔐 - Token preview:', token ? `${token.substring(0, 20)}...` : 'No token');
    console.log('🔐 - User role:', user?.role);
    console.log('🔐 - Axios headers:', axios.defaults.headers.common);
    
    if (!capturedImage || !location) {
      toast.error('Please capture photo and location first');
      return;
    }

    // Check if user is authenticated and is a teacher
    if (!user) {
      toast.error('User not found. Please log in again.');
      console.error('❌ User is null');
      return;
    }
    
    console.log('🔍 User role check:', { role: user?.role, expected: 'teacher' });
    
    if (user.role !== 'teacher') {
      toast.error('Access denied. Only teachers can submit attendance.');
      console.error('❌ User is not a teacher:', { user, role: user?.role });
      return;
    }

    if (!token) {
      toast.error('No authentication token found. Please log in again.');
      console.error('❌ No token found');
      return;
    }

    console.log('✅ Validation passed, starting submission...');

    try {
      setLoading(true);

      const attendanceData = {
        photo: capturedImage,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy
        }
      };

      console.log('📤 Submitting attendance data:', {
        type: isCheckingIn ? 'checkin' : 'checkout',
        location: attendanceData.location,
        hasPhoto: !!attendanceData.photo
      });

      // Send to correct endpoint based on type
      const endpoint = isCheckingIn ? '/api/attendance' : '/api/attendance/checkout';
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      console.log('🌐 Sending to endpoint:', endpoint);
      console.log('🌐 Full URL:', fullUrl);
      console.log('📤 Request data:', attendanceData);
      console.log('🔐 Authorization header:', axios.defaults.headers.common['Authorization']);
      
      // Make sure the Authorization header is set
      if (!axios.defaults.headers.common['Authorization']) {
        console.log('🔐 Setting Authorization header manually');
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      // Test the token by making a simple request first
      try {
        console.log('🔐 Testing token with /api/auth/me...');
        const testResponse = await axios.get(`${API_BASE_URL}/api/auth/me`);
        console.log('🔐 Token test successful:', testResponse.data);
      } catch (testError) {
        console.error('🔐 Token test failed:', testError.response?.data);
        toast.error('Authentication failed. Please log in again.');
        return;
      }
      
      const response = await axios.post(fullUrl, attendanceData);
      
      console.log('✅ Response received:', response.data);
      toast.success(response.data.message);
      
      // Update user info with new last check-in/check-out time
      if (response.data.attendance?.checkInTime) {
        console.log('✅ Updating lastCheckIn:', response.data.attendance.checkInTime);
        setUserInfo(prev => ({
          ...prev,
          lastCheckIn: response.data.attendance.checkInTime
        }));
      }
      if (response.data.attendance?.checkOutTime) {
        console.log('✅ Updating lastCheckOut:', response.data.attendance.checkOutTime);
        setUserInfo(prev => ({
          ...prev,
          lastCheckOut: response.data.attendance.checkOutTime
        }));
      }
      
      // Also update the AuthContext user data
      if (response.data.attendance?.checkInTime || response.data.attendance?.checkOutTime) {
        console.log('✅ Updating AuthContext user data');
        // This will trigger a re-render with updated user data
      }
      
      // Reset states
      setCapturedImage(null);
      setLocation(null);
      setIsCheckingIn(false);
      setIsCheckingOut(false);
      setShowCamera(false);
      
    } catch (error) {
      console.error('❌ Attendance submission error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response?.data?.message) {
        // Show the actual server error message
        toast.error(error.response.data.message);
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Please check your permissions.');
      } else if (error.response?.status === 400) {
        toast.error('Invalid request data. Please try again.');
      } else {
        toast.error('Error submitting attendance. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelCheckIn = () => {
    setShowCamera(false);
    setCapturedImage(null);
    setLocation(null);
    setIsCheckingIn(false);
    setIsCheckingOut(false);
  };

  return (
    <div className="space-y-6" style={{ scrollBehavior: 'auto', overflowAnchor: 'none' }}>
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FaCheckCircle className="h-4 w-4" />
                <span>Dashboard</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FaHistory className="h-4 w-4" />
                <span>Attendance History</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Dashboard Content */}
      {activeTab === 'dashboard' && (
        <>
          {/* User Information Section */}
      {userInfo && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Teacher Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-600 font-medium">Name</p>
              <p className="font-semibold text-blue-900">{userInfo.name}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-600 font-medium">Email</p>
              <p className="font-semibold text-green-900">{userInfo.email}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-600 font-medium">School</p>
              <p className="font-semibold text-purple-900">{userInfo.school?.name || 'Not assigned'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Status Section */}
      {userInfo && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Attendance Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Status */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current Status</p>
                  <p className="font-medium text-gray-900">
                    {userInfo.lastCheckIn && (!userInfo.lastCheckOut || 
                      new Date(userInfo.lastCheckIn) > new Date(userInfo.lastCheckOut)) ? 
                      '🟢 Checked In' : '🔴 Checked Out'
                    }
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Today</p>
                </div>
              </div>
            </div>
            
            {/* Last Check-in */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Last Check-in</p>
                  <p className="font-medium text-gray-900">
                    {userInfo.lastCheckIn ? 
                      new Date(userInfo.lastCheckIn).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      }) : 
                      'No check-in recorded'
                    }
                  </p>
                </div>
                <FaCheckCircle className="h-5 w-5 text-green-500" />
              </div>
            </div>
            
            {/* Last Check-out */}
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Last Check-out</p>
                  <p className="font-medium text-gray-900">
                    {userInfo.lastCheckOut ? 
                      new Date(userInfo.lastCheckOut).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      }) : 
                      'No check-out recorded'
                    }
                  </p>
                </div>
                <FaTimesCircle className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Check-in/Check-out Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Attendance Management
          </h3>
          <div className="text-right">
            <p className="text-sm text-gray-600">Today's Date</p>
            <p className="font-medium text-gray-900">
              {new Date().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </p>
            <p className="text-sm text-gray-600">Current Time</p>
            <p className="font-medium text-gray-900">
              {new Date().toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </p>
          </div>
        </div>
        


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Check In Button */}
          <button
            onClick={handleCheckIn}
            disabled={loading || showCamera}
            className="flex items-center justify-center space-x-2 p-4 bg-success-600 hover:bg-success-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FaCheckCircle className="h-5 w-5" />
            <span>Check In</span>
          </button>

          {/* Check Out Button */}
          <button
            onClick={handleCheckOut}
            disabled={loading || showCamera}
            className="flex items-center justify-center space-x-2 p-4 bg-warning-600 hover:bg-warning-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FaTimesCircle className="h-5 w-5" />
            <span>Check Out</span>
          </button>
        </div>
      </div>

      {/* Camera Section */}
      {showCamera && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Capture Photo
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="rounded-lg max-w-md"
              />
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={capturePhoto}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                <FaCamera className="h-4 w-4" />
                <span>Capture Photo</span>
              </button>
              
              <button
                onClick={cancelCheckIn}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Captured Image and Location */}
      {capturedImage && location && (
        <div 
          className="bg-white rounded-lg shadow p-6" 
          style={{ 
            scrollBehavior: 'auto', 
            overflowAnchor: 'none',
            scrollMarginTop: '0px'
          }}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Review Attendance
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Photo */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Captured Photo</h4>
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="rounded-lg max-w-full"
              />
            </div>
            
            {/* Location */}
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Location Details</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <FaMapMarkerAlt className="h-4 w-4 text-primary-600" />
                  <span className="text-sm text-gray-600">Latitude: {location.latitude.toFixed(6)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaMapMarkerAlt className="h-4 w-4 text-primary-600" />
                  <span className="text-sm text-gray-600">Longitude: {location.longitude.toFixed(6)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaMapMarkerAlt className="h-4 w-4 text-primary-600" />
                  <span className="text-sm text-gray-600">Accuracy: ±{Math.round(location.accuracy)}m</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <button
              ref={submitButtonRef}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🖱️ Submit button clicked!');
                console.log('🖱️ Button state check:');
                console.log('🖱️ - Loading:', loading);
                console.log('🖱️ - Captured image:', !!capturedImage);
                console.log('🖱️ - Location:', !!location);
                console.log('🖱️ - Is checking in:', isCheckingIn);
                console.log('🖱️ - Is checking out:', isCheckingOut);
                
                if (loading) {
                  console.log('🖱️ Button is disabled due to loading state');
                  toast.error('Button is disabled - please wait');
                  return;
                }
                
                if (!capturedImage || !location) {
                  console.log('🖱️ Missing captured image or location');
                  toast.error('Please capture photo and location first');
                  return;
                }
                
                console.log('🖱️ Calling submitAttendance function...');
                submitAttendance();
              }}
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer"
              style={{ 
                scrollBehavior: 'auto', 
                overflowAnchor: 'none',
                scrollMarginTop: '0px'
              }}
            >
              {loading ? 'Submit...' : `Submit ${isCheckingIn ? 'Check-in' : 'Check-out'}`}
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Click "Check In" or "Check Out" to start the process</li>
          <li>• Allow location access when prompted</li>
          <li>• Capture a clear photo of yourself</li>
          <li>• Ensure you are within 100 meters of your school</li>
          <li>• Review the information before submitting</li>
        </ul>
      </div>
      <ToastContainer />
        </>
      )}

      {/* History Content */}
      {activeTab === 'history' && (
        <TeacherAttendanceHistory />
      )}
    </div>
  );
};

export default TeacherDashboard; 