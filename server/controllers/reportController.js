const Attendance = require('../models/Attendance');
const School = require('../models/School');
const { Parser } = require('json2csv');

// Get district-level attendance stats
exports.getStats = async (req, res) => {
  try {
    const schools = await School.find({ isActive: true });
    const today = new Date();
    today.setHours(0,0,0,0);
    let totalTeachers = 0;
    let totalPresent = 0;
    for (const school of schools) {
      totalTeachers += school.totalTeachers || 0;
      const present = await Attendance.countDocuments({
        school: school._id,
        checkInTime: { $gte: today },
        status: 'approved'
      });
      totalPresent += present;
    }
    const averageAttendance = totalTeachers > 0 ? Math.round((totalPresent / totalTeachers) * 100) : 0;
    res.json({ totalTeachers, totalPresent, averageAttendance });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Export district report as CSV
exports.exportDistrictReport = async (req, res) => {
  try {
    const schools = await School.find({ isActive: true });
    const today = new Date();
    today.setHours(0,0,0,0);
    const report = await Promise.all(schools.map(async (school) => {
      const presentTeachers = await Attendance.countDocuments({
        school: school._id,
        checkInTime: { $gte: today },
        status: 'approved'
      });
      return {
        School: school.name,
        Block: school.address.block,
        District: school.address.district,
        TotalTeachers: school.totalTeachers,
        PresentTeachers: presentTeachers,
        AttendancePercent: school.totalTeachers > 0 ? Math.round((presentTeachers / school.totalTeachers) * 100) : 0
      };
    }));
    const fields = ['School', 'Block', 'District', 'TotalTeachers', 'PresentTeachers', 'AttendancePercent'];
    const parser = new Parser({ fields });
    const csv = parser.parse(report);
    res.header('Content-Type', 'text/csv');
    res.attachment('district_report.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Export district report error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
}; 