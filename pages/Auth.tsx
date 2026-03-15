import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context';
import { useI18n } from '../i18n';

export const LoginPage = () => {
    const { login } = useApp();
    const { t } = useI18n();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="bg-brutal-blue text-white p-6 border-4 border-black shadow-brutal-lg mb-8">
                    <h1 className="text-5xl font-black uppercase tracking-tighter font-display" aria-label={t('auth.login')}>
                        {t('auth.login')}
                    </h1>
                    <p className="text-lg font-bold mt-2 opacity-80">{t('auth.loginDesc')}</p>
                </div>
                <form onSubmit={handleSubmit} className="bg-white border-4 border-black p-8 shadow-brutal space-y-6" role="form" aria-label="Login form">
                    {error && (
                        <div className="bg-brutal-red text-white p-4 border-4 border-black font-bold" role="alert">
                            {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <label htmlFor="login-email" className="text-sm font-black uppercase">{t('auth.email')}</label>
                        <input
                            id="login-email"
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full p-4 border-4 border-black focus:ring-0 focus:border-brutal-blue text-lg font-bold"
                            placeholder={t('auth.emailPlaceholder')}
                            aria-required="true"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="login-password" className="text-sm font-black uppercase">{t('auth.password')}</label>
                        <input
                            id="login-password"
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full p-4 border-4 border-black focus:ring-0 focus:border-brutal-blue text-lg font-bold"
                            placeholder="••••••••"
                            aria-required="true"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brutal-yellow border-4 border-black py-4 text-xl font-black uppercase shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
                    >
                        {loading ? t('general.loading') : t('auth.login')}
                    </button>
                    <p className="text-center font-bold">
                        {t('auth.noAccount')}{' '}
                        <Link to="/register" className="text-brutal-blue underline font-black">{t('auth.register')}</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export const RegisterPage = () => {
    const { register } = useApp();
    const { t } = useI18n();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('user');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState({ street: '', city: '', zip: '', country: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const shipping = { name, ...address };
            await register(email, password, name, role, shipping);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-lg">
                <div className="bg-brutal-pink text-white p-6 border-4 border-black shadow-brutal-lg mb-8">
                    <h1 className="text-5xl font-black uppercase tracking-tighter font-display" aria-label={t('auth.register')}>
                        {t('auth.register')}
                    </h1>
                    <p className="text-lg font-bold mt-2 opacity-80">{t('auth.registerDesc')}</p>
                </div>
                <form onSubmit={handleSubmit} className="bg-white border-4 border-black p-8 shadow-brutal space-y-6" role="form" aria-label="Registration form">
                    {error && (
                        <div className="bg-brutal-red text-white p-4 border-4 border-black font-bold" role="alert">
                            {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <label htmlFor="reg-name" className="text-sm font-black uppercase">{t('auth.name')}</label>
                        <input
                            id="reg-name"
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full p-4 border-4 border-black focus:ring-0 focus:border-brutal-pink text-lg font-bold"
                            placeholder={t('auth.namePlaceholder')}
                            aria-required="true"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="reg-email" className="text-sm font-black uppercase">{t('auth.email')}</label>
                        <input
                            id="reg-email"
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full p-4 border-4 border-black focus:ring-0 focus:border-brutal-pink text-lg font-bold"
                            placeholder={t('auth.emailPlaceholder')}
                            aria-required="true"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="reg-password" className="text-sm font-black uppercase">{t('auth.password')}</label>
                        <input
                            id="reg-password"
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full p-4 border-4 border-black focus:ring-0 focus:border-brutal-pink text-lg font-bold"
                            placeholder="Min 6 characters"
                            aria-required="true"
                        />
                    </div>

                    {/* Account Type - moved above shipping so we can conditionally show address */}
                    <div className="space-y-2">
                        <label className="text-sm font-black uppercase">{t('auth.accountType')}</label>
                        <div className="grid grid-cols-2 gap-4">
                            <label className="cursor-pointer">
                                <input type="radio" name="role" value="user" checked={role === 'user'} onChange={() => setRole('user')} className="hidden" />
                                <div className={`p-4 border-4 border-black text-center font-black uppercase transition-all ${role === 'user' ? 'bg-brutal-yellow shadow-none translate-x-1 translate-y-1' : 'shadow-brutal hover:bg-gray-50'}`}>
                                    <span className="material-symbols-outlined block mb-1">person</span>
                                    {t('auth.buyerRegister')}
                                </div>
                            </label>
                            <label className="cursor-pointer">
                                <input type="radio" name="role" value="seller" checked={role === 'seller'} onChange={() => setRole('seller')} className="hidden" />
                                <div className={`p-4 border-4 border-black text-center font-black uppercase transition-all ${role === 'seller' ? 'bg-brutal-green shadow-none translate-x-1 translate-y-1' : 'shadow-brutal hover:bg-gray-50'}`}>
                                    <span className="material-symbols-outlined block mb-1">storefront</span>
                                    {t('auth.sellerRegister')}
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Shipping Address — only for buyers */}
                    {role === 'user' && (
                    <div className="border-4 border-black p-4 bg-gray-50">
                        <h3 className="text-sm font-black uppercase mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">local_shipping</span>
                            {t('auth.shippingAddress')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-xs font-bold uppercase text-gray-600">{t('checkout.street')}</label>
                                <input
                                    type="text"
                                    value={address.street}
                                    onChange={e => setAddress(a => ({ ...a, street: e.target.value }))}
                                    className="w-full p-3 border-3 border-black focus:ring-0 text-sm font-bold"
                                    placeholder="123 Main St"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-gray-600">{t('checkout.city')}</label>
                                <input
                                    type="text"
                                    value={address.city}
                                    onChange={e => setAddress(a => ({ ...a, city: e.target.value }))}
                                    className="w-full p-3 border-3 border-black focus:ring-0 text-sm font-bold"
                                    placeholder="City"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-gray-600">{t('checkout.zip')}</label>
                                <input
                                    type="text"
                                    value={address.zip}
                                    onChange={e => setAddress(a => ({ ...a, zip: e.target.value }))}
                                    className="w-full p-3 border-3 border-black focus:ring-0 text-sm font-bold"
                                    placeholder="Zip"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-xs font-bold uppercase text-gray-600">{t('checkout.country')}</label>
                                <input
                                    type="text"
                                    value={address.country}
                                    onChange={e => setAddress(a => ({ ...a, country: e.target.value }))}
                                    className="w-full p-3 border-3 border-black focus:ring-0 text-sm font-bold"
                                    placeholder="Country"
                                />
                            </div>
                        </div>
                    </div>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-brutal-pink text-white border-4 border-black py-4 text-xl font-black uppercase shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50"
                    >
                        {loading ? t('general.loading') : t('auth.register')}
                    </button>
                    <p className="text-center font-bold">
                        {t('auth.hasAccount')}{' '}
                        <Link to="/login" className="text-brutal-pink underline font-black">{t('auth.login')}</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};
