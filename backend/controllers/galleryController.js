const pool = require('../db.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Configure S3 client if environment variables are present
let s3Client = null;
if (process.env.AWS_S3_BUCKET) {
  s3Client = new S3Client({
    region: process.env.AWS_S3_REGION || 'us-east-1',
    credentials: process.env.AWS_ACCESS_KEY_ID ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    } : undefined
  });
}

const uploadBufferToS3 = async (buffer, originalName, mimeType, folder = 'gallery') => {
  if (!s3Client) throw new Error('S3 client not configured');
  const sanitized = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${folder}/${Date.now()}-${sanitized}`;
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ACL: 'public-read'
  };
  await s3Client.send(new PutObjectCommand(params));
  const region = process.env.AWS_S3_REGION || 'us-east-1';
  const bucket = process.env.AWS_S3_BUCKET;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};

const getGallery = async (req, res) => {
  try {
    const [items] = await pool.query(
      'SELECT * FROM gallery ORDER BY created_at DESC'
    );

    const result = items.map((item) => ({
      ...item,
      media_url: item.media_url && item.media_url.startsWith('/uploads') 
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

    let media_url = null;

    // Resize image to passport size (300x400 pixels)
    if (media_type === 'image') {
      try {
        const resizedBuffer = await sharp(req.file.buffer)
          .resize(300, 400, { fit: 'cover', position: 'center' })
          .toBuffer();

        if (process.env.AWS_S3_BUCKET) {
          try {
            media_url = await uploadBufferToS3(resizedBuffer, `passport-${req.file.originalname}`, req.file.mimetype, 'gallery');
          } catch (e) {
            console.error('Gallery S3 upload failed:', e);
            return res.status(500).json({ message: 'Failed to upload image to S3' });
          }
        } else {
          const uploadsDir = path.join(__dirname, '..', 'uploads');
          await fs.mkdir(uploadsDir, { recursive: true });
          const passportFilename = `passport-${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const outPath = path.join(uploadsDir, passportFilename);
          await fs.writeFile(outPath, resizedBuffer);
          media_url = `/uploads/${passportFilename}`;
        }
      } catch (resizeError) {
        console.error('Image resize error:', resizeError);
        return res.status(400).json({ message: 'Unable to process image. Please try another file.' });
      }
    } else {
      // Video: directly upload or save
      if (process.env.AWS_S3_BUCKET) {
        try {
          media_url = await uploadBufferToS3(req.file.buffer, req.file.originalname, req.file.mimetype, 'gallery');
        } catch (e) {
          console.error('Gallery S3 upload failed:', e);
          return res.status(500).json({ message: 'Failed to upload media to S3' });
        }
      } else {
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        await fs.mkdir(uploadsDir, { recursive: true });
        const filename = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const outPath = path.join(uploadsDir, filename);
        await fs.writeFile(outPath, req.file.buffer);
        media_url = `/uploads/${filename}`;
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
      media_url: media_url && media_url.startsWith('/uploads') ? `${req.protocol}://${req.get('host')}${media_url}` : media_url,
      media_type,
      message: 'Gallery item added successfully'
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
