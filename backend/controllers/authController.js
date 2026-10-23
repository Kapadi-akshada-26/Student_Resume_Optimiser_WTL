const bcrypt = require('bcryptjs');
const { findUserByEmail, createUser } = require('../config/db');

// Basic Email Regex Validator
const isValidEmail = (email) => {
  return /\S+@\S+\.\S+/.test(email);
};

// POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Field validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Check for duplicate email
    const existingUser = await findUserByEmail(cleanEmail);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // 3. Hash password using bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Save user to MySQL
    const newUser = await createUser(name.trim(), cleanEmail, passwordHash);

    // 5. Success response (without exposing password)
    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    });

  } catch (error) {
    console.error('Registration Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'A server error occurred during registration. Please try again.'
    });
  }
};

// POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Field validation
    if (!email || !email.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Find user in MySQL
    const user = await findUserByEmail(cleanEmail);
    if (!user) {
      // Generic error message for security
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // 3. Compare password with bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // 4. Return user info (no password hash)
    return res.status(200).json({
      success: true,
      message: 'Login successful! Welcome back.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: 'A server error occurred during login. Please try again.'
    });
  }
};

module.exports = {
  registerUser,
  loginUser
};
