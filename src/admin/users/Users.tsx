import React, { useState, useEffect, useRef } from 'react';
import {
    MoreVertical,
    Search,
    Shield,
    ShieldOff,
    Trash2,
    UserCheck,
    Smartphone,
    Monitor,
    Globe,
    AlertTriangle,
    X,
    Check,
    Clock,
    Filter,
    Users as UsersIcon,
    Wifi,
    ChevronDown,
    BadgeCheck
} from 'lucide-react';
import { API_BASE_URL } from '../../utils/config';

// --- Types ---
interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    emailVerified: boolean;
    role: 'ADMIN' | 'USER';
    ipAddress?: string;
    city?: string;
    country?: string;
    countryCode?: string;
    isBlocked: boolean;
    isOnline?: boolean;
    lastLoginAt?: string;
    device?: string;
    deviceType?: string;
    browser?: string;
    os?: string;
    lastActivity: string; // ISO Date string
}

// --- Icons Helper ---
const DeviceIcon = ({ type, className }: { type?: string, className?: string }) => {
    const t = (type || '').toLowerCase();
    if (t.includes('mobile') || t.includes('android') || t.includes('ios') || t.includes('phone') || t.includes('tablet')) {
        return <Smartphone className={className} />;
    }
    return <Monitor className={className} />;
};

// --- Activity Helper ---
const formatActivity = (user: User) => {
    // Determine the last activity time
    const dateStr = user.lastLoginAt || user.lastActivity;

    // If no activity record exists
    if (!dateStr) return { text: 'Jamais', isOnline: false };

    const date = new Date(dateStr);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    // If active within the last 5 minutes, consider Online
    // (We tightened this from 15 to 5 minutes for better "real-time" accuracy)
    if (diffMinutes < 5) return { text: 'En ligne', isOnline: true };

    // Format time for "Last seen at..."
    // Helper to format date: "DD/MM/YYYY à HH:mm"
    const formattedDate = date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    if (diffMinutes < 60) {
        return { text: `Il y a ${diffMinutes} min`, isOnline: false };
    }

    // If today, show "Aujourd'hui à HH:mm"
    const isToday = now.getDate() === date.getDate() &&
        now.getMonth() === date.getMonth() &&
        now.getFullYear() === date.getFullYear();

    if (isToday) {
        return { text: `Aujourd'hui à ${formattedTime}`, isOnline: false };
    }

    return { text: `${formattedDate} à ${formattedTime}`, isOnline: false };
};

const Users = () => {
    // --- State ---
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'BLOCKED' | 'ONLINE'>('ALL');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    // Dropdown State
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number, right: number } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Modal State
    const [modalAction, setModalAction] = useState<'BLOCK' | 'DELETE' | 'ROLE' | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;

    // --- API Calls ---
    const fetchUsers = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        setError(null);
        try {
            const query = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
            const response = await fetch(`${API_BASE_URL}/users${query}`, { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            } else {
                setError('Erreur lors du chargement des utilisateurs');
            }
        } catch (err) {
            setError('Erreur de connexion serveur');
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    // --- Effects ---
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchUsers();
            setCurrentPage(1);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Auto-refresh interval (Real-time updates)
    useEffect(() => {
        const intervalId = setInterval(() => {
            // Only refresh if no search query (to avoid resetting search results while typing)
            // and no modal is open
            if (!searchQuery && !modalAction && !openMenuId) {
                fetchUsers(false); // Silent refresh
            }
        }, 10000); // Refresh every 10 seconds

        return () => clearInterval(intervalId);
    }, [searchQuery, modalAction, openMenuId]);

    // Close menu when clicking outside (window based)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                closeDropdown();
            }
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        };
        // Scroll close
        const handleScroll = () => {
            closeDropdown();
            setIsFilterOpen(false);
        };

        if (openMenuId || isFilterOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [openMenuId, isFilterOpen]);

    const handleAction = async () => {
        if (!selectedUser || !modalAction) return;

        setIsProcessing(true);
        try {
            let response;
            if (modalAction === 'BLOCK') {
                response = await fetch(`${API_BASE_URL}/users/${selectedUser.id}/block`, {
                    method: 'PATCH',
                    credentials: 'include'
                });
            } else if (modalAction === 'DELETE') {
                response = await fetch(`${API_BASE_URL}/users/${selectedUser.id}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
            } else if (modalAction === 'ROLE') {
                const newRole = selectedUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
                response = await fetch(`${API_BASE_URL}/users/${selectedUser.id}/role`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ role: newRole }),
                    credentials: 'include'
                });
            }

            if (response && response.ok) {
                // Refresh list or update local state
                if (modalAction === 'DELETE') {
                    setUsers(users.filter(u => u.id !== selectedUser.id));
                } else if (modalAction === 'BLOCK') {
                    setUsers(users.map(u => u.id === selectedUser.id ? { ...u, isBlocked: !u.isBlocked } : u));
                } else if (modalAction === 'ROLE') {
                    const newRole = selectedUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
                    setUsers(users.map(u => u.id === selectedUser.id ? { ...u, role: newRole } : u));
                }
                closeModal();
            } else {
                setError("L'action a échoué");
            }
        } catch (err) {
            setError("Erreur lors de l'exécution de l'action");
        } finally {
            setIsProcessing(false);
        }
    };

    // --- Helpers ---
    const closeDropdown = () => {
        setOpenMenuId(null);
        setMenuPosition(null);
    };

    const openDropdown = (e: React.MouseEvent<HTMLButtonElement>, userId: string) => {
        e.stopPropagation();
        if (openMenuId === userId) {
            closeDropdown();
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            // Align dropdown top-right to the button
            setMenuPosition({
                top: rect.bottom + 4,
                right: window.innerWidth - rect.right
            });
            setOpenMenuId(userId);
        }
    };

    const closeModal = () => {
        setModalAction(null);
        setSelectedUser(null);
        closeDropdown();
    };

    const confirmAction = (user: User, action: 'BLOCK' | 'DELETE' | 'ROLE') => {
        setSelectedUser(user);
        setModalAction(action);
        closeDropdown();
    };

    // --- Filter Logic ---
    const filteredUsers = users.filter(user => {
        switch (filterStatus) {
            case 'ACTIVE':
                return !user.isBlocked;
            case 'BLOCKED':
                return user.isBlocked;
            case 'ONLINE':
                return formatActivity(user).isOnline;
            default:
                return true;
        }
    });

    // Pagination Logic
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    const getFilterLabel = () => {
        switch (filterStatus) {
            case 'ACTIVE': return 'Actifs';
            case 'BLOCKED': return 'Bloqués';
            case 'ONLINE': return 'En ligne';
            default: return 'Tous';
        }
    };

    const getFilterIcon = () => {
        switch (filterStatus) {
            case 'ACTIVE': return <Check className="w-4 h-4 text-green-400" />;
            case 'BLOCKED': return <ShieldOff className="w-4 h-4 text-red-400" />;
            case 'ONLINE': return <Wifi className="w-4 h-4 text-blue-400" />;
            default: return <UsersIcon className="w-4 h-4 text-slate-400" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                {/* Filter Dropdown */}
                <div className="relative" ref={filterRef}>
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 px-4 py-2 rounded-lg transition-all shadow-sm"
                    >
                        <Filter className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium">Filtrer:</span>
                        <div className="flex items-center gap-2 bg-slate-700/50 px-2 py-0.5 rounded text-sm">
                            {getFilterIcon()}
                            <span>{getFilterLabel()}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Filter Menu */}
                    {isFilterOpen && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            <div className="p-1">
                                <button
                                    onClick={() => { setFilterStatus('ALL'); setIsFilterOpen(false); setCurrentPage(1); }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${filterStatus === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/50'}`}
                                >
                                    <UsersIcon className="w-4 h-4" />
                                    <span>Tous</span>
                                </button>
                                <button
                                    onClick={() => { setFilterStatus('ONLINE'); setIsFilterOpen(false); setCurrentPage(1); }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${filterStatus === 'ONLINE' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/50'}`}
                                >
                                    <Wifi className="w-4 h-4 text-blue-400" />
                                    <span>En ligne</span>
                                </button>
                                <button
                                    onClick={() => { setFilterStatus('ACTIVE'); setIsFilterOpen(false); setCurrentPage(1); }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${filterStatus === 'ACTIVE' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/50'}`}
                                >
                                    <Check className="w-4 h-4 text-green-400" />
                                    <span>Actifs</span>
                                </button>
                                <button
                                    onClick={() => { setFilterStatus('BLOCKED'); setIsFilterOpen(false); setCurrentPage(1); }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${filterStatus === 'BLOCKED' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/50'}`}
                                >
                                    <ShieldOff className="w-4 h-4 text-red-400" />
                                    <span>Bloqués</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative w-full md:w-auto">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-slate-200 pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500/50 w-full md:w-80 outline-none transition-all placeholder:text-slate-500"
                    />
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    {error}
                </div>
            )}

            {/* Users Table Card */}
            <div className="bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-700">
                                <th style={{ width: '18%' }} className="p-3 font-semibold text-xs uppercase tracking-wider">Utilisateur</th>
                                <th style={{ width: '8%' }} className="p-3 font-semibold text-xs uppercase tracking-wider">Pays</th>
                                <th style={{ width: '8%' }} className="p-3 font-semibold text-xs uppercase tracking-wider">Ville</th>
                                <th style={{ width: '11%' }} className="p-3 font-semibold text-xs uppercase tracking-wider">IP</th>
                                <th style={{ width: '11%' }} className="p-3 font-semibold text-xs uppercase tracking-wider">Appareil</th>
                                <th style={{ width: '11%' }} className="p-3 font-semibold text-xs uppercase tracking-wider">Activité</th>
                                <th style={{ width: '9%' }} className="p-3 font-semibold text-xs uppercase tracking-wider">Rôle</th>
                                <th style={{ width: '8%' }} className="p-3 font-semibold text-xs uppercase tracking-wider">Statut</th>
                                <th style={{ width: '8%' }} className="p-3 font-semibold text-xs uppercase tracking-wider">Email</th>
                                <th style={{ width: '8%' }} className="p-3 font-semibold text-xs uppercase tracking-wider text-right">Options</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50 text-xs">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={10} className="p-8 text-center text-slate-400 text-sm">
                                        Chargement...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="p-8 text-center text-slate-400 text-sm">
                                        Aucun utilisateur trouvé pour ce filtre.
                                    </td>
                                </tr>
                            ) : (
                                currentUsers.map((user) => {
                                    const activity = formatActivity(user);
                                    return (
                                        <tr key={user.id} className="hover:bg-slate-700/20 transition-colors group">
                                            {/* User Info */}
                                            <td className="p-3 truncate">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0">
                                                        {user.firstName[0]}{user.lastName[0]}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-medium text-white truncate" title={`${user.firstName} ${user.lastName}`}>{user.firstName} {user.lastName}</div>
                                                        <div className="text-slate-500 truncate text-xs" title={user.email}>{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Pays */}
                                            <td className="p-3 truncate">
                                                <div className="flex items-center gap-2 text-slate-300">
                                                    {user.countryCode ? (
                                                        <img
                                                            src={`https://flagcdn.com/w20/${user.countryCode.toLowerCase()}.png`}
                                                            alt={user.country || "Flag"}
                                                            className="h-3.5 w-5 object-cover rounded-[2px] shadow-sm"
                                                        />
                                                    ) : <Globe className="h-4 w-4 text-slate-600" />}
                                                    <span className="truncate">{user.country || '-'}</span>
                                                </div>
                                            </td>

                                            {/* Ville */}
                                            <td className="p-3 text-slate-300 truncate">
                                                <span className="truncate block">{user.city || '-'}</span>
                                            </td>

                                            {/* IP */}
                                            <td className="p-3">
                                                <code className="bg-slate-900/50 px-2 py-1 rounded text-xs text-slate-400 font-mono truncate block text-center">
                                                    {user.ipAddress || 'Aucune IP'}
                                                </code>
                                            </td>

                                            {/* Device */}
                                            <td className="p-3">
                                                <div className="flex items-center gap-2 text-slate-300 truncate">
                                                    <DeviceIcon type={user.deviceType || user.device} className="h-4 w-4 text-slate-500 shrink-0" />
                                                    <span className="truncate" title={`${user.os} - ${user.browser}`}>
                                                        {(user.deviceType?.toLowerCase().includes('mobile') || user.device?.toLowerCase().includes('mobile') || user.device?.toLowerCase().includes('android') || user.device?.toLowerCase().includes('ios'))
                                                            ? (user.deviceType?.includes('ios') ? 'iPhone' : user.os || 'Mobile')
                                                            : (user.browser || 'Web')}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Activité */}
                                            <td className="p-3">
                                                <div className={`flex items-center gap-2 ${activity.isOnline ? 'text-green-400' : 'text-yellow-500'} truncate`}>
                                                    <div className={`h-2 w-2 rounded-full shrink-0 ${activity.isOnline ? 'bg-green-400' : 'bg-yellow-500'}`}></div>
                                                    <span className="truncate">{activity.text}</span>
                                                </div>
                                            </td>

                                            {/* Role */}
                                            <td className="p-3">
                                                <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${user.role === 'ADMIN'
                                                    ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                                                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="p-3">
                                                {user.isBlocked ? (
                                                    <span className="text-red-400 flex items-center gap-2 truncate">
                                                        <div className="h-6 w-6 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                                                            <ShieldOff className="h-3.5 w-3.5" />
                                                        </div>
                                                        Bloqué
                                                    </span>
                                                ) : (
                                                    <span className="text-green-400 flex items-center gap-2 truncate">
                                                        <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                                                                <path fill="currentColor" fillRule="evenodd" d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2s10 4.477 10 10m-5.97-3.03a.75.75 0 0 1 0 1.06l-5 5a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 1 1 1.06-1.06l1.47 1.47l2.235-2.235L14.97 8.97a.75.75 0 0 1 1.06 0" clipRule="evenodd"/>
                                                            </svg>
                                                        </div>
                                                        Actif
                                                    </span>
                                                )}
                                            </td>

                                            {/* Email */}
                                            <td className="p-3">
                                                {user.emailVerified ? (
                                                    <span className="text-green-400 flex items-center gap-2 truncate">
                                                        <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                                            <BadgeCheck className="h-3.5 w-3.5" />
                                                        </div>
                                                        Vérifié
                                                    </span>
                                                ) : (
                                                    <span className="text-yellow-500 flex items-center gap-2 truncate">
                                                        <div className="h-6 w-6 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                                                            <Clock className="h-3.5 w-3.5" />
                                                        </div>
                                                        Non vérifié
                                                    </span>
                                                )}
                                            </td>

                                            {/* Options */}
                                            <td className="p-3 text-right">
                                                <button
                                                    onClick={(e) => openDropdown(e, user.id)}
                                                    className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                                                >
                                                    <MoreVertical className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {users.length > usersPerPage && (
                    <div className="p-4 border-t border-slate-700 flex justify-between items-center text-sm text-slate-400">
                        <div>
                            Page {currentPage} sur {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded disabled:opacity-50 transition-colors"
                            >
                                Précédent
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded disabled:opacity-50 transition-colors"
                            >
                                Suivant
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Fixed Dropdown Menu */}
            {openMenuId && menuPosition && (
                <div
                    ref={menuRef}
                    className="fixed w-56 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-2xl z-50 overflow-hidden animation-fade-in"
                    style={{
                        top: menuPosition.top,
                        right: menuPosition.right
                    }}
                >
                    <div className="p-1.5">
                        {(() => {
                            const user = users.find(u => u.id === openMenuId);
                            if (!user) return null;

                            return (
                                <div className="space-y-1">
                                    <button
                                        onClick={() => confirmAction(user, 'ROLE')}
                                        disabled={user.role === 'ADMIN' && users.filter(u => u.role === 'ADMIN').length <= 1}
                                        className="w-full text-left px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg flex items-center gap-3 transition-all duration-200 cursor-pointer hover:pl-4 group disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className="p-1.5 rounded-md bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20 transition-colors">
                                            <UserCheck className="h-4 w-4" />
                                        </div>
                                        <span className="font-medium">{user.role === 'ADMIN' ? 'Rétrograder' : 'Promouvoir Admin'}</span>
                                    </button>

                                    <button
                                        onClick={() => confirmAction(user, 'BLOCK')}
                                        disabled={user.role === 'ADMIN'}
                                        className="w-full text-left px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg flex items-center gap-3 transition-all duration-200 cursor-pointer hover:pl-4 group disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <div className={`p-1.5 rounded-md ${user.isBlocked ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'} group-hover:bg-opacity-20 transition-colors`}>
                                            {user.isBlocked ? <Check className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                                        </div>
                                        <span className="font-medium">{user.isBlocked ? 'Débloquer le compte' : 'Bloquer l\'accès'}</span>
                                    </button>

                                    <div className="h-px bg-slate-700/50 mx-2 my-1"></div>

                                    <button
                                        onClick={() => confirmAction(user, 'DELETE')}
                                        className="w-full text-left px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg flex items-center gap-3 transition-all duration-200 cursor-pointer hover:pl-4 group"
                                    >
                                        <div className="p-1.5 rounded-md bg-red-500/10 text-red-400 group-hover:bg-red-500/20 transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </div>
                                        <span className="font-medium">Supprimer</span>
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Action Confirmation Modal */}
            {modalAction && selectedUser && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animation-fade-in">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl transform transition-all scale-100 relative overflow-hidden">
                        
                        <div className="flex flex-col items-center text-center space-y-4">
                            {/* Icon Circle */}
                            <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-2 ${
                                modalAction === 'DELETE' ? 'bg-red-500/10 text-red-500' :
                                modalAction === 'BLOCK' ? (selectedUser.isBlocked ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500') :
                                'bg-blue-500/10 text-blue-500'
                            }`}>
                                {modalAction === 'DELETE' && <Trash2 className="h-8 w-8" />}
                                {modalAction === 'BLOCK' && (selectedUser.isBlocked ? <BadgeCheck className="h-8 w-8" /> : <ShieldOff className="h-8 w-8" />)}
                                {modalAction === 'ROLE' && <UserCheck className="h-8 w-8" />}
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-bold text-white">
                                {modalAction === 'DELETE' && 'Supprimer l\'utilisateur ?'}
                                {modalAction === 'BLOCK' && (selectedUser.isBlocked ? 'Débloquer l\'utilisateur ?' : 'Bloquer l\'utilisateur ?')}
                                {modalAction === 'ROLE' && 'Modifier le rôle ?'}
                            </h3>

                            {/* Description */}
                            <p className="text-slate-400 text-sm leading-relaxed px-4">
                                {modalAction === 'DELETE' && `Êtes-vous sûr de vouloir supprimer définitivement le compte de ${selectedUser.firstName} ${selectedUser.lastName} ? Cette action est irréversible.`}
                                {modalAction === 'BLOCK' && (selectedUser.isBlocked 
                                    ? `Voulez-vous redonner l'accès à la plateforme à ${selectedUser.firstName} ${selectedUser.lastName} ?`
                                    : `Voulez-vous restreindre l'accès de ${selectedUser.firstName} ${selectedUser.lastName} ? Il ne pourra plus se connecter.`
                                )}
                                {modalAction === 'ROLE' && `Vous êtes sur le point de changer le rôle de ${selectedUser.firstName} ${selectedUser.lastName} en ${selectedUser.role === 'ADMIN' ? 'Utilisateur' : 'Administrateur'}.`}
                            </p>

                            {/* Warning Box for critical actions */}
                            {(modalAction === 'DELETE' || (modalAction === 'BLOCK' && !selectedUser.isBlocked)) && (
                                <div className="w-full bg-red-500/5 border border-red-500/10 rounded-lg p-3 flex items-start gap-3 text-left">
                                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                    <span className="text-xs text-red-400 font-medium">
                                        Attention : Cette action peut avoir un impact important sur l'expérience de l'utilisateur.
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="grid grid-cols-2 gap-3 mt-8">
                            <button
                                onClick={closeModal}
                                disabled={isProcessing}
                                className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 font-medium hover:bg-slate-800 hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleAction}
                                disabled={isProcessing}
                                className={`px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed ${
                                    isProcessing 
                                        ? 'bg-slate-800 border border-slate-700' 
                                        : `text-white ${
                                            modalAction === 'DELETE' ? 'bg-red-600 hover:bg-red-700' :
                                            modalAction === 'BLOCK' ? (selectedUser?.isBlocked ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700') :
                                            'bg-blue-600 hover:bg-blue-700'
                                        }`
                                }`}
                            >
                                {isProcessing ? (
                                    <div className={`animate-spin rounded-full h-5 w-5 border-b-2 ${
                                        modalAction === 'DELETE' ? 'border-red-500' :
                                        modalAction === 'BLOCK' ? (selectedUser?.isBlocked ? 'border-green-500' : 'border-orange-500') :
                                        'border-blue-500'
                                    }`}></div>
                                ) : (
                                    <span>Confirmer</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
