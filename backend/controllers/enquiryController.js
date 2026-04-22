const pool = require('../db.js');

const createEnquiry = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Name, email, subject, and message are required' });
    }

    // Validate phone if provided: only digits, minimum 10 digits
    if (phone && !/^\d{10,}$/.test(phone.toString().trim())) {
      return res.status(400).json({ message: 'Phone number must contain only digits and be at least 10 digits long' });
    }

    const [result] = await pool.query(
      'INSERT INTO enquiries (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone || null, subject, message]
    );

    res.status(201).json({ 
      id: result.insertId, 
      message: 'Enquiry submitted successfully. We will get back to you soon!' 
    });
  } catch (error) {
    console.error('Create enquiry error:', error);
    res.status(500).json({ message: 'Unable to submit enquiry. Please try again.' });
  }
};

const getEnquiries = async (req, res) => {
  try {
    const [enquiries] = await pool.query(
      'SELECT * FROM enquiries ORDER BY created_at DESC'
    );

    res.json(enquiries);
  } catch (error) {
    console.error('Get enquiries error:', error);
    res.status(500).json({ message: 'Unable to load enquiries' });
  }
};

const getEnquiryById = async (req, res) => {
  try {
    const { id } = req.params;

    const [enquiries] = await pool.query(
      'SELECT * FROM enquiries WHERE id = ?',
      [id]
    );

    if (enquiries.length === 0) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    res.json(enquiries[0]);
  } catch (error) {
    console.error('Get enquiry error:', error);
    res.status(500).json({ message: 'Unable to load enquiry' });
  }
};

const updateEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_reply } = req.body;

    if (!['New', 'Replied', 'Closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const replied_at = status === 'Replied' ? new Date() : null;

    await pool.query(
      'UPDATE enquiries SET status = ?, admin_reply = ?, replied_at = ? WHERE id = ?',
      [status, admin_reply || null, replied_at, id]
    );

    const [[enquiry]] = await pool.query('SELECT * FROM enquiries WHERE id = ?', [id]);
    res.json(enquiry);
  } catch (error) {
    console.error('Update enquiry error:', error);
    res.status(500).json({ message: 'Unable to update enquiry' });
  }
};

const deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM enquiries WHERE id = ?', [id]);
    res.json({ message: 'Enquiry deleted successfully' });
  } catch (error) {
    console.error('Delete enquiry error:', error);
    res.status(500).json({ message: 'Unable to delete enquiry' });
  }
};

module.exports = { createEnquiry, getEnquiries, getEnquiryById, updateEnquiry, deleteEnquiry };
