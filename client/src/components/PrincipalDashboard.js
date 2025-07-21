import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import { FaUsers, FaCheckCircle, FaTimesCircle, FaDownload, FaFilter, FaEye, FaCamera, FaMapMarkerAlt, FaSpinner, FaClock, FaHistory } from 'react-icons/fa';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API_BASE_URL from '../config/api';
import { useAuth } from '../context/AuthContext';
import TeacherAttendanceHistory from './TeacherAttendanceHistory';

const PrincipalDashboard = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('teacher-management'); // 'teacher-management', 'my-attendance', 'my-history'
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Principal's own attendance states
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState({ checkInTime: null, checkOutTime: null });

  const webcamRef = useRef(null);
  const submitButtonRef = useRef(null);

  // Use user data from AuthContext
  useEffect(() => {
    console.log('👤 Principal AuthContext user data:', user);
    if (user) {
      setUserInfo(user);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'teacher-management') {
      fetchAttendanceData();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/attendance/school`);
      setAttendanceData(response.data);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error('Error loading teacher attendance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/attendance/today`);
      setTodayAttendance(response.data);
    } catch (error) {
      console.error('Error fetching today\'s attendance:', error);
    }
  };

  const handleApprove = async (attendanceId) => {
    try {
      await axios.put(`${API_BASE_URL}/api/attendance/${attendanceId}/approve`);
      toast.success('Attendance approved successfully');
      fetchAttendanceData(); // Refresh data
    } catch (error) {
      console.error('Error approving attendance:', error);
      toast.error('Error approving attendance');
    }
  };

  const handleReject = async (attendanceId) => {
    try {
      await axios.put(`${API_BASE_URL}/api/attendance/${attendanceId}/reject`);
      toast.success('Attendance rejected successfully');
      fetchAttendanceData(); // Refresh data
    } catch (error) {
      console.error('Error rejecting attendance:', error);
      toast.error('Error rejecting attendance');
    }
  };

  const downloadCSV = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/attendance/export`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `teacher_attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV report downloaded successfully');
    } catch (error) {
      console.error('Error downloading CSV:', error);
      toast.error('Error downloading CSV report');
    }
  };

  // Principal's own attendance functions
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      console.log('📍 Principal requesting location permission...');
      
      navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
        console.log('📍 Permission status:', permissionStatus.state);
        
        if (permissionStatus.state === 'denied') {
          reject(new Error('Location permission denied. Please enable location in your browser settings.'));
          return;
        }
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('📍 Principal location obtained:', {
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
            console.error('📍 Principal location error:', error);
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
        console.error('📍 Principal permission check error:', err);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('📍 Principal location obtained (fallback):', {
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
            console.error('📍 Principal location error (fallback):', error);
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
    console.log('📸 Principal photo captured successfully');
  };

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);
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
      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);
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
    try {
      setLoading(true);
      
      const attendanceData = {
        photo: capturedImage,
        location: location
      };

      const endpoint = isCheckingIn ? '/api/attendance' : '/api/attendance/checkout';
      
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, attendanceData);
      
      console.log('✅ Principal attendance submitted:', response.data);
      
      toast.success(response.data.message);
      
      // Reset states
      setCapturedImage(null);
      setLocation(null);
      setIsCheckingIn(false);
      setIsCheckingOut(false);
      setLoading(false);
      
      // Update user info if available
      if (response.data.attendance) {
        console.log('✅ Updating principal lastCheckIn:', response.data.attendance.checkInTime);
        setUserInfo(prev => ({
          ...prev,
          lastCheckIn: response.data.attendance.checkInTime
        }));
        
        if (response.data.attendance.checkOutTime) {
          console.log('✅ Updating principal lastCheckOut:', response.data.attendance.checkOutTime);
          setUserInfo(prev => ({
            ...prev,
            lastCheckOut: response.data.attendance.checkOutTime
          }));
        }
      }
      await fetchTodayAttendance(); // Update today's attendance after submit
      
    } catch (error) {
      console.error('❌ Principal attendance submission error:', error);
      setLoading(false);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Error submitting attendance. Please try again.');
      }
    }
  };

  const cancelCheckIn = () => {
    setShowCamera(false);
    setCapturedImage(null);
    setLocation(null);
    setIsCheckingIn(false);
    setIsCheckingOut(false);
    setLoading(false);
  };

  const filteredData = attendanceData.filter(attendance => {
    const matchesDate = !filterDate || attendance.checkInTime.startsWith(filterDate);
    const matchesTeacher = !filterTeacher || 
      attendance.teacher.name.toLowerCase().includes(filterTeacher.toLowerCase());
    return matchesDate && matchesTeacher;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Rejected</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Pending</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Unknown</span>;
    }
  };

  const viewAttendanceDetails = (attendance) => {
    setSelectedAttendance(attendance);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('teacher-management')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'teacher-management'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FaUsers className="h-4 w-4" />
                <span>Teacher Management</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('my-attendance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-attendance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FaCheckCircle className="h-4 w-4" />
                <span>My Attendance</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('my-history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FaHistory className="h-4 w-4" />
                <span>My History</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Teacher Management Tab */}
      {activeTab === 'teacher-management' && (
        <>
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaUsers className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Teachers</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {attendanceData.length > 0 ? new Set(attendanceData.map(a => a.teacher._id)).size : 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaCheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Present Today</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {filteredData.filter(a => a.status === 'approved').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaTimesCircle className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Absent Today</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {filteredData.filter(a => a.status === 'rejected').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaFilter className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {filteredData.filter(a => a.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <h3 className="text-lg font-semibold text-gray-900">Teacher Attendance</h3>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <input
                  type="text"
                  placeholder="Filter by teacher name"
                  value={filterTeacher}
                  onChange={(e) => setFilterTeacher(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <button
                  onClick={downloadCSV}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <FaDownload className="h-4 w-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading attendance data...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teacher
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check-in Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check-out Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Distance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((attendance) => (
                      <tr key={attendance._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {attendance.teacher.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {attendance.teacher.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {attendance.teacher.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(attendance.checkInTime).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {attendance.checkOutTime ? 
                            new Date(attendance.checkOutTime).toLocaleString() : 
                            <span className="text-gray-400 italic">Not checked out</span>
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {attendance.location.latitude.toFixed(4)}, {attendance.location.longitude.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {attendance.distance}m
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(attendance.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => viewAttendanceDetails(attendance)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <FaEye className="h-4 w-4" />
                            </button>
                            
                            {attendance.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(attendance._id)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  <FaCheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleReject(attendance._id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <FaTimesCircle className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Principal's Own Attendance Tab */}
      {activeTab === 'my-attendance' && (
        <>
          {/* User Information Section */}
          {userInfo && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Principal Information
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
                My Attendance Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Current Status */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Current Status</p>
                      <p className="font-medium text-gray-900">
                        {todayAttendance.checkInTime && (!todayAttendance.checkOutTime || 
                          new Date(todayAttendance.checkInTime) > new Date(todayAttendance.checkOutTime)) ? 
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
                        {todayAttendance.checkInTime ? 
                          new Date(todayAttendance.checkInTime).toLocaleString('en-IN', {
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
                        {todayAttendance.checkOutTime ? 
                          new Date(todayAttendance.checkOutTime).toLocaleString('en-IN', {
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
                My Attendance Management
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
                className="flex items-center justify-center space-x-2 p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FaCheckCircle className="h-5 w-5" />
                <span>Check In</span>
              </button>

              {/* Check Out Button */}
              <button
                onClick={handleCheckOut}
                disabled={loading || showCamera}
                className="flex items-center justify-center space-x-2 p-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
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
            <div className="bg-white rounded-lg shadow p-6">
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
                      <FaMapMarkerAlt className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Latitude: {location.latitude.toFixed(6)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaMapMarkerAlt className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Longitude: {location.longitude.toFixed(6)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaMapMarkerAlt className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Accuracy: ±{Math.round(location.accuracy)}m</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <button
                  ref={submitButtonRef}
                  onClick={submitAttendance}
                  className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
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
              <li>• Your attendance will be sent to admin for approval</li>
            </ul>
          </div>
        </>
      )}

      {/* Principal's History Tab */}
      {activeTab === 'my-history' && (
        <TeacherAttendanceHistory />
      )}

      {/* Attendance Details Modal */}
      {showModal && selectedAttendance && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Details</h3>
              
              <div className="space-y-4">
                <div>
                  <img 
                    src={selectedAttendance.photo.url} 
                    alt="Teacher" 
                    className="w-full rounded-lg"
                  />
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Teacher: {selectedAttendance.teacher.name}</p>
                  <p className="text-sm text-gray-500">Check-in: {new Date(selectedAttendance.checkInTime).toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Check-out: {selectedAttendance.checkOutTime ? 
                    new Date(selectedAttendance.checkOutTime).toLocaleString() : 
                    'Not checked out'
                  }</p>
                  <p className="text-sm text-gray-500">Distance: {selectedAttendance.distance}m from school</p>
                  <p className="text-sm text-gray-500">Status: {selectedAttendance.status}</p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default PrincipalDashboard; 