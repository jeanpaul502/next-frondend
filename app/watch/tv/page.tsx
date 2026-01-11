import { TVPlayer } from "../../../src/dashboard/TVPlayer";
import React, { Suspense } from 'react';

export default function WatchTVPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Chargement...</div>}>
            <TVPlayer />
        </Suspense>
    );
}
