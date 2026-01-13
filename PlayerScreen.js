import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {View,Text,StyleSheet,TouchableOpacity,TouchableWithoutFeedback,ActivityIndicator,
Image,Platform,Dimensions,PanResponder,Animated,} from "react-native";
// Utilisation des icônes compatibles avec React Native au lieu de react-icons/ri
import { LinearGradient } from "expo-linear-gradient";
import Slider from "@react-native-community/slider";
import { Audio, Video } from "expo-av";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import colors from "../theme/colors";
import { buildStreamUrl } from "../data/api";
import * as ScreenOrientation from "expo-screen-orientation";

export default React.memo(function PlayerScreen({ route, navigation }) {
  const { item, src: paramSrc, streamUrl: liveStreamUrl, title, isLiveTV, logo: logoParam } = route.params || {};
  const sourceUrl = buildStreamUrl(liveStreamUrl || paramSrc || item?.url);

  const insets = useSafeAreaInsets();
  const videoRef = useRef(null);
  const hideTimer = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pausePulseAnim = useRef(new Animated.Value(1)).current;
  
  // Animation de pulsation pour l'indicateur de statut (connexion/en direct)
  useEffect(() => {
    // Configurer l'animation de pulsation
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 0.2,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]);

    // Démarrer l'animation en boucle pour l'indicateur de statut
    Animated.loop(pulse).start();
    
    return () => {
      pulseAnim.stopAnimation();
    };
  }, []);
  
  // Animation de pulsation pour le bouton pause
  useEffect(() => {
    if (!status?.isPlaying) {
      const pausePulse = Animated.sequence([
        Animated.timing(pausePulseAnim, {
          toValue: 0.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pausePulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        })
      ]);

      Animated.loop(pausePulse).start();
    } else {
      // Arrêter l'animation si la vidéo est en lecture
      pausePulseAnim.stopAnimation();
    }
  }, [status?.isPlaying]);

  const [status, setStatus] = useState({});
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  // États liés au volume retirés
  const [progressWidth, setProgressWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const [progressBarPosition, setProgressBarPosition] = useState([0, 0]);
  const [isPipMode, setIsPipMode] = useState(false);
  const [originalPosition, setOriginalPosition] = useState(null);
  const [windowDimensions, setWindowDimensions] = useState(Dimensions.get('window'));

  const isLiveContent = useMemo(
    () => Boolean(liveStreamUrl || isLiveTV || item?.type === "live" || item?.isLive),
    [liveStreamUrl, isLiveTV, item?.type, item?.isLive]
  );

  const channelLogo = useMemo(
    () => logoParam || item?.logo || item?.logo_url || item?.thumbnail_url || null,
    [logoParam, item]
  );

  // Écouter les changements de dimensions de l'écran
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowDimensions(window);
    });
    
    return () => subscription?.remove();
  }, []);
  
  // État pour gérer le déplacement du PiP
  const [pipPosition, setPipPosition] = useState({ x: 0, y: 0 });
  
  // Créer un PanResponder pour gérer le déplacement du PiP
  const lastPositionRef = useRef({ x: 0, y: 0 });
  
  const panResponder = useMemo(() => {
    if (!isPipMode) return {};
    
    return PanResponder.create({
      onStartShouldSetPanResponder: () => isPipMode,
      onMoveShouldSetPanResponder: () => isPipMode,
      onPanResponderGrant: () => {
        // Sauvegarder la position actuelle au début du déplacement
        lastPositionRef.current = { ...pipPosition };
      },
      onPanResponderMove: (evt, gestureState) => {
        if (!isPipMode) return;
        
        // Calculer la nouvelle position en fonction du déplacement depuis le début du geste
        const newX = lastPositionRef.current.x + gestureState.dx;
        const newY = lastPositionRef.current.y + gestureState.dy;
        
        // Limiter les déplacements dans les limites de l'écran
        const maxX = windowDimensions.width - (windowDimensions.width * 0.35);
        const maxY = windowDimensions.height - (windowDimensions.width * 0.2);
        
        setPipPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      },
      onPanResponderRelease: () => {
        // Mettre à jour la dernière position connue
        lastPositionRef.current = { ...pipPosition };
      }
    });
  }, [isPipMode, pipPosition, windowDimensions]);
  
  // Fonction pour basculer le mode picture-in-picture
  const togglePipMode = useCallback(() => {
    if (!isPipMode) {
      // Sauvegarder la position actuelle avant d'entrer en mode PiP
      setOriginalPosition({
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      });
      
      // Réinitialiser la position du PiP
      setPipPosition({ x: 0, y: 0 });
      
      // Activer le mode PiP
      setIsPipMode(true);
    } else {
      // Désactiver le mode PiP
      setIsPipMode(false);
      setOriginalPosition(null);
    }
  }, [isPipMode]);
  
  // Le PanResponder remplace la fonction handlePipDrag
  
  // Setup audio mode
  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
        
        // Initialisation du volume par défaut retirée
      } catch (e) {
        console.warn("Audio mode setup failed", e);
      }
    })();
    return () => hideTimer.current && clearTimeout(hideTimer.current);
  }, []);

  // Auto-hide controls
  const autoHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (visible && status?.isPlaying) {
      hideTimer.current = setTimeout(() => setVisible(false), 2600);
    }
  }, [visible, status?.isPlaying]);

  useEffect(() => {
    autoHide();
  }, [visible, status?.isPlaying]);

  // Force landscape + fullscreen
  useEffect(() => {
    let mounted = true;
    const enterLandscapeAndFullscreen = async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } catch {}
      setTimeout(async () => {
        if (!mounted) return;
        try {
          if (Platform.OS !== "web" && videoRef?.current?.presentFullscreenPlayerAsync) {
            await videoRef.current.presentFullscreenPlayerAsync();
          }
        } catch {}
      }, 300);
    };
    enterLandscapeAndFullscreen();
    return () => {
      mounted = false;
      ScreenOrientation.unlockAsync().catch(() => {});
    };
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (!videoRef.current) return;
    if (status?.isPlaying) await videoRef.current.pauseAsync();
    else await videoRef.current.playAsync();
    setVisible(true);
  }, [status?.isPlaying]);



  const onSeek = useCallback(
    async (millis) => {
      if (!videoRef.current || isLiveContent) return;
      await videoRef.current.setPositionAsync(millis);
      setVisible(true);
    },
    [isLiveContent]
  );





  // Fonctions de gestion du volume retirées

  const formatTime = useCallback((millis) => {
    if (millis === undefined || millis === null) return "0:00:00";
    const total = Math.floor(Number(millis) / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, []);

  const progress = useMemo(() => {
    if (isLiveContent) return 1;
    if (!status?.durationMillis) return 0;
    const p = (status.positionMillis || 0) / status.durationMillis;
    return Math.min(1, Math.max(0, p));
  }, [status, isLiveContent]);

  if (!sourceUrl) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={{ color: "#fff" }}>Aucune source disponible</Text>
      </View>
    );
  }

  // Styles dynamiques pour le mode PiP avec transition fluide
  const pipStyles = useMemo(() => {
    const baseStyles = {
      container: {
        position: 'absolute',
        zIndex: 9999,
        borderRadius: isPipMode ? 8 : 0,
        overflow: 'hidden',
        borderWidth: isPipMode ? 1 : 0,
        borderColor: colors.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isPipMode ? 0.25 : 0,
        shadowRadius: isPipMode ? 3.84 : 0,
        elevation: isPipMode ? 5 : 0,
        // Transition fluide
        transition: 'all 0.3s ease',
      },
      videoBox: {
        borderRadius: isPipMode ? 8 : 0,
        overflow: 'hidden',
      }
    };
    
    if (isPipMode) {
      return {
        ...baseStyles,
        container: {
          ...baseStyles.container,
          width: windowDimensions.width * 0.35,  // 35% de la largeur de l'écran
          height: windowDimensions.width * 0.2,  // Ratio 16:9 approximatif
          top: pipPosition.y || windowDimensions.height - (windowDimensions.width * 0.2) - 20,
          left: pipPosition.x || windowDimensions.width - (windowDimensions.width * 0.35) - 20,
        }
      };
    }
    
    return baseStyles;
  }, [isPipMode, windowDimensions, pipPosition, colors.primary]);

  return (
    <View style={[styles.container, isPipMode && { backgroundColor: 'transparent' }]}>
      <TouchableWithoutFeedback onPress={() => setVisible((v) => !v)}>
        <View 
          style={[styles.videoBox, pipStyles.videoBox, isPipMode && pipStyles.container]}
          {...(isPipMode ? panResponder.panHandlers : {})}
        >
          <Video
            ref={videoRef}
            style={styles.video}
            source={{ uri: sourceUrl }}
            resizeMode={Video.RESIZE_MODE_CONTAIN}
            shouldPlay
            volume={1}
            useNativeControls={false}
            onPlaybackStatusUpdate={(s) => {
              // Ne pas considérer comme chargement si la vidéo est déjà chargée et qu'on passe juste de pause à play
              const wasPlaying = status?.isPlaying;
              setStatus(s);
              
              // Si on était en pause et qu'on reprend la lecture, ne pas montrer le chargement
              // sauf si la vidéo n'est pas chargée
              if (s?.isBuffering && wasPlaying === false && s?.isPlaying === true && s?.isLoaded) {
                // On reprend la lecture après une pause, ne pas montrer le chargement
                setLoading(false);
              } else {
                setLoading(!s?.isLoaded || s?.isBuffering);
              }
            }}
          />

          {loading && (
            <View style={styles.centerOverlay}>
              <ActivityIndicator size="large" color={colors.text} />
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          )}
          
          {/* Contrôles minimaux pour le mode PiP */}
          {isPipMode && (
            <>
              <TouchableOpacity 
                style={styles.pipExitButton} 
                onPress={togglePipMode}
                activeOpacity={0.7}
              >
                <Ionicons name="expand-outline" size={16} color="#fff" />
              </TouchableOpacity>
              
              {/* Indicateur PiP */}
              <View style={styles.pipIndicator}>
                <Ionicons name="scan-outline" size={12} color="#fff" />
                <Text style={styles.pipText}>PiP</Text>
              </View>
            </>
          )}

          {visible && !isPipMode && (
            <>
              {/* Barre supérieure */}
              <View style={[styles.topOverlay, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
                <View style={styles.topRow}>
                  <View style={styles.leftActions}>
                    <TouchableOpacity
                      onPress={() => navigation.goBack()}
                      style={[styles.iconBtn, styles.backBtn]}
                      accessibilityLabel="Retour"
                    >
                      <Ionicons name="chevron-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.backText}>Retour</Text>
                  </View>
                  <View style={styles.rightCluster}>
                    {/* Icône du volume et barre du volume retirées */}
                  </View>
                </View>
              </View>

              {/* Contrôles centraux */}
              <View style={styles.centerControls}>
                {!loading && (
                  <>
                    {/* Bouton de retour rapide 10 secondes */}
                    <TouchableOpacity
                      onPress={() => {
                        if (!isLiveContent && status?.positionMillis) {
                          const newPosition = Math.max(0, status.positionMillis - 10000);
                          videoRef.current?.setPositionAsync(newPosition);
                        }
                      }}
                      style={styles.seekButton}
                      accessibilityLabel="Reculer de 10 secondes"
                    >
                      <View style={styles.rotateIconContainer}>
                        <Ionicons name="refresh" size={56} color="#fff" style={styles.forwardButton} />
                        <Text style={styles.seekButtonText}>10</Text>
                      </View>
                    </TouchableOpacity>
                    
                    {/* Bouton de lecture/pause avec effet clignotant */}
                    <>
                      {!status?.isPlaying && (
                        <Animated.View style={[styles.pulseCircle, { opacity: pausePulseAnim }]} />
                      )}
                      <TouchableOpacity
                        onPress={togglePlayPause}
                        style={styles.playButton}
                        accessibilityLabel={status?.isPlaying ? "Pause" : "Lecture"}
                      >
                        <Ionicons 
                          name={status?.isPlaying ? "pause" : "play"} 
                          size={25} 
                          color="#fff" 
                          style={{
                            textAlign: 'center',
                            width: 25,
                            height: 25,
                            marginLeft: status?.isPlaying ? 0 : 2 // Ajustement pour l'icône play qui est naturellement décentrée
                          }} 
                        />
                      </TouchableOpacity>
                    </>
                    
                    {/* Bouton d'avance rapide 10 secondes */}
                    <TouchableOpacity
                      onPress={() => {
                        if (!isLiveContent && status?.positionMillis && status?.durationMillis) {
                          const newPosition = Math.min(status.durationMillis, status.positionMillis + 10000);
                          videoRef.current?.setPositionAsync(newPosition);
                        }
                      }}
                      style={styles.seekButton}
                      accessibilityLabel="Avancer de 10 secondes"
                    >
                      <View style={styles.rotateIconContainer}>
                        <Ionicons name="refresh" size={56} color="#fff" />
                        <Text style={styles.seekButtonText}>10</Text>
                      </View>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {/* Barre inférieure */}
              <View style={[styles.bottomGlass, { paddingBottom: insets.bottom + 8 }]}>
                <View style={styles.infoRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      {channelLogo ? (
                        <Image source={{ uri: channelLogo }} style={styles.channelLogoSmall} resizeMode="contain" />
                      ) : null}
                      <Text numberOfLines={1} style={styles.titleText}>
                        {title || item?.title || "The Studio"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.quickActions}>
                    <TouchableOpacity style={styles.smallIcon} onPress={togglePipMode}>
                      <Ionicons name={isPipMode ? "contract-outline" : "scan-outline"} size={18} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.smallIcon}>
                      <Ionicons name="settings-outline" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>

                {isLiveContent ? (
                  <View style={styles.liveProgressRow}>
                    <Animated.View style={[styles.liveDot, loading ? styles.liveDotLoading : styles.liveDotPlaying, {
                      opacity: pulseAnim
                    }]} />
                    <Text style={[styles.liveText, loading ? styles.liveTextLoading : styles.liveTextPlaying]}>
                      {loading ? "Connexion" : "EN DIRECT"}
                    </Text>
                    <View style={styles.liveBar} />
                  </View>
                ) : (
                  <View style={styles.seekWrap}>
                    <Text style={[styles.time, styles.timeStart]}>{formatTime(isDragging ? Math.round((dragProgress || 0) * (status?.durationMillis || 0)) : (status?.positionMillis || 0))}</Text>
                    <View
                      style={styles.progressContainer}
                      onLayout={(e) => {
                        setProgressWidth(e.nativeEvent.layout.width);
                        // Mesurer la position absolue de la barre de progression
                        e.target.measure((x, y, width, height, pageX, pageY) => {
                          setProgressBarPosition([pageX, width]);
                        });
                      }}
                      onStartShouldSetResponder={() => true}
                      onMoveShouldSetResponder={() => true}
                      onResponderGrant={() => {
                        if (!status?.durationMillis || isLiveContent) return;
                        setIsDragging(true);
                        setDragProgress(progress);
                      }}
                      onResponderMove={(e) => {
                        if (!status?.durationMillis || isLiveContent) return;
                        // Utiliser pageX et la position du composant pour un meilleur suivi du doigt
                        const [progressBarX, progressBarWidth] = progressBarPosition;
                        const x = Math.max(0, Math.min(e.nativeEvent.pageX - progressBarX, progressBarWidth));
                        const ratio = progressBarWidth > 0 ? x / progressBarWidth : 0;
                        // Mettre à jour visuellement la position sans chercher immédiatement
                        setDragProgress(ratio);
                      }}
                      onResponderRelease={(e) => {
                        if (!status?.durationMillis || isLiveContent) return;
                        // Utiliser la même logique que onResponderMove pour la cohérence
                        const [progressBarX, progressBarWidth] = progressBarPosition;
                        const x = Math.max(0, Math.min(e.nativeEvent.pageX - progressBarX, progressBarWidth));
                        const ratio = progressBarWidth > 0 ? x / progressBarWidth : 0;
                        onSeek(ratio * (status?.durationMillis || 0));
                        setIsDragging(false);
                      }}
                    >
                      <View style={styles.progressTrack} />
                      <LinearGradient
                        colors={["#00A8E1", "#0098CC", "#0072D2"]}
                        style={[styles.progressFill, { width: `${Math.round((isDragging ? (dragProgress || 0) : (progress || 0)) * 100)}%` }]}
                      />
                      <View style={[styles.progressHandle, { left: `${Math.round((isDragging ? (dragProgress || 0) : (progress || 0)) * 100)}%`, transform: [{ translateX: -6 }] }]} />
                    </View>
                    <Text style={[styles.time, styles.timeEnd]}>{formatTime(status?.durationMillis || 0)}</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
});

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  seekButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 80,
    backgroundColor: 'transparent',
  },
  forwardButton: {
    transform: [{ scaleX: -1 }], // Inverser horizontalement pour l'icône d'avance rapide
  },
  rotateIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  seekButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    position: 'absolute',
  },
  pipExitButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  pipIndicator: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  pipText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  center: { alignItems: "center", justifyContent: "center" },
  videoBox: {
    flex: 1,
    backgroundColor: "#000",
    width: "100%",
  },
  video: {
    width: "100%",
    height: "100%",
    alignSelf: "stretch",
  },
  centerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  loadingText: {
    marginTop: 10,
    color: "#fff",
  },
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 0, // Réduire le padding pour remonter les éléments
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -15, // Remonter davantage la flèche de retour
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  backBtn: {
    marginRight: 4,
  },
  backText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 2,
  },
  rightCluster: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 0,
    marginTop: -15, // Remonter davantage l'icône de volume
  },
  /* Styles de l'icône du volume et de la barre du volume retirés */
  
  centerControls: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "45%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 100, // Augmenté de 20 à 40 pour plus d'espace entre les boutons
    zIndex: 10,
  },
  playButton: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    marginLeft: 2, // Ajustement millimétrique vers la droite
  },
  pulseCircle: {
    position: 'absolute',
    width: 65,
    height: 65,
    borderRadius: 32.5,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'transparent',
    alignSelf: 'center',
    marginLeft: 2, // Ajustement millimétrique vers la droite pour correspondre au bouton
  },
  seekButton: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  rotateIconContainer: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  forwardButton: {
    transform: [{ scaleX: -1 }], // Retourne l'icône horizontalement pour l'avance rapide
  },
  seekButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    position: "absolute",
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    top: "50%", // Centré verticalement
    marginTop: 0, // Décalé davantage vers le bas pour s'éloigner des flèches
    textAlign: "center",
    alignSelf: "center", // Centré horizontalement
  },

  bottomGlass: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 12, // Déplacer légèrement le titre vers la droite
  },
  channelLogoSmall: {
    width: 26,
    height: 26,
    marginRight: 8,
  },
  titleText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    maxWidth: "90%",
  },
  quickActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  smallIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  liveProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 6,
    gap: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveDotLoading: {
    backgroundColor: "#ef4444", // Rouge pour l'état de chargement
  },
  liveDotPlaying: {
    backgroundColor: "#22c55e", // Vert pour l'état de lecture
  },
  liveText: {
    fontWeight: "700",
    marginRight: 10,
  },
  liveTextLoading: {
    color: "#fff", // Blanc pour l'état de chargement (texte "Connexion")
  },
  liveTextPlaying: {
    color: "#fff", // Blanc pour l'état de lecture
  },
  liveBar: {
    flex: 1,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 2,
  },
  seekWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 0, // Réduire le padding pour aligner avec le titre
    paddingBottom: 12,
    marginLeft: 0, // Aligné avec le padding du conteneur principal
  },
  time: {
    width: 48, // Réduire encore légèrement la largeur
    color: "#fff",
    fontVariant: ["tabular-nums"],
    fontSize: 11, // Réduire encore légèrement la taille de police
  },
  timeStart: {
    textAlign: "left", // Aligner le texte de début à gauche
    paddingLeft: 12, // Aligner avec le padding du conteneur principal
  },
  timeEnd: {
    textAlign: "right", // Aligner le texte de fin à droite
    paddingRight: 12, // Symétrie avec le padding gauche
  },
  progressContainer: {
    flex: 1.3, // Augmenter davantage la proportion pour donner plus d'espace à la barre
    height: 30, // Hauteur augmentée pour faciliter le glissement
    borderRadius: 3,
    overflow: "visible", // Modifié de "hidden" à "visible" pour que la boule soit entièrement visible
    justifyContent: "center",
    paddingVertical: 12, // Padding pour une meilleure zone tactile
    marginHorizontal: 2, // Ajouter une petite marge horizontale
  },
  progressTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 6, // Hauteur augmentée pour une meilleure visibilité sans curseur
    backgroundColor: "rgba(255,255,255,0.35)",
    borderRadius: 3, // Arrondi légèrement augmenté
    top: 12, // Ajusté pour rester centré verticalement
  },
  progressFill: {
    position: "absolute",
    left: 0,
    height: 6, // Hauteur augmentée pour correspondre à progressTrack
    borderRadius: 3, // Arrondi légèrement augmenté
    top: 12, // Ajusté pour rester centré verticalement
  },
  progressHandle: {
    position: "absolute",
    width: 12, // Taille réduite (était 20)
    height: 12, // Taille réduite (était 20)
    borderRadius: 6, // Moitié de la largeur
    backgroundColor: "#fff",
    // La transformation est maintenant gérée dynamiquement dans le rendu
    top: 9, // Ajusté pour centrer la poignée sur la barre de progression
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
