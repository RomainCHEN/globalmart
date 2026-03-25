import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context';
import { useI18n, localized } from '../i18n';
import { api } from '../api';
import { Order } from '../types';
import { AddressSelector } from '../components/AddressSelector';

export const Cart = () => {
    const { cart, removeFromCart, updateQuantity, isLoggedIn, selectedCartItems, setSelectedCartItems, getCartItemId, authLoading, formatPrice } = useApp();
    const { t, lang } = useI18n();
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && !isLoggedIn) {
            navigate('/login');
        }
    }, [isLoggedIn, authLoading, navigate]);

    // Group cart items by store
    const storeGroups = React.useMemo(() => {
        const groups: Record<string, { store: { id: string; name: string; logo?: string } | null; items: typeof cart }> = {};
        cart.forEach(item => {
            const sid = item.store_id || 'independent';
            if (!groups[sid]) {
                groups[sid] = { store: (item as any).stores ? { id: (item as any).stores.id, name: (item as any).stores.name, logo: (item as any).stores.logo } : null, items: [] };
            }
            groups[sid].items.push(item);
        });
        return groups;
    }, [cart]);

    const allItemIds = cart.map(item => getCartItemId(item.id, item.options));
    const isAllSelected = allItemIds.length > 0 && allItemIds.every(id => selectedCartItems.includes(id));

    const toggleItem = (itemId: string) => {
        setSelectedCartItems(selectedCartItems.includes(itemId) ? selectedCartItems.filter(id => id !== itemId) : [...selectedCartItems, itemId]);
    };
    const toggleStoreGroup = (storeId: string) => {
        const ids = (storeGroups[storeId]?.items || []).map(item => getCartItemId(item.id, item.options));
        const allChecked = ids.every(id => selectedCartItems.includes(id));
        setSelectedCartItems(allChecked ? selectedCartItems.filter(id => !ids.includes(id)) : [...new Set([...selectedCartItems, ...ids])]);
    };
    const toggleAll = () => setSelectedCartItems(isAllSelected ? [] : [...allItemIds]);

    const selectedCount = selectedCartItems.length;
    const selectedTotal = cart.filter(item => selectedCartItems.includes(getCartItemId(item.id, item.options))).reduce((acc, item) => acc + item.price * item.quantity, 0);

    const handleCheckout = () => {
        if (selectedCount === 0) { alert(t('cart.selectItems') || 'Please select items to checkout'); return; }
        if (!isLoggedIn) { navigate('/login'); return; }
        navigate('/checkout');
    };

    return (
        <div className="max-w-[1440px] mx-auto px-6 py-12" role="main" aria-label={t('cart.title')}>
            <div className="mb-12 border-b-8 border-black pb-6">
                <h1 className="text-6xl md:text-8xl font-black italic font-display">{t('cart.title')} <span className="text-gray-400 not-italic ml-4">[{cart.length}]</span></h1>
            </div>
            {cart.length === 0 ? (
                <div className="text-center py-20">
                    <div className="border-4 border-black border-dashed p-12 inline-block">
                        <span className="material-symbols-outlined text-6xl mb-4 block text-gray-400">shopping_cart</span>
                        <p className="text-2xl font-black uppercase mb-6">{t('cart.empty')}</p>
                        <Link to="/" className="inline-flex items-center border-4 border-black bg-brutal-yellow px-6 py-3 font-black uppercase shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">{t('cart.continue')}</Link>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-12 items-start">
                    <div className="w-full lg:flex-1 space-y-6">
                        {/* Global select all */}
                        <div className="flex items-center gap-4 border-4 border-black bg-gray-100 px-6 py-4 shadow-brutal">
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                <input type="checkbox" checked={isAllSelected} onChange={toggleAll} className="w-6 h-6 accent-black cursor-pointer" />
                                <span className="font-black uppercase text-sm">{t('cart.selectAll') || 'Select All'}</span>
                            </label>
                        </div>
                        {/* Store-grouped items */}
                        {Object.entries(storeGroups).map(([storeId, group]: [string, { store: { id: string; name: string; logo?: string } | null; items: typeof cart }]) => {
                            const groupIds = group.items.map(item => getCartItemId(item.id, item.options));
                            const allGroupChecked = groupIds.every(id => selectedCartItems.includes(id));
                            return (
                                <div key={storeId} className="border-4 border-black bg-white shadow-brutal">
                                    <div className="flex items-center gap-4 px-6 py-4 border-b-4 border-black bg-brutal-yellow/20">
                                        <input type="checkbox" checked={allGroupChecked} onChange={() => toggleStoreGroup(storeId)} className="w-5 h-5 accent-black cursor-pointer" />
                                        <Link to={group.store ? `/store/${group.store.id}` : '/'} className="flex items-center gap-2 hover:text-brutal-blue">
                                            <span className="material-symbols-outlined text-lg">storefront</span>
                                            <span className="font-black uppercase text-sm">{group.store?.name || 'Store'}</span>
                                        </Link>
                                    </div>
                                    {group.items.map(item => {
                                        const itemId = getCartItemId(item.id, item.options);
                                        const isChecked = selectedCartItems.includes(itemId);
                                        return (
                                            <div key={itemId} className={`flex flex-col sm:flex-row gap-5 px-6 py-5 border-b-2 border-black/20 last:border-0 transition-colors ${isChecked ? 'bg-brutal-yellow/5' : ''}`}>
                                                <div className="flex items-center shrink-0"><input type="checkbox" checked={isChecked} onChange={() => toggleItem(itemId)} className="w-5 h-5 accent-black cursor-pointer" /></div>
                                                <Link to={`/product/${item.id}`} className="shrink-0 border-3 border-black overflow-hidden hover:shadow-brutal transition-all">
                                                    <div className="bg-center bg-no-repeat bg-cover w-full sm:w-28 h-28" style={{ backgroundImage: `url("${item.image}")` }}></div>
                                                </Link>
                                                <div className="flex flex-1 flex-col justify-between min-w-0">
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div className="min-w-0 flex-1">
                                                            <Link to={`/product/${item.id}`} className="hover:text-brutal-blue"><h3 className="text-lg font-black mb-1 uppercase font-display truncate">{localized(item, 'name', lang)}</h3></Link>
                                                            {item.options && Object.keys(item.options).length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mb-2">{Object.entries(item.options).map(([k, v]) => (<span key={k} className="bg-gray-100 border-2 border-black px-2 py-0.5 text-xs font-black uppercase">{k}: {v}</span>))}</div>
                                                            )}
                                                            <p className="text-sm font-bold text-gray-500">{t('cart.unitPrice')}: {formatPrice(item.price)}</p>
                                                        </div>
                                                        <button onClick={() => removeFromCart(item.id)} className="bg-brutal-red border-3 border-black p-2 hover:translate-x-[1px] hover:translate-y-[1px] transition-all text-white shrink-0" aria-label={t('cart.remove')}>
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-wrap items-end justify-between gap-4 mt-2">
                                                        <div className="flex items-center border-3 border-black bg-white" role="group">
                                                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-10 h-10 flex items-center justify-center border-r-3 border-black hover:bg-brutal-yellow"><span className="material-symbols-outlined font-black text-sm">remove</span></button>
                                                            <input className="w-12 text-center border-none text-lg font-black focus:ring-0" type="number" value={item.quantity} readOnly />
                                                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-10 h-10 flex items-center justify-center border-l-3 border-black hover:bg-brutal-yellow"><span className="material-symbols-outlined font-black text-sm">add</span></button>
                                                        </div>
                                                        <p className="text-2xl font-black font-display">{formatPrice(item.price * item.quantity)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                        <Link to="/" className="inline-flex items-center border-4 border-black bg-white px-6 py-3 font-black uppercase shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all mt-4">
                            <span className="material-symbols-outlined mr-2 font-black">arrow_back</span>{t('cart.continue')}
                        </Link>
                    </div>
                    {/* Summary — selected items only */}
                    <div className="w-full lg:w-[420px] shrink-0 sticky top-28">
                        <div className="border-4 border-black bg-white p-8 shadow-brutal-lg">
                            <h2 className="text-3xl font-black mb-8 border-b-4 border-black pb-4 font-display uppercase">{t('checkout.manifest')}</h2>
                            <div className="space-y-4 pb-8 border-b-4 border-black font-bold uppercase">
                                <div className="flex justify-between"><span>{t('cart.selectedItems') || 'Selected'}</span><span className="text-lg">{selectedCount} / {cart.length}</span></div>
                                <div className="flex justify-between text-lg"><span>{t('cart.subtotal')}</span><span>{formatPrice(selectedTotal)}</span></div>
                                <div className="flex justify-between"><span>{t('cart.shipping')}</span><span className="text-brutal-green">{t('cart.free')}</span></div>
                            </div>
                            <div className="py-8">
                                <div className="flex justify-between items-center mb-8">
                                    <span className="font-black text-xl uppercase italic">{t('cart.total')}</span>
                                    <span className="font-black text-4xl font-display">{formatPrice(selectedTotal)}</span>
                                </div>
                                <button onClick={handleCheckout} disabled={selectedCount === 0}
                                    className="w-full bg-brutal-yellow border-4 border-black py-5 text-xl font-black uppercase shadow-brutal-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed">
                                    {t('cart.checkout')} ({selectedCount})
                                    <span className="material-symbols-outlined font-black text-2xl">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export const Checkout = () => {
    const { cart, clearCart, removeItems, isLoggedIn, user, selectedCartItems, getCartItemId, authLoading, formatPrice } = useApp();
    const { t, lang } = useI18n();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPayDemo, setShowPayDemo] = useState(false);
    const [shipping, setShipping] = useState(() => {
        const addr = (user as any)?.shipping_address;
        return { 
            name: addr?.name || user?.name || '', 
            street: addr?.street || '', 
            city: addr?.city || '', 
            state: addr?.state || '',
            zip: addr?.zip || '', 
            country: addr?.country || '' 
        };
    });
    const [paymentMethod, setPaymentMethod] = useState(lang === 'zh' ? 'wechat' : 'credit_card');

    // Only checkout selected items
    const checkoutItems = cart.filter(item => selectedCartItems.includes(getCartItemId(item.id, item.options)));
    const selectedTotal = checkoutItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    useEffect(() => {
        if (!authLoading && !isLoggedIn) navigate('/login');
        if (checkoutItems.length === 0 && cart.length > 0) navigate('/cart');
    }, [isLoggedIn, authLoading, navigate, checkoutItems.length, cart.length]);

    const handlePlaceOrder = async () => {
        if (!shipping.street || !shipping.city) {
            alert(t('checkout.addressRequired') || 'Please provide a shipping address');
            return;
        }
        setShowPayDemo(true);
    };

    const confirmPayment = async () => {
        setLoading(true);
        setShowPayDemo(false);
        try {
            // Group selected items by store_id
            const storeGroups: Record<string, typeof checkoutItems> = {};
            checkoutItems.forEach(item => {
                const sid = item.store_id || 'unknown';
                if (!storeGroups[sid]) storeGroups[sid] = [];
                storeGroups[sid].push(item);
            });

            const createdOrders: any[] = [];
            for (const [sid, groupItems] of Object.entries(storeGroups)) {
                const orderData = {
                    items: groupItems.map(item => {
                        let formattedName = item.name;
                        if (item.options && Object.keys(item.options).length > 0) {
                            const optStr = Object.entries(item.options).map(([k, v]) => `${k}: ${v}`).join(', ');
                            formattedName += ` (${optStr})`;
                        }
                        return { product_id: item.id, name: formattedName, image: item.image, price: item.price, quantity: item.quantity };
                    }),
                    shipping,
                    payment_method: paymentMethod,
                    store_id: sid === 'unknown' ? null : sid,
                };
                const order = await api.createOrder(orderData);
                createdOrders.push(order);
            }

            removeItems(selectedCartItems);

            if (createdOrders.length === 1) {
                navigate(`/order/${createdOrders[0].id}`);
            } else {
                alert(t('checkout.multiStoreNotice') || `${createdOrders.length} orders created (one per store).`);
                navigate('/dashboard');
            }
        } catch (err: any) {
            alert(err.message || 'Failed to place order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto w-full px-4 lg:px-6 py-12" role="main" aria-label={t('checkout.title')}>
            {showPayDemo && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-white border-8 border-black p-8 max-w-md w-full shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]">
                        <h3 className="text-3xl font-black uppercase italic mb-6 border-b-4 border-black pb-2">
                            {lang === 'zh' ? '支付确认 (DEMO)' : 'PAYMENT CONFIRM (DEMO)'}
                        </h3>
                        <div className="space-y-6 text-center">
                            {paymentMethod === 'wechat' || paymentMethod === 'alipay' ? (
                                <div className="space-y-4">
                                    <div className="w-48 h-48 bg-gray-100 border-4 border-black mx-auto flex items-center justify-center relative">
                                        <div className="absolute inset-2 border-2 border-black/10 flex flex-wrap opacity-20"><div className="w-1/2 h-1/2 bg-black"></div><div className="w-1/2 h-1/2 bg-white"></div><div className="w-1/2 h-1/2 bg-white"></div><div className="w-1/2 h-1/2 bg-black"></div></div>
                                        <span className="material-symbols-outlined text-6xl">qr_code_2</span>
                                    </div>
                                    <p className="font-black text-xl uppercase tracking-tighter">
                                        {paymentMethod === 'wechat' ? '微信支付' : '支付宝支付'}
                                    </p>
                                    <p className="font-bold text-gray-600 italic">{lang === 'zh' ? '请使用手机扫描上方二维码' : 'Please scan the QR code with your phone'}</p>
                                </div>
                            ) : (
                                <div className="space-y-4 text-left">
                                    <div className="bg-brutal-blue text-white p-4 border-4 border-black font-black uppercase italic">
                                        Credit Card: XXXX-XXXX-XXXX-1234
                                    </div>
                                    <p className="font-bold text-gray-600 italic">{lang === 'zh' ? '正在连接国际支付网关...' : 'Connecting to international gateway...'}</p>
                                </div>
                            )}
                            <div className="pt-6 flex flex-col gap-3">
                                <button onClick={confirmPayment} className="w-full bg-brutal-green border-4 border-black py-4 font-black uppercase text-xl shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                                    {lang === 'zh' ? '已完成支付' : 'I HAVE PAID'}
                                </button>
                                <button onClick={() => setShowPayDemo(false)} className="w-full bg-white border-4 border-black py-2 font-black uppercase text-sm hover:bg-gray-100 transition-colors">
                                    {t('general.cancel')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                <div className="lg:col-span-8 flex flex-col gap-10">
                    <div className="bg-white border-4 border-black p-8 shadow-brutal relative">
                        <div className="absolute -top-6 -left-4 bg-black text-white px-4 py-1 text-sm font-black uppercase">Step 01</div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tight font-display mb-6">{t('checkout.shipping')}</h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-black uppercase">{t('checkout.name')}</label>
                                <input type="text" value={shipping.name} onChange={e => setShipping(s => ({ ...s, name: e.target.value }))} className="w-full p-4 border-4 border-black focus:ring-0 text-lg font-bold" placeholder="Full Name" aria-label={t('checkout.name')} />
                            </div>
                            <AddressSelector address={shipping as any} onChange={(updated) => setShipping(s => ({ ...s, ...updated }))} />
                        </div>
                    </div>

                    <div className="bg-white border-4 border-black p-8 shadow-brutal relative">
                        <div className="absolute -top-6 -left-4 bg-black text-white px-4 py-1 text-sm font-black uppercase">Step 02</div>
                        <h3 className="text-3xl font-black uppercase italic mb-10 tracking-tight font-display">{t('checkout.payment')}</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="cursor-pointer group">
                                <input type="radio" name="payment_type" className="hidden" checked={paymentMethod === 'credit_card'} onChange={() => setPaymentMethod('credit_card')} />
                                <div className={`flex items-center justify-between p-4 border-4 border-black transition-all ${paymentMethod === 'credit_card' ? 'bg-brutal-blue text-white' : 'hover:bg-gray-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 border-2 border-black ${paymentMethod === 'credit_card' ? 'bg-white' : 'bg-transparent'}`}></div>
                                        <span className="font-black uppercase text-sm">{lang === 'zh' ? '国际银行卡' : 'CREDIT CARD'}</span>
                                    </div>
                                    <span className="material-symbols-outlined">credit_card</span>
                                </div>
                            </label>

                            <label className="cursor-pointer group">
                                <input type="radio" name="payment_type" className="hidden" checked={paymentMethod === 'wechat'} onChange={() => setPaymentMethod('wechat')} />
                                <div className={`flex items-center justify-between p-4 border-4 border-black transition-all ${paymentMethod === 'wechat' ? 'bg-brutal-green text-white' : 'hover:bg-gray-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 border-2 border-black ${paymentMethod === 'wechat' ? 'bg-white' : 'bg-transparent'}`}></div>
                                        <span className="font-black uppercase text-sm">{lang === 'zh' ? '微信支付' : 'WECHAT PAY'}</span>
                                    </div>
                                    <span className="material-symbols-outlined">chat_bubble</span>
                                </div>
                            </label>

                            <label className="cursor-pointer group">
                                <input type="radio" name="payment_type" className="hidden" checked={paymentMethod === 'alipay'} onChange={() => setPaymentMethod('alipay')} />
                                <div className={`flex items-center justify-between p-4 border-4 border-black transition-all ${paymentMethod === 'alipay' ? 'bg-brutal-blue text-white' : 'hover:bg-gray-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 border-2 border-black ${paymentMethod === 'alipay' ? 'bg-white' : 'bg-transparent'}`}></div>
                                        <span className="font-black uppercase text-sm">{lang === 'zh' ? '支付宝' : 'ALIPAY'}</span>
                                    </div>
                                    <span className="material-symbols-outlined">payments</span>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-4">
                    <div className="sticky top-32 space-y-8">
                        <div className="bg-white border-4 border-black p-8 shadow-brutal">
                            <h3 className="text-2xl font-black uppercase italic mb-8 border-b-4 border-black pb-4 font-display">{t('checkout.manifest')}</h3>
                            <div className="space-y-4 mb-8">
                                {checkoutItems.map(item => (
                                    <div key={item.id} className="flex gap-3 items-center border-b-2 border-black/5 pb-3 last:border-0">
                                        <div className="w-12 h-12 border-2 border-black overflow-hidden bg-gray-200 shrink-0">
                                            <img src={item.image} alt={item.name} className="object-contain w-full h-full" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black uppercase truncate">{item.name}</p>
                                            <p className="text-sm font-black italic">{formatPrice(item.price)} x {item.quantity}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-4 pt-6 border-t-4 border-black">
                                <div className="flex justify-between font-bold uppercase text-sm">
                                    <span>{t('cart.subtotal')}</span>
                                    <span>{formatPrice(selectedTotal)}</span>
                                </div>
                                <div className="flex justify-between font-bold uppercase text-sm">
                                    <span>{t('cart.shipping')}</span>
                                    <span className="text-brutal-green">{t('cart.free')}</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 mt-4 border-t-4 border-black">
                                    <span className="text-xl font-black uppercase italic">{t('cart.total')}</span>
                                    <span className="text-3xl font-black font-display">{formatPrice(selectedTotal)}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handlePlaceOrder}
                            disabled={loading || checkoutItems.length === 0}
                            className="w-full bg-brutal-yellow border-4 border-black text-black font-black text-3xl py-6 shadow-brutal hover:shadow-brutal-active hover:translate-x-1 hover:translate-y-1 transition-all uppercase italic tracking-tighter flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? t('general.loading') : t('checkout.placeOrder')}
                            <span className="material-symbols-outlined text-3xl">arrow_forward</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const OrderDetails = () => {
    const { t, lang } = useI18n();
    const { id } = useParams();
    const { isLoggedIn, formatPrice, authLoading } = useApp();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        if (!authLoading && !isLoggedIn) navigate('/login');
    }, [isLoggedIn, authLoading, navigate]);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        api.getOrder(id)
            .then(data => setOrder(data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [id]);

    const handleCancel = async () => {
        if (!order || !confirm(t('order.cancelConfirm'))) return;
        setCancelling(true);
        try {
            const updated = await api.cancelOrder(order.id);
            setOrder(updated);
        } catch (err: any) {
            alert(err.message || 'Failed to cancel order');
        }
        setCancelling(false);
    };

    const statusSteps = ['pending', 'shipped', 'delivered'];
    const statusLabels: Record<string, string> = {
        pending: t('order.pending'),
        shipped: t('order.shipped'),
        delivered: t('order.delivered'),
        hold: t('order.hold'),
        cancelled: t('order.cancelled'),
    };
    const statusIcons: Record<string, string> = {
        pending: 'hourglass_top',
        shipped: 'local_shipping',
        delivered: 'check_circle',
        hold: 'pause_circle',
        cancelled: 'cancel',
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="border-4 border-black bg-brutal-yellow px-8 py-4 shadow-brutal animate-pulse">
                    <span className="text-2xl font-black uppercase">{t('general.loading')}</span>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="border-4 border-black bg-white px-8 py-4 shadow-brutal text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-400 block mb-4">error</span>
                    <span className="text-2xl font-black uppercase">Order not found</span>
                    <Link to="/dashboard" className="block mt-4 text-brutal-blue font-black underline">{t('dash.myOrders')}</Link>
                </div>
            </div>
        );
    }

    const currentStepIndex = order.status === 'cancelled' || order.status === 'hold'
        ? -1
        : statusSteps.indexOf(order.status);
    const canCancel = order.status === 'pending' || order.status === 'hold';

    return (
        <div className="px-4 md:px-10 py-8 w-full max-w-[1400px] mx-auto" role="main" aria-label={`${t('order.title')} ${order.id.slice(0, 8)}`}>
            <div className="mb-8 font-bold uppercase text-xs flex gap-2">
                <Link to="/" className="bg-black text-white px-2 py-1">{t('footer.home')}</Link>
                <span className="py-1">/</span>
                <Link to="/dashboard" className="bg-white border-2 border-black px-2 py-1">{t('dash.myOrders')}</Link>
                <span className="py-1">/</span>
                <span className="bg-white border-2 border-black px-2 py-1">{t('order.title')} #{order.id.slice(0, 8)}</span>
            </div>
            
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none font-display">{t('order.title')} #{order.id.slice(0, 8)}</h2>
                        {order.stores && (
                            <Link to={`/store/${order.stores.id}`} className="bg-brutal-yellow border-4 border-black px-4 py-1 flex items-center gap-2 hover:shadow-brutal transition-all">
                                <span className="material-symbols-outlined font-black">storefront</span>
                                <span className="font-black uppercase italic">{order.stores.name}</span>
                            </Link>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-lg font-bold">
                        <span className="bg-brutal-pink text-white px-3 py-1 border-4 border-black">{new Date(order.created_at).toLocaleDateString()}</span>
                        <span className="bg-brutal-blue text-white px-3 py-1 border-4 border-black">{t('cart.total')}: {formatPrice(order.total)}</span>
                        <span className={`px-3 py-1 border-4 border-black font-black uppercase ${order.status === 'delivered' ? 'bg-brutal-green' : order.status === 'cancelled' ? 'bg-brutal-red text-white' : order.status === 'hold' ? 'bg-orange-400' : order.status === 'shipped' ? 'bg-brutal-blue text-white' : 'bg-brutal-yellow'}`}>{statusLabels[order.status] || order.status}</span>
                    </div>
                </div>
                <div className="flex gap-4">
                    {canCancel && (
                        <button onClick={handleCancel} disabled={cancelling} className="border-4 border-black bg-brutal-red text-white px-6 py-3 font-black uppercase shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 flex items-center gap-2">
                            <span className="material-symbols-outlined">cancel</span>
                            {cancelling ? t('general.loading') : t('order.cancelOrder')}
                        </button>
                    )}
                </div>
            </div>

            {/* Status Tracker */}
            {order.status !== 'cancelled' && (
                <div className="border-4 border-black shadow-brutal p-8 md:p-12 mb-12 overflow-hidden bg-white">
                    <h3 className="text-3xl font-black uppercase mb-12 italic underline decoration-4 decoration-brutal-yellow font-display">{t('order.status')}</h3>
                    {order.status === 'hold' ? (
                        <div className="flex items-center gap-4 p-6 bg-orange-100 border-4 border-orange-400">
                            <span className="material-symbols-outlined text-4xl text-orange-600">pause_circle</span>
                            <div>
                                <p className="font-black text-xl uppercase">{t('order.hold')}</p>
                                <p className="text-sm font-bold text-gray-600">{t('order.holdDesc')}</p>
                                {order.hold_at && <p className="text-xs font-bold text-gray-500 mt-1">{new Date(order.hold_at).toLocaleString()}</p>}
                            </div>
                        </div>
                    ) : (
                        <div className="relative pt-12">
                            <div className="absolute top-[4.25rem] left-0 w-full flex items-center px-8 z-0">
                                {statusSteps.slice(0, -1).map((step, i) => (
                                    <div key={step} className={`flex-1 h-4 ${i <= currentStepIndex - 1 ? 'bg-black' : 'border-4 border-black bg-gray-100'}`}></div>
                                ))}
                            </div>
                            <div className="relative z-10 flex justify-between">
                                {statusSteps.map((step, i) => (
                                    <div key={step} className={`flex flex-col items-center gap-4 text-center ${i > currentStepIndex ? 'opacity-50' : ''}`}>
                                        <div className={`w-16 h-16 border-4 border-black flex items-center justify-center ${i === currentStepIndex ? 'bg-brutal-pink text-white scale-110' : i < currentStepIndex ? 'bg-brutal-yellow' : 'bg-white border-dashed'}`}>
                                            <span className="material-symbols-outlined text-4xl font-bold">{statusIcons[step]}</span>
                                        </div>
                                        <div className={`mt-2 ${i === currentStepIndex ? 'bg-white p-1 border-2 border-black' : ''}`}>
                                            <p className={`font-black uppercase ${i === currentStepIndex ? 'text-lg italic' : 'text-sm'}`}>{statusLabels[step]}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="border-4 border-black shadow-brutal p-6 bg-white">
                    <h3 className="text-lg font-black uppercase mb-4 border-b-4 border-black pb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined">local_shipping</span>
                        {t('order.shippingInfo')}
                    </h3>
                    <div className="space-y-2 text-sm font-bold uppercase">
                        <p><span className="opacity-60">{t('checkout.name')}:</span> {order.shipping_name || '—'}</p>
                        <p><span className="opacity-60">{t('checkout.street')}:</span> {order.shipping_street || '—'}</p>
                        <p><span className="opacity-60">{t('checkout.city')}:</span> {order.shipping_city || '—'}</p>
                        <p><span className="opacity-60">{t('checkout.country')}:</span> {order.shipping_country || '—'}</p>
                    </div>
                </div>

                <div className="border-4 border-black shadow-brutal p-6 bg-white">
                    <h3 className="text-lg font-black uppercase mb-4 border-b-4 border-black pb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined">receipt_long</span>
                        {t('order.orderInfo')}
                    </h3>
                    <div className="space-y-2 text-sm font-bold uppercase">
                        <p><span className="opacity-60">{t('order.poNumber')}:</span> {order.id.slice(0, 13)}...</p>
                        <p><span className="opacity-60">{t('order.date')}:</span> {new Date(order.created_at).toLocaleDateString()}</p>
                        <p><span className="opacity-60">{t('order.paymentMethod')}:</span> {order.payment_method}</p>
                        <p><span className="opacity-60">{t('cart.total')}:</span> <span className="text-lg font-black text-brutal-blue">{formatPrice(order.total)}</span></p>
                    </div>
                </div>

                <div className="border-4 border-black shadow-brutal p-6 bg-white">
                    <h3 className="text-lg font-black uppercase mb-4 border-b-4 border-black pb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined">schedule</span>
                        {t('order.statusDates')}
                    </h3>
                    <div className="space-y-2 text-sm font-bold uppercase">
                        <p><span className="opacity-60">{t('order.pending')}:</span> {new Date(order.created_at).toLocaleDateString()}</p>
                        {order.shipped_at && <p><span className="opacity-60">{t('order.shipped')}:</span> {new Date(order.shipped_at).toLocaleDateString()}</p>}
                        {order.delivered_at && <p><span className="opacity-60">{t('order.delivered')}:</span> {new Date(order.delivered_at).toLocaleDateString()}</p>}
                    </div>
                </div>
            </div>

            {order.order_items && order.order_items.length > 0 && (
                <div className="border-4 border-black shadow-brutal p-8 bg-white">
                    <h3 className="text-2xl font-black uppercase mb-8 border-b-4 border-black pb-4 font-display">{t('order.items')}</h3>
                    <div className="space-y-0">
                        <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b-4 border-black text-xs font-black uppercase text-gray-600 italic">
                            <div className="col-span-6">{t('order.productName')}</div>
                            <div className="col-span-2 text-right">{t('order.unitPrice')}</div>
                            <div className="col-span-1 text-center">{t('order.qty')}</div>
                            <div className="col-span-3 text-right">{t('order.subtotal')}</div>
                        </div>
                        {order.order_items.map(item => (
                            <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center py-6 border-b-2 border-black last:border-0">
                                <div className="col-span-6 flex items-center gap-4">
                                    {item.product_image && (
                                        <div className="w-16 h-16 border-2 border-black overflow-hidden bg-gray-100 shrink-0 shadow-brutal-sm">
                                            <img src={item.product_image} alt="" className="w-full h-full object-contain" />
                                        </div>
                                    )}
                                    <h4 className="font-black uppercase text-sm leading-tight">{item.product_name}</h4>
                                </div>
                                <div className="col-span-2 text-right font-bold">{formatPrice(item.price)}</div>
                                <div className="col-span-1 text-center font-black">x{item.quantity}</div>
                                <div className="col-span-3 text-right text-2xl font-black font-display">{formatPrice(item.price * item.quantity)}</div>
                            </div>
                        ))}
                        <div className="grid grid-cols-12 gap-4 pt-8">
                            <div className="col-span-9 text-right font-black uppercase text-xl italic">{t('cart.total')}</div>
                            <div className="col-span-3 text-right text-4xl font-black font-display text-brutal-blue underline decoration-8 decoration-brutal-yellow underline-offset-8">{formatPrice(order.total)}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};