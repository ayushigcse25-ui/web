const { inquiries: Inquiry } = require('../config/localDb');
const { sendEmailNotification } = require('../services/emailService');
const { sendWhatsAppNotification } = require('../services/whatsappService');

/**
 * @desc    Submit a new contact / inquiry form
 * @route   POST /api/inquiries
 * @access  Public
 */
const createInquiry = async (req, res, next) => {
  try {
    const { name, phone, category, message } = req.body;

    // 1. Extract IP for audit/spam logs
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || req.ip;

    // 2. Persist inquiry into local JSON database
    const inquiry = Inquiry.create({
      name,
      phone,
      category,
      message,
      status: 'new',
      ipAddress
    });

    console.log(`[Inquiry Controller] Inquiry saved locally with ID: ${inquiry._id}`);

    // 3. Dispatch Email & WhatsApp Notifications in parallel
    const notificationPayload = {
      name: inquiry.name,
      phone: inquiry.phone,
      category: inquiry.category,
      message: inquiry.message,
      createdAt: inquiry.createdAt
    };

    Promise.allSettled([
      sendEmailNotification(notificationPayload),
      sendWhatsAppNotification(notificationPayload)
    ]).then(async ([emailResult, whatsappResult]) => {
      let emailSent = false;
      let emailError = null;
      let whatsappSent = false;
      let whatsappError = null;

      if (emailResult.status === 'fulfilled') {
        emailSent = emailResult.value.success;
        if (!emailResult.value.success) {
          emailError = emailResult.value.error || 'Email dispatch failed or skipped';
        }
      } else {
        emailError = emailResult.reason?.message || 'Email service error';
        console.error('[Email Notification Error]', emailResult.reason);
      }

      if (whatsappResult.status === 'fulfilled') {
        whatsappSent = whatsappResult.value.success;
        if (!whatsappResult.value.success) {
          whatsappError = whatsappResult.value.error || 'WhatsApp dispatch failed or skipped';
        }
      } else {
        whatsappError = whatsappResult.reason?.message || 'WhatsApp service error';
        console.error('[WhatsApp Notification Error]', whatsappResult.reason);
      }

      // Update the inquiry record with notification statuses
      try {
        Inquiry.findByIdAndUpdate(inquiry._id, {
          'notificationStatus.emailSent': emailSent,
          'notificationStatus.whatsappSent': whatsappSent,
          'notificationStatus.emailError': emailError,
          'notificationStatus.whatsappError': whatsappError
        });
      } catch (dbUpdateErr) {
        console.error('[Inquiry Controller] Failed to update notificationStatus in DB:', dbUpdateErr.message);
      }
    }).catch(err => {
      console.error('[Inquiry Controller] Notification background processing error:', err.message);
    });

    // 4. Return successful response to user
    return res.status(201).json({
      success: true,
      message: 'Your inquiry has been submitted successfully.'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all submitted inquiries (Admin only)
 * @route   GET /api/inquiries
 * @access  Private (Admin API Key required)
 */
const getInquiries = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const status = req.query.status;
    const category = req.query.category;
    const search = req.query.search;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) query.search = search;

    let inquiries = Inquiry.find(query);
    const total = inquiries.length;
    
    // Sort and paginate
    inquiries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    inquiries = inquiries.slice((page - 1) * limit, page * limit);

    res.status(200).json({
      success: true,
      data: {
        total,
        page,
        pages: Math.ceil(total / limit),
        count: inquiries.length,
        inquiries
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single inquiry by ID (Admin only)
 * @route   GET /api/inquiries/:id
 * @access  Private (Admin API Key required)
 */
const getInquiryById = async (req, res, next) => {
  try {
    const inquiry = Inquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    // Auto-mark as 'read' if it was 'new'
    if (inquiry.status === 'new') {
      Inquiry.findByIdAndUpdate(inquiry._id, { status: 'read' });
      inquiry.status = 'read';
    }

    res.status(200).json({
      success: true,
      data: inquiry
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update inquiry status (Admin only)
 * @route   PATCH /api/inquiries/:id/status
 * @access  Private (Admin API Key required)
 */
const updateInquiryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['new', 'read', 'in_progress', 'resolved', 'archived'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${validStatuses.join(', ')}`
      });
    }

    const inquiry = Inquiry.findByIdAndUpdate(req.params.id, { status });

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Inquiry status updated successfully',
      data: inquiry
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInquiry,
  getInquiries,
  getInquiryById,
  updateInquiryStatus
};
