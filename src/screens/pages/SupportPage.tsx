'use client';

import React from 'react';
import Navbar from '../welcome/Navbar';
import Footer from '../welcome/Footer';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';

const SupportPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white font-sans selection:bg-blue-500/30">
            <Navbar />
            <div className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto text-center"
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">Centre d'<span className="text-blue-500">Aide</span></h1>
                    <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
                        Trouvez rapidement des réponses à vos questions et tirez le meilleur parti de votre expérience de streaming.
                    </p>

                    {/* Search Bar */}
                    <div className="relative max-w-2xl mx-auto mb-16">
                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                            <Icon icon="lucide:search" className="h-6 w-6 text-gray-500" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-16 pr-6 py-5 bg-zinc-900/50 border border-zinc-700/50 rounded-2xl leading-5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 text-lg transition-all shadow-xl"
                            placeholder="Rechercher un problème (ex: erreur de lecture, compte...)"
                        />
                    </div>

                    {/* Categories Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 px-4">
                        {[
                            { title: "Compte & Profil", icon: "lucide:user", desc: "Gérer vos paramètres" },
                            { title: "Streaming & Lecture", icon: "lucide:play-circle", desc: "Problèmes de vidéo" },
                            { title: "Appareils", icon: "lucide:monitor-smartphone", desc: "TV, Mobile, Tablette" },
                            { title: "Facturation", icon: "lucide:credit-card", desc: "Abonnements & Paiements" },
                            { title: "Confidentialité", icon: "lucide:shield", desc: "Sécurité & Données" },
                            { title: "Nouveautés", icon: "lucide:sparkles", desc: "Fonctionnalités à venir" },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -5, backgroundColor: "rgba(39, 39, 42, 0.8)" }}
                                className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 text-left cursor-pointer transition-all hover:border-blue-500/30 group"
                            >
                                <div className="h-12 w-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                                    <Icon icon={item.icon} className="text-blue-500 h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                                <p className="text-sm text-gray-400">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Direct Help CTA */}
                    <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/20 rounded-3xl p-8 md:p-12 relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="text-left">
                                <h3 className="text-2xl font-bold mb-2 text-white">Vous ne trouvez pas votre réponse ?</h3>
                                <p className="text-gray-400">Notre équipe de support est disponible pour vous aider personnellement.</p>
                            </div>
                            <div className="flex gap-4">
                                <a href="/faq">
                                    <Button variant="outline" className="border-zinc-700 hover:bg-zinc-800 text-white h-12 px-6 rounded-xl">
                                        Voir la FAQ
                                    </Button>
                                </a>
                                <a href="/contact">
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-6 rounded-xl">
                                        Contactez-nous
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
            <Footer />
        </div>
    );
};

export default SupportPage;
