import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { useI18n } from '../i18n';
import { api } from '../api';
import { Order, WishlistItem, Product } from '../types';

/* ═══════════════════════════════════════════
   BUYER DASHBOARD  (unchanged)
   ═══════════════════════════════════════════ */
export const UserDashboard = () => {
    const { user, isLoggedIn, logout, formatPrice } = useApp();
    const { t } = useI18n();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [isBirthday, setIsBirthday] = useState(false);
    const [activeTab, setActiveTab] = useState<'orders' | 'wishlist'>(() => {
        const params = new URLSearchParams(window.location.search);
        return (params.get('tab') as 'orders' | 'wishlist') || 'orders';
    });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');

    const loadOrders = async (status?: string) => {
        const params: Record<string, string> = {};
        if (status && status !== 'all') params.status = status;
        const o = await api.getOrders(params).catch(() => []);
        setOrders(o);
    };

    useEffect(() => {
        if (!isLoggedIn) { navigate('/login'); return; }
        setLoading(true);
        Promise.all([
            loadOrders(statusFilter),
            api.getWishlist().catch(() => ({ data: [], isBirthday: false })),
        ]).then(([, w]) => {
            setWishlistItems((w as any).data || []);
            setIsBirthday((w as any).isBirthday || false);
        }).finally(() => setLoading(false));
    }, [isLoggedIn, navigate]);

    const handleFilterChange = async (status: string) => {
        setStatusFilter(status);
        await loadOrders(status);
    };

    if (!user) return null;

    return (
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto" role="main" aria-label={t('dash.title')}>
            <header className="mb-12">
                <div className="inline-block bg-brutal-pink border-4 border-black px-6 py-2 shadow-brutal mb-4">
                    <h2 className="text-5xl md:text-7xl font-display font-black uppercase italic">{t('dash.title')}</h2>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <p className="text-2xl font-bold bg-white border-4 border-black px-4 py-1 inline-block">{t('dash.welcome')}, {user.name}</p>
                    <div className="flex gap-4">
                        <Link to="/" className="border-4 border-black font-bold uppercase px-6 py-3 shadow-brutal bg-brutal-green flex items-center gap-2">
                            <span className="material-symbols-outlined font-black">shopping_bag</span>
                            {t('home.shopNow')}
                        </Link>
                        <button onClick={logout} className="border-4 border-black font-bold uppercase px-6 py-3 shadow-brutal bg-brutal-red text-white flex items-center gap-2">
                            <span className="material-symbols-outlined font-black">logout</span>
                            {t('nav.logout')}
                        </button>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 flex flex-col gap-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="border-4 border-black shadow-brutal p-6 bg-white">
                            <div className="flex justify-between items-start mb-6"><div className="size-14 border-4 border-black bg-brutal-pink flex items-center justify-center"><span className="material-symbols-outlined text-3xl font-black">shopping_bag</span></div></div>
                            <h3 className="font-black uppercase text-sm mb-1">{t('dash.orders')}</h3>
                            <p className="text-5xl font-display font-black">{orders.length}</p>
                        </div>
                        <div className="border-4 border-black shadow-brutal p-6 bg-brutal-yellow">
                            <div className="flex justify-between items-start mb-6"><div className="size-14 border-4 border-black bg-white flex items-center justify-center"><span className="material-symbols-outlined text-3xl font-black">favorite</span></div></div>
                            <h3 className="font-black uppercase text-sm mb-1">{t('dash.myWishlist')}</h3>
                            <p className="text-5xl font-display font-black">{wishlistItems.length}</p>
                        </div>
                    </div>

                    <div className="flex border-4 border-black bg-white">
                        <button onClick={() => setActiveTab('orders')} className={`flex-1 py-4 font-black uppercase text-lg ${activeTab === 'orders' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>{t('dash.myOrders')}</button>
                        <button onClick={() => setActiveTab('wishlist')} className={`flex-1 py-4 font-black uppercase text-lg border-l-4 border-black ${activeTab === 'wishlist' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>{t('dash.myWishlist')}</button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12"><span className="font-black uppercase animate-pulse text-xl">{t('general.loading')}</span></div>
                    ) : activeTab === 'orders' ? (
                        <div className="space-y-6">
                            {/* B3: Order status filter */}
                            <div className="flex flex-wrap gap-2">
                                {['all', 'pending', 'shipped', 'delivered', 'hold', 'cancelled'].map(s => (
                                    <button key={s} onClick={() => handleFilterChange(s)} className={`px-4 py-2 border-2 border-black font-black uppercase text-xs transition-all ${statusFilter === s ? 'bg-black text-white shadow-none' : 'bg-white shadow-brutal hover:bg-brutal-yellow'}`}>
                                        {s === 'all' ? t('order.all') : t(`order.${s}`)}
                                    </button>
                                ))}
                            </div>
                            {orders.length === 0 ? (
                                <div className="border-4 border-dashed border-black p-12 text-center"><p className="text-xl font-black uppercase text-gray-500">{t('order.noOrders')}</p></div>
                            ) : orders.map(order => (
                                <Link to={`/order/${order.id}`} key={order.id} className="block bg-white border-4 border-black shadow-brutal p-6 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg transition-all">
                                    <div className="flex flex-wrap justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-black uppercase text-lg">Order #{order.id.slice(0, 8)}</h4>
                                                {order.stores && (
                                                    <div className="flex items-center gap-1 bg-brutal-yellow border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase">
                                                        <span className="material-symbols-outlined text-[12px]">storefront</span>
                                                        {order.stores.name}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm font-bold text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                                            {/* Product thumbnails */}
                                            {order.order_items && order.order_items.length > 0 && (
                                                <div className="flex items-center gap-2 mt-3">
                                                    {order.order_items.slice(0, 3).map((item: any, idx: number) => (
                                                        <div key={idx} className="w-12 h-12 border-2 border-black overflow-hidden bg-gray-100 shrink-0">
                                                            {item.product_image ? (
                                                                <img src={item.product_image} alt={item.product_name || ''} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-gray-400 text-sm">image</span></div>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {order.order_items.length > 3 && (
                                                        <span className="text-xs font-black border-2 border-black px-2 py-1 bg-gray-100">+{order.order_items.length - 3}</span>
                                                    )}
                                                    <span className="text-xs font-bold text-gray-500 ml-1">{order.order_items.length} {order.order_items.length === 1 ? 'item' : 'items'}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-3 py-1 border-2 border-black font-black uppercase text-sm ${order.status === 'delivered' ? 'bg-brutal-green' : order.status === 'cancelled' ? 'bg-brutal-red text-white' : order.status === 'hold' ? 'bg-orange-400' : order.status === 'shipped' ? 'bg-brutal-blue text-white' : 'bg-brutal-yellow'}`}>{t(`order.${order.status}`)}</span>
                                            <span className="text-2xl font-black">{formatPrice(order.total)}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {isBirthday && (
                                <div className="bg-brutal-pink border-4 border-black p-6 shadow-brutal flex items-center gap-6 animate-pulse mb-6">
                                    <span className="material-symbols-outlined text-6xl text-white font-black">cake</span>
                                    <div>
                                        <h3 className="text-2xl font-black uppercase text-white italic tracking-tighter">Happy Birthday! 🎂</h3>
                                        <p className="font-black text-black uppercase bg-white px-2 py-1 mt-1 inline-block">Enjoy 10% OFF all items in your wishlist today ONLY!</p>
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {wishlistItems.length === 0 ? (
                                    <div className="col-span-2 border-4 border-dashed border-black p-12 text-center"><p className="text-xl font-black uppercase text-gray-500">Wishlist is empty</p></div>
                                ) : wishlistItems.map(item => {
                                    if (!item.products) return null;
                                    const p = item.products;
                                    const isOnSale = p.original_price && p.original_price > p.price;
                                    return (
                                        <Link to={`/product/${item.product_id}`} key={item.id} className="bg-white border-4 border-black shadow-brutal hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg transition-all flex gap-4 p-4 relative overflow-hidden">
                                            {isOnSale && (
                                                <div className="absolute top-2 -right-6 bg-brutal-red text-white text-xs font-black px-8 py-1 rotate-45 border-y-2 border-black">
                                                    ON SALE
                                                </div>
                                            )}
                                            <div className="w-24 h-24 border-4 border-black overflow-hidden bg-gray-100 shrink-0">
                                                <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                                            </div>
                                            <div className="flex-1 pr-6">
                                                <h4 className="font-black uppercase truncate">{p.name}</h4>
                                                <div className="mt-2">
                                                    {isOnSale ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-2xl font-black text-brutal-red">${p.price}</span>
                                                            <span className="text-sm font-bold line-through text-gray-500">${p.original_price}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-2xl font-black">${p.price}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-4 flex flex-col gap-8">
                    <div className="border-4 border-black shadow-brutal p-8 bg-brutal-blue text-center">
                        <div className="size-32 border-8 border-black bg-white mx-auto mb-6 overflow-hidden flex items-center justify-center">
                            {user.avatar ? (<img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />) : (<span className="material-symbols-outlined text-6xl">account_circle</span>)}
                        </div>
                        <h3 className="text-3xl font-display font-black uppercase mb-1 text-white">{user.name}</h3>
                        <p className="font-bold border-2 border-black bg-white inline-block px-3 mb-4">{user.email}</p>
                        <p className="font-black uppercase text-sm bg-brutal-yellow text-black border-2 border-black inline-block px-3 py-1 ml-2">{user.role}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════
   ADMIN DASHBOARD  – full platform control
   ═══════════════════════════════════════════ */
export const AdminDashboard = () => {
    const { isLoggedIn, user, logout, formatPrice } = useApp();
    const { t } = useI18n();
    const navigate = useNavigate();
    const [section, setSection] = useState<'overview' | 'users' | 'stores' | 'products' | 'orders'>('overview');
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [stores, setStores] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    useEffect(() => { if (!isLoggedIn) navigate('/login'); }, [isLoggedIn]);

    useEffect(() => { loadSection(); }, [section]);

    const loadSection = async () => {
        setLoading(true);
        try {
            if (section === 'overview') {
                const s = await api.getAdminStats();
                setStats(s);
            } else if (section === 'users') {
                const params: Record<string, string> = {};
                if (searchTerm) params.search = searchTerm;
                if (roleFilter) params.role = roleFilter;
                const res = await api.getAdminUsers(params);
                setUsers((res as any).users || []);
            } else if (section === 'stores') {
                const res = await api.getAdminStores();
                setStores(res as any[]);
            } else if (section === 'products') {
                const res = await api.getAdminProducts();
                setProducts((res as any).products || []);
            } else if (section === 'orders') {
                const res = await api.getAdminOrders();
                setOrders((res as any).orders || []);
            }
        } catch { }
        setLoading(false);
    };

    const handleRoleChange = async (userId: string, role: string) => {
        await api.updateUserRole(userId, role);
        loadSection();
    };
    const handleDeleteUser = async (userId: string) => {
        if (!confirm(t('admin.deleteConfirm'))) return;
        await api.deleteUser(userId);
        loadSection();
    };
    const handleVerifyStore = async (storeId: string, verified: boolean) => {
        await api.verifyStore(storeId, verified);
        loadSection();
    };
    const handleDeleteStore = async (storeId: string) => {
        if (!confirm(t('admin.deleteConfirm'))) return;
        await api.deleteStore(storeId);
        loadSection();
    };
    const handleDeleteProduct = async (productId: string) => {
        if (!confirm(t('admin.deleteConfirm'))) return;
        await api.adminDeleteProduct(productId);
        loadSection();
    };
    const handleOrderStatus = async (orderId: string, status: string) => {
        await api.updateOrderStatus(orderId, status);
        loadSection();
    };

    const navItems = [
        { key: 'overview', icon: 'dashboard', label: t('admin.overview') },
        { key: 'users', icon: 'group', label: t('admin.users') },
        { key: 'stores', icon: 'storefront', label: t('admin.stores') },
        { key: 'products', icon: 'inventory_2', label: t('admin.products') },
        { key: 'orders', icon: 'receipt_long', label: t('admin.orders') },
    ] as const;

    return (
        <div className="flex min-h-screen bg-[#f3f4f6]">
            {/* Sidebar */}
            <aside className="w-80 border-r-4 border-black bg-white flex-col sticky top-0 h-screen z-30 hidden lg:flex">
                <div className="p-6 border-b-4 border-black bg-brutal-yellow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-black flex items-center justify-center rotate-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(255,0,245,1)]">
                            <span className="material-symbols-outlined text-brutal-pink text-3xl">terminal</span>
                        </div>
                        <h1 className="font-display text-3xl font-black uppercase tracking-tighter italic">{t('admin.title')}</h1>
                    </div>
                </div>
                <nav className="flex-1 p-6 space-y-2">
                    {navItems.map(n => (
                        <button key={n.key} onClick={() => setSection(n.key)} className={`w-full flex items-center gap-4 px-4 py-3 font-bold uppercase border-2 transition-all text-left ${section === n.key ? 'bg-brutal-blue text-white border-black shadow-brutal' : 'border-transparent hover:border-black hover:bg-brutal-pink/20'}`}>
                            <span className="material-symbols-outlined">{n.icon}</span>
                            <span>{n.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t-4 border-black">
                    <p className="font-black text-sm truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 mb-2">{user?.email}</p>
                    <div className="flex gap-2">
                        <Link to="/" className="flex-1 text-center border-2 border-black bg-brutal-green px-2 py-1 font-bold text-xs uppercase">{t('home.shopNow')}</Link>
                        <button onClick={logout} className="flex-1 border-2 border-black bg-brutal-red text-white px-2 py-1 font-bold text-xs uppercase">{t('nav.logout')}</button>
                    </div>
                </div>
            </aside>

            {/* Mobile nav */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-4 border-black flex">
                {navItems.map(n => (
                    <button key={n.key} onClick={() => setSection(n.key)} className={`flex-1 py-3 flex flex-col items-center gap-1 text-xs font-black uppercase ${section === n.key ? 'bg-brutal-blue text-white' : ''}`}>
                        <span className="material-symbols-outlined text-xl">{n.icon}</span>
                        {n.label}
                    </button>
                ))}
            </div>

            {/* Main */}
            <main className="flex-1 p-6 md:p-10 space-y-8 pb-24 lg:pb-10">
                {loading ? (
                    <div className="flex items-center justify-center h-64"><span className="font-black uppercase animate-pulse text-2xl">{t('general.loading')}</span></div>
                ) : (
                    <>
                        {/* OVERVIEW */}
                        {section === 'overview' && stats && (
                            <div className="space-y-8">
                                <h2 className="font-display text-6xl font-black uppercase tracking-tighter leading-none">{t('admin.commandCenter')}</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[
                                        { label: t('admin.totalUsers'), value: stats.totalUsers, bg: 'bg-brutal-yellow', icon: 'group' },
                                        { label: t('admin.totalSellers'), value: stats.totalSellers, bg: 'bg-brutal-pink text-white', icon: 'store' },
                                        { label: t('admin.totalStores'), value: stats.totalStores, bg: 'bg-brutal-blue text-white', icon: 'storefront' },
                                        { label: t('admin.totalProducts'), value: stats.totalProducts, bg: 'bg-brutal-green', icon: 'inventory_2' },
                                        { label: t('admin.totalOrders'), value: stats.totalOrders, bg: 'bg-brutal-orange', icon: 'shopping_cart' },
                                        { label: t('admin.revenue'), value: `$${stats.totalRevenue}`, bg: 'bg-black text-white', icon: 'monetization_on' },
                                    ].map(s => (
                                        <div key={s.label} className={`${s.bg} border-4 border-black shadow-brutal p-6`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <p className="font-black uppercase tracking-tighter text-lg italic">{s.label}</p>
                                                <span className="material-symbols-outlined text-2xl">{s.icon}</span>
                                            </div>
                                            <h3 className="text-5xl font-black italic">{s.value}</h3>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* USERS */}
                        {section === 'users' && (
                            <div className="space-y-6">
                                <h2 className="font-display text-5xl font-black uppercase tracking-tighter">{t('admin.userMgmt')}</h2>
                                <div className="flex flex-wrap gap-3">
                                    <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadSection()} placeholder={t('admin.searchUsers')} className="border-4 border-black p-3 font-bold flex-1 min-w-[200px]" />
                                    <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); }} className="border-4 border-black p-3 font-bold bg-white">
                                        <option value="">{t('admin.allRoles')}</option>
                                        <option value="user">User</option>
                                        <option value="seller">Seller</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <button onClick={loadSection} className="border-4 border-black bg-brutal-yellow px-6 py-3 font-black uppercase shadow-brutal">{t('general.search')}</button>
                                </div>
                                <div className="bg-white border-4 border-black shadow-brutal overflow-x-auto">
                                    <table className="w-full">
                                        <thead><tr className="border-b-4 border-black bg-gray-100">
                                            <th className="text-left p-4 font-black uppercase text-xs">{t('admin.name')}</th>
                                            <th className="text-left p-4 font-black uppercase text-xs">{t('admin.email')}</th>
                                            <th className="text-left p-4 font-black uppercase text-xs">{t('admin.role')}</th>
                                            <th className="text-left p-4 font-black uppercase text-xs">{t('admin.joined')}</th>
                                            <th className="text-right p-4 font-black uppercase text-xs">{t('admin.actions')}</th>
                                        </tr></thead>
                                        <tbody>
                                            {users.map(u => (
                                                <tr key={u.id} className="border-b-2 border-black hover:bg-brutal-yellow/10">
                                                    <td className="p-4 font-bold">{u.name || '—'}</td>
                                                    <td className="p-4 text-sm font-mono">{u.email}</td>
                                                    <td className="p-4">
                                                        <select value={u.role || 'user'} onChange={e => handleRoleChange(u.id, e.target.value)} className={`border-2 border-black px-2 py-1 font-black text-xs uppercase ${u.role === 'admin' ? 'bg-brutal-red text-white' : u.role === 'seller' ? 'bg-brutal-blue text-white' : 'bg-brutal-green'}`}>
                                                            <option value="user">User</option>
                                                            <option value="seller">Seller</option>
                                                            <option value="admin">Admin</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-4 text-sm text-gray-500">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                                                    <td className="p-4 text-right">
                                                        <button onClick={() => handleDeleteUser(u.id)} disabled={u.id === user?.id} className="border-2 border-black px-3 py-1 font-bold text-xs uppercase hover:bg-brutal-red hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed">{t('general.delete')}</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* STORES */}
                        {section === 'stores' && (
                            <div className="space-y-6">
                                <h2 className="font-display text-5xl font-black uppercase tracking-tighter">{t('admin.storeMgmt')}</h2>
                                <div className="bg-white border-4 border-black shadow-brutal overflow-x-auto">
                                    <table className="w-full">
                                        <thead><tr className="border-b-4 border-black bg-gray-100">
                                            <th className="text-left p-4 font-black uppercase text-xs">{t('admin.store')}</th>
                                            <th className="text-left p-4 font-black uppercase text-xs">{t('admin.seller')}</th>
                                            <th className="text-center p-4 font-black uppercase text-xs">{t('admin.products')}</th>
                                            <th className="text-center p-4 font-black uppercase text-xs">{t('store.rating')}</th>
                                            <th className="text-center p-4 font-black uppercase text-xs">{t('admin.status')}</th>
                                            <th className="text-right p-4 font-black uppercase text-xs">{t('admin.actions')}</th>
                                        </tr></thead>
                                        <tbody>
                                            {stores.map(s => (
                                                <tr key={s.id} className="border-b-2 border-black hover:bg-brutal-yellow/10">
                                                    <td className="p-4"><div className="flex items-center gap-3"><span className="text-2xl">{s.logo || '🏪'}</span><span className="font-black">{s.name}</span></div></td>
                                                    <td className="p-4 text-sm font-bold">{s.profiles?.name || s.profiles?.email || '—'}</td>
                                                    <td className="p-4 text-center font-black">{s.product_count || 0}</td>
                                                    <td className="p-4 text-center font-black">{s.rating}</td>
                                                    <td className="p-4 text-center">
                                                        <button onClick={() => handleVerifyStore(s.id, !s.verified)} className={`px-3 py-1 border-2 border-black text-xs font-black uppercase ${s.verified ? 'bg-brutal-green' : 'bg-gray-200'}`}>{s.verified ? `✓ ${t('store.verified')}` : t('store.unverified')}</button>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button onClick={() => handleDeleteStore(s.id)} className="border-2 border-black px-3 py-1 font-bold text-xs uppercase hover:bg-brutal-red hover:text-white transition-all">{t('general.delete')}</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* PRODUCTS */}
                        {section === 'products' && (
                            <div className="space-y-6">
                                <h2 className="font-display text-5xl font-black uppercase tracking-tighter">{t('admin.allProducts')}</h2>
                                <div className="bg-white border-4 border-black shadow-brutal overflow-x-auto">
                                    <table className="w-full">
                                        <thead><tr className="border-b-4 border-black bg-gray-100">
                                            <th className="text-left p-4 font-black uppercase text-xs">{t('admin.products')}</th>
                                            <th className="text-left p-4 font-black uppercase text-xs">{t('seller.category')}</th>
                                            <th className="text-left p-4 font-black uppercase text-xs">{t('admin.store')}</th>
                                            <th className="text-right p-4 font-black uppercase text-xs">{t('seller.price')}</th>
                                            <th className="text-right p-4 font-black uppercase text-xs">{t('seller.stock')}</th>
                                            <th className="text-right p-4 font-black uppercase text-xs">{t('admin.actions')}</th>
                                        </tr></thead>
                                        <tbody>
                                            {products.map(p => (
                                                <tr key={p.id} className="border-b-2 border-black hover:bg-brutal-yellow/10">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 border-2 border-black overflow-hidden bg-gray-100 shrink-0">{p.image && <img src={p.image} alt="" className="w-full h-full object-contain" />}</div>
                                                            <span className="font-bold text-sm">{p.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm font-bold text-gray-600">{p.categories?.name || '—'}</td>
                                                    <td className="p-4 text-sm font-bold text-gray-600">{p.stores?.name || '—'}</td>
                                                    <td className="p-4 text-right font-black">${p.price}</td>
                                                    <td className="p-4 text-right"><span className={`px-2 py-0.5 border-2 border-black text-xs font-black ${(p.stock || 0) > 0 ? 'bg-brutal-green' : 'bg-brutal-red text-white'}`}>{p.stock || 0}</span></td>
                                                    <td className="p-4 text-right">
                                                        <button onClick={() => handleDeleteProduct(p.id)} className="border-2 border-black px-3 py-1 font-bold text-xs uppercase hover:bg-brutal-red hover:text-white transition-all">{t('general.delete')}</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* ORDERS */}
                        {section === 'orders' && (
                            <div className="space-y-6">
                                <h2 className="font-display text-5xl font-black uppercase tracking-tighter">{t('admin.allOrders')}</h2>
                                <div className="bg-white border-4 border-black shadow-brutal overflow-hidden">
                                    {orders.length === 0 ? (
                                        <div className="p-12 text-center font-bold text-gray-500">{t('seller.noOrders')}</div>
                                    ) : orders.map(o => (
                                        <div key={o.id} className="border-b-4 border-black p-6 last:border-0">
                                            <div className="flex flex-wrap justify-between items-start gap-4 mb-3">
                                                <div>
                                                    <h3 className="font-black text-lg">#{o.id.slice(0, 8)}</h3>
                                                    <p className="text-sm font-bold text-gray-500">Buyer: {o.profiles?.name || o.profiles?.email || t('general.unknown')}</p>
                                                    <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-black">${o.total}</p>
                                                    <span className={`inline-block px-2 py-0.5 border-2 border-black text-xs font-black uppercase mt-1 ${o.status === 'delivered' ? 'bg-brutal-green' : o.status === 'shipped' ? 'bg-brutal-blue text-white' : 'bg-brutal-yellow'}`}>{o.status}</span>
                                                </div>
                                            </div>
                                            {o.order_items && <p className="text-sm font-bold text-gray-600 mb-3">{o.order_items.map((item: any) => `${item.product_name} ×${item.quantity}`).join(', ')}</p>}
                                            <div className="flex gap-2 flex-wrap">
                                                {['pending', 'shipped', 'delivered', 'hold', 'cancelled'].map(s => (
                                                    <button key={s} disabled={o.status === s} onClick={() => handleOrderStatus(o.id, s)} className={`px-3 py-1 border-2 border-black text-xs font-black uppercase transition-all ${o.status === s ? 'bg-black text-white' : 'bg-white hover:bg-brutal-yellow'}`}>{t(`order.${s}`)}</button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

/* ═══════════════════════════════════════════
   SELLER DASHBOARD – store & product mgmt
   ═══════════════════════════════════════════ */
export const SellerDashboard = () => {
    const { isLoggedIn, user, formatPrice } = useApp();
    const { t, lang } = useI18n();
    const navigate = useNavigate();
    const [tab, setTab] = useState<'dashboard' | 'store' | 'products' | 'orders'>('dashboard');
    const [products, setProducts] = useState<Product[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [store, setStore] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [storeName, setStoreName] = useState('');
    const [storeNameZh, setStoreNameZh] = useState('');
    const [storeDesc, setStoreDesc] = useState('');
    const [storeDescZh, setStoreDescZh] = useState('');
    const [storeLogo, setStoreLogo] = useState('');
    const [pf, setPf] = useState({ name: '', name_zh: '', description: '', description_zh: '', price: '', original_price: '', category_id: '', stock: '', image: '', tags: '' });
    const resetPf = () => setPf({ name: '', name_zh: '', description: '', description_zh: '', price: '', original_price: '', category_id: '', stock: '', image: '', tags: '' });
    const [translating, setTranslating] = useState<string | null>(null);
    const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [productSearch, setProductSearch] = useState('');
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const [productImages, setProductImages] = useState<any[]>([]);

    useEffect(() => { if (!isLoggedIn) { navigate('/login'); return; } loadData(); }, [isLoggedIn]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [storeRes, prodRes, orderRes, catRes] = await Promise.all([
                api.getStores().catch(() => []),
                api.getProducts({ limit: '100', include_disabled: 'true' }).catch(() => ({ products: [] })),
                api.getSellerOrders().catch(() => ({ orders: [] })),
                api.getCategories().catch(() => []),
            ]);
            const myStore = (storeRes as any[]).find((s: any) => s.seller_id === user?.id);
            setStore(myStore || null);
            if (myStore) { setStoreName(myStore.name || ''); setStoreNameZh(myStore.name_zh || ''); setStoreDesc(myStore.description || ''); setStoreDescZh(myStore.description_zh || ''); setStoreLogo(myStore.logo || ''); }
            const myProds = ((prodRes as any).products || []).filter((p: any) => p.seller_id === user?.id || (myStore && p.store_id === myStore.id));
            setAllProducts(myProds);
            setProducts(myProds);
            setOrders((orderRes as any).orders || []);
            setCategories(catRes as any[]);
        } catch { }
        setLoading(false);
    };

    const handleCreateStore = async () => {
        if (!storeName.trim()) return;
        await api.createStore({ name: storeName, name_zh: storeNameZh, description: storeDesc, description_zh: storeDescZh, logo: storeLogo });
        await loadData();
        setTab('dashboard');
    };

    const handleSaveProduct = async () => {
        try {
            const body: any = { name: pf.name, name_zh: pf.name_zh || undefined, description: pf.description, description_zh: pf.description_zh || undefined, price: parseFloat(pf.price) || 0, original_price: pf.original_price ? parseFloat(pf.original_price) : undefined, category_id: pf.category_id || undefined, stock: parseInt(pf.stock) || 0, image: pf.image, tags: pf.tags ? pf.tags.split(',').map(t => t.trim()) : [] };
            if (editingProduct) { await api.updateProduct(editingProduct.id, body); } else { await api.createProduct(body); }
            setShowAddProduct(false); setEditingProduct(null); resetPf(); await loadData();
        } catch { }
    };

    const handleTranslate = async (field: 'name' | 'description', direction: 'en2zh' | 'zh2en') => {
        const srcField = direction === 'en2zh' ? field : (field + '_zh') as keyof typeof pf;
        const tgtField = direction === 'en2zh' ? (field + '_zh') as keyof typeof pf : field;
        const text = pf[srcField as keyof typeof pf];
        if (!text) return;
        setTranslating(`${field}_${direction}`);
        try {
            const result = await api.translate(text, direction === 'en2zh' ? 'en' : 'zh', direction === 'en2zh' ? 'zh' : 'en', field);
            setPf(prev => ({ ...prev, [tgtField]: (result as any).translated }));
        } catch (err: any) {
            console.error('Translation failed:', err);
            alert(t('seller.translatingError') || 'Translation failed. Please try again later.');
        }
        setTranslating(null);
    };

    const handleDeleteProduct = async (id: string) => { if (!confirm(t('admin.deleteConfirm'))) return; await api.deleteProduct(id); await loadData(); };
    const handleOrderStatus = async (orderId: string, status: string) => { await api.updateOrderStatus(orderId, status); await loadData(); };
    const openEdit = async (p: Product) => {
        setEditingProduct(p);
        setPf({ name: p.name, name_zh: (p as any).name_zh || '', description: p.description || '', description_zh: (p as any).description_zh || '', price: String(p.price), original_price: String(p.original_price || ''), category_id: p.category_id || '', stock: String(p.stock || 0), image: p.image || '', tags: (p.tags || []).join(', ') });
        setShowAddProduct(true);
        // Load product images
        try {
            const detail = await api.getProduct(p.id);
            const imgs = (detail.product_images || []).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
            setProductImages(imgs);
        } catch { setProductImages([]); }
    };
    const handleToggleProduct = async (p: Product) => {
        const newEnabled = !(p as any).enabled;
        await api.toggleProduct(p.id, newEnabled);
        await loadData();
    };

    // A14/A15: Product search filter
    const handleProductSearch = (query: string) => {
        setProductSearch(query);
        if (!query.trim()) {
            setProducts(allProducts);
        } else {
            const q = query.toLowerCase();
            setProducts(allProducts.filter(p => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)));
        }
    };

    const tabs = [
        { key: 'dashboard', icon: 'dashboard', label: t('seller.dashboard') },
        { key: 'store', icon: 'storefront', label: t('seller.myStore') },
        { key: 'products', icon: 'inventory_2', label: t('seller.products') },
        { key: 'orders', icon: 'shopping_bag', label: t('seller.orders') },
    ] as const;

    return (
        <div className="flex h-screen w-full bg-[#f0f0f0] overflow-hidden">
            <aside className="w-72 hidden md:flex flex-col bg-brutal-pink border-r-4 border-black z-20">
                <div className="h-20 flex items-center px-6 border-b-4 border-black bg-white">
                    <span className="material-symbols-outlined text-4xl mr-3">storefront</span>
                    <span className="text-xl font-black tracking-tighter uppercase">{t('seller.hub')}</span>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {tabs.map(tb => (
                        <button key={tb.key} onClick={() => setTab(tb.key)} className={`w-full flex items-center gap-3 px-4 py-3 border-2 font-black uppercase text-sm text-left transition-all ${tab === tb.key ? 'border-black bg-brutal-yellow shadow-brutal' : 'border-transparent hover:border-black hover:bg-white'}`}>
                            <span className="material-symbols-outlined">{tb.icon}</span><span>{tb.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t-4 border-black bg-white">
                    <p className="font-black text-sm truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    <Link to="/" className="mt-2 block text-center border-2 border-black bg-brutal-green px-3 py-1 font-bold text-sm uppercase hover:shadow-brutal transition-all">← {t('home.shopNow')}</Link>
                </div>
            </aside>

            <div className="flex-1 flex flex-col h-full overflow-auto p-6 md:p-8 gap-6">
                {/* Mobile tabs */}
                <div className="flex md:hidden gap-2 overflow-x-auto pb-2">
                    {tabs.map(tb => (<button key={tb.key} onClick={() => setTab(tb.key)} className={`flex-shrink-0 px-4 py-2 border-2 border-black font-bold text-xs uppercase ${tab === tb.key ? 'bg-brutal-yellow shadow-brutal' : 'bg-white'}`}>{tb.label}</button>))}
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center"><span className="font-black uppercase animate-pulse text-xl">{t('general.loading')}</span></div>
                ) : (
                    <>
                        {/* DASHBOARD */}
                        {tab === 'dashboard' && (
                            <div className="space-y-8">
                                <h1 className="text-5xl font-black uppercase tracking-tighter">{t('seller.dashboard')}</h1>
                                {!store ? (
                                    <div className="border-4 border-dashed border-black p-12 text-center bg-white">
                                        <span className="material-symbols-outlined text-6xl text-gray-400 block mb-4">add_business</span>
                                        <p className="text-xl font-black uppercase mb-4">{t('seller.noStore')}</p>
                                        <button onClick={() => setTab('store')} className="border-4 border-black bg-brutal-yellow px-8 py-3 font-black uppercase shadow-brutal hover:-translate-y-1 transition-all">{t('seller.createStore')} →</button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                            <div className="bg-brutal-green border-4 border-black shadow-brutal p-6"><p className="font-black uppercase text-sm opacity-70 mb-2">{t('admin.store')}</p><h3 className="text-xl font-black truncate">{store.name}</h3></div>
                                            <div className="bg-brutal-yellow border-4 border-black shadow-brutal p-6"><p className="font-black uppercase text-sm opacity-70 mb-2">{t('store.rating')}</p><h3 className="text-4xl font-black">{store.rating || 0}</h3></div>
                                            <div className="bg-brutal-blue text-white border-4 border-black shadow-brutal p-6"><p className="font-black uppercase text-sm opacity-70 mb-2">{t('seller.products')}</p><h3 className="text-4xl font-black">{products.length}</h3></div>
                                            <div className="bg-brutal-pink text-white border-4 border-black shadow-brutal p-6"><p className="font-black uppercase text-sm opacity-70 mb-2">{t('seller.orders')}</p><h3 className="text-4xl font-black">{orders.length}</h3></div>
                                        </div>
                                        <div className="bg-white border-4 border-black shadow-brutal p-6">
                                            <h2 className="text-xl font-black uppercase mb-4 border-b-4 border-black pb-3">{t('seller.recentOrders')}</h2>
                                            {orders.length === 0 ? <p className="font-bold text-gray-500">{t('seller.noOrders')}</p> : orders.slice(0, 5).map((o: any) => (
                                                <div key={o.id} className="flex justify-between items-center border-b-2 border-black py-3 last:border-0">
                                                    <div><span className="font-black">#{o.id.slice(0, 8)}</span><span className="ml-3 text-sm text-gray-500">{o.profiles?.name || o.profiles?.email}</span></div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-2 py-0.5 border-2 border-black text-xs font-black uppercase ${o.status === 'delivered' ? 'bg-brutal-green' : o.status === 'shipped' ? 'bg-brutal-blue text-white' : 'bg-brutal-yellow'}`}>{o.status}</span>
                                                        <span className="font-black">${o.total}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* STORE */}
                        {tab === 'store' && (
                            <div className="space-y-8 max-w-2xl">
                                <h1 className="text-5xl font-black uppercase tracking-tighter">{store ? t('seller.editStore') : t('seller.createStore')}</h1>
                                <div className="bg-white border-4 border-black shadow-brutal p-8 space-y-6">
                                    {/* Store Name - Bilingual */}
                                    <div className="space-y-3">
                                        <div><label className="block font-black uppercase text-sm mb-2">🇬🇧 {t('seller.storeNameEn')} *</label><input value={storeName} onChange={e => setStoreName(e.target.value)} className="w-full border-4 border-black p-3 font-bold text-lg focus:outline-none focus:border-brutal-blue" placeholder={t('seller.storeName')} /></div>
                                        <div><label className="block font-black uppercase text-sm mb-2">🇨🇳 {t('seller.storeNameZh')}</label><input value={storeNameZh} onChange={e => setStoreNameZh(e.target.value)} className="w-full border-4 border-black p-3 font-bold text-lg focus:outline-none focus:border-brutal-blue" placeholder={t('seller.storeNameZh')} /></div>
                                        <div className="flex gap-2">
                                            <button type="button" disabled={!storeName.trim() || translating === 'storeName'} onClick={async () => { setTranslating('storeName'); try { const r = await api.translate(storeName, 'en', 'zh', 'name'); setStoreNameZh((r as any).translated); } catch { alert(t('seller.translatingError')); } setTranslating(null); }} className="px-3 py-1 border-2 border-black text-xs font-black bg-brutal-yellow hover:bg-brutal-blue hover:text-white transition-colors disabled:opacity-50">{translating === 'storeName' ? t('seller.translating') : 'EN → 中文'}</button>
                                            <button type="button" disabled={!storeNameZh.trim() || translating === 'storeNameRev'} onClick={async () => { setTranslating('storeNameRev'); try { const r = await api.translate(storeNameZh, 'zh', 'en', 'name'); setStoreName((r as any).translated); } catch { alert(t('seller.translatingError')); } setTranslating(null); }} className="px-3 py-1 border-2 border-black text-xs font-black bg-brutal-yellow hover:bg-brutal-blue hover:text-white transition-colors disabled:opacity-50">{translating === 'storeNameRev' ? t('seller.translating') : '中文 → EN'}</button>
                                        </div>
                                    </div>
                                    {/* Store Description - Bilingual */}
                                    <div className="space-y-3">
                                        <div><label className="block font-black uppercase text-sm mb-2">🇬🇧 {t('seller.storeDescEn')}</label><textarea value={storeDesc} onChange={e => setStoreDesc(e.target.value)} rows={3} className="w-full border-4 border-black p-3 font-bold focus:outline-none focus:border-brutal-blue resize-none" placeholder={t('seller.storeDesc')} /></div>
                                        <div><label className="block font-black uppercase text-sm mb-2">🇨🇳 {t('seller.storeDescZh')}</label><textarea value={storeDescZh} onChange={e => setStoreDescZh(e.target.value)} rows={3} className="w-full border-4 border-black p-3 font-bold focus:outline-none focus:border-brutal-blue resize-none" placeholder={t('seller.storeDescZh')} /></div>
                                        <div className="flex gap-2">
                                            <button type="button" disabled={!storeDesc.trim() || translating === 'storeDesc'} onClick={async () => { setTranslating('storeDesc'); try { const r = await api.translate(storeDesc, 'en', 'zh', 'description'); setStoreDescZh((r as any).translated); } catch { alert(t('seller.translatingError')); } setTranslating(null); }} className="px-3 py-1 border-2 border-black text-xs font-black bg-brutal-yellow hover:bg-brutal-blue hover:text-white transition-colors disabled:opacity-50">{translating === 'storeDesc' ? t('seller.translating') : 'EN → 中文'}</button>
                                            <button type="button" disabled={!storeDescZh.trim() || translating === 'storeDescRev'} onClick={async () => { setTranslating('storeDescRev'); try { const r = await api.translate(storeDescZh, 'zh', 'en', 'description'); setStoreDesc((r as any).translated); } catch { alert(t('seller.translatingError')); } setTranslating(null); }} className="px-3 py-1 border-2 border-black text-xs font-black bg-brutal-yellow hover:bg-brutal-blue hover:text-white transition-colors disabled:opacity-50">{translating === 'storeDescRev' ? t('seller.translating') : '中文 → EN'}</button>
                                        </div>
                                    </div>
                                    {/* Logo */}
                                    <div><label className="block font-black uppercase text-sm mb-2">{t('seller.storeLogo')}</label><input value={storeLogo} onChange={e => setStoreLogo(e.target.value)} className="w-full border-4 border-black p-3 font-bold focus:outline-none focus:border-brutal-blue" placeholder="🏠" /></div>
                                    {!store ? (
                                        <button onClick={handleCreateStore} className="w-full border-4 border-black bg-brutal-green py-4 font-black uppercase text-lg shadow-brutal hover:-translate-y-1 transition-all">{t('seller.createStore')}</button>
                                    ) : (
                                        <button onClick={async () => { await api.updateStore(store.id, { name: storeName, name_zh: storeNameZh, description: storeDesc, description_zh: storeDescZh, logo: storeLogo }); await loadData(); }} className="w-full border-4 border-black bg-brutal-blue text-white py-4 font-black uppercase text-lg shadow-brutal hover:-translate-y-1 transition-all">{t('seller.saveChanges')}</button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* PRODUCTS */}
                        {tab === 'products' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h1 className="text-5xl font-black uppercase tracking-tighter">{t('seller.products')}</h1>
                                    <button onClick={() => { resetPf(); setEditingProduct(null); setShowAddProduct(true); }} className="border-4 border-black bg-brutal-orange px-6 py-3 font-black uppercase shadow-brutal hover:-translate-y-1 transition-all">+ {t('seller.addProduct')}</button>
                                </div>
                                {showAddProduct && (
                                    <div className="bg-white border-4 border-black shadow-brutal-lg p-6 space-y-4">
                                        <div className="flex justify-between items-center border-b-4 border-black pb-3">
                                            <h2 className="text-2xl font-black uppercase">{editingProduct ? t('seller.editProduct') : t('seller.addProduct')}</h2>
                                            <button onClick={() => { setShowAddProduct(false); setEditingProduct(null); resetPf(); }} className="border-2 border-black px-3 py-1 font-black hover:bg-brutal-red hover:text-white">✕</button>
                                        </div>
                                        {/* Bilingual Name Fields */}
                                        <div className="border-2 border-dashed border-gray-300 p-4 space-y-3 bg-gray-50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="material-symbols-outlined text-sm">translate</span>
                                                <span className="font-black text-xs uppercase">{t('seller.productName')}</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block font-black text-xs uppercase mb-1">🇬🇧 English *</label>
                                                    <input value={pf.name} onChange={e => setPf({ ...pf, name: e.target.value })} className="w-full border-3 border-black p-2 font-bold" />
                                                </div>
                                                <div>
                                                    <label className="block font-black text-xs uppercase mb-1">🇨🇳 中文</label>
                                                    <input value={pf.name_zh} onChange={e => setPf({ ...pf, name_zh: e.target.value })} className="w-full border-3 border-black p-2 font-bold" />
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleTranslate('name', 'en2zh')} disabled={!pf.name || translating === 'name_en2zh'} className="flex items-center gap-1 px-3 py-1 border-2 border-black bg-brutal-yellow font-bold text-xs uppercase hover:shadow-brutal transition-all disabled:opacity-40">
                                                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                                    {translating === 'name_en2zh' ? t('seller.translating') : `EN → 中文 ${t('seller.aiTranslate')}`}
                                                </button>
                                                <button onClick={() => handleTranslate('name', 'zh2en')} disabled={!pf.name_zh || translating === 'name_zh2en'} className="flex items-center gap-1 px-3 py-1 border-2 border-black bg-brutal-pink text-white font-bold text-xs uppercase hover:shadow-brutal transition-all disabled:opacity-40">
                                                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                                    {translating === 'name_zh2en' ? t('seller.translating') : `中文 → EN ${t('seller.aiTranslate')}`}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label className="block font-black text-xs uppercase mb-1">{t('seller.category')}</label><select value={pf.category_id} onChange={e => setPf({ ...pf, category_id: e.target.value })} className="w-full border-3 border-black p-2 font-bold bg-white"><option value="">{t('seller.selectCategory')}</option>{categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                                            <div><label className="block font-black text-xs uppercase mb-1">{t('seller.price')} *</label><input type="number" value={pf.price} onChange={e => setPf({ ...pf, price: e.target.value })} className="w-full border-3 border-black p-2 font-bold" /></div>
                                            <div><label className="block font-black text-xs uppercase mb-1">{t('seller.originalPrice')}</label><input type="number" value={pf.original_price} onChange={e => setPf({ ...pf, original_price: e.target.value })} className="w-full border-3 border-black p-2 font-bold" /></div>
                                            <div><label className="block font-black text-xs uppercase mb-1">{t('seller.stock')}</label><input type="number" value={pf.stock} onChange={e => setPf({ ...pf, stock: e.target.value })} className="w-full border-3 border-black p-2 font-bold" /></div>
                                            <div className="md:col-span-2">
                                                <label className="block font-black text-xs uppercase mb-2">{t('seller.imageUrl')}</label>
                                                {/* Mode toggle */}
                                                <div className="flex gap-0 mb-3">
                                                    <button type="button" onClick={() => setImageMode('upload')} className={`flex-1 px-4 py-2 border-3 border-black font-black text-sm uppercase transition-colors ${imageMode === 'upload' ? 'bg-brutal-blue text-white' : 'bg-white hover:bg-gray-100'}`}>
                                                        <span className="material-symbols-outlined text-sm align-middle mr-1">cloud_upload</span>
                                                        {t('seller.uploadImage')}
                                                    </button>
                                                    <button type="button" onClick={() => setImageMode('url')} className={`flex-1 px-4 py-2 border-3 border-black border-l-0 font-black text-sm uppercase transition-colors ${imageMode === 'url' ? 'bg-brutal-blue text-white' : 'bg-white hover:bg-gray-100'}`}>
                                                        <span className="material-symbols-outlined text-sm align-middle mr-1">link</span>
                                                        {t('seller.pasteUrl')}
                                                    </button>
                                                </div>
                                                {imageMode === 'upload' ? (
                                                    <div
                                                        className={`border-3 border-dashed border-black p-6 text-center cursor-pointer transition-colors hover:bg-brutal-yellow/10 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                                                        onClick={() => fileInputRef.current?.click()}
                                                        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('bg-brutal-yellow/20'); }}
                                                        onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove('bg-brutal-yellow/20'); }}
                                                        onDrop={async e => {
                                                            e.preventDefault();
                                                            e.currentTarget.classList.remove('bg-brutal-yellow/20');
                                                            const file = e.dataTransfer.files[0];
                                                            if (!file) return;
                                                            setUploading(true);
                                                            try { const r = await api.uploadImage(file); setPf({ ...pf, image: r.url }); } catch (err: any) { alert(err.message || t('seller.uploadError')); }
                                                            setUploading(false);
                                                        }}
                                                    >
                                                        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={async e => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            setUploading(true);
                                                            try { const r = await api.uploadImage(file); setPf({ ...pf, image: r.url }); } catch (err: any) { alert(err.message || t('seller.uploadError')); }
                                                            setUploading(false);
                                                            e.target.value = '';
                                                        }} />
                                                        {uploading ? (
                                                            <div className="flex items-center justify-center gap-2">
                                                                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                                                <span className="font-black uppercase">{t('seller.uploading')}</span>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <span className="material-symbols-outlined text-4xl text-brutal-blue">add_photo_alternate</span>
                                                                <p className="font-black text-sm uppercase mt-2">{t('seller.dragOrClick')}</p>
                                                                <p className="text-xs text-gray-500 font-bold mt-1">{t('seller.maxFileSize')}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <input value={pf.image} onChange={e => setPf({ ...pf, image: e.target.value })} className="w-full border-3 border-black p-2 font-bold" placeholder="https://..." />
                                                )}
                                                {/* Preview */}
                                                {pf.image && (
                                                    <div className="mt-3 relative inline-block">
                                                        <div className="w-24 h-24 border-3 border-black overflow-hidden bg-gray-100">
                                                            <img src={pf.image} alt="Preview" className="w-full h-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                                        </div>
                                                        <button type="button" onClick={() => setPf({ ...pf, image: '' })} className="absolute -top-2 -right-2 w-6 h-6 bg-brutal-red text-white border-2 border-black flex items-center justify-center font-black text-xs hover:scale-110 transition-transform">✕</button>
                                                    </div>
                                                )}
                                                {/* Multi-image gallery management */}
                                                {editingProduct && productImages.length > 0 && (
                                                    <div className="mt-4 border-3 border-dashed border-gray-400 p-3 bg-gray-50">
                                                        <h4 className="font-black text-xs uppercase mb-3 flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-sm">photo_library</span>
                                                            {t('seller.productImages')} ({productImages.length})
                                                        </h4>
                                                        <div className="flex flex-wrap gap-3">
                                                            {productImages.map((img: any, idx: number) => (
                                                                <div key={img.id} className={`relative group w-20 h-20 border-3 ${idx === 0 ? 'border-brutal-blue ring-2 ring-brutal-blue' : 'border-black'} overflow-hidden bg-white`}>
                                                                    <img src={img.url} alt="" className="w-full h-full object-contain" />
                                                                    {idx === 0 && <span className="absolute top-0 left-0 bg-brutal-blue text-white text-[8px] font-black px-1">{t('seller.primary')}</span>}
                                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                                                                        {idx !== 0 && (
                                                                            <button onClick={async () => {
                                                                                const newOrder = [img.id, ...productImages.filter((i: any) => i.id !== img.id).map((i: any) => i.id)];
                                                                                await api.reorderProductImages(editingProduct!.id, newOrder);
                                                                                const detail = await api.getProduct(editingProduct!.id);
                                                                                setProductImages((detail.product_images || []).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)));
                                                                                setPf(prev => ({ ...prev, image: img.url }));
                                                                            }} className="text-[9px] font-black bg-brutal-blue text-white px-2 py-0.5 border border-white">
                                                                                ★ {t('seller.setPrimary')}
                                                                            </button>
                                                                        )}
                                                                        <button onClick={async () => {
                                                                            if (!confirm(t('admin.deleteConfirm') || 'Delete this?')) return;
                                                                            await api.deleteProductImage(editingProduct!.id, img.id);
                                                                            setProductImages(prev => prev.filter((i: any) => i.id !== img.id));
                                                                        }} className="text-[9px] font-black bg-brutal-red text-white px-2 py-0.5 border border-white">
                                                                            ✕ {t('general.delete').toUpperCase()}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 font-bold mt-2">{t('seller.imageHoverHint')}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {/* Bilingual Description Fields */}
                                        <div className="border-2 border-dashed border-gray-300 p-4 space-y-3 bg-gray-50">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="material-symbols-outlined text-sm">translate</span>
                                                <span className="font-black text-xs uppercase">{t('seller.description')}</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block font-black text-xs uppercase mb-1">🇬🇧 English</label>
                                                    <textarea value={pf.description} onChange={e => setPf({ ...pf, description: e.target.value })} rows={3} className="w-full border-3 border-black p-2 font-bold resize-none" />
                                                </div>
                                                <div>
                                                    <label className="block font-black text-xs uppercase mb-1">🇨🇳 中文</label>
                                                    <textarea value={pf.description_zh} onChange={e => setPf({ ...pf, description_zh: e.target.value })} rows={3} className="w-full border-3 border-black p-2 font-bold resize-none" />
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleTranslate('description', 'en2zh')} disabled={!pf.description || translating === 'description_en2zh'} className="flex items-center gap-1 px-3 py-1 border-2 border-black bg-brutal-yellow font-bold text-xs uppercase hover:shadow-brutal transition-all disabled:opacity-40">
                                                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                                    {translating === 'description_en2zh' ? t('seller.translating') : `EN → 中文 ${t('seller.aiTranslate')}`}
                                                </button>
                                                <button onClick={() => handleTranslate('description', 'zh2en')} disabled={!pf.description_zh || translating === 'description_zh2en'} className="flex items-center gap-1 px-3 py-1 border-2 border-black bg-brutal-pink text-white font-bold text-xs uppercase hover:shadow-brutal transition-all disabled:opacity-40">
                                                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                                    {translating === 'description_zh2en' ? t('seller.translating') : `中文 → EN ${t('seller.aiTranslate')}`}
                                                </button>
                                            </div>
                                        </div>
                                        <div><label className="block font-black text-xs uppercase mb-1">{t('seller.tags')}</label><input value={pf.tags} onChange={e => setPf({ ...pf, tags: e.target.value })} className="w-full border-3 border-black p-2 font-bold" placeholder="sports, premium" /></div>
                                        <button onClick={handleSaveProduct} className="w-full border-4 border-black bg-brutal-green py-3 font-black uppercase shadow-brutal hover:-translate-y-1 transition-all">{editingProduct ? t('seller.saveChanges') : t('seller.createProduct')}</button>
                                    </div>
                                )}

                                {/* A14/A15: Product search */}
                                <div className="flex gap-4 items-center">
                                    <div className="flex-1 flex items-center border-4 border-black bg-white shadow-brutal">
                                        <span className="material-symbols-outlined p-3 text-gray-500">search</span>
                                        <input
                                            type="text"
                                            value={productSearch}
                                            onChange={e => handleProductSearch(e.target.value)}
                                            placeholder={t('seller.searchProducts')}
                                            className="flex-1 p-3 border-none font-bold text-sm focus:ring-0"
                                        />
                                    </div>
                                </div>

                                <div className="bg-white border-4 border-black shadow-brutal overflow-x-auto">
                                    <table className="w-full">
                                        <thead><tr className="border-b-4 border-black bg-gray-100">
                                            <th className="text-left p-4 font-black uppercase text-xs">ID</th>
                                            <th className="text-left p-4 font-black uppercase text-xs">{t('seller.products')}</th>
                                            <th className="text-left p-4 font-black uppercase text-xs">{t('seller.category')}</th>
                                            <th className="text-right p-4 font-black uppercase text-xs">{t('seller.price')}</th>
                                            <th className="text-right p-4 font-black uppercase text-xs">{t('seller.stock')}</th>
                                            <th className="text-center p-4 font-black uppercase text-xs">{t('seller.status')}</th>
                                            <th className="text-right p-4 font-black uppercase text-xs">{t('admin.actions')}</th>
                                        </tr></thead>
                                        <tbody>
                                            {products.length === 0 ? (
                                                <tr><td colSpan={7} className="p-8 text-center font-bold text-gray-500">{t('seller.noProducts')}</td></tr>
                                            ) : products.map(p => (
                                                <tr key={p.id} className={`border-b-2 border-black hover:bg-brutal-yellow/10 ${(p as any).enabled === false ? 'opacity-50' : ''}`}>
                                                    <td className="p-4 font-mono text-xs text-gray-500">{p.id.slice(0, 8)}</td>
                                                    <td className="p-4"><div className="flex items-center gap-3"><div className="w-12 h-12 border-2 border-black overflow-hidden bg-gray-100">{p.image && <img src={p.image} alt={p.name} className="w-full h-full object-contain" />}</div><span className="font-black text-sm">{p.name}</span></div></td>
                                                    <td className="p-4 text-sm font-bold text-gray-600">{(p as any).categories?.name || '—'}</td>
                                                    <td className="p-4 text-right font-black">${p.price}</td>
                                                    <td className="p-4 text-right"><span className={`px-2 py-0.5 border-2 border-black text-xs font-black ${(p.stock || 0) > 0 ? 'bg-brutal-green' : 'bg-brutal-red text-white'}`}>{p.stock || 0}</span></td>
                                                    <td className="p-4 text-center">
                                                        <button onClick={() => handleToggleProduct(p)} className={`px-3 py-1 border-2 border-black text-xs font-black uppercase transition-all ${(p as any).enabled !== false ? 'bg-brutal-green hover:bg-brutal-red hover:text-white' : 'bg-gray-300 hover:bg-brutal-green'}`}>
                                                            {(p as any).enabled !== false ? t('seller.enabled') : t('seller.disabled')}
                                                        </button>
                                                    </td>
                                                    <td className="p-4 text-right space-x-2">
                                                        <button onClick={() => openEdit(p)} className="border-2 border-black px-3 py-1 font-bold text-xs uppercase hover:bg-brutal-blue hover:text-white">{t('general.edit')}</button>
                                                        <button onClick={() => handleDeleteProduct(p.id)} className="border-2 border-black px-3 py-1 font-bold text-xs uppercase hover:bg-brutal-red hover:text-white">{t('general.delete')}</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* ORDERS — A20/B2 */}
                        {tab === 'orders' && (
                            <div className="space-y-6">
                                <h1 className="text-5xl font-black uppercase tracking-tighter">{t('seller.orders')}</h1>
                                <div className="bg-white border-4 border-black shadow-brutal overflow-hidden">
                                    {orders.length === 0 ? (
                                        <div className="p-12 text-center"><p className="font-bold text-gray-500">{t('seller.noOrders')}</p></div>
                                    ) : orders.map((o: any) => (
                                        <div key={o.id} className="border-b-4 border-black last:border-0">
                                            {/* Order header — clickable to expand */}
                                            <button onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)} className="w-full p-6 text-left hover:bg-brutal-yellow/10 transition-colors">
                                                <div className="flex flex-wrap justify-between items-start gap-4">
                                                    <div>
                                                        <h3 className="font-black text-lg flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-sm">{expandedOrder === o.id ? 'expand_less' : 'expand_more'}</span>
                                                            Order #{o.id.slice(0, 8)}
                                                        </h3>
                                                        <p className="text-sm font-bold text-gray-500">{t('seller.buyer')}: {o.profiles?.name || o.profiles?.email || t('general.unknown')}</p>
                                                        <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleString()}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-black">${o.total}</p>
                                                        <span className={`inline-block px-2 py-0.5 border-2 border-black text-xs font-black uppercase mt-1 ${o.status === 'delivered' ? 'bg-brutal-green' : o.status === 'cancelled' ? 'bg-brutal-red text-white' : o.status === 'hold' ? 'bg-orange-400' : o.status === 'shipped' ? 'bg-brutal-blue text-white' : 'bg-brutal-yellow'}`}>{t(`order.${o.status}`)}</span>
                                                    </div>
                                                </div>
                                            </button>

                                            {/* Expanded detail — A20 */}
                                            {expandedOrder === o.id && (
                                                <div className="px-6 pb-6 border-t-2 border-black bg-gray-50">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 mb-6">
                                                        {/* Shipping Info */}
                                                        <div className="border-2 border-black p-4 bg-white">
                                                            <h4 className="font-black text-xs uppercase mb-2 flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-sm">local_shipping</span>
                                                                {t('order.shippingInfo')}
                                                            </h4>
                                                            <div className="text-sm font-bold space-y-1">
                                                                <p>{o.shipping_name || '—'}</p>
                                                                <p>{o.shipping_street || '—'}</p>
                                                                <p>{o.shipping_city} {o.shipping_zip}</p>
                                                                <p>{o.shipping_country || '—'}</p>
                                                            </div>
                                                        </div>
                                                        {/* Status Dates */}
                                                        <div className="border-2 border-black p-4 bg-white">
                                                            <h4 className="font-black text-xs uppercase mb-2 flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-sm">schedule</span>
                                                                {t('order.statusDates')}
                                                            </h4>
                                                            <div className="text-sm font-bold space-y-1">
                                                                <p>{t('order.pending')}: {new Date(o.created_at).toLocaleString()}</p>
                                                                {o.shipped_at && <p>{t('order.shipped')}: {new Date(o.shipped_at).toLocaleString()}</p>}
                                                                {o.delivered_at && <p>{t('order.delivered')}: {new Date(o.delivered_at).toLocaleString()}</p>}
                                                                {o.hold_at && <p>{t('order.hold')}: {new Date(o.hold_at).toLocaleString()}</p>}
                                                                {o.cancelled_at && <p>{t('order.cancelled')}: {new Date(o.cancelled_at).toLocaleString()}</p>}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Line Items */}
                                                    {o.order_items && (
                                                        <div className="border-2 border-black bg-white mb-4">
                                                            <div className="grid grid-cols-12 gap-2 p-3 border-b-2 border-black bg-gray-100 text-xs font-black uppercase">
                                                                <div className="col-span-5">{t('order.productName')}</div>
                                                                <div className="col-span-2 text-right">{t('order.unitPrice')}</div>
                                                                <div className="col-span-2 text-center">{t('order.qty')}</div>
                                                                <div className="col-span-3 text-right">{t('order.subtotal')}</div>
                                                            </div>
                                                            {o.order_items.map((item: any) => (
                                                                <div key={item.id} className="grid grid-cols-12 gap-2 p-3 items-center border-b border-black last:border-0">
                                                                    <div className="col-span-5 flex items-center gap-2">
                                                                        {item.product_image && <div className="w-10 h-10 border border-black overflow-hidden shrink-0"><img src={item.product_image} alt="" className="w-full h-full object-cover" /></div>}
                                                                        <span className="font-bold text-sm">{item.product_name}</span>
                                                                    </div>
                                                                    <div className="col-span-2 text-right font-bold text-sm">${item.price}</div>
                                                                    <div className="col-span-2 text-center font-bold text-sm">×{item.quantity}</div>
                                                                    <div className="col-span-3 text-right font-black">${(item.price * item.quantity).toFixed(2)}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* B2: Status workflow buttons */}
                                                    <div className="flex gap-2 flex-wrap">
                                                        {o.status === 'pending' && (
                                                            <>
                                                                <button onClick={() => handleOrderStatus(o.id, 'shipped')} className="px-4 py-2 border-2 border-black text-xs font-black uppercase bg-brutal-blue text-white hover:shadow-brutal transition-all flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-sm">local_shipping</span> {t('order.actionShip')}
                                                                </button>
                                                                <button onClick={() => handleOrderStatus(o.id, 'hold')} className="px-4 py-2 border-2 border-black text-xs font-black uppercase bg-orange-400 hover:shadow-brutal transition-all flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-sm">pause_circle</span> {t('order.actionHold')}
                                                                </button>
                                                            </>
                                                        )}
                                                        {o.status === 'hold' && (
                                                            <button onClick={() => handleOrderStatus(o.id, 'shipped')} className="px-4 py-2 border-2 border-black text-xs font-black uppercase bg-brutal-blue text-white hover:shadow-brutal transition-all flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-sm">local_shipping</span> {t('order.actionShip')}
                                                            </button>
                                                        )}
                                                        {o.status === 'shipped' && (
                                                            <button onClick={() => handleOrderStatus(o.id, 'delivered')} className="px-4 py-2 border-2 border-black text-xs font-black uppercase bg-brutal-green hover:shadow-brutal transition-all flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-sm">check_circle</span> {t('order.actionDeliver')}
                                                            </button>
                                                        )}
                                                        {(o.status === 'pending' || o.status === 'hold') && (
                                                            <button onClick={() => handleOrderStatus(o.id, 'cancelled')} className="px-4 py-2 border-2 border-black text-xs font-black uppercase bg-brutal-red text-white hover:shadow-brutal transition-all flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-sm">cancel</span> {t('order.actionCancel')}
                                                            </button>
                                                        )}
                                                        {(o.status === 'delivered' || o.status === 'cancelled') && (
                                                            <span className="px-4 py-2 text-xs font-black uppercase text-gray-400">{t('order.noActions')}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};