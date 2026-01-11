'use client';

import React from 'react';
import Navbar from '../welcome/Navbar';
import Footer from '../welcome/Footer';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

const SolutionsPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white font-sans selection:bg-blue-500/30">
            <Navbar />
            <div className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">Nos <span className="text-blue-500">Solutions</span></h1>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        Une expérience adaptée à tous vos écrans et tous vos besoins.
                    </p>
                </motion.div>

                <div className="space-y-20">
                    {/* Feature 1 */}
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="flex-1 space-y-6">
                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Icon icon="lucide:cast" className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-white">Streaming Multi-Écrans</h2>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                Commencez un film sur votre téléphone dans le métro, et reprenez-le exactement au même endroit sur votre TV en rentrant chez vous. Notre synchronisation cloud fonctionne instantanément sur tous vos appareils.
                            </p>
                        </div>
                        <div className="flex-1 h-64 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-3xl border border-zinc-700 flex items-center justify-center">
                            <span className="text-zinc-600 font-mono text-sm">[Illustration App Devices]</span>
                        </div>
                    </div>

                    {/* Feature 2 */}
                    <div className="flex flex-col md:flex-row-reverse items-center gap-12">
                        <div className="flex-1 space-y-6">
                            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <Icon icon="lucide:zap" className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-3xl font-bold text-white">Technologie Adaptative</h2>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                Notre lecteur intelligent adapte la qualité du flux vidéo en temps réel selon votre connexion internet. Profitez d'une image fluide, même avec une faible connexion 4G.
                            </p>
                        </div>
                        <div className="flex-1 h-64 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-3xl border border-zinc-700 flex items-center justify-center">
                            <span className="text-zinc-600 font-mono text-sm">[Illustration Speed/Quality]</span>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default SolutionsPage;
