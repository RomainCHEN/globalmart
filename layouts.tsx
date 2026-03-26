import React, { useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useApp } from './context';
import { useI18n } from './i18n';

export const MainLayout = () => {
    const { user, isLoggedIn, logout, cart, seniorMode, setSeniorMode, formatPrice, wishlistOnSaleCount } = useApp();
    const { t, lang, setLang } = useI18n();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Log search query
            if (isLoggedIn) {
                api.logSearch(searchQuery.trim()).catch(() => {});
            }
            navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
            setSearchOpen(false);
        }
    };

    return (
        <div className={`min-h-screen flex flex-col bg-[#f3f3f3] ${seniorMode ? 'senior-mode-active' : ''}`}>
            <style dangerouslySetInnerHTML={{ __html: `
                .senior-mode-active {
                    font-size: 1.25rem !important;
                }
                .senior-mode-active .font-display {
                    letter-spacing: 0 !important;
                }
                .senior-mode-active h1, .senior-mode-active h2, .senior-mode-active h3 {
                    font-size: 2rem !important;
                    line-height: 1.2 !important;
                }
                .senior-mode-active p, .senior-mode-active span, .senior-mode-active button, .senior-mode-active input, .senior-mode-active label {
                    font-size: 1.4rem !important;
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
                    font-size: 2rem !important;
                }
            `}} />
            {/* Top bar */}
            <div className="bg-black text-white py-2 px-4 flex justify-between items-center text-xs font-bold uppercase tracking-wider border-b-4 border-black">
                <div className="flex gap-4">
                    <button onClick={() => setLang(lang === 'en' ? 'zh' : 'en')} className="flex items-center gap-1 hover:text-brutal-yellow transition-colors px-2 py-1 border border-white/30 hover:border-white" aria-label="Toggle language">
                        <span className="material-symbols-outlined text-sm">language</span>
                        {lang === 'en' ? '中文简体' : 'ENGLISH'}
                    </button>
                    <button onClick={() => setSeniorMode(!seniorMode)} className={`flex items-center gap-1 transition-colors px-2 py-1 border border-white/30 hover:border-white ${seniorMode ? 'bg-white text-black' : ''}`} aria-label="Toggle Senior Mode">
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        {seniorMode ? (lang === 'en' ? 'STANDARD MODE' : '标准模式') : (lang === 'en' ? 'SENIOR MODE' : '长辈模式')}
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
                        <div className="flex items-center gap-3">
                            <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 border-2 border-transparent hover:border-black transition-all" aria-label="Search">
                                <span className="material-symbols-outlined">search</span>
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
                                <Link to="/dashboard?tab=wishlist" className="relative p-2 border-2 border-transparent hover:border-black transition-all group" aria-label="Wishlist notifications">
                                    <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">notifications</span>
                                    {wishlistOnSaleCount > 0 && (
                                        <span className="absolute top-1 right-1 bg-brutal-red w-3 h-3 rounded-full border-2 border-black animate-ping"></span>
                                    )}
                                    {wishlistOnSaleCount > 0 && (
                                        <span className="absolute top-1 right-1 bg-brutal-red w-3 h-3 rounded-full border-2 border-black"></span>
                                    )}
                                </Link>
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