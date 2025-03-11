import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true,
    validate: {
      validator: function(date) {
        // Check if it's a valid work day (Monday-Friday)
        const day = date.getDay();
        return day > 0 && day < 6;
      },
      message: 'Attendance can only be marked for weekdays'
    }
  },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Member is required'],
    index: true
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'system-absent'],
    default: 'absent'
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.status !== 'system-absent';
    }
  },
  overrideHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    previousStatus: {
      type: String,
      enum: ['present', 'absent', 'system-absent'],
      required: true
    },
    reason: {
      type: String,
      required: true
    }
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for unique attendance records per member per day
attendanceSchema.index({ member: 1, date: 1 }, { unique: true });

// Index for efficient querying by date range
attendanceSchema.index({ date: 1, status: 1 });

// Virtual for formatted date (YYYY-MM-DD)
attendanceSchema.virtual('formattedDate').get(function() {
  return this.date.toISOString().split('T')[0];
});

// Method to check if attendance can be marked for this date
attendanceSchema.statics.canMarkAttendance = function(date) {
  const now = new Date();
  const targetDate = new Date(date);
  
  // Can't mark attendance for future dates
  if (targetDate > now) {
    return false;
  }
  
  // Can mark attendance for today
  if (targetDate.toDateString() === now.toDateString()) {
    return true;
  }
  
  // For past dates, only allow marking within 24 hours
  const hoursDifference = (now - targetDate) / (1000 * 60 * 60);
  return hoursDifference <= 24;
};

// Pre-save middleware to validate attendance marking time
attendanceSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.constructor.canMarkAttendance(this.date)) {
    next(new Error('Attendance can only be marked within the allowed time window'));
  }
  next();
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance; 