import React, { createContext, useContext, useState, useEffect, useCallback, PropsWithChildren } from 'react';
import { Product, CartItem, User, WishlistItem, Category } from './types';
import { api } from './api';

interface AppContextType {
    // Auth
    user: User | null;
    isLoggedIn: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string, role?: string) => Promise<void>;
    logout: () => void;
    authLoading: boolean;
    // Cart
    cart: CartItem[];
    addToCart: (product: Product, quantity?: number) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    cartTotal: number;
    clearCart: () => void;
    // Wishlist
    wishlist: string[];
    toggleWishlist: (productId: string) => void;
    isInWishlist: (productId: string) => boolean;
    // Categories
    categories: Category[];
    // Products
    products: Product[];
    loadProducts: (params?: Record<string, string>) => Promise<void>;
    productsLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: PropsWithChildren) => {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [cart, setCart] = useState<CartItem[]>(() => {
        try { return JSON.parse(localStorage.getItem('gm_cart') || '[]'); } catch { return []; }
    });
    const [wishlist, setWishlist] = useState<string[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);

    // Persist cart to localStorage
    useEffect(() => {
        localStorage.setItem('gm_cart', JSON.stringify(cart));
    }, [cart]);

    // Check auth on mount
    useEffect(() => {
        const session = localStorage.getItem('gm_session');
        if (session) {
            api.getMe()
                .then(profile => setUser(profile))
                .catch(() => {
                    localStorage.removeItem('gm_session');
                    setUser(null);
                })
                .finally(() => setAuthLoading(false));
        } else {
            setAuthLoading(false);
        }
    }, []);

    // Load categories on mount
    useEffect(() => {
        api.getCategories()
            .then(data => setCategories(data))
            .catch(() => { });
    }, []);

    // Load wishlist when logged in
    useEffect(() => {
        if (user) {
            api.getWishlist()
                .then(data => setWishlist(data.map((w: any) => w.product_id)))
                .catch(() => { });
        } else {
            setWishlist([]);
        }
    }, [user]);

    const login = async (email: string, password: string) => {
        const data = await api.login(email, password);
        localStorage.setItem('gm_session', JSON.stringify(data.session));
        const profile = await api.getMe();
        setUser(profile);
    };

    const register = async (email: string, password: string, name: string, role = 'user') => {
        const data = await api.register(email, password, name, role);
        if (data.session) {
            localStorage.setItem('gm_session', JSON.stringify(data.session));
            const profile = await api.getMe();
            setUser(profile);
        }
    };

    const logout = () => {
        api.logout().catch(() => { });
        localStorage.removeItem('gm_session');
        setUser(null);
        setWishlist([]);
    };

    const addToCart = (product: Product, quantity = 1) => {
        setCart(prev => {
            const existing = prev.find(p => p.id === product.id);
            if (existing) {
                return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + quantity } : p);
            }
            return [...prev, { ...product, quantity }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(p => p.id !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity < 1) return;
        setCart(prev => prev.map(p => p.id === productId ? { ...p, quantity } : p));
    };

    const clearCart = () => setCart([]);

    const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const toggleWishlist = async (productId: string) => {
        if (!user) return;
        if (wishlist.includes(productId)) {
            setWishlist(prev => prev.filter(id => id !== productId));
            api.removeFromWishlist(productId).catch(() => {
                setWishlist(prev => [...prev, productId]);
            });
        } else {
            setWishlist(prev => [...prev, productId]);
            api.addToWishlist(productId).catch(() => {
                setWishlist(prev => prev.filter(id => id !== productId));
            });
        }
    };

    const isInWishlist = (productId: string) => wishlist.includes(productId);

    const loadProducts = useCallback(async (params?: Record<string, string>) => {
        setProductsLoading(true);
        try {
            const data = await api.getProducts(params);
            setProducts(data.products || []);
        } catch {
            setProducts([]);
        } finally {
            setProductsLoading(false);
        }
    }, []);

    const isLoggedIn = !!user;

    return (
        <AppContext.Provider value={{
            user, isLoggedIn, login, register, logout, authLoading,
            cart, addToCart, removeFromCart, updateQuantity, cartTotal, clearCart,
            wishlist, toggleWishlist, isInWishlist,
            categories, products, loadProducts, productsLoading
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
};