import { supabaseAdmin } from '../supabase.js';

export async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        req.accessToken = token;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Authentication failed' });
    }
}

export async function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const { data: { user } } = await supabaseAdmin.auth.getUser(token);
            if (user) {
                req.user = user;
                req.accessToken = token;
            }
        } catch (err) {
            // ignore
        }
    }
    next();
}
