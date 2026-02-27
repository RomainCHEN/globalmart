const API_URL = (import.meta as any).env?.VITE_API_URL || '/api';

function getToken(): string | null {
    const session = localStorage.getItem('gm_session');
    if (!session) return null;
    try {
        return JSON.parse(session).access_token;
    } catch { return null; }
}

async function request(path: string, options: RequestInit = {}): Promise<any> {
    const token = getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers || {}) as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

// Auth
export const api = {
    // Auth
    register: (email: string, password: string, name: string, role = 'user') =>
        request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name, role }) }),
    login: (email: string, password: string) =>
        request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    getMe: () => request('/auth/me'),
    updateProfile: (data: { name?: string; avatar?: string }) =>
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

    // Categories
    getCategories: () => request('/categories'),

    // Orders
    createOrder: (data: any) =>
        request('/orders', { method: 'POST', body: JSON.stringify(data) }),
    getOrders: () => request('/orders'),
    getOrder: (id: string) => request(`/orders/${id}`),
    updateOrderStatus: (id: string, status: string) =>
        request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

    // Reviews
    getReviews: (productId: string) => request(`/reviews?product_id=${productId}`),
    createReview: (data: { product_id: string; rating: number; title?: string; body?: string }) =>
        request('/reviews', { method: 'POST', body: JSON.stringify(data) }),
    deleteReview: (id: string) => request(`/reviews/${id}`, { method: 'DELETE' }),

    // Wishlist
    getWishlist: () => request('/wishlist'),
    addToWishlist: (productId: string) =>
        request('/wishlist', { method: 'POST', body: JSON.stringify({ product_id: productId }) }),
    removeFromWishlist: (productId: string) =>
        request(`/wishlist/${productId}`, { method: 'DELETE' }),

    // Stores
    getStores: () => request('/stores'),
    getStore: (id: string) => request(`/stores/${id}`),
    getStoreProducts: (id: string) => request(`/stores/${id}/products`),
    updateStore: (id: string, data: any) =>
        request(`/stores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    createStore: (data: { name: string; name_zh?: string; description?: string; description_zh?: string; logo?: string }) =>
        request('/stores', { method: 'POST', body: JSON.stringify(data) }),

    // Seller
    getSellerOrders: () => request('/orders/seller'),

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
    deleteImage: (path: string) =>
        request('/upload/image', { method: 'DELETE', body: JSON.stringify({ path }) }),
};
