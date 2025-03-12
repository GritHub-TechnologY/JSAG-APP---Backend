import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\+?[\d\s-]+$/, 'Please enter a valid phone number']
  },
  role: {
    type: String,
    enum: ['admin', 'leader', 'member'],
    default: 'member'
  },
  dayGroup: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'adminDay'],
    required: [true, 'Please specify a day group'],
    validate: {
      validator: function(value) {
        // Only admins can have adminDay
        if (value === 'adminDay' && this.role !== 'admin') {
          return false;
        }
        return true;
      },
      message: 'Only admin users can be assigned to adminDay'
    }
  },
  department: {
    type: String,
    required: [true, 'Please specify a department']
  },
  active: {
    type: Boolean,
    default: true
  },
  managedMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: async function(memberId) {
        if (this.role !== 'leader') return true;
        const member = await mongoose.model('User').findById(memberId);
        return member && member.dayGroup === this.dayGroup;
      },
      message: 'Members must be in the same day group as their leader'
    }
  }],
  lastLogin: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active'
  },
  refreshTokens: [{
    token: {
      type: String,
      required: true
    },
    expires: {
      type: Date,
      required: true
    },
    userAgent: String,
    ipAddress: String
  }],
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phoneNumber: 1 }, { unique: true });
userSchema.index({ role: 1, dayGroup: 1 });

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password reset token
userSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Add refresh token to user
userSchema.methods.addRefreshToken = function(token, expires, userAgent, ipAddress) {
  this.refreshTokens.push({
    token,
    expires,
    userAgent,
    ipAddress
  });
  return this.save();
};

// Remove refresh token from user
userSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(t => t.token !== token);
  return this.save();
};

// Clean expired refresh tokens
userSchema.methods.cleanRefreshTokens = function() {
  this.refreshTokens = this.refreshTokens.filter(t => t.expires > Date.now());
  return this.save();
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.name}`;
});

// Cascade delete attendance when a user is deleted
userSchema.pre('remove', async function(next) {
  await this.model('Attendance').deleteMany({ user: this._id });
  next();
});

const User = mongoose.model('User', userSchema);

export default User; 