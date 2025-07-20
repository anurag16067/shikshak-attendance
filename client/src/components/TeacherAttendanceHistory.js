import React, { useState, useEffect } from 'react';
import { FaCalendar, FaCheckCircle, FaTimesCircle, FaClock, FaDownload, FaFilter, FaEye } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_BASE_URL from '../config/api';

const TeacherAttendanceHistory = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({});
  const [pagination, setPagination] = useState({});
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchAttendanceHistory();
  }, [currentPage, selectedMonth, selectedYear]);

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10
      });

      if (selectedMonth) {
        params.append('month', selectedMonth);
      }
      if (selectedYear) {
        params.append('year', selectedYear);
      }

      const response = await axios.get(`${API_BASE_URL}/api/attendance/history?${params}`);
      
      setAttendanceData(response.data.attendance);
      setStatistics(response.data.statistics);
      setPagination(response.data.pagination);
      setMonthlySummary(response.data.monthlySummary);
      
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      toast.error('Error loading attendance history');
    } finally {
      setLoading(false);
    }
  };

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

  const downloadCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedMonth) params.append('month', selectedMonth);
      if (selectedYear) params.append('year', selectedYear);

      const response = await axios.get(`${API_BASE_URL}/api/attendance/history/export?${params}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `my_attendance_${selectedMonth || 'all'}_${selectedYear}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Attendance report downloaded successfully');
    } catch (error) {
      console.error('Error downloading CSV:', error);
      toast.error('Error downloading attendance report');
    }
  };

  const getMonthName = (monthNumber) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1];
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaCalendar className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Days</p>
              <p className="text-2xl font-semibold text-gray-900">
                {statistics.totalDays || 0}
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
              <p className="text-sm font-medium text-gray-500">Present Days</p>
              <p className="text-2xl font-semibold text-gray-900">
                {statistics.presentDays || 0}
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
              <p className="text-sm font-medium text-gray-500">Absent Days</p>
              <p className="text-2xl font-semibold text-gray-900">
                {statistics.absentDays || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaClock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {statistics.attendanceRate || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <h3 className="text-lg font-semibold text-gray-900">My Attendance History</h3>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Months</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>
                  {getMonthName(month)}
                </option>
              ))}
            </select>
            
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            
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

      {/* Monthly Summary */}
      {monthlySummary.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Monthly Summary ({selectedYear})</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {monthlySummary.map((month) => (
              <div key={`${month._id.year}-${month._id.month}`} className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-900">{getMonthName(month._id.month)}</h5>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Present:</span>
                    <span className="font-medium text-green-600">{month.presentDays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Absent:</span>
                    <span className="font-medium text-red-600">{month.absentDays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending:</span>
                    <span className="font-medium text-yellow-600">{month.pendingDays}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading attendance history...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-in Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-out Time
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
                {attendanceData.map((attendance) => (
                  <tr key={attendance._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(attendance.checkInTime).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(attendance.checkInTime).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {attendance.checkOutTime ? 
                        new Date(attendance.checkOutTime).toLocaleTimeString() : 
                        <span className="text-gray-400 italic">Not checked out</span>
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(attendance.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => viewAttendanceDetails(attendance)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <FaEye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.currentPage - 1) * pagination.recordsPerPage) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.recordsPerPage, pagination.totalRecords)} of{' '}
              {pagination.totalRecords} records
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm text-gray-700">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
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
                    alt="Check-in Photo" 
                    className="w-full rounded-lg"
                  />
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Date: {new Date(selectedAttendance.checkInTime).toLocaleDateString()}</p>
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
    </div>
  );
};

export default TeacherAttendanceHistory; 