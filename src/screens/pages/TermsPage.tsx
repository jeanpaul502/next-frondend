'use client';

import React from 'react';
import Navbar from '../welcome/Navbar';
import Footer from '../welcome/Footer';
import { motion } from 'framer-motion';

const TermsPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white font-sans selection:bg-blue-500/30">
            <Navbar />
            <div className="relative pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="prose prose-invert max-w-none"
                >
                    <h1 className="text-4xl font-bold mb-8 text-blue-500">Conditions d'utilisation</h1>

                    <p className="text-gray-300 mb-6">
                        Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptation des conditions</h2>
                    <p className="text-gray-400 mb-4">
                        En accédant et en utilisant ce site web, vous acceptez d'être lié par ces conditions d'utilisation, toutes les lois et réglementations applicables, et vous acceptez que vous êtes responsable du respect de toutes les lois locales applicables.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">2. Licence d'utilisation</h2>
                    <p className="text-gray-400 mb-4">
                        Il est permis de télécharger temporairement une copie des documents (information ou logiciel) sur le site web pour une visualisation transitoire personnelle et non commerciale uniquement.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">3. Clause de non-responsabilité</h2>
                    <p className="text-gray-400 mb-4">
                        Les documents sur le site web sont fournis "tels quels". Nous ne donnons aucune garantie, expresse ou implicite, et déclinons par la présente toute autre garantie.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">4. Limitations</h2>
                    <p className="text-gray-400 mb-4">
                        En aucun cas, nous ou nos fournisseurs ne serons responsables de tout dommage (y compris, sans limitation, les dommages pour perte de données ou de profit, ou en raison d'une interruption d'activité) découlant de l'utilisation ou de l'incapacité d'utiliser les documents sur le site.
                    </p>
                </motion.div>
            </div>
            <Footer />
        </div>
    );
};

export default TermsPage;
