
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Generate JWT token - FIXED TYPOS
const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user._id, 
           
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
    );
};

// Register new user
const register = async (req, res, next) => {
    try {
        const { fullName, email, collegeId, user1Id, password, confirmPassword, branch, role } = req.body;

        // Validation
        if (!fullName || !email || !password || !confirmPassword || !role || !collegeId || !user1Id || !branch) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }
        
        if (user1Id.length < 12) {
            return res.status(400).json({ message: 'Id must be 12 characters long' });
        }
        
        if (collegeId.length < 6) {
            return res.status(400).json({ message: 'College ID must be at least 6 characters long' });
        }

        // Validate role
        if (!['student', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role selected' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Create new user
        const user = new User({
            fullName,
            email,
            collegeId,
            user1Id,
            password,
            branch,
            role,
            userType: "university"
        });

        await user.save();
        console.log('User registered successfully:', user.email);

        // Generate JWT token
        const token = generateToken(user);
        
        // Send response with token and user details
        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                collegeId: user.collegeId,
                user1Id: user.user1Id,
                email: user.email,
                branch: user.branch,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        next(error);
    }
};

// register for the coaching student
const registerC = async (req, res, next) => {
    try {
        const { fullName, email,  password, confirmPassword,  role } = req.body;

        // Validation
        if (!fullName || !email || !password || !confirmPassword || !role ) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }
        
        

        // Validate role
        if (!['student', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role selected' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Create new user
        const user = new User({
            fullName,
            email,
            password,
            role,
            userType:"coaching"
        });

        await user.save();
        console.log('User registered successfully:', user.email);

        // Generate JWT token
        const token = generateToken(user);
        
        // Send response with token and user details
        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                
                email: user.email,
                
                role: user.role
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        next(error);
    }
};




const login = async (req, res, next) => {
    try {
        const { email, password,  role } = req.body;
        console.log('Login attempt:', email, role);

        // Validation
        if (!email || !password || !role ) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Find user by email and other credentials
        const user = await User.findOne({ email, role });
         // FIXED: was user1Id, branch (not used in this context)
        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            console.log('Invalid password for user:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check role
        if (user.role !== role) {
            console.log('Role mismatch for user:', email, 'Expected:', role, 'Actual:', user.role);
            return res.status(401).json({ message: 'Invalid role selected' });
        }

        // Generate JWT token
        const token = generateToken(user);

        
       let redirectUrl;
       if (user.collegeId && user.user1Id && user.branch) {
            if (role === 'admin') {
                redirectUrl = `/admin-dashboard.html?collegeId=${user.collegeId}&user1Id=${user.user1Id}&branch=${user.branch}`;
            }
            else {
                redirectUrl = `/student-dashboard.html?collegeId=${user.collegeId}&user1Id=${user.user1Id}&branch=${user.branch}`;
            }
        }else{
            if (role === 'admin') {
                redirectUrl=`/admin-dashboard.html?Email=${encodeURIComponent(user.email)}&id=${user._id}`;
            }
            else{
                redirectUrl=`/student-dashboard.html?Email=${encodeURIComponent(user.email)}&id=${user._id}`;
            }    
        }



        console.log('Login successful for:', email, 'Redirecting to:', redirectUrl);

        
        // In the login function, update the user object in the response:

   res.json({
    message: 'Login successful',
    token,
    redirectUrl,
    user: {
        id: user._id,
        _id: user._id, // Add this for compatibility
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        // Include university fields if they exist (for university users)
        ...(user.collegeId && { collegeId: user.collegeId }),
        ...(user.user1Id && { user1Id: user.user1Id }),
        ...(user.branch && { branch: user.branch }),
        userType: user.userType
    }
 });

    } catch (error) {
        console.error('Login error:', error);
        next(error);
    }
};

// Get user profile
const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId).select('-password'); // FIXED: was req.user.id
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Profile error:', error);
        next(error);
    }
};

// Logout (client-side will handle token removal)
const logout = (req, res) => {
    res.json({ message: 'Logout successful' });
};

module.exports = {
    register,
    registerC,
    login,
    getProfile,
    logout
};
