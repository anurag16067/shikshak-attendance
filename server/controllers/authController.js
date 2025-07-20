const jwt = require('jsonwebtoken');
const User = require('../models/User');
const School = require('../models/School');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register user
const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, schoolId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // For teachers and principals, validate school exists
    let school = null;
    if (role === 'teacher' || role === 'principal') {
      if (!schoolId) {
        return res.status(400).json({ message: 'School ID is required for teachers and principals' });
      }
      
      school = await School.findById(schoolId);
      if (!school) {
        return res.status(400).json({ message: 'School not found' });
      }
      
      if (!school.isActive) {
        return res.status(400).json({ message: 'School is not active' });
      }
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role: role || 'teacher',
      phone,
      school: school ? school._id : null
    });

    await user.save();

    // Update school's teacher/principal count
    if (school) {
      if (role === 'principal') {
        school.principal = user._id;
      } else if (role === 'teacher') {
        school.teachers.push(user._id);
      }
      school.totalTeachers = school.teachers.length;
      await school.save();
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        school: school ? {
          id: school._id,
          name: school.name,
          code: school.code,
          location: school.location,
          address: school.address
        } : null
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is deactivated' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Populate school data for response
    const userWithSchool = await User.findById(user._id)
      .select('-password')
      .populate('school', 'name code location address');

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        school: userWithSchool.school,
        lastCheckIn: user.lastCheckIn,
        lastCheckOut: user.lastCheckOut
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('school', 'name code location address');
    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  getMe
}; 