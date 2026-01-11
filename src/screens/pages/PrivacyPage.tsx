'use client';

import React from 'react';
import Navbar from '../welcome/Navbar';
import Footer from '../welcome/Footer';
import { motion } from 'framer-motion';

const PrivacyPage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white font-sans selection:bg-blue-500/30">
            <Navbar />
            <div className="relative pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="prose prose-invert max-w-none"
                >
                    <h1 className="text-4xl font-bold mb-8 text-blue-500">Politique de confidentialité</h1>

                    <p className="text-gray-300 mb-6">
                        Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">1. Collecte d'informations</h2>
                    <p className="text-gray-400 mb-4">
                        Nous recueillons des informations lorsque vous vous inscrivez sur notre site, vous connectez à votre compte, faites un achat, participez à un concours, et/ou lorsque vous vous déconnectez. Les informations recueillies incluent votre nom, votre adresse e-mail, numéro de téléphone, et/ou carte de crédit.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">2. Utilisation des informations</h2>
                    <p className="text-gray-400 mb-4">
                        Toutes les informations que nous recueillons auprès de vous peuvent être utilisées pour :
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Personnaliser votre expérience et répondre à vos besoins individuels</li>
                            <li>Fournir un contenu publicitaire personnalisé</li>
                            <li>Améliorer notre site Web</li>
                            <li>Améliorer le service client et vos besoins de prise en charge</li>
                            <li>Vous contacter par e-mail</li>
                            <li>Administrer un concours, une promotion, ou une enquête</li>
                        </ul>
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">3. Confidentialité du commerce en ligne</h2>
                    <p className="text-gray-400 mb-4">
                        Nous sommes les seuls propriétaires des informations recueillies sur ce site. Vos informations personnelles ne seront pas vendues, échangées, transférées, ou données à une autre société pour n'importe quelle raison, sans votre consentement.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">4. Divulgation à des tiers</h2>
                    <p className="text-gray-400 mb-4">
                        Nous ne vendons, n'échangeons et ne transférons pas vos informations personnelles identifiables à des tiers. Cela ne comprend pas les tierces parties de confiance qui nous aident à exploiter notre site Web ou à mener nos affaires, tant que ces parties conviennent de garder ces informations confidentielles.
                    </p>

                    <h2 className="text-2xl font-semibold mt-8 mb-4">5. Protection des informations</h2>
                    <p className="text-gray-400 mb-4">
                        Nous mettons en œuvre une variété de mesures de sécurité pour préserver la sécurité de vos informations personnelles. Nous utilisons un cryptage à la pointe de la technologie pour protéger les informations sensibles transmises en ligne.
                    </p>
                </motion.div>
            </div>
            <Footer />
        </div>
    );
};

export default PrivacyPage;
