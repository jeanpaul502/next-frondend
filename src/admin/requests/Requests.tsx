import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { API_BASE_URL } from '../../utils/config';

interface MovieRequest {
    id: string;
    tmdbId: number;
    title: string;
    posterPath?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
    notifyEmail?: boolean;
    notifyWhatsapp?: boolean;
    notifyTelegram?: boolean;
    createdAt: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        country: string;
    };
}

const Requests = () => {
    const [requests, setRequests] = useState<MovieRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/requests`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED' | 'COMPLETED') => {
        try {
            const res = await fetch(`${API_BASE_URL}/requests/${id}/status`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                setRequests(requests.map(req => 
                    req.id === id ? { ...req, status } : req
                ));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'COMPLETED': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'REJECTED': return 'text-red-400 bg-red-400/10 border-red-400/20';
            default: return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'Approuvé';
            case 'COMPLETED': return 'Terminé';
            case 'REJECTED': return 'Refusé';
            default: return 'En attente';
        }
    };

    const getChannels = (req: MovieRequest) => {
        const channels: Array<{ key: string; label: string; className: string; icon: string }> = [];

        if (req.notifyEmail) {
            channels.push({ key: 'email', label: 'Email', className: 'text-blue-400 bg-blue-400/10 border-blue-400/20', icon: 'solar:letter-bold' });
        }
        if (req.notifyWhatsapp) {
            channels.push({ key: 'whatsapp', label: 'WhatsApp', className: 'text-green-400 bg-green-400/10 border-green-400/20', icon: 'logos:whatsapp-icon' });
        }
        if (req.notifyTelegram) {
            channels.push({ key: 'telegram', label: 'Telegram', className: 'text-sky-400 bg-sky-400/10 border-sky-400/20', icon: 'logos:telegram' });
        }

        return channels.length > 0
            ? channels
            : [{ key: 'email', label: 'Email', className: 'text-blue-400 bg-blue-400/10 border-blue-400/20', icon: 'solar:letter-bold' }];
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Demandes de Films</h2>
                    <p className="text-gray-400">Gérez les demandes d'ajout de contenu des utilisateurs</p>
                </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-white/5 text-xs uppercase text-gray-300">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Film</th>
                                <th className="px-6 py-4 font-semibold">Utilisateur</th>
                                <th className="px-6 py-4 font-semibold">Canal</th>
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold">Statut</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {requests.length > 0 ? (
                                requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {req.posterPath ? (
                                                    <div className="h-16 w-10 overflow-hidden rounded bg-gray-800 flex-shrink-0">
                                                        <img 
                                                            src={`https://image.tmdb.org/t/p/w92${req.posterPath}`} 
                                                            alt={req.title} 
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="h-16 w-10 rounded bg-gray-800 flex items-center justify-center flex-shrink-0">
                                                        <Icon icon="solar:clapperboard-play-linear" className="text-gray-500" width={20} />
                                                    </div>
                                                )}
                                                <div className="font-medium text-white">{req.title}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-white font-medium">{req.user.firstName} {req.user.lastName}</div>
                                            <div className="text-xs text-gray-500">{req.user.email}</div>
                                            <div className="text-xs text-gray-500">{req.user.country}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {getChannels(req).map((c) => (
                                                    <span
                                                        key={c.key}
                                                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${c.className}`}
                                                    >
                                                        <Icon icon={c.icon} width={14} />
                                                        {c.label}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {new Date(req.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(req.status)}`}>
                                                {getStatusLabel(req.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {req.status === 'PENDING' && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleStatusUpdate(req.id, 'APPROVED')}
                                                            className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg transition-colors"
                                                            title="Approuver"
                                                        >
                                                            <Icon icon="solar:check-circle-bold" width={20} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleStatusUpdate(req.id, 'REJECTED')}
                                                            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                            title="Refuser"
                                                        >
                                                            <Icon icon="solar:close-circle-bold" width={20} />
                                                        </button>
                                                    </>
                                                )}
                                                {req.status === 'APPROVED' && (
                                                    <button 
                                                        onClick={() => handleStatusUpdate(req.id, 'COMPLETED')}
                                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                                                    >
                                                        <Icon icon="solar:clapperboard-play-linear" width={16} />
                                                        Ajouter le contenu
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Aucune demande pour le moment
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Requests;
