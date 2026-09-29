const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    phone: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      validate: {
        validator: function (v) {
          // Validates 10-digit Indian mobile numbers (starts with 6, 7, 8, or 9)
          return /^[6-9]\d{9}$/.test(v);
        },
        message: props => `${props.value} is not a valid 10-digit Indian mobile number!`
      }
    },
    category: {
      type: String,
      required: [true, 'Inquiry category is required'],
      trim: true,
      maxlength: [100, 'Category cannot exceed 100 characters']
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [5, 'Message must be at least 5 characters'],
      maxlength: [2000, 'Message cannot exceed 2000 characters']
    },
    status: {
      type: String,
      enum: ['new', 'read', 'in_progress', 'resolved', 'archived'],
      default: 'new'
    },
    notificationStatus: {
      emailSent: {
        type: Boolean,
        default: false
      },
      whatsappSent: {
        type: Boolean,
        default: false
      },
      emailError: {
        type: String,
        default: null
      },
      whatsappError: {
        type: String,
        default: null
      }
    },
    ipAddress: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Index for query efficiency in admin lookups
inquirySchema.index({ createdAt: -1 });
inquirySchema.index({ status: 1 });
inquirySchema.index({ phone: 1 });

const Inquiry = mongoose.model('Inquiry', inquirySchema);

module.exports = Inquiry;
