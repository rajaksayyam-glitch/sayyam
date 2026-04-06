import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Modality } from "@google/genai";

interface JarvisLaunchSequenceProps {
  onComplete: () => void;
}

export const JarvisLaunchSequence: React.FC<JarvisLaunchSequenceProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<'initial' | 'loading' | 'launching' | 'revealing' | 'complete'>('initial');
  const [loadingStatus, setLoadingStatus] = useState('');
  const [errorOccurred, setErrorOccurred] = useState(false);
  const [systemStatus, setSystemStatus] = useState<{
    music: 'generating' | 'fallback' | 'ok';
    voice: 'generating' | 'fallback' | 'ok';
    video: 'generating' | 'fallback' | 'ok';
  }>({ music: 'ok', voice: 'ok', video: 'ok' });
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [creatorVoiceUrl, setCreatorVoiceUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const generateAssets = async () => {
    setStage('loading');
    setErrorOccurred(false);
    setLoadingStatus('Initializing Neural Matrix...');
    try {
      // Check if API key is selected for Lyria & Veo (required for paid models)
      const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
      if (!hasKey) {
        setLoadingStatus('Awaiting API Authorization...');
        await (window as any).aistudio?.openSelectKey();
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      // 1. Generate Cinematic Music using Lyria
      setLoadingStatus('Composing Orchestral Score...');
      setSystemStatus(prev => ({ ...prev, music: 'generating' }));
      try {
        const musicResponse = await ai.models.generateContentStream({
          model: "lyria-3-clip-preview",
          contents: 'Epic cinematic orchestral low hum, rising digital tension, soft electronic pulses, mechanical clicks, metallic chimes synced with voice. Subtle futuristic energy buildup and digital particle sounds in the background. Clean, professional, and perfectly suited for a cinematic AI assistant intro.',
        });

        let musicBase64 = "";
        let musicMimeType = "audio/wav";

        for await (const chunk of musicResponse) {
          const parts = chunk.candidates?.[0]?.content?.parts;
          if (!parts) continue;
          for (const part of parts) {
            if (part.inlineData?.data) {
              if (!musicBase64 && part.inlineData.mimeType) {
                musicMimeType = part.inlineData.mimeType;
              }
              musicBase64 += part.inlineData.data;
            }
          }
        }

        if (musicBase64) {
          const binary = atob(musicBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: musicMimeType });
          setMusicUrl(URL.createObjectURL(blob));
          setSystemStatus(prev => ({ ...prev, music: 'ok' }));
        } else {
          throw new Error("Empty music data");
        }
      } catch (musicError: any) {
        console.warn("Music generation failed, using backup score:", musicError.message);
        setSystemStatus(prev => ({ ...prev, music: 'fallback' }));
        setLoadingStatus('Neural link unstable, switching to backup score...');
        // Reliable backup cinematic music
        setMusicUrl('https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73456.mp3?filename=sci-fi-ambient-loop-11024.mp3');
        await new Promise(r => setTimeout(r, 1000));
      }

      // 2. Generate AI Voice (Part 1: Female Intro)
      setLoadingStatus('Calibrating Vocal Synthesis...');
      setSystemStatus(prev => ({ ...prev, voice: 'generating' }));
      try {
        const voiceResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: 'Initializing JARVIS… System online. All systems operational. Hello Boss, I am your personal AI assistant, here to help you with everything you need.' }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' }, 
              },
            },
          },
        });

        const voiceBase64 = voiceResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (voiceBase64) {
          const binary = atob(voiceBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'audio/pcm;rate=24000' });
          setVoiceUrl(URL.createObjectURL(blob));
        } else {
          throw new Error("Empty voice data");
        }

        // 2b. Generate Creator Acknowledgment (Part 2: Male British Intro)
        setLoadingStatus('Syncing Creator Protocols...');
        const creatorResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: 'I was created by Sayyam, your mastermind Boss, to make your life smarter and your world more cinematic.' }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Zephyr' }, // Zephyr is more masculine/British-like
              },
            },
          },
        });

        const creatorBase64 = creatorResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (creatorBase64) {
          const binary = atob(creatorBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'audio/pcm;rate=24000' });
          setCreatorVoiceUrl(URL.createObjectURL(blob));
          setSystemStatus(prev => ({ ...prev, voice: 'ok' }));
        }
      } catch (voiceError: any) {
        console.warn("Voice synthesis failed, using emergency vocal protocols:", voiceError.message);
        setSystemStatus(prev => ({ ...prev, voice: 'fallback' }));
        setLoadingStatus('Vocal matrix offline, using emergency protocols...');
        
        // Fallback to browser speech synthesis
        const speakFallback = () => {
          window.speechSynthesis.cancel();
          
          // Part 1: Female
          const utterance1 = new SpeechSynthesisUtterance("Initializing JARVIS… System online. All systems operational. Hello Boss, I am your personal AI assistant, here to help you with everything you need.");
          utterance1.rate = 1.0;
          utterance1.pitch = 1.1;
          const voices = window.speechSynthesis.getVoices();
          const femaleVoice = voices.find(v => v.name.includes('Google UK English Female')) 
                           || voices.find(v => v.name.includes('Google US English Female'))
                           || voices.find(v => v.name.toLowerCase().includes('female'))
                           || voices[0];
          if (femaleVoice) utterance1.voice = femaleVoice;

          // Part 2: Male
          const utterance2 = new SpeechSynthesisUtterance("I was created by Sayyam, your mastermind Boss, to make your life smarter and your world more cinematic.");
          utterance2.rate = 0.9;
          utterance2.pitch = 0.8;
          const maleVoice = voices.find(v => v.name.includes('Google UK English Male')) 
                         || voices.find(v => v.name.toLowerCase().includes('male'))
                         || voices[0];
          
          utterance1.onend = () => {
            if (maleVoice) utterance2.voice = maleVoice;
            window.speechSynthesis.speak(utterance2);
          };

          window.speechSynthesis.speak(utterance1);
        };
        
        (window as any)._jarvisVoiceFallback = speakFallback;
        await new Promise(r => setTimeout(r, 1000));
      }

      // 3. Generate Cinematic Video using Veo
      setLoadingStatus('Rendering Holographic Visuals...');
      setSystemStatus(prev => ({ ...prev, video: 'generating' }));
      try {
        let operation = await ai.models.generateVideos({
          model: 'veo-3.1-lite-generate-preview',
          prompt: 'Full-length cinematic launch sequence for an AI assistant named "JARVIS". Visuals: high-tech futuristic interface on a dark background with neon blue & silver holographic highlights, rotating circular AI core, flowing digital data streams, holographic panels, particle effects. Text "JARVIS" emerges in sleek metallic font. Style: epic cinematic, Iron Man Jarvis vibe.',
          config: {
            numberOfVideos: 1,
            resolution: '1080p',
            aspectRatio: '16:9'
          }
        });

        let pollCount = 0;
        while (!operation.done && pollCount < 12) { // Max 60 seconds polling
          pollCount++;
          setLoadingStatus(`Rendering Visuals... ${Math.min(95, 40 + pollCount * 5)}%`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          operation = await ai.operations.getVideosOperation({ operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink) {
          const response = await fetch(downloadLink, {
            method: 'GET',
            headers: {
              'x-goog-api-key': process.env.GEMINI_API_KEY || '',
            },
          });
          const videoBlob = await response.blob();
          setVideoUrl(URL.createObjectURL(videoBlob));
          setSystemStatus(prev => ({ ...prev, video: 'ok' }));
        } else {
          throw new Error("Video generation timed out or failed");
        }
      } catch (videoError: any) {
        console.warn("Video rendering failed, using backup visuals:", videoError.message);
        setSystemStatus(prev => ({ ...prev, video: 'fallback' }));
        setLoadingStatus('Visual matrix unstable, loading backup HUD...');
        // High-quality backup cinematic video
        setVideoUrl('https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-blue-circuit-board-4430-large.mp4');
        await new Promise(r => setTimeout(r, 1000));
      }

      setAudioLoaded(true);
      setStage('launching');
    } catch (error: any) {
      console.error("Failed to generate cinematic assets:", error);
      setErrorOccurred(true);
      setLoadingStatus('Critical system failure during asset generation.');
      // Allow user to proceed with fallbacks or retry
    }
  };

  useEffect(() => {
    if (stage === 'launching' && audioLoaded) {
      const playSequence = async () => {
        if (musicUrl) {
          musicRef.current = new Audio(musicUrl);
          musicRef.current.volume = 0.6;
          musicRef.current.play();
        }

        // Delay voice slightly to match the "rising tension" and "metallic chimes"
        setTimeout(async () => {
          setStage('revealing');
          if (voiceUrl) {
            await playRawPcm(voiceUrl);
            if (creatorVoiceUrl) {
              // Small pause between voices
              await new Promise(r => setTimeout(r, 800));
              await playRawPcm(creatorVoiceUrl);
            }
          } else if ((window as any)._jarvisVoiceFallback) {
            (window as any)._jarvisVoiceFallback();
          }
        }, 4500);

        // Complete the sequence after some time
        setTimeout(() => {
          setStage('complete');
          setTimeout(onComplete, 2000);
        }, 14000);
      };

      playSequence();
    }
  }, [stage, audioLoaded]);

  const playRawPcm = async (url: string): Promise<void> => {
    return new Promise(async (resolve) => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        // The data is raw 16-bit PCM
        const int16Array = new Int16Array(arrayBuffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
          float32Array[i] = int16Array[i] / 32768.0;
        }

        const audioBuffer = audioContext.createBuffer(1, float32Array.length, 24000);
        audioBuffer.getChannelData(0).set(float32Array);

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.onended = () => {
          audioContext.close();
          resolve();
        };
        source.start();
      } catch (e) {
        console.error("Error playing raw PCM:", e);
        resolve();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center overflow-hidden font-mono">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.15)_0%,_transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        {/* Particle Streams */}
        <AnimatePresence>
          {stage !== 'initial' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0"
            >
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: Math.random() * window.innerWidth, 
                    y: window.innerHeight + 100,
                    opacity: 0 
                  }}
                  animate={{ 
                    y: -100,
                    opacity: [0, 0.5, 0],
                  }}
                  transition={{ 
                    duration: 2 + Math.random() * 3, 
                    repeat: Infinity, 
                    delay: Math.random() * 5,
                    ease: "linear"
                  }}
                  className="absolute w-[1px] h-20 bg-gradient-to-t from-transparent via-cyan-500 to-transparent"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Holographic Core */}
      <div className="relative z-10 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {stage === 'initial' ? (
            <div className="flex flex-col items-center gap-4">
              <motion.button
                key="init-btn"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                onClick={generateAssets}
                className="group relative px-12 py-6 border-2 border-cyan-500/50 text-cyan-400 text-xl tracking-[0.5em] uppercase font-black hover:bg-cyan-500/10 transition-all overflow-hidden"
              >
                <span className="relative z-10">Initialize Protocol</span>
                <motion.div 
                  className="absolute inset-0 bg-cyan-500/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-500"
                />
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
              </motion.button>
              
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                whileHover={{ opacity: 1 }}
                onClick={() => {
                  setAudioLoaded(true);
                  setStage('launching');
                }}
                className="text-cyan-700 text-[10px] tracking-[0.3em] uppercase hover:text-cyan-500 transition-colors"
              >
                Skip Cinematic Audio
              </motion.button>
            </div>
          ) : stage === 'loading' ? (
            <motion.div
              key="loading-ui"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-8"
            >
              <div className="relative w-32 h-32">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full"
                />
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-4 border-2 border-cyan-400/20 border-b-cyan-400 rounded-full"
                />
              </div>
              <div className="text-cyan-500 text-sm tracking-[0.3em] animate-pulse uppercase text-center max-w-md">
                {loadingStatus}
              </div>
              
              {errorOccurred && (
                <div className="flex gap-4">
                  <button 
                    onClick={generateAssets}
                    className="px-4 py-2 border border-cyan-500/50 text-cyan-400 text-[10px] uppercase tracking-widest hover:bg-cyan-500/10"
                  >
                    Retry Generation
                  </button>
                  <button 
                    onClick={() => {
                      setAudioLoaded(true);
                      setStage('launching');
                    }}
                    className="px-4 py-2 border border-cyan-500/50 text-cyan-400 text-[10px] uppercase tracking-widest hover:bg-cyan-500/10"
                  >
                    Proceed with Fallbacks
                  </button>
                </div>
              )}
              
              {/* System Status HUD */}
              <div className="flex gap-4 mt-4">
                {Object.entries(systemStatus).map(([key, status]) => (
                  <div key={key} className="flex flex-col items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      status === 'ok' ? 'bg-cyan-500 shadow-[0_0_5px_cyan]' : 
                      status === 'generating' ? 'bg-yellow-500 animate-pulse' : 
                      'bg-red-500 shadow-[0_0_5px_red]'
                    }`} />
                    <span className="text-[8px] text-cyan-700 uppercase tracking-widest">{key}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="launch-ui"
              initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
              animate={{ 
                opacity: 1, 
                scale: stage === 'revealing' ? 1.2 : 1, 
                rotate: 0,
                z: 100 
              }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="relative w-64 h-64 md:w-96 md:h-96 flex items-center justify-center"
            >
              {/* Cinematic Video Background */}
              {videoUrl && (
                <motion.video
                  ref={videoRef}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  src={videoUrl}
                  autoPlay
                  loop
                  muted
                  className="absolute inset-0 w-full h-full object-cover mix-blend-screen pointer-events-none"
                />
              )}

              {/* Rotating Circular AI Core */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-[1px] border-cyan-500/30 rounded-full"
              >
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute w-1 h-4 bg-cyan-400/50 left-1/2 -translate-x-1/2 origin-[0_128px] md:origin-[0_192px]" 
                    style={{ transform: `rotate(${i * 30}deg) translateY(-128px) md:translateY(-192px)` }} 
                  />
                ))}
              </motion.div>

              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-8 border-[2px] border-cyan-400/20 border-dashed rounded-full"
              />

              <motion.div 
                animate={{ 
                  scale: [1, 1.05, 1],
                  boxShadow: ["0 0 20px rgba(6,182,212,0.2)", "0 0 60px rgba(6,182,212,0.5)", "0 0 20px rgba(6,182,212,0.2)"]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-cyan-500/10 border-2 border-cyan-400/50 flex items-center justify-center relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.4)_0%,_transparent_70%)]" />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-cyan-400/20 shadow-[0_0_30px_cyan]"
                />
              </motion.div>

              {/* JARVIS Text Reveal */}
              <AnimatePresence>
                {stage === 'revealing' && (
                  <motion.div
                    initial={{ opacity: 0, letterSpacing: "2em", filter: "blur(10px)" }}
                    animate={{ opacity: 1, letterSpacing: "0.5em", filter: "blur(0px)" }}
                    className="absolute -bottom-24 text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-200 to-cyan-500 drop-shadow-[0_0_15px_cyan] uppercase italic"
                  >
                    JARVIS
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Micro UI: Voice Waveform */}
              {stage === 'revealing' && (
                <div className="absolute -bottom-40 flex items-center gap-1 h-8">
                  {[...Array(15)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [4, Math.random() * 32 + 4, 4] }}
                      transition={{ duration: 0.2, repeat: Infinity, delay: i * 0.05 }}
                      className="w-1 bg-cyan-400/80 shadow-[0_0_5px_cyan]"
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lens Flare & Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            opacity: [0.1, 0.2, 0.1],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 7, repeat: Infinity }}
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" 
        />
      </div>
    </div>
  );
};
