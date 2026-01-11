'use client';

import React from 'react';
import Navbar from '../welcome/Navbar';
import Footer from '../welcome/Footer';
import { motion } from 'framer-motion';

const CookiesPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white font-sans selection:bg-blue-500/30">
            <Navbar />
            <div className="relative pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="prose prose-invert max-w-none"
                >
                    <h1 className="text-4xl font-bold mb-8 text-blue-500">Politique des Cookies</h1>

                    <p className="text-gray-300 mb-6">
                        Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">1. Qu'est-ce qu'un cookie ?</h2>
                    <p className="text-gray-400 mb-4">
                        Un cookie est un petit fichier texte enregistré sur votre ordinateur ou appareil mobile lorsque vous visitez un site web. Il permet au site de mémoriser vos actions et préférences (telles que la connexion, la langue, la taille de la police et d'autres préférences d'affichage) sur une période donnée.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">2. Comment utilisons-nous les cookies ?</h2>
                    <p className="text-gray-400 mb-2">
                        Nous utilisons les cookies pour :
                    </p>
                    <ul className="list-disc pl-5 mb-4 space-y-1 text-gray-400">
                        <li>Vous garder connecté</li>
                        <li>Comprendre comment vous utilisez notre site</li>
                        <li>Mémoriser vos préférences</li>
                        <li>Améliorer la vitesse et la sécurité du site</li>
                    </ul>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">3. Types de cookies utilisés</h2>
                    <div className="space-y-4">
                        <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                            <h4 className="font-bold text-white">Cookies Essentiels</h4>
                            <p className="text-sm text-gray-400">Nécessaires au fonctionnement du site. Vous ne pouvez pas les refuser.</p>
                        </div>
                        <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                            <h4 className="font-bold text-white">Cookies Analytiques</h4>
                            <p className="text-sm text-gray-400">Nous aident à comprendre comment les visiteurs interagissent avec le site.</p>
                        </div>
                    </div>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">4. Gérer vos préférences</h2>
                    <p className="text-gray-400 mb-4">
                        Vous pouvez contrôler et/ou supprimer les cookies comme vous le souhaitez. Vous pouvez supprimer tous les cookies déjà présents sur votre ordinateur et vous pouvez configurer la plupart des navigateurs pour qu'ils bloquent leur installation.
                    </p>
                </motion.div>
            </div>
            <Footer />
        </div>
    );
};

export default CookiesPage;
