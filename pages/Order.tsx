import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context';
import { useI18n } from '../i18n';
import { api } from '../api';
import { Order } from '../types';

export const Cart = () => {
    const { cart, removeFromCart, updateQuantity, cartTotal, isLoggedIn } = useApp();
    const { t } = useI18n();
    const navigate = useNavigate();

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
                        <Link to="/" className="inline-flex items-center border-4 border-black bg-brutal-yellow px-6 py-3 font-black uppercase shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                            {t('cart.continue')}
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-16 items-start">
                    <div className="w-full lg:flex-1">
                        {cart.map(item => (
                            <div key={item.id} className="flex flex-col sm:flex-row gap-8 py-8 border-b-4 border-black first:pt-0">
                                <div className="shrink-0 border-4 border-black shadow-brutal overflow-hidden">
                                    <div className="bg-center bg-no-repeat bg-cover w-full sm:w-48 h-48" style={{ backgroundImage: `url("${item.image}")` }}></div>
                                </div>
                                <div className="flex flex-1 flex-col justify-between">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <h3 className="text-2xl font-black mb-2 uppercase font-display">{item.name}</h3>
                                            {item.categories && <p className="text-sm font-bold bg-black text-white px-2 py-1 inline-block uppercase mb-4">{item.categories.name}</p>}
                                        </div>
                                        <button onClick={() => removeFromCart(item.id)} className="bg-brutal-red border-4 border-black p-3 shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-2 font-bold uppercase text-sm text-white" aria-label={`${t('cart.remove')}: ${item.name}`}>
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                            {t('cart.remove')}
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap items-end justify-between gap-4">
                                        <div className="flex items-center border-4 border-black shadow-brutal bg-white" role="group" aria-label="Quantity">
                                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-12 h-12 flex items-center justify-center border-r-4 border-black hover:bg-brutal-yellow" aria-label="Decrease quantity">
                                                <span className="material-symbols-outlined font-black">remove</span>
                                            </button>
                                            <input className="w-14 text-center border-none text-xl font-black focus:ring-0" type="number" value={item.quantity} readOnly aria-label="Quantity" />
                                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-12 h-12 flex items-center justify-center border-l-4 border-black hover:bg-brutal-yellow" aria-label="Increase quantity">
                                                <span className="material-symbols-outlined font-black">add</span>
                                            </button>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-4xl font-black font-display">${(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className="mt-12">
                            <Link to="/" className="inline-flex items-center border-4 border-black bg-white px-6 py-3 font-black uppercase shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                                <span className="material-symbols-outlined mr-2 font-black">arrow_back</span>
                                {t('cart.continue')}
                            </Link>
                        </div>
                    </div>
                    <div className="w-full lg:w-[440px] shrink-0 sticky top-28">
                        <div className="border-4 border-black bg-white p-8 shadow-brutal-lg">
                            <h2 className="text-3xl font-black mb-8 border-b-4 border-black pb-4 font-display uppercase">{t('checkout.manifest')}</h2>
                            <div className="space-y-6 pb-8 border-b-4 border-black font-bold uppercase text-lg">
                                <div className="flex justify-between">
                                    <span>{t('cart.subtotal')}</span>
                                    <span>${cartTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{t('cart.shipping')}</span>
                                    <span className="text-brutal-green">{t('cart.free')}</span>
                                </div>
                            </div>
                            <div className="py-8">
                                <div className="flex justify-between items-center mb-10">
                                    <span className="font-black text-2xl uppercase italic">{t('cart.total')}</span>
                                    <span className="font-black text-5xl font-display">${cartTotal.toFixed(2)}</span>
                                </div>
                                <button
                                    onClick={() => isLoggedIn ? navigate('/checkout') : navigate('/login')}
                                    className="w-full bg-brutal-yellow border-4 border-black py-6 text-2xl font-black uppercase shadow-brutal-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-4"
                                >
                                    {t('cart.checkout')}
                                    <span className="material-symbols-outlined font-black text-3xl">arrow_forward</span>
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
    const { cart, cartTotal, clearCart, isLoggedIn } = useApp();
    const { t } = useI18n();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [shipping, setShipping] = useState({ name: '', street: '', city: '', zip: '', country: '' });
    const [paymentMethod, setPaymentMethod] = useState('credit_card');

    useEffect(() => {
        if (!isLoggedIn) navigate('/login');
    }, [isLoggedIn, navigate]);

    const handlePlaceOrder = async () => {
        setLoading(true);
        try {
            const orderData = {
                items: cart.map(item => ({
                    product_id: item.id,
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    quantity: item.quantity,
                })),
                shipping,
                payment_method: paymentMethod,
            };
            const order = await api.createOrder(orderData);
            clearCart();
            navigate(`/order/${order.id}`);
        } catch (err: any) {
            alert(err.message || 'Failed to place order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto w-full px-4 lg:px-6 py-12" role="main" aria-label={t('checkout.title')}>
            {/* Progress Steps */}
            <div className="mb-20 max-w-4xl mx-auto relative">
                <div className="absolute top-1/2 -translate-y-1/2 w-full h-2 bg-black"></div>
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex flex-col items-center gap-4">
                        <div className="size-16 md:size-20 bg-brutal-green border-4 border-black flex items-center justify-center shadow-brutal">
                            <span className="material-symbols-outlined text-4xl font-black">check</span>
                        </div>
                        <span className="text-sm font-black uppercase bg-white px-2 border-2 border-black">{t('checkout.shipping')}</span>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <div className="size-16 md:size-20 bg-brutal-yellow border-4 border-black flex items-center justify-center shadow-brutal">
                            <span className="text-3xl font-black italic">02</span>
                        </div>
                        <span className="text-sm font-black uppercase bg-white px-2 border-2 border-black">{t('checkout.payment')}</span>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <div className="size-16 md:size-20 bg-white border-4 border-black flex items-center justify-center shadow-brutal">
                            <span className="text-3xl font-black italic">03</span>
                        </div>
                        <span className="text-sm font-black uppercase bg-white px-2 border-2 border-black">{t('checkout.review')}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                <div className="lg:col-span-8 flex flex-col gap-10">
                    {/* Shipping Address */}
                    <div className="bg-white border-4 border-black p-8 shadow-brutal relative">
                        <div className="absolute -top-6 -left-4 bg-black text-white px-4 py-1 text-sm font-black uppercase">Step 01</div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tight font-display mb-6">{t('checkout.shipping')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-black uppercase">{t('checkout.name')}</label>
                                <input type="text" value={shipping.name} onChange={e => setShipping(s => ({ ...s, name: e.target.value }))} className="w-full p-4 border-4 border-black focus:ring-0 text-lg font-bold" placeholder="John Doe" aria-label={t('checkout.name')} />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-black uppercase">{t('checkout.street')}</label>
                                <input type="text" value={shipping.street} onChange={e => setShipping(s => ({ ...s, street: e.target.value }))} className="w-full p-4 border-4 border-black focus:ring-0 text-lg font-bold" placeholder="123 Main St" aria-label={t('checkout.street')} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black uppercase">{t('checkout.city')}</label>
                                <input type="text" value={shipping.city} onChange={e => setShipping(s => ({ ...s, city: e.target.value }))} className="w-full p-4 border-4 border-black focus:ring-0 text-lg font-bold" aria-label={t('checkout.city')} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black uppercase">{t('checkout.zip')}</label>
                                <input type="text" value={shipping.zip} onChange={e => setShipping(s => ({ ...s, zip: e.target.value }))} className="w-full p-4 border-4 border-black focus:ring-0 text-lg font-bold" aria-label={t('checkout.zip')} />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-black uppercase">{t('checkout.country')}</label>
                                <input type="text" value={shipping.country} onChange={e => setShipping(s => ({ ...s, country: e.target.value }))} className="w-full p-4 border-4 border-black focus:ring-0 text-lg font-bold" aria-label={t('checkout.country')} />
                            </div>
                        </div>
                    </div>

                    {/* Payment */}
                    <div className="bg-white border-4 border-black p-8 shadow-brutal relative">
                        <div className="absolute -top-6 -left-4 bg-black text-white px-4 py-1 text-sm font-black uppercase">Step 02</div>
                        <h3 className="text-3xl font-black uppercase italic mb-10 tracking-tight font-display">{t('checkout.payment')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                            <label className="cursor-pointer group">
                                <input type="radio" name="payment_type" className="hidden" checked={paymentMethod === 'credit_card'} onChange={() => setPaymentMethod('credit_card')} />
                                <div className={`flex items-center justify-between p-6 border-4 border-black transition-all h-full ${paymentMethod === 'credit_card' ? 'bg-brutal-yellow' : 'group-hover:bg-gray-100'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`size-6 border-4 border-black ${paymentMethod === 'credit_card' ? 'bg-black' : 'bg-white'}`}></div>
                                        <span className="text-xl font-black uppercase">{t('checkout.creditCard')}</span>
                                    </div>
                                    <span className="material-symbols-outlined text-3xl">credit_card</span>
                                </div>
                            </label>
                            <label className="cursor-pointer group">
                                <input type="radio" name="payment_type" className="hidden" checked={paymentMethod === 'ewallet'} onChange={() => setPaymentMethod('ewallet')} />
                                <div className={`flex items-center justify-between p-6 border-4 border-black transition-all h-full ${paymentMethod === 'ewallet' ? 'bg-brutal-yellow' : 'group-hover:bg-gray-100'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`size-6 border-4 border-black ${paymentMethod === 'ewallet' ? 'bg-black' : 'bg-white'}`}></div>
                                        <span className="text-xl font-black uppercase">{t('checkout.eWallet')}</span>
                                    </div>
                                    <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
                                </div>
                            </label>
                        </div>
                        {paymentMethod === 'credit_card' && (
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-sm font-black uppercase">{t('checkout.cardNumber')}</label>
                                    <input type="text" className="w-full p-4 border-4 border-black focus:ring-0 text-lg font-bold placeholder-gray-400" placeholder="XXXX XXXX XXXX XXXX" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-sm font-black uppercase">{t('checkout.expiry')}</label>
                                        <input type="text" className="w-full p-4 border-4 border-black focus:ring-0 text-lg font-bold placeholder-gray-400" placeholder="MM / YY" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-black uppercase">{t('checkout.cvc')}</label>
                                        <input type="text" className="w-full p-4 border-4 border-black focus:ring-0 text-lg font-bold placeholder-gray-400" placeholder="CVC" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="lg:col-span-4">
                    <div className="sticky top-32 space-y-8">
                        <div className="bg-white border-4 border-black p-8 shadow-brutal">
                            <h3 className="text-2xl font-black uppercase italic mb-8 border-b-4 border-black pb-4 font-display">{t('checkout.manifest')}</h3>
                            <div className="space-y-6 mb-8">
                                {cart.map(item => (
                                    <div key={item.id} className="flex gap-4 items-center">
                                        <div className="w-20 h-20 border-4 border-black overflow-hidden bg-gray-200 shrink-0">
                                            <img src={item.image} alt={item.name} className="object-cover w-full h-full" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-black uppercase leading-tight">{item.name}</p>
                                            <p className="text-lg font-black italic">${item.price}</p>
                                            <p className="text-xs font-bold">Qty: {item.quantity}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-4 pt-6 border-t-4 border-black">
                                <div className="flex justify-between font-bold uppercase">
                                    <span>{t('cart.subtotal')}</span>
                                    <span>${cartTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold uppercase">
                                    <span>{t('cart.shipping')}</span>
                                    <span className="bg-brutal-green px-1 border border-black">{t('cart.free')}</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 mt-4 border-t-4 border-black">
                                    <span className="text-xl font-black uppercase">{t('cart.total')}</span>
                                    <span className="text-3xl font-black italic font-display">${cartTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handlePlaceOrder}
                            disabled={loading || cart.length === 0}
                            className="w-full bg-brutal-yellow border-4 border-black text-black font-black text-3xl py-8 shadow-brutal hover:shadow-brutal-active hover:translate-x-1 hover:translate-y-1 transition-all uppercase italic tracking-tighter flex flex-col items-center group font-display disabled:opacity-50"
                        >
                            <span className="flex items-center gap-3">
                                {loading ? t('general.loading') : t('checkout.placeOrder')}
                                <span className="material-symbols-outlined text-4xl">arrow_forward</span>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const OrderDetails = () => {
    const { t } = useI18n();
    const { id } = useParams();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        api.getOrder(id)
            .then(data => setOrder(data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [id]);

    const statusSteps = ['ordered', 'shipped', 'out_for_delivery', 'delivered'];
    const statusLabels: Record<string, string> = {
        ordered: t('order.ordered'),
        shipped: t('order.shipped'),
        out_for_delivery: t('order.outForDelivery'),
        delivered: t('order.delivered'),
    };
    const statusIcons: Record<string, string> = {
        ordered: 'shopping_cart',
        shipped: 'local_shipping',
        out_for_delivery: 'box',
        delivered: 'home',
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
                <div className="border-4 border-black bg-white px-8 py-4 shadow-brutal">
                    <span className="text-2xl font-black uppercase">Order not found</span>
                </div>
            </div>
        );
    }

    const currentStepIndex = statusSteps.indexOf(order.status);

    return (
        <div className="px-4 md:px-10 py-8 w-full max-w-[1400px] mx-auto" role="main" aria-label={`${t('order.title')} ${order.id.slice(0, 8)}`}>
            <div className="mb-8 font-bold uppercase text-xs flex gap-2">
                <Link to="/" className="bg-black text-white px-2 py-1">{t('footer.home')}</Link>
                <span className="py-1">/</span>
                <span className="bg-white border-2 border-black px-2 py-1">{t('order.title')} #{order.id.slice(0, 8)}</span>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
                <div>
                    <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4 font-display">{t('order.title')} #{order.id.slice(0, 8)}</h2>
                    <div className="flex flex-wrap gap-4 text-lg font-bold">
                        <span className="bg-brutal-pink text-white px-3 py-1 border-4 border-black">{new Date(order.created_at).toLocaleDateString()}</span>
                        <span className="bg-brutal-blue text-white px-3 py-1 border-4 border-black">{t('cart.total')}: ${order.total}</span>
                    </div>
                </div>
            </div>

            {/* Status Tracker */}
            <div className="border-4 border-black shadow-brutal p-8 md:p-12 mb-12 overflow-hidden bg-white">
                <h3 className="text-3xl font-black uppercase mb-12 italic underline decoration-4 decoration-brutal-yellow font-display">{t('order.status')}</h3>
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
            </div>

            {/* Order Items */}
            {order.order_items && order.order_items.length > 0 && (
                <div className="border-4 border-black shadow-brutal p-8 bg-white">
                    <h3 className="text-2xl font-black uppercase mb-8 border-b-4 border-black pb-4">Order Items</h3>
                    <div className="space-y-6">
                        {order.order_items.map(item => (
                            <div key={item.id} className="flex gap-6 items-center border-b-2 border-black pb-6 last:border-0">
                                {item.product_image && (
                                    <div className="w-24 h-24 border-4 border-black overflow-hidden bg-gray-100 shrink-0">
                                        <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h4 className="font-black uppercase text-lg">{item.product_name}</h4>
                                    <p className="font-bold">Qty: {item.quantity} × ${item.price}</p>
                                </div>
                                <div className="text-2xl font-black">${(item.price * item.quantity).toFixed(2)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};