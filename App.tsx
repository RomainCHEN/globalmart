import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context';
import { I18nProvider } from './i18n';
import { ToastProvider } from './components/Toast';
import { MainLayout } from './layouts';
import { ShopHome, ProductDetail, StorePage, StoreDetailPage } from './pages/Shop';
import { Cart, Checkout, OrderDetails } from './pages/Order';
import { UserDashboard, AdminDashboard, SellerDashboard } from './pages/Dashboards';
import { LoginPage, RegisterPage } from './pages/Auth';

const App = () => {
    return (
        <I18nProvider>
            <AppProvider>
                <ToastProvider>
                <HashRouter>
                    <Routes>
                        <Route element={<MainLayout />}>
                            <Route path="/" element={<ShopHome />} />
                            <Route path="/product/:id" element={<ProductDetail />} />
                            <Route path="/store" element={<StorePage />} />
                            <Route path="/store/:id" element={<StoreDetailPage />} />
                            <Route path="/cart" element={<Cart />} />
                            <Route path="/checkout" element={<Checkout />} />
                            <Route path="/order/:id" element={<OrderDetails />} />
                            <Route path="/dashboard" element={<UserDashboard />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />
                        </Route>
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/seller" element={<SellerDashboard />} />
                    </Routes>
                </HashRouter>
                </ToastProvider>
            </AppProvider>
        </I18nProvider>
    );
};

export default App;