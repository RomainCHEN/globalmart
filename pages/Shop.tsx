import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context';
import { useI18n, localized } from '../i18n';
import { api } from '../api';
import { Product, Review } from '../types';

export const ShopHome = () => {
    const { categories, addToCart, toggleWishlist, isInWishlist, isLoggedIn, formatPrice } = useApp();
    const { t, lang } = useI18n();
    const navigate = useNavigate();
    
    // Get search from URL on mount
    const initialSearch = new URLSearchParams(window.location.search).get('search') || '';
    const [search, setSearch] = useState(initialSearch);
    
    const [selectedCategory, setSelectedCategory] = useState('');
    const [sort, setSort] = useState('rating');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Local pagination state
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [page, setPage] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const LIMIT = 12;

    const fetchProducts = async (pageNum: number, append: boolean) => {
        if (append) setLoadingMore(true); else setLoading(true);
        try {
            const params: Record<string, string> = { sort, page: String(pageNum), limit: String(LIMIT) };
            if (search) params.search = search;
            if (selectedCategory) params.category = selectedCategory;
            if (priceRange.min) params.min_price = priceRange.min;
            if (priceRange.max) params.max_price = priceRange.max;
            
            const data = await api.getProducts(params);

            // Log search if this is the first page of results
            if (search && pageNum === 1) {
                api.logSearch(search).catch(() => {});
            }

            const newProducts = data.products || [];
            setAllProducts(prev => append ? [...prev, ...newProducts] : newProducts);
            setTotalProducts(data.total || 0);
            setTotalPages(data.totalPages || 1);
            setPage(pageNum);
        } catch {
            if (!append) setAllProducts([]);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
        fetchProducts(1, false);
    }, [search, selectedCategory, sort, priceRange.min, priceRange.max]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(window.location.search);
        if (search.trim()) {
            params.set('search', search.trim());
        } else {
            params.delete('search');
        }
        navigate(`/?${params.toString()}`);
    };

    // Sync search state with URL query parameter changes
    useEffect(() => {
        const urlSearch = new URLSearchParams(window.location.search).get('search') || '';
        if (urlSearch !== search) {
            setSearch(urlSearch);
        }
    }, [window.location.search]);

    const handleLoadMore = () => {
        fetchProducts(page + 1, true);
    };

    return (
        <div className="pb-24 pt-12">
            {/* Hero */}
            <div className="max-w-[1600px] mx-auto px-6 lg:px-12 mb-16">
                <div className="bg-brutal-blue p-10 border-4 border-black shadow-brutal-xl">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase leading-[0.85] font-display">
                                {t('home.hero.title')}<br />
                                <span className="text-brutal-yellow">{t('home.hero.subtitle')}</span>
                            </h2>
                            <p className="text-2xl text-white font-bold mt-6 bg-black inline-block px-4 py-1">
                                {t('home.hero.desc')}
                            </p>
                        </div>
                        <select
                            value={sort}
                            onChange={e => setSort(e.target.value)}
                            className="border-4 border-black font-black uppercase bg-white px-6 py-4 shadow-brutal text-lg focus:outline-none cursor-pointer"
                            aria-label={t('product.sort')}
                        >
                            <option value="newest">{t('product.newest')}</option>
                            <option value="price_asc">{t('product.priceLow')}</option>
                            <option value="price_desc">{t('product.priceHigh')}</option>
                            <option value="rating">{t('product.topRated')}</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
                <div className="flex flex-col lg:flex-row gap-12 items-start">
                    {/* Filters */}
                    <aside className="w-full lg:w-80 space-y-8 lg:sticky lg:top-32" aria-label={t('filter.title')}>
                        <div className="bg-white border-4 border-black shadow-brutal p-6">
                            <h3 className="font-black text-2xl uppercase tracking-tighter flex items-center gap-2 mb-6 border-b-4 border-black pb-2">
                                <span className="material-symbols-outlined font-black text-brutal-blue">search</span>
                                Search
                            </h3>
                            <form onSubmit={handleSearch}>
                                <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="w-full p-3 border-4 border-black focus:ring-0 font-bold" placeholder={t('nav.search')} aria-label={t('nav.search')} />
                            </form>
                        </div>
                        <div className="bg-white border-4 border-black shadow-brutal p-6">
                            <h3 className="font-black text-2xl uppercase tracking-tighter flex items-center gap-2 mb-6 border-b-4 border-black pb-2">
                                <span className="material-symbols-outlined font-black text-brutal-blue">tune</span>
                                {t('filter.categories')}
                            </h3>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input type="radio" name="category" checked={selectedCategory === ''} onChange={() => setSelectedCategory('')} className="w-6 h-6 border-4 border-black text-brutal-yellow focus:ring-0 rounded-none" />
                                    <span className="text-lg font-bold group-hover:underline">{t('filter.all')}</span>
                                </label>
                                {categories.map(cat => (
                                    <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                                        <input type="radio" name="category" checked={selectedCategory === cat.id} onChange={() => setSelectedCategory(cat.id)} className="w-6 h-6 border-4 border-black text-brutal-yellow focus:ring-0 rounded-none" />
                                        <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                                        <span className="text-lg font-bold group-hover:underline">{t(`cat.${cat.name}`) || cat.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white border-4 border-black shadow-brutal p-6">
                            <h3 className="font-black text-lg uppercase mb-4 text-brutal-blue">{t('filter.price')}</h3>
                            <div className="flex gap-4">
                                <input type="number" placeholder="Min" value={priceRange.min} onChange={e => setPriceRange(prev => ({ ...prev, min: e.target.value }))} className="w-full p-2 border-4 border-black font-bold focus:ring-0" aria-label="Minimum price" />
                                <input type="number" placeholder="Max" value={priceRange.max} onChange={e => setPriceRange(prev => ({ ...prev, max: e.target.value }))} className="w-full p-2 border-4 border-black font-bold focus:ring-0" aria-label="Maximum price" />
                            </div>
                        </div>
                    </aside>

                    {/* Product Grid */}
                    <div className="flex-1 w-full">
                        {loading ? (
                            <div className="text-center py-20">
                                <div className="inline-block border-4 border-black bg-brutal-yellow px-8 py-4 shadow-brutal animate-pulse">
                                    <span className="text-2xl font-black uppercase">{t('general.loading')}</span>
                                </div>
                            </div>
                        ) : allProducts.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="inline-block border-4 border-black bg-white px-8 py-4 shadow-brutal">
                                    <span className="text-2xl font-black uppercase">{t('product.noProducts') || 'No products found'}</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Product counter & View Toggle */}
                                <div className="mb-6 flex items-center justify-between border-b-4 border-black pb-4">
                                    <p className="font-black text-lg uppercase">
                                        {lang === 'zh'
                                            ? `显示 ${allProducts.length} / ${totalProducts} 件商品`
                                            : `Showing ${allProducts.length} of ${totalProducts} products`}
                                    </p>
                                    <div className="flex gap-2">
                                        <button onClick={() => setViewMode('grid')} className={`p-2 border-4 border-black transition-colors ${viewMode === 'grid' ? 'bg-black text-white' : 'bg-white hover:bg-brutal-yellow'}`} aria-label={lang === 'zh' ? '网格视图' : 'Grid View'}>
                                            <span className="material-symbols-outlined font-black">grid_view</span>
                                        </button>
                                        <button onClick={() => setViewMode('list')} className={`p-2 border-4 border-black transition-colors ${viewMode === 'list' ? 'bg-black text-white' : 'bg-white hover:bg-brutal-yellow'}`} aria-label={lang === 'zh' ? '列表视图' : 'List View'}>
                                            <span className="material-symbols-outlined font-black">view_list</span>
                                        </button>
                                    </div>
                                </div>

                                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10" : "flex flex-col gap-6"}>
                                    {allProducts.map((product) => (
                                        <article key={product.id} className={`group border-4 border-black shadow-brutal-lg transition-all bg-white flex ${viewMode === 'grid' ? 'flex-col h-full' : 'flex-col sm:flex-row'} hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-xl`}>
                                            <div className={`relative ${viewMode === 'grid' ? 'aspect-square border-b-4 border-black' : 'w-full sm:w-64 aspect-square border-b-4 border-black sm:border-b-0 sm:border-r-4'} overflow-hidden bg-[#F3F3F3] shrink-0`}>
                                                <Link to={`/product/${product.id}`} className="block w-full h-full p-8 relative z-10">
                                                    <img src={product.image} alt={localized(product, 'name', lang)} className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110" loading="lazy" />
                                                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                                                        {product.tags?.filter(tag => ['HOT','NEW','SALE','PREMIUM'].includes(tag.toUpperCase())).map(tag => (
                                                            <span key={tag} className={`text-xs font-black uppercase px-3 py-1 border-2 border-black shadow-brutal ${tag === 'HOT' ? 'bg-brutal-pink text-white' : tag === 'NEW' ? 'bg-brutal-blue text-white' : tag === 'SALE' ? 'bg-brutal-red text-white' : tag === 'PREMIUM' ? 'bg-brutal-yellow text-black' : 'bg-white text-black'}`}>{t(`tag.${tag}`) || tag}</span>
                                                        ))}
                                                    </div>
                                                    {product.original_price && product.original_price > product.price && (
                                                        <div className="absolute top-4 right-4 bg-brutal-red text-white text-sm font-black px-3 py-1 border-2 border-black -rotate-6">
                                                            -{Math.round((1 - product.price / product.original_price) * 100)}%
                                                        </div>
                                                    )}
                                                </Link>
                                            </div>
                                            <div className="flex flex-col flex-1">
                                                <Link to={`/product/${product.id}`} className="p-6 flex flex-col flex-1">
                                                    <div className="flex items-center gap-1 mb-2">
                                                        <span className="material-symbols-outlined text-xl font-black text-brutal-yellow filled">star</span>
                                                        <span className="font-black text-lg">{product.rating}</span>
                                                        {product.review_count !== undefined && <span className="text-sm font-bold text-gray-500">({product.review_count})</span>}
                                                    </div>
                                                    {product.categories && (
                                                        <span className="text-xs font-black uppercase bg-black text-white px-2 py-0.5 inline-block mb-2 w-fit">{t(`cat.${product.categories.name}`) || product.categories.name}</span>
                                                    )}
                                                    <h3 className="text-2xl font-black uppercase leading-tight mb-2 font-display">{localized(product, 'name', lang)}</h3>
                                                    <p className="text-sm font-bold text-gray-700 mb-6 line-clamp-2">{localized(product, 'description', lang)}</p>
                                                    <div className="mt-auto flex items-end justify-between">
                                                        <div className="flex-1"></div>
                                                        <div className="flex flex-col text-right">
                                                            {product.original_price && <span className="text-sm font-bold line-through">{formatPrice(product.original_price)}</span>}
                                                            <span className="text-3xl font-black tracking-tighter">{formatPrice(product.price)}</span>
                                                        </div>
                                                    </div>
                                                </Link>
                                                <div className="flex border-t-4 border-black mt-auto">
                                                <button onClick={() => { if (!isLoggedIn) { navigate('/login'); return; } addToCart(product); }} className="flex-1 bg-brutal-blue text-white py-3 border-r-2 border-black flex items-center justify-center gap-2 font-black uppercase hover:bg-black transition-colors" aria-label={`${t('product.addToCart')}: ${localized(product, 'name', lang)}`}>
                                                    <span className="material-symbols-outlined">add_shopping_cart</span>
                                                    {t('product.addToCart')}
                                                </button>
                                                {isLoggedIn && (
                                                    <button onClick={() => toggleWishlist(product.id)} className={`px-4 py-3 flex items-center justify-center transition-colors ${isInWishlist(product.id) ? 'bg-brutal-pink text-white' : 'bg-white hover:bg-brutal-pink hover:text-white'}`} aria-label={isInWishlist(product.id) ? t('product.removeFromWishlist') : t('product.addToWishlist')}>
                                                        <span className={`material-symbols-outlined ${isInWishlist(product.id) ? 'filled' : ''}`}>favorite</span>
                                                    </button>
                                                )}
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>

                                {/* Load More Button */}
                                {page < totalPages && (
                                    <div className="text-center mt-12">
                                        <button
                                            onClick={handleLoadMore}
                                            disabled={loadingMore}
                                            className="border-4 border-black bg-brutal-yellow px-12 py-4 font-black uppercase text-xl shadow-brutal hover:-translate-y-1 hover:shadow-brutal-xl transition-all disabled:opacity-50 disabled:cursor-wait flex items-center gap-3 mx-auto"
                                        >
                                            {loadingMore ? (
                                                <>
                                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                                    {t('general.loading')}
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined">expand_more</span>
                                                    {lang === 'zh' ? '加载更多' : 'Load More'}
                                                    <span className="text-sm font-bold opacity-70">({allProducts.length}/{totalProducts})</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ProductDetail = () => {
    const { id } = useParams();
    const { addToCart, toggleWishlist, isInWishlist, isLoggedIn, formatPrice } = useApp();
    const { t, lang } = useI18n();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewTitle, setReviewTitle] = useState('');
    const [reviewBody, setReviewBody] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    const selectableSpecKeys = [
        'Color', 'Colors', 'Size', 'String Tension', 'Weight / Grip', 'Grip / Weight', 'Flex', 'Format', 'Type'
    ];
    const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        Promise.all([api.getProduct(id), api.getReviews(id)])
            .then(([prod, revs]) => { 
                setProduct(prod); 
                setReviews(revs); 

                if (prod && prod.specs) {
                    const defaults: { [key: string]: string } = {};
                    Object.entries(prod.specs).forEach(([k, v]) => {
                        if (selectableSpecKeys.includes(k) && typeof v === 'string') {
                            const options = v.split(/\||\n/).map(s => {
                                if (s.includes(':')) return s.split(':')[1].trim();
                                return s.trim();
                            });
                            if (options.length > 0) defaults[k] = options[0];
                        }
                    });
                    setSelectedOptions(defaults);
                }

                // Log browsing behavior
                if (isLoggedIn) {
                    api.logBrowse(prod.id, prod.category_id).catch(() => {});
                }

                // Check for review parameter
                const params = new URLSearchParams(window.location.search);
                if (params.get('review') === 'true') {
                    setShowReviewForm(true);
                    // Scroll to review form after a short delay
                    setTimeout(() => {
                        const el = document.getElementById('review-form-anchor');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 500);
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [id]);

    const handleAddToCart = () => {
        if (!product) return;
        if (!isLoggedIn) { navigate('/login'); return; }
        addToCart(product, 1, Object.keys(selectedOptions).length > 0 ? selectedOptions : undefined);
        const title = localized(product, 'name', lang);
        alert(`${t('product.addToCart')} ${title} ${t('general.success')}`);
    };

    const submitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product) return;
        setReviewSubmitting(true);
        try {
            const newReview = await api.createReview({ product_id: product.id, rating: reviewRating, title: reviewTitle, body: reviewBody });
            setReviews(prev => [newReview, ...prev]);
            setShowReviewForm(false);
            setReviewTitle(''); setReviewBody(''); setReviewRating(5);
        } catch (err: any) { alert(err.message); }
        finally { setReviewSubmitting(false); }
    };

    if (loading || !product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="border-4 border-black bg-brutal-yellow px-8 py-4 shadow-brutal animate-pulse">
                    <span className="text-2xl font-black uppercase">{t('general.loading')}</span>
                </div>
            </div>
        );
    }

    const sortedImages = (product.product_images || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const allImages = sortedImages.length > 0 ? sortedImages.map(img => img.url) : [product.image].filter(Boolean);

    const translateSpecValue = (val: string) => {
        if (!val || typeof val !== 'string') return val;

        const applyRegex = (str: string) => str
            .replace(/\blbs\b/gi, '磅')
            .replace(/(\d+)\s*kg\b/gi, '$1千克')
            .replace(/(\d+)\s*g\b/gi, '$1克')
            .replace(/(\d+)\s*mm\b/gi, '$1毫米')
            .replace(/(\d+)\s*cm\b/gi, '$1厘米')
            .replace(/(\d+)\s*m\b/gi, '$1米')
            .replace(/(\d+)\s*min\b/gi, '$1分钟')
            .replace(/\bHours?\b/gi, '小时')
            .replace(/\bWeeks?\b/gi, '周')
            .replace(/\bMonths?\b/gi, '个月')
            .replace(/\bMonthly\b/gi, '每月')
            .replace(/\bYears?\b/gi, '年')
            .replace(/\bPacks?\b/gi, '装')
            .replace(/\bPieces?\b/gi, '件')
            .replace(/\bUnknown\b/gi, '未知');

        // Check for compound strings first so we don't accidentally match a massive un-translated string in the fallback dictionary
        if (val.includes('|') || val.includes('\n')) {
            return val.split(/\||\n/).map(segment => {
                if (segment.includes(':')) {
                    const parts = segment.split(':');
                    const k = parts[0].trim();
                    const v = parts.slice(1).join(':').trim();
                    
                    const tK = t(`spec.${k}`);
                    const finalK = tK !== `spec.${k}` ? tK : k;
                    
                    const tV = t(`specVal.${v}`);
                    let finalV = tV !== `specVal.${v}` ? tV : v;
                    
                    if (lang === 'zh' && finalV === v) finalV = applyRegex(finalV);
                    return `${finalK}: ${finalV}`;
                } else {
                    const tV = t(`specVal.${segment.trim()}`);
                    let finalV = tV !== `specVal.${segment.trim()}` ? tV : segment.trim();
                    if (lang === 'zh' && finalV === segment.trim()) finalV = applyRegex(finalV);
                    return finalV;
                }
            }).join(' | ');
        }

        // Single value lookup
        const transKey = `specVal.${val}`;
        const trans = t(transKey);
        let finalTrans = (trans && trans !== transKey) ? trans : val;

        if (lang === 'zh' && finalTrans === val) {
            finalTrans = applyRegex(finalTrans);
        }

        return finalTrans;
    };

    return (
        <div className="min-h-screen">
            <section className="relative min-h-[80vh] bg-brutal-yellow border-b-4 border-black overflow-hidden flex flex-col lg:flex-row">
                <div className="lg:w-1/2 p-8 md:p-16 flex flex-col justify-center relative z-20">
                    {product.categories && (
                        <span className="inline-block bg-black text-white text-sm font-black px-4 py-1 uppercase shadow-brutal mb-4 w-fit">{t(`cat.${product.categories.name}`) || product.categories.name}</span>
                    )}
                    <div className="flex items-center gap-2 mb-8">
                        <div className="flex bg-white border-4 border-black p-1 gap-1" aria-label={`${t('product.rating')}: ${product.rating} out of 5`}>
                            {[...Array(5)].map((_, i) => (
                                <span key={i} className={`material-symbols-outlined ${i < Math.floor(product.rating) ? 'filled text-brutal-red' : 'text-gray-300'}`}>star</span>
                            ))}
                        </div>
                        <span className="font-black text-xl italic underline decoration-4 underline-offset-4">({reviews.length} {t('product.reviews').toUpperCase()})</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black uppercase leading-[0.85] tracking-tighter mb-4 font-display">{localized(product, 'name', lang)}</h1>
                    <p className="text-2xl font-bold bg-white p-6 border-4 border-black shadow-brutal mb-8 max-w-xl">{localized(product, 'description', lang).toUpperCase()}</p>
                    {product.specs && Object.keys(product.specs).length > 0 && (
                        <div className="flex flex-col gap-6 mb-12">
                            {Object.entries(product.specs).map(([key, val], idx) => {
                                const tKey = t(`spec.${key}`);
                                const displayKey = tKey !== `spec.${key}` ? tKey : key;
                                const isSelectable = selectableSpecKeys.includes(key);

                                if (isSelectable && typeof val === 'string') {
                                    const options = val.split(/\||\n/).map(s => {
                                        let rawVal = s;
                                        let displayVal = s;
                                        if (s.includes(':')) {
                                            const parts = s.split(':');
                                            rawVal = parts.slice(1).join(':').trim();
                                            displayVal = translateSpecValue(s);
                                        } else {
                                            rawVal = s.trim();
                                            displayVal = translateSpecValue(s.trim());
                                        }
                                        return { raw: rawVal, display: displayVal };
                                    });

                                    return (
                                        <div key={key} className="bg-white border-4 border-black shadow-brutal p-4">
                                            <span className="block text-sm font-black uppercase mb-3 text-brutal-blue">{displayKey}:</span>
                                            <div className="flex flex-wrap gap-3">
                                                {options.map((opt, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setSelectedOptions(prev => ({ ...prev, [key]: opt.raw }))}
                                                        className={`border-4 px-4 py-2 font-black text-lg transition-transform ${selectedOptions[key] === opt.raw ? 'border-black bg-black text-white scale-105' : 'border-black bg-white text-black hover:-translate-y-1'}`}
                                                    >
                                                        {opt.display}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={key} className={`${idx === 0 ? 'bg-brutal-blue text-white' : idx === 1 ? 'bg-brutal-green text-black' : 'bg-white text-black'} border-4 border-black shadow-brutal p-4 w-fit inline-block mr-4 mb-4`}>
                                        <span className="block text-xs font-black uppercase mb-1 opacity-80">{displayKey}</span>
                                        <span className="text-xl md:text-2xl font-black uppercase italic">{translateSpecValue(val as string)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className="lg:w-1/2 relative bg-white lg:border-l-4 border-black min-h-[400px] flex flex-col items-center justify-center p-8">
                    <div className="absolute inset-0 bg-[radial-gradient(#000_1.5px,transparent_1.5px)] [background-size:20px_20px] opacity-20"></div>
                    <img src={allImages[activeImage] || product.image} alt={localized(product, 'name', lang)} className="relative z-10 w-auto h-[400px] md:h-[600px] object-contain drop-shadow-[15px_15px_0px_rgba(0,0,0,0.2)] transition-transform hover:scale-105 duration-300" />
                    {allImages.length > 1 && (
                        <div className="relative z-10 flex gap-4 mt-8">
                            {allImages.map((img, idx) => (
                                <button key={idx} onClick={() => setActiveImage(idx)} className={`w-20 h-20 border-4 ${activeImage === idx ? 'border-brutal-blue' : 'border-black'} overflow-hidden bg-white`} aria-label={`Image ${idx + 1}`}>
                                    <img src={img} alt="" className="w-full h-full object-contain" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <div className="max-w-[1600px] mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                <div className="lg:col-span-8 space-y-16">
                    <div id="review-form-anchor"></div>
                    <section aria-label={t('product.reviews')}>
                        <h3 className="text-5xl font-black uppercase mb-12 flex items-center gap-4 italic font-display">
                            <span className="bg-brutal-red text-white p-2 border-4 border-black text-3xl">★</span>
                            {t('product.reviews')} ({reviews.length})
                        </h3>
                        {isLoggedIn && !showReviewForm && (
                            <button onClick={() => setShowReviewForm(true)} className="mb-8 bg-brutal-green border-4 border-black px-6 py-3 font-black uppercase shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                                {t('product.writeReview')}
                            </button>
                        )}
                        {showReviewForm && (
                            <form onSubmit={submitReview} className="bg-white border-4 border-black p-8 shadow-brutal mb-8 space-y-4">
                                <div>
                                    <label className="font-black uppercase text-sm block mb-2">{t('product.rating')}</label>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button key={star} type="button" onClick={() => setReviewRating(star)} className="text-3xl" aria-label={`${star} stars`}>
                                                <span className={`material-symbols-outlined ${star <= reviewRating ? 'filled text-brutal-yellow' : 'text-gray-300'}`}>star</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="review-title" className="font-black uppercase text-sm block mb-2">{t('product.reviewTitle')}</label>
                                    <input id="review-title" type="text" value={reviewTitle} onChange={e => setReviewTitle(e.target.value)} className="w-full p-3 border-4 border-black font-bold focus:ring-0" />
                                </div>
                                <div>
                                    <label htmlFor="review-body" className="font-black uppercase text-sm block mb-2">{t('product.reviewBody')}</label>
                                    <textarea id="review-body" rows={4} value={reviewBody} onChange={e => setReviewBody(e.target.value)} className="w-full p-3 border-4 border-black font-bold focus:ring-0 resize-none" />
                                </div>
                                <div className="flex gap-4">
                                    <button type="submit" disabled={reviewSubmitting} className="bg-brutal-blue text-white border-4 border-black px-6 py-3 font-black uppercase shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50">
                                        {reviewSubmitting ? t('general.loading') : t('general.submit')}
                                    </button>
                                    <button type="button" onClick={() => setShowReviewForm(false)} className="border-4 border-black px-6 py-3 font-black uppercase shadow-brutal bg-white">{t('general.cancel')}</button>
                                </div>
                            </form>
                        )}
                        <div className="space-y-6">
                            {reviews.length === 0 ? (
                                <div className="border-4 border-black border-dashed p-8 text-center">
                                    <p className="text-xl font-bold text-gray-500">{t('product.noReviews')}</p>
                                </div>
                            ) : reviews.map(review => (
                                <div key={review.id} className="bg-white border-4 border-black p-6 shadow-brutal">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-brutal-blue border-2 border-black flex items-center justify-center text-white font-black text-lg">
                                                {(review.profiles?.name || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-black">{review.profiles?.name || 'Anonymous'}</p>
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <span key={i} className={`material-symbols-outlined text-sm ${i < review.rating ? 'filled text-brutal-yellow' : 'text-gray-300'}`}>star</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-gray-500">{new Date(review.created_at).toLocaleDateString()}</span>
                                    </div>
                                    {review.title && <h4 className="font-black text-lg mb-2">{review.title}</h4>}
                                    {review.body && <p className="font-bold text-gray-700">{review.body}</p>}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
                <aside className="lg:col-span-4 lg:sticky lg:top-28">
                    <div className="bg-white border-4 border-black shadow-brutal-lg p-8 space-y-8">
                        <div>
                            <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-2 font-display">{localized(product, 'name', lang)}</h2>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-brutal-green border-2 border-black rounded-full"></span>
                                <span className="text-sm font-black uppercase italic">{product.stock && product.stock > 0 ? t('product.inStock') : t('product.outOfStock')}</span>
                            </div>
                        </div>
                        <div className="flex items-end gap-4 bg-brutal-yellow border-4 border-black p-4 shadow-brutal">
                            <span className="text-6xl font-black">{formatPrice(product.price)}</span>
                            {product.original_price && <span className="text-2xl font-black text-brutal-red line-through italic mb-1">{formatPrice(product.original_price)}</span>}
                        </div>
                        <div className="space-y-4">
                            <button onClick={handleAddToCart} className="w-full bg-brutal-red text-white border-4 border-black shadow-brutal p-6 text-2xl font-black uppercase italic hover:bg-brutal-yellow hover:text-black transition-all active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-center gap-3" aria-label={`${t('product.addToCart')}: ${localized(product, 'name', lang)}`}>
                                {t('product.addToCart')}
                                <span className="material-symbols-outlined font-black">shopping_cart</span>
                            </button>
                            {isLoggedIn && (
                                <button onClick={() => toggleWishlist(product.id)} className={`w-full border-4 border-black shadow-brutal p-4 text-xl font-black uppercase flex items-center justify-center gap-3 transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${isInWishlist(product.id) ? 'bg-brutal-pink text-white' : 'bg-white'}`} aria-label={isInWishlist(product.id) ? t('product.removeFromWishlist') : t('product.addToWishlist')}>
                                    <span className={`material-symbols-outlined ${isInWishlist(product.id) ? 'filled' : ''}`}>favorite</span>
                                    {isInWishlist(product.id) ? t('product.removeFromWishlist') : t('product.addToWishlist')}
                                </button>
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export const StorePage = () => {
    const { t, lang } = useI18n();
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getStores()
            .then((data: any[]) => setStores(data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="pb-24 pt-12 min-h-screen">
            {/* Hero */}
            <div className="max-w-[1600px] mx-auto px-6 lg:px-12 mb-16">
                <div className="relative border-4 border-black shadow-brutal-xl overflow-hidden bg-gradient-to-br from-brutal-pink via-brutal-blue to-brutal-yellow p-10 md:p-16">
                    <div className="absolute inset-0 bg-[radial-gradient(#000_1.5px,transparent_1.5px)] [background-size:20px_20px] opacity-10"></div>
                    <div className="relative z-10">
                        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase leading-[0.85] font-display drop-shadow-[4px_4px_0px_#000]">
                            {t('nav.store')}
                        </h1>
                        <p className="text-2xl font-bold text-white bg-black inline-block px-4 py-2 mt-6">
                            {t('store.subtitle') || 'Discover trusted sellers and their curated collections'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block border-4 border-black bg-brutal-yellow px-8 py-4 shadow-brutal animate-pulse">
                            <span className="text-2xl font-black uppercase">{t('general.loading')}</span>
                        </div>
                    </div>
                ) : stores.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="inline-block border-4 border-black bg-white px-8 py-4 shadow-brutal">
                            <span className="material-symbols-outlined text-6xl mb-4 block text-gray-400">storefront</span>
                            <span className="text-2xl font-black uppercase">{t('store.empty') || 'No stores yet'}</span>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {stores.map((store: any) => (
                            <Link to={`/store/${store.id}`} key={store.id} className="group border-4 border-black shadow-brutal-lg bg-white hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-xl transition-all flex flex-col">
                                {/* Store Header */}
                                <div className="p-8 flex items-start gap-6 border-b-4 border-black">
                                    <div className="w-20 h-20 bg-brutal-blue border-4 border-black flex items-center justify-center text-4xl shadow-brutal flex-shrink-0 group-hover:rotate-6 transition-transform">
                                        {store.logo || '🏪'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <h2 className="text-2xl font-black uppercase tracking-tighter font-display">{localized(store, 'name', lang)}</h2>
                                            {store.verified && (
                                                <span className="inline-flex items-center gap-1 bg-brutal-green border-2 border-black px-2 py-0.5 text-xs font-black uppercase">
                                                    <span className="material-symbols-outlined text-sm filled">verified</span>
                                                    {t('store.verified') || 'Verified'}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm font-bold text-gray-600 line-clamp-2">{localized(store, 'description', lang)}</p>
                                    </div>
                                </div>
                                {/* Store Stats */}
                                <div className="flex divide-x-4 divide-black">
                                    <div className="flex-1 p-4 text-center">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <span className="material-symbols-outlined text-brutal-yellow filled text-lg">star</span>
                                            <span className="text-2xl font-black">{store.rating}</span>
                                        </div>
                                        <span className="text-xs font-black uppercase text-gray-500">{t('store.rating') || 'Rating'}</span>
                                    </div>
                                    <div className="flex-1 p-4 text-center">
                                        <div className="text-2xl font-black mb-1">{store.product_count || 0}</div>
                                        <span className="text-xs font-black uppercase text-gray-500">{t('store.products') || 'Products'}</span>
                                    </div>
                                    <div className="flex-1 p-4 text-center">
                                        <div className="text-xl font-black mb-1 truncate">{store.profiles?.name || 'Seller'}</div>
                                        <span className="text-xs font-black uppercase text-gray-500">{t('store.owner') || 'Owner'}</span>
                                    </div>
                                </div>
                                {/* CTA */}
                                <div className="border-t-4 border-black bg-brutal-yellow p-4 text-center font-black uppercase text-lg group-hover:bg-brutal-blue group-hover:text-white transition-colors flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined">storefront</span>
                                    {t('store.visit') || 'Visit Store'}
                                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export const StoreDetailPage = () => {
    const { id } = useParams();
    const { addToCart, toggleWishlist, isInWishlist, isLoggedIn, formatPrice } = useApp();
    const { t, lang } = useI18n();
    const navigate = useNavigate();
    const [store, setStore] = useState<any>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [storeSearch, setStoreSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        api.getStore(id)
            .then(data => setStore(data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (!id) return;
        setIsSearching(true);
        const params: any = {};
        if (storeSearch) params.search = storeSearch;
        
        api.getStoreProducts(id, params)
            .then(data => setProducts(data))
            .catch(() => { })
            .finally(() => setIsSearching(false));
    }, [id, storeSearch]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="border-4 border-black bg-brutal-yellow px-8 py-4 shadow-brutal animate-pulse">
                    <span className="text-2xl font-black uppercase">{t('general.loading')}</span>
                </div>
            </div>
        );
    }

    if (!store) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="border-4 border-black bg-white px-8 py-4 shadow-brutal text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-400 block mb-4">error</span>
                    <span className="text-2xl font-black uppercase">{t('store.notFound') || 'Store not found'}</span>
                    <Link to="/store" className="block mt-4 text-brutal-blue font-black underline">{t('store.backToStores') || '← Back to stores'}</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-24 min-h-screen">
            {/* Store Banner */}
            <div className="relative border-b-4 border-black overflow-hidden bg-gradient-to-br from-brutal-blue to-brutal-pink">
                <div className="absolute inset-0 bg-[radial-gradient(#000_1.5px,transparent_1.5px)] [background-size:20px_20px] opacity-10"></div>
                <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 flex items-center gap-8 relative z-10">
                    <div className="w-28 h-28 bg-white border-4 border-black flex items-center justify-center text-6xl shadow-brutal-lg flex-shrink-0">
                        {store.logo || '🏪'}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase font-display drop-shadow-[4px_4px_0px_#000]">
                                {localized(store, 'name', lang)}
                            </h1>
                            {store.verified && (
                                <span className="inline-flex items-center gap-1 bg-brutal-green border-2 border-black px-3 py-1 text-sm font-black uppercase shadow-brutal">
                                    <span className="material-symbols-outlined text-sm filled">verified</span>
                                    {t('store.verified') || 'Verified'}
                                </span>
                            )}
                        </div>
                        <p className="text-xl font-bold text-white/90 max-w-2xl">{localized(store, 'description', lang)}</p>
                        <div className="flex items-center gap-6 mt-4">
                            <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded">
                                <span className="material-symbols-outlined text-brutal-yellow filled">star</span>
                                <span className="font-black text-white text-lg">{store.rating}</span>
                            </div>
                            <span className="font-bold text-white/80">{products.length} {t('store.products') || 'Products'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Back link and Search */}
            <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-8 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <Link to="/store" className="inline-flex items-center gap-2 border-4 border-black px-4 py-2 font-black uppercase shadow-brutal bg-white hover:bg-brutal-yellow transition-colors w-fit">
                    <span className="material-symbols-outlined">arrow_back</span>
                    {t('store.backToStores') || 'All Stores'}
                </Link>
                
                <div className="w-full md:w-96 relative">
                    <input 
                        type="text" 
                        value={storeSearch}
                        onChange={e => setStoreSearch(e.target.value)}
                        placeholder={t('nav.search') + ' in this store...'}
                        className="w-full border-4 border-black p-3 pr-12 font-bold shadow-brutal focus:ring-0 focus:-translate-x-1 focus:-translate-y-1 transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {isSearching ? (
                            <span className="material-symbols-outlined animate-spin text-gray-400">progress_activity</span>
                        ) : (
                            <span className="material-symbols-outlined text-black font-black">search</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-8">
                {isSearching && products.length === 0 ? (
                   <div className="text-center py-20 animate-pulse">
                        <span className="text-2xl font-black uppercase">{t('general.loading')}...</span>
                   </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="inline-block border-4 border-black border-dashed bg-white px-8 py-4">
                            <span className="text-xl font-black uppercase">
                                {storeSearch ? 'No matching products found' : 'No products in this store yet'}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                        {products.map((product) => (
                            <article key={product.id} className="group border-4 border-black shadow-brutal-lg transition-all bg-white flex flex-col h-full hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-xl">
                                <Link to={`/product/${product.id}`} className="flex flex-col flex-1">
                                    <div className="relative aspect-square border-b-4 border-black overflow-hidden p-8 bg-[#F3F3F3]">
                                        <img src={product.image} alt={localized(product, 'name', lang)} className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110" loading="lazy" />
                                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                                            {product.tags?.filter(tag => ['HOT','NEW','SALE','PREMIUM'].includes(tag.toUpperCase())).map(tag => (
                                                <span key={tag} className={`text-xs font-black uppercase px-3 py-1 border-2 border-black shadow-brutal ${tag === 'HOT' ? 'bg-brutal-pink text-white' : tag === 'NEW' ? 'bg-brutal-blue text-white' : tag === 'SALE' ? 'bg-brutal-red text-white' : tag === 'PREMIUM' ? 'bg-brutal-yellow text-black' : 'bg-white text-black'}`}>{t(`tag.${tag}`) || tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="flex items-center gap-1 mb-2">
                                            <span className="material-symbols-outlined text-xl text-brutal-yellow filled">star</span>
                                            <span className="font-black text-lg">{product.rating}</span>
                                        </div>
                                        <h3 className="text-2xl font-black uppercase leading-tight mb-2 font-display">{localized(product, 'name', lang)}</h3>
                                        <p className="text-sm font-bold text-gray-700 mb-6 line-clamp-2">{localized(product, 'description', lang)}</p>
                                        <div className="mt-auto flex items-end justify-between">
                                            <div className="flex flex-col">
                                                {product.original_price && <span className="text-sm font-bold line-through">{formatPrice(product.original_price)}</span>}
                                                <span className="text-3xl font-black tracking-tighter">{formatPrice(product.price)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                                <div className="flex border-t-4 border-black">
                                    <button onClick={() => { if (!isLoggedIn) { navigate('/login'); return; } addToCart(product); }} className="flex-1 bg-brutal-blue text-white py-3 border-r-2 border-black flex items-center justify-center gap-2 font-black uppercase hover:bg-black transition-colors" aria-label={`${t('product.addToCart')}: ${localized(product, 'name', lang)}`}>
                                        <span className="material-symbols-outlined">add_shopping_cart</span>
                                        {t('product.addToCart')}
                                    </button>
                                    {isLoggedIn && (
                                        <button onClick={() => toggleWishlist(product.id)} className={`px-4 py-3 flex items-center justify-center transition-colors ${isInWishlist(product.id) ? 'bg-brutal-pink text-white' : 'bg-white hover:bg-brutal-pink hover:text-white'}`} aria-label={isInWishlist(product.id) ? t('product.removeFromWishlist') : t('product.addToWishlist')}>
                                            <span className={`material-symbols-outlined ${isInWishlist(product.id) ? 'filled' : ''}`}>favorite</span>
                                        </button>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};