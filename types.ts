export interface Product {
    id: string;
    name: string;
    name_zh?: string;
    description: string;
    description_zh?: string;
    price: number;
    original_price?: number;
    image: string;
    category_id?: string;
    categories?: { name: string; slug: string } | null;
    rating: number;
    review_count?: number;
    stock?: number;
    tags?: string[];
    specs?: { [key: string]: string };
    seller_id?: string;
    store_id?: string;
    stores?: { id: string; name: string; logo: string; verified: boolean } | null;
    product_images?: ProductImage[];
    enabled?: boolean;
    created_at?: string;
}

export interface ProductImage {
    id: string;
    url: string;
    sort_order: number;
}

export interface CartItem extends Product {
    quantity: number;
    options?: { [key: string]: string };
}

export interface Order {
    id: string;
    user_id: string;
    status: 'pending' | 'shipped' | 'delivered' | 'hold' | 'cancelled' | 'refund_requested' | 'refunded';
    total: number;
    store_id?: string;
    stores?: { id: string; name: string; logo: string };
    shipping_name: string;
    shipping_street: string;
    shipping_city: string;
    shipping_zip: string;
    shipping_country: string;
    payment_method: string;
    created_at: string;
    updated_at: string;
    shipped_at?: string;
    cancelled_at?: string;
    hold_at?: string;
    delivered_at?: string;
    refund_requested_at?: string;
    refunded_at?: string;
    refund_reason?: string;
    refund_reject_reason?: string;
    order_items?: OrderItem[];
    profiles?: { name: string; email: string };
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string;
    product_name: string;
    product_image: string;
    price: number;
    quantity: number;
}

export interface Address {
    name: string;
    street: string;
    city: string;
    zip: string;
    country: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: 'user' | 'admin' | 'seller';
    shipping_address?: Address;
}

export interface Review {
    id: string;
    product_id: string;
    user_id: string;
    rating: number;
    title: string;
    body: string;
    created_at: string;
    profiles?: { name: string; avatar: string };
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    icon: string;
}

export interface Store {
    id: string;
    seller_id: string;
    name: string;
    name_zh?: string;
    description: string;
    description_zh?: string;
    logo: string;
    banner: string;
    verified: boolean;
    rating: number;
    product_count?: number;
    profiles?: { name: string; avatar: string };
    created_at?: string;
}

export interface WishlistItem {
    id: string;
    user_id: string;
    product_id: string;
    created_at: string;
    products?: Product;
}