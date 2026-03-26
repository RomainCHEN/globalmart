import React, { createContext, useContext, useState, useEffect, useCallback, PropsWithChildren } from 'react';
import { Product, CartItem, User, WishlistItem, Category } from './types';
import { api } from './api';

interface AppContextType {
    // Auth
    user: User | null;
    isLoggedIn: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string, role?: string, shipping_address?: any, extra?: any) => Promise<void>;
    logout: () => void;
    authLoading: boolean;
    // Cart
    cart: CartItem[];
    addToCart: (product: Product, quantity?: number, options?: { [key: string]: string }) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    cartTotal: number;
    clearCart: () => void;
    selectedCartItems: string[];
    setSelectedCartItems: (ids: string[]) => void;
    removeItems: (ids: string[]) => void;
    getCartItemId: (productId: string, options?: any) => string;
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
    // Accessibility
    seniorMode: boolean;
    setSeniorMode: (enabled: boolean) => void;
    formatPrice: (price: number) => string;
    wishlistOnSaleCount: number;
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
    const [wishlistOnSaleCount, setWishlistOnSaleCount] = useState(0);
    const [seniorMode, setSeniorModeState] = useState<boolean>(() => localStorage.getItem('gm_senior_mode') === 'true');

    const setSeniorMode = (enabled: boolean) => {
        setSeniorModeState(enabled);
        localStorage.setItem('gm_senior_mode', String(enabled));
        if (enabled) {
            document.documentElement.classList.add('senior-mode');
        } else {
            document.documentElement.classList.remove('senior-mode');
        }
    };

    // Initialize senior mode class on mount
    useEffect(() => {
        if (seniorMode) document.documentElement.classList.add('senior-mode');
    }, []);

    const formatPrice = (price: number) => {
        const lang = localStorage.getItem('gm_lang') || 'en';
        if (lang === 'zh') {
            // Demo conversion: 1 USD = 7.2 CNY
            const rmb = price * 7.2;
            return `￥${rmb.toFixed(seniorMode ? 0 : 2)}`;
        }
        return `$${price.toFixed(seniorMode ? 0 : 2)}`;
    };

    // Persist cart to localStorage
    useEffect(() => {
        localStorage.setItem('gm_cart', JSON.stringify(cart));
    }, [cart]);

    // Helper: load server cart and convert to CartItem[]
    const loadServerCart = async () => {
        try {
            const serverCart = await api.getCart();
            if (Array.isArray(serverCart)) {
                const items: CartItem[] = serverCart
                    .filter((ci: any) => ci.products)
                    .map((ci: any) => ({
                        ...ci.products,
                        quantity: ci.quantity,
                    }));
                setCart(items);
            }
        } catch { /* ignore if cart API fails */ }
    };

    // Check auth on mount
    useEffect(() => {
        const session = localStorage.getItem('gm_session');
        if (session) {
            api.getMe()
                .then(async (profile) => {
                    setUser(profile);
                    // Load server cart on auth restore
                    await loadServerCart();
                })
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
                .then(res => {
                    const data = (res as any).data || res;
                    setWishlist(data.map((w: any) => w.product_id));
                    // Count items on sale
                    const onSale = data.filter((w: any) => w.products && w.products.original_price && w.products.original_price > w.products.price);
                    setWishlistOnSaleCount(onSale.length);
                })
                .catch(() => { });
        } else {
            setWishlist([]);
            setWishlistOnSaleCount(0);
        }
    }, [user]);

    const login = async (email: string, password: string) => {
        const data = await api.login(email, password);
        localStorage.setItem('gm_session', JSON.stringify(data.session));
        const profile = await api.getMe();
        setUser(profile);

        // Sync localStorage cart to server, then load merged server cart
        const localCart = cart;
        if (localCart.length > 0) {
            const items = localCart.map(item => ({ product_id: item.id, quantity: item.quantity }));
            try {
                const syncedCart = await api.syncCart(items);
                if (Array.isArray(syncedCart)) {
                    const merged: CartItem[] = syncedCart
                        .filter((ci: any) => ci.products)
                        .map((ci: any) => ({
                            ...ci.products,
                            quantity: ci.quantity,
                        }));
                    setCart(merged);
                }
            } catch {
                await loadServerCart();
            }
        } else {
            await loadServerCart();
        }
    };

    const register = async (email: string, password: string, name: string, role = 'user', shipping_address?: any, extra?: any) => {
        const data = await api.register(email, password, name, role, shipping_address, extra);
        if (data.session) {
            localStorage.setItem('gm_session', JSON.stringify(data.session));
            const profile = await api.getMe();
            setUser(profile);
            // Sync cart after registration too
            if (cart.length > 0) {
                const items = cart.map(item => ({ product_id: item.id, quantity: item.quantity }));
                try { await api.syncCart(items); await loadServerCart(); } catch { }
            }
        }
    };

    const logout = () => {
        api.logout().catch(() => { });
        localStorage.removeItem('gm_session');
        setUser(null);
        setCart([]);
        setWishlist([]);
    };

    const getCartItemId = (productId: string, options?: any) => {
        if (!options || Object.keys(options).length === 0) return productId;
        return `${productId}-${JSON.stringify(options)}`;
    };

    const addToCart = (product: Product, quantity = 1, options?: { [key: string]: string }) => {
        const itemId = getCartItemId(product.id, options);
        
        setCart(prev => {
            const existing = prev.find(p => getCartItemId(p.id, p.options) === itemId);
            if (existing) {
                return prev.map(p => getCartItemId(p.id, p.options) === itemId ? { ...p, quantity: p.quantity + quantity } : p);
            }
            return [...prev, { ...product, quantity, options }];
        });
        
        // Note: Server syncing (api.addCartItem) currently only uses product.id natively.
        // For distinct options lacking schema support, it will update the base product's quantity on the server.
        // Sync to server if logged in
        if (user) {
            api.addCartItem(product.id, quantity).catch(() => { });
        }
    };

    const removeFromCart = (productId: string, options?: any) => {
        const itemId = getCartItemId(productId, options);
        setCart(prev => prev.filter(p => getCartItemId(p.id, p.options) !== itemId));
        // Simple server remove attempts to delete by base ID
        if (user) {
            api.removeCartItem(productId).catch(() => { });
        }
    };

    const updateQuantity = (productId: string, quantity: number, options?: any) => {
        if (quantity < 1) return;
        const itemId = getCartItemId(productId, options);
        setCart(prev => prev.map(p => getCartItemId(p.id, p.options) === itemId ? { ...p, quantity } : p));
        if (user) {
            api.updateCartItem(productId, quantity).catch(() => { });
        }
    };

    const clearCart = () => {
        setCart([]);
        setSelectedCartItems([]);
        if (user) {
            api.clearCart().catch(() => { });
        }
    };

    const removeItems = (ids: string[]) => {
        setCart(prev => prev.filter(p => !ids.includes(getCartItemId(p.id, p.options))));
        setSelectedCartItems(prev => prev.filter(id => !ids.includes(id)));
    };

    const [selectedCartItems, setSelectedCartItems] = useState<string[]>([]);

    // cartTotal computes only selected items (or all if none selected)
    const cartTotal = (() => {
        if (selectedCartItems.length === 0) return cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        return cart.filter(item => selectedCartItems.includes(getCartItemId(item.id, item.options))).reduce((acc, item) => acc + (item.price * item.quantity), 0);
    })();

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
            selectedCartItems, setSelectedCartItems, removeItems, getCartItemId,
            wishlist, toggleWishlist, isInWishlist,
            categories, products, loadProducts, productsLoading,
            seniorMode, setSeniorMode, formatPrice, wishlistOnSaleCount
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