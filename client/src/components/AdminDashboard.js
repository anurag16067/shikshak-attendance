import React, { useState, useEffect } from 'react';
import { FaUsers, FaCheckCircle, FaTimesCircle, FaDownload, FaFilter, FaEye, FaSchool, FaUserTie, FaHistory } from 'react-icons/fa';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API_BASE_URL from '../config/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'principals', 'schools'
  const [principalAttendanceData, setPrincipalAttendanceData] = useState([]);
  const [schoolsData, setSchoolsData] = useState([]);
  const [statsData, setStatsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterPrincipal, setFilterPrincipal] = useState('');
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddSchoolModal, setShowAddSchoolModal] = useState(false);
  const [newSchool, setNewSchool] = useState({
    name: '',
    code: '', // Added code field
    address: {
      street: '',
      village: '',
      block: '',
      district: '',
      state: '',
      pincode: ''
    },
    location: {
      latitude: '',
      longitude: ''
    },
    boundaryRadius: 100
  });

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
    } else if (activeTab === 'principals') {
      fetchPrincipalAttendance();
    } else if (activeTab === 'schools') {
      fetchSchools();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/attendance/stats`);
      setStatsData(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Error loading dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrincipalAttendance = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/attendance/principals`);
      setPrincipalAttendanceData(response.data);
    } catch (error) {
      console.error('Error fetching principal attendance:', error);
      toast.error('Error loading principal attendance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/schools`);
      setSchoolsData(response.data);
    } catch (error) {
      console.error('Error fetching schools:', error);
      toast.error('Error loading schools data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePrincipal = async (attendanceId) => {
    try {
      await axios.put(`${API_BASE_URL}/api/attendance/principals/${attendanceId}/approve`);
      toast.success('Principal attendance approved successfully');
      fetchPrincipalAttendance(); // Refresh data
    } catch (error) {
      console.error('Error approving principal attendance:', error);
      toast.error('Error approving principal attendance');
    }
  };

  const handleRejectPrincipal = async (attendanceId) => {
    try {
      await axios.put(`${API_BASE_URL}/api/attendance/principals/${attendanceId}/reject`);
      toast.success('Principal attendance rejected successfully');
      fetchPrincipalAttendance(); // Refresh data
    } catch (error) {
      console.error('Error rejecting principal attendance:', error);
      toast.error('Error rejecting principal attendance');
    }
  };

  const downloadPrincipalCSV = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/attendance/principals/export`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `principal_attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Principal CSV report downloaded successfully');
    } catch (error) {
      console.error('Error downloading principal CSV:', error);
      toast.error('Error downloading principal CSV report');
    }
  };

  const filteredPrincipalData = principalAttendanceData.filter(attendance => {
    const matchesDate = !filterDate || attendance.checkInTime.startsWith(filterDate);
    const matchesPrincipal = !filterPrincipal || 
      attendance.teacher.name.toLowerCase().includes(filterPrincipal.toLowerCase());
    return matchesDate && matchesPrincipal;
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

  const handleAddSchool = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/api/schools`, newSchool);
      toast.success('School added successfully');
      setShowAddSchoolModal(false);
      setNewSchool({
        name: '',
        code: '', // Reset code field
        address: {
          street: '',
          village: '',
          block: '',
          district: '',
          state: '',
          pincode: ''
        },
        location: {
          latitude: '',
          longitude: ''
        },
        boundaryRadius: 100
      });
      fetchSchools(); // Refresh schools list
    } catch (error) {
      console.error('Error adding school:', error);
      toast.error(error.response?.data?.message || 'Error adding school');
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setNewSchool(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setNewSchool(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Add a function to fetch today's attendance for a principal by ID
  const fetchPrincipalTodayAttendance = async (principalId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/attendance/today`, {
        params: { userId: principalId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching today\'s attendance for principal:', error);
      return { checkInTime: null, checkOutTime: null };
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FaUsers className="h-4 w-4" />
                <span>Overview</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('principals')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'principals'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FaUserTie className="h-4 w-4" />
                <span>Principal Attendance</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('schools')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'schools'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FaSchool className="h-4 w-4" />
                <span>Schools</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaSchool className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Schools</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {statsData.total?.schools || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaUsers className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Teachers</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {statsData.total?.teachers || 0}
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
                  <p className="text-sm font-medium text-gray-500">Today's Check-ins</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {statsData.today?.totalCheckIns || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaUserTie className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Approved Today</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {statsData.today?.approvedCheckIns || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Stats Chart */}
          {statsData.weekly && statsData.weekly.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Attendance Trend</h3>
              <div className="grid grid-cols-7 gap-4">
                {statsData.weekly.map((day, index) => (
                  <div key={index} className="text-center">
                    <div className="text-sm text-gray-600 mb-2">
                      {new Date(day._id).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-lg font-semibold text-blue-600">
                      {day.checkIns}
                    </div>
                    <div className="text-xs text-green-600">
                      {day.approved} approved
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Principal Attendance Tab */}
      {activeTab === 'principals' && (
        <>
          {/* Filters and Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <h3 className="text-lg font-semibold text-gray-900">Principal Attendance Management</h3>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <input
                  type="text"
                  placeholder="Filter by principal name"
                  value={filterPrincipal}
                  onChange={(e) => setFilterPrincipal(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                
                <button
                  onClick={downloadPrincipalCSV}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <FaDownload className="h-4 w-4" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Principal Attendance Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading principal attendance data...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Principal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        School
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
                    {filteredPrincipalData.map((attendance) => (
                      <tr key={attendance._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-purple-600">
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
                          {attendance.school?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {attendance.todayAttendance?.checkInTime ?
                            new Date(attendance.todayAttendance.checkInTime).toLocaleString('en-IN', {
                              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                            }) :
                            'No check-in recorded'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {attendance.todayAttendance?.checkOutTime ?
                            new Date(attendance.todayAttendance.checkOutTime).toLocaleString('en-IN', {
                              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                            }) :
                            'No check-out recorded'}
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
                                  onClick={() => handleApprovePrincipal(attendance._id)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  <FaCheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleRejectPrincipal(attendance._id)}
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

      {/* Schools Tab */}
      {activeTab === 'schools' && (
        <>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">School Management</h3>
              <button
                onClick={() => setShowAddSchoolModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <FaSchool className="h-4 w-4" />
                <span>Add School</span>
              </button>
            </div>
            
            {loading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading schools data...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schoolsData.map((school) => (
                  <div key={school._id} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900">{school.name}</h4>
                    <p className="text-sm text-gray-600">
                      {school.address?.village && `${school.address.village}, `}
                      {school.address?.block && `${school.address.block}, `}
                      {school.address?.district && `${school.address.district}, `}
                      {school.address?.state && school.address.state}
                      {school.address?.pincode && ` - ${school.address.pincode}`}
                    </p>
                    <div className="mt-2 text-xs text-gray-500">
                      <p>Lat: {school.location.latitude.toFixed(4)}</p>
                      <p>Lon: {school.location.longitude.toFixed(4)}</p>
                      <p>Boundary: {school.boundaryRadius}m</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add School Modal */}
      {showAddSchoolModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New School</h3>
                <button
                  onClick={() => setShowAddSchoolModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddSchool} className="space-y-4">
                {/* School Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSchool.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter school name"
                  />
                </div>
                {/* School Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSchool.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter unique school code"
                  />
                </div>

                {/* Address Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Street
                    </label>
                    <input
                      type="text"
                      value={newSchool.address.street}
                      onChange={(e) => handleInputChange('address.street', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Street address"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Village *
                    </label>
                    <input
                      type="text"
                      required
                      value={newSchool.address.village}
                      onChange={(e) => handleInputChange('address.village', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Village name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Block *
                    </label>
                    <input
                      type="text"
                      required
                      value={newSchool.address.block}
                      onChange={(e) => handleInputChange('address.block', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Block name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      District *
                    </label>
                    <input
                      type="text"
                      required
                      value={newSchool.address.district}
                      onChange={(e) => handleInputChange('address.district', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="District name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={newSchool.address.state}
                      onChange={(e) => handleInputChange('address.state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="State name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      required
                      value={newSchool.address.pincode}
                      onChange={(e) => handleInputChange('address.pincode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="6-digit pincode"
                    />
                  </div>
                </div>

                {/* Location Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newSchool.location.latitude}
                      onChange={(e) => handleInputChange('location.latitude', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 25.2048"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newSchool.location.longitude}
                      onChange={(e) => handleInputChange('location.longitude', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 55.2708"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Boundary Radius (meters) *
                    </label>
                    <input
                      type="number"
                      required
                      min="50"
                      max="1000"
                      value={newSchool.boundaryRadius}
                      onChange={(e) => handleInputChange('boundaryRadius', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="100"
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddSchoolModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Add School
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
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
                    alt="Principal" 
                    className="w-full rounded-lg"
                  />
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Principal: {selectedAttendance.teacher.name}</p>
                  <p className="text-sm text-gray-500">School: {selectedAttendance.school?.name || 'N/A'}</p>
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

export default AdminDashboard; 