'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import Navbar from './Navbar';
import Footer from './Footer';
import ReviewModal from './ReviewModal';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '../../utils/config';
import { DonationModal } from '../../dashboard/Components/DonationModal';

const WelcomePage = () => {
  const [heroMovies, setHeroMovies] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);

  // Carousel State
  const [promoIndex, setPromoIndex] = useState(0);
  const promoImages = [
    { src: "/Nextmovie.jpg", label: "Films" },
  ];

  // Sport Carousel State
  const [sportIndex, setSportIndex] = useState(0);
  const sportImages = [
    "/footbal.jpg",
    "/Is-NBA-League-Pass-Worth-It-1024x576.png",
    "/5-WCH.webp"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setSportIndex((prev) => (prev + 1) % sportImages.length);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setPromoIndex((prev) => (prev + 1) % promoImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Fetch movies from API
  useEffect(() => {
    const fetchHeroMovies = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/movies/hero`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          // Filter out items without images if necessary, or take first 10
          setHeroMovies(data.slice(0, 10));
        }
      } catch (error) {
        console.error("Failed to fetch hero movies:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHeroMovies();
  }, []);

  // Auto-rotate background
  useEffect(() => {
    if (heroMovies.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroMovies.length);
    }, 120000);
    return () => clearInterval(interval);
  }, [heroMovies]);

  const changeSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const currentMovie = heroMovies[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white overflow-x-hidden font-sans selection:bg-blue-500/30">
      <Navbar />
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onSuccess={() => setIsReviewModalOpen(false)}
      />

      {/* Hero Section Style "Dribbble" */}
      <div className="relative min-h-[85vh] sm:min-h-screen w-full overflow-hidden flex flex-col justify-center">
        {/* Background Image Layer */}
        <AnimatePresence>
          {currentMovie && (
            <motion.div
              key={currentMovie.id}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 1 }}
              transition={{ duration: 2.0, ease: "easeInOut" }}
              className="absolute inset-0 z-0"
            >
              <div
                className="absolute inset-0 bg-cover bg-[left]"
                style={{ backgroundImage: `url('${currentMovie.backdropPath || currentMovie.posterPath}')` }}
              />
              {/* Gradients Overlay pour lisibilité */}
              <div className="absolute inset-0 bg-gradient-to-r from-black from-40% via-black/60 via-65% to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              {/* Grain texture for cinematic feel */}
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 pt-16 pb-8 sm:pt-20 sm:pb-10 lg:pt-20 lg:pb-12 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">

          {/* Left Column: Platform Info (Static) */}
          <div className="flex flex-col justify-center h-full pb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-4 sm:mb-6 text-white">
                Cinéma, Sport & TV :<br className="hidden sm:block" /> L'Expérience Streaming Ultime
              </h1>

              <p className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base text-gray-300 max-w-xl leading-relaxed mb-6 sm:mb-8">
                Une plateforme unique pour tout votre divertissement. Films, séries, chaînes TV et le meilleur du sport en direct. Profitez d'une qualité HD/4K exceptionnelle, accessible à tous gratuitement.
              </p>

              {/* Social Proof */}
              <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8 md:mb-10">
                <div className="flex -space-x-2 sm:-space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full border-2 border-black bg-gradient-to-tr ${i === 1 ? 'from-blue-600 to-purple-500' :
                      i === 2 ? 'from-indigo-500 to-sky-500' :
                        i === 3 ? 'from-emerald-500 to-lime-500' :
                          'from-amber-500 to-orange-500'
                      }`}></div>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center text-amber-400 space-x-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Icon key={i} icon="lucide:star" className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-300 font-medium">4.9/5 · 1.2k+ Évaluations</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <Button
                  size="default"
                  href="/register"
                  className="h-11 sm:h-12 px-6 sm:px-8 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base shadow-lg transition-all hover:scale-105 min-h-[44px]"
                >
                  Commencer Gratuitement
                </Button>
                <Button
                  onClick={() => setIsReviewModalOpen(true)}
                  size="default"
                  variant="outline"
                  className="h-11 px-6 rounded-md border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-md text-white font-semibold text-base transition-all hover:scale-105"
                >
                  <Icon icon="lucide:message-circle" className="w-4 h-4 mr-2" />
                  Laisser vos avis
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Movie Logo/Title */}
          <div className="hidden lg:block relative h-full w-full min-h-[50vh]">
            {heroMovies.map((movie, index) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: index === currentIndex ? 1 : 0,
                  y: index === currentIndex ? 0 : -20,
                  filter: index === currentIndex ? "blur(0px)" : "blur(10px)",
                  zIndex: index === currentIndex ? 10 : 0
                }}
                transition={{
                  opacity: { duration: index === currentIndex ? 1.0 : 0.5, delay: index === currentIndex ? 0.5 : 0 },
                  y: { duration: 0.8 },
                  filter: { duration: 0.8 }
                }}
                className="absolute inset-0 flex flex-col justify-end items-end pb-64 pr-10"
              >
                {movie.logoPath ? (
                  <img
                    src={movie.logoPath}
                    alt={movie.title}
                    className="max-w-[300px] max-h-[180px] object-contain drop-shadow-2xl"
                  />
                ) : (
                  <h2 className="text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-500 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] leading-tight uppercase font-serif tracking-tighter text-right">
                    {movie.title}
                  </h2>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Statistics & Partners Section (Merged Background) */}
      <div className="relative z-20 -mt-24 pb-12 bg-gradient-to-b from-transparent via-black/80 to-black backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6 xl:gap-10">
            {[
              { val: "19.66M", label: "Films Disponibles", icon: "lucide:film", color: "text-blue-400" },
              { val: "5.79M", label: "Utilisateurs Actifs", icon: "lucide:users", color: "text-purple-400" },
              { val: "32.63M", label: "Heures Visionnées", icon: "lucide:clock", color: "text-pink-400" },
              { val: "+7000", label: "Chaînes TV", icon: "lucide:tv", color: "text-red-400" },
              { val: "1.2M €", label: "Dons Récoltés", icon: "lucide:heart", color: "text-emerald-400" },
              { val: "24/7", label: "Streaming Gratuit", icon: "lucide:zap", color: "text-amber-400" }
            ].map((stat, idx) => (
              <div key={idx} className="group flex flex-col items-center justify-center transition-all duration-300 hover:-translate-y-1">
                {/* Stats & Label */}
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">
                    {stat.val}
                  </div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-widest whitespace-nowrap">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-16 pb-8">
            <span className="inline-block h-px w-1/3 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></span>
          </div>
        </div>

        {/* Partners Section (Inside combined background) */}
        <section className="py-4 overflow-hidden relative z-10">
          <div className="max-w-[1600px] mx-auto relative">
            <div className="text-center mb-12 space-y-3">
              <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto font-light leading-relaxed">
                Centralisez votre expérience. Accédez aux catalogues exclusifs de toutes les plateformes majeures sans multiplier les abonnements. Une agrégation intelligente pour un divertissement sans limite.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-8 md:gap-16 px-6">
              {[
                { name: "Netflix", icon: "logos:netflix" },
                { name: "Prime Video", icon: "simple-icons:prime", color: "#00A8E1" },
                { name: "HBO Max", icon: "simple-icons:hbo", color: "#FFFFFF" },
                { name: "Apple TV+", icon: "simple-icons:appletv", color: "#FFFFFF" },
                { name: "Hulu", icon: "simple-icons:hulu", color: "#1CE783" },
                { name: "Paramount+", icon: "simple-icons:paramountplus", color: "#0064FF" },
                { name: "Warner Bros", icon: "simple-icons:warnerbros", color: "#0072BC" },
                { name: "Sony", icon: "simple-icons:sony", color: "#FFFFFF" },
                { name: "DAZN", icon: "simple-icons:dazn", color: "#FFFFFF" },
              ].map((partner, idx) => (
                <div key={idx} className="flex flex-col items-center gap-3 group">
                  <div className="h-14 w-auto flex items-center justify-center transition-transform duration-300 hover:scale-110">
                    <Icon
                      icon={partner.icon}
                      className="h-full w-auto max-w-[140px] object-contain"
                      style={{ color: partner.color }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 font-medium tracking-wide group-hover:text-gray-300 transition-colors">
                    {partner.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Dual Banner Section - Refined */}
      <section className="py-8 px-6 -mt-6 relative z-20">
        <div className="max-w-[1400px] mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-0">

            {/* Main Premium Banner (Large) - 3 columns */}
            <div className="lg:col-span-3 relative rounded-3xl overflow-hidden bg-[#08090e] border border-white/10 shadow-2xl group">
              {/* Dynamic Background */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-[#08090e] to-[#08090e]" />
              </div>

              {/* Content */}
              <div className="relative z-10 p-8 md:p-10 flex flex-col justify-center h-full max-w-lg">

                <h3 className="text-xl md:text-2xl font-bold text-white mb-3 tracking-tight">
                  Une expérience de streaming <span className="text-blue-400">sans aucune limite</span>
                </h3>

                <p className="text-gray-400 text-sm md:text-base mb-6 leading-relaxed max-w-sm">
                  Accès illimité aux films, séries, animés et chaînes TV en direct. Qualité 4K HDR sans compromis.
                </p>

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => setIsDonationModalOpen(true)}
                    className="group cursor-pointer px-6 py-3 bg-[#e53965] hover:bg-[#d62f58] text-white font-bold rounded-xl transition-all hover:scale-105 shadow-lg shadow-[#e53965]/20 flex items-center gap-2 text-sm md:text-base"
                  >
                    <span>Faire un don</span>
                    <Icon icon="lucide:arrow-right" className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <div className="text-white font-bold text-lg ml-2">
                    0€ <span className="text-xs text-gray-400 font-normal">/mois</span>
                  </div>
                </div>
              </div>

              {/* Visual on the right - Extended with Fade & Blur */}
              <div className="absolute right-0 top-0 bottom-0 w-2/3 hidden md:block overflow-hidden rounded-r-3xl">
                <div className="relative w-full h-full">
                  <img
                    src="/Nextmovie.jpg"
                    alt="Films & Séries"
                    className="w-full h-full object-cover object-center"
                  />

                  {/* Complex Gradient Mask & Blur Effect */}
                  {/* 1. Solid fade from left (text area) */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#08090e] via-[#08090e]/80 to-transparent" />

                  {/* 2. Slight blur area before the text */}
                  <div className="absolute inset-y-0 left-0 w-1/3 backdrop-blur-[2px]" />

                  {/* 3. Bottom fade */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08090e]/50 to-transparent" />
                </div>
              </div>
            </div>

            {/* Secondary List (Transparent - No Banner Bg) */}
            <div className="lg:col-span-1 flex flex-col justify-center py-4 pl-4 lg:pl-6">
              <div className="space-y-3">
                {[
                  { text: "Téléchargements Hors-ligne", icon: "lucide:download" },
                  { text: "Approbation rapide des demandes", icon: "lucide:zap" },
                  { text: "Chaînes Sports & Événements Live", icon: "lucide:trophy" },
                  { text: "Films & Séries Illimités", icon: "lucide:film" },
                  { text: "Service API", icon: "lucide:server", isSoon: true },
                  { text: "Agent IA", icon: "lucide:bot" },
                  { text: "Support Prioritaire 24/7", icon: "lucide:headset" },
                  { text: "Applications Smart TV", icon: "lucide:monitor-smartphone", isSoon: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 group w-full">
                    {item.isSoon ? (
                      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                        <Icon icon="lucide:loader-2" className="w-3.5 h-3.5 text-white animate-spin" />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center border bg-green-500/20 border-green-500/30">
                        <Icon icon="lucide:check" className="w-3 h-3 text-green-500" />
                      </div>
                    )}

                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors truncate">
                        {item.text}
                      </span>
                      {item.isSoon && (
                        <span className="flex-shrink-0 text-[10px] font-medium text-yellow-500 tracking-wide">
                          arrive bientôt
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App Showcase Section - Redesigned */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-16">

            {/* Content Side - Left */}
            <div className="w-full lg:w-1/2 space-y-10">
              <div>
                <h2 className="text-2xl md:text-4xl font-bold text-white mb-5 leading-tight tracking-tight">
                  L'Art du Streaming <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Intelligent</span>
                </h2>
                <p className="text-gray-400 text-base leading-relaxed max-w-lg">
                  Une fusion parfaite entre design épuré et puissance technologique, pour un divertissement sans compromis.
                </p>
              </div>

              {/* Grid 2x2 for Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8">
                {[
                  {
                    title: "Recommandations IA",
                    desc: "Algorithme de pointe pour des suggestions sur-mesure.",
                    icon: "lucide:brain-circuit",
                    color: "text-blue-400",
                    bg: "bg-blue-900/20"
                  },
                  {
                    title: "Gratuit & Sans Publicité",
                    desc: "Accès illimité sans aucune interruption visuelle.",
                    icon: "lucide:infinity",
                    color: "text-red-400",
                    bg: "bg-red-900/20"
                  },
                  {
                    title: "Notifications Smart",
                    desc: "Alertes nouveautés via WhatsApp, Telegram & Email.",
                    icon: "custom:notification",
                    color: "text-amber-400",
                    bg: "bg-amber-900/20"
                  },
                  {
                    title: "Premium & Communauté",
                    desc: "Mode hors-ligne, dons et demandes d'ajout.",
                    icon: "lucide:crown",
                    color: "text-emerald-400",
                    bg: "bg-emerald-900/20"
                  }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-2 group">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.bg} ${item.color} group-hover:scale-110 transition-all duration-300 shadow-lg shadow-${item.color.split('-')[1]}-500/10`}>
                        {item.icon === 'custom:notification' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="w-5 h-5">
                            <g fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M18.75 9.71v-.705C18.75 5.136 15.726 2 12 2S5.25 5.136 5.25 9.005v.705a4.4 4.4 0 0 1-.692 2.375L3.45 13.81c-1.011 1.575-.239 3.716 1.52 4.214a25.8 25.8 0 0 0 14.06 0c1.759-.498 2.531-2.639 1.52-4.213l-1.108-1.725a4.4 4.4 0 0 1-.693-2.375Z" />
                              <path strokeLinecap="round" d="M7.5 19c.655 1.748 2.422 3 4.5 3s3.845-1.252 4.5-3" />
                            </g>
                          </svg>
                        ) : (
                          <Icon icon={item.icon} className="w-5 h-5" />
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white leading-tight">{item.title}</h3>
                    </div>
                    <p className="text-xs md:text-sm text-gray-500 leading-relaxed pl-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Side - Right (Sport Image) */}
            <div className="w-full lg:w-1/2 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 group h-[350px]">
                <AnimatePresence mode='wait'>
                  <motion.img
                    key={sportIndex}
                    src={sportImages[sportIndex]}
                    alt="Sports Live"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 3.0, ease: "easeInOut" }}
                    className="absolute inset-0 w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
                  />
                </AnimatePresence>

                {/* Gradients - Enhanced Depth Effect */}
                {/* 1. Main Fade from Bottom/Left (Text Area) */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#08090e] via-[#08090e]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#08090e] via-[#08090e]/50 to-transparent" />

                {/* 2. Radial Gradient to simulate "Tunnel/Corridor" depth */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-[#08090e] via-transparent to-transparent opacity-80" />

                {/* Content Inside Image - Bottom Position */}
                <div className="absolute bottom-0 left-0 p-8 md:p-10 w-full z-20">
                  <h3 className="text-3xl md:text-3xl font-black text-white italic tracking-tighter uppercase leading-none mb-2 drop-shadow-2xl">
                    Vivez le meilleur <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                      Du Sport
                    </span>
                  </h3>
                  <p className="text-gray-300 text-sm md:text-sm max-w-md line-clamp-2 leading-relaxed opacity-90">
                    Ligue 1, Champions League, NBA, UFC... Ne ratez plus aucun événement majeur.
                  </p>
                </div>
              </div>

              {/* Back Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600/20 to-red-600/20 rounded-3xl blur-2xl -z-10" />
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section - Side by Side Layout */}
      <section className="py-20 relative overflow-hidden">
        {/* Subtle Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#050505] to-black" />

        {/* Very subtle glow at the bottom */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[300px] bg-gradient-to-t from-black to-transparent pointer-events-none" />

        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-20">

            {/* Left Side: Popcorn Image - Aligned to Start (Left) */}
            <div className="w-full md:w-1/2 flex justify-center md:justify-start">
              <div className="relative w-[240px] md:w-[320px] lg:w-[360px]">

                {/* Floor Shadow (Circle Shadow) */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[60%] h-6 bg-black/60 blur-xl rounded-[100%] z-0" />

                {/* Popcorn Image */}
                <motion.img
                  src="/popcorn.png"
                  alt="Popcorn Time"
                  animate={{ y: [0, -15, 0] }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="relative z-10 w-full h-auto object-contain drop-shadow-2xl"
                />
              </div>
            </div>

            {/* Right Side: Text & CTA - Centered */}
            <div className="w-full md:w-1/2 text-center space-y-8">
              <div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-white leading-tight">
                  Prêt à <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Plonger ?</span>
                </h2>
                <p className="text-base md:text-lg text-gray-400 max-w-lg mx-auto leading-relaxed">
                  Rejoignez des millions d'utilisateurs et découvrez le futur du streaming dès aujourd'hui.
                </p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <Button
                  size="lg"
                  href="/register"
                  className="h-14 px-10 rounded-full bg-white text-black hover:bg-gray-200 font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all hover:scale-105 hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                >
                  Commencer l'aventure
                </Button>

                <p className="text-sm text-gray-500 font-medium opacity-80">
                  100% Gratuit. Aucune carte bancaire requise.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
      <DonationModal
        isOpen={isDonationModalOpen}
        onClose={() => setIsDonationModalOpen(false)}
      />
    </div>
  );
};

export default WelcomePage;
