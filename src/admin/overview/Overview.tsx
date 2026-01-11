import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { API_BASE_URL } from '../../utils/config';

const Overview = () => {
    const [stats, setStats] = useState({
        usersCount: 0,
        moviesCount: 0,
        channelsCount: 0,
        revenue: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/stats`, {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 ani-slide-in">
            {/* Stats Cards */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-colors">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                            <Icon icon="solar:users-group-rounded-bold" width="24" height="24" />
                        </div>
                        <p className="text-sm text-gray-400 font-medium">Total Utilisateurs</p>
                    </div>
                    <span className="text-xs font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded-full">+12%</span>
                </div>
                <h3 className="text-3xl font-bold text-white">{stats.usersCount}</h3>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-colors">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                            <Icon icon="solar:clapperboard-play-bold" width="24" height="24" />
                        </div>
                        <p className="text-sm text-gray-400 font-medium">Films & Séries</p>
                    </div>
                    <span className="text-xs font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded-full">+5%</span>
                </div>
                <h3 className="text-3xl font-bold text-white">{stats.moviesCount}</h3>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-colors">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                            <Icon icon="solar:tv-bold" width="24" height="24" />
                        </div>
                        <p className="text-sm text-gray-400 font-medium">Chaînes TV</p>
                    </div>
                    <span className="text-xs font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded-full">+8%</span>
                </div>
                <h3 className="text-3xl font-bold text-white">{stats.channelsCount}</h3>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm hover:bg-white/10 transition-colors">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                            <Icon icon="solar:wallet-money-bold" width="24" height="24" />
                        </div>
                        <p className="text-sm text-gray-400 font-medium">Revenus</p>
                    </div>
                    <span className="text-xs font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded-full">+5%</span>
                </div>
                <h3 className="text-3xl font-bold text-white">{stats.revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</h3>
            </div>
        </div>
    );
};

export default Overview;
