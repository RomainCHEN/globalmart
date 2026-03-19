import React, { createContext, useContext, useState, useCallback, PropsWithChildren } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

let toastId = 0;

export const ToastProvider = ({ children }: PropsWithChildren) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const bgColors: Record<ToastType, string> = {
        success: 'bg-brutal-green',
        error: 'bg-brutal-red text-white',
        info: 'bg-brutal-blue text-white',
        warning: 'bg-brutal-yellow',
    };

    const icons: Record<ToastType, string> = {
        success: 'check_circle',
        error: 'error',
        info: 'info',
        warning: 'warning',
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none" role="alert" aria-live="polite">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto border-4 border-black shadow-brutal px-6 py-4 font-black uppercase text-sm flex items-center gap-3 min-w-[300px] max-w-[450px] ${bgColors[toast.type]}`}
                        role="status"
                        style={{ animation: 'slideInRight 0.3s ease-out' }}
                    >
                        <span className="material-symbols-outlined text-2xl">{icons[toast.type]}</span>
                        <span className="flex-1 normal-case font-bold">{toast.message}</span>
                        <button
                            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                            className="material-symbols-outlined text-lg hover:scale-125 transition-transform"
                            aria-label="Close notification"
                        >close</button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
