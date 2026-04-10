import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AddressSelector } from '../components/AddressSelector';
import { useApp } from '../context';
import { useI18n, localized } from '../i18n';
import { api } from '../api';
import { Order, WishlistItem, Product } from '../types';

/* ═══════════════════════════════════════════
   BUYER DASHBOARD
   ═══════════════════════════════════════════ */
export const UserDashboard = () => {
    const { user, isLoggedIn, logout, formatPrice } = useApp();
    const { t, lang } = useI18n();
    const navigate = useNavigate();
    const location = useLocation();

    const [orders, setOrders] = useState<Order[]>([]);
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [isBirthday, setIsBirthday] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [editProfile, setEditProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        name: '',
        contact_person: '',
        contact_phone: '',
        birthday_month: '',
        birthday_day: '',
        shipping_address: { street: '', city: '', state: '', zip: '', country: '' }
    });

    const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'profile'>(() => {
        const params = new URLSearchParams(location.search);
        return (params.get('tab') as 'orders' | 'wishlist' | 'profile') || 'orders';
    });

    // Sync activeTab with URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab') as 'orders' | 'wishlist' | 'profile';
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [location.search]);

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
        const today = new Date();
        Promise.all([
            loadOrders(statusFilter),
            api.getWishlist(today.getMonth() + 1, today.getDate()).catch(() => ({ data: [], isBirthday: false })),
            api.getMe().catch(() => null),
        ]).then(([_, w, p]) => {
            setWishlistItems((w as any).data || []);
            setIsBirthday((w as any).isBirthday || false);
            if (p) {
                setProfile(p);
                setProfileForm({
                    name: p.name || '',
                    contact_person: p.contact_person || '',
                    contact_phone: p.contact_phone || '',
                    birthday_month: p.birthday_month ? String(p.birthday_month) : '',
                    birthday_day: p.birthday_day ? String(p.birthday_day) : '',
                    shipping_address: p.shipping_address || { street: '', city: '', state: '', zip: '', country: '' }
                });
            }
        }).finally(() => setLoading(false));
    }, [isLoggedIn, navigate]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const body: any = { ...profileForm };
            if (body.birthday_month) body.birthday_month = parseInt(body.birthday_month);
            if (body.birthday_day) body.birthday_day = parseInt(body.birthday_day);
            
            const updated = await api.updateProfile(body);
            setProfile(updated);
            setEditProfile(false);
        } catch (err: any) {
            alert(err.message);
        }
    };

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
                        <button onClick={() => setActiveTab('profile')} className={`flex-1 py-4 font-black uppercase text-lg border-l-4 border-black ${activeTab === 'profile' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}>{t('dash.profile')}</button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12"><span className="font-black uppercase animate-pulse text-xl">{t('general.loading')}</span></div>
                    ) : activeTab === 'profile' ? (
                        <div className="bg-white border-4 border-black shadow-brutal p-8">
                            <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-4">
                                <h3 className="text-3xl font-black uppercase italic tracking-tighter">{t('dash.profile')}</h3>
                                {!editProfile && (
                                    <button onClick={() => setEditProfile(true)} className="bg-brutal-yellow border-4 border-black px-6 py-2 font-black uppercase shadow-brutal hover:-translate-y-1 transition-all flex items-center gap-2">
                                        <span className="material-symbols-outlined font-black">edit</span>
                                        {t('dash.editProfile')}
                                    </button>
                                )}
                            </div>

                            {editProfile ? (
                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-black uppercase">{t('auth.name')}</label>
                                            <input type="text" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} className="w-full p-3 border-4 border-black font-bold focus:ring-0 focus:border-brutal-pink" required />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-black uppercase">{t('auth.birthdayHint')}</label>
                                                <button 
                                                    type="button"
                                                    onClick={() => alert(lang === 'zh' ? '生日特惠详细规则：\n1. 账号需注册满 30 天方可激活特惠。\n2. 需至少拥有一笔“已送达”的历史订单。\n3. 生日信息一旦设定，出于安全考虑将无法再次修改。' : 'Birthday Promotion Rules:\n1. Account must be at least 30 days old.\n2. Must have at least one "Delivered" order history.\n3. Birthday info is locked once set to prevent abuse.')}
                                                    className="text-[10px] font-black uppercase underline text-brutal-blue flex items-center gap-1"
                                                >
                                                    <span className="material-symbols-outlined text-xs">info</span>
                                                    {lang === 'zh' ? '查看详细规则' : 'View Detailed Rules'}
                                                </button>
                                            </div>
                                            <div className="flex gap-4">
                                                <input 
                                                    type="number" 
                                                    min="1" max="12"
                                                    value={profileForm.birthday_month} 
                                                    onChange={e => setProfileForm({ ...profileForm, birthday_month: e.target.value })}
                                                    disabled={!!profile?.birthday_month} 
                                                    placeholder="MM"
                                                    className={`flex-1 p-3 border-4 border-black font-bold focus:ring-0 ${!!profile?.birthday_month ? 'bg-gray-100 cursor-not-allowed' : 'bg-white focus:border-brutal-pink'}`} 
                                                />
                                                <input 
                                                    type="number" 
                                                    min="1" max="31"
                                                    value={profileForm.birthday_day} 
                                                    onChange={e => setProfileForm({ ...profileForm, birthday_day: e.target.value })}
                                                    disabled={!!profile?.birthday_day} 
                                                    placeholder="DD"
                                                    className={`flex-1 p-3 border-4 border-black font-bold focus:ring-0 ${!!profile?.birthday_day ? 'bg-gray-100 cursor-not-allowed' : 'bg-white focus:border-brutal-pink'}`} 
                                                />
                                            </div>
                                            {profile?.birthday_month ? (
                                                <p className="text-[10px] font-bold text-brutal-red italic">{t('dash.birthdayLocked')}</p>
                                            ) : (
                                                <p className="text-[10px] font-bold text-brutal-blue italic">{lang === 'zh' ? '* 生日设定后将无法修改' : '* Birthday cannot be changed once set'}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-black uppercase">{lang === 'zh' ? '联系人' : 'Contact Person'}</label>
                                            <input type="text" value={profileForm.contact_person} onChange={e => setProfileForm({ ...profileForm, contact_person: e.target.value })} className="w-full p-3 border-4 border-black font-bold focus:ring-0 focus:border-brutal-pink" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-black uppercase">{lang === 'zh' ? '联系电话' : 'Contact Phone'}</label>
                                            <input type="text" value={profileForm.contact_phone} onChange={e => setProfileForm({ ...profileForm, contact_phone: e.target.value })} className="w-full p-3 border-4 border-black font-bold focus:ring-0 focus:border-brutal-pink" />
                                        </div>
                                    </div>
                                    
                                    <div className="border-4 border-black p-4 bg-gray-50">
                                        <h4 className="text-sm font-black uppercase mb-4 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">local_shipping</span>
                                            {t('auth.shippingAddress')}
                                        </h4>
                                        <AddressSelector 
                                            address={profileForm.shipping_address} 
                                            onChange={addr => setProfileForm({ ...profileForm, shipping_address: addr })} 
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button type="submit" className="flex-1 bg-brutal-green border-4 border-black py-4 font-black uppercase text-xl shadow-brutal hover:-translate-y-1 transition-all">{t('dash.saveProfile')}</button>
                                        <button type="button" onClick={() => setEditProfile(false)} className="px-8 border-4 border-black py-4 font-black uppercase text-xl hover:bg-gray-100 transition-all">{t('general.cancel')}</button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div><p className="text-xs font-black uppercase text-gray-500 mb-1">{t('auth.name')}</p><p className="text-2xl font-black">{profile?.name || '—'}</p></div>
                                            <div><p className="text-xs font-black uppercase text-gray-500 mb-1">Email</p><p className="text-xl font-bold">{profile?.email}</p></div>
                                            <div>
                                                <p className="text-xs font-black uppercase text-gray-500 mb-1">{t('auth.birthdayHint')}</p>
                                                <p className="text-xl font-black">{profile?.birthday_month} / {profile?.birthday_day}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div><p className="text-xs font-black uppercase text-gray-500 mb-1">{lang === 'zh' ? '联系信息' : 'Contact Info'}</p><p className="text-lg font-bold">{profile?.contact_person || '—'} {profile?.contact_phone ? `(${profile.contact_phone})` : ''}</p></div>
                                            <div>
                                                <p className="text-xs font-black uppercase text-gray-500 mb-1">{t('auth.shippingAddress')}</p>
                                                {profile?.shipping_address ? (
                                                    <div className="text-lg font-bold">
                                                        <p>{profile.shipping_address.street}</p>
                                                        <p>{profile.shipping_address.city}, {profile.shipping_address.state} {profile.shipping_address.zip}</p>
                                                        <p>{profile.shipping_address.country}</p>
                                                    </div>
                                                ) : <p className="text-gray-400 italic">{lang === 'zh' ? '暂未保存地址' : 'No address saved'}</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
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
                                                <h4 className="font-black uppercase text-lg">{t('order.title')} #{order.id.slice(0, 8)}</h4>
                                                {order.stores && (
                                                    <div className="flex items-center gap-1 bg-brutal-yellow border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase">
                                                        <span className="material-symbols-outlined text-[12px]">storefront</span>
                                                        {localized(order.stores, 'name', lang)}
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
                                                    <span className="text-xs font-bold text-gray-500 ml-1">{order.order_items.length} {order.order_items.length === 1 ? t('order.productName') : t('order.items')}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-3 py-1 border-2 border-black font-black uppercase text-sm ${
                                                order.status === 'delivered' ? 'bg-brutal-green' : 
                                                order.status === 'cancelled' ? 'bg-brutal-red text-white' : 
                                                order.status === 'refund_requested' ? 'bg-orange-400 text-white animate-pulse' :
                                                order.status === 'refunded' ? 'bg-brutal-pink text-white' :
                                                order.status === 'hold' ? 'bg-orange-400' : 
                                                order.status === 'shipped' ? 'bg-brutal-blue text-white' : 'bg-brutal-yellow'
                                            }`}>
                                                {t(`order.${order.status}`)}
                                            </span>
                                            <span className="text-2xl font-black">{formatPrice(order.total)}</span>
                                            
                                            {order.status === 'delivered' && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        const reason = prompt(lang === 'zh' ? '请输入退货原因：' : 'Please enter refund reason:');
                                                        if (reason) api.requestRefund(order.id, reason).then(() => loadData());
                                                    }}
                                                    className="mt-2 text-[10px] font-black uppercase bg-white border-2 border-black px-2 py-1 shadow-brutal-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                                                >
                                                    {lang === 'zh' ? '申请退货' : 'Request Refund'}
                                                </button>
                                            )}
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
                                        <h3 className="text-2xl font-black uppercase text-white italic tracking-tighter">{t('notif.birthday.title')}</h3>
                                        <p className="font-black text-black uppercase bg-white px-2 py-1 mt-1 inline-block">{t('notif.birthday.msg')}</p>
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {wishlistItems.length === 0 ? (
                                    <div className="col-span-2 border-4 border-dashed border-black p-12 text-center"><p className="text-xl font-black uppercase text-gray-500">{lang === 'zh' ? '心愿单是空的' : 'Wishlist is empty'}</p></div>
                                ) : wishlistItems.map(item => {
                                    const p = item.products || (item as any); // Handle flat vs nested structure
                                    if (!p || !p.id) return null;
                                    const isOnSale = p.original_price && p.original_price > p.price;
                                    return (
                                        <Link to={`/product/${p.id}`} key={item.id} className="bg-white border-4 border-black shadow-brutal hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg transition-all flex gap-4 p-4 relative overflow-hidden min-h-[140px]">
                                            {isOnSale && (
                                                <div className="absolute top-2 -right-6 bg-brutal-red text-white text-xs font-black px-8 py-1 rotate-45 border-y-2 border-black z-10">
                                                    {t('tag.SALE')}
                                                </div>
                                            )}
                                            <div className="w-24 h-24 border-4 border-black overflow-hidden bg-gray-100 shrink-0">
                                                <img src={p.image} alt={localized(p, 'name', lang)} className="w-full h-full object-contain" />
                                            </div>
                                            <div className="flex-1 min-w-0 pr-6">
                                                <h4 className="font-black uppercase text-sm leading-tight break-words h-[2.5rem] overflow-hidden line-clamp-2 mb-2">{localized(p, 'name', lang)}</h4>
                                                <div className="mt-auto">
                                                    {isOnSale ? (
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="text-2xl font-black text-brutal-red">{formatPrice(p.price)}</span>
                                                            <span className="text-sm font-bold line-through text-gray-500">{formatPrice(p.original_price)}</span>
                                                            {isBirthday && p.is_birthday_promo_enabled && (
                                                                <span className="bg-brutal-pink text-white text-[10px] font-black px-2 py-0.5 border-2 border-black animate-bounce block w-fit">
                                                                    {lang === 'zh' 
                                                                        ? `生日特惠 ${10 - (p.birthday_promo_discount / 10)} 折!` 
                                                                        : `BIRTHDAY ${p.birthday_promo_discount}% OFF!`}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-2xl font-black">{formatPrice(p.price)}</span>
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
                        <p className="font-black uppercase text-sm bg-brutal-yellow text-black border-2 border-black inline-block px-3 py-1 ml-2">{t(`auth.${user.role}Register`) || user.role}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════
   ADMIN DASHBOARD
   ═══════════════════════════════════════════ */
export const AdminDashboard = () => {
    const { isLoggedIn, user, logout, formatPrice } = useApp();
    const { t, lang } = useI18n();
    const navigate = useNavigate();
    const [section, setSection] = useState<'overview' | 'users' | 'stores' | 'products' | 'orders' | 'settings'>('overview');
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
                                        { label: t('admin.revenue'), value: formatPrice(stats.totalRevenue), bg: 'bg-black text-white', icon: 'monetization_on' },
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
                                        <option value="user">{lang === 'zh' ? '买家' : 'User'}</option>
                                        <option value="seller">{lang === 'zh' ? '卖家' : 'Seller'}</option>
                                        <option value="admin">{lang === 'zh' ? '管理员' : 'Admin'}</option>
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
                                                    <td className="p-4"><div className="flex items-center gap-3"><span className="text-2xl">{s.logo || '🏪'}</span><span className="font-black">{localized(s, 'name', lang)}</span></div></td>
                                                    <td className="p-4 text-sm font-bold">{s.profiles?.name || s.profiles?.email || '—'}</td>
                                                    <td className="p-4 text-center font-black">{s.product_count || 0}</td>
                                                    <td className="p-4 text-center font-black">{s.rating}</td>
                                                    <td className="p-4 text-center">
                                                        <button onClick={() => handleVerifyStore(s.id, !s.verified)} className={`px-3 py-1 border-2 border-black text-xs font-black uppercase transition-all ${s.verified ? 'bg-brutal-green' : 'bg-gray-200 hover:bg-brutal-yellow'}`}>{s.verified ? `✓ ${t('store.verified')}` : t('store.unverified')}</button>
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
                                                            <span className="font-bold text-sm">{localized(p, 'name', lang)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm font-bold text-gray-600">{(p as any).categories?.name || '—'}</td>
                                                    <td className="p-4 text-sm font-bold text-gray-600">{(p as any).stores?.name || '—'}</td>
                                                    <td className="p-4 text-right font-black">{formatPrice(p.price)}</td>
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
                                                    <p className="text-sm font-bold text-gray-500">{lang === 'zh' ? '买家' : 'Buyer'}: {o.profiles?.name || o.profiles?.email || t('general.unknown')}</p>
                                                    <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-black">{formatPrice(o.total)}</p>
                                                    <span className={`inline-block px-2 py-0.5 border-2 border-black text-xs font-black uppercase mt-1 ${o.status === 'delivered' ? 'bg-brutal-green' : o.status === 'shipped' ? 'bg-brutal-blue text-white' : o.status === 'cancelled' ? 'bg-brutal-red text-white' : 'bg-brutal-yellow'}`}>{t(`order.${o.status}`)}</span>
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
   SELLER DASHBOARD
   ═══════════════════════════════════════════ */
export const SellerDashboard = () => {
    const { isLoggedIn, user, formatPrice } = useApp();
    const { t, lang } = useI18n();
    const navigate = useNavigate();
    const [tab, setTab] = useState<'dashboard' | 'store' | 'products' | 'orders' | 'analytics' | 'reviews'>('dashboard');
    const [products, setProducts] = useState<Product[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [store, setStore] = useState<any>(null);
    const [analytics, setAnalytics] = useState<{ topProducts: any[], topRatedProducts?: any[], promoTips?: any[] }>({ topProducts: [] });
    const [sellerReviews, setSellerReviews] = useState<any[]>([]);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(true);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [storeName, setStoreName] = useState('');
    const [storeNameZh, setStoreNameZh] = useState('');
    const [storeDesc, setStoreDesc] = useState('');
    const [storeDescZh, setStoreDescZh] = useState('');
    const [storeLogo, setStoreLogo] = useState('');
    const [shopPhoto, setShopPhoto] = useState('');
    const [pf, setPf] = useState({ 
        name: '', name_zh: '', description: '', description_zh: '', 
        price: '', original_price: '', category_id: '', stock: '', 
        image: '', tags: '',
        is_birthday_promo_enabled: false,
        birthday_promo_discount: '10'
    });
    const resetPf = () => setPf({ 
        name: '', name_zh: '', description: '', description_zh: '', 
        price: '', original_price: '', category_id: '', stock: '', 
        image: '', tags: '',
        is_birthday_promo_enabled: false,
        birthday_promo_discount: '10'
    });
    const [translating, setTranslating] = useState<string | null>(null);
    const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [productSearch, setProductSearch] = useState('');
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
    const [productImages, setProductImages] = useState<any[]>([]);

    useEffect(() => { 
        if (isLoggedIn && user) { 
            loadData(); 
        } else if (!isLoggedIn && !loading) {
            navigate('/login');
        }
    }, [isLoggedIn, user]);

    // Refresh analytics or orders when tab changes
    useEffect(() => {
        if (tab === 'analytics' && isLoggedIn) {
            api.getStoreAnalytics()
                .then(data => {
                    if (data && !data.error) {
                        setAnalytics(data);
                    } else {
                        setAnalytics({ topProducts: [], searchTrends: [] });
                    }
                })
                .catch(() => {
                    setAnalytics({ topProducts: [], searchTrends: [] });
                });
        }
        if (tab === 'orders' && isLoggedIn) {
            api.getSellerOrders()
                .then(res => setOrders((res as any).orders || []))
                .catch(() => {});
        }
        if (tab === 'reviews' && isLoggedIn) {
            api.getSellerReviews()
                .then(res => setSellerReviews(res as any[]))
                .catch(() => {});
        }
    }, [tab, isLoggedIn]);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        console.log('SellerHub: Loading data for user', user.id);
        try {
            const [storeRes, prodRes, orderRes, catRes, analyticRes, reviewRes] = await Promise.all([
                api.getStores({ mine: 'true' }).catch(err => { console.error('Failed to fetch stores:', err); return []; }),
                api.getProducts({ limit: '100', include_disabled: 'true' }).catch(() => ({ products: [] })),
                api.getSellerOrders().catch(() => ({ orders: [] })),
                api.getCategories().catch(() => []),
                api.getStoreAnalytics().catch(() => ({ topProducts: [], searchTrends: [] })),
                api.getSellerReviews().catch(() => [])
            ]);

            console.log('SellerHub: Stores received:', storeRes);
            const myStore = (storeRes as any[]).find((s: any) => String(s.seller_id) === String(user.id));
            setStore(myStore || null);
            if (myStore) {
                console.log('SellerHub: Found store', myStore.id);
                setStoreName(myStore.name || '');
                setStoreNameZh(myStore.name_zh || '');
                setStoreDesc(myStore.description || '');
                setStoreDescZh(myStore.description_zh || '');
                setStoreLogo(myStore.logo || '');
                setShopPhoto(myStore.shop_photo || '');
            } else {
                console.warn('SellerHub: No store found for user', user.id);
            }
            const myProds = ((prodRes as any).products || []).filter((p: any) => String(p.seller_id) === String(user.id) || (myStore && p.store_id === myStore.id));
            setAllProducts(myProds);
            setProducts(myProds);
            setOrders((orderRes as any).orders || []);
            setCategories(catRes as any[]);
            setSellerReviews(reviewRes as any[]);
            
            if (analyticRes && !analyticRes.error) {
                setAnalytics(analyticRes);
            } else {
                setAnalytics({ topProducts: [], searchTrends: [] });
            }
        } catch (err: any) {
            console.error('SellerHub: Unexpected error in loadData:', err);
        }
        setLoading(false);
    };

    const handleReply = async (reviewId: string) => {
        if (!replyText.trim()) return;
        try {
            await api.replyToReview(reviewId, replyText);
            setReplyingTo(null);
            setReplyText('');
            await loadData();
        } catch (err: any) { alert(err.message); }
    };

    const handleFlagReview = async (reviewId: string, currentFlag: boolean) => {
        try {
            await api.flagReview(reviewId, !currentFlag);
            await loadData();
        } catch (err: any) { alert(err.message); }
    };

    const handleApproveRefund = async (orderId: string) => {
        if (!confirm(t('order.approveRefundConfirm') || 'Approve this refund?')) return;
        try {
            await api.approveRefund(orderId);
            await loadData();
        } catch (err: any) { alert(err.message); }
    };

    const handleDenyRefund = async (orderId: string, reason: string) => {
        try {
            await api.denyRefund(orderId, reason);
            await loadData();
        } catch (err: any) { alert(err.message); }
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

    const handleProductSearch = (query: string) => {
        setProductSearch(query);
        if (!query.trim()) {
            setProducts(allProducts);
        } else {
            const q = query.toLowerCase();
            setProducts(allProducts.filter(p => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)));
        }
    };

    const handleToggleStore = async (online: boolean) => {
        if (!store) return;
        try {
            const updated = await api.toggleStoreOnline(store.id, online);
            setStore(updated);
        } catch (err: any) {
            alert(err.message);
        }
    };

    const tabs = [
        { key: 'dashboard', icon: 'dashboard', label: t('seller.dashboard') },
        { key: 'analytics', icon: 'monitoring', label: t('seller.analytics') },
        { key: 'store', icon: 'storefront', label: t('seller.myStore') },
        { key: 'products', icon: 'inventory_2', label: t('seller.products') },
        { key: 'orders', icon: 'shopping_bag', label: t('seller.orders') },
        { key: 'reviews', icon: 'rate_review', label: lang === 'zh' ? '评价管理' : 'Reviews' },
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
                                        {!store.is_online && (
                                            <div className="bg-brutal-yellow border-4 border-black p-6 shadow-brutal flex items-center justify-between gap-6 animate-pulse">
                                                <div className="flex items-center gap-4">
                                                    <span className="material-symbols-outlined text-4xl">info</span>
                                                    <div>
                                                        <p className="font-black uppercase text-lg">{lang === 'zh' ? '店铺待上线' : 'Store Pending Online'}</p>
                                                        <p className="font-bold text-sm">{lang === 'zh' ? '您的店铺已根据注册信息创建成功，请前往“我的店铺”开启营业。' : 'Your store was created based on your registration info. Go to "My Store" to go online.'}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => setTab('store')} className="bg-black text-white px-6 py-2 font-black uppercase text-sm border-2 border-black hover:bg-white hover:text-black transition-all">
                                                    {t('seller.myStore')}
                                                </button>
                                            </div>
                                        )}
                                        {/* Shop Photo Banner */}
                                        {shopPhoto && (
                                            <div className="relative w-full h-56 border-4 border-black shadow-brutal overflow-hidden">
                                                <img src={shopPhoto} alt={localized(store, 'name', lang)} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                <div className="absolute bottom-4 left-6 flex items-center gap-4">
                                                    <span className="text-4xl">{store.logo || '🏪'}</span>
                                                    <div>
                                                        <h2 className="text-3xl font-black uppercase text-white tracking-tighter drop-shadow-[2px_2px_0px_#000]">{localized(store, 'name', lang)}</h2>
                                                        {store.verified && (
                                                            <span className="inline-flex items-center gap-1 bg-brutal-green border-2 border-black px-2 py-0.5 text-xs font-black uppercase mt-1">
                                                                <span className="material-symbols-outlined text-sm filled">verified</span>
                                                                {t('store.verified')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                            <div className="bg-brutal-green border-4 border-black shadow-brutal p-6"><p className="font-black uppercase text-sm opacity-70 mb-2">{t('admin.store')}</p><h3 className="text-xl font-black truncate">{localized(store, 'name', lang)}</h3></div>
                                            <div className="bg-brutal-yellow border-4 border-black shadow-brutal p-6"><p className="font-black uppercase text-sm opacity-70 mb-2">{t('store.rating')}</p><h3 className="text-4xl font-black">{store.rating || 0}</h3></div>
                                            <div className="bg-brutal-blue text-white border-4 border-black shadow-brutal p-6"><p className="font-black uppercase text-sm opacity-70 mb-2">{t('seller.products')}</p><h3 className="text-4xl font-black">{allProducts.length}</h3></div>
                                            <div className="bg-brutal-pink text-white border-4 border-black shadow-brutal p-6"><p className="font-black uppercase text-sm opacity-70 mb-2">{t('seller.orders')}</p><h3 className="text-4xl font-black">{orders.length}</h3></div>
                                        </div>
                                        <div className="bg-white border-4 border-black shadow-brutal p-6">
                                            <h2 className="text-xl font-black uppercase mb-4 border-b-4 border-black pb-3">{t('seller.recentOrders')}</h2>
                                            {orders.length === 0 ? <p className="font-bold text-gray-500">{t('seller.noOrders')}</p> : orders.slice(0, 5).map((o: any) => (
                                                <div key={o.id} className="flex justify-between items-center border-b-2 border-black py-3 last:border-0">
                                                    <div><span className="font-black">#{o.id.slice(0, 8)}</span><span className="ml-3 text-sm text-gray-500">{o.profiles?.name || o.profiles?.email}</span></div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-2 py-0.5 border-2 border-black text-xs font-black uppercase ${o.status === 'delivered' ? 'bg-brutal-green' : o.status === 'shipped' ? 'bg-brutal-blue text-white' : o.status === 'cancelled' ? 'bg-brutal-red text-white' : 'bg-brutal-yellow'}`}>{t(`order.${o.status}`)}</span>
                                                        <span className="font-black">{formatPrice(o.total)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* STORE EDIT */}
                        {tab === 'store' && (
                            <div className="space-y-8 max-w-4xl">
                                <h1 className="text-5xl font-black uppercase tracking-tighter">{t('seller.myStore')}</h1>
                                
                                {store && (
                                    <div className={`border-4 border-black p-8 shadow-brutal transition-colors ${store.is_online ? 'bg-brutal-green/10' : 'bg-gray-100'}`}>
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                            <div>
                                                <h2 className="text-3xl font-black uppercase italic mb-2 flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-4xl">
                                                        {store.is_online ? 'visibility' : 'visibility_off'}
                                                    </span>
                                                    {t('seller.storeStatus')}: {store.is_online ? t('seller.online') : t('seller.offline')}
                                                </h2>
                                                <p className="font-bold text-gray-600">
                                                    {store.is_online ? t('seller.onlineDesc') : t('seller.offlineDesc')}
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => handleToggleStore(!store.is_online)}
                                                className={`px-8 py-4 border-4 border-black font-black uppercase text-xl shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all ${store.is_online ? 'bg-brutal-red text-white' : 'bg-brutal-green'}`}
                                            >
                                                {store.is_online ? t('seller.goOffline') : t('seller.goOnline')}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-white border-4 border-black shadow-brutal p-8 space-y-6">
                                    <h3 className="text-xl font-black uppercase border-b-4 border-black pb-2">{store ? t('seller.editStore') : t('seller.createStore')}</h3>
                                    <div className="space-y-3">
                                        <div><label className="block font-black uppercase text-sm mb-2">🇬🇧 {t('seller.storeNameEn')} *</label><input value={storeName} onChange={e => setStoreName(e.target.value)} className="w-full border-4 border-black p-3 font-bold text-lg focus:outline-none focus:border-brutal-blue" placeholder={t('seller.storeName')} /></div>
                                        <div><label className="block font-black uppercase text-sm mb-2">🇨🇳 {t('seller.storeNameZh')}</label><input value={storeNameZh} onChange={e => setStoreNameZh(e.target.value)} className="w-full border-4 border-black p-3 font-bold text-lg focus:outline-none focus:border-brutal-blue" placeholder={t('seller.storeNameZh')} /></div>
                                        <div className="flex gap-2">
                                            <button type="button" disabled={!storeName.trim() || translating === 'storeName'} onClick={async () => { setTranslating('storeName'); try { const r = await api.translate(storeName, 'en', 'zh', 'name'); setStoreNameZh((r as any).translated); } catch { alert(t('seller.translatingError')); } setTranslating(null); }} className="px-3 py-1 border-2 border-black text-xs font-black bg-brutal-yellow hover:bg-brutal-blue hover:text-white transition-colors disabled:opacity-50">{translating === 'storeName' ? t('seller.translating') : 'EN → 中文'}</button>
                                            <button type="button" disabled={!storeNameZh.trim() || translating === 'storeNameRev'} onClick={async () => { setTranslating('storeNameRev'); try { const r = await api.translate(storeNameZh, 'zh', 'en', 'name'); setStoreName((r as any).translated); } catch { alert(t('seller.translatingError')); } setTranslating(null); }} className="px-3 py-1 border-2 border-black text-xs font-black bg-brutal-yellow hover:bg-brutal-blue hover:text-white transition-colors disabled:opacity-50">{translating === 'storeNameRev' ? t('seller.translating') : '中文 → EN'}</button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div><label className="block font-black uppercase text-sm mb-2">🇬🇧 {t('seller.storeDescEn')}</label><textarea value={storeDesc} onChange={e => setStoreDesc(e.target.value)} rows={3} className="w-full border-4 border-black p-3 font-bold focus:outline-none focus:border-brutal-blue resize-none" placeholder={t('seller.storeDesc')} /></div>
                                        <div><label className="block font-black uppercase text-sm mb-2">🇨🇳 {t('seller.storeDescZh')}</label><textarea value={storeDescZh} onChange={e => setStoreDescZh(e.target.value)} rows={3} className="w-full border-4 border-black p-3 font-bold focus:outline-none focus:border-brutal-blue resize-none" placeholder={t('seller.storeDescZh')} /></div>
                                        <div className="flex gap-2">
                                            <button type="button" disabled={!storeDesc.trim() || translating === 'storeDesc'} onClick={async () => { setTranslating('storeDesc'); try { const r = await api.translate(storeDesc, 'en', 'zh', 'description'); setStoreDescZh((r as any).translated); } catch { alert(t('seller.translatingError')); } setTranslating(null); }} className="px-3 py-1 border-2 border-black text-xs font-black bg-brutal-yellow hover:bg-brutal-blue hover:text-white transition-colors disabled:opacity-50">{translating === 'storeDesc' ? t('seller.translating') : 'EN → 中文'}</button>
                                            <button type="button" disabled={!storeDescZh.trim() || translating === 'storeDescRev'} onClick={async () => { setTranslating('storeDescRev'); try { const r = await api.translate(storeDescZh, 'zh', 'en', 'description'); setStoreDesc((r as any).translated); } catch { alert(t('seller.translatingError')); } setTranslating(null); }} className="px-3 py-1 border-2 border-black text-xs font-black bg-brutal-yellow hover:bg-brutal-blue hover:text-white transition-colors disabled:opacity-50">{translating === 'storeDescRev' ? t('seller.translating') : '中文 → EN'}</button>
                                        </div>
                                    </div>
                                    <div><label className="block font-black uppercase text-sm mb-2">{t('seller.storeLogo')}</label><input value={storeLogo} onChange={e => setStoreLogo(e.target.value)} className="w-full border-4 border-black p-3 font-bold focus:outline-none focus:border-brutal-blue" placeholder="🏠" /></div>
                                    
                                    <div className="space-y-3">
                                        <label className="block font-black uppercase text-sm">{lang === 'zh' ? '店铺封面图 URL' : 'Shop Photo URL'}</label>
                                        <input 
                                            value={shopPhoto} 
                                            onChange={e => setShopPhoto(e.target.value)} 
                                            className="w-full border-4 border-black p-3 font-bold focus:outline-none focus:border-brutal-blue" 
                                            placeholder="https://..." 
                                        />
                                        {shopPhoto && (
                                            <div className="w-full h-48 border-4 border-black overflow-hidden bg-gray-100 shadow-brutal-sm">
                                                <img src={shopPhoto} alt="Shop Preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>

                                    {!store ? (
                                        <button onClick={handleCreateStore} className="w-full border-4 border-black bg-brutal-green py-4 font-black uppercase text-lg shadow-brutal hover:-translate-y-1 transition-all">{t('seller.createStore')}</button>
                                    ) : (
                                        <button onClick={async () => { await api.updateStore(store.id, { name: storeName, name_zh: storeNameZh, description: storeDesc, description_zh: storeDescZh, logo: storeLogo, shop_photo: shopPhoto }); await loadData(); }} className="w-full border-4 border-black bg-brutal-blue text-white py-4 font-black uppercase text-lg shadow-brutal hover:-translate-y-1 transition-all">{t('seller.saveChanges')}</button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* PRODUCTS MANAGEMENT */}
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
                                                {pf.image && (
                                                    <div className="mt-3 relative inline-block">
                                                        <div className="w-24 h-24 border-3 border-black overflow-hidden bg-gray-100">
                                                            <img src={pf.image} alt="Preview" className="w-full h-full object-contain" />
                                                        </div>
                                                        <button type="button" onClick={() => setPf({ ...pf, image: '' })} className="absolute -top-2 -right-2 w-6 h-6 bg-brutal-red text-white border-2 border-black flex items-center justify-center font-black text-xs hover:scale-110 transition-transform">✕</button>
                                                    </div>
                                                )}
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
                                                                            if (!confirm(t('admin.deleteConfirm'))) return;
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
                                        {/* Birthday Promotion Settings */}
                                        <div className="border-4 border-black p-4 bg-brutal-pink/10 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-brutal-pink font-black">cake</span>
                                                    <span className="font-black text-xs uppercase">{lang === 'zh' ? '开启生日特惠' : 'Enable Birthday Promo'}</span>
                                                </div>
                                                <button 
                                                    onClick={() => setPf({ ...pf, is_birthday_promo_enabled: !pf.is_birthday_promo_enabled })}
                                                    className={`w-14 h-8 border-4 border-black relative transition-colors ${pf.is_birthday_promo_enabled ? 'bg-brutal-green' : 'bg-gray-300'}`}
                                                >
                                                    <div className={`absolute top-0.5 size-5 bg-white border-2 border-black transition-all ${pf.is_birthday_promo_enabled ? 'left-6' : 'left-0.5'}`} />
                                                </button>
                                            </div>
                                            
                                            {pf.is_birthday_promo_enabled && (
                                                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                                                    <div className="flex-1">
                                                        <label className="block font-black text-[10px] uppercase mb-1">{lang === 'zh' ? '生日折扣力度 (%)' : 'Birthday Discount %'}</label>
                                                        <div className="flex items-center">
                                                            <input 
                                                                type="range" min="5" max="95" step="5"
                                                                value={pf.birthday_promo_discount} 
                                                                onChange={e => setPf({ ...pf, birthday_promo_discount: e.target.value })}
                                                                className="flex-1 h-2 bg-black appearance-none cursor-pointer"
                                                            />
                                                            <span className="ml-4 font-black text-xl w-16 text-right">{pf.birthday_promo_discount}%</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-1/3 bg-white border-2 border-black p-2 text-center">
                                                        <p className="text-[10px] font-black uppercase text-gray-500 mb-1">{lang === 'zh' ? '预估生日价' : 'Est. Birthday Price'}</p>
                                                        <p className="font-black text-brutal-pink">
                                                            {formatPrice((parseFloat(pf.price) || 0) * (1 - (parseInt(pf.birthday_promo_discount) || 0) / 100))}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div><label className="block font-black text-xs uppercase mb-1">{t('seller.tags')}</label><input value={pf.tags} onChange={e => setPf({ ...pf, tags: e.target.value })} className="w-full border-3 border-black p-2 font-bold" placeholder="sports, premium" /></div>
                                        <button onClick={handleSaveProduct} className="w-full border-4 border-black bg-brutal-green py-3 font-black uppercase shadow-brutal hover:-translate-y-1 transition-all">{editingProduct ? t('seller.saveChanges') : t('seller.createProduct')}</button>
                                    </div>
                                )}

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
                                                    <td className="p-4"><div className="flex items-center gap-3"><div className="w-12 h-12 border-2 border-black overflow-hidden bg-gray-100">{p.image && <img src={p.image} alt={localized(p, 'name', lang)} className="w-full h-full object-contain" />}</div><span className="font-black text-sm">{localized(p, 'name', lang)}</span></div></td>
                                                    <td className="p-4 text-sm font-bold text-gray-600">{(p as any).categories?.name || '—'}</td>
                                                    <td className="p-4 text-right font-black">{formatPrice(p.price)}</td>
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

                        {/* SELLER ORDERS */}
                        {tab === 'orders' && (
                            <div className="space-y-6">
                                <h1 className="text-5xl font-black uppercase tracking-tighter">{t('seller.orders')}</h1>
                                <div className="bg-white border-4 border-black shadow-brutal overflow-hidden">
                                    {orders.length === 0 ? (
                                        <div className="p-12 text-center">
                                            <span className="material-symbols-outlined text-6xl text-gray-300 block mb-4">receipt_long</span>
                                            <p className="font-black text-xl uppercase text-gray-500">{t('seller.noOrders')}</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y-4 divide-black">
                                            {orders.map((o: any) => (
                                                <div key={o.id} className="p-6 hover:bg-brutal-yellow/5 transition-colors">
                                                    <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="font-black text-xl uppercase italic">#{o.id.slice(0, 8)}</h3>
                                                                <span className={`px-2 py-0.5 border-2 border-black text-[10px] font-black uppercase ${o.status === 'delivered' ? 'bg-brutal-green' : o.status === 'shipped' ? 'bg-brutal-blue text-white' : o.status === 'cancelled' ? 'bg-brutal-red text-white' : 'bg-brutal-yellow'}`}>
                                                                    {t(`order.${o.status}`)}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm font-bold text-gray-500">
                                                                {new Date(o.created_at).toLocaleString()}
                                                            </p>
                                                            <p className="text-sm font-black uppercase mt-1">
                                                                {lang === 'zh' ? '购买者' : 'Buyer'}: {o.profiles?.name || o.profiles?.email || '—'}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-3xl font-black font-display tracking-tight">{formatPrice(o.total)}</p>
                                                            <button 
                                                                onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}
                                                                className="text-xs font-black uppercase underline hover:text-brutal-blue mt-2 block ml-auto"
                                                            >
                                                                {expandedOrder === o.id ? t('general.hide') : t('general.details')}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Expanded Details & Actions */}
                                                    {expandedOrder === o.id && (
                                                        <div className="mt-6 pt-6 border-t-2 border-dashed border-black/20 space-y-6">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                                <div>
                                                                    <h4 className="font-black uppercase text-xs text-gray-400 mb-3">{t('order.items')}</h4>
                                                                    <div className="space-y-3">
                                                                        {o.order_items?.map((item: any) => (
                                                                            <div key={item.id} className="flex gap-3 items-center">
                                                                                <div className="w-10 h-10 border-2 border-black bg-gray-100 shrink-0">
                                                                                    <img src={item.product_image} alt="" className="w-full h-full object-contain" />
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-sm font-black uppercase truncate">{item.product_name}</p>
                                                                                    <p className="text-xs font-bold text-gray-500">{formatPrice(item.price)} x {item.quantity}</p>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-black uppercase text-xs text-gray-400 mb-3">{t('order.shippingInfo')}</h4>
                                                                    <div className="text-sm font-bold uppercase space-y-1">
                                                                        <p>{o.shipping_name}</p>
                                                                        <p>{o.shipping_street}</p>
                                                                        <p>{o.shipping_city}, {o.shipping_zip}</p>
                                                                        <p>{o.shipping_country}</p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Order Timeline */}
                                                            <div className="border-t-2 border-black/10 pt-6">
                                                                <h4 className="font-black uppercase text-xs text-gray-400 mb-4">{lang === 'zh' ? '订单操作记录' : 'Order Status Records'}</h4>
                                                                <div className="space-y-4">
                                                                    {(!o.status_history || o.status_history.length === 0) ? (
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="size-8 bg-brutal-yellow border-2 border-black flex items-center justify-center shrink-0">
                                                                                <span className="material-symbols-outlined text-sm font-black">add_shopping_cart</span>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[10px] font-black uppercase text-gray-400">{lang === 'zh' ? '创建日期' : 'Created Date'}</p>
                                                                                <p className="text-xs font-bold">{new Date(o.created_at).toLocaleString()}</p>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        o.status_history.map((record: any, idx: number) => (
                                                                            <div key={idx} className="flex items-start gap-4 relative">
                                                                                {idx !== o.status_history.length - 1 && (
                                                                                    <div className="absolute left-4 top-8 bottom-[-16px] w-0.5 bg-black/10" />
                                                                                )}
                                                                                <div className={`size-8 border-2 border-black flex items-center justify-center shrink-0 z-10 ${
                                                                                    record.status === 'delivered' || record.status === 'completed' ? 'bg-brutal-green' : 
                                                                                    record.status === 'cancelled' ? 'bg-brutal-red text-white' : 
                                                                                    record.status === 'shipped' ? 'bg-brutal-blue text-white' : 
                                                                                    record.status === 'hold' ? 'bg-orange-400' : 
                                                                                    record.status === 'ticket_issued' ? 'bg-brutal-pink text-white' : 'bg-brutal-yellow'
                                                                                }`}>
                                                                                    <span className="material-symbols-outlined text-sm font-black">
                                                                                        {record.status === 'delivered' || record.status === 'completed' ? 'task_alt' : 
                                                                                         record.status === 'cancelled' ? 'cancel' : 
                                                                                         record.status === 'shipped' ? 'local_shipping' : 
                                                                                         record.status === 'hold' ? 'pause_circle' : 
                                                                                         record.status === 'ticket_issued' ? 'confirmation_number' : 'history'}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex-1">
                                                                                    <div className="flex justify-between items-start">
                                                                                        <p className="text-xs font-black uppercase tracking-tight">
                                                                                            {t(`order.${record.status}`)}
                                                                                        </p>
                                                                                        <p className="text-[10px] font-bold text-gray-400">
                                                                                            {new Date(record.timestamp).toLocaleString()}
                                                                                        </p>
                                                                                    </div>
                                                                                    <p className="text-[10px] font-bold mt-0.5">
                                                                                        <span className="text-gray-500 uppercase">{lang === 'zh' ? '操作人' : 'By'}:</span>{' '}
                                                                                        <span className="text-black">{record.actor_name}</span>{' '}
                                                                                        <span className="bg-gray-100 px-1 border border-black/10 rounded text-[8px] uppercase mr-2">
                                                                                            {record.actor_role === 'seller' ? (lang === 'zh' ? '卖家' : 'Seller') : 
                                                                                             record.actor_role === 'admin' ? (lang === 'zh' ? '管理员' : 'Admin') : 
                                                                                             (lang === 'zh' ? '买家' : 'Customer')}
                                                                                        </span>
                                                                                        {record.tracking_number && (
                                                                                            <span className="bg-black text-white px-2 py-0.5 text-[8px] font-black uppercase">
                                                                                                {lang === 'zh' ? '单号' : 'Tracking'}: {record.tracking_number}
                                                                                            </span>
                                                                                        )}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="bg-gray-100 p-4 border-2 border-black">
                                                                <h4 className="font-black uppercase text-xs mb-3">{t('seller.updateStatus')}</h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {['pending', 'shipped', 'delivered', 'hold', 'cancelled'].map(s => (
                                                                        <button 
                                                                            key={s} 
                                                                            disabled={o.status === s || (s === 'delivered' && o.status !== 'shipped')}
                                                                            onClick={async () => {
                                                                                try {
                                                                                    let tracking = undefined;
                                                                                    if (s === 'shipped') {
                                                                                        tracking = prompt(lang === 'zh' ? '请输入快递单号:' : 'Please enter tracking number:') || undefined;
                                                                                        if (tracking === undefined) return;
                                                                                    }
                                                                                    await api.updateOrderStatus(o.id, s, tracking);
                                                                                    await loadData();
                                                                                } catch (err: any) {
                                                                                    alert(err.message || 'Failed to update order status');
                                                                                }
                                                                            }}
                                                                            className={`px-4 py-2 border-2 border-black font-black uppercase text-[10px] transition-all ${o.status === s ? 'bg-black text-white shadow-none' : 'bg-white shadow-brutal-sm hover:bg-brutal-yellow active:shadow-none'}`}
                                                                        >
                                                                            {t(`order.${s}`)}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                {o.status === 'refund_requested' && (
                                                                    <div className="mt-4 p-4 bg-brutal-pink/10 border-4 border-black flex flex-col md:flex-row items-center justify-between gap-4">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="material-symbols-outlined text-brutal-pink animate-pulse">warning</span>
                                                                            <p className="text-sm font-black uppercase italic">{t('order.refundRequested')}</p>
                                                                        </div>
                                                                        <div className="flex gap-3 w-full md:w-auto">
                                                                            <button 
                                                                                onClick={async () => {
                                                                                    if (confirm(t('order.approveRefundConfirm') || 'Approve this refund?')) {
                                                                                        await api.approveRefund(o.id);
                                                                                        loadData();
                                                                                    }
                                                                                }}
                                                                                className="flex-1 md:flex-none bg-brutal-green border-4 border-black px-6 py-2 text-xs font-black uppercase shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                                                                            >
                                                                                {t('order.approveRefund') || 'Approve'}
                                                                            </button>
                                                                            <button 
                                                                                onClick={async () => {
                                                                                    const reason = prompt(lang === 'zh' ? '请输入拒绝退款的原因：' : 'Please enter reason for denying refund:');
                                                                                    if (reason) {
                                                                                        await api.denyRefund(o.id, reason);
                                                                                        loadData();
                                                                                    }
                                                                                }}
                                                                                className="flex-1 md:flex-none bg-brutal-red text-white border-4 border-black px-6 py-2 text-xs font-black uppercase shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                                                                            >
                                                                                {lang === 'zh' ? '拒绝退款' : 'Deny Refund'}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* REVIEWS MANAGEMENT */}
                        {tab === 'reviews' && (
                            <div className="space-y-6">
                                <h1 className="text-5xl font-black uppercase tracking-tighter">{lang === 'zh' ? '评价管理' : 'Reviews Management'}</h1>
                                <div className="grid grid-cols-1 gap-6">
                                    {sellerReviews.length === 0 ? (
                                        <div className="border-4 border-black border-dashed p-20 text-center bg-white">
                                            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4 block">rate_review</span>
                                            <p className="text-2xl font-black uppercase text-gray-400">No reviews received yet</p>
                                        </div>
                                    ) : (
                                        sellerReviews.map(review => (
                                            <div key={review.id} className={`border-4 border-black shadow-brutal p-6 bg-white flex flex-col md:flex-row gap-6 transition-opacity ${review.is_risk_flagged ? 'opacity-60 grayscale hover:opacity-100 hover:grayscale-0' : ''}`}>
                                                <div className="w-full md:w-1/4 shrink-0 border-r-4 border-black pr-6">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <img src={review.products?.image} alt="" className="size-12 object-cover border-2 border-black" />
                                                        <div className="min-w-0">
                                                            <p className="font-black text-xs truncate uppercase">{lang === 'zh' ? review.products?.name_zh || review.products?.name : review.products?.name}</p>
                                                            <div className="flex gap-0.5 mt-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <span key={i} className={`material-symbols-outlined text-xs ${i < review.rating ? 'filled text-brutal-yellow' : 'text-gray-200'}`}>star</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-[10px] font-black uppercase text-gray-400 space-y-1">
                                                        <p>Customer: {review.profiles?.name || 'Anonymous'}</p>
                                                        <p>Date: {new Date(review.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>

                                                <div className="flex-1 space-y-4">
                                                    <div>
                                                        {review.is_risk_flagged && (
                                                            <span className="bg-brutal-red text-white text-[10px] font-black px-2 py-0.5 border-2 border-black uppercase mb-2 inline-block italic animate-bounce">⚠️ RISK FLAGGED</span>
                                                        )}
                                                        <h4 className="font-black text-xl mb-1">{review.title || 'No Title'}</h4>
                                                        <p className="font-bold text-gray-700">{review.body || 'No content'}</p>
                                                    </div>

                                                    {review.seller_reply ? (
                                                        <div className="bg-brutal-blue/10 border-l-4 border-brutal-blue p-3 mt-4 relative">
                                                            <p className="text-[10px] font-black uppercase text-brutal-blue mb-1">Your Reply</p>
                                                            <p className="font-bold text-sm italic">"{review.seller_reply}"</p>
                                                            <button 
                                                                onClick={() => { setReplyingTo(review.id); setReplyText(review.seller_reply); }} 
                                                                className="absolute top-2 right-2 material-symbols-outlined text-sm font-black hover:text-brutal-blue transition-colors"
                                                            >
                                                                edit
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        replyingTo === review.id ? (
                                                            <div className="space-y-3 mt-4 animate-in fade-in slide-in-from-top-2">
                                                                <textarea 
                                                                    autoFocus
                                                                    value={replyText} 
                                                                    onChange={e => setReplyText(e.target.value)}
                                                                    placeholder="Write your professional reply..."
                                                                    className="w-full border-4 border-black p-3 font-bold text-sm focus:outline-none focus:border-brutal-blue h-24"
                                                                />
                                                                <div className="flex gap-3">
                                                                    <button onClick={() => handleReply(review.id)} className="bg-brutal-blue text-white border-2 border-black px-4 py-2 font-black uppercase text-xs hover:shadow-brutal transition-all">Post Reply</button>
                                                                    <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="bg-white border-2 border-black px-4 py-2 font-black uppercase text-xs">Cancel</button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button onClick={() => setReplyingTo(review.id)} className="mt-4 border-2 border-black bg-white px-4 py-2 font-black uppercase text-xs shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all flex items-center gap-2">
                                                                <span className="material-symbols-outlined text-sm">reply</span>
                                                                Reply to Review
                                                            </button>
                                                        )
                                                    )}
                                                </div>

                                                <div className="w-full md:w-1/6 flex flex-col gap-3">
                                                    <button 
                                                        onClick={() => handleFlagReview(review.id, !!review.is_risk_flagged)}
                                                        className={`w-full py-3 border-2 border-black font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all ${review.is_risk_flagged ? 'bg-black text-white' : 'bg-white hover:bg-brutal-red hover:text-white'}`}
                                                    >
                                                        <span className="material-symbols-outlined text-sm">{review.is_risk_flagged ? 'check' : 'report'}</span>
                                                        {review.is_risk_flagged ? 'Unflag Risk' : 'Flag as Risk'}
                                                    </button>
                                                    <p className="text-[9px] font-bold text-gray-400 italic text-center leading-tight">Flagged reviews are collapsed for customers by default.</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ANALYTICS */}
                        {tab === 'analytics' && (
                            <div className="space-y-8 pb-12">
                                <div className="bg-brutal-pink border-4 border-black p-8 shadow-brutal flex items-center gap-8 mb-12">
                                    <div className="size-24 border-8 border-black bg-white flex items-center justify-center rotate-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                        <span className="material-symbols-outlined text-6xl font-black">monitoring</span>
                                    </div>
                                    <div>
                                        <h1 className="text-6xl font-black uppercase tracking-tighter italic drop-shadow-[4px_4px_0px_rgba(255,255,255,1)]">Analytics</h1>
                                        <p className="font-bold text-xl uppercase bg-black text-white px-3 py-1 mt-2 inline-block">
                                            {lang === 'zh' ? '洞察您的店铺表现' : 'Insights into your store performance'}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    {/* Top Products */}
                                    <div className="bg-white border-4 border-black shadow-brutal p-8 flex flex-col h-full">
                                        <div className="flex items-center gap-4 mb-8 border-b-4 border-black pb-4">
                                            <span className="material-symbols-outlined text-4xl bg-brutal-blue text-white p-2 border-2 border-black">visibility</span>
                                            <h2 className="text-3xl font-black uppercase italic tracking-tighter">{lang === 'zh' ? '最受欢迎商品' : 'Top Products'}</h2>
                                        </div>
                                        
                                        <div className="space-y-6 flex-1">
                                            {(!analytics || !analytics.topProducts || analytics.topProducts.length === 0) ? (
                                                <div className="h-full flex flex-col items-center justify-center py-20 text-gray-400 border-4 border-dashed border-gray-100">
                                                    <span className="material-symbols-outlined text-6xl mb-4">analytics</span>
                                                    <p className="font-black uppercase">{lang === 'zh' ? '暂无浏览数据' : 'No view data yet'}</p>
                                                </div>
                                            ) : (
                                                analytics.topProducts.map((p, idx) => {
                                                    if (!p) return null;
                                                    return (
                                                        <div key={p.id || idx} className="group flex items-center gap-6 p-4 border-4 border-black bg-[#f9f9f9] hover:bg-brutal-yellow transition-all hover:-translate-y-1 relative">
                                                            <div className="absolute -top-3 -left-3 size-10 bg-black text-white flex items-center justify-center font-black italic border-2 border-white rotate-12 group-hover:rotate-0 transition-transform z-10">
                                                                {idx + 1}
                                                            </div>
                                                            <div className="w-20 h-20 border-4 border-black overflow-hidden bg-white shrink-0">
                                                                {p.image ? (
                                                                    <img src={p.image} alt="" className="w-full h-full object-contain" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                                                        <span className="material-symbols-outlined text-gray-300">image</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-black uppercase text-lg truncate mb-1">{p ? localized(p, 'name', lang) : '---'}</h3>
                                                                <div className="flex items-center gap-4">
                                                                    <span className="text-2xl font-black tracking-tighter">{formatPrice(p.price || 0)}</span>
                                                                    <span className="text-xs font-bold bg-black text-white px-2 py-0.5 rounded uppercase">
                                                                        {p.views || 0} {lang === 'zh' ? '次访问' : 'Views'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {p.id && (
                                                                <Link to={`/product/${p.id}`} className="size-12 border-4 border-black bg-white flex items-center justify-center hover:bg-brutal-blue hover:text-white transition-colors">
                                                                    <span className="material-symbols-outlined font-black">open_in_new</span>
                                                                </Link>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    {/* High Rated Products */}
                                    <div className="bg-white border-4 border-black shadow-brutal p-8 flex flex-col h-full">
                                        <div className="flex items-center gap-4 mb-8 border-b-4 border-black pb-4">
                                            <span className="material-symbols-outlined text-4xl bg-brutal-pink text-white p-2 border-2 border-black">star</span>
                                            <h2 className="text-3xl font-black uppercase italic tracking-tighter">{lang === 'zh' ? '高分商品榜' : 'Top Rated Products'}</h2>
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            {(!analytics || !analytics.topRatedProducts || analytics.topRatedProducts.length === 0) ? (
                                                <div className="h-full flex flex-col items-center justify-center py-20 text-gray-400 border-4 border-dashed border-gray-100">
                                                    <span className="material-symbols-outlined text-6xl mb-4">grade</span>
                                                    <p className="font-black uppercase">{lang === 'zh' ? '暂无评分' : 'No ratings yet'}</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {analytics.topRatedProducts.map((p_item: any) => (
                                                        <div key={p_item.id} className="flex items-center gap-4 p-4 border-4 border-black bg-white shadow-brutal-sm">
                                                            <img src={p_item.image} alt={p_item.name} className="size-16 object-cover border-2 border-black" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-black truncate uppercase tracking-tighter">{lang === 'zh' ? p_item.name_zh || p_item.name : p_item.name}</p>
                                                                <div className="flex items-center gap-1 text-brutal-pink">
                                                                    <span className="material-symbols-outlined text-sm font-black">star</span>
                                                                    <span className="font-black text-xl">{p_item.rating?.toFixed(1)}</span>
                                                                    <span className="text-[10px] text-black/40 font-black">({p_item.rating_count} reviews)</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Smart Promo Tips */}
                                            <div className="mt-12 bg-brutal-yellow p-6 border-4 border-black shadow-brutal relative">
                                                <div className="absolute -top-4 -right-4 size-12 bg-white border-4 border-black flex items-center justify-center rotate-12">
                                                    <span className="material-symbols-outlined font-black text-brutal-pink">auto_awesome</span>
                                                </div>
                                                <h4 className="font-black uppercase mb-4 italic underline decoration-4 flex items-center gap-2">
                                                    <span className="material-symbols-outlined">lightbulb</span>
                                                    {lang === 'zh' ? '促销决策建议' : 'Promo Decision Tips'}
                                                </h4>
                                                <div className="space-y-4">
                                                    {analytics.promoTips && analytics.promoTips.length > 0 ? (
                                                        analytics.promoTips.map((tip: any, idx: number) => (
                                                            <div key={idx} className="p-3 border-2 border-black bg-white/50 text-sm">
                                                                <p className="font-black uppercase text-xs mb-1">PROMO TARGET: {lang === 'zh' ? tip.name_zh || tip.name : tip.name}</p>
                                                                <p className="font-bold">{tip.reason}</p>
                                                                <button 
                                                                   onClick={() => {
                                                                       const p = products.find(prod => String(prod.id) === String(tip.product_id));
                                                                       if (p) {
                                                                           setEditingProduct(p);
                                                                           setActiveTab('products');
                                                                       }
                                                                   }}
                                                                   className="mt-2 text-[10px] font-black uppercase underline hover:text-brutal-pink"
                                                                >
                                                                    Configure Now →
                                                                </button>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="font-bold text-sm italic opacity-60">
                                                            {lang === 'zh' ? '您的店铺目前运行良好，暂无紧急促销建议。' : 'Your store is performing optimally! No urgent promo suggestions.'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};