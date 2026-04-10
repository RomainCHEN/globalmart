import React, { useState, useEffect } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useApp } from './context';
import { useI18n } from './i18n';
import { api } from './api';

export const MainLayout = () => {
    const { user, isLoggedIn, logout, cart, seniorMode, setSeniorMode, formatPrice, wishlistOnSaleCount } = useApp();
    const { t, lang, setLang } = useI18n();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifDrawer, setShowNotifDrawer] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    useEffect(() => {
        if (isLoggedIn) {
            fetchNotifications();
            // Refresh notifications every 5 minutes
            const timer = setInterval(fetchNotifications, 5 * 60 * 1000);
            return () => clearInterval(timer);
        } else {
            setNotifications([]);
        }
    }, [isLoggedIn]);

    const fetchNotifications = async () => {
        try {
            const serverNotifs = await api.getNotifications().catch(() => []);
            
            // Client-side generated notifications (Birthday & Wishlist Sales)
            const clientNotifs: any[] = [];
            const today = new Date();
            const m = today.getMonth() + 1;
            const d = today.getDate();

            // Check Birthday
            const me = await api.getMe().catch(() => null);
            if (me && me.birthday_month === m && me.birthday_day === d) {
                clientNotifs.push({
                    id: 'birthday',
                    type: 'birthday_reminder',
                    title: t('notif.birthday.title'),
                    message: t('notif.birthday.msg'),
                    link: '/dashboard?tab=wishlist',
                    created_at: today.toISOString(),
                    is_read: false
                });
            }

            // Check Wishlist Sales
            const wishlist = await api.getWishlist(m, d).catch(() => ({ data: [] }));
            const saleItems = (wishlist.data || []).filter((item: any) => 
                item.products?.original_price && item.products?.original_price > item.products?.price
            );
            if (saleItems.length > 0) {
                clientNotifs.push({
                    id: 'wishlist-sale',
                    type: 'wishlist_sale',
                    title: t('notif.priceDrop.title'),
                    message: t('notif.priceDrop.msg'),
                    link: '/dashboard?tab=wishlist',
                    created_at: today.toISOString(),
                    is_read: false
                });
            }

            setNotifications([...clientNotifs, ...serverNotifs].sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ));
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const markAllRead = async () => {
        try {
            const serverIds = notifications.filter(n => !n.is_read && n.id !== 'birthday' && n.id !== 'wishlist-sale').map(n => n.id);
            await Promise.all(serverIds.map(id => api.markNotificationAsRead(id)));
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch {}
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchOpen(false);
        }
    };

    return (
        <div className={`min-h-screen flex flex-col bg-[#f3f3f3] ${seniorMode ? 'senior-mode-active' : ''}`}>
            {/* Notification Drawer */}
            <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${showNotifDrawer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNotifDrawer(false)} />
                <aside className={`absolute top-0 right-0 h-full w-full max-w-md bg-white border-l-8 border-black shadow-[-10px_0px_0px_0px_rgba(0,0,0,1)] transition-transform duration-500 flex flex-col ${showNotifDrawer ? 'translate-x-0' : 'translate-x-full'}`}>
                    <header className="p-6 border-b-8 border-black bg-brutal-pink flex justify-between items-center">
                        <h2 className="text-4xl font-display font-black uppercase italic tracking-tighter">{t('notif.title')}</h2>
                        <button onClick={() => setShowNotifDrawer(false)} className="size-12 border-4 border-black bg-white flex items-center justify-center font-black text-2xl hover:bg-brutal-red transition-colors">✕</button>
                    </header>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 opacity-30 grayscale italic font-bold">
                                <span className="material-symbols-outlined text-8xl">notifications_off</span>
                                <p className="text-xl mt-4">{t('notif.empty')}</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} className={`p-4 border-4 border-black shadow-brutal transition-all relative group ${n.is_read ? 'bg-white' : 'bg-brutal-yellow'}`}>
                                    <div className="flex gap-4">
                                        <div className={`size-12 border-4 border-black flex items-center justify-center shrink-0 ${
                                            n.type === 'birthday_reminder' ? 'bg-brutal-pink' : 
                                            n.type === 'wishlist_sale' ? 'bg-brutal-red' : 
                                            n.type === 'order_shipped' ? 'bg-brutal-blue' : 'bg-black'
                                        }`}>
                                            <span className="material-symbols-outlined text-white font-black">
                                                {n.type === 'birthday_reminder' ? 'cake' : 
                                                 n.type === 'wishlist_sale' ? 'sell' : 
                                                 n.type === 'order_shipped' ? 'local_shipping' : 'info'}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-black uppercase text-lg leading-tight mb-1">{n.title}</h3>
                                            <p className="font-bold text-sm leading-snug">{n.message}</p>
                                            <div className="mt-3 flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase opacity-40">{new Date(n.created_at).toLocaleDateString()}</span>
                                                {n.link && (
                                                    <Link 
                                                        to={n.link} 
                                                        onClick={() => setShowNotifDrawer(false)}
                                                        className="text-xs font-black uppercase underline hover:text-brutal-pink"
                                                    >
                                                        {n.type === 'wishlist_sale' || n.type === 'birthday_reminder' ? t('notif.viewWishlist') : t('notif.viewOrder')} →
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {!n.is_read && <div className="absolute top-2 right-2 size-3 bg-brutal-red border-2 border-black rounded-full shadow-[2px_2px_0px_#000]" />}
                                </div>
                            ))
                        )}
                    </div>

                    <footer className="p-4 border-t-8 border-black grid grid-cols-2 gap-4 bg-white">
                        <button onClick={markAllRead} className="border-4 border-black py-3 font-black uppercase text-sm bg-brutal-green shadow-brutal hover:-translate-y-1 transition-all">{t('notif.markRead')}</button>
                        <button onClick={() => setNotifications([])} className="border-4 border-black py-3 font-black uppercase text-sm bg-gray-200 shadow-brutal hover:-translate-y-1 transition-all">{t('notif.clear')}</button>
                    </footer>
                </aside>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                html.senior-mode {
                    font-size: 1.25rem !important;
                }
                .senior-mode-active .font-display {
                    letter-spacing: 0 !important;
                }
                .senior-mode-active h1, .senior-mode-active h2, .senior-mode-active h3, .senior-mode-active h4 {
                    line-height: 1.2 !important;
                }
                .senior-mode-active p, .senior-mode-active span, .senior-mode-active button, .senior-mode-active input, .senior-mode-active label {
                    line-height: 1.6 !important;
                }
                .senior-mode-active .shadow-brutal {
                    box-shadow: 8px 8px 0px 0px rgba(0,0,0,1) !important;
                }
                .senior-mode-active .shadow-brutal-lg {
                    box-shadow: 12px 12px 0px 0px rgba(0,0,0,1) !important;
                }
                .senior-mode-active nav a {
                    padding: 1rem 1.5rem !important;
                }
                .senior-mode-active .material-symbols-outlined {
                    font-size: 1.5em !important;
                    vertical-align: middle;
                }
            `}} />
            {/* Top bar */}
            <div className="bg-black text-white py-2 px-4 flex justify-between items-center text-xs font-bold uppercase tracking-wider border-b-4 border-black">
                <div className="flex gap-4">
                    <button onClick={() => setLang(lang === 'en' ? 'zh' : 'en')} className="flex items-center gap-1 hover:text-brutal-yellow transition-colors px-2 py-1 border border-white/30 hover:border-white" aria-label="Toggle language">
                        <span className="material-symbols-outlined text-sm">language</span>
                        {lang === 'en' ? '中文简体' : 'ENGLISH'}
                    </button>
                </div>
                <span className="hidden sm:inline">Free Shipping Worldwide • 30 Day Returns</span>
            </div>

            {/* Main Header */}
            <header className="sticky top-0 z-50 bg-white border-b-4 border-black" role="banner">
                <div className="max-w-[1600px] mx-auto px-4 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-3 group" aria-label="GlobalMart Home">
                            <div className="w-12 h-12 bg-brutal-blue border-4 border-black flex items-center justify-center group-hover:rotate-12 transition-transform shadow-brutal">
                                <span className="material-symbols-outlined text-white text-2xl font-black">public</span>
                            </div>
                            <span className="text-3xl font-display font-black uppercase tracking-tighter hidden sm:inline">GlobalMart</span>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden lg:flex items-center gap-2" aria-label="Main navigation">
                            <NavLink to="/" className={({ isActive }) => `px-4 py-2 font-black uppercase text-sm border-2 transition-all ${isActive ? 'bg-black text-white border-black' : 'border-transparent hover:border-black'}`}>
                                {t('footer.home')}
                            </NavLink>
                            <NavLink to="/store" className={({ isActive }) => `px-4 py-2 font-black uppercase text-sm border-2 transition-all ${isActive ? 'bg-black text-white border-black' : 'border-transparent hover:border-black'}`}>
                                {t('nav.store')}
                            </NavLink>
                            {user?.role === 'seller' && (
                                <NavLink to="/seller" className={({ isActive }) => `px-4 py-2 font-black uppercase text-sm border-2 transition-all ${isActive ? 'bg-brutal-green border-black' : 'border-transparent hover:border-black'}`}>
                                    {t('nav.seller')}
                                </NavLink>
                            )}
                            {user?.role === 'admin' && (
                                <NavLink to="/admin" className={({ isActive }) => `px-4 py-2 font-black uppercase text-sm border-2 transition-all ${isActive ? 'bg-brutal-pink text-white border-black' : 'border-transparent hover:border-black'}`}>
                                    {t('nav.admin')}
                                </NavLink>
                            )}
                        </nav>

                        {/* Right Actions */}
                        <div className="flex items-center gap-1 sm:gap-3">
                            <button 
                                onClick={() => {
                                    if (searchOpen && searchQuery.trim()) {
                                        // If open and has query, clicking again performs search
                                        const event = new Event('submit', { cancelable: true }) as any;
                                        handleSearch(event);
                                    } else {
                                        setSearchOpen(!searchOpen);
                                        if (searchOpen) setSearchQuery(''); // Clear on close
                                    }
                                }} 
                                className="p-2 border-2 border-transparent hover:border-black transition-all group" 
                                aria-label="Search"
                            >
                                <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">search</span>
                            </button>

                            {/* Prominent Senior Mode Toggle */}
                            <button 
                                onClick={() => setSeniorMode(!seniorMode)} 
                                className={`flex items-center gap-2 px-3 py-1.5 border-4 border-black shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all ${seniorMode ? 'bg-brutal-pink text-white animate-pulse' : 'bg-brutal-yellow'}`}
                                aria-label="Toggle Senior Mode"
                            >
                                <span className={`material-symbols-outlined text-2xl font-black ${seniorMode ? 'filled' : ''}`}>
                                    {seniorMode ? 'settings_accessibility' : 'visibility'}
                                </span>
                                <span className="font-black text-[10px] md:text-xs uppercase tracking-tighter leading-tight text-left hidden sm:block">
                                    {seniorMode ? (lang === 'en' ? 'STANDARD\nMODE' : '标准模式') : (lang === 'en' ? 'SENIOR\nMODE' : '长辈模式')}
                                </span>
                            </button>

                            {isLoggedIn ? (
                                <>
                                    <Link to="/dashboard" className="p-2 border-2 border-transparent hover:border-black transition-all" aria-label={t('nav.profile')} title={t('nav.profile')}>
                                        <span className="material-symbols-outlined">account_circle</span>
                                    </Link>
                                    <button onClick={logout} className="p-2 border-2 border-transparent hover:border-black transition-all hidden lg:block" aria-label={t('nav.logout')} title={t('nav.logout')}>
                                        <span className="material-symbols-outlined">logout</span>
                                    </button>
                                </>
                            ) : (
                                <Link to="/login" className="hidden lg:flex items-center gap-2 border-4 border-black bg-brutal-yellow px-4 py-2 font-black uppercase text-sm shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all">
                                    <span className="material-symbols-outlined text-lg">person</span>
                                    {t('nav.login')}
                                </Link>
                            )}

                            {isLoggedIn && (
                                <button 
                                    onClick={() => setShowNotifDrawer(true)}
                                    className="relative p-2 border-2 border-transparent hover:border-black transition-all group" 
                                    aria-label={t('notif.title')}
                                >
                                    <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">notifications</span>
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 bg-brutal-red w-4 h-4 rounded-full border-2 border-black flex items-center justify-center text-[8px] font-black text-white shadow-[1px_1px_0px_#000]">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                            )}

                            <Link to="/cart" className="relative p-2 border-2 border-transparent hover:border-black transition-all group" aria-label={`${t('nav.cart')}: ${cartCount} items`}>
                                <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">shopping_cart</span>
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-brutal-red text-white text-xs font-black w-6 h-6 flex items-center justify-center border-2 border-black">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>

                            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 border-2 border-transparent hover:border-black" aria-label="Menu">
                                <span className="material-symbols-outlined text-2xl">{mobileMenuOpen ? 'close' : 'menu'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    {searchOpen && (
                        <div className="border-t-4 border-black py-4">
                            <form onSubmit={handleSearch} className="flex">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="flex-1 p-4 border-4 border-black focus:ring-0 font-bold text-lg"
                                    placeholder={t('nav.search')}
                                    autoFocus
                                    aria-label={t('nav.search')}
                                />
                                <button type="submit" className="bg-brutal-blue text-white border-4 border-l-0 border-black px-6 font-black uppercase">
                                    <span className="material-symbols-outlined">search</span>
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <nav className="lg:hidden border-t-4 border-black bg-white px-4 py-6 space-y-3" aria-label="Mobile navigation">
                        <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block border-4 border-black p-4 font-black uppercase shadow-brutal bg-brutal-yellow">{t('footer.home')}</Link>
                        <Link to="/store" onClick={() => setMobileMenuOpen(false)} className="block border-4 border-black p-4 font-black uppercase shadow-brutal">{t('nav.store')}</Link>
                        {!isLoggedIn && (
                            <>
                                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block border-4 border-black p-4 font-black uppercase shadow-brutal bg-brutal-blue text-white">{t('nav.login')}</Link>
                                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block border-4 border-black p-4 font-black uppercase shadow-brutal bg-brutal-pink text-white">{t('auth.register')}</Link>
                            </>
                        )}
                        {isLoggedIn && (
                            <>
                                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block border-4 border-black p-4 font-black uppercase shadow-brutal bg-brutal-green">{t('nav.profile')}</Link>
                                <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="w-full text-left border-4 border-black p-4 font-black uppercase shadow-brutal bg-brutal-red text-white">{t('nav.logout')}</button>
                            </>
                        )}
                    </nav>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-grow">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-black text-white border-t-8 border-brutal-yellow" role="contentinfo">
                <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
                        <div className="md:col-span-5">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-16 h-16 bg-brutal-blue border-4 border-white flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-3xl font-black">public</span>
                                </div>
                                <span className="text-4xl font-display font-black uppercase tracking-tighter">GlobalMart</span>
                            </div>
                            <p className="text-lg font-bold text-gray-400 max-w-md mb-8">{t('footer.tagline')}</p>
                        </div>
                        <div className="md:col-span-3">
                            <h4 className="font-black uppercase text-sm text-brutal-yellow mb-6 tracking-widest">{t('footer.navigation')}</h4>
                            <ul className="space-y-3">
                                <li><Link to="/" className="font-bold hover:text-brutal-yellow transition-colors">{t('footer.home')}</Link></li>
                                <li><Link to="/store" className="font-bold hover:text-brutal-yellow transition-colors">{t('footer.proStore')}</Link></li>
                                <li><Link to="/dashboard" className="font-bold hover:text-brutal-yellow transition-colors">{t('footer.myAccount')}</Link></li>
                            </ul>
                        </div>
                        <div className="md:col-span-4">
                            <h4 className="font-black uppercase text-sm text-brutal-yellow mb-6 tracking-widest">{t('footer.connect')}</h4>
                            <div className="flex gap-4">
                                <a href="#" className="w-12 h-12 border-2 border-white flex items-center justify-center hover:bg-brutal-blue transition-colors" aria-label="Twitter">
                                    <span className="material-symbols-outlined">tag</span>
                                </a>
                                <a href="#" className="w-12 h-12 border-2 border-white flex items-center justify-center hover:bg-brutal-pink transition-colors" aria-label="Email">
                                    <span className="material-symbols-outlined">mail</span>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="border-t-2 border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-bold text-gray-500">
                        <p>{t('footer.copyright')}</p>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-white transition-colors">{t('footer.privacy')}</a>
                            <a href="#" className="hover:text-white transition-colors">{t('footer.terms')}</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};