const Attendance = require('../models/Attendance');
const User = require('../models/User');
const School = require('../models/School');
const cloudinary = require('../config/cloudinary');
const { isWithinSchoolBoundary } = require('../utils/haversine');
const { Parser } = require('json2csv');

// Teacher check-in
exports.checkIn = async (req, res) => {
  try {
    const { photo, location } = req.body;
    const user = req.user;

    if (user.role !== 'teacher' && user.role !== 'principal') {
      return res.status(403).json({ message: 'Only teachers and principals can check in.' });
    }

    // Find school
    const school = await School.findById(user.school);
    if (!school) {
      return res.status(400).json({ message: 'School not found.' });
    }

    // Check if teacher has already checked in today (FIRST - business rule)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      teacher: user._id,
      checkInTime: { $gte: today, $lt: tomorrow }
    });

    if (existingAttendance) {
      console.log('❌ Teacher already checked in today:', {
        teacherId: user._id,
        teacherName: user.name,
        existingCheckInTime: existingAttendance.checkInTime,
        today: today,
        tomorrow: tomorrow
      });
      return res.status(400).json({ 
        message: 'You have already checked in today. You can only check in once per day.' 
      });
    }

    // Geo-fencing check (SECOND - location validation)
    const { distance, isWithinBoundary, accuracy } = isWithinSchoolBoundary(
      location.latitude,
      location.longitude,
      school.location.latitude,
      school.location.longitude,
      school.boundaryRadius || 100,
      location.accuracy || null
    );

    console.log('📍 Geo-fencing check:', {
      teacherLocation: { lat: location.latitude, lon: location.longitude },
      schoolLocation: { lat: school.location.latitude, lon: school.location.longitude },
      distance: `${distance}m`,
      boundaryRadius: `${school.boundaryRadius || 100}m`,
      isWithinBoundary,
      accuracy: accuracy ? `${Math.round(accuracy)}m` : 'unknown',
      gpsAccuracy: location.accuracy ? `${Math.round(location.accuracy)}m` : 'unknown'
    });

    if (!isWithinBoundary) {
      return res.status(403).json({ 
        message: `You are not within the school boundary. Distance: ${distance}m, Boundary: ${school.boundaryRadius || 100}m` 
      });
    }

    // Upload photo to Cloudinary
    const uploadRes = await cloudinary.uploader.upload(photo, {
      folder: 'shikshak_watch/attendance',
      public_id: `${user._id}_${Date.now()}`
    });

    // Create attendance record
    const attendance = new Attendance({
      teacher: user._id,
      school: school._id,
      checkInTime: new Date(),
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || '',
      },
      photo: {
        url: uploadRes.secure_url,
        publicId: uploadRes.public_id
      },
      distance,
      isWithinBoundary,
      status: 'pending',
      deviceInfo: req.headers['user-agent'] ? { userAgent: req.headers['user-agent'] } : {}
    });
    await attendance.save();

    // Update user's lastCheckIn
    const previousLastCheckIn = user.lastCheckIn;
    user.lastCheckIn = attendance.checkInTime;
    await user.save();

    console.log('✅ Updated lastCheckIn for teacher:', {
      teacherId: user._id,
      teacherName: user.name,
      previousLastCheckIn: previousLastCheckIn ? new Date(previousLastCheckIn).toLocaleString() : 'None',
      newLastCheckIn: new Date(user.lastCheckIn).toLocaleString(),
      checkInTime: new Date(attendance.checkInTime).toLocaleString()
    });

    res.status(201).json({ message: 'Check-in successful. Awaiting approval.', attendance });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Server error during check-in.' });
  }
};

// Teacher check-out
exports.checkOut = async (req, res) => {
  try {
    const { photo, location } = req.body;
    const user = req.user;

    if (user.role !== 'teacher' && user.role !== 'principal') {
      return res.status(403).json({ message: 'Only teachers and principals can check out.' });
    }

    // Find school
    const school = await School.findById(user.school);
    if (!school) {
      return res.status(400).json({ message: 'School not found.' });
    }

    // Find today's attendance and check business rules (FIRST)
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const attendance = await Attendance.findOne({
      teacher: user._id,
      checkInTime: { $gte: today, $lt: tomorrow },
      checkOutTime: { $exists: false }
    });
    
    if (!attendance) {
      return res.status(400).json({ message: 'You need to check in before you can check out. Please check in first.' });
    }

    // Check if teacher has already checked out today
    const existingCheckOut = await Attendance.findOne({
      teacher: user._id,
      checkInTime: { $gte: today, $lt: tomorrow },
      checkOutTime: { $exists: true }
    });

    if (existingCheckOut) {
      console.log('❌ Teacher already checked out today:', {
        teacherId: user._id,
        teacherName: user.name,
        existingCheckOutTime: existingCheckOut.checkOutTime,
        today: today,
        tomorrow: tomorrow
      });
      return res.status(400).json({ 
        message: 'You have already checked out today. You can only check out once per day.' 
      });
    }

    // Geo-fencing check (SECOND - location validation)
    const { distance, isWithinBoundary, accuracy } = isWithinSchoolBoundary(
      location.latitude,
      location.longitude,
      school.location.latitude,
      school.location.longitude,
      school.boundaryRadius || 100,
      location.accuracy || null
    );

    console.log('📍 Check-out Geo-fencing check:', {
      teacherLocation: { lat: location.latitude, lon: location.longitude },
      schoolLocation: { lat: school.location.latitude, lon: school.location.longitude },
      distance: `${distance}m`,
      boundaryRadius: `${school.boundaryRadius || 100}m`,
      isWithinBoundary,
      accuracy: accuracy ? `${Math.round(accuracy)}m` : 'unknown',
      gpsAccuracy: location.accuracy ? `${Math.round(location.accuracy)}m` : 'unknown'
    });

    if (!isWithinBoundary) {
      return res.status(403).json({ 
        message: `You are not within the school boundary. Distance: ${distance}m, Boundary: ${school.boundaryRadius || 100}m` 
      });
    }

    // Upload photo to Cloudinary
    const uploadRes = await cloudinary.uploader.upload(photo, {
      folder: 'shikshak_watch/attendance',
      public_id: `${user._id}_checkout_${Date.now()}`
    });

    // Update attendance with check-out details
    attendance.checkOutTime = new Date();
    attendance.checkOutLocation = {
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address || '',
    };
    attendance.checkOutPhoto = {
      url: uploadRes.secure_url,
      publicId: uploadRes.public_id
    };
    attendance.checkOutDistance = distance;
    attendance.checkOutIsWithinBoundary = isWithinBoundary;
    
    await attendance.save();

    // Update user's lastCheckOut
    const previousLastCheckOut = user.lastCheckOut;
    user.lastCheckOut = attendance.checkOutTime;
    await user.save();

    console.log('✅ Updated lastCheckOut for teacher:', {
      teacherId: user._id,
      teacherName: user.name,
      previousLastCheckOut: previousLastCheckOut ? new Date(previousLastCheckOut).toLocaleString() : 'None',
      newLastCheckOut: new Date(user.lastCheckOut).toLocaleString(),
      checkOutTime: new Date(attendance.checkOutTime).toLocaleString()
    });

    res.json({ message: 'Check-out successful.', attendance });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Server error during check-out.' });
  }
};

// Get today's attendance status for a teacher/principal
exports.getTodayAttendanceStatus = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'teacher' && user.role !== 'principal') {
      return res.status(403).json({ message: 'Only teachers and principals can view their attendance status.' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await Attendance.findOne({
      teacher: user._id,
      checkInTime: { $gte: today, $lt: tomorrow }
    });

    const status = {
      hasCheckedIn: !!todayAttendance,
      hasCheckedOut: !!(todayAttendance && todayAttendance.checkOutTime),
      checkInTime: todayAttendance ? todayAttendance.checkInTime : null,
      checkOutTime: todayAttendance ? todayAttendance.checkOutTime : null,
      status: todayAttendance ? todayAttendance.status : null,
      lastCheckIn: user.lastCheckIn,
      lastCheckOut: user.lastCheckOut
    };

    console.log('📊 Today\'s attendance status for teacher:', {
      teacherId: user._id,
      teacherName: user.name,
      status
    });

    res.json(status);
  } catch (error) {
    console.error('Get today attendance status error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get all attendance for principal's school
exports.getSchoolAttendance = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'principal') {
      return res.status(403).json({ message: 'Only principals can view this.' });
    }
    const schoolId = user.school._id || user.school;
    const attendance = await Attendance.find({ school: schoolId })
      .populate('teacher', 'name email')
      .sort({ checkInTime: -1 });
    res.json(attendance);
  } catch (error) {
    console.error('Get school attendance error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Approve attendance
exports.approveAttendance = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'principal') {
      return res.status(403).json({ message: 'Only principals can approve.' });
    }
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance not found.' });
    }
    attendance.status = 'approved';
    attendance.approvedBy = user._id;
    attendance.approvedAt = new Date();
    await attendance.save();
    res.json({ message: 'Attendance approved.' });
  } catch (error) {
    console.error('Approve attendance error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Reject attendance
exports.rejectAttendance = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'principal') {
      return res.status(403).json({ message: 'Only principals can reject.' });
    }
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance not found.' });
    }
    attendance.status = 'rejected';
    attendance.approvedBy = user._id;
    attendance.approvedAt = new Date();
    await attendance.save();
    res.json({ message: 'Attendance rejected.' });
  } catch (error) {
    console.error('Reject attendance error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Admin: Approve principal attendance
exports.approvePrincipalAttendance = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can approve principal attendance.' });
    }
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance not found.' });
    }
    
    // Check if the attendance belongs to a principal
    const attendanceUser = await User.findById(attendance.teacher);
    if (!attendanceUser || attendanceUser.role !== 'principal') {
      return res.status(403).json({ message: 'This attendance does not belong to a principal.' });
    }
    
    attendance.status = 'approved';
    attendance.approvedBy = user._id;
    attendance.approvedAt = new Date();
    await attendance.save();
    
    console.log('✅ Admin approved principal attendance:', {
      adminId: user._id,
      adminName: user.name,
      principalId: attendanceUser._id,
      principalName: attendanceUser.name,
      attendanceId: attendance._id,
      checkInTime: attendance.checkInTime
    });
    
    res.json({ message: 'Principal attendance approved.' });
  } catch (error) {
    console.error('Approve principal attendance error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Admin: Reject principal attendance
exports.rejectPrincipalAttendance = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can reject principal attendance.' });
    }
    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance not found.' });
    }
    
    // Check if the attendance belongs to a principal
    const attendanceUser = await User.findById(attendance.teacher);
    if (!attendanceUser || attendanceUser.role !== 'principal') {
      return res.status(403).json({ message: 'This attendance does not belong to a principal.' });
    }
    
    attendance.status = 'rejected';
    attendance.approvedBy = user._id;
    attendance.approvedAt = new Date();
    await attendance.save();
    
    console.log('❌ Admin rejected principal attendance:', {
      adminId: user._id,
      adminName: user.name,
      principalId: attendanceUser._id,
      principalName: attendanceUser.name,
      attendanceId: attendance._id,
      checkInTime: attendance.checkInTime
    });
    
    res.json({ message: 'Principal attendance rejected.' });
  } catch (error) {
    console.error('Reject principal attendance error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Export attendance as CSV
exports.exportCSV = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'principal') {
      return res.status(403).json({ message: 'Only principals can export.' });
    }
    const schoolId = user.school._id || user.school;
    const attendance = await Attendance.find({ school: schoolId })
      .populate('teacher', 'name email')
      .sort({ checkInTime: -1 });
    const fields = [
      { label: 'Teacher Name', value: 'teacher.name' },
      { label: 'Teacher Email', value: 'teacher.email' },
      { label: 'Check-in Time', value: 'checkInTime' },
      { label: 'Check-out Time', value: 'checkOutTime' },
      { label: 'Latitude', value: 'location.latitude' },
      { label: 'Longitude', value: 'location.longitude' },
      { label: 'Distance (m)', value: 'distance' },
      { label: 'Status', value: 'status' }
    ];
    const parser = new Parser({ fields });
    const csv = parser.parse(attendance);
    res.header('Content-Type', 'text/csv');
    res.attachment('attendance.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get teacher/principal's attendance history
exports.getTeacherAttendanceHistory = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'teacher' && user.role !== 'principal') {
      return res.status(403).json({ message: 'Only teachers and principals can view their attendance history.' });
    }

    const { page = 1, limit = 10, month, year } = req.query;
    const skip = (page - 1) * limit;

    // Build date filter
    let dateFilter = {};
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      dateFilter = {
        checkInTime: { $gte: startDate, $lte: endDate }
      };
    }

    // Get attendance records for the teacher
    const attendance = await Attendance.find({
      teacher: user._id,
      ...dateFilter
    })
    .sort({ checkInTime: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Attendance.countDocuments({
      teacher: user._id,
      ...dateFilter
    });

    // Calculate attendance statistics
    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.status === 'approved').length;
    const absentDays = attendance.filter(a => a.status === 'rejected').length;
    const pendingDays = attendance.filter(a => a.status === 'pending').length;

    // Get monthly summary for the current year
    const currentYear = new Date().getFullYear();
    const monthlySummary = await Attendance.aggregate([
      {
        $match: {
          teacher: user._id,
          checkInTime: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$checkInTime' },
            year: { $year: '$checkInTime' }
          },
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          absentDays: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          },
          pendingDays: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    console.log('📊 Teacher/Principal attendance history:', {
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      totalRecords: total,
      currentPage: page,
      recordsReturned: attendance.length
    });

    res.json({
      attendance,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        recordsPerPage: parseInt(limit)
      },
      statistics: {
        totalDays,
        presentDays,
        absentDays,
        pendingDays,
        attendanceRate: totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0
      },
      monthlySummary
    });
  } catch (error) {
    console.error('Get teacher attendance history error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get all principal attendance for admin approval
exports.getPrincipalAttendance = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view principal attendance.' });
    }

    const attendance = await Attendance.find({
      'teacher': { $in: await User.find({ role: 'principal' }).distinct('_id') }
    })
    .populate('teacher', 'name email role school')
    .populate('school', 'name')
    .sort({ checkInTime: -1 });

    console.log('📊 Admin viewing principal attendance:', {
      adminId: user._id,
      adminName: user.name,
      totalRecords: attendance.length
    });

    res.json(attendance);
  } catch (error) {
    console.error('Get principal attendance error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get attendance stats for admin dashboard
exports.getAttendanceStats = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view stats.' });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get stats for today
    const todayStats = await Attendance.aggregate([
      {
        $match: {
          checkInTime: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: null,
          totalCheckIns: { $sum: 1 },
          approvedCheckIns: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          pendingCheckIns: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          rejectedCheckIns: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get total schools and teachers
    const totalSchools = await School.countDocuments({ isActive: true });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });

    // Get weekly stats (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyStats = await Attendance.aggregate([
      {
        $match: {
          checkInTime: { $gte: weekAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$checkInTime' }
          },
          checkIns: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const stats = {
      today: todayStats[0] || {
        totalCheckIns: 0,
        approvedCheckIns: 0,
        pendingCheckIns: 0,
        rejectedCheckIns: 0
      },
      total: {
        schools: totalSchools,
        teachers: totalTeachers
      },
      weekly: weeklyStats
    };

    res.json(stats);
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
}; 