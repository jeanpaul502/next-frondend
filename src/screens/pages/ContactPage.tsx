'use client';

import React from 'react';
import Navbar from '../welcome/Navbar';
import Footer from '../welcome/Footer';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';

const ContactPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white font-sans selection:bg-blue-500/30">
            <Navbar />
            <div className="relative pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full"
                >
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold mb-6">Contactez <span className="text-blue-500">Nous</span></h1>
                        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                            Une question, un problème ou une suggestion ? Notre équipe est là pour vous aider 24/7.
                        </p>
                    </div>

                    <motion.div
                        className="bg-zinc-900/30 p-8 md:p-10 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl"
                    >
                        <form className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-gray-400 pl-1 uppercase tracking-wide">Nom</label>
                                    <div className="relative">
                                        <input type="text" className="w-full bg-black/40 border border-zinc-700/50 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all text-sm" placeholder="Votre nom" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-gray-400 pl-1 uppercase tracking-wide">Email</label>
                                    <div className="relative">
                                        <input type="email" className="w-full bg-black/40 border border-zinc-700/50 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all text-sm" placeholder="votre@email.com" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-gray-400 pl-1 uppercase tracking-wide">Sujet</label>
                                <div className="relative">
                                    <Icon icon="lucide:chevron-down" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none w-4 h-4" />
                                    <select className="w-full bg-black/40 border border-zinc-700/50 rounded-xl px-4 py-3.5 text-white text-sm focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all appearance-none cursor-pointer">
                                        <option className="bg-zinc-900 text-gray-300">Problème technique</option>
                                        <option className="bg-zinc-900 text-gray-300">Question sur le compte</option>
                                        <option className="bg-zinc-900 text-gray-300">Partenariat / Affiliation</option>
                                        <option className="bg-zinc-900 text-gray-300">Suggestion de contenu</option>
                                        <option className="bg-zinc-900 text-gray-300">Autre demande</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-semibold text-gray-400 pl-1 uppercase tracking-wide">Message</label>
                                <textarea className="w-full bg-black/40 border border-zinc-700/50 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all h-40 resize-none text-sm leading-relaxed" placeholder="Comment pouvons-nous vous aider ?"></textarea>
                            </div>

                            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold h-14 rounded-xl text-base shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 transition-all transform hover:-translate-y-0.5 mt-2">
                                Envoyer le message
                                <Icon icon="lucide:send" className="ml-2 h-4 w-4" />
                            </Button>
                        </form>
                    </motion.div>
                </motion.div>
            </div>
            <Footer />
        </div>
    );
};

export default ContactPage;
