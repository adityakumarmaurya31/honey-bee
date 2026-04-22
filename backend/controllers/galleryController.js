const pool = require('../db.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

const getGallery = async (req, res) => {
  try {
    const [items] = await pool.query(
      'SELECT * FROM gallery ORDER BY created_at DESC'
    );

    const result = items.map((item) => ({
      ...item,
      media_url: item.media_url.startsWith('/uploads') 
        ? `${req.protocol}://${req.get('host')}${item.media_url}`
        : item.media_url,
    }));

    res.json(result);
  } catch (error) {
    console.error('Get gallery error:', error);
    res.status(500).json({ message: 'Unable to load gallery' });
  }
};

const createGalleryItem = async (req, res) => {
  try {
    const { title, description, media_type } = req.body;

    if (!title || !media_type || !req.file) {
      return res.status(400).json({ message: 'Title, media type, and file are required' });
    }

    if (!['image', 'video'].includes(media_type)) {
      return res.status(400).json({ message: 'Media type must be image or video' });
    }

    let media_url = `/uploads/${req.file.filename}`;

    // Resize image to passport size (300x400 pixels = approximately 4cm x 6cm)
    if (media_type === 'image') {
      try {
        const inputPath = req.file.path;
        const passportFilename = `passport-${req.file.filename}`;
        const passportPath = path.join(path.dirname(inputPath), passportFilename);

        // Resize to passport dimensions and save
        await sharp(inputPath)
          .resize(300, 400, {
            fit: 'cover',
            position: 'center'
          })
          .toFile(passportPath);

        // Delete original file and use passport version
        await fs.unlink(inputPath);
        media_url = `/uploads/${passportFilename}`;
      } catch (resizeError) {
        console.error('Image resize error:', resizeError);
        return res.status(400).json({ message: 'Unable to process image. Please try another file.' });
      }
    }

    const [result] = await pool.query(
      'INSERT INTO gallery (title, description, media_url, media_type) VALUES (?, ?, ?, ?)',
      [title, description || null, media_url, media_type]
    );

    res.status(201).json({ 
      id: result.insertId,
      title,
      description,
      media_url: `${req.protocol}://${req.get('host')}${media_url}`,
      media_type,
      message: 'Gallery item added successfully in passport size'
    });
  } catch (error) {
    console.error('Create gallery item error:', error);
    res.status(500).json({ message: 'Unable to add gallery item' });
  }
};

const deleteGalleryItem = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM gallery WHERE id = ?', [id]);
    res.json({ message: 'Gallery item deleted successfully' });
  } catch (error) {
    console.error('Delete gallery item error:', error);
    res.status(500).json({ message: 'Unable to delete gallery item' });
  }
};

const updateGalleryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    await pool.query(
      'UPDATE gallery SET title = ?, description = ? WHERE id = ?',
      [title, description || null, id]
    );

    const [[item]] = await pool.query('SELECT * FROM gallery WHERE id = ?', [id]);
    res.json(item);
  } catch (error) {
    console.error('Update gallery item error:', error);
    res.status(500).json({ message: 'Unable to update gallery item' });
  }
};

module.exports = { getGallery, createGalleryItem, deleteGalleryItem, updateGalleryItem };
