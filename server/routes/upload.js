import { Router } from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Configure multer — store in memory, max 5MB
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
        }
    }
});

// POST /api/upload/image — upload a single image to Supabase Storage
router.post('/image', requireAuth, (req, res) => {
    upload.single('file')(req, res, async (err) => {
        try {
            if (err) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ error: 'File size exceeds 5MB limit' });
                }
                return res.status(400).json({ error: err.message });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'No file provided' });
            }

            const ext = req.file.originalname.split('.').pop() || 'jpg';
            const fileName = `${req.user.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

            const { data, error } = await supabaseAdmin.storage
                .from('product-images')
                .upload(fileName, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: false
                });

            if (error) {
                return res.status(500).json({ error: `Storage upload failed: ${error.message}` });
            }

            // Build public URL
            const { data: urlData } = supabaseAdmin.storage
                .from('product-images')
                .getPublicUrl(data.path);

            res.json({ url: urlData.publicUrl, path: data.path });
        } catch (innerErr) {
            console.error('Upload handler error:', innerErr);
            res.status(500).json({ error: innerErr.message || 'Internal upload error' });
        }
    });
});

// DELETE /api/upload/image — delete an uploaded image from storage
router.delete('/image', requireAuth, async (req, res) => {
    try {
        const { path } = req.body;
        if (!path) return res.status(400).json({ error: 'No path provided' });

        // Only allow deleting own uploads
        if (!path.startsWith(req.user.id + '/')) {
            return res.status(403).json({ error: 'Not authorized to delete this file' });
        }

        const { error } = await supabaseAdmin.storage
            .from('product-images')
            .remove([path]);

        if (error) return res.status(500).json({ error: error.message });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
