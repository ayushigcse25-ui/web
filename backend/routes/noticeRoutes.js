const express = require('express');
const router = express.Router();
const { notices: Notice } = require('../config/localDb');
const { adminAuth } = require('../middleware/auth');

/* ──────────────────────────────────────────────
   PUBLIC: GET /api/notices
   Returns active notices for the frontend notice board
   ────────────────────────────────────────────── */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 50);
    const category = req.query.category;

    const query = { isActive: true };
    if (category && category !== 'all') query.category = category;

    let notices = Notice.find(query);
    notices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    notices = notices.slice(0, limit);

    res.status(200).json({ success: true, count: notices.length, data: notices });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching notices.' });
  }
});

/* ──────────────────────────────────────────────
   ADMIN: GET /api/notices/all  (includes inactive)
   ────────────────────────────────────────────── */
router.get('/all', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);

    let notices = Notice.find({});
    const total = notices.length;
    
    notices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    notices = notices.slice((page - 1) * limit, page * limit);

    res.status(200).json({
      success: true,
      data: { total, page, pages: Math.ceil(total / limit), notices }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error fetching notices.' });
  }
});

/* ──────────────────────────────────────────────
   ADMIN: POST /api/notices  — Create a new notice
   ────────────────────────────────────────────── */
router.post('/', adminAuth, async (req, res) => {
  try {
    const { title, description, fullContent, category, refNo } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    // Auto-generate refNo if not provided
    const autoRef = refNo || `ZP-GHD/${new Date().getFullYear()}/${Date.now().toString().slice(-4)}`;

    const notice = Notice.create({
      title: title.trim(),
      description: description.trim(),
      fullContent: (fullContent || description).trim(),
      category: category || 'general',
      refNo: autoRef,
      publishedBy: req.admin?.username || 'Admin'
    });

    res.status(201).json({ success: true, message: 'Notice published successfully.', data: notice });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error creating notice.' });
  }
});

/* ──────────────────────────────────────────────
   ADMIN: PATCH /api/notices/:id — Toggle active/inactive
   ────────────────────────────────────────────── */
router.patch('/:id', adminAuth, async (req, res) => {
  try {
    const notice = Notice.findByIdAndUpdate(req.params.id, req.body);

    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found.' });
    res.status(200).json({ success: true, message: 'Notice updated.', data: notice });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error updating notice.' });
  }
});

/* ──────────────────────────────────────────────
   ADMIN: DELETE /api/notices/:id
   ────────────────────────────────────────────── */
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const notice = Notice.findByIdAndDelete(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found.' });
    res.status(200).json({ success: true, message: 'Notice deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error deleting notice.' });
  }
});

module.exports = router;
