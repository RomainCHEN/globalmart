import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n';

interface Address {
    street: string;
    city: string;
    state?: string;
    zip: string;
    country: string;
}

interface AddressSelectorProps {
    address: Address;
    onChange: (updated: Address) => void;
}

// Simple hierarchical data for China and USA
const addressData: Record<string, Record<string, string[]>> = {
    'China': {
        'Beijing': ['Beijing'],
        'Shanghai': ['Shanghai'],
        'Guangdong': ['Guangzhou', 'Shenzhen', 'Dongguan', 'Foshan', 'Zhongshan'],
        'Zhejiang': ['Hangzhou', 'Ningbo', 'Wenzhou', 'Jiaxing'],
        'Jiangsu': ['Nanjing', 'Suzhou', 'Wuxi', 'Changzhou'],
        'Sichuan': ['Chengdu', 'Mianyang'],
        'Fujian': ['Fuzhou', 'Xiamen', 'Quanzhou'],
        'Hubei': ['Wuhan'],
        'Hunan': ['Changsha'],
        'Macau': ['Macau'],
        'Hong Kong': ['Hong Kong'],
    },
    'USA': {
        'California': ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose'],
        'New York': ['New York City', 'Buffalo', 'Rochester'],
        'Texas': ['Houston', 'Austin', 'Dallas', 'San Antonio'],
        'Florida': ['Miami', 'Orlando', 'Tampa'],
        'Washington': ['Seattle', 'Spokane'],
        'Illinois': ['Chicago'],
    },
    'Other': {}
};

export const AddressSelector: React.FC<AddressSelectorProps> = ({ address, onChange }) => {
    const { t } = useI18n();
    const countries = Object.keys(addressData);
    
    // Internal state to track if we should show manual inputs
    const [isManual, setIsManual] = useState(address.country !== '' && !addressData[address.country]);

    const handleCountryChange = (country: string) => {
        if (country === 'Other') {
            setIsManual(true);
            onChange({ ...address, country: '', state: '', city: '' });
        } else {
            setIsManual(false);
            onChange({ ...address, country, state: '', city: '' });
        }
    };

    const handleStateChange = (state: string) => {
        onChange({ ...address, state, city: '' });
    };

    const handleCityChange = (city: string) => {
        onChange({ ...address, city });
    };

    const states = address.country && addressData[address.country] ? Object.keys(addressData[address.country]) : [];
    const cities = address.country && address.state && addressData[address.country][address.state] ? addressData[address.country][address.state] : [];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Street Address */}
            <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-black uppercase text-gray-600">{t('checkout.street')}</label>
                <input
                    type="text"
                    value={address.street}
                    onChange={e => onChange({ ...address, street: e.target.value })}
                    className="w-full p-3 border-3 border-black focus:ring-0 text-sm font-bold"
                    placeholder="123 Main St"
                />
            </div>

            {/* Country */}
            <div className="space-y-1">
                <label className="text-xs font-black uppercase text-gray-600">{t('checkout.country')}</label>
                {!isManual ? (
                    <select
                        value={address.country}
                        onChange={e => handleCountryChange(e.target.value)}
                        className="w-full p-3 border-3 border-black focus:ring-0 text-sm font-bold bg-white"
                    >
                        <option value="">-- {t('checkout.selectCountry') || 'Select Country'} --</option>
                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                ) : (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={address.country}
                            onChange={e => onChange({ ...address, country: e.target.value })}
                            className="flex-1 p-3 border-3 border-black focus:ring-0 text-sm font-bold"
                            placeholder="Country"
                        />
                        <button 
                            type="button"
                            onClick={() => { setIsManual(false); onChange({ ...address, country: '', state: '', city: '' }); }}
                            className="px-3 border-3 border-black bg-gray-200 hover:bg-gray-300"
                            title="Back to list"
                        >
                            <span className="material-symbols-outlined text-sm">list</span>
                        </button>
                    </div>
                )}
            </div>

            {/* State / Province */}
            <div className="space-y-1">
                <label className="text-xs font-black uppercase text-gray-600">{t('checkout.state') || 'State/Province'}</label>
                {!isManual && states.length > 0 ? (
                    <select
                        value={address.state || ''}
                        onChange={e => handleStateChange(e.target.value)}
                        className="w-full p-3 border-3 border-black focus:ring-0 text-sm font-bold bg-white"
                    >
                        <option value="">-- {t('checkout.selectState') || 'Select State'} --</option>
                        {states.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                ) : (
                    <input
                        type="text"
                        value={address.state || ''}
                        onChange={e => onChange({ ...address, state: e.target.value })}
                        className="w-full p-3 border-3 border-black focus:ring-0 text-sm font-bold"
                        placeholder="State/Province"
                    />
                )}
            </div>

            {/* City */}
            <div className="space-y-1">
                <label className="text-xs font-black uppercase text-gray-600">{t('checkout.city')}</label>
                {!isManual && cities.length > 0 ? (
                    <select
                        value={address.city}
                        onChange={e => handleCityChange(e.target.value)}
                        className="w-full p-3 border-3 border-black focus:ring-0 text-sm font-bold bg-white"
                    >
                        <option value="">-- {t('checkout.selectCity') || 'Select City'} --</option>
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                ) : (
                    <input
                        type="text"
                        value={address.city}
                        onChange={e => onChange({ ...address, city: e.target.value })}
                        className="w-full p-3 border-3 border-black focus:ring-0 text-sm font-bold"
                        placeholder="City"
                    />
                )}
            </div>

            {/* Zip */}
            <div className="space-y-1">
                <label className="text-xs font-black uppercase text-gray-600">{t('checkout.zip')}</label>
                <input
                    type="text"
                    value={address.zip}
                    onChange={e => onChange({ ...address, zip: e.target.value })}
                    className="w-full p-3 border-3 border-black focus:ring-0 text-sm font-bold"
                    placeholder="Zip/Postal Code"
                />
            </div>
        </div>
    );
};
