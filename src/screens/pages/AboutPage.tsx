'use client';

import React from 'react';
import Navbar from '../welcome/Navbar';
import Footer from '../welcome/Footer';
import { motion } from 'framer-motion';
import { APP_NAME } from '../../utils/config';

const AboutPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white font-sans selection:bg-blue-500/30">
            <Navbar />
            <div className="relative pt-32 pb-20 px-6 max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto text-center"
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-8">À propos de <span className="text-blue-500">{APP_NAME}</span></h1>

                    <div className="prose prose-invert prose-lg mx-auto text-left space-y-8">
                        <p className="lead text-xl text-gray-300">
                            {APP_NAME} est né d'une idée simple : le divertissement culturel (cinéma, séries, documentaires) devrait être accessible à tous, librement et sans contrainte financière majeure.
                        </p>

                        <div className="bg-zinc-900/50 p-8 rounded-3xl border border-zinc-800">
                            <h3 className="text-2xl font-bold mb-4 text-white">Notre Mission</h3>
                            <p className="text-gray-400">
                                Nous construisons la plus grande médiathèque francophone libre d'accès. Notre plateforme agrège des milliers de contenus en haute qualité, organisés intelligemment pour vous offrir une expérience de streaming fluide, moderne et respectueuse de votre vie privée.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                                <h4 className="text-xl font-bold mb-3 text-blue-400">Pour la Communauté</h4>
                                <p className="text-sm text-gray-400">
                                    Nous sommes une plateforme communautaire. Les ajouts de contenu sont pilotés par vos demandes. Notre Discord est le cœur de notre évolution.
                                </p>
                            </div>
                            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
                                <h4 className="text-xl font-bold mb-3 text-blue-400">Qualité avant tout</h4>
                                <p className="text-sm text-gray-400">
                                    Nous privilégions toujours la qualité (1080p, 4K) et la stabilité des lecteurs vidéo sur la quantité de publicités intrusives.
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
            <Footer />
        </div>
    );
};

export default AboutPage;
