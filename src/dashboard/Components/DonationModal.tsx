'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { APP_NAME } from '../../utils/config';

interface DonationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const DonationModal = ({ isOpen, onClose }: DonationModalProps) => {
    const [selectedMethod, setSelectedMethod] = useState<string>('paypal');

    const paymentMethods = [
        { id: 'paypal', label: 'PayPal', icon: 'logos:paypal' },
        { id: 'card', label: 'Carte de Crédit', icon: 'logos:mastercard' },
        { id: 'mobile_money', label: 'Mobile Money', icon: 'mdi:cellphone-wireless' },
    ];

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleBackdropClick}
                        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()} // Prevent close on modal click
                            className="w-full max-w-md cursor-default"
                        >
                            <div className="relative overflow-hidden rounded-2xl bg-[#1a1d26] border border-white/10 shadow-2xl">
                                {/* Header Gradient (Blue) */}
                                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-600/20 to-transparent pointer-events-none" />

                                {/* Close Button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors z-10 cursor-pointer"
                                >
                                    <Icon icon="lucide:x" className="w-5 h-5" />
                                </button>

                                <div className="relative p-6 md:p-8">
                                    {/* Donation Icon & Title */}
                                    <div className="flex flex-col items-center text-center mb-8">
                                        <div className="w-20 h-20 rounded-full bg-blue-600/10 flex items-center justify-center mb-4 ring-1 ring-blue-600/30 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                                            {/* Donation Icon */}
                                            <Icon icon="solar:hand-heart-bold" className="w-10 h-10 text-blue-500 -rotate-12" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white mb-2">Soutenir {APP_NAME}</h2>
                                        <p className="text-sm text-gray-400">
                                            Votre soutien nous aide à grandir
                                        </p>
                                    </div>

                                    {/* Payment Methods - Icons & Text */}
                                    <div className="space-y-3 mb-8">
                                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1 mb-2 block">
                                            Moyen de paiement
                                        </label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {paymentMethods.map((method) => (
                                                <button
                                                    key={method.id}
                                                    onClick={() => setSelectedMethod(method.id)}
                                                    className={`relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all duration-300 group overflow-hidden h-24 cursor-pointer ${selectedMethod === method.id
                                                        ? 'bg-blue-600/10 border-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.1)]'
                                                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                                        }`}
                                                >
                                                    {/* Selection Indicator (Small dot top right) */}
                                                    <div className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full border flex items-center justify-center transition-colors ${selectedMethod === method.id
                                                        ? 'border-blue-600'
                                                        : 'border-gray-500 group-hover:border-gray-400 opacity-50'
                                                        }`}>
                                                        {selectedMethod === method.id && (
                                                            <motion.div
                                                                layoutId="selection-dot"
                                                                className="w-1.5 h-1.5 rounded-full bg-blue-600"
                                                            />
                                                        )}
                                                    </div>

                                                    <Icon
                                                        icon={method.icon}
                                                        className={`w-7 h-7 flex-shrink-0 ${method.id === 'mobile_money' ? 'text-white' : ''}`}
                                                    />

                                                    <span className={`text-[11px] font-medium text-center leading-tight line-clamp-2 ${selectedMethod === method.id ? 'text-white' : 'text-gray-400'}`}>
                                                        {method.label}
                                                    </span>

                                                    {/* Glow Effect on Hover */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="bg-blue-600/5 border border-blue-600/10 rounded-xl p-4 mb-8">
                                        <div className="flex items-start gap-3">
                                            <Icon icon="lucide:info" className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-semibold text-blue-200">Pourquoi faire un don ?</h4>
                                                <p className="text-xs text-gray-400 leading-relaxed">
                                                    L'application est 100% gratuite. Vos dons nous permettent de maintenir nos serveurs haute performance et de rémunérer notre équipe de développeurs.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button (Blue) */}
                                    <button
                                        className="w-full relative group overflow-hidden rounded-xl bg-blue-600 hover:bg-blue-700 p-4 transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-blue-600/25 cursor-pointer"
                                        onClick={() => {
                                            // TODO: Implement actual donation logic
                                            // console.log('Donate via', selectedMethod);
                                        }}
                                    >
                                        <div className="relative z-10 flex items-center justify-center gap-2">
                                            <span className="font-bold text-white text-lg">Faire le don</span>
                                            {/* Removed specific arrow icon, left empty div or nothing as requested for 'without icon' but keeping text centered. Wait, user said "remove arrow, put icon... wait no leave without icon". So just text. */}
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
