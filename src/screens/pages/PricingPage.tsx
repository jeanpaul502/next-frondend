'use client';

import React from 'react';
import Navbar from '../welcome/Navbar';
import Footer from '../welcome/Footer';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { APP_NAME } from '../../utils/config';
import { Button } from '@/components/ui/button';

const PricingPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white font-sans selection:bg-blue-500/30">
            <Navbar />
            <div className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">Tarifs & <span className="text-blue-500">Soutien</span></h1>
                    <p className="text-lg text-gray-400 max-w-6xl mx-auto leading-relaxed">
                        {APP_NAME} est gratuit parce que l'accès à la culture doit l'être. Vos dons nous permettent cependant de survivre, de payer les serveurs et d'améliorer la plateforme chaque jour.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8 mt-12">

                    {/* Free Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="relative rounded-3xl p-8 bg-zinc-900/50 border border-zinc-800 flex flex-col h-full hover:border-zinc-700 transition-colors"
                    >
                        <h3 className="text-2xl font-bold text-white mb-2">Gratuit</h3>
                        <div className="text-4xl font-bold text-white mb-6">0€ <span className="text-sm font-normal text-gray-400">/mois</span></div>
                        <p className="text-gray-400 text-sm mb-8 h-12 flex items-center">L'essentiel du divertissement, accessible à tous sans frais.</p>

                        <ul className="space-y-4 mb-8 flex-1">
                            {[
                                "Films, Séries & Animés illimités",
                                "Chaînes TV (Généralistes)",
                                "Demandes d'ajout (délai 12-48h)",
                                "Qualité HD (720p/1080p)",
                                "Publicités légères"
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                                    <Icon icon="lucide:check" className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                            <li className="flex items-start gap-3 text-gray-600 text-sm opacity-50 line-through">
                                <Icon icon="lucide:x" className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <span>Chaînes Sport & Live Events</span>
                            </li>
                        </ul>
                        <div className="mt-auto">
                            <Button href="/register" className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl h-12 cursor-pointer">
                                Commencer Gratuitement
                            </Button>
                        </div>
                    </motion.div>

                    {/* Premium Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative rounded-3xl p-8 bg-black/80 border border-blue-500/50 shadow-[0_0_40px_rgba(37,99,235,0.15)] flex flex-col h-full z-10"
                    >
                        <div className="absolute top-0 right-0 py-1.5 px-3 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-bl-xl rounded-tr-2xl text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                            Recommandé
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
                        <div className="text-4xl font-bold text-white mb-6">3.99€ <span className="text-sm font-normal text-gray-400">/mois</span></div>
                        <p className="text-blue-200/80 text-sm mb-8 h-12 flex items-center">Pour les passionnés de sport et de cinéma qui veulent plus.</p>

                        <ul className="space-y-4 mb-8 flex-1">
                            {[
                                "Tout du plan Gratuit",
                                "Chaînes TV + BOUQUET SPORT",
                                "Priorité de traitement des demandes",
                                "Qualité 4K HDR (si disponible)",
                                "Zéro Publicité",
                                "Badge Premium sur le profil"
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-white text-sm">
                                    <Icon icon="lucide:check" className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-auto w-full cursor-not-allowed">
                            <Button disabled className="w-full bg-zinc-800 text-zinc-500 font-bold rounded-xl h-12 opacity-50 pointer-events-none border border-zinc-700 shadow-none">
                                Indisponible
                            </Button>
                        </div>
                    </motion.div>

                    {/* VIP Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="relative rounded-3xl p-8 bg-zinc-900/50 border border-amber-500/30 flex flex-col h-full hover:border-amber-500/50 transition-colors"
                    >
                        <h3 className="text-2xl font-bold text-amber-500 mb-2">VIP / Donateur</h3>
                        <div className="text-4xl font-bold text-white mb-6">9.99€ <span className="text-sm font-normal text-gray-400">/mois</span></div>
                        <p className="text-gray-400 text-sm mb-8 h-12 flex items-center">Le soutien ultime pour le développement de la plateforme.</p>

                        <ul className="space-y-4 mb-8 flex-1">
                            {[
                                "Accès complet Premium",
                                "Statut VIP Discord & App",
                                "Clé API Personnelle (Documentation)",
                                "Support Dédié Prioritaire",
                                "Early Access (Bêtas)",
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                                    <Icon icon="lucide:check" className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                            <li className="flex items-start gap-3 text-amber-400/80 text-sm font-medium">
                                <Icon icon="lucide:sparkles" className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <span>Bientôt: App Smart TV dédiée</span>
                            </li>
                        </ul>
                        <div className="mt-auto w-full cursor-not-allowed">
                            <Button disabled className="w-full bg-zinc-800 text-zinc-500 font-bold rounded-xl h-12 opacity-50 pointer-events-none border border-zinc-700 shadow-none">
                                Indisponible
                            </Button>
                        </div>
                    </motion.div>

                </div>
            </div>

        </div>
    );
};

export default PricingPage;
