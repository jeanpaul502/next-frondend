'use client';

import React from 'react';
import Navbar from '../welcome/Navbar';
import Footer from '../welcome/Footer';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

const ResourcesPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white font-sans selection:bg-blue-500/30">
            <Navbar />
            <div className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">Ressources & <span className="text-blue-500">Guides</span></h1>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        Tout ce dont vous avez besoin pour profiter pleinement de votre expérience de streaming.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6">
                    <a href="#" className="block group">
                        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl h-full hover:border-blue-500/50 transition-all hover:bg-zinc-900">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                                <Icon icon="lucide:tv" className="w-6 h-6 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-white">Installation TV</h3>
                            <p className="text-sm text-gray-400">
                                Guide complet pour installer notre application sur Android TV, FireStick et Samsung Tizen.
                            </p>
                        </div>
                    </a>

                    <a href="#" className="block group">
                        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl h-full hover:border-blue-500/50 transition-all hover:bg-zinc-900">
                            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
                                <Icon icon="lucide:smartphone" className="w-6 h-6 text-purple-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-white">Application Mobile</h3>
                            <p className="text-sm text-gray-400">
                                Téléchargez l'APK pour Android ou découvrez comment l'installer sur iOS (PWA/TestFlight).
                            </p>
                        </div>
                    </a>

                    <a href="#" className="block group">
                        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl h-full hover:border-blue-500/50 transition-all hover:bg-zinc-900">
                            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-500/20 transition-colors">
                                <Icon icon="lucide:shield-check" className="w-6 h-6 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-white">Sécurité & VPN</h3>
                            <p className="text-sm text-gray-400">
                                Pourquoi et comment utiliser un VPN ? Nos recommandations pour protéger votre vie privée.
                            </p>
                        </div>
                    </a>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ResourcesPage;
