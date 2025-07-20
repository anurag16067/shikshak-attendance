import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FaSignOutAlt, FaUser, FaSchool, FaMapMarkerAlt } from 'react-icons/fa';
import TeacherDashboard from './TeacherDashboard';
import PrincipalDashboard from './PrincipalDashboard';
import AdminDashboard from './AdminDashboard';

const Dashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const renderDashboard = () => {
    switch (user?.role) {
      case 'teacher':
        return <TeacherDashboard />;
      case 'principal':
        return <PrincipalDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <div>Unknown role</div>;
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-primary-600">
                  Shikshak Watch
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <FaUser className="h-4 w-4 text-primary-600" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-gray-500 capitalize">{user.role}</p>
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaSignOutAlt className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {getGreeting()}, {user.name}!
                </h2>
                <p className="text-gray-600 mt-1">
                  Welcome to Shikshak Watch - Teacher Attendance Management System
                </p>
              </div>
              
              {/* School Info */}
              {user.school && (
                <div className="text-right">
                  <div className="flex items-center justify-end space-x-2 text-gray-600">
                    <FaSchool className="h-4 w-4" />
                    <span className="font-medium">{user.school.name}</span>
                  </div>
                  {user.school.location && (
                    <div className="flex items-center justify-end space-x-2 text-sm text-gray-500 mt-1">
                      <FaMapMarkerAlt className="h-3 w-3" />
                      <span>
                        {user.school.location.latitude.toFixed(4)}, {user.school.location.longitude.toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="bg-success-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FaUser className="h-6 w-6 text-success-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-success-600">Role</p>
                    <p className="text-lg font-semibold text-success-900 capitalize">
                      {user.role}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-warning-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FaSchool className="h-6 w-6 text-warning-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-warning-600">Status</p>
                    <p className="text-lg font-semibold text-warning-900">
                      Active
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Role-specific Dashboard */}
          {renderDashboard()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 