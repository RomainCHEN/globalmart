import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context';
import { useI18n } from '../i18n';
import { AddressSelector } from '../components/AddressSelector';

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
    const [birthday, setBirthday] = useState({ month: '', day: '' });
    const [vendorInfo, setVendorInfo] = useState({ contact_person: '', contact_phone: '', shop_name: '', shop_desc: '', shop_photo: '' });
    const [address, setAddress] = useState({ street: '', city: '', state: '', zip: '', country: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        setLoading(true);
        try {
            const shipping = role === 'user' ? { name, ...address } : undefined;
            const extra = { 
                birthday_month: birthday.month ? parseInt(birthday.month) : null, 
                birthday_day: birthday.day ? parseInt(birthday.day) : null,
                ...(role === 'seller' ? vendorInfo : {})
            };
            await register(email, password, name, role, shipping, extra);
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

                    {/* Vendor Fields */}
                    {role === 'seller' && (
                        <div className="border-4 border-black p-6 bg-brutal-green/10 space-y-4">
                            <h3 className="text-xl font-black uppercase border-b-2 border-black pb-2 mb-4">Shop Information</h3>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase">Person-in-charge Name</label>
                                <input 
                                    type="text" required 
                                    value={vendorInfo.contact_person} 
                                    onChange={e => setVendorInfo(prev => ({ ...prev, contact_person: e.target.value }))}
                                    className="w-full p-3 border-4 border-black font-bold focus:ring-0" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase">Contact Phone</label>
                                <input 
                                    type="text" required 
                                    value={vendorInfo.contact_phone} 
                                    onChange={e => setVendorInfo(prev => ({ ...prev, contact_phone: e.target.value }))}
                                    className="w-full p-3 border-4 border-black font-bold focus:ring-0" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase">Shop Name</label>
                                <input 
                                    type="text" required 
                                    value={vendorInfo.shop_name} 
                                    onChange={e => setVendorInfo(prev => ({ ...prev, shop_name: e.target.value }))}
                                    className="w-full p-3 border-4 border-black font-bold focus:ring-0" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase">Shop Description</label>
                                <textarea 
                                    required 
                                    value={vendorInfo.shop_desc} 
                                    onChange={e => setVendorInfo(prev => ({ ...prev, shop_desc: e.target.value }))}
                                    className="w-full p-3 border-4 border-black font-bold focus:ring-0 h-24" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase">Shop Photo URL</label>
                                <input 
                                    type="text" required 
                                    value={vendorInfo.shop_photo} 
                                    onChange={e => setVendorInfo(prev => ({ ...prev, shop_photo: e.target.value }))}
                                    className="w-full p-3 border-4 border-black font-bold focus:ring-0" 
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Birthday */}
                    <div className="space-y-2">
                        <label className="text-sm font-black uppercase">{t('auth.birthdayHint')}</label>
                        <div className="grid grid-cols-2 gap-4">
                            <select 
                                value={birthday.month} 
                                onChange={e => setBirthday(prev => ({ ...prev, month: e.target.value }))}
                                className="w-full p-4 border-4 border-black focus:ring-0 focus:border-brutal-pink text-lg font-bold"
                            >
                                <option value="">Month</option>
                                {[...Array(12)].map((_, i) => (
                                    <option key={i+1} value={i+1}>{i+1}</option>
                                ))}
                            </select>
                            <select 
                                value={birthday.day} 
                                onChange={e => setBirthday(prev => ({ ...prev, day: e.target.value }))}
                                className="w-full p-4 border-4 border-black focus:ring-0 focus:border-brutal-pink text-lg font-bold"
                            >
                                <option value="">Day</option>
                                {[...Array(31)].map((_, i) => (
                                    <option key={i+1} value={i+1}>{i+1}</option>
                                ))}
                            </select>
                        </div>
                        <p className="text-[10px] font-bold text-brutal-red italic leading-tight">
                            {t('auth.birthdayNote')}
                        </p>
                    </div>

                    {/* Account Type */}
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
                            <AddressSelector address={address} onChange={setAddress} />
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
