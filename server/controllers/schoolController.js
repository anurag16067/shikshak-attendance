const School = require('../models/School');
const Attendance = require('../models/Attendance');
const { sendSMS } = require('../config/twilio');
const User = require('../models/User');

// Create new school (admin only)
exports.createSchool = async (req, res) => {
  try {
    const { name, code, location, address, boundaryRadius } = req.body;

    // Check if school code already exists
    const existingSchool = await School.findOne({ code });
    if (existingSchool) {
      return res.status(400).json({ message: 'School code already exists' });
    }

    // Create new school
    const school = new School({
      name,
      code,
      location,
      address,
      boundaryRadius: boundaryRadius || 100
    });

    await school.save();

    res.status(201).json({
      message: 'School created successfully',
      school
    });
  } catch (error) {
    console.error('Create school error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Update school (admin only)
exports.updateSchool = async (req, res) => {
  try {
    const { name, location, address, boundaryRadius, isActive } = req.body;
    
    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ message: 'School not found.' });
    }

    // Update fields
    if (name) school.name = name;
    if (location) school.location = location;
    if (address) school.address = address;
    if (boundaryRadius !== undefined) school.boundaryRadius = boundaryRadius;
    if (isActive !== undefined) school.isActive = isActive;

    await school.save();

    res.json({
      message: 'School updated successfully',
      school
    });
  } catch (error) {
    console.error('Update school error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Delete school (admin only)
exports.deleteSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ message: 'School not found.' });
    }

    // Check if school has teachers or principals
    const teachersCount = await User.countDocuments({ 
      school: school._id, 
      role: { $in: ['teacher', 'principal'] } 
    });

    if (teachersCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete school. ${teachersCount} teachers/principals are assigned to this school.` 
      });
    }

    await School.findByIdAndDelete(req.params.id);

    res.json({ message: 'School deleted successfully' });
  } catch (error) {
    console.error('Delete school error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// List all schools
exports.listSchools = async (req, res) => {
  try {
    console.log('🔍 Admin requesting schools list');
    console.log('👤 User:', req.user);
    console.log('🔐 User role:', req.user.role);
    
    const schools = await School.find({ isActive: true });
    console.log('📊 Found schools:', schools.length);
    
    // Add presentTeachers count for today
    const today = new Date();
    today.setHours(0,0,0,0);
    const schoolsWithAttendance = await Promise.all(schools.map(async (school) => {
      const presentTeachers = await Attendance.countDocuments({
        school: school._id,
        checkInTime: { $gte: today },
        status: 'approved'
      });
      return {
        ...school.toObject(),
        presentTeachers
      };
    }));
    
    console.log('📈 Returning schools with attendance data');
    res.json(schoolsWithAttendance);
  } catch (error) {
    console.error('List schools error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Debug: List all schools (including inactive)
exports.listAllSchools = async (req, res) => {
  try {
    const allSchools = await School.find({});
    console.log('🔍 All schools in database:', allSchools.length);
    allSchools.forEach(school => {
      console.log(`- ${school.name} (${school.code}) - isActive: ${school.isActive}`);
    });
    res.json({
      total: allSchools.length,
      active: allSchools.filter(s => s.isActive).length,
      inactive: allSchools.filter(s => !s.isActive).length,
      schools: allSchools
    });
  } catch (error) {
    console.error('Debug list schools error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get school details
exports.getSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ message: 'School not found.' });
    }
    res.json(school);
  } catch (error) {
    console.error('Get school error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Send SMS alert
exports.sendSMSAlert = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ message: 'School not found.' });
    }

    // Get teachers and principal for this school
    const users = await User.find({
      school: school._id,
      role: { $in: ['teacher', 'principal'] },
      isActive: true
    });

    if (users.length === 0) {
      return res.status(400).json({ message: 'No teachers found for this school.' });
    }

    // Send SMS to all teachers and principal
    const smsPromises = users.map(user => 
      sendSMS(
        user.phone,
        `Shikshak Watch Alert: Low attendance at ${school.name}. Please check in immediately.`
      )
    );

    await Promise.all(smsPromises);

    res.json({ 
      message: `SMS alert sent to ${users.length} teachers/principal at ${school.name}` 
    });
  } catch (error) {
    console.error('Send SMS alert error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get schools for dropdown (for registration)
exports.getSchoolsForDropdown = async (req, res) => {
  try {
    const schools = await School.find({ isActive: true })
      .select('name code address')
      .sort('name');
    
    res.json(schools);
  } catch (error) {
    console.error('Get schools dropdown error:', error);
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

// Update school boundary radius
exports.updateBoundaryRadius = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { boundaryRadius } = req.body;
    
    if (!boundaryRadius || boundaryRadius < 50 || boundaryRadius > 10000) {
      return res.status(400).json({ message: 'Boundary radius must be between 50 and 10000 meters.' });
    }
    
    const school = await School.findByIdAndUpdate(
      schoolId,
      { boundaryRadius },
      { new: true }
    );
    
    if (!school) {
      return res.status(404).json({ message: 'School not found.' });
    }
    
    res.json({ message: 'Boundary radius updated successfully.', school });
  } catch (error) {
    console.error('Update boundary radius error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
}; 