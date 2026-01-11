'use client';

import React from 'react';
import { Navbar } from './Components/Navbar';
import { motion } from 'framer-motion';
import { Tv } from 'lucide-react';

export const Series = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-black text-white overflow-hidden">
            <Navbar />

            <div className="relative flex flex-col items-start md:items-center justify-center min-h-screen px-4 text-left md:text-center z-10">
                {/* Background ambient glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-2xl mx-auto flex flex-col items-start md:items-center"
                >
                    {/* TV Icon */}
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-8 backdrop-blur-sm border border-white/10 shadow-xl">
                        <Tv className="w-9 h-9 text-white/80 opacity-80" />
                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white tracking-wide">
                        Catalogue Séries
                    </h2>

                    <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto font-light">
                        Retrouvez prochainement l'intégralité des catalogues <span className="text-white font-medium">Netflix</span>, <span className="text-white font-medium">Amazon Prime</span>, <span className="text-white font-medium">Disney+</span> et <span className="text-white font-medium">Apple TV+</span> réunis ici. Les meilleures séries du monde, accessibles en un clic.
                    </p>

                    <div className="pt-8">
                        <span className="inline-block h-px w-24 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
