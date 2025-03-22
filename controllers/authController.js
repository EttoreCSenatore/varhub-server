const bcrypt = require('bcrypt');  
const jwt = require('jsonwebtoken');  
const pool = require('../db');  
require('dotenv').config();  

// Signup logic with improved error handling
const signup = async (req, res) => {  
  try {  
    const { email, password, name } = req.body;  

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide all required fields: email, password, and name' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);  
    if (existingUser.rows.length > 0) {  
      return res.status(400).json({ 
        success: false,
        message: 'An account with this email already exists' 
      });  
    }  

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);  

    // Insert new user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, passwordHash, name]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ 
      success: true,
      message: 'User created successfully',
      token,
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        name: result.rows[0].name
      }
    });  
  } catch (error) {  
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false,
      message: 'An error occurred during registration. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });  
  }  
};  

// Login logic with improved error handling
const login = async (req, res) => {  
  try {  
    const { email, password } = req.body;  

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // Find user by email  
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);  
    if (user.rows.length === 0) {  
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });  
    }  

    // Compare password  
    const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);  
    if (!isMatch) {  
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });  
    }  

    // Generate JWT token  
    const token = jwt.sign(  
      { userId: user.rows[0].id },  
      process.env.JWT_SECRET,  
      { expiresIn: '24h' }  
    );  

    res.status(200).json({ 
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.rows[0].id,
        email: user.rows[0].email,
        name: user.rows[0].name
      }
    });  
  } catch (error) {  
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'An error occurred during login. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });  
  }  
};  

module.exports = { signup, login };