'use client';

import React from 'react';
import { APP_NAME, SOCIAL_LINKS } from '../../utils/config';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-black to-[#0a0a0a] text-gray-300 py-16 relative overflow-hidden">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
          {/* Section 1: Logo et Description */}
          <div className="lg:col-span-4 -ml-1 md:-ml-6 lg:-ml-[57px]">
            <div className="flex items-center space-x-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L20.5 6.5V17.5L12 22L3.5 17.5V6.5L12 2Z" fill="white" fillOpacity="0.9" />
                  <path d="M12 7L16.5 9.5V14.5L12 17L7.5 14.5V9.5L12 7Z" fill="#2563EB" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-white">{APP_NAME}</span>
            </div>
            <div className="mt-8 max-w-[90%]">
              <p className="text-gray-400 leading-relaxed text-sm">
                La référence du streaming gratuit. Accédez à une bibliothèque infinie de films, séries et chaînes TV, sans abonnement ni contraintes. Qualité cinéma directement chez vous.
              </p>
              <div className="flex space-x-4 mt-6">
                {/* Social Icons - Simplified/Elegant */}
                {[
                  { href: SOCIAL_LINKS.whatsapp, icon: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z", color: "hover:bg-black border border-white/10" },
                  { href: SOCIAL_LINKS.telegram, icon: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z", color: "bg-[#25D366] text-white" },
                  { href: SOCIAL_LINKS.discord, icon: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z", color: "bg-[#0088CC] text-white" },
                  { href: SOCIAL_LINKS.reddit, icon: "M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z", color: "bg-white text-[#FF4500] hover:bg-[#FF4500] hover:text-white border border-white/10" }
                ].map((social, idx) => (
                  <a key={idx} href={social.href} target="_blank" rel="noopener noreferrer" className={`w-8 h-8 flex items-center justify-center rounded-lg hover:scale-110 transition-transform duration-300 ${social.color.includes('bg') ? social.color : 'bg-black border border-white/10 text-white'}`}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d={social.icon} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Legal & Information */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Légal</h3>
            <ul className="mt-6 space-y-3 text-sm">
              <li><a href="/terms" className="text-gray-400 hover:text-blue-400 transition-colors">Conditions d'utilisation</a></li>
              <li><a href="/privacy" className="text-gray-400 hover:text-blue-400 transition-colors">Politique de confidentialité</a></li>
              <li><a href="/cookies" className="text-gray-400 hover:text-blue-400 transition-colors">Cookies</a></li>
            </ul>
          </div>

          {/* Column 3: Support & Contact */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Aide & Contact</h3>
            <ul className="mt-6 space-y-3 text-sm">
              <li><a href="/faq" className="text-gray-400 hover:text-blue-400 transition-colors">FAQ / Aide</a></li>
              <li><a href="/contact" className="text-gray-400 hover:text-blue-400 transition-colors">Contactez-nous</a></li>
            </ul>
          </div>

          {/* Column 4: Avis (New) */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Avis</h3>
            <ul className="mt-6 space-y-3 text-sm">
              <li>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-2 group">
                  Donnez-nous votre avis
                  <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 5: Newsletter (Spans 3 to push right) */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-white">Newsletter</h3>
            <div className="mt-8">
              <form className="flex flex-col space-y-4">
                <div className="relative flex w-full md:w-72">
                  <input
                    type="email"
                    placeholder="Votre adresse email professionnelle"
                    className="w-full bg-gray-800/80 text-gray-200 text-sm placeholder-gray-400 px-5 py-3.5 rounded-lg border-2 border-gray-700/50 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <button type="submit" className="w-full md:w-72 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3.5 rounded-lg hover:shadow-lg hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 cursor-pointer">
                  <span className="text-sm font-medium">S'abonner à la newsletter</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Barre de séparation et logos stores */}
        <div className="mt-16 pt-8 relative flex flex-col md:flex-row items-center justify-between gap-6">
          {/* New Separator Style - Centered Gradient */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

          <div className="flex items-center space-x-4 -ml-1 md:-ml-6 lg:-ml-[57px]">
            <span className="text-xs text-gray-500">© {new Date().getFullYear()} {APP_NAME}. Streaming Gratuit.</span>
          </div>

          {/* Centered Text instead of links */}
          <div className="hidden md:block text-xs text-gray-600 font-medium">
            Fait avec passion par l'équipe {APP_NAME}.
          </div>

          <div className="flex space-x-4 md:-mr-10 lg:-mr-[115px]">
            {/* App Store */}
            <a href="#" className="opacity-70 hover:opacity-100 hover:scale-105 transition-all">
              <img src="/app.svg" alt="App Store" className="h-11" />
            </a>

            {/* Google Play */}
            <a href="#" className="opacity-70 hover:opacity-100 hover:scale-105 transition-all">
              <img src="/android.svg" alt="Google Play" className="h-11" />
            </a>
          </div>
        </div>
      </div>
    </footer >
  );
};

export default Footer;