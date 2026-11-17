const pool = require('../db.js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
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

const bufferToDataUrl = (buffer, mimeType) => `data:${mimeType};base64,${buffer.toString('base64')}`;

const ensureUploadsDir = (subfolder = 'gallery') => {
  const uploadsDir = path.join(__dirname, '..', 'uploads', subfolder);
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  return uploadsDir;
};

const writeBufferToUploads = async (buffer, originalName, subfolder = 'gallery') => {
  const uploadsDir = ensureUploadsDir(subfolder);
  const sanitized = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `${Date.now()}-${sanitized}`;
  const filePath = path.join(uploadsDir, filename);
  await fs.promises.writeFile(filePath, buffer);
  // return web path used by static server mounted at /uploads
  return `/uploads/${subfolder}/${filename}`;
};

const getGallery = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    const [items] = await pool.query(
      'SELECT * FROM gallery ORDER BY created_at DESC'
    );

    const forwardedProto = req.headers['x-forwarded-proto']?.split(',')[0]?.trim();
    const forwardedHost = req.headers['x-forwarded-host']?.split(',')[0]?.trim();
    const protocol = forwardedProto || req.protocol;
    const host = forwardedHost || req.get('host');
    const baseUrl = process.env.PUBLIC_API_BASE_URL || (host ? `${protocol}://${host}` : '');

    const result = items.map((item) => {
      const normalizedMediaUrl = typeof item.media_url === 'string'
        ? item.media_url.replace(/\\/g, '/')
        : item.media_url;

      return {
        ...item,
        media_url: normalizedMediaUrl && normalizedMediaUrl.startsWith('/uploads')
          ? (baseUrl ? `${baseUrl}${normalizedMediaUrl}` : normalizedMediaUrl)
          : normalizedMediaUrl,
      };
    });

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
          // No-S3 mode: force data URL for images so rendering does not depend on /uploads storage.
          media_url = bufferToDataUrl(resizedBuffer, req.file.mimetype);
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
        // Persist video to local uploads (beware of large files)
        try {
          media_url = await writeBufferToUploads(req.file.buffer, req.file.originalname, 'gallery');
        } catch (e) {
          console.error('Write video to uploads failed, falling back to data URL:', e);
          media_url = bufferToDataUrl(req.file.buffer, req.file.mimetype);
        }
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
      media_url,
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

    const [result] = await pool.query('DELETE FROM gallery WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }

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

    const [result] = await pool.query(
      'UPDATE gallery SET title = ?, description = ? WHERE id = ?',
      [title, description || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }

    const [[item]] = await pool.query('SELECT * FROM gallery WHERE id = ?', [id]);
    res.json(item);
  } catch (error) {
    console.error('Update gallery item error:', error);
    res.status(500).json({ message: 'Unable to update gallery item' });
  }
};

module.exports = { getGallery, createGalleryItem, deleteGalleryItem, updateGalleryItem };
