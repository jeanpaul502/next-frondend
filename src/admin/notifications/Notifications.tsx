import React from 'react';
import { Icon } from '@iconify/react';

const Notifications = () => {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 min-h-[400px] flex flex-col items-center justify-center text-gray-400 animate-in fade-in duration-300">
            <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-blue-500">
                <Icon icon="solar:traffic-cone-bold" width="32" height="32" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Section Notifications en construction</h3>
            <p className="max-w-md text-center">
                L'interface pour l'envoi et la gestion des notifications est en cours de développement.
            </p>
        </div>
    );
};

export default Notifications;
