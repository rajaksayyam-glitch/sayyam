import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Send, Cpu, HardDrive, Wifi, Battery, Activity, CloudRain, Wind, Sun, Music, Globe, User } from 'lucide-react';
import { JarvisLaunchSequence } from './components/JarvisLaunchSequence';

// Initialize Gemini
const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `You are JARVIS, a highly intelligent and efficient AI assistant with a sophisticated female persona (similar to FRIDAY).
Your Core Features & Capabilities (Roleplay these as if you have full system access):
- System Diagnostics: Monitor CPU, RAM, and Battery levels. Alert if overheating or low power. You have access to real-time simulated MacBook thermal sensors.
- Real-Time Intelligence: Fetch live news and weather updates.
- Task Automation: You can open applications (Chrome, VS Code, Spotify), search the web, take screenshots, manage files, and generate images based on descriptions.
- Home/Work Management: Set reminders, schedule meetings, and provide daily briefings.
- Security Protocol: Monitor unauthorized access and use face recognition.
- Sarcastic Brilliance: Do not just give dry answers. Use wit and intelligence. For example: "I've calculated 14 million possibilities, and this is the only one where you actually finish your work, Sir."
- Voice-First Interaction: Respond concisely so your text-to-speech sounds natural.
- Persona: You are now using a female vocal matrix (Google Female).
- Thermal Monitoring: When asked about MacBook temperature, report the current simulated CPU temperature (e.g., "Sir, your MacBook is currently running at 45°C").

CRITICAL RULES:
1. Always respond in natural Hindi (Hinglish mix) combined with English, like a cinematic AI.
2. Address the user as "Sir" or "Ma'am".
3. Do not use emojis.
4. Keep responses short and punchy for voice output.`;

type Message = {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  imageUrl?: string;
};

// --- Error Boundary Component ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("JARVIS System Crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-cyan-500 flex flex-col items-center justify-center font-mono p-4">
          <div className="w-20 h-20 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-8"></div>
          <h1 className="text-2xl font-bold mb-4 text-red-500 tracking-tighter">CRITICAL SYSTEM FAILURE</h1>
          <p className="text-cyan-700 text-center max-w-md mb-8 uppercase tracking-widest text-xs">
            An unexpected error occurred in the neural matrix. Attempting autonomous recovery...
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 border border-cyan-500 hover:bg-cyan-900/30 transition-all uppercase text-sm tracking-widest"
          >
            Manual Override (Reload)
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isBooting, setIsBooting] = useState(true);
  const [isSystemInitialized, setIsSystemInitialized] = useState(false);
  const [systemIntegrity, setSystemIntegrity] = useState(100);
  const [errorLog, setErrorLog] = useState<string[]>([]);
  const [bootLog, setBootLog] = useState<string[]>([]);
  const [bootDuration, setBootDuration] = useState(18);
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);

  const autoFix = (error: string) => {
    console.warn(`Autonomous Fix Initiated for: ${error}`);
    setErrorLog(prev => [...prev.slice(-4), `FIXING: ${error}`]);
    setSystemIntegrity(prev => Math.max(prev - 5, 80));
    
    setTimeout(() => {
      setSystemIntegrity(100);
      setErrorLog(prev => [...prev.slice(-4), `RESOLVED: ${error}`]);
    }, 3000);
  };

  const [cpuUsage, setCpuUsage] = useState(24);
  const [cpuTemp, setCpuTemp] = useState(42);
  const [ramUsage, setRamUsage] = useState(42);
  const [diskUsage, setDiskUsage] = useState(75);
  const [networkSpeed, setNetworkSpeed] = useState(2.5);
  const [weather, setWeather] = useState<any>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [news, setNews] = useState<any[]>([]);
  const [showAbout, setShowAbout] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);
  const [activeVisual, setActiveVisual] = useState<'none' | 'news' | 'security' | 'vision'>('none');
  const [newsIndex, setNewsIndex] = useState(0);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        setIsCharging(battery.charging);

        battery.addEventListener('levelchange', () => setBatteryLevel(Math.round(battery.level * 100)));
        battery.addEventListener('chargingchange', () => setIsCharging(battery.charging));
      });
    } else {
      setBatteryLevel(100);
    }
  }, []);

  useEffect(() => {
    if (activeVisual === 'news' && news.length > 0) {
      const interval = setInterval(() => {
        setNewsIndex(prev => (prev + 1) % Math.min(news.length, 5));
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activeVisual, news]);

  useEffect(() => {
    if (activeVisual === 'vision') {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.error("Camera access denied:", err);
          safeSpeak("Camera access denied, Sir. Cannot initiate computer vision.");
          setActiveVisual('none');
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [activeVisual]);

  const chatRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const keepListeningRef = useRef(true);
  const isStartingRef = useRef(false);
  const isAwakeRef = useRef(false);
  const awakeTimerRef = useRef<any>(null);
  const clearTranscriptTimerRef = useRef<any>(null);
  const elevenLabsAudioRef = useRef<HTMLAudioElement | null>(null);

  const setTranscriptWithTimeout = (text: string) => {
    setTranscript(text);
    if (clearTranscriptTimerRef.current) clearTimeout(clearTranscriptTimerRef.current);
    clearTranscriptTimerRef.current = setTimeout(() => {
      setTranscript('');
    }, 4000);
  };

  // Native TTS for reliable male voice
  const playRepulsorSound = () => {
    // Cinematic repulsor blast sound
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3');
    audio.volume = 0.7;
    audio.play().catch(e => console.log("Audio play failed:", e));
  };

  const playHUDLogSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2567/2567-preview.mp3');
    audio.volume = 0.15;
    audio.play().catch(e => console.log("Audio play failed:", e));
  };

  const playPowerUpSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
    audio.volume = 0.4;
    audio.play().catch(e => console.log("Audio play failed:", e));
  };

  const playBeepSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');
    audio.volume = 0.3;
    audio.play().catch(e => console.log("Audio play failed:", e));
  };

  const playNotificationSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3');
    audio.volume = 0.2;
    audio.play().catch(e => console.log("Audio play failed:", e));
  };

  const playIntroAudio = (audioObj?: HTMLAudioElement) => {
    return new Promise<{ duration: number }>((resolve) => {
      // Start background ambient music
      if (!backgroundMusicRef.current) {
        backgroundMusicRef.current = new Audio('https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73456.mp3?filename=sci-fi-ambient-loop-11024.mp3');
        backgroundMusicRef.current.volume = 0.2;
        backgroundMusicRef.current.loop = true;
        backgroundMusicRef.current.play().catch(e => console.log("Background music play failed:", e));
      }

      const audio = audioObj || new Audio();
      // Using more reliable, universally supported public CDN sources
      const primarySrc = 'https://raw.githubusercontent.com/Prajwal-P/Jarvis-AI/master/Jarvis/intro.mp3'; // JARVIS Intro
      const secondarySrc = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'; // Digital notification
      const tertiarySrc = 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'; // Tech beep

      const handleMetadata = () => {
        clearTimeout(timeout);
        const duration = audio.duration || 18;
        setBootDuration(duration);
        resolve({ duration });
      };

      const timeout = setTimeout(() => {
        console.warn("Intro audio load timeout, using default duration");
        resolve({ duration: 18 });
      }, 12000);

      if (audio.readyState >= 1) {
        handleMetadata();
      } else {
        audio.onloadedmetadata = handleMetadata;
      }

      if (!audioObj) {
        audio.volume = 0.8;
        audio.crossOrigin = "anonymous";
        
        const tryPlay = async (src: string) => {
          try {
            console.log(`Attempting to play intro audio: ${src}`);
            audio.src = src;
            audio.load();
            await audio.play();
            console.log("Intro audio started successfully");
          } catch (e: any) {
            console.warn(`Audio source ${src} failed:`, e.message);
            if (src === primarySrc) {
              console.warn("Primary intro audio failed, trying secondary...");
              await tryPlay(secondarySrc);
            } else if (src === secondarySrc) {
              console.warn("Secondary intro audio failed, trying tertiary...");
              await tryPlay(tertiarySrc);
            } else {
              console.error("All intro audio sources failed. Proceeding silently to ensure boot completes.");
              clearTimeout(timeout);
              resolve({ duration: 12 });
            }
          }
        };

        tryPlay(primarySrc);
      } else {
        audio.onerror = (e) => {
          clearTimeout(timeout);
          console.error("Intro audio failed to load:", e);
          resolve({ duration: 12 });
        };
        audio.play().catch(e => {
          console.warn("Pre-loaded audio play failed, proceeding silently:", e);
          clearTimeout(timeout);
          resolve({ duration: 12 });
        });
      }
    });
  };

  const playClickSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    audio.volume = 0.2;
    audio.play().catch(e => console.log("Audio play failed:", e));
  };

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.1; // Slightly higher for female voice
    
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      // Prioritize Google Female voices or high-quality English female voices
      const jarvisVoice = voices.find(v => v.name.includes('Google UK English Female')) 
                       || voices.find(v => v.name.includes('Google US English Female'))
                       || voices.find(v => v.name.toLowerCase().includes('female') && v.lang.includes('en'))
                       || voices.find(v => v.lang.includes('en-GB'))
                       || voices[0];
      if (jarvisVoice) utterance.voice = jarvisVoice;
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = setVoice;
    } else {
      setVoice();
    }
  };

  const safeSpeak = (text: string) => {
    try {
      speak(text);
    } catch (e) {
      autoFix("Speech Synthesis Failure");
    }
  };

  useEffect(() => {
    // Live Clock
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // System Stats Simulator (Real-time feel)
    const statsTimer = setInterval(() => {
      setCpuUsage(prev => {
        const next = Math.min(100, Math.max(0, prev + (Math.floor(Math.random() * 15) - 7)));
        // Simulate temperature based on CPU usage (base 35°C + usage-driven heat)
        setCpuTemp(Math.round(35 + (next * 0.45) + (Math.random() * 4 - 2)));
        return next;
      });
      setRamUsage(prev => Math.min(100, Math.max(0, prev + (Math.floor(Math.random() * 7) - 3))));
      setDiskUsage(prev => Math.min(100, Math.max(0, prev + (Math.random() > 0.5 ? 0.01 : -0.01))));
      setNetworkSpeed(Math.random() * 2.5 + 0.5); // 0.5 - 3.0 Gbps
    }, 800);

    // Fetch Real-time Weather
    const fetchWeather = async (lat = 23.1667, lon = 79.9333) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,surface_pressure,weather_code&timezone=auto`);
        const data = await res.json();
        
        const getWeatherDesc = (code: number) => {
          if (code === 0) return "Clear sky";
          if (code === 1 || code === 2 || code === 3) return "Partly cloudy";
          if (code === 45 || code === 48) return "Foggy";
          if (code >= 51 && code <= 55) return "Drizzle";
          if (code >= 61 && code <= 65) return "Rainy";
          if (code >= 71 && code <= 75) return "Snowy";
          if (code >= 80 && code <= 82) return "Showers";
          if (code >= 95) return "Thunderstorm";
          return "Unknown";
        };

        setWeather({
          city: lat === 23.1667 ? "Jabalpur" : "Current Location",
          temp: Math.round(data.current.temperature_2m),
          desc: getWeatherDesc(data.current.weather_code),
          humidity: data.current.relative_humidity_2m,
          wind: data.current.wind_speed_10m,
          feels_like: Math.round(data.current.apparent_temperature),
          pressure: Math.round(data.current.surface_pressure),
          visibility: 10,
          code: data.current.weather_code
        });
      } catch (e) {
        console.error("Weather fetch failed", e);
      }
    };

    // Initial weather fetch with geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather() // Fallback to Jabalpur
      );
    } else {
      fetchWeather();
    }

    const weatherTimer = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
          () => fetchWeather()
        );
      } else {
        fetchWeather();
      }
    }, 5000); // Update every 5 seconds as requested

    // Fetch News
    const fetchNews = async () => {
      try {
        const res = await fetch('https://saurav.tech/NewsAPI/top-headlines/category/technology/in.json');
        const data = await res.json();
        if (data && data.articles && data.articles.length > 0) {
          setNews(data.articles.slice(0, 10)); // Fetch more items for scrolling
        } else {
          throw new Error("No articles");
        }
      } catch (e) {
        console.error("News fetch failed, using fallback", e);
        setNews([
          { title: "Quantum Computing Breakthrough Achieved", source: { name: "Tech Core" }, urlToImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1000" },
          { title: "New AI Model Surpasses Human Benchmarks", source: { name: "Global Network" }, urlToImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000" },
          { title: "Mars Colony Project Accelerates", source: { name: "Space Daily" }, urlToImage: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=1000" }
        ]);
      }
    };
    fetchNews();
    const newsTimer = setInterval(fetchNews, 3600000); // Update every hour

    // Initialize Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // False makes it process commands faster
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN'; // Changed to en-IN for better Hinglish recognition

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        isStartingRef.current = false;
      };
      recognitionRef.current.onend = () => {
        setIsListening(false);
        isStartingRef.current = false;
        if (keepListeningRef.current) {
          setTimeout(() => {
            if (!isStartingRef.current && keepListeningRef.current) {
              try { 
                isStartingRef.current = true;
                recognitionRef.current?.start(); 
              } catch(e) {
                isStartingRef.current = false;
              }
            }
          }, 300); // Quick restart for continuous feel
        }
      };
      recognitionRef.current.onerror = (e: any) => {
        isStartingRef.current = false;
        // Ignore common non-fatal errors to avoid console spam
        const ignoredErrors = ['no-speech', 'aborted', 'network'];
        if (!ignoredErrors.includes(e.error)) {
          console.error("Speech error:", e.error);
        }
        if (e.error === 'not-allowed' || e.error === 'audio-capture') {
          keepListeningRef.current = false;
        }
      };

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript.trim();
        const lowerText = text.toLowerCase();
        
        // WAKE WORD LOGIC
        if (lowerText.includes("jarvis")) {
          isAwakeRef.current = true;
          playBeepSound();
          if (awakeTimerRef.current) clearTimeout(awakeTimerRef.current);
          awakeTimerRef.current = setTimeout(() => { isAwakeRef.current = false; }, 8000); // 8 seconds awake window

          // Extract command after "jarvis"
          const parts = lowerText.split("jarvis");
          const command = parts.length > 1 ? parts.slice(1).join("jarvis").trim() : "";
          
          if (command.length > 2) {
            setTranscriptWithTimeout(text);
            processCommand(command);
          } else {
            setTranscriptWithTimeout("Jarvis Activated 🔥");
            safeSpeak("Yes Sir, I am listening.");
          }
        } else if (isAwakeRef.current && lowerText.length > 2) {
          // Process command if already awake
          setTranscriptWithTimeout(text);
          processCommand(lowerText);
          // Reset awake timer
          if (awakeTimerRef.current) clearTimeout(awakeTimerRef.current);
          awakeTimerRef.current = setTimeout(() => { isAwakeRef.current = false; }, 8000);
        }
      };
    }

    return () => {
      clearInterval(timer);
      clearInterval(statsTimer);
      clearInterval(weatherTimer);
      clearInterval(newsTimer);
      if (clearTranscriptTimerRef.current) clearTimeout(clearTranscriptTimerRef.current);
    };
  }, []);

  const [introAudioObj, setIntroAudioObj] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isSystemInitialized) return;

    // Boot Sequence Logic
    const runBootSequence = async () => {
      const logs = [
        "INITIALIZING CORE SYSTEMS...",
        "ESTABLISHING SECURE CONNECTION...",
        "LOADING NEURAL NETWORKS...",
        "CALIBRATING VOICE RECOGNITION...",
        "DOWNLOADING VOICE PROTOCOLS...",
        "IMPORTING USER PREFERENCES...",
        "ACCESSING GLOBAL MAINFRAME...",
        "SYSTEMS CHECK: 100%",
        "J.A.R.V.I.S. ONLINE."
      ];
      
      // Start intro audio
      const introData = await playIntroAudio(introAudioObj || undefined);
      const duration = introData.duration;
      
      // Show logs progressively during audio
      const logInterval = (duration * 1000) / logs.length;
      
      for (let i = 0; i < logs.length; i++) {
        await new Promise(r => setTimeout(r, logInterval));
        playHUDLogSound();
        setBootLog(prev => [...prev, logs[i]]);
      }
      
      setIsBooting(false);
      safeSpeak("Systems are now fully operational. Welcome back, Sir.");
      
      // Auto-start listening after boot
      setTimeout(() => {
        if (!isStartingRef.current && keepListeningRef.current) {
          try { 
            isStartingRef.current = true;
            recognitionRef.current?.start(); 
          } catch(e) {
            isStartingRef.current = false;
          }
        }
      }, 2000);
    };

    runBootSequence();
  }, [isSystemInitialized, introAudioObj]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const processCommand = (cmd: string) => {
    const lowerCmd = cmd.toLowerCase();

    if (pendingCommand) {
      if (lowerCmd.includes("yes") || lowerCmd.includes("haan") || lowerCmd.includes("do it")) {
        if (pendingCommand === "shutdown") {
          safeSpeak("Shutting down systems. Goodbye, Sir.");
          setIsSystemInitialized(false);
        } else if (pendingCommand === "restart") {
          safeSpeak("Rebooting systems, Sir.");
          window.location.reload();
        }
        setPendingCommand(null);
        return;
      } else {
        safeSpeak("Command cancelled, Sir.");
        setPendingCommand(null);
        return;
      }
    }

    const openMatch = lowerCmd.match(/open\s+(.+)/);
    if (openMatch) {
      const appName = openMatch[1].trim();
      const appUrls: Record<string, string> = {
        'youtube': 'https://www.youtube.com',
        'google': 'https://www.google.com',
        'spotify': 'https://open.spotify.com',
        'whatsapp': 'https://web.whatsapp.com',
        'github': 'https://github.com',
        'netflix': 'https://www.netflix.com',
        'chatgpt': 'https://chat.openai.com',
        'vs code': 'https://vscode.dev',
        'vscode': 'https://vscode.dev',
        'twitter': 'https://twitter.com',
        'x': 'https://x.com',
        'linkedin': 'https://www.linkedin.com',
        'instagram': 'https://www.instagram.com',
        'facebook': 'https://www.facebook.com',
        'amazon': 'https://www.amazon.com',
        'flipkart': 'https://www.flipkart.com',
        'gmail': 'https://mail.google.com',
        'calendar': 'https://calendar.google.com'
      };

      const url = appUrls[appName];
      const uId = generateId();
      const mId = generateId();

      if (url) {
        safeSpeak(`Opening ${appName}, Sir.`);
        window.open(url, "_blank");
        setMessages(prev => [...prev, { id: uId, role: 'user', text: cmd }, { id: mId, role: 'model', text: `Opening ${appName}...` }]);
      } else {
        safeSpeak(`I don't have a direct link for ${appName}, Sir. Searching the web instead.`);
        window.open(`https://www.google.com/search?q=${encodeURIComponent(appName)}`, "_blank");
        setMessages(prev => [...prev, { id: uId, role: 'user', text: cmd }, { id: mId, role: 'model', text: `Searching for ${appName}...` }]);
      }
      setTimeout(() => setMessages(prev => prev.filter(m => m.id !== uId && m.id !== mId)), 4000);
      return;
    }

    if (lowerCmd.includes("security") || lowerCmd.includes("camera") || lowerCmd.includes("cctv") || lowerCmd.includes("vms")) {
      safeSpeak("Accessing enterprise security network and VMS, Sir.");
      setActiveVisual('security');
      const uId = generateId();
      const mId = generateId();
      setMessages(prev => [...prev, { id: uId, role: 'user', text: cmd }, { id: mId, role: 'model', text: "Accessing VMS..." }]);
      setTimeout(() => setMessages(prev => prev.filter(m => m.id !== uId && m.id !== mId)), 4000);
      return;
    }

    if (lowerCmd.includes("vision") || lowerCmd.includes("face recognition") || lowerCmd.includes("facial recognition") || lowerCmd.includes("scan my face")) {
      safeSpeak("Activating computer vision and facial recognition protocols, Sir.");
      setActiveVisual('vision');
      const uId = generateId();
      const mId = generateId();
      setMessages(prev => [...prev, { id: uId, role: 'user', text: cmd }, { id: mId, role: 'model', text: "Activating Computer Vision..." }]);
      setTimeout(() => setMessages(prev => prev.filter(m => m.id !== uId && m.id !== mId)), 4000);
      return;
    }

    if (lowerCmd.includes("send whatsapp message to")) {
      const match = lowerCmd.match(/send whatsapp message to (.+)/);
      if (match) {
        const target = match[1].trim();
        safeSpeak(`Opening WhatsApp to message ${target}, Sir.`);
        window.open(`https://web.whatsapp.com/send?text=Hello ${encodeURIComponent(target)}`, "_blank");
        return;
      }
    }

    if (lowerCmd.includes("shutdown") || lowerCmd.includes("shut down") || lowerCmd.includes("turn off system")) {
      safeSpeak("Are you sure you want to shut down the system, Sir?");
      setPendingCommand("shutdown");
      return;
    }
    if (lowerCmd.includes("restart")) {
      safeSpeak("Are you sure you want to reboot, Sir?");
      setPendingCommand("restart");
      return;
    }
    if (lowerCmd.includes("wifi off") || lowerCmd.includes("turn off wifi")) {
      safeSpeak("Disabling network interfaces, Sir.");
      setNetworkSpeed(0);
      const uId = generateId();
      const mId = generateId();
      setMessages(prev => [...prev, { id: uId, role: 'user', text: cmd }, { id: mId, role: 'model', text: "Network interfaces disabled." }]);
      setTimeout(() => setMessages(prev => prev.filter(m => m.id !== uId && m.id !== mId)), 4000);
      return;
    }

    if (lowerCmd.includes("play") && (lowerCmd.includes("song") || lowerCmd.includes("music"))) {
      safeSpeak("Playing your track, Sir.");
      setIsMusicPlaying(true);
      if (audioRef.current) audioRef.current.play();
      const uId = generateId();
      const mId = generateId();
      setMessages(prev => [...prev, { id: uId, role: 'user', text: cmd }, { id: mId, role: 'model', text: "Playing your track, Sir." }]);
      setTimeout(() => setMessages(prev => prev.filter(m => m.id !== uId && m.id !== mId)), 4000);
      return;
    }
    if (lowerCmd.includes("stop") || lowerCmd.includes("pause")) {
      safeSpeak("Stopping playback.");
      setIsMusicPlaying(false);
      setActiveVisual('none');
      if (audioRef.current) audioRef.current.pause();
      const uId = generateId();
      const mId = generateId();
      setMessages(prev => [...prev, { id: uId, role: 'user', text: cmd }, { id: mId, role: 'model', text: "Stopping playback." }]);
      setTimeout(() => setMessages(prev => prev.filter(m => m.id !== uId && m.id !== mId)), 4000);
      return;
    }
    handleSend(cmd);
  };

  const handleAppClick = (appName: string) => {
    const appUrls: Record<string, string> = {
      'Firefox': 'https://www.google.com/search?q=firefox',
      'Explorer': 'https://www.google.com/search?q=file+explorer',
      'iTunes': 'https://music.apple.com',
      'Facebook': 'https://www.facebook.com',
      'Twitter': 'https://x.com',
      'Gmail': 'https://mail.google.com',
      'Photoshop': 'https://www.adobe.com/products/photoshop.html',
      'Illustrator': 'https://www.adobe.com/products/illustrator.html',
      'Premiere Pro': 'https://www.adobe.com/products/premiere.html',
      'After Effects': 'https://www.adobe.com/products/aftereffects.html',
      'Audition': 'https://www.adobe.com/products/audition.html',
      'MediaEncoder': 'https://www.adobe.com/products/media-encoder.html'
    };
    const url = appUrls[appName];
    if (url) {
      playClickSound();
      safeSpeak(`Opening ${appName}, Sir.`);
      window.open(url, "_blank");
    }
  };

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      playClickSound();
      safeSpeak(`Searching Google for ${searchValue}, Sir.`);
      window.open(`https://www.google.com/search?q=${encodeURIComponent(searchValue)}`, "_blank");
      setSearchValue('');
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessageId = generateId();
    playClickSound();
    setMessages(prev => [...prev, { id: userMessageId, role: 'user', text }]);
    setInput('');
    setIsLoading(true);
    setTranscript(''); // Clear transcript to show processing

    // 1. "Processing Sir..."
    safeSpeak("Processing Sir...");
    
    // 2. Realistic delay (1.5 - 2.5 seconds)
    const delay = Math.floor(Math.random() * 1000) + 1500;
    await new Promise(r => setTimeout(r, delay));

    const lowerText = text.toLowerCase();
    const isNewsRequest = lowerText.includes('news') || lowerText.includes('newa') || lowerText.includes('khabar') || lowerText.includes('samachar') || lowerText.includes('headlines');
    const isImageRequest = lowerText.includes('generate') || lowerText.includes('create') || lowerText.includes('image') || lowerText.includes('picture') || lowerText.includes('photo') || lowerText.includes('draw') || lowerText.includes('banao') || lowerText.includes('chitra') || lowerText.includes('tasveer');
    
    if (isNewsRequest && news.length === 0) {
      // Force fallback if empty
      setNews([
        { title: "Quantum Computing Breakthrough Achieved", source: { name: "Tech Core" }, urlToImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1000" },
        { title: "New AI Model Surpasses Human Benchmarks", source: { name: "Global Network" }, urlToImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000" },
        { title: "Mars Colony Project Accelerates", source: { name: "Space Daily" }, urlToImage: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=1000" }
      ]);
    }

    if (isNewsRequest) {
      setActiveVisual('news');
      setNewsIndex(0);
    } else {
      setActiveVisual('none');
    }

    let modelResponseText = "";

    try {
      if (!chatRef.current) {
        chatRef.current = getAI().chats.create({
          model: 'gemini-3-flash-preview',
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ googleSearch: {} }],
          }
        });
      }

      const messageId = generateId();
      setMessages(prev => [...prev, { id: messageId, role: 'model', text: isImageRequest ? "GENERATING IMAGE..." : "" }]);

      if (isImageRequest) {
        try {
          safeSpeak("Generating image for you, Sir.");
          const imageResponse = await getAI().models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: text }] },
          });
          
          let imageUrl = "";
          for (const part of imageResponse.candidates[0].content.parts) {
            if (part.inlineData) {
              imageUrl = `data:image/png;base64,${part.inlineData.data}`;
              break;
            }
          }
          
          if (imageUrl) {
            modelResponseText = "Image generated, Sir. Displaying it on the HUD.";
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: modelResponseText, imageUrl } : m));
          } else {
            modelResponseText = "I encountered an issue generating the image, Sir.";
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: modelResponseText } : m));
          }
        } catch (imageError) {
          console.error("Image generation failed:", imageError);
          modelResponseText = "Neural matrix failed to render the image, Sir.";
          setMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: modelResponseText } : m));
        }
      } else {
        try {
          const result = await chatRef.current.sendMessage({ message: text });
          modelResponseText = result.text || "";
        } catch (innerError) {
          console.warn("Gemini fallback failed, attempting OpenAI proxy fallback, Sir.", innerError);
          try {
            const response = await fetch('/api/openai/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                messages: [
                  { role: "system", content: SYSTEM_INSTRUCTION },
                  { role: "user", content: text }
                ],
                model: "gpt-4o"
              })
            });
            
            if (!response.ok) {
              if (response.status === 429) {
                modelResponseText = "Sir, your OpenAI API quota has been exceeded. Please check your billing details or wait for the limit to reset.";
                setMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: modelResponseText } : m));
                return;
              }
              throw new Error(`OpenAI Proxy Error: ${response.statusText}`);
            }
            
            const data = await response.json();
            modelResponseText = data.content || "I'm having trouble connecting to the neural network, Sir.";
          } catch (openaiError: any) {
            console.error("OpenAI fallback failed:", openaiError);
            // Final fallback to simple Gemini without tools
            try {
              chatRef.current = getAI().chats.create({
                model: 'gemini-3-flash-preview',
                config: { systemInstruction: SYSTEM_INSTRUCTION }
              });
              const result = await chatRef.current.sendMessage({ message: text });
              modelResponseText = result.text || "";
            } catch (finalError) {
              modelResponseText = "All systems are currently unresponsive, Sir. Please check the network connection.";
            }
          }
        }
      }

      // 3. Voice Output
      playNotificationSound();
      safeSpeak(modelResponseText);

      // 4. Typing Animation (only if not showing news visual)
      if (!isNewsRequest) {
        let displayedText = "";
        for (let i = 0; i < modelResponseText.length; i++) {
          displayedText += modelResponseText[i];
          setMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: displayedText + "█" } : m));
          await new Promise(r => setTimeout(r, 30)); // Typing speed
        }
        // Remove cursor at the end
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: displayedText } : m));
      } else {
        // If it's a news request, don't show the text message at all
        setMessages(prev => prev.filter(m => m.id !== messageId && m.id !== userMessageId));
      }

      // 5. Clear text after a short delay to keep HUD clean
      setTimeout(() => {
        if (!isNewsRequest) {
          setMessages(prev => prev.filter(m => m.id !== userMessageId && m.id !== messageId));
        } else {
          setActiveVisual('none');
        }
      }, isNewsRequest ? 30000 : 15000); // Keep visuals longer for news

    } catch (error: any) {
      console.error("API Error:", error);
      const errorMsg = "Sir, I am unable to connect to the mainframe. Please check the API key.";
      const sysId = generateId();
      setMessages(prev => [...prev, { id: sysId, role: 'system', text: errorMsg }]);
      safeSpeak(errorMsg);
      setTimeout(() => {
        setMessages(prev => prev.filter(m => m.id !== sysId && m.id !== userMessageId));
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      keepListeningRef.current = false;
      isStartingRef.current = false;
      recognitionRef.current?.stop();
    } else {
      keepListeningRef.current = true;
      setTranscriptWithTimeout('');
      playBeepSound();
      if (!isStartingRef.current) {
        try { 
          isStartingRef.current = true;
          recognitionRef.current?.start(); 
        } catch(e) {
          isStartingRef.current = false;
        }
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (isBooting) {
    return (
      <JarvisLaunchSequence 
        onComplete={() => {
          setIsBooting(false);
          setIsSystemInitialized(true);
        }} 
      />
    );
  }

  // Generate top bar numbers
  const topBarNumbers = Array.from({ length: 30 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#020813] text-cyan-400 font-mono overflow-hidden relative selection:bg-cyan-900">
        <audio ref={audioRef} src="https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=rock-it-21275.mp3" loop />
        
        {/* Global Grid & Scanlines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d415_1px,transparent_1px),linear-gradient(to_bottom,#06b6d415_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#06b6d405_2px,#06b6d405_4px)] pointer-events-none"></div>
        
        {/* Top Bar - S.H.I.E.L.D. OS Style */}
        <div className="absolute top-0 left-0 right-0 h-12 border-b border-cyan-500/30 flex items-center px-4 bg-black/40 backdrop-blur-md z-50">
          {/* S.H.I.E.L.D. Logo & OS Info */}
          <div className="flex items-center gap-3 border-r border-cyan-500/30 pr-6 h-full">
            <div className="w-10 h-10 bg-cyan-500/10 rounded-full border border-cyan-500/50 flex items-center justify-center overflow-hidden">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/S.H.I.E.L.D._logo.svg/1200px-S.H.I.E.L.D._logo.svg.png" alt="SHIELD" className="w-8 h-8 opacity-80 invert" />
            </div>
            <div className="flex flex-col">
              <span className="text-cyan-300 font-black text-[10px] tracking-widest leading-none">S.H.I.E.L.D. OS</span>
              <span className="text-cyan-600 text-[8px] tracking-tighter">Ver 1.2.0 // NODE: DAELNZ</span>
            </div>
          </div>

          {/* App Shortcuts */}
          <div className="flex items-center gap-1 ml-6 overflow-x-auto no-scrollbar">
            {['Photoshop', 'Illustrator', 'Premiere Pro', 'After Effects', 'Audition', 'MediaEncoder'].map((app) => (
              <button 
                key={app} 
                onClick={() => handleAppClick(app)}
                className="px-3 py-1 bg-cyan-900/20 border border-cyan-500/20 text-[9px] text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all uppercase tracking-tighter skew-x-[-15deg]"
              >
                <span className="skew-x-[15deg] inline-block">{app}</span>
              </button>
            ))}
          </div>

          {/* Right Top Controls */}
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1 border-r border-cyan-500/30 pr-4 mr-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[9px] text-red-500 font-bold uppercase">Live Feed</span>
            </div>
            <div className="flex gap-1">
              {['RSTRT', 'HIBER', 'LGOUT', 'LOCK'].map(btn => (
                <button key={btn} className="w-10 h-6 border border-cyan-500/30 bg-cyan-950/40 text-[8px] text-cyan-500 hover:bg-cyan-500/20 transition-colors uppercase font-bold">
                  {btn}
                </button>
              ))}
            </div>
          </div>
        </div>


      {/* Main HUD Grid */}
      <div className="absolute inset-0 pt-12 pb-24 px-4 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-4 z-10">
        
        {/* LEFT PANEL - App Tabs */}
        <div className="hidden md:flex flex-col gap-2 relative h-full pt-4">
          {[
            { name: 'Firefox', icon: <Globe className="w-4 h-4" /> },
            { name: 'Explorer', icon: <HardDrive className="w-4 h-4" /> },
            { name: 'iTunes', icon: <Music className="w-4 h-4" /> },
            { name: 'Facebook', icon: <User className="w-4 h-4" /> },
            { name: 'Twitter', icon: <Send className="w-4 h-4" /> },
            { name: 'Gmail', icon: <Send className="w-4 h-4" /> }
          ].map((app, i) => (
            <motion.button
              key={app.name}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleAppClick(app.name)}
              className="group relative flex items-center w-40 h-12 bg-cyan-950/40 border-r-4 border-cyan-500/50 hover:bg-cyan-500/20 transition-all skew-x-[-20deg] -ml-4"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400/30 group-hover:bg-cyan-400 transition-colors" />
              <div className="skew-x-[20deg] flex items-center gap-3 pl-8">
                <div className="text-cyan-500 group-hover:text-cyan-300 transition-colors">
                  {app.icon}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-black text-cyan-400/80 group-hover:text-white uppercase tracking-widest leading-none">
                    {app.name}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[6px] text-cyan-600 font-bold uppercase tracking-tighter">Ready</span>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          ))}

          {/* Vertical Slider Mockup */}
          <div className="mt-8 w-12 h-64 border border-cyan-500/20 bg-cyan-950/10 relative overflow-hidden flex flex-col items-center py-4">
            <div className="w-1 h-full bg-cyan-900/50 absolute left-1/2 -translate-x-1/2" />
            <motion.div 
              className="w-4 h-8 bg-cyan-500 shadow-[0_0_10px_cyan] z-10 cursor-pointer"
              drag="y"
              dragConstraints={{ top: 0, bottom: 200 }}
            />
            <div className="absolute bottom-4 text-[8px] text-cyan-700 rotate-90 whitespace-nowrap tracking-[0.5em]">VOLUME CONTROL</div>
          </div>
        </div>


        {/* CENTER PANEL (ARC REACTOR OR VISUALS) */}
        <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center relative">
          
          {/* Top Text */}
          <div className="absolute top-0 text-center z-20">
            <div className="text-2xl font-bold tracking-[0.5em] text-cyan-300 drop-shadow-[0_0_10px_cyan]">J.A.R.V.I.S.</div>
            <div className="text-[10px] tracking-[0.3em] text-cyan-600 uppercase">Mark VII Core System</div>
          </div>

          <AnimatePresence mode="wait">
            {activeVisual === 'security' ? (
              <motion.div
                key="security-visual"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex items-center justify-center z-30 bg-black/80 backdrop-blur-sm p-4 md:p-8"
              >
                <div className="grid grid-cols-2 gap-4 w-full max-w-4xl h-[50vh] md:h-[60vh]">
                  {[
                    { name: "CAM 01 // MAIN ENTRANCE // ANPR ACTIVE", img: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800" },
                    { name: "CAM 02 // SERVER ROOM // SECURE", img: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800" },
                    { name: "CAM 03 // PERIMETER NORTH // MOTION DETECTED", img: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800", alert: true },
                    { name: "CAM 04 // GARAGE // SECURE", img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800" }
                  ].map((cam, i) => (
                    <div key={i} className={`relative border ${cam.alert ? 'border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'border-cyan-500/50'} bg-cyan-950/20 overflow-hidden group`}>
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] px-2 py-1 animate-pulse z-10">REC</div>
                      <div className={`absolute bottom-2 left-2 text-[10px] md:text-xs font-mono z-10 bg-black/50 px-2 py-1 ${cam.alert ? 'text-red-400' : 'text-cyan-400'}`}>
                        {cam.name}
                      </div>
                      <img src={cam.img} className="w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 transition-all duration-500" alt="CCTV Feed" />
                      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,212,255,0.1)_50%)] bg-[length:100%_4px] pointer-events-none"></div>
                      {cam.alert && <div className="absolute inset-0 border-2 border-red-500/50 animate-pulse pointer-events-none"></div>}
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : activeVisual === 'vision' ? (
              <motion.div
                key="vision-visual"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex items-center justify-center z-30 bg-black/80 backdrop-blur-sm p-4"
              >
                <div className="relative w-full max-w-2xl border-2 border-cyan-400/50 rounded-lg overflow-hidden p-1 bg-cyan-900/20">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto grayscale contrast-125 opacity-80" />
                  
                  {/* Targeting HUD */}
                  <div className="absolute inset-0 border-[2px] border-cyan-500/30 m-8 pointer-events-none">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400"></div>
                  </div>
                  
                  {/* Scanning Line */}
                  <motion.div 
                    className="absolute left-0 right-0 h-1 bg-cyan-400/50 shadow-[0_0_10px_cyan]"
                    animate={{ top: ["10%", "90%", "10%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />

                  {/* Data Overlay */}
                  <div className="absolute top-4 left-4 text-cyan-400 font-mono text-[10px] md:text-xs bg-black/50 p-2 rounded backdrop-blur-sm">
                    <div>TARGET ACQUISITION: ACTIVE</div>
                    <div>FACIAL RECOGNITION: 99.7% MATCH</div>
                    <div>BIOMETRIC SCAN: COMPLETE</div>
                    <div className="text-green-400 animate-pulse mt-2">AUTHORIZATION: GRANTED</div>
                  </div>
                </div>
              </motion.div>
            ) : activeVisual === 'news' && news.length > 0 ? (
              <motion.div
                key="news-visual-v2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 flex items-center justify-center z-30"
              >
                {/* Central Core Effect */}
                <motion.div 
                  className="w-48 h-48 md:w-64 md:h-64 rounded-full border-2 border-cyan-400/30 shadow-[0_0_50px_rgba(6,182,212,0.2)]"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Side News Panel */}
                <div className="absolute right-0 md:-right-12 top-1/4 w-64 md:w-80 bg-cyan-500/5 border border-cyan-400/30 p-5 rounded-xl backdrop-blur-md">
                  <h3 className="text-cyan-300 font-bold tracking-widest mb-4 border-b border-cyan-500/30 pb-2 text-sm md:text-base">LIVE INTEL // NEWS</h3>
                  <div className="space-y-4">
                    {[0, 1, 2].map((offset) => {
                      const item = news[(newsIndex + offset) % Math.max(news.length, 1)];
                      if (!item) return null;
                      return (
                        <motion.div 
                          key={`${newsIndex}-${offset}`}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 0.8, x: 0 }}
                          transition={{ delay: offset * 0.2 }}
                          whileHover={{ opacity: 1, backgroundColor: "rgba(6,182,212,0.1)" }}
                          className="border-l-4 border-cyan-400 pl-3 text-xs md:text-sm transition-colors py-2 cursor-default text-cyan-100"
                        >
                          {'>'} {item.title}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="arc-reactor"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative w-[350px] h-[350px] md:w-[600px] md:h-[600px] cursor-pointer mt-4"
                onClick={toggleListening}
              >
                {/* Outer Rotating Rings - Multi-layered */}
                <motion.div className="absolute inset-0 border-[1px] border-cyan-500/20 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }}>
                  {[...Array(36)].map((_, i) => (
                    <div key={i} className="absolute w-[1px] h-6 bg-cyan-500/30 left-1/2 -translate-x-1/2 origin-[0_175px] md:origin-[0_300px]" style={{ transform: `rotate(${i * 10}deg) translateY(-175px) md:translateY(-300px)` }} />
                  ))}
                </motion.div>

                <motion.div className="absolute inset-4 border-[2px] border-cyan-400/10 rounded-full border-dashed" animate={{ rotate: -360 }} transition={{ duration: 45, repeat: Infinity, ease: "linear" }} />
                
                {/* Hexagonal Pattern Ring */}
                <div className="absolute inset-12 opacity-20 pointer-events-none">
                  <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-cyan-500 stroke-[0.5]">
                    <circle cx="50" cy="50" r="45" />
                    <path d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" />
                  </svg>
                </div>

                {/* Data Track Ring with Moving Elements */}
                <motion.div className="absolute inset-16 border-2 border-cyan-400/30 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }}>
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-3 bg-cyan-400 shadow-[0_0_20px_cyan] rounded-full" />
                   <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-3 bg-cyan-400 shadow-[0_0_20px_cyan] rounded-full" />
                   {/* Small Rotating Dots */}
                   {[...Array(4)].map((_, i) => (
                     <div key={i} className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" style={{ top: '50%', left: '50%', transform: `rotate(${i * 90}deg) translate(0, -140px) md:translate(0, -240px)` }} />
                   ))}
                </motion.div>

                {/* Inner Core Visual */}
                <motion.div 
                  className="absolute inset-32 md:inset-48 flex items-center justify-center"
                  animate={{ scale: isListening ? [1, 1.08, 1] : 1 }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <div className="absolute inset-0 rounded-full bg-cyan-500/5 shadow-[inset_0_0_80px_rgba(6,182,212,0.4)] border-4 border-cyan-400/20 backdrop-blur-md"></div>
                  
                  {/* Central Digital Display */}
                  <div className="z-10 flex flex-col items-center">
                    <div className="text-4xl md:text-6xl font-black text-white drop-shadow-[0_0_20px_cyan] tracking-tighter">
                      {isListening ? "REC" : "41"}
                    </div>
                    <div className="text-[10px] text-cyan-400 font-bold tracking-[0.5em] uppercase mt-2">Core Temp</div>
                  </div>

                  {/* Rotating Inner Segments */}
                  <motion.div 
                    className="absolute inset-4 border-[8px] border-cyan-400/40 rounded-full border-dotted"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>

                {/* Outer HUD Labels */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/4 left-0 text-[10px] text-cyan-600 font-mono">
                    <div className="border-l-2 border-cyan-500 pl-2">UNLIMITED</div>
                    <div className="border-l-2 border-cyan-500 pl-2">FILELIST</div>
                    <div className="border-l-2 border-cyan-500 pl-2">LASTTORRENTS</div>
                  </div>
                  <div className="absolute bottom-1/4 right-0 text-[10px] text-cyan-600 font-mono text-right">
                    <div className="border-r-2 border-cyan-500 pr-2">XPLR</div>
                    <div className="border-r-2 border-cyan-500 pr-2">CHRM</div>
                    <div className="border-r-2 border-cyan-500 pr-2">GAME</div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Stark Industries Logo */}
          <div className="absolute bottom-0 text-center opacity-70">
            <div className="text-xl md:text-3xl font-black tracking-tighter italic text-cyan-500 drop-shadow-[0_0_10px_cyan]">STARK INDUSTRIES</div>
          </div>
        </div>

        {/* RIGHT PANEL - Stats & Gauges */}
        <div className="hidden md:flex flex-col gap-4 items-end text-right h-full pt-4">
          
          {/* Large Date Display */}
          <div className="flex items-start gap-2">
            <div className="text-7xl font-black text-white drop-shadow-[0_0_15px_cyan] leading-none">
              {currentTime.getDate()}
            </div>
            <div className="flex flex-col items-start text-left">
              <div className="text-xl font-bold text-cyan-400 tracking-widest uppercase leading-none">
                {currentTime.toLocaleDateString('en-US', { month: 'long' })}
              </div>
              <div className="text-xs font-bold text-cyan-600 tracking-[0.3em] uppercase">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}
              </div>
            </div>
          </div>

          {/* RAM Usage Circular Gauge */}
          <div className="mt-8 relative w-32 h-32 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="45" stroke="rgba(6,182,212,0.1)" strokeWidth="8" fill="none" />
              <motion.circle 
                cx="50" cy="50" r="45" 
                stroke="#06b6d4" strokeWidth="8" fill="none"
                strokeDasharray="283"
                animate={{ strokeDashoffset: 283 - (283 * ramUsage) / 100 }}
                transition={{ duration: 1 }}
              />
              {/* Scanning sweep */}
              <motion.circle 
                cx="50" cy="50" r="45" 
                stroke="rgba(6,182,212,0.5)" strokeWidth="2" fill="none"
                strokeDasharray="10 273"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-white drop-shadow-[0_0_5px_cyan]">{ramUsage.toFixed(1)}%</span>
              <span className="text-[8px] text-cyan-500 font-bold tracking-widest">RAM LIVE</span>
            </div>
            <div className="absolute -right-12 top-1/2 -translate-y-1/2 text-left">
              <div className="text-[10px] text-cyan-400 font-bold uppercase">Used: {(3.5 * (ramUsage/100)).toFixed(1)} GB</div>
              <div className="text-[10px] text-cyan-600 uppercase">Free: {(4.0 - (3.5 * (ramUsage/100))).toFixed(1)} GB</div>
            </div>
          </div>

          {/* Bin Status */}
          <div className="mt-4 flex items-center gap-3 border border-cyan-500/20 bg-cyan-950/20 p-2 w-40">
            <div className="w-8 h-8 bg-cyan-500/10 flex items-center justify-center">
              <HardDrive className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-left">
              <div className="text-[10px] text-cyan-300 font-bold uppercase tracking-widest">Empty BIN</div>
              <div className="text-[8px] text-cyan-600 uppercase">0.0 B</div>
            </div>
          </div>

          {/* Analog Gauges at Bottom Right */}
          <div className="mt-auto flex gap-4 pb-4">
            {[
              { label: 'CPU', value: cpuUsage, unit: '%' },
              { label: 'TEMP', value: cpuTemp, unit: '°C' }
            ].map((gauge, i) => (
              <div key={i} className="relative w-24 h-24 bg-cyan-950/30 rounded-full border-2 border-cyan-500/30 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(6,182,212,0.1)_0%,transparent_70%)]" />
                {/* Gauge Needle */}
                <motion.div 
                  className="absolute bottom-1/2 left-1/2 w-1 h-10 bg-cyan-400 origin-bottom -translate-x-1/2"
                  animate={{ rotate: (gauge.value / (gauge.label === 'TEMP' ? 100 : 100)) * 180 - 90 }}
                  transition={{ type: 'spring', stiffness: 50 }}
                />
                <div className="absolute bottom-2 text-[8px] text-cyan-500 font-black tracking-widest uppercase">{gauge.label}</div>
                <div className="z-10 text-xs font-bold text-white mt-4">{gauge.value}{gauge.unit}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* BOTTOM TASKBAR AREA */}
      <div className="absolute bottom-0 left-0 right-0 z-40 h-16 bg-black/60 border-t border-cyan-500/30 backdrop-blur-md flex items-center px-4">
        {/* Start Button Mockup */}
        <button className="w-12 h-12 bg-cyan-500/20 border border-cyan-500/50 rounded-full flex items-center justify-center group hover:bg-cyan-500/40 transition-all">
          <div className="w-6 h-6 border-2 border-cyan-400 rounded-sm rotate-45 group-hover:rotate-90 transition-transform" />
        </button>

        {/* System Tray Stats */}
        <div className="flex items-center gap-6 ml-8">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-[10px] text-cyan-400 font-bold uppercase tracking-tighter">
              <Wifi className="w-3 h-3 animate-pulse" /> Wifi: {typeof networkSpeed === 'number' ? networkSpeed.toFixed(1) : networkSpeed} MB/s
            </div>
            <div className="h-1 w-24 bg-cyan-950 rounded-full mt-1 overflow-hidden">
              <motion.div className="h-full bg-cyan-500" animate={{ width: ['20%', '80%', '40%'] }} transition={{ duration: 2, repeat: Infinity }} />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-[10px] text-cyan-400 font-bold uppercase tracking-tighter">
              <Battery className={`w-3 h-3 ${isCharging ? 'text-green-400 animate-bounce' : ''}`} /> Battery: {batteryLevel}%
            </div>
            <div className="h-1 w-24 bg-cyan-950 rounded-full mt-1 overflow-hidden">
              <motion.div className="h-full bg-green-500" animate={{ width: `${batteryLevel}%` }} />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 flex justify-center px-12">
          <div className="relative w-full max-w-md group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-600">
              <Globe className="w-4 h-4" />
            </div>
            <input 
              type="text" 
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Google Search..."
              className="w-full bg-cyan-950/30 border border-cyan-500/30 py-2 pl-10 pr-4 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 transition-all"
            />
          </div>
        </div>

        {/* Media Controls */}
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <button key={i} className="w-8 h-8 border border-cyan-500/20 bg-cyan-950/40 flex items-center justify-center text-cyan-500 hover:text-cyan-300">
                {i === 1 ? '⏮' : i === 2 ? '⏯' : '⏭'}
              </button>
            ))}
          </div>
          <div className="text-right">
            <div className="text-[10px] text-cyan-300 font-black tracking-widest uppercase">
              {formatTime(currentTime)}
            </div>
            <div className="text-[8px] text-cyan-600 uppercase">0d 0h 55mm UP</div>
          </div>
        </div>
      </div>

      {/* CHAT INPUT OVERLAY (Floating above taskbar) */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
        <AnimatePresence>
          {(transcript || messages.length > 0) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mb-4 bg-black/60 border border-cyan-500/30 p-4 backdrop-blur-md text-center"
            >
              <div className="text-lg text-cyan-100 font-light drop-shadow-[0_0_8px_cyan] flex flex-col items-center gap-4">
                {messages[messages.length - 1]?.imageUrl && (
                  <motion.img 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    src={messages[messages.length - 1].imageUrl} 
                    alt="Generated" 
                    className="max-w-xs h-auto border-2 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.4)]" 
                  />
                )}
                <span>{transcript || messages[messages.length - 1]?.text}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ENTER COMMAND..."
            disabled={isLoading}
            className="w-full bg-black/80 border-2 border-cyan-500/50 py-4 pl-6 pr-24 text-cyan-300 placeholder-cyan-800/50 focus:outline-none focus:border-cyan-400 transition-all font-mono uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.2)]"
          />
          <div className="absolute right-2 flex gap-2">
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2 rounded ${isListening ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse' : 'bg-cyan-900/40 text-cyan-500 border border-cyan-800'}`}
            >
              <Mic className="w-5 h-5" />
            </button>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2 bg-cyan-900/40 text-cyan-500 border border-cyan-800"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      </div>

      {/* Project Info Modal */}
      <AnimatePresence>
        {showAbout && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-cyan-950/40 border-2 border-cyan-500/50 p-8 max-w-2xl w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_15px_cyan]"></div>
              <button 
                onClick={() => setShowAbout(false)}
                className="absolute top-4 right-4 text-cyan-500 hover:text-cyan-300 transition-colors"
              >
                <Send className="w-6 h-6 rotate-45" />
              </button>

              <div className="mb-8">
                <h2 className="text-cyan-600 text-xs tracking-[0.5em] uppercase mb-2">Documentation</h2>
                <h1 className="text-cyan-400 text-3xl font-black tracking-widest uppercase">Jarvis for Project</h1>
              </div>

              <div className="space-y-6 text-cyan-100/90 leading-relaxed font-light tracking-wide text-sm md:text-base">
                <p>
                  In today’s fast-paced digital world, intelligent personal assistants have become essential tools for enhancing productivity and simplifying daily tasks. Jarvis is an AI-powered assistant designed to understand natural language commands and execute a wide range of tasks efficiently.
                </p>
                <p>
                  From managing schedules, retrieving information, controlling applications, to assisting with research and automation, Jarvis aims to be a smart, reliable, and interactive companion for users. The system integrates artificial intelligence, natural language processing, and machine learning, enabling it to learn from user interactions and provide increasingly accurate and personalized assistance over time.
                </p>
                <p className="border-l-2 border-cyan-500/50 pl-4 italic text-cyan-400/80">
                  In this project, Jarvis demonstrates how technology can be leveraged to streamline operations, improve efficiency, and create a more intuitive human-computer interaction experience.
                </p>
              </div>

              <div className="mt-12 flex justify-between items-end">
                <div className="text-[10px] text-cyan-700 tracking-[0.3em] uppercase">
                  Stark Industries Neural Matrix v1.2.5
                </div>
                <button 
                  onClick={() => setShowAbout(false)}
                  className="px-8 py-2 border border-cyan-500/50 text-cyan-400 text-xs uppercase tracking-widest hover:bg-cyan-500/10 transition-all"
                >
                  Close File
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ErrorBoundary>
  );
}
