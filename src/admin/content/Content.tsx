import React, { useState, useEffect, useRef } from 'react';
import {
    MoreVertical,
    Search,
    Trash2,
    Film,
    Tv,
    Plus,
    Calendar,
    Star,
    AlertTriangle,
    Loader2,
    X,
    CheckCircle,
    XCircle,
    PlayCircle,
    ChevronLeft,
    Clock,
    Layout
} from 'lucide-react';
import { API_BASE_URL } from '../../utils/config';
import MovieModal from './modals/MovieModal';
import SeriesModal from './modals/SeriesModal';

// --- Types ---
interface ContentItem {
    id: string;
    title: string;
    type: 'MOVIE' | 'SERIES';
    releaseYear?: number;
    rating?: number;
    poster?: string;
    genre?: string;
    duration?: string;
    episodes?: number;
    seasons?: number;
    status?: 'ACTIVE' | 'INACTIVE' | 'SCHEDULED';
    scheduledAt?: string;
    createdAt?: string;
    isHero?: boolean;
    isTop10?: boolean;
}

const Content = () => {
    // --- State ---
    const [contents, setContents] = useState<ContentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<'ALL' | 'MOVIE' | 'SERIES'>('ALL');

    // Dropdown State
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number, right: number } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addContentType, setAddContentType] = useState<'MOVIE' | 'SERIES' | null>(null);
    const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
    const [modalAction, setModalAction] = useState<'DELETE' | 'STATUS' | 'PROGRAM' | 'DISPLAY' | null>(null);
    const [programDate, setProgramDate] = useState('');
    const [programTime, setProgramTime] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // --- Mock Data (Replace with API call later) ---
    const fetchContents = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        setError(null);
        try {
            // Fetch Movies from Backend
            let movies: ContentItem[] = [];
            try {
                const res = await fetch(`${API_BASE_URL}/movies`, {
                credentials: 'include'
            });
                if (res.ok) {
                    const data = await res.json();
                    movies = data.map((m: any) => ({
                        id: m.id,
                        title: m.title,
                        type: 'MOVIE',
                        releaseYear: m.releaseDate ? new Date(m.releaseDate).getFullYear() : undefined,
                        rating: m.voteAverage,
                        poster: m.posterPath ? (m.posterPath.startsWith('http') ? m.posterPath : `https://image.tmdb.org/t/p/w92${m.posterPath}`) : undefined,
                        genre: m.category || (m.genre ? m.genre.split(',')[0] : 'Film'),
                        duration: m.duration ? `${Math.floor(m.duration / 60)}h ${m.duration % 60}m` : undefined,
                        status: 'ACTIVE',
                        createdAt: m.createdAt,
                        isHero: m.isHero,
                        isTop10: m.isTop10
                    }));
                }
            } catch (e) {
                console.error("Backend fetch failed", e);
            }

            // Mock Data for Series (removed as per request)
            const mockSeries: ContentItem[] = [];

            setContents(movies);
        } catch (err) {
            setError('Erreur lors du chargement des contenus');
        } finally {
            if (showLoading) setIsLoading(false);
        }
    };

    // --- Effects ---
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchContents();
            setCurrentPage(1);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]); // Reload on search change

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                closeDropdown();
            }
        };
        const handleScroll = () => closeDropdown();

        if (openMenuId) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [openMenuId]);

    // --- Helpers ---
    const closeDropdown = () => {
        setOpenMenuId(null);
        setMenuPosition(null);
    };

    const openDropdown = (e: React.MouseEvent<HTMLButtonElement>, contentId: string) => {
        e.stopPropagation();
        if (openMenuId === contentId) {
            closeDropdown();
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + 4,
                right: window.innerWidth - rect.right
            });
            setOpenMenuId(contentId);
        }
    };

    const closeModal = () => {
        setModalAction(null);
        setSelectedContent(null);
        closeDropdown();
        setProgramDate('');
        setProgramTime('');
    };

    const confirmAction = (content: ContentItem, action: 'DELETE' | 'STATUS' | 'PROGRAM' | 'DISPLAY') => {
        setSelectedContent(content);
        setModalAction(action);
        closeDropdown();
    };

    // --- Filter Logic ---
    const filteredContents = contents.filter(item => {
        const matchesFilter = filterType === 'ALL' || item.type === filterType;
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredContents.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredContents.length / itemsPerPage);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                {/* Left: Type Filter */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                        <button
                            onClick={() => { setFilterType('ALL'); setCurrentPage(1); }}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === 'ALL'
                                ? 'bg-slate-700 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            Tout
                        </button>
                        <button
                            onClick={() => { setFilterType('MOVIE'); setCurrentPage(1); }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === 'MOVIE'
                                ? 'bg-blue-500/10 text-blue-400 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            <Film className="w-4 h-4" />
                            <span>Films</span>
                        </button>
                        <button
                            onClick={() => { setFilterType('SERIES'); setCurrentPage(1); }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === 'SERIES'
                                ? 'bg-violet-500/10 text-violet-400 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            <Tv className="w-4 h-4" />
                            <span>Séries</span>
                        </button>
                    </div>

                    {/* Add Content Modals */}
                    {isAddModalOpen && (
                        <>
                            {!addContentType ? (
                                /* Selection Modal (Inline) */
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                                    <div className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden w-full transition-all duration-300 max-w-lg relative">

                                        {/* Background Decoration */}
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

                                        {/* Header */}
                                        <div className="flex items-center justify-between p-6 pb-2">
                                            <h2 className="text-xl font-bold text-white">Ajouter du contenu</h2>
                                            <button
                                                onClick={() => setIsAddModalOpen(false)}
                                                className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white cursor-pointer"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Content */}
                                        <div className="p-6 space-y-6">
                                            <div className="space-y-2">
                                                <p className="text-slate-300 text-sm leading-relaxed">
                                                    Veuillez sélectionner le type de contenu multimédia que vous souhaitez importer dans le catalogue.
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4">
                                                <button
                                                    onClick={() => setAddContentType('MOVIE')}
                                                    className="group relative p-4 rounded-xl bg-slate-800 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 flex items-start gap-5 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer text-left"
                                                >
                                                    <div className="h-14 w-14 shrink-0 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 border border-blue-500/20 group-hover:border-blue-500/40 mt-1">
                                                        <Film className="w-7 h-7 text-blue-400 group-hover:text-blue-300" />
                                                    </div>
                                                    <div className="space-y-1 pr-8">
                                                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                                            Nouveau Film
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium border border-blue-500/20">Unique</span>
                                                        </h3>
                                                        <p className="text-sm text-slate-400 leading-snug group-hover:text-slate-300">
                                                            Ajoutez un long métrage, un documentaire ou un spectacle.
                                                        </p>
                                                    </div>
                                                    <ChevronLeft className="w-5 h-5 text-slate-500 rotate-180 absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>

                                                <button
                                                    onClick={() => setAddContentType('SERIES')}
                                                    className="group relative p-4 rounded-xl bg-slate-800 border border-slate-700/50 hover:border-violet-500/50 transition-all duration-300 flex items-start gap-5 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-violet-500/10 cursor-pointer text-left"
                                                >
                                                    <div className="h-14 w-14 shrink-0 rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-600/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 border border-violet-500/20 group-hover:border-violet-500/40 mt-1">
                                                        <Tv className="w-7 h-7 text-violet-400 group-hover:text-violet-300" />
                                                    </div>
                                                    <div className="space-y-1 pr-8">
                                                        <h3 className="text-lg font-bold text-white group-hover:text-violet-400 transition-colors flex items-center gap-2">
                                                            Nouvelle Série
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 font-medium border border-violet-500/20">Saisons</span>
                                                        </h3>
                                                        <p className="text-sm text-slate-400 leading-snug group-hover:text-slate-300">
                                                            Créez une série TV avec plusieurs saisons et épisodes.
                                                        </p>
                                                    </div>
                                                    <ChevronLeft className="w-5 h-5 text-slate-500 rotate-180 absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </button>
                                            </div>

                                            <div className="pt-2">
                                                <button
                                                    onClick={() => setIsAddModalOpen(false)}
                                                    className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-sm font-medium cursor-pointer border border-slate-700/50 hover:border-slate-600"
                                                >
                                                    Annuler la création
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : addContentType === 'MOVIE' ? (
                                <MovieModal
                                    onClose={() => { setIsAddModalOpen(false); setAddContentType(null); }}
                                    onBack={() => setAddContentType(null)}
                                    onSuccess={() => fetchContents(false)}
                                />
                            ) : (
                                <SeriesModal
                                    onClose={() => { setIsAddModalOpen(false); setAddContentType(null); }}
                                    onBack={() => setAddContentType(null)}
                                />
                            )}
                        </>
                    )}
                </div>

                {/* Center: Search */}
                <div className="relative w-full md:w-auto flex-1 flex justify-center">
                    <div className="relative w-full md:w-96 lg:w-[32rem]">
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Rechercher un titre..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-slate-200 pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500/50 w-full outline-none transition-all placeholder:text-slate-500"
                        />
                    </div>
                </div>

                {/* Right: Add Button */}
                <div className="w-full md:w-auto flex justify-end">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 hover:-translate-y-0.5 active:translate-y-0 text-sm font-medium group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        <span>Ajouter du contenu</span>
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    {error}
                </div>
            )}

            {/* Content Table Card */}
            <div className="bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-700">
                                <th style={{ width: '5%' }} className="p-3 font-semibold text-xs uppercase tracking-wider">Affiche</th>
                                <th style={{ width: '20%' }} className="p-3 font-semibold text-xs uppercase tracking-wider pl-4">Titre</th>
                                <th style={{ width: '10%' }} className="p-3 font-semibold text-xs uppercase tracking-wider">Type</th>
                                <th style={{ width: '8%' }} className="p-3 font-semibold text-xs uppercase tracking-wider">Année</th>
                                <th style={{ width: '12%' }} className="p-3 font-semibold text-xs uppercase tracking-wider">Genre</th>
                                <th style={{ width: '8%' }} className="p-3 font-semibold text-xs uppercase tracking-wider">Épisodes</th>
                                <th style={{ width: '8%' }} className="p-3 font-semibold text-xs uppercase tracking-wider">Saisons</th>
                                <th style={{ width: '8%' }} className="p-3 font-semibold text-xs uppercase tracking-wider">Note</th>
                                <th style={{ width: '10%' }} className="p-3 font-semibold text-xs uppercase tracking-wider pl-4">Statut</th>
                                <th style={{ width: '11%' }} className="p-3 font-semibold text-xs uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50 text-sm">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-400">
                                        <div className="flex justify-center items-center gap-2">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span>Chargement...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredContents.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-400">
                                        Aucun contenu trouvé.
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-700/20 transition-colors group">
                                        {/* Affiche */}
                                        <td className="p-3">
                                            <div className="h-10 w-8 bg-slate-700 rounded shadow-sm flex items-center justify-center shrink-0 text-slate-500 text-xs overflow-hidden relative group-hover:scale-105 transition-transform">
                                                {item.poster ? (
                                                    <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Film className="h-4 w-4" />
                                                )}
                                            </div>
                                        </td>

                                        {/* Title */}
                                        <td className="p-3 pl-4">
                                            <div className="font-medium text-white truncate pr-4" title={item.title}>{item.title}</div>
                                        </td>

                                        {/* Type */}
                                        <td className="p-3">
                                            {item.type === 'MOVIE' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                    <Film className="h-3 w-3" /> Film
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                                                    <Tv className="h-3 w-3" /> Série
                                                </span>
                                            )}
                                        </td>

                                        {/* Year */}
                                        <td className="p-3 text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                                                {item.releaseYear}
                                            </div>
                                        </td>

                                        {/* Genre */}
                                        <td className="p-3 text-slate-300">
                                            <span className="px-2 py-1 rounded bg-slate-700/50 text-xs whitespace-nowrap">
                                                {item.genre}
                                            </span>
                                        </td>

                                        {/* Episodes */}
                                        <td className="p-3 text-slate-300">
                                            {item.type === 'SERIES' && item.episodes ? (
                                                <div className="flex items-center gap-2">
                                                    <Tv className="h-3.5 w-3.5 text-slate-500" />
                                                    {item.episodes}
                                                </div>
                                            ) : (
                                                <span className="text-slate-600 pl-2">-</span>
                                            )}
                                        </td>

                                        {/* Seasons (New) */}
                                        <td className="p-3 text-slate-300">
                                            {item.type === 'SERIES' && item.seasons ? (
                                                <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-medium text-center inline-block min-w-[2rem]">
                                                    {item.seasons}
                                                </span>
                                            ) : (
                                                <span className="text-slate-600 pl-2">-</span>
                                            )}
                                        </td>

                                        {/* Rating */}
                                        <td className="p-3">
                                            <div className="flex items-center gap-1 text-amber-400">
                                                <Star className="h-3.5 w-3.5 fill-current" />
                                                <span className="text-slate-300">{item.rating}</span>
                                            </div>
                                        </td>

                                        {/* Status (New) */}
                                        {/* Status (New) */}
                                        <td className="p-3 pl-4">
                                            {item.status === 'SCHEDULED' ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-blue-500/10 text-blue-400 border-blue-500/20">
                                                        <Calendar className="h-3 w-3" />
                                                        {item.scheduledAt && new Date(item.scheduledAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-blue-500/10 text-blue-400 border-blue-500/20">
                                                        <Clock className="h-3 w-3" />
                                                        {item.scheduledAt && new Date(item.scheduledAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${item.status === 'ACTIVE'
                                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'ACTIVE' ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                                    {item.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={(e) => openDropdown(e, item.id)}
                                                className="p-1.5 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                                            >
                                                <MoreVertical className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {filteredContents.length > itemsPerPage && (
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

            {/* Dropdown Menu */}
            {openMenuId && menuPosition && (
                <div
                    ref={menuRef}
                    className="fixed w-48 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                    style={{
                        top: menuPosition.top,
                        right: menuPosition.right
                    }}
                >
                    <div className="p-1.5 space-y-1">
                        {(() => {
                            const item = contents.find(c => c.id === openMenuId);
                            if (!item) return null;
                            return (
                                <>
                                    <button
                                        onClick={() => confirmAction(item, 'PROGRAM')}
                                        className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                        <PlayCircle className="h-4 w-4" />
                                        <span>Programme</span>
                                    </button>

                                    <button
                                        onClick={() => confirmAction(item, 'DISPLAY')}
                                        className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                        <Layout className="h-4 w-4" />
                                        <span>Gérer l'affichage</span>
                                    </button>

                                    <div className="h-px bg-slate-700/50 my-1" />

                                    {item.status !== 'ACTIVE' ? (
                                        <button
                                            onClick={() => confirmAction(item, 'STATUS')}
                                            className="w-full text-left px-3 py-2 text-sm text-green-400 hover:bg-green-500/10 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                            <span>Activer</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => confirmAction(item, 'STATUS')}
                                            className="w-full text-left px-3 py-2 text-sm text-amber-400 hover:bg-amber-500/10 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                                        >
                                            <XCircle className="h-4 w-4" />
                                            <span>Désactiver</span>
                                        </button>
                                    )}

                                    <div className="h-px bg-slate-700/50 my-1" />

                                    <button
                                        onClick={() => confirmAction(item, 'DELETE')}
                                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span>Supprimer</span>
                                    </button>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Action Modals */}
            {modalAction && selectedContent && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl transform transition-all scale-100 relative overflow-hidden">

                        <div className="flex flex-col items-center text-center space-y-4">
                            {/* Icon Circle */}
                            <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-2 ${modalAction === 'DELETE' ? 'bg-red-500/10 text-red-500' :
                                modalAction === 'STATUS' ? (selectedContent.status === 'ACTIVE' ? 'bg-orange-500/10 text-orange-500' : 'bg-green-500/10 text-green-500') :
                                modalAction === 'DISPLAY' ? 'bg-purple-500/10 text-purple-500' :
                                    'bg-blue-500/10 text-blue-400'
                                }`}>
                                {modalAction === 'DELETE' && <Trash2 className="h-8 w-8" />}
                                {modalAction === 'STATUS' && (selectedContent.status === 'ACTIVE' ? <XCircle className="h-8 w-8" /> : <CheckCircle className="h-8 w-8" />)}
                                {modalAction === 'PROGRAM' && <PlayCircle className="h-8 w-8" />}
                                {modalAction === 'DISPLAY' && <Layout className="h-8 w-8" />}
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-bold text-white">
                                {modalAction === 'DELETE' && 'Supprimer ce contenu ?'}
                                {modalAction === 'STATUS' && (selectedContent.status === 'ACTIVE' ? 'Désactiver le contenu ?' : 'Activer le contenu ?')}
                                {modalAction === 'PROGRAM' && 'Programmer la publication'}
                                {modalAction === 'DISPLAY' && 'Gérer l\'affichage'}
                            </h3>

                            {/* Description */}
                            {modalAction === 'DELETE' && (
                                <p className="text-slate-400 text-sm leading-relaxed px-4">
                                    Êtes-vous sûr de vouloir supprimer <strong>{selectedContent.title}</strong> ?<br />
                                    Cette action est irréversible et supprimera toutes les données associées (épisodes, vidéos, métadonnées).
                                </p>
                            )}
                            {modalAction === 'STATUS' && (
                                <div className="text-slate-400 text-sm leading-relaxed px-4 space-y-2">
                                    <p>
                                        {selectedContent.status === 'ACTIVE'
                                            ? <span>Le contenu <strong>{selectedContent.title}</strong> ne sera plus visible par les utilisateurs sur la plateforme.</span>
                                            : <span>Le contenu <strong>{selectedContent.title}</strong> sera rendu visible immédiatement pour tous les utilisateurs.</span>
                                        }
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Vous pourrez modifier ce statut à tout moment.
                                    </p>
                                </div>
                            )}
                            {modalAction === 'PROGRAM' && (
                                <div className="w-full space-y-4 text-left">
                                    <p className="text-slate-400 text-sm text-center px-2">
                                        Définissez une date et une heure pour la publication automatique de <strong>{selectedContent.title}</strong>.
                                    </p>
                                    <div className="space-y-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-400">Date de publication</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                                <input
                                                    type="date"
                                                    value={programDate}
                                                    onChange={(e) => setProgramDate(e.target.value)}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-400">Heure</label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                                <input
                                                    type="time"
                                                    value={programTime}
                                                    onChange={(e) => setProgramTime(e.target.value)}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {modalAction === 'DISPLAY' && (
                                <div className="w-full space-y-4 text-left">
                                    <p className="text-slate-400 text-sm text-center px-2">
                                        Gérez l'affichage de <strong>{selectedContent.title}</strong> sur la page d'accueil.
                                    </p>
                                    <div className="space-y-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                        {/* Hero Toggle */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-medium text-white">Section Héros</h4>
                                                <p className="text-xs text-slate-400">Afficher en bannière principale</p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedContent({...selectedContent, isHero: !selectedContent.isHero})}
                                                className={`w-12 h-6 rounded-full transition-colors relative ${selectedContent.isHero ? 'bg-blue-600' : 'bg-slate-600'}`}
                                            >
                                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${selectedContent.isHero ? 'translate-x-6' : ''}`} />
                                            </button>
                                        </div>

                                        {/* Top 10 Toggle */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-sm font-medium text-white">Top 10</h4>
                                                <p className="text-xs text-slate-400">Afficher dans le classement Top 10</p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedContent({...selectedContent, isTop10: !selectedContent.isTop10})}
                                                className={`w-12 h-6 rounded-full transition-colors relative ${selectedContent.isTop10 ? 'bg-blue-600' : 'bg-slate-600'}`}
                                            >
                                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${selectedContent.isTop10 ? 'translate-x-6' : ''}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 w-full pt-4">
                                <button
                                    onClick={closeModal}
                                    disabled={isProcessing}
                                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-slate-600"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={async () => {
                                        setIsProcessing(true);
                                        try {
                                            if (modalAction === 'DISPLAY') {
                                                await fetch(`${API_BASE_URL}/movies/${selectedContent.id}`, {
                                                    method: 'PATCH',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        isHero: selectedContent.isHero,
                                                        isTop10: selectedContent.isTop10
                                                    })
                                                });
                                                await fetchContents(false);
                                            } else if (modalAction === 'DELETE') {
                                                 // Implement delete logic
                                                 if (selectedContent.type === 'MOVIE') {
                                                    await fetch(`${API_BASE_URL}/movies/${selectedContent.id}`, {
                                                        method: 'DELETE',
                                                        credentials: 'include'
                                                    });
                                                    await fetchContents(false);
                                                 }
                                            } else if (modalAction === 'STATUS') {
                                                 // Implement status update logic
                                            }
                                            
                                            // Close modal
                                            closeModal();
                                        } catch (error) {
                                            console.error('Error updating content:', error);
                                        } finally {
                                            setIsProcessing(false);
                                        }
                                    }}
                                    disabled={isProcessing}
                                    className={`flex-1 py-2.5 rounded-xl font-medium text-white shadow-lg transition-all transform hover:scale-105 cursor-pointer disabled:opacity-50 disabled:scale-100 ${modalAction === 'DELETE' ? 'bg-gradient-to-r from-red-600 to-red-500 hover:shadow-red-500/20' :
                                        modalAction === 'STATUS' ? (selectedContent.status === 'ACTIVE' ? 'bg-gradient-to-r from-orange-500 to-orange-400 hover:shadow-orange-500/20' : 'bg-gradient-to-r from-green-600 to-green-500 hover:shadow-green-500/20') :
                                        modalAction === 'DISPLAY' ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:shadow-purple-500/20' :
                                            'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/20'
                                        }`}
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Traitement...
                                        </span>
                                    ) : (
                                        <>
                                            {modalAction === 'DELETE' && 'Supprimer'}
                                            {modalAction === 'STATUS' && (selectedContent.status === 'ACTIVE' ? 'Désactiver' : 'Activer')}
                                            {modalAction === 'PROGRAM' && 'Programmer'}
                                            {modalAction === 'DISPLAY' && 'Enregistrer'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Content;