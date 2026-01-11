'use client';

import React from 'react';
import Navbar from '../welcome/Navbar';
import Footer from '../welcome/Footer';
import { motion } from 'framer-motion';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const FaqPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white font-sans selection:bg-blue-500/30">
            <Navbar />
            <div className="relative pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">Foire Aux <span className="text-blue-500">Questions</span></h1>
                    <p className="text-lg text-gray-400 text-center mb-16 max-w-2xl mx-auto">
                        Retrouvez ici les réponses aux questions les plus fréquentes concernant l'utilisation de la plateforme.
                    </p>

                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {[
                            {
                                question: "Est-ce vraiment gratuit ?",
                                answer: "Oui, l'accès à la bibliothèque de base est totalement gratuit. Nous proposons une offre Premium optionnelle pour soutenir la plateforme et accéder à des fonctionnalités exclusives (4K, zéro pub), mais l'expérience gratuite reste très complète."
                            },
                            {
                                question: "Comment installer l'application sur ma TV ?",
                                answer: "Vous pouvez télécharger notre APK directement depuis la page Ressources ou utiliser notre Web App si votre TV dispose d'un navigateur récent. Une application native pour Samsung et LG est en cours de développement."
                            },
                            {
                                question: "La qualité des vidéos saccade, que faire ?",
                                answer: "Notre lecteur s'adapte automatiquement à votre connexion. Si vous rencontrez des problèmes, essayez de réduire manuellement la qualité dans les paramètres du lecteur ou vérifiez votre connexion internet."
                            },
                            {
                                question: "Puis-je télécharger les films pour les voir hors ligne ?",
                                answer: "Oui, cette fonctionnalité est disponible sur l'application mobile. Il suffit de cliquer sur l'icône de téléchargement à côté de l'épisode ou du film."
                            },
                            {
                                question: "Comment faire une demande d'ajout ?",
                                answer: "Vous pouvez suggérer des films ou séries directement depuis votre espace utilisateur dans la section « Demandes ». Les membres Premium sont prioritaires."
                            }
                        ].map((item, i) => (
                            <AccordionItem key={i} value={`item-${i}`} className="border border-zinc-800 bg-zinc-900/30 rounded-xl px-4">
                                <AccordionTrigger className="text-lg font-medium hover:text-blue-400 hover:no-underline">{item.question}</AccordionTrigger>
                                <AccordionContent className="text-gray-400 leading-relaxed">
                                    {item.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </motion.div>
            </div>
            <Footer />
        </div>
    );
};

export default FaqPage;
