const API_URL = (import.meta as any).env?.VITE_API_URL || '/api';

function getSession(): any | null {
    try { return JSON.parse(localStorage.getItem('gm_session') || 'null'); } catch { return null; }
}

function getToken(): string | null {
    const session = getSession();
    return session?.access_token || null;
}

function getRefreshToken(): string | null {
    const session = getSession();
    return session?.refresh_token || null;
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
    if (isRefreshing && refreshPromise) return refreshPromise;
    isRefreshing = true;

    refreshPromise = (async () => {
        const refreshToken = getRefreshToken();
        if (!refreshToken) { isRefreshing = false; return false; }
        try {
            const res = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });
            if (!res.ok) { isRefreshing = false; return false; }
            const data = await res.json();
            if (data.session) {
                localStorage.setItem('gm_session', JSON.stringify(data.session));
                isRefreshing = false;
                return true;
            }
        } catch { /* ignore */ }
        isRefreshing = false;
        return false;
    })();

    return refreshPromise;
}

async function request(path: string, options: RequestInit = {}): Promise<any> {
    const token = getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers || {}) as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let res = await fetch(`${API_URL}${path}`, { ...options, headers });

    // Auto-refresh on 401
    if (res.status === 401 && !path.includes('/auth/refresh')) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
            const newToken = getToken();
            if (newToken) headers['Authorization'] = `Bearer ${newToken}`;
            res = await fetch(`${API_URL}${path}`, { ...options, headers });
        }
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

// Auth
export const api = {
    // Auth
    register: (email: string, password: string, name: string, role = 'user', shipping_address?: any, extra?: any) =>
        request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name, role, shipping_address, ...extra }) }),
    login: (email: string, password: string) =>
        request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    getMe: () => request('/auth/me'),
    updateProfile: (data: { 
        name?: string; 
        avatar?: string; 
        shipping_address?: any;
        contact_person?: string;
        contact_phone?: string;
        birthday_month?: number;
        birthday_day?: number;
    }) =>
        request('/auth/me', { method: 'PUT', body: JSON.stringify(data) }),

    // Products
    getProducts: (params?: Record<string, string>) => {
        const q = params ? '?' + new URLSearchParams(params).toString() : '';
        return request(`/products${q}`);
    },
    getProduct: (id: string) => request(`/products/${id}`),
    createProduct: (data: any) =>
        request('/products', { method: 'POST', body: JSON.stringify(data) }),
    updateProduct: (id: string, data: any) =>
        request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProduct: (id: string) =>
        request(`/products/${id}`, { method: 'DELETE' }),
    toggleProduct: (id: string, enabled: boolean) =>
        request(`/products/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ enabled }) }),

    // Categories
    getCategories: () => request('/categories'),

    // Orders
    createOrder: (data: any) =>
        request('/orders', { method: 'POST', body: JSON.stringify(data) }),
    getOrders: (params?: Record<string, string>) => {
        const q = params ? '?' + new URLSearchParams(params).toString() : '';
        return request(`/orders${q}`);
    },
    getOrder: (id: string) => request(`/orders/${id}`),
    updateOrderStatus: (id: string, status: string, tracking_number?: string) =>
        request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, tracking_number }) }),
    cancelOrder: (id: string) =>
        request(`/orders/${id}/cancel`, { method: 'PATCH' }),
    requestRefund: (id: string, reason?: string) =>
        request(`/orders/${id}/refund`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
    approveRefund: (id: string) =>
        request(`/orders/${id}/approve-refund`, { method: 'PATCH' }),
    denyRefund: (id: string, reason: string) =>
        request(`/orders/${id}/deny-refund`, { method: 'PATCH', body: JSON.stringify({ reason }) }),


    // Cart (server-side)
    getCart: () => request('/cart'),
    addCartItem: (product_id: string, quantity = 1) =>
        request('/cart', { method: 'POST', body: JSON.stringify({ product_id, quantity }) }),
    updateCartItem: (product_id: string, quantity: number) =>
        request(`/cart/${product_id}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
    removeCartItem: (product_id: string) =>
        request(`/cart/${product_id}`, { method: 'DELETE' }),
    clearCart: () => request('/cart', { method: 'DELETE' }),
    syncCart: (items: { product_id: string; quantity: number }[]) =>
        request('/cart/sync', { method: 'POST', body: JSON.stringify({ items }) }),

    // Reviews
    getReviews: (productId: string) => request(`/reviews?product_id=${productId}`),
    getSellerReviews: () => request('/reviews/seller'),
    replyToReview: (id: string, reply: string) =>
        request(`/reviews/${id}/reply`, { method: 'PATCH', body: JSON.stringify({ reply }) }),
    flagReview: (id: string, is_flagged: boolean) =>
        request(`/reviews/${id}/flag`, { method: 'PATCH', body: JSON.stringify({ is_flagged }) }),
    createReview: (data: { product_id: string; rating: number; title?: string; body?: string }) =>
        request('/reviews', { method: 'POST', body: JSON.stringify(data) }),
    deleteReview: (id: string) => request(`/reviews/${id}`, { method: 'DELETE' }),

    // Wishlist
    getWishlist: (month?: number, day?: number) =>
        request(`/wishlist${month ? `?month=${month}&day=${day}` : ''}`),

    addToWishlist: (productId: string) =>
        request('/wishlist', { method: 'POST', body: JSON.stringify({ product_id: productId }) }),
    removeFromWishlist: (productId: string) =>
        request(`/wishlist/${productId}`, { method: 'DELETE' }),

    // Stores
    getStores: (params?: Record<string, string>) => {
        const q = params ? '?' + new URLSearchParams(params).toString() : '';
        return request(`/stores${q}`);
    },
    getStore: (id: string) => request(`/stores/${id}`),
    getStoreProducts: (id: string, params?: Record<string, string>) => {
        const q = params ? '?' + new URLSearchParams(params).toString() : '';
        return request(`/stores/${id}/products${q}`);
    },
    updateStore: (id: string, data: any) =>
        request(`/stores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    toggleStoreOnline: (id: string, is_online: boolean) =>
        request(`/stores/${id}/toggle-online`, { method: 'PATCH', body: JSON.stringify({ is_online }) }),
    createStore: (data: { name: string; name_zh?: string; description?: string; description_zh?: string; logo?: string }) =>
        request('/stores', { method: 'POST', body: JSON.stringify(data) }),

    // Seller
    getSellerOrders: (params?: Record<string, string>) => {
        const q = params ? '?' + new URLSearchParams(params).toString() : '';
        return request(`/orders/seller${q}`);
    },
    reorderProductImages: (productId: string, imageIds: string[]) =>
        request(`/products/${productId}/images/reorder`, { method: 'PATCH', body: JSON.stringify({ imageIds }) }),
    deleteProductImage: (productId: string, imageId: string) =>
        request(`/products/${productId}/images/${imageId}`, { method: 'DELETE' }),

    // Admin
    getAdminStats: () => request('/admin/stats'),
    getAdminUsers: (params?: Record<string, string>) => {
        const q = params ? '?' + new URLSearchParams(params).toString() : '';
        return request(`/admin/users${q}`);
    },
    updateUserRole: (id: string, role: string) =>
        request(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
    deleteUser: (id: string) =>
        request(`/admin/users/${id}`, { method: 'DELETE' }),
    getAdminOrders: (params?: Record<string, string>) => {
        const q = params ? '?' + new URLSearchParams(params).toString() : '';
        return request(`/admin/orders${q}`);
    },
    getAdminStores: () => request('/admin/stores'),
    verifyStore: (id: string, verified: boolean) =>
        request(`/admin/stores/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ verified }) }),
    deleteStore: (id: string) =>
        request(`/admin/stores/${id}`, { method: 'DELETE' }),
    getAdminProducts: (params?: Record<string, string>) => {
        const q = params ? '?' + new URLSearchParams(params).toString() : '';
        return request(`/admin/products${q}`);
    },
    adminDeleteProduct: (id: string) =>
        request(`/admin/products/${id}`, { method: 'DELETE' }),

    // Seed
    seed: () => request('/seed', { method: 'POST' }),

    // Translation (Gemini AI)
    translate: (text: string, sourceLang: string, targetLang: string, field?: string) =>
        request('/translate', {
            method: 'POST',
            body: JSON.stringify({ text, sourceLang, targetLang, field }),
        }),

    // Migration
    migrateBilingual: () => request('/migrate/bilingual', { method: 'POST' }),

    // Health
    health: () => request('/health'),

    // Image Upload (uses FormData, not JSON)
    uploadImage: async (file: File): Promise<{ url: string; path: string }> => {
        const token = getToken();
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${API_URL}/upload/image`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        return data;
    },
    logSearch: (query: string) =>
        request('/products/log/search', { method: 'POST', body: JSON.stringify({ query }) }),
    logBrowse: (productId: string, categoryId?: string) =>
        request('/products/log/browse', { method: 'POST', body: JSON.stringify({ product_id: productId, category_id: categoryId }) }),
    getStoreAnalytics: () =>
        request('/stores/me/analytics'),
    getNotifications: () =>
        request('/notifications'),
    markNotificationAsRead: (id: string) =>
        request(`/notifications/${id}/read`, { method: 'PUT' }),
    deleteNotification: (id: string) =>
        request(`/notifications/${id}`, { method: 'DELETE' }),
    deleteImage: (path: string) =>
        request('/upload/image', { method: 'DELETE', body: JSON.stringify({ path }) }),
};
