'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Poppins } from 'next/font/google';
import { motion } from 'framer-motion';
import { APP_NAME } from '../../utils/config';

const poppins = Poppins({ subsets: ['latin'], weight: ['500', '600'] });

const ActionButtons = ({ full = false }: { full?: boolean }) => (
  <>
    <Button
      href="/login"
      variant="outline"
      size="lg"
      className={`${poppins.className} ${full ? "w-full justify-center text-[14px]" : "w-[160px] md:w-[145px] justify-center text-[14px] md:text-[13px] md:h-9 md:px-3"}`}
    >
      Se connecter
    </Button>
    <Button
      href="/register"
      variant="default"
      size="lg"
      className={`${poppins.className} ${full ? "w-full justify-center text-[14px]" : "w-[160px] md:w-[145px] justify-center text-[14px] md:text-[13px] md:h-9 md:px-3"}`}
    >
      S&apos;inscrire
    </Button>
  </>
);

const Navbar = () => {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredPath, setHoveredPath] = useState(pathname);

  useEffect(() => {
    setHoveredPath(pathname);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: '/', label: 'Accueil' },
    { path: '/about', label: 'À propos' },
    { path: '/resources', label: 'Ressources' },
    { path: '/solutions', label: 'Solutions' },
    { path: '/pricing', label: 'Tarifs' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black' : ''}`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-4 relative flex items-center justify-between">
        <div className="flex items-center gap-3 md:-translate-x-2 lg:-translate-x-28">
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L20.5 6.5V17.5L12 22L3.5 17.5V6.5L12 2Z" fill="white" fillOpacity="0.9" />
              <path d="M12 7L16.5 9.5V14.5L12 17L7.5 14.5V9.5L12 7Z" fill="#2563EB" />
            </svg>
          </div>
          <span className="font-semibold text-lg text-white">{APP_NAME}</span>
        </div>

        <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.path}
              href={item.path}
              onMouseEnter={() => setHoveredPath(item.path)}
              onMouseLeave={() => setHoveredPath(pathname)}
              className="relative py-2 text-sm font-medium transition-colors duration-200"
              style={{
                color: (item.path === hoveredPath) ? '#FFFFFF' : '#9CA3AF'
              }}
            >
              <span>{item.label}</span>
              {item.path === hoveredPath && (
                <motion.div
                  layoutId="navbar-underline"
                  className="absolute left-0 right-0 bottom-0 h-[2px] bg-blue-500"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </a>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Ouvrir le menu"
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M4 6h16v2H4zM4 11h16v2H4zM4 16h16v2H4z" />
          </svg>
        </button>
        <div className="hidden md:flex items-center gap-3 justify-self-end md:translate-x-8 lg:translate-x-40">
          <ActionButtons />
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black border-t border-white/10">
          <div className="px-4 py-4 space-y-3">
            {navItems.map((item) => (
              <a key={item.path} href={item.path} className={`block px-2 py-2 hover:text-white ${pathname === item.path ? 'text-white' : 'text-gray-300'}`}>
                {item.label}
              </a>
            ))}
            <div className="pt-2 grid grid-cols-2 gap-3">
              <Button href="/login" variant="outline" size="lg" className={`${poppins.className} w-full justify-center text-[14px]`}>Se connecter</Button>
              <Button href="/register" variant="default" size="lg" className={`${poppins.className} w-full justify-center text-[14px]`}>S&apos;inscrire</Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;