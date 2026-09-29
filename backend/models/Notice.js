const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Notice title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    fullContent: {
      type: String,
      trim: true,
      maxlength: [5000, 'Full content cannot exceed 5000 characters'],
      default: ''
    },
    category: {
      type: String,
      required: true,
      enum: ['academic', 'admission', 'midday', 'celebration', 'gov', 'holiday', 'general'],
      default: 'general'
    },
    refNo: {
      type: String,
      trim: true,
      maxlength: [100, 'Reference number cannot exceed 100 characters'],
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    publishedBy: {
      type: String,
      default: 'Admin'
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient queries
noticeSchema.index({ createdAt: -1 });
noticeSchema.index({ category: 1 });
noticeSchema.index({ isActive: 1 });

// Virtual: category display name
noticeSchema.virtual('categoryName').get(function () {
  const map = {
    academic: 'Academic',
    admission: 'Admissions',
    midday: 'PM POSHAN',
    celebration: 'Celebrations',
    gov: 'Govt Circular',
    holiday: 'Holidays',
    general: 'General'
  };
  return map[this.category] || 'General';
});

noticeSchema.set('toJSON', { virtuals: true });

const Notice = mongoose.model('Notice', noticeSchema);

module.exports = Notice;
