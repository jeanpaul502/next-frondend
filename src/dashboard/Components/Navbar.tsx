'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';

import { APP_NAME, API_BASE_URL, SOCIAL_LINKS } from '../../utils/config';
import { useRouter, usePathname } from 'next/navigation';
import { showSuccessToast, showErrorToast } from '../../lib/toast';
import { useNotifications, UINotification } from '../../hooks/useNotifications';
import { NotificationsPanel } from './NotificationsPanel';

interface UserData {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    emailVerified: boolean;
    createdAt: string;
    role: string;
    avatar?: string;
}

export const Navbar = ({ onSearch }: { onSearch?: (query: string) => void }) => {
    const router = useRouter();
    const pathname = usePathname();

    const getInitialTab = (path: string | null) => {
        if (path === '/channels') return 'Chaines TV';
        if (path === '/movies') return 'Films';
        if (path === '/series') return 'Séries';
        if (path === '/my-list') return 'Ma Liste';
        return 'Home';
    };

    const [activeTab, setActiveTab] = useState(() => getInitialTab(pathname));
    const [mounted, setMounted] = useState(false); // To safely use Portal
    useEffect(() => setMounted(true), []);
    const [isCommunityOpen, setIsCommunityOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userData, setUserData] = useState<UserData | null>(null);

    // Sync activeTab with pathname
    useEffect(() => {
        setActiveTab(getInitialTab(pathname));
    }, [pathname]);

    const handleNavigation = (item: string) => {
        setActiveTab(item);
        if (item === 'Chaines TV') {
            router.push('/channels');
        } else if (item === 'Home') {
            router.push('/dashboard');
        } else if (item === 'Films') {
            router.push('/movies');
        } else if (item === 'Séries') {
            router.push('/series');
        } else if (item === 'Ma Liste') {
            router.push('/my-list');
        }
    };
    const [isLoading, setIsLoading] = useState(true);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const searchButtonRef = useRef<HTMLButtonElement>(null);

    // Search effect
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.trim().length > 0) {
                setIsSearching(true);
                try {
                    const res = await fetch(`${API_BASE_URL}/movies/search?query=${encodeURIComponent(searchQuery)}`, {
                        credentials: 'include'
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setSuggestions(data); // Show all results (TMDB usually returns 20)
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSuggestions([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSuggestionClick = (movie: any) => {
        setIsSearchOpen(false);
        setSearchQuery('');
        onSearch?.('');
        setSuggestions([]);
        // Use TMDB ID for navigation
        router.push(`/dashboard?tmdbId=${movie.id}`);
    };

    // Notification state
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const notificationContainerRef = useRef<HTMLDivElement>(null);
    const notificationButtonRef = useRef<HTMLDivElement>(null);
    const communityMenuRef = useRef<HTMLLIElement>(null);

    // Recharge Modal State
    const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
    const [rechargeAmount, setRechargeAmount] = useState('');

    const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'momo'>('card');
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');

    // Success Modal State
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [lastRechargeAmount, setLastRechargeAmount] = useState(0);

    const handleRecharge = () => {
        if (!rechargeAmount) return;
        const tokens = parseInt(rechargeAmount) * 10;
        setPaymentStatus('processing');

        setTimeout(() => {
            setPaymentStatus('idle');
            setIsRechargeModalOpen(false);
            setLastRechargeAmount(tokens);
            setIsSuccessModalOpen(true);
            setRechargeAmount('');
        }, 2000);
    };
    const {
        notifications,
        markAsRead,
        markAllAsRead,
        deleteNotification
    } = useNotifications();

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleNotificationClick = (notification: UINotification) => {
        setIsNotificationOpen(false);
        if (notification.movieId) {
            router.push(`/dashboard?movieId=${notification.movieId}`);
        }
    };

    // Handle ESC key to close search
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsSearchOpen(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    // Focus input when search opens
    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
    }, [isSearchOpen]);

    // Fetch user data with caching
    useEffect(() => {
        const fetchUserData = async () => {
            // 1. Check cache first for immediate display
            const cachedData = localStorage.getItem('netfix_user_data');
            if (cachedData) {
                try {
                    setUserData(JSON.parse(cachedData));
                    setIsLoading(false);
                } catch (e) {
                    localStorage.removeItem('netfix_user_data');
                }
            }

            // 2. Always fetch to revalidate
            try {
                const response = await fetch(`${API_BASE_URL}/auth/me`, {
                    credentials: 'include',
                });
                if (response.ok) {
                    const data = await response.json();
                    // Handle response structure (data vs data.user)
                    const user = data.user || data;
                    setUserData(user);
                    // Save to cache
                    localStorage.setItem('netfix_user_data', JSON.stringify(user));
                }
            } catch (error) {
                // Silent error
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, []);

    // Close menu or search when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Close user menu
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
            // Close search bar
            if (
                isSearchOpen &&
                searchContainerRef.current &&
                !searchContainerRef.current.contains(event.target as Node) &&
                searchButtonRef.current &&
                !searchButtonRef.current.contains(event.target as Node)
            ) {
                setIsSearchOpen(false);
            }

            // Close notifications
            if (
                isNotificationOpen &&
                notificationContainerRef.current &&
                !notificationContainerRef.current.contains(event.target as Node) &&
                notificationButtonRef.current &&
                !notificationButtonRef.current.contains(event.target as Node)
            ) {
                setIsNotificationOpen(false);
            }

            // Close community menu
            if (isCommunityOpen && communityMenuRef.current && !communityMenuRef.current.contains(event.target as Node)) {
                setIsCommunityOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isSearchOpen, isNotificationOpen, isCommunityOpen]);

    // Logout handler
    const handleLogout = async () => {
        try {
            // Clear cache immediately
            localStorage.removeItem('netfix_user_data');

            const response = await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });

            if (response.ok) {
                showSuccessToast('Déconnexion réussie', 'À bientôt !');
                setTimeout(() => {
                    router.push('/login');
                    router.refresh();
                }, 1000);
            } else {
                showErrorToast('Erreur', 'Une erreur est survenue lors de la déconnexion');
            }
        } catch (error) {
            showErrorToast('Erreur', 'Une erreur est survenue lors de la déconnexion');
        }
    };

    const displayName = userData?.firstName && userData?.lastName
        ? `${userData.firstName} ${userData.lastName}`
        : userData?.email || 'Utilisateur';

    const navItems = [
        { label: "Home", icon: "lucide:home" },
        { label: "Films", icon: "lucide:clapperboard" },
        { label: "Séries", icon: "lucide:tv" },
        { label: "Chaines TV", icon: "lucide:radio-tower" },
        { label: "Ma Liste", icon: "lucide:list-plus" },
    ];

    return (
        <nav className="fixed top-0 z-50 w-full bg-black/90 backdrop-blur-lg border-b border-white/10 shadow-lg">
            <div className="flex items-center justify-between px-4 py-4 md:px-16 lg:px-24 relative">
                {/* Left: Logo + App Name */}
                <div 
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => router.push('/dashboard')}
                >
                    <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L20.5 6.5V17.5L12 22L3.5 17.5V6.5L12 2Z" fill="white" fillOpacity="0.9" />
                            <path d="M12 7L16.5 9.5V14.5L12 17L7.5 14.5V9.5L12 7Z" fill="#2563EB" />
                        </svg>
                    </div>
                    <span className="font-semibold text-lg text-white">{APP_NAME}</span>
                </div>

                {/* Center: Navigation Menu */}
                <ul className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-bold text-gray-300 absolute left-1/2 -translate-x-1/2">
                    {navItems.map((item) => {
                        const isDisabled = item.label === 'Séries';
                        return (
                            <li
                                key={item.label}
                                onClick={() => !isDisabled && handleNavigation(item.label)}
                                className={`relative transition-colors flex items-center gap-2 justify-center group/navitem
                                    ${isDisabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}
                                    ${activeTab === item.label ? "text-white" : isDisabled ? "hover:text-gray-500" : "hover:text-white"}
                                `}
                            >
                                <Icon icon={item.icon} width="18" height="18" />
                                <span>{item.label}</span>
                                {isDisabled && (
                                    <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 opacity-0 group-hover/navitem:opacity-100 transition-all duration-200 bg-red-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none transform -translate-y-2 group-hover/navitem:translate-y-0">
                                        <div className="absolute -top-[4px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[4px] border-b-red-600/90"></div>
                                        Non disponible
                                    </div>
                                )}
                                {activeTab === item.label && !isDisabled && (
                                    <motion.div
                                        layoutId="activeTab"
                                        layout
                                        className="absolute -bottom-[21px] left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.6)] rounded-t-full"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </li>
                        );
                    })}

                    {/* Vertical Separator */}
                    <li className="h-4 w-px bg-white/20"></li>

                    {/* Communauté Dropdown */}
                    <li
                        ref={communityMenuRef}
                        className="relative group h-full flex items-center"
                    >
                        <button
                            onClick={() => setIsCommunityOpen(!isCommunityOpen)}
                            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${isCommunityOpen ? "text-white" : "hover:text-white"}`}
                        >
                            <span>Communauté</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                className={`transition-transform duration-300 ${isCommunityOpen ? "rotate-180" : ""}`}
                            >
                                <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m6 9l6 6l6-6" />
                            </svg>
                        </button>

                        {/* Dropdown Menu with Bridge */}
                        {isCommunityOpen && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-6 w-[780px] z-50">
                                <div className="bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6">

                                    {/* Header Section */}
                                    <div className="pb-4 mb-4 border-b border-white/10">
                                        <span className="text-[14px] font-semibold text-gray-400 pl-2">Retrouvez tous nos canaux de discussion</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                        {/* WhatsApp */}
                                        <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-all group/item">
                                            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 transition-colors group-hover/item:bg-white/10 group-hover/item:border-white/20">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="text-[#25D366] fill-current">
                                                    <path d="M19.001 4.908A9.817 9.817 0 0 0 11.992 2C6.534 2 2.085 6.448 2.08 11.908c0 1.748.458 3.45 1.321 4.956L2 22l5.255-1.377a9.816 9.816 0 0 0 4.737 1.206h.005c5.46 0 9.91-4.448 9.915-9.913a9.82 9.82 0 0 0-2.906-7.008zm-7.009 14.862h-.005a8.13 8.13 0 0 1-4.146-1.135l-.297-.176-3.092.811.825-3.014-.193-.307A8.14 8.14 0 0 1 3.758 11.91c.004-4.509 3.673-8.177 8.187-8.177 2.186 0 4.242.85 5.792 2.398a8.148 8.148 0 0 1 2.394 5.787c-.005 4.512-3.676 8.181-8.193 8.181zm4.493-6.138c-.246-.123-1.458-.72-1.684-.802-.225-.082-.39-.123-.554.123-.164.246-.636.802-.78.966-.145.165-.288.185-.533.062-.246-.123-1.039-.383-1.98-1.221-.734-.652-1.229-1.458-1.373-1.705-.144-.246-.015-.38.108-.501.11-.11.246-.287.369-.431.123-.143.164-.246.246-.41.082-.164.041-.308-.02-.41-.062-.103-.554-1.334-.76-1.827-.2-.486-.402-.419-.554-.426l-.472-.007c-.164 0-.43.061-.656.307-.225.246-.86.842-.86 2.053 0 1.211.881 2.382 1.005 2.546.123.164 1.733 2.647 4.199 3.712.586.254 1.044.406 1.4.52.597.192 1.14.165 1.572.1.481-.072 1.458-.596 1.664-1.171.205-.575.205-1.066.143-1.171-.061-.104-.225-.164-.471-.287z" />
                                                </svg>
                                            </div>
                                            <div className="flex flex-col pt-0.5">
                                                <span className="text-white font-bold text-sm group-hover/item:text-[#25D366] transition-colors">Groupe WhatsApp</span>
                                                <span className="text-xs text-gray-500 mt-1 leading-relaxed">Rejoignez la discussion et les actus en direct.</span>
                                            </div>
                                        </a>

                                        {/* Telegram */}
                                        <a href={SOCIAL_LINKS.telegram} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-all group/item">
                                            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 transition-colors group-hover/item:bg-white/10 group-hover/item:border-white/20">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="text-[#229ED9] fill-current">
                                                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                                                </svg>
                                            </div>
                                            <div className="flex flex-col pt-0.5">
                                                <span className="text-white font-bold text-sm group-hover/item:text-[#229ED9] transition-colors">Canal Telegram</span>
                                                <span className="text-xs text-gray-500 mt-1 leading-relaxed">Ne manquez aucune sortie et contenu bonus.</span>
                                            </div>
                                        </a>

                                        {/* Discord */}
                                        <a href={SOCIAL_LINKS.discord} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-all group/item">
                                            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 transition-colors group-hover/item:bg-white/10 group-hover/item:border-white/20">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="text-[#5865F2] fill-current">
                                                    <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0 12.61 12.61 0 0 0-.54-1.09.08.08 0 0 0-.07-.03A16.15 16.15 0 0 0 4.73 5.33a.06.06 0 0 0-.03.05c-2.7 4.01-3.44 7.91-3.07 11.75a.08.08 0 0 0 .04.05C3.37 18.49 5 19.38 6.57 19.85c.06.02.13 0 .16-.06l.75-1.04a.05.05 0 0 0-.02-.07 11.4 11.4 0 0 1-1.63-.78.06.06 0 0 1 .01-.1c.12-.08.24-.17.35-.25a.05.05 0 0 1 .06 0c3.48 1.59 7.24 1.59 10.7 0a.05.05 0 0 1 .06 0c.11.09.23.17.35.26.04.03.05.08.01.1a11.23 11.23 0 0 1-1.63.78.05.05 0 0 0-.02.07l.75 1.04c.04.05.1.07.16.05 1.57-.47 3.2-1.35 4.87-2.67a.08.08 0 0 0 .04-.05c.44-4.52-.72-8.49-3.73-11.75a.06.06 0 0 0-.03-.05zM8.5 14.5c-1.08 0-1.96-.99-1.96-2.21S7.4 10.08 8.5 10.08c1.1 0 1.97.99 1.96 2.21 0 1.22-.88 2.21-1.96 2.21zm7 0c-1.08 0-1.96-.99-1.96-2.21S14.4 10.08 15.5 10.08c1.1 0 1.97.99 1.96 2.21 0 1.22-.88 2.21-1.96 2.21z" />
                                                </svg>
                                            </div>
                                            <div className="flex flex-col pt-0.5">
                                                <span className="text-white font-bold text-sm group-hover/item:text-[#5865F2] transition-colors">Serveur Discord</span>
                                                <span className="text-xs text-gray-500 mt-1 leading-relaxed">Salons vocaux, jeux et watch-parties.</span>
                                            </div>
                                        </a>

                                        {/* Reddit */}
                                        <a href={SOCIAL_LINKS.reddit} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-all group/item">
                                            <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 transition-colors group-hover/item:bg-white/10 group-hover/item:border-white/20">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="text-[#FF4500] fill-current">
                                                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                                                </svg>
                                            </div>
                                            <div className="flex flex-col pt-0.5">
                                                <span className="text-white font-bold text-sm group-hover/item:text-[#FF4500] transition-colors">Page Reddit</span>
                                                <span className="text-xs text-gray-500 mt-1 leading-relaxed">Partagez vos avis et théories avec tous.</span>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}
                    </li>
                </ul>

                {/* Right: User Icons */}
                <div className="flex items-center gap-4 text-white">
                    {/* Search Icon */}
                    <div className="relative group block">
                        <button
                            ref={searchButtonRef}
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className={`cursor-pointer hover:text-blue-400 transition-colors focus:outline-none ${isSearchOpen ? 'text-blue-500' : ''}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                                <g fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="11.5" cy="11.5" r="9.5" />
                                    <path strokeLinecap="round" d="M18.5 18.5L22 22" />
                                </g>
                            </svg>
                        </button>
                    </div>

                    {/* Notification Icon with Badge */}
                    <div
                        ref={notificationButtonRef}
                        className="hidden md:block relative cursor-pointer group"
                        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className={`transition-colors ${isNotificationOpen ? 'text-blue-500' : 'hover:text-blue-400'}`}>
                            <g fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M18.75 9.71v-.705C18.75 5.136 15.726 2 12 2S5.25 5.136 5.25 9.005v.705a4.4 4.4 0 0 1-.692 2.375L3.45 13.81c-1.011 1.575-.239 3.716 1.52 4.214a25.8 25.8 0 0 0 14.06 0c1.759-.498 2.531-2.639 1.52-4.213l-1.108-1.725a4.4 4.4 0 0 1-.693-2.375Z" />
                                <path strokeLinecap="round" d="M7.5 19c.655 1.748 2.422 3 4.5 3s3.845-1.252 4.5-3" />
                            </g>
                        </svg>
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}

                        {/* Notification Panel */}
                        <NotificationsPanel
                            isOpen={isNotificationOpen}
                            notifications={notifications}
                            onClose={() => setIsNotificationOpen(false)}
                            onMarkAllAsRead={markAllAsRead}
                            onDelete={deleteNotification}
                            onMarkAsRead={markAsRead}
                            onNotificationClick={handleNotificationClick}
                            containerRef={notificationContainerRef}
                        />
                    </div>

                    {/* User Avatar with Dropdown */}
                    <div className="relative hidden md:block" ref={userMenuRef}>
                        <div
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        >
                            <div className="h-9 w-9 overflow-hidden rounded-lg border-2 border-transparent group-hover:border-blue-500 transition-all bg-gray-800">
                                {userData?.avatar ? (
                                    <img
                                        src={userData.avatar.startsWith('http') ? userData.avatar : `${API_BASE_URL}${userData.avatar.startsWith('/') ? '' : '/'}${userData.avatar}`}
                                        className="w-full h-full object-cover"
                                        alt="User"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white font-bold">
                                        {userData?.firstName?.[0] || 'U'}
                                    </div>
                                )}
                            </div>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                className={`text-gray-400 group-hover:text-white transition-all hidden md:block ${isUserMenuOpen ? 'rotate-180' : ''}`}
                            >
                                <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m19 9l-7 6l-7-6" />
                            </svg>
                        </div>

                        {/* User Dropdown Menu */}
                        {isUserMenuOpen && (
                            <div className="absolute right-0 mt-3 w-72 bg-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl z-50">
                                {/* User Info */}
                                <div className="p-4 border-b border-white/10 bg-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-blue-500 bg-gray-800">
                                            {userData?.avatar ? (
                                                <img
                                                    src={userData.avatar.startsWith('http') ? userData.avatar : `${API_BASE_URL}${userData.avatar.startsWith('/') ? '' : '/'}${userData.avatar}`}
                                                    className="w-full h-full object-cover"
                                                    alt="User"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white font-bold text-xl">
                                                    {userData?.firstName?.[0] || 'U'}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            {isLoading ? (
                                                <p className="text-sm text-gray-400">Chargement...</p>
                                            ) : (
                                                <>
                                                    <p className="font-bold text-white">{displayName}</p>
                                                    <p className="text-xs text-gray-400">{userData?.email}</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Credits Section */}
                                <div className="p-4 border-b border-white/10 bg-white/5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" className="text-yellow-400">
                                                    <g fill="none" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 10h4" />
                                                        <path strokeWidth="1.5" d="M20.833 11h-2.602C16.446 11 15 12.343 15 14s1.447 3 3.23 3h2.603c.084 0 .125 0 .16-.002c.54-.033.97-.432 1.005-.933c.002-.032.002-.071.002-.148v-3.834c0-.077 0-.116-.002-.148c-.036-.501-.465-.9-1.005-.933c-.035-.002-.076-.002-.16-.002Z" />
                                                        <path strokeWidth="1.5" d="M20.965 11c-.078-1.872-.328-3.02-1.137-3.828C18.657 6 16.771 6 13 6h-3C6.229 6 4.343 6 3.172 7.172S2 10.229 2 14s0 5.657 1.172 6.828S6.229 22 10 22h3c3.771 0 5.657 0 6.828-1.172c.809-.808 1.06-1.956 1.137-3.828" />
                                                        <path strokeLinecap="round" strokeWidth="1.5" d="m6 6l3.735-2.477a3.24 3.24 0 0 1 3.53 0L17 6" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.991 14h.01" />
                                                    </g>
                                                </svg>
                                                <span className="text-sm font-bold text-white">Crédit</span>
                                            </div>
                                            <p className="text-xs text-gray-400 pl-6">2,500 tokens</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setIsUserMenuOpen(false);
                                                setIsRechargeModalOpen(true);
                                            }}
                                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer shadow-lg shadow-blue-900/20 hover:shadow-blue-600/40 active:scale-95"
                                        >
                                            Recharge
                                        </button>
                                    </div>
                                </div>

                                {/* Menu Items */}
                                <div className="py-2 flex flex-col gap-1">

                                    <button
                                        onClick={() => router.push('/dashboard/settings')}
                                        className="group relative mx-2 flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
                                    >
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-blue-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-all shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" className="text-gray-400 group-hover:text-white transition-colors"><g fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3" /><path d="M13.765 2.152C13.398 2 12.932 2 12 2s-1.398 0-1.765.152a2 2 0 0 0-1.083 1.083c-.092.223-.129.484-.143.863a1.62 1.62 0 0 1-.79 1.353a1.62 1.62 0 0 1-1.567.008c-.336-.178-.579-.276-.82-.308a2 2 0 0 0-1.478.396C4.04 5.79 3.806 6.193 3.34 7s-.7 1.21-.751 1.605a2 2 0 0 0 .396 1.479c.148.192.355.353.676.555c.473.297.777.803.777 1.361s-.304 1.064-.777 1.36c-.321.203-.529.364-.676.556a2 2 0 0 0 .396 1.479c.052.394.285.798.75 1.605c.467.807.7 1.21 1.015 1.453a2 2 0 0 0 1.479.396c.24-.032.483-.13.819-.308a1.62 1.62 0 0 1 1.567.008c.483.28.77.795.79 1.353c.014.38.05.64.143.863a2 2 0 0 0 1.083 1.083C10.602 22 11.068 22 12 22s1.398 0 1.765-.152a2 2 0 0 0 1.083-1.083c.092-.223.129-.483.143-.863c.02-.558.307-1.074.79-1.353a1.62 1.62 0 0 1 1.567-.008c.336.178.579.276.819.308a2 2 0 0 0 1.479-.396c.315-.242.548-.646 1.014-1.453s.7-1.21.751-1.605a2 2 0 0 0-.396-1.479c-.148-.192-.355-.353-.676-.555A1.62 1.62 0 0 1 19.562 12c0-.558.304-1.064.777-1.36c.321-.203.529-.364.676-.556a2 2 0 0 0 .396-1.479c-.052-.394-.285-.798-.75-1.605c-.467-.807-.7-1.21-1.015-1.453a2 2 0 0 0-1.479-.396c-.24.032-.483.13-.82.308a1.62 1.62 0 0 1-1.566-.008a1.62 1.62 0 0 1-.79-1.353c-.014-.38-.05-.64-.143-.863a2 2 0 0 0-1.083-1.083Z" /></g></svg>
                                        <span className="text-white font-medium">Paramètres</span>
                                    </button>

                                    <div className="h-px bg-white/5 mx-4 my-1"></div>

                                    {userData?.role === 'ADMIN' && (
                                        <button
                                            onClick={() => router.push('/admin/dashboard')}
                                            className="group relative mx-2 flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
                                        >
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-red-600 rounded-r-full opacity-0 group-hover:opacity-100 transition-all shadow-[0_0_10px_rgba(220,38,38,0.5)]"></div>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" className="text-gray-400 group-hover:text-white transition-colors"><g fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M12 8v4" /><path d="M12 16h.01" /></g></svg>
                                            <span className="text-white font-medium">Administration</span>
                                        </button>
                                    )}

                                    <button
                                        onClick={handleLogout}
                                        className="group relative mx-2 flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-all cursor-pointer"
                                    >
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 bg-red-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-all shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" className="text-red-400 group-hover:text-red-300 transition-colors"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"><path d="M9.002 7c.012-2.175.109-3.353.877-4.121C10.758 2 12.172 2 15 2h1c2.829 0 4.243 0 5.122.879C22 3.757 22 5.172 22 8v8c0 2.828 0 4.243-.878 5.121C20.242 22 18.829 22 16 22h-1c-2.828 0-4.242 0-5.121-.879c-.768-.768-.865-1.946-.877-4.121" /><path strokeLinejoin="round" d="M15 12H2m0 0l3.5-3M2 12l3.5 3" /></g></svg>
                                        <span className="text-red-400 font-medium">Déconnexion</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mobile Hamburger Menu Button */}
                    <button
                        className="md:hidden p-2 text-white"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {isMobileMenuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        key="mobile-menu"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-black/95 backdrop-blur-xl border-b border-white/10 max-h-[85vh] overflow-y-auto"
                    >
                        <ul className="flex flex-col p-2 space-y-1 text-gray-300 font-medium text-sm">
                            {/* User Profile in Mobile Menu */}
                            <li 
                                className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5 mb-2 cursor-pointer active:scale-95 transition-transform" 
                                onClick={() => { setIsMobileMenuOpen(false); router.push('/dashboard/settings'); }}
                            >
                                <div className="h-8 w-8 overflow-hidden rounded-full border border-white/20 bg-gray-800 shadow-sm">
                                    {userData?.avatar ? (
                                        <img
                                            src={userData.avatar.startsWith('http') ? userData.avatar : `${API_BASE_URL}${userData.avatar.startsWith('/') ? '' : '/'}${userData.avatar}`}
                                            className="w-full h-full object-cover"
                                            alt="User"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white font-bold text-xs">
                                            {userData?.firstName?.[0] || 'U'}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white font-bold text-xs">{displayName}</span>
                                    <span className="text-[10px] text-blue-400 font-medium">Gérer le compte</span>
                                </div>
                            </li>

                            {navItems.map((item) => {
                                const isDisabled = item.label === 'Séries';
                                const isActive = activeTab === item.label;
                                return (
                                    <li
                                        key={item.label}
                                        onClick={() => {
                                            if (!isDisabled) {
                                                handleNavigation(item.label);
                                                setIsMobileMenuOpen(false);
                                            }
                                        }}
                                        className={`
                                            relative overflow-hidden transition-all duration-200 flex justify-between items-center group/mobileitem py-2 px-3 rounded-lg border
                                            ${isDisabled 
                                                ? "cursor-not-allowed opacity-50 bg-transparent border-transparent" 
                                                : "cursor-pointer active:scale-95"
                                            }
                                            ${isActive
                                                ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                                : isDisabled 
                                                    ? "text-gray-600" 
                                                    : "bg-transparent border-transparent hover:bg-white/5 text-gray-400 hover:text-white"
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-3 z-10">
                                            <div className={`
                                                p-1.5 rounded-md transition-colors
                                                ${isActive ? "bg-blue-500/20 text-blue-400" : "bg-white/5 group-hover/mobileitem:bg-white/10 text-gray-400 group-hover/mobileitem:text-white"}
                                            `}>
                                                <Icon icon={item.icon} width="16" height="16" />
                                            </div>
                                            <span className={`text-sm ${isActive ? "font-bold" : "font-medium"}`}>{item.label}</span>
                                        </div>
                                        
                                        {isActive && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-blue-500 rounded-r-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                        )}

                                        {isDisabled && (
                                            <span className="ml-auto text-[10px] bg-white/5 text-gray-500 px-1.5 py-0.5 rounded border border-white/5">
                                                Bientôt
                                            </span>
                                        )}
                                    </li>
                                );
                            })}
                            
                            <li className="h-px bg-white/5 w-full my-1"></li>

                            {/* Admin Link for Mobile - Bottom Position */}
                            {userData?.role === 'ADMIN' && (
                                <li
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        router.push('/admin/dashboard');
                                    }}
                                    className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-all cursor-pointer active:scale-95 group"
                                >
                                    <div className="p-1.5 rounded-md bg-white/5 group-hover:bg-red-500/10 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M12 8v4" /><path d="M12 16h.01" /></g></svg>
                                    </div>
                                    <span className="font-medium text-sm">Administration</span>
                                </li>
                            )}

                            <li
                                onClick={handleLogout}
                                className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all cursor-pointer active:scale-95 group"
                            >
                                <div className="p-1.5 rounded-md bg-white/5 group-hover:bg-white/10 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                        <polyline points="16 17 21 12 16 7"></polyline>
                                        <line x1="21" y1="12" x2="9" y2="12"></line>
                                    </svg>
                                </div>
                                <span className="font-medium text-sm">Déconnexion</span>
                            </li>
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search Bar Dropdown */}
            {isSearchOpen && (
                <div
                    ref={searchContainerRef}
                    className="absolute top-[calc(100%+0.5rem)] md:top-[calc(100%+1rem)] left-1/2 -translate-x-1/2 w-[95%] max-w-2xl bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl animate-in slide-in-from-top-2 duration-200 p-2 md:p-6"
                >
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" className="text-gray-400 md:w-5 md:h-5">
                                <g fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="11.5" cy="11.5" r="9.5" />
                                    <path strokeLinecap="round" d="M18.5 18.5L22 22" />
                                </g>
                            </svg>
                        </div>
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); onSearch?.(e.target.value); }}
                            placeholder="Rechercher..."
                            className="block w-full pl-9 md:pl-12 pr-4 py-1.5 md:py-3 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10 transition-all text-base"
                            autoFocus
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-2">
                            {isSearching && (
                                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                            )}
                            <button
                                onClick={() => setIsSearchOpen(false)}
                                className="p-1.5 bg-white/10 rounded-full text-white transition-colors hover:bg-white/20"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Suggestions List */}
                    {suggestions.length > 0 && (
                        <>
                            <style>{`
                                .custom-scrollbar::-webkit-scrollbar {
                                    width: 6px;
                                }
                                .custom-scrollbar::-webkit-scrollbar-track {
                                    background: rgba(255, 255, 255, 0.05);
                                    border-radius: 10px;
                                }
                                .custom-scrollbar::-webkit-scrollbar-thumb {
                                    background: rgba(255, 255, 255, 0.2);
                                    border-radius: 10px;
                                }
                                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                                    background: rgba(255, 255, 255, 0.4);
                                }
                            `}</style>
                            <div className="mt-4 flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 sticky top-0 bg-[#0a0a0a] py-2 z-10">Suggestions</h3>
                                {suggestions.map((movie) => (
                                    <div
                                        key={movie.id}
                                        onClick={() => handleSuggestionClick(movie)}
                                        className="flex items-center gap-2 md:gap-3 p-1 md:p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
                                    >
                                        <div className="h-10 w-7 md:h-16 md:w-12 bg-gray-800 rounded-md md:rounded-lg overflow-hidden flex-shrink-0 relative">
                                            {movie.poster_path ? (
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                                                    alt={movie.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-700">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" className="text-gray-500">
                                                        <path fill="currentColor" d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-white text-xs md:text-base font-medium truncate group-hover:text-blue-400 transition-colors">
                                                {movie.title}
                                            </h4>
                                            <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-400 mt-0.5 md:mt-1">
                                                <span>{movie.release_date ? new Date(movie.release_date).getFullYear() : 'Année inconnue'}</span>
                                                {movie.vote_average > 0 && (
                                                    <>
                                                        <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                                        <span className="text-yellow-500 flex items-center gap-1">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                            </svg>
                                                            {movie.vote_average.toFixed(1)}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-1.5 md:p-2 rounded-full bg-white/5 group-hover:bg-blue-500/20 text-gray-400 group-hover:text-blue-400 transition-colors hidden sm:block">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" className="md:w-5 md:h-5">
                                                <path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                                            </svg>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
            {/* Recharge Modal */}
            {mounted && isRechargeModalOpen && createPortal(
                <div
                    onClick={() => setIsRechargeModalOpen(false)}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden"
                    >
                        {/* Background Glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[80px] pointer-events-none" />

                        {/* Header */}
                        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Icon icon="solar:wallet-money-bold-duotone" className="text-yellow-400" width={20} />
                                Rechargement
                            </h3>
                            <button
                                onClick={() => setIsRechargeModalOpen(false)}
                                className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                            >
                                <Icon icon="solar:close-circle-linear" width={20} className="text-gray-400 hover:text-white" />
                            </button>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Payment Methods */}
                            <div className="space-y-2.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider pl-1">Mode de paiement</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'card', label: 'Carte', icon: 'solar:card-bold' },
                                        { id: 'paypal', label: 'PayPal', icon: 'logos:paypal' },
                                        { id: 'momo', label: 'Mobile', icon: 'solar:smartphone-bold' }
                                    ].map((method) => (
                                        <button
                                            key={method.id}
                                            onClick={() => setPaymentMethod(method.id as any)}
                                            className={`relative p-3 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-pointer group hover:bg-white/5 ${paymentMethod === method.id
                                                ? 'bg-blue-600/10 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.15)] ring-1 ring-blue-500/50'
                                                : 'bg-black/20 border-white/10 text-gray-400'
                                                }`}
                                        >
                                            {paymentMethod === method.id && (
                                                <div className="absolute -top-1.5 -right-1.5 bg-green-500 text-black rounded-full p-0.5 border-2 border-[#0A0A0A] shadow-sm">
                                                    <Icon icon="solar:check-circle-bold" width={12} />
                                                </div>
                                            )}
                                            <Icon icon={method.icon} width={20} className={method.id === 'paypal' ? '' : (paymentMethod === method.id ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300')} />
                                            <span className="text-[11px] font-medium">{method.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div className="space-y-2.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider pl-1">Montant à recharger (€)</label>
                                <div className="relative group">
                                    <input
                                        type="number"
                                        value={rechargeAmount}
                                        onChange={(e) => setRechargeAmount(e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-black/40 border border-white/10 group-hover:border-white/20 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all font-mono text-lg tracking-wide [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs pointer-events-none">EUR</div>
                                </div>
                            </div>

                            {/* Conversion & Balance Box */}
                            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[11px] text-gray-400 font-medium mb-0.5">Vous recevrez</p>
                                        <div className="text-xl font-bold text-white flex items-center gap-2">
                                            {rechargeAmount ? (parseInt(rechargeAmount) * 10).toLocaleString() : '0'}
                                            <span className="text-xs font-normal text-gray-500 uppercase tracking-wider mt-1">Tokens</span>
                                        </div>
                                    </div>
                                    <div className="h-9 w-9 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 border border-blue-500/20">
                                        <Icon icon="solar:wad-of-money-bold-duotone" width={20} />
                                    </div>
                                </div>

                                <div className="h-px bg-white/5 w-full"></div>

                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Solde actuel</span>
                                    <div className="flex items-center gap-1.5 opacity-80">
                                        <Icon icon="solar:wallet-bold-duotone" width={14} className="text-blue-400" />
                                        <span className="text-white font-mono tracking-wide">2,500</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-white/10 bg-white/[0.02]">
                            <button
                                onClick={handleRecharge}
                                disabled={!rechargeAmount || paymentStatus !== 'idle'}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {paymentStatus === 'processing' ? (
                                    <>
                                        <Icon icon="svg-spinners:ring-resize" />
                                        <span>Traitement en cours...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Payer maintenant</span>
                                        <Icon icon="solar:card-send-bold" />
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}

            {/* Success Modal */}
            {mounted && isSuccessModalOpen && createPortal(
                <div
                    onClick={() => setIsSuccessModalOpen(false)}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}

                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden"
                    >
                        {/* Close Button */}
                        <div className="absolute top-4 right-4 z-20">
                            <button
                                onClick={() => setIsSuccessModalOpen(false)}
                                className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                            >
                                <Icon icon="solar:close-circle-linear" width={20} className="text-gray-400 hover:text-white" />
                            </button>
                        </div>

                        <div className="p-6 text-center relative z-10">
                            {/* Success Icon with Ripple Effect */}
                            <div className="relative mb-6 inline-block">
                                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
                                <div className="w-16 h-16 bg-[#111] rounded-full flex items-center justify-center text-green-500 border border-green-500/20 shadow-xl relative z-10">
                                    <Icon icon="solar:verified-check-bold-duotone" width={32} className="drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                </div>
                            </div>

                            <motion.h3
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-lg font-bold text-white mb-2"
                            >
                                Paiement réussi
                            </motion.h3>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-gray-400 text-xs mb-6 leading-relaxed px-4"
                            >
                                Votre transaction a été validée. Votre solde a été mis à jour instantanément.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 }}
                                className="bg-gradient-to-b from-white/[0.05] to-transparent border border-white/10 rounded-xl p-4 mb-2 backdrop-blur-sm"
                            >
                                <p className="text-[10px] text-green-400 uppercase tracking-[0.2em] font-bold mb-2">Total Tokens Reçus</p>
                                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 tracking-tight drop-shadow-sm">
                                    {lastRechargeAmount.toLocaleString()}
                                </div>
                            </motion.div>
                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t border-white/10 bg-white/[0.02]">
                            <button
                                onClick={() => setIsSuccessModalOpen(false)}
                                className="w-full py-3 bg-white text-black font-bold text-sm rounded-xl hover:bg-gray-100 transition-all shadow-lg shadow-white/10 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <span>Continuer</span>
                                <Icon icon="solar:arrow-right-linear" width={18} />
                            </button>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}
        </nav>
    );
};
