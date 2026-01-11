'use client';
import React, { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import Hls from 'hls.js';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, ArrowLeft, Settings, Fullscreen, Languages
} from 'lucide-react';
import { API_BASE_URL, buildApiUrlWithParams } from '../../utils/config'

interface Movie {
  url?: string;
  videoUrl?: string;
  title: string;
  [key: string]: any;
}

interface MoviePlayerProps {
  movie?: Movie;
  onClose?: () => void;
}

const MoviePlayer = ({ movie: movieProp, onClose }: MoviePlayerProps) => {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const movie: Movie | undefined = movieProp;
  const movieUrl = movie?.videoUrl || movie?.url || '';

  const [isMobile, setIsMobile] = useState(false);

  // Détection Mobile au montage
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = typeof window.navigator === "undefined" ? "" : navigator.userAgent;
      const mobile = Boolean(userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i));
      setIsMobile(mobile);
    };
    checkMobile();
  }, []);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showPauseOverlay, setShowPauseOverlay] = useState(false);

  // États pour les menus déroulants
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPiP, setShowPiP] = useState(false);

  // États pour les sous-menus des paramètres
  const [showSpeedSubmenu, setShowSpeedSubmenu] = useState(false);

  // État pour la carte de vitesse de lecture
  const [showSpeedCard, setShowSpeedCard] = useState(false);

  // États des sous-titres HLS
  const [subtitleTracks, setSubtitleTracks] = useState<any[]>([]);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<number>(-1);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState<boolean>(false);
  // Détection et états dérivés
  const [hasSubtitles, setHasSubtitles] = useState<boolean>(false);
  const [hasSources, setHasSources] = useState<boolean>(false);
  const [hasSpeed, setHasSpeed] = useState<boolean>(false);
  const [levels, setLevels] = useState<any[]>([]);
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number>(-1);
  const [currentQualityLabel, setCurrentQualityLabel] = useState<string>('Auto');
  const [currentSpeed, setCurrentSpeed] = useState<number>(1);

  // États audio (pistes de langue)
  const [audioTracks, setAudioTracks] = useState<any[]>([]);
  const [selectedAudioId, setSelectedAudioId] = useState<number>(-1);
  const [hasAudio, setHasAudio] = useState<boolean>(false);
  const [showAudio, setShowAudio] = useState<boolean>(false);

  // Helpers: extraire le codec audio d'une piste et vérifier le support navigateur
  const getAudioCodecFromTrack = (track: any): string => {
    return '';
  };
  const isAudioCodecSupported = (codec?: string): boolean => {
    return true;
  };

  // Fonction pour détecter si l'URL est au format HLS (m3u8)
  const isHlsUrl = (url: string) => {
    // Vérifier si l'URL est définie
    if (!url) return false;

    const hlsPatterns = [
      /\.m3u8(\?|#|$)/i,         // Capture .m3u8 avec ou sans paramètres ou fragments
      /\/playlist\.m3u8/i,       // Format playlist.m3u8
      /\/manifest\.m3u8/i,       // Format manifest.m3u8
      /\/master\.m3u8/i,         // Format master.m3u8
      /\/index\.m3u8/i,          // Format index.m3u8
      /\/stream\.m3u8/i,         // Format stream.m3u8
      /api\/proxy\/stream/i,     // URL du proxy interne
      /hls/i,                    // Contient "hls"
      /streaming/i,              // Contient "streaming"
      /application\/x-mpegURL/i, // Type MIME HLS
      /application\/vnd\.apple\.mpegurl/i // Type MIME HLS alternatif
    ];

    // Vérifier si l'URL correspond à l'un des modèles
    return hlsPatterns.some(pattern => pattern.test(url));
  };

  // Fonction pour proxifier les URLs HLS
  const getProxiedUrl = (url: string) => {
    // Si ce n'est pas une URL HLS, retourner l'URL originale
    if (!isHlsUrl(url)) return url;

    // Utiliser la construction d'URL centralisée qui renvoie un chemin relatif en même origine
    return buildApiUrlWithParams('/api/proxy/stream', { url });
  };

  // Fonction pour forcer la lecture automatique avec gestion des erreurs améliorée
  const forceAutoplay = (videoElement: HTMLVideoElement) => {
    let attempts = 0;
    const maxAttempts = 5;

    // Essayer de lancer la lecture avec plusieurs tentatives
    const attemptPlay = () => {
      if (attempts >= maxAttempts) {
        setBuffering(false);
        return;
      }

      attempts++;
      setBuffering(true);

      videoElement.play()
        .then(() => {
          setIsPlaying(true);
          setBuffering(false);
        })
        .catch((error) => {

          // Si la vidéo n'est pas prête, attendre qu'elle le soit
          if (videoElement.readyState < 2) {
            const onCanPlay = () => {
              videoElement.removeEventListener('canplay', onCanPlay);
              setTimeout(attemptPlay, 250);
            };
            videoElement.addEventListener('canplay', onCanPlay);
          } else {
            // Réessayer après un délai progressif
            setTimeout(attemptPlay, 500 * attempts);
          }
        });
    };

    // Démarrer les tentatives de lecture
    attemptPlay();
  };

  // Démarrer la lecture si un film est présent, ne pas rediriger sinon (pour permettre la restauration)
  useEffect(() => {
    if (!movie) return;

    if (videoRef.current) {
      forceAutoplay(videoRef.current);
    }
  }, [movie]);

  // Référence pour l'instance HLS
  const hlsRef = useRef<Hls | null>(null);

  // Gérer la lecture automatique et l'initialisation HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !movieUrl) return;

    // Vérifier si nous devons utiliser HLS.js
    const sourceUrl = getProxiedUrl(movieUrl);
    const shouldUseHls = isHlsUrl(sourceUrl);

    // Nettoyer l'instance HLS précédente si elle existe
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (shouldUseHls && Hls.isSupported()) {

      // Initialiser HLS.js avec des paramètres optimisés pour éviter les erreurs 429
      const hls = new Hls({
        debug: false,                     // Activer les logs de debug pour identifier les problèmes
        enableWorker: true,              // Utiliser un worker pour améliorer les performances
        maxBufferSize: 60 * 1024 * 1024, // Augmenter à 60MB pour éviter le re-buffering fréquent
        maxBufferLength: 60,             // Augmenter la taille du buffer
        maxMaxBufferLength: 600,         // Limite maximale du buffer
        maxBufferHole: 0.8,              // Tolérance plus grande pour les trous dans le buffer
        highBufferWatchdogPeriod: 2,     // Période de surveillance du buffer
        nudgeOffset: 0.2,               // Ajustement pour le saut de buffer
        startFragPrefetch: true,         // Précharger le premier fragment
        capLevelToPlayerSize: true,      // Adapter la qualité à la taille du lecteur
        // Paramètres de retry/timeout (API moderne Hls.js: *LoadPolicy)
        manifestLoadPolicy: {
          default: {
            maxTimeToFirstByteMs: 10000,
            maxLoadTimeMs: 20000,
            timeoutRetry: { maxNumRetry: 2, retryDelayMs: 1000, maxRetryDelayMs: 0 },
            errorRetry: { maxNumRetry: 1, retryDelayMs: 1000, maxRetryDelayMs: 8000 }
          }
        },
        fragLoadPolicy: {
          default: {
            maxTimeToFirstByteMs: 10000,
            maxLoadTimeMs: 120000,
            timeoutRetry: { maxNumRetry: 4, retryDelayMs: 1000, maxRetryDelayMs: 30000 },
            errorRetry: { maxNumRetry: 4, retryDelayMs: 1000, maxRetryDelayMs: 30000 }
          }
        },
        // Optimisation de l'ABR
        abrEwmaDefaultEstimate: 500000,  // Estimation plus conservative
        abrBandWidthFactor: 0.95,        // Plus agressif dans l'adaptation
        startLevel: -1,                  // Auto-sélection du niveau initial
        // Paramètres supplémentaires pour améliorer la stabilité
        testBandwidth: true,             // Tester la bande passante pour une meilleure adaptation
        progressive: true,               // Chargement progressif pour une meilleure expérience
        lowLatencyMode: false,           // Désactiver le mode faible latence pour plus de stabilité
        // Sous-titres
        enableWebVTT: true,
        enableCEA708Captions: true,
        renderTextTracksNatively: false,
      });

      // Configuration du buffer initial
      let initialBufferFilled = false;

      video.addEventListener('loadedmetadata', () => {
        // Mettre en pause initialement pour permettre le remplissage du buffer
        video.pause();
        initialBufferFilled = false;
      });

      video.addEventListener('progress', () => {
        if (!initialBufferFilled && video.buffered.length) {
          const bufferedEnd = video.buffered.end(video.buffered.length - 1);
          // Attendre d'avoir au moins 0.5 secondes de buffer (démarrage plus rapide)
          if (bufferedEnd >= 0.5) {
            initialBufferFilled = true;
            video.play().catch(() => { });
          }
        }
      });

      hls.loadSource(sourceUrl);
      hls.attachMedia(video);

      // Initialisation des sous-titres
      try {
        (hls as any).subtitleDisplay = false;
      } catch { }

      // Mettre à jour la liste des pistes de sous-titres lorsqu'elles sont détectées
      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED as any, (_event: any, data: any) => {
        // Code sous-titres retiré pour fluidité
        setSubtitleTracks([]);
        setHasSubtitles(false);
      });

      // Mettre à jour l'état quand on change de piste de sous-titre
      hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH as any, (_event: any, data: any) => {
        // Code sous-titres retiré pour fluidité
      });

      // Mettre à jour la liste des pistes audio (langues)
      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED as any, (_event: any, data: any) => {
        // Code audio retiré pour fluidité
        setAudioTracks([]);
        setHasAudio(false);
      });

      // Mettre à jour l'état quand on change de piste audio
      hls.on(Hls.Events.AUDIO_TRACK_SWITCHED as any, (_event: any, data: any) => {
        // Code audio retiré pour fluidité
      });

      // Ajouter des événements spécifiques à HLS pour la gestion des contrôles
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Mettre à jour la durée une fois que le manifeste est analysé
        if (video.duration) {
          setDuration(video.duration);
        }

        // Détection des sources (qualités) - Retiré pour fluidité
        setLevels([]);
        setHasSources(false);

        // Détection de la vitesse de lecture - Retiré pour fluidité
        setHasSpeed(false);

        // Commencer la lecture automatiquement sans couper le son
        // Note: Certains navigateurs peuvent bloquer l'autoplay avec son
        // mais nous respectons la préférence de l'utilisateur

        video.play().then(() => {
          setIsPlaying(true);
        }).catch((error) => {
          // Erreur ignorée
        });
      });

      // Gérer les événements de chargement et de buffer
      hls.on(Hls.Events.FRAG_LOADING, () => {
        if (!video.currentTime || video.readyState < 3) {
          setBuffering(true);
        }
      });

      hls.on(Hls.Events.FRAG_LOADED, () => {
        setBuffering(false);
      });

      // Gérer les événements de buffer
      hls.on(Hls.Events.BUFFER_APPENDED, () => {
        if (video.buffered.length) {
          const bufferedEnd = video.buffered.end(video.buffered.length - 1);
          if (bufferedEnd - video.currentTime > 2) {
            setBuffering(false);
          }
        }
      });



      // Mettre à jour la durée quand elle change
      hls.on(Hls.Events.LEVEL_LOADED, (_, data) => {
        if (data.details && data.details.totalduration) {
          setDuration(data.details.totalduration);
        }
      });

      // Gérer les mises à jour de temps pour la barre de progression
      video.addEventListener('timeupdate', () => {
        setCurrentTime(video.currentTime);
      });

      // Gérer les événements de lecture/pause
      video.addEventListener('play', () => setIsPlaying(true));
      video.addEventListener('pause', () => setIsPlaying(false));
      video.addEventListener('waiting', () => setBuffering(true));
      video.addEventListener('canplay', () => setBuffering(false));

      hls.on(Hls.Events.ERROR, (event, data) => {
        // Gestion spécifique et proactive des erreurs de buffer (avant le log d'erreur général)
        if (data.details === 'bufferStalledError' ||
          data.details === 'bufferSeekOverHole' ||
          data.details === 'bufferNudgeOnStall') {
          // Essayer de sauter le trou si nécessaire via le gestionnaire 'waiting'
          // mais laisser HLS.js tenter sa récupération aussi
          hls.recoverMediaError();
          return;
        }

        // Ignorer les logs pour les erreurs gérées automatiquement par les retries
        if (data.details !== Hls.ErrorDetails.FRAG_LOAD_ERROR && data.details !== Hls.ErrorDetails.FRAG_LOAD_TIMEOUT) {
          // Erreur HLS ignorée
        }

        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;
    } else {
      // Utiliser la lecture HTML5 standard
      video.src = sourceUrl;

      const handleLoadedMetadata = () => {
        setDuration(video.duration);
        // Détection fallback HTML5: sous-titres et vitesse
        try {
          const tracks = Array.from((video as any).textTracks || []);
          setHasSubtitles(tracks.length > 0);
          if (tracks.length > 0) {
            const mapped = tracks.map((t: any, i: number) => ({
              id: i,
              name: t.label || t.language || `Piste ${i + 1}`,
              lang: t.language || '',
            }));
            setSubtitleTracks(mapped);
          }
        } catch { }
        try {
          // Speed detection removed
        } catch { }
        // Commencer la lecture automatiquement
        video.play().then(() => {
          setIsPlaying(true);
        }).catch((error) => {
          // Ignorer l'erreur AbortError qui est normale
        });
      };

      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
      };

      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleWaiting = () => {
        setBuffering(true);
        const videoEl = videoRef.current;
        const hlsAny: any = hlsRef.current as any;
        if (!videoEl) return;
        try {
          const buffered = videoEl.buffered;
          if (buffered && buffered.length) {
            const last = buffered.length - 1;
            const end = buffered.end(last);
            if (end - videoEl.currentTime < 0.35) {
              // Si on est proche de la fin du buffer, on essaie d'avancer légèrement si possible
              // Mais attention à ne pas dépasser la fin réelle
              if (end > videoEl.currentTime) {
                videoEl.currentTime = Math.max(videoEl.currentTime, end - 0.05);
              }
            } else {
              for (let i = 0; i < buffered.length; i++) {
                const start = buffered.start(i);
                // Si on est coincé avant le début d'un segment tamponné
                if (videoEl.currentTime < start && start - videoEl.currentTime < 1.0) {
                  videoEl.currentTime = start + 0.1;
                  break;
                }
              }
            }
          }
        } catch { }
        try { if (hlsAny && typeof hlsAny.startLoad === 'function') hlsAny.startLoad(); } catch { }
        try {
          if (hlsAny && typeof hlsAny.nextLevel === 'number' && hlsAny.nextLevel > 0) {
            hlsAny.nextLevel = hlsAny.nextLevel - 1;
          }
        } catch { }
      };
      const handleCanPlay = () => { setBuffering(false); };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('waiting', handleWaiting);
      video.addEventListener('stalled', handleWaiting);
      video.addEventListener('canplay', handleCanPlay);

      return () => {
        if (video) {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          video.removeEventListener('timeupdate', handleTimeUpdate);
          video.removeEventListener('play', handlePlay);
          video.removeEventListener('pause', handlePause);
          video.removeEventListener('waiting', handleWaiting);
          video.removeEventListener('stalled', handleWaiting);
          video.removeEventListener('canplay', handleCanPlay);
        }

        // Nettoyer l'instance HLS si elle existe
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }
      };
    }
  }, [movie]);

  // Gérer les contrôles de lecture
  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch((error) => {
          // Ignorer l'erreur AbortError qui est normale
        });
      } else {
        videoRef.current.pause();
      }
    }
  };

  // Gérer le clic sur l'écran pour play/pause
  const handleScreenClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  // Fonction pour maintenir les contrôles visibles
  const keepControlsVisible = () => {
    setShowControls(true);
  };

  // Gérer la visibilité des contrôles et de l'overlay de pause
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const hasOpenMenu = showSubtitles || showSources || (showSettings || showSpeedCard) || showPiP || showAudio;
    const isVideoPaused = !isPlaying;

    // Si la lecture reprend, cacher l'overlay immédiatement
    if (isPlaying) {
      setShowPauseOverlay(false);
    }

    // Si les contrôles sont visibles
    if (showControls) {
      // Maintenir les contrôles visibles si un menu est ouvert
      if (hasOpenMenu) {
        return;
      }

      if (isVideoPaused) {
        // Si la vidéo est en pause, on garde les contrôles affichés
        // Et on affiche le logo après 2 secondes
        if (!showPauseOverlay) {
          timeout = setTimeout(() => {
            setShowPauseOverlay(true);
          }, 2000);
        }
      } else {
        // Si la vidéo est en lecture, on cache les contrôles après 10s
        timeout = setTimeout(() => {
          setShowControls(false);
        }, 10000);
      }
    } else {
      // Si les contrôles sont cachés et qu'on est en pause (ex: pause via clavier)
      // On les réaffiche car ils doivent toujours être visibles en pause
      if (isVideoPaused) {
        setShowControls(true);
      }
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [isPlaying, showControls, showSubtitles, showSources, showSettings, showPiP, showSpeedCard, showAudio, showPauseOverlay]);

  // Gérer le plein écran
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Gérer les touches clavier
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case 'f':
          event.preventDefault();
          toggleFullscreen();
          break;
        case ' ':
          event.preventDefault();
          togglePlay();
          break;
        case 'escape':
          if (document.fullscreenElement) {
            document.exitFullscreen();
            setIsFullscreen(false);
          }
          break;
        case 'c':
          // Raccourci clavier pour activer/désactiver les sous-titres rapidement
          event.preventDefault();
          if (hlsRef.current && (subtitleTracks?.length || 0) > 0) {
            const hlsAny: any = hlsRef.current as any;
            try {
              if (!subtitlesEnabled || selectedSubtitleId === -1) {
                hlsAny.subtitleDisplay = true;
                const id = typeof hlsAny.subtitleTrack === 'number' && hlsAny.subtitleTrack >= 0 ? hlsAny.subtitleTrack : 0;
                hlsAny.subtitleTrack = id;
                setSelectedSubtitleId(id);
                setSubtitlesEnabled(true);
              } else {
                hlsAny.subtitleDisplay = false;
                setSelectedSubtitleId(-1);
                setSubtitlesEnabled(false);
              }
            } catch { }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
    }
  };

  // État pour stocker le dernier volume non-muet
  const [lastNonMutedVolume, setLastNonMutedVolume] = useState<number>(1);

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    // Ne pas modifier isMuted via le slider; seul le bouton volume contrôle le mute
    if (videoRef.current) {
      if (isMuted) {
        // En muet: ne pas appliquer au <video>, juste mémoriser pour restauration
        if (newVolume > 0) setLastNonMutedVolume(newVolume);
      } else {
        // Non muet: appliquer et mémoriser
        videoRef.current.volume = newVolume;
        if (newVolume > 0) setLastNonMutedVolume(newVolume);
      }
    } else {
      if (newVolume > 0) setLastNonMutedVolume(newVolume);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        // Si déjà en sourdine, rétablir le volume à la dernière valeur non-muet
        videoRef.current.volume = lastNonMutedVolume;
        setVolume(lastNonMutedVolume);
        setIsMuted(false);
      } else {
        // Si le son est actif, le mettre en sourdine sans changer la valeur du volume
        videoRef.current.volume = 0;
        // Ne pas modifier setVolume ici pour conserver la position du curseur
        setIsMuted(true);
      }
    }
  };

  // Fonctions pour les menus déroulants
  const toggleSubtitles = () => {
    setShowSubtitles(!showSubtitles);
    setShowSources(false);
    setShowSettings(false);
    setShowPiP(false);
    setShowAudio(false);
  };

  const toggleSources = () => {
    setShowSources(!showSources);
    setShowSubtitles(false);
    setShowSettings(false);
    setShowPiP(false);
    setShowAudio(false);
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
    setShowSubtitles(false);
    setShowSources(false);
    setShowPiP(false);
    setShowAudio(false);
  };

  const togglePiP = () => {
    setShowPiP(!showPiP);
    setShowSubtitles(false);
    setShowSources(false);
    setShowSettings(false);
    setShowAudio(false);
  };

  const toggleAudio = () => {
    setShowAudio(!showAudio);
    setShowSubtitles(false);
    setShowSources(false);
    setShowSettings(false);
    setShowPiP(false);
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Masquer les contrôles après 10 secondes d'inactivité (au lieu de 3 secondes)
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (showControls) {
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 10000); // 10 secondes au lieu de 3000
    }

    return () => clearTimeout(timeout);
  }, [showControls]);

  // Fermer le menu des sous-titres quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSubtitles(false);
      setShowSources(false);
      // Fermer tous les menus automatiquement, y compris les paramètres
      setShowSettings(false);
      setShowPiP(false);
      setShowAudio(false);
    };

    document.addEventListener('click', handleClickOutside);

    // Empêcher le défilement de la page arrière-plan
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('click', handleClickOutside);
      // Rétablir le défilement
      document.body.style.overflow = '';
    };
  }, []);

  if (!movie) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 overflow-hidden"
      onMouseMove={() => {
        if (!isMobile) {
          setShowControls(true);
          setShowPauseOverlay(false);
        }
      }}
      onMouseLeave={() => !isMobile && setShowControls(false)}
    >
      {/* Zone de clic pour l'écran de lecture (séparée des contrôles) */}
      <div
        className="absolute inset-0 z-0"
        onClick={handleScreenClick}
      >
        <video
          ref={videoRef}
          className={`h-full bg-black ${isFullscreen
            ? 'w-full object-contain'
            : 'w-[100%] object-cover -ml-2'
            }`}
          preload="metadata"
          playsInline // Important pour iOS
        />
      </div>

      {/* En-tête avec bouton retour - Toujours visible pour pouvoir sortir */}
      <div className={`w-full absolute top-0 right-0 left-0 pointer-events-none z-20 transition-all duration-500 ease-in-out ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'
        }`}>
        <div className="absolute w-full transition-all z-10 top-0 left-0 right-0 h-[120px] bg-gradient-to-b to-transparent from-black/50"></div>
        <div className="relative z-20 p-8">
          <div className="flex w-full justify-between items-center">
            <div className="flex flex-row gap-4">
              <div className="flex flex-row items-center">
                <div className="pointer-events-auto flex flex-row items-center">
                  <button
                    className="flex items-center justify-center font-medium whitespace-nowrap relative overflow-hidden transition-all backdrop-blur-sm transform-gpu h-10 text-sm px-4 rounded-md bg-black/50 text-white hover:bg-black/70 focus-visible:outline-white/20 cursor-pointer gap-2"
                    onClick={() => onClose ? onClose() : router.back()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                    Retour
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pause Overlay - Logo & Description */}
      <AnimatePresence>
        {showPauseOverlay && !isPlaying && !buffering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-30 pointer-events-none flex items-center px-16 md:px-24"
          >
            <div className="max-w-xl space-y-6">
              {/* Logo ou Titre */}
              {movie?.logoPath ? (
                <img
                  src={movie.logoPath}
                  alt={movie?.title || 'Titre du film'}
                  className="w-80 md:w-[500px] object-contain drop-shadow-2xl"
                />
              ) : (
                <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-lg">
                  {movie?.title || ''}
                </h1>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicateur de chargement */}
      {buffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
        </div>
      )}

      {/* Contrôles */}
      <div className={`w-full absolute bottom-0 left-0 right-0 z-20 transition-all duration-500 ease-in-out px-4 pb-4 sm:px-8 sm:pb-8 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'
        }`}>
        {/* Bande noire qui commence en bas avec espace */}
        <div className={`absolute w-full transition-all bottom-0 left-0 right-0 bg-black z-10 ${isFullscreen ? 'h-[calc(100%-90px)]' : 'h-[calc(100%-140px)]'
          }`}></div>

        {/* Contrôles avec z-index plus élevé */}
        <div className="relative z-20 p-8 pt-2">
          <div className="flex flex-col w-full justify-between md:gap-1.5">
            {/* Barre de progression et titre */}
            <div className="flex justify-between mb-0" dir="ltr">
              <div className="flex flex-row justify-between items-end w-full pointer-events-none">
                <div className="w-full flex flex-col items-start">
                  <span className="text-md sm:text-lg text-white drop-shadow-lg font-medium">{movie.title}</span>
                </div>
              </div>
            </div>

            {/* Barre de progression interactive */}
            <div className="flex items-center space-x-3 pointer-events-auto mb-0">
              <div className="group relative w-full h-10 flex items-center cursor-pointer select-none"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const percentage = (clickX / rect.width) * 100;
                  if (videoRef.current) {
                    videoRef.current.currentTime = (percentage / 100) * duration;
                  }
                }}
              >
                <div className="w-full h-1 bg-white/25 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full transition-all duration-200 ease-out"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Contrôles principaux */}
            <div className="flex justify-between pointer-events-auto" dir="ltr">
              <div className="flex items-center gap-3">
                {/* Bouton Play/Pause */}
                <div className="flex items-center justify-center font-medium whitespace-nowrap relative overflow-hidden transition-all h-10 text-sm rounded-md cursor-pointer text-white bg-opacity-20 hover:bg-opacity-15 backdrop-blur-sm transform-gpu bg-white/5 py-0 px-0">
                  <button className="w-full h-full px-3 py-2.5 cursor-pointer" onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}>
                    {isPlaying ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Contrôle du volume */}
                <div
                  className="relative"
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  onMouseLeave={() => setShowVolumeSlider(false)}
                >
                  <div
                    className="justify-center font-medium whitespace-nowrap relative overflow-hidden transition-all h-10 text-sm px-4 rounded-md text-white bg-opacity-20 hover:bg-opacity-15 backdrop-blur-sm transform-gpu bg-white/5 pointer-events-auto flex items-center py-0 pr-1"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMute();
                      }}
                      className="pr-4 -ml-1 text-2xl text-white flex items-center cursor-pointer"
                      aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
                    >
                      {isMuted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                          <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"></path>
                          <path d="M2 2l20 20"></path>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                          <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"></path>
                          <path d="M16 9a5 5 0 0 1 0 6"></path>
                          <path d="M19.364 18.364a9 9 0 0 0 0-12.728"></path>
                        </svg>
                      )}
                    </button>

                    {/* Slider de volume qui s'ouvre au hover */}
                    <div className={`linear -ml-2 overflow-hidden transition-[width,opacity,padding] duration-300 ${showVolumeSlider ? 'w-24 opacity-100 px-2' : 'w-0 opacity-0 px-0'
                      }`}>
                      <div className="flex h-10 w-full items-center">
                        <div
                          className="relative h-1 flex-1 rounded-full bg-white bg-opacity-25 cursor-pointer"
                        >
                          <div className="absolute inset-y-0 left-0 flex items-center justify-end rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" style={{ width: `${isMuted ? 0 : volume * 100}%` }}>
                            <div className="absolute h-3 w-3 translate-x-1/2 rounded-full bg-white"></div>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={(e) => {
                              const newVolume = parseFloat(e.target.value);
                              setVolume(newVolume);
                              // Respecter l’état muet: ne pas appliquer au <video> quand isMuted est vrai
                              if (videoRef.current) {
                                if (isMuted) {
                                  if (newVolume > 0) setLastNonMutedVolume(newVolume);
                                } else {
                                  videoRef.current.volume = newVolume;
                                  if (newVolume > 0) setLastNonMutedVolume(newVolume);
                                }
                              } else if (newVolume > 0) {
                                setLastNonMutedVolume(newVolume);
                              }
                              // Ne jamais modifier isMuted ici; seulement via l’icône
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>


                </div>

                <div className="w-px mx-1 h-5 bg-white/25"></div>

                {/* Boutons Skip */}
                <button className="flex items-center justify-center font-medium whitespace-nowrap relative overflow-hidden transition-all h-10 text-sm px-4 rounded-md cursor-pointer text-white bg-opacity-20 hover:bg-opacity-15 backdrop-blur-sm transform-gpu bg-white/5" onClick={(e) => {
                  e.stopPropagation();
                  skipTime(-10);
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                    <path d="M3 3v5h5"></path>
                  </svg>
                  <span className="ml-1 text-xs font-medium">10</span>
                </button>

                <button className="flex items-center justify-center font-medium whitespace-nowrap relative overflow-hidden transition-all h-10 text-sm px-4 rounded-md cursor-pointer text-white bg-opacity-20 hover:bg-opacity-15 backdrop-blur-sm transform-gpu bg-white/5" onClick={(e) => {
                  e.stopPropagation();
                  skipTime(10);
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
                    <path d="M21 3v5h-5"></path>
                  </svg>
                  <span className="ml-1 text-xs font-medium">10</span>
                </button>

                <div className="w-px mx-1 h-5 bg-white/25"></div>

                {/* Affichage du temps */}
                <button className="justify-center font-medium whitespace-nowrap relative overflow-hidden transition-all h-10 text-sm px-4 rounded-md text-white bg-opacity-20 hover:bg-opacity-15 backdrop-blur-sm transform-gpu bg-white/5 flex items-center cursor-auto">
                  <div className="text-sm" data-type="current">{formatTime(currentTime)}</div>
                  <div className="mx-1 text-white/50 text-sm">/</div>
                  <div className="text-sm" data-type="duration">{formatTime(duration)}</div>
                </button>
              </div>

              {/* Contrôles de droite */}
              <div className="flex items-center gap-3">


                {/* Sous-titres & Audio */}
                <div className={`relative ${showSubtitles ? 'z-50' : ''}`}>
                  <button
                    type="button"
                    className="flex items-center justify-center font-medium whitespace-nowrap overflow-hidden transition-all h-10 text-sm rounded-md cursor-pointer text-white bg-opacity-20 hover:bg-opacity-15 backdrop-blur-sm transform-gpu bg-white/5 px-3 relative"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleSubtitles();
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                      <rect width="18" height="14" x="3" y="5" rx="2" ry="2"></rect>
                      <path d="M7 15h4M15 15h2M7 11h2M13 11h4"></path>
                    </svg>
                  </button>

                  {/* Menu des sous-titres */}
                  {showSubtitles && (
                    <div className="absolute bottom-full right-0 mb-2 z-[9999] min-w-[300px]" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col rounded-lg border border-white/10 bg-black/80 backdrop-blur-sm px-5 py-4 font-sans shadow-xl">
                        {/* Titre */}
                        <div className="font-medium text-white/90 text-base pt-0 px-0 border-b pb-3 border-white/10">
                          Audio & Sous-titres
                        </div>

                        {/* Options */}
                        <div className="pt-4 w-full">
                          <div className="w-full flex flex-col space-y-1">

                            {/* Section Audio */}
                            <div className="text-xs font-semibold text-white/50 uppercase mb-2 px-3">Audio</div>

                            {hasAudio && audioTracks && audioTracks.length > 0 ? (
                              audioTracks.map((track: any, index: number) => {
                                const id = typeof track?.id === 'number' ? track.id : index;
                                const lang = (track?.lang || track?.language || track?.name || '').toString().toLowerCase();
                                let label = 'Piste ' + (index + 1);
                                if (lang.includes('fr')) label = 'Français';
                                else if (lang.includes('en')) label = 'Anglais';
                                else if (track?.name) label = track.name;
                                else if (track?.lang) label = track.lang.toUpperCase();
                                const codec = (track?.codec || '').toString();
                                const supported = track?.codecSupported !== false;
                                const codecTag = codec ? `${codec.toUpperCase()}${supported ? '' : ' - non supporté'}` : '';
                                const displayLabel = codecTag ? `${label} (${codecTag})` : label;
                                const isSelected = selectedAudioId === id;
                                return (
                                  <button
                                    key={`aud-${id}`}
                                    className={`flex items-center font-medium whitespace-nowrap relative overflow-hidden transition-all h-10 text-sm px-4 sm:h-12 sm:text-base sm:px-5 rounded-md sm:rounded-lg cursor-pointer justify-between -ml-3 !px-3 !w-[calc(100%+1.5rem)] !py-2.5 !h-auto hover:bg-white/5 ${supported ? '' : 'opacity-50 cursor-not-allowed'}`}
                                    disabled={!supported}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!supported) return;
                                      if (hlsRef.current) {
                                        try {
                                          const hlsAny = hlsRef.current as any;
                                          hlsAny.audioTrack = id;
                                        } catch { }
                                      }
                                      setSelectedAudioId(id);
                                      try {
                                        localStorage.setItem('selectedAudioId', String(id));
                                      } catch { }
                                      // On ne ferme pas le menu pour permettre de changer les sous-titres aussi
                                    }}
                                  >
                                    <div className="flex items-center flex-1">
                                      <div className="flex-1 text-left text-white hover:text-white">
                                        {displayLabel}
                                      </div>
                                      {isSelected && (
                                        <div className="flex">
                                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-5 h-5 text-blue-400">
                                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd"></path>
                                          </svg>
                                        </div>
                                      )}
                                    </div>
                                  </button>
                                );
                              })
                            ) : (
                              <div className="px-3 py-2 text-white/50 text-sm">Aucune piste détectée</div>
                            )}

                            <div className="h-px w-full bg-white/10 my-2"></div>

                            {/* Section Sous-titres */}
                            <div className="text-xs font-semibold text-white/50 uppercase mb-2 px-3">Sous-titres</div>

                            {/* Option: Désactivés */}
                            <button
                              className="flex items-center font-medium whitespace-nowrap relative overflow-hidden transition-all h-10 text-sm px-4 sm:h-12 sm:text-base sm:px-5 rounded-md sm:rounded-lg cursor-pointer justify-between -ml-3 !px-3 !w-[calc(100%+1.5rem)] !py-2.5 !h-auto hover:bg-white/5"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (hlsRef.current) {
                                  const hlsAny = hlsRef.current as any;
                                  hlsAny.subtitleDisplay = false;
                                  setSubtitlesEnabled(false);
                                  setSelectedSubtitleId(-1);
                                }
                                setShowSubtitles(false);
                              }}
                            >
                              <div className="flex items-center flex-1">
                                <div className="flex-1 text-left text-white/50 hover:text-white">
                                  Désactivés
                                </div>
                                {(!subtitlesEnabled || selectedSubtitleId === -1) && (
                                  <div className="flex">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-5 h-5 text-blue-400">
                                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd"></path>
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </button>

                            {/* Liste des pistes disponibles */}
                            {subtitleTracks && subtitleTracks.length > 0 ? (
                              subtitleTracks.map((track: any, index: number) => {
                                const id = typeof track?.id === 'number' ? track.id : index;
                                const label = track?.name || track?.lang || `Piste ${index + 1}`;
                                const isSelected = subtitlesEnabled && selectedSubtitleId === id;
                                return (
                                  <button
                                    key={`sub-${id}`}
                                    className="flex items-center font-medium whitespace-nowrap relative overflow-hidden transition-all h-10 text-sm px-4 sm:h-12 sm:text-base sm:px-5 rounded-md sm:rounded-lg cursor-pointer justify-between -ml-3 !px-3 !w-[calc(100%+1.5rem)] !py-2.5 !h-auto hover:bg-white/5"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (hlsRef.current) {
                                        try {
                                          const hlsAny = hlsRef.current as any;
                                          hlsAny.subtitleDisplay = true;
                                          hlsAny.subtitleTrack = id;
                                        } catch { }
                                      }
                                      setSubtitlesEnabled(true);
                                      setSelectedSubtitleId(id);
                                      setShowSubtitles(false);
                                    }}
                                  >
                                    <div className="flex items-center flex-1">
                                      <div className="flex-1 text-left text-white hover:text-white">
                                        {label}
                                      </div>
                                      {isSelected && (
                                        <div className="flex">
                                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-5 h-5 text-blue-400">
                                            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd"></path>
                                          </svg>
                                        </div>
                                      )}
                                    </div>
                                  </button>
                                );
                              })
                            ) : (
                              <div className="px-3 py-2 text-white/50 text-sm">Aucune piste détectée</div>
                            )}
                          </div>


                        </div>

                        {/* Note d'aide */}
                        <span className="text-sm leading-4 italic mt-4 text-white/35 max-w-[300px] border-t pt-3 border-white/10">
                          Clique sur la touche "C" pour activer / désactiver rapidement les sous-titres
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Le bouton audio a été supprimé et intégré dans le menu des sous-titres */}
                {/* Le menu audio a été intégré dans le menu des sous-titres */}

                {/* Sources (Qualité) */}
                <div className="relative">
                  <button
                    type="button"
                    className="flex items-center justify-center font-medium whitespace-nowrap relative overflow-hidden transition-all h-10 text-sm rounded-md cursor-pointer text-white bg-opacity-20 hover:bg-opacity-15 backdrop-blur-sm transform-gpu bg-white/5 px-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSources();
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z"></path>
                    </svg>
                    <span className="text-white text-xs leading-3 font-semibold rounded-sm">{currentQualityLabel}</span>
                  </button>

                  {/* Menu des sources */}
                  {showSources && (
                    <div className="absolute bottom-full right-0 mb-8 z-[9999] min-w-[300px]">
                      <div className="flex flex-col rounded-lg border border-white/10 bg-black/80 backdrop-blur-sm px-5 py-4 font-sans shadow-xl">
                        {/* Titre */}
                        <div className="font-medium text-white text-base pt-0 px-0 border-b pb-3 border-white/10">
                          Sources disponibles
                        </div>

                        {/* Liste des sources */}
                        <div className="pt-4 w-full">
                          <div className="flex items-center justify-between py-2">
                            <span className="text-white">Aucune source disponible</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Paramètres */}
                <div className="relative">
                  <button
                    type="button"
                    className="flex items-center justify-center font-medium whitespace-nowrap relative overflow-hidden transition-all h-10 text-sm rounded-md cursor-pointer text-white bg-opacity-20 hover:bg-opacity-15 backdrop-blur-sm transform-gpu bg-white/5 px-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSettings();
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </button>

                  {/* Menu des paramètres */}
                  {showSettings && (
                    <div className="absolute bottom-full -right-8 mb-8 z-[9999] min-w-[300px]">
                      {!showSpeedCard ? (
                        // Carte principale des paramètres
                        <div className="flex flex-col rounded-lg border border-white/10 bg-black/80 backdrop-blur-sm px-5 py-4 font-sans shadow-xl">
                          {/* Titre */}
                          <div className="font-medium text-white text-base pt-0 px-0 border-b pb-3 border-white/10">
                            Paramètres
                          </div>

                          {/* Section Vitesse de lecture */}
                          <div
                            className="flex items-center justify-between py-3 px-3 hover:bg-white/5 cursor-pointer transition-colors rounded"
                            onClick={(e) => {
                              e.stopPropagation(); // Empêcher la propagation du clic
                              setShowSpeedCard(true);
                            }}
                          >
                            <span className="text-white">Vitesse de lecture</span>
                            <div className="flex items-center gap-2">
                              <span className="text-white">{currentSpeed === 1 ? 'normale' : `${currentSpeed}x`}</span>
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white">
                                <path d="m9 18 6-6-6-6" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Carte de vitesse de lecture
                        <div className="flex flex-col rounded-lg border border-white/10 bg-black/80 backdrop-blur-sm px-5 py-4 font-sans shadow-xl">
                          {/* En-tête avec flèche de retour */}
                          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Empêcher la propagation du clic
                                setShowSpeedCard(false);
                              }}
                              className="flex items-center justify-center w-8 h-8 rounded bg-white/10 hover:bg-white/20 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-white">
                                <path d="m15 18-6-6 6-6" />
                              </svg>
                            </button>
                            <span className="font-medium text-white text-base">Vitesse de lecture</span>
                          </div>

                          {/* Liste des vitesses */}
                          <div className="pt-4 w-full">
                            {['0.25x', '0.5x', '0.75x', 'Normal', '1.25x', '1.5x', '1.75x', '2x'].map((speed) => (
                              <div key={speed} className="flex items-center justify-between py-3 px-3 hover:bg-white/5 cursor-pointer transition-colors rounded">
                                <span className="text-white">{speed}</span>
                                {speed === 'Normal' && (
                                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-blue-400">
                                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd"></path>
                                    </svg>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="w-px mx-1 h-5 bg-white/25"></div>

                {/* Cast (désactivé) */}
                <button className="flex items-center justify-center font-medium whitespace-nowrap relative overflow-hidden transition-all h-10 text-sm px-4 rounded-md cursor-pointer text-white bg-opacity-20 hover:bg-opacity-15 backdrop-blur-sm transform-gpu bg-white/5 opacity-50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"></path>
                    <path d="M2 12a9 9 0 0 1 8 8"></path>
                    <path d="M2 16a5 5 0 0 1 4 4"></path>
                    <line x1="2" x2="2.01" y1="20" y2="20"></line>
                  </svg>
                </button>

                {/* Picture in Picture */}
                <div className="relative">
                  <div className="flex items-center justify-center font-medium whitespace-nowrap relative overflow-hidden transition-all h-10 text-sm rounded-md cursor-not-allowed text-white/50 bg-opacity-20 hover:bg-opacity-15 backdrop-blur-sm transform-gpu bg-white/5 px-0 py-0 opacity-50">
                    <div className="w-full h-full px-3 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                        <path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h4"></path>
                        <rect width="10" height="7" x="12" y="13" rx="2"></rect>
                      </svg>
                    </div>
                  </div>

                  {/* Menu PiP */}
                  {showPiP && (
                    <div className="absolute bottom-full right-0 mb-8 z-[9999] min-w-[300px]">
                      <div className="flex flex-col rounded-lg border border-white/10 bg-black/80 backdrop-blur-sm px-5 py-4 font-sans shadow-xl">
                        {/* Titre */}
                        <div className="font-medium text-white/90 text-base pt-0 px-0 border-b pb-3 border-white/10">
                          Picture in Picture
                        </div>

                        {/* Message de fonctionnalité non disponible */}
                        <div className="pt-4 w-full">
                          <div className="text-center py-8">
                            <div className="text-white/70 text-lg font-medium mb-2">
                              Fonctionnalité
                            </div>
                            <div className="text-white/50 text-sm">
                              non encore disponible
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fullscreen */}
                <div className="flex items-center justify-center font-medium whitespace-nowrap relative overflow-hidden transition-all h-10 text-sm rounded-md cursor-pointer text-white bg-opacity-20 hover:bg-opacity-15 backdrop-blur-sm transform-gpu bg-white/5 px-0 py-0">
                  <button className="w-full h-full px-3" onClick={(e) => {
                    e.stopPropagation();
                    toggleFullscreen();
                  }}>
                    {isFullscreen ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                        <path d="M8 3v3a2 2 0 0 1-2 2H3"></path>
                        <path d="M21 8v-3a2 2 0 0 0-2-2h-3"></path>
                        <path d="M3 16v3a2 2 0 0 0 2 2h3"></path>
                        <path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3"></path>
                        <path d="M21 8V5a2 2 0 0 0-2-2h-3"></path>
                        <path d="M3 16v3a2 2 0 0 0 2 2h3"></path>
                        <path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoviePlayer;
