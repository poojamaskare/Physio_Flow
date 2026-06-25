'use client';

import { useEffect } from 'react';
import { 
  Activity, 
  Camera, 
  TrendingUp, 
  Mic, 
  Play, 
  ChevronDown, 
  Star, 
  Link2, 
  Share2, 
  Calendar, 
  Users 
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted?: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  useEffect(() => {
    // Use IntersectionObserver for scroll-triggered entrance animations
    const setupScrollAnimations = () => {
      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      };

      const observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      }, observerOptions);

      document.querySelectorAll('.fade-in-up').forEach(el => {
        observer.observe(el);
      });
    };

    // Smooth Parallax Implementation
    const setupParallax = () => {
      const parallaxElements = document.querySelectorAll('.parallax-bg');
      
      const handleScroll = () => {
        const scrolled = window.pageYOffset;
        parallaxElements.forEach(el => {
          const speedAttr = el.getAttribute('data-speed');
          const speed = speedAttr ? parseFloat(speedAttr) : 0.1;
          const parentElement = el.parentElement;
          if (parentElement) {
            const rect = parentElement.getBoundingClientRect();
            const visible = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (visible) {
              const relativeScroll = scrolled - (rect.top + scrolled - window.innerHeight);
              const yPos = -(relativeScroll * speed);
              (el as HTMLElement).style.transform = `translateY(${yPos}px)`;
            }
          }
        });
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    };

    // Navigation scroll behavior
    const setupNavbar = () => {
      const nav = document.querySelector('nav');
      const handleScroll = () => {
        if (nav) {
          if (window.scrollY > 50) {
            nav.classList.add('py-2', 'shadow-lg', 'bg-surface/95');
            nav.classList.remove('py-stack-sm');
          } else {
            nav.classList.add('py-stack-sm');
            nav.classList.remove('py-2', 'shadow-lg', 'bg-surface/95');
          }
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    };

    setupScrollAnimations();
    const cleanupParallax = setupParallax();
    const cleanupNavbar = setupNavbar();

    return () => {
      cleanupParallax();
      cleanupNavbar();
    };
  }, []);

  return (
    <div className="font-body-md">
      <style>{`
        body {
          background-color: #fbf9f8;
          color: #1b1c1c;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }
        .kinetic-gradient {
          background: linear-gradient(135deg, #ad2c00 0%, #ff5625 100%);
        }
        .glass-hud {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        .mask-radial {
          mask-image: radial-gradient(circle at center, black 0%, transparent 80%);
        }
        details > summary::-webkit-details-marker {
          display: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Animation Keyframes */
        @keyframes scan-line {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        .scan-line {
          animation: scan-line 3s linear infinite;
        }
        
        .fade-in-up {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .fade-in-up.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .hover-lift {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
        }

        .parallax-container {
          overflow: hidden;
          position: relative;
        }
        .parallax-bg {
          will-change: transform;
          transform: translateY(0);
        }

        .pulse-soft {
          animation: pulse-soft 2s ease-in-out infinite;
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.98); }
        }
      `}</style>

      {/* Top Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/20 transition-all duration-300">
        <div className="flex justify-between items-center px-margin py-stack-sm w-full max-w-[1440px] mx-auto">
          <div className="cursor-pointer" onClick={onGetStarted}>
            <span className="font-headline-md text-headline-md text-on-surface tracking-tighter">PHYSIOFLOW</span>
          </div>
          <div className="flex items-center gap-stack-lg">
            <div className="hidden md:flex gap-stack-lg">
              <a className="font-body-md text-body-md uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors" href="#">Product</a>
              <a className="font-body-md text-body-md uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors" href="#">Solutions</a>
              <a className="font-body-md text-body-md uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors" href="#">Doctors</a>
            </div>
            <div>
              <button onClick={onGetStarted} className="bg-primary text-white px-8 py-3 rounded-full font-label-caps uppercase scale-95 hover:scale-100 active:scale-95 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
                START RECOVERY
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen pt-section-padding flex items-center px-margin">
        <div className="w-full max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="w-full flex flex-col items-start gap-stack-lg z-10 fade-in-up">
            <div className="inline-block border border-primary/30 px-4 py-1 rounded-full text-primary font-label-caps uppercase">
              Clinical Precision AI
            </div>
            <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg uppercase leading-tight max-w-2xl text-on-surface">
              REHAB SMARTER.<br/>RECOVER STRONGER.
            </h1>
            <div className="flex gap-stack-lg border-l-2 border-primary pl-stack-md py-2">
              <div>
                <p className="font-data-display text-data-display text-on-surface">25K+</p>
                <p className="font-label-caps text-on-surface-variant uppercase">Patients Treated</p>
              </div>
              <div>
                <p className="font-data-display text-data-display text-on-surface">98.6%</p>
                <p className="font-label-caps text-on-surface-variant uppercase">AI Accuracy</p>
              </div>
            </div>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[448px]">
              Combining elite clinical knowledge with advanced computer vision to monitor your rehabilitation in real-time, anywhere in the world.
            </p>
          </div>
          <div className="w-full relative mt-stack-lg md:mt-0 fade-in-up delay-200">
            <div className="relative w-full aspect-square md:aspect-auto md:h-[80vh] overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-container shadow-xl">
              <img alt="Advanced AI skeleton tracking in a home environment" className="w-full h-full object-cover scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGZq8o8ngEcwZyssgylK8JTXC2ECRt9sGUB5M0gCpDwzCiKG-tC_MEdLhSSfmVw4__OhcE2V7BeDAhL-rvKbhnMiikX_hjadwgrHm6wovGPVlf_M-jUYsfYeh3hETKOM-y1ydvsIoSKZp-0G6ixuiXSOAbFpDUFPU2lBKAdEbc8iqWIrb-BxyV2J-IWlkzO8jAIRzeslnJhhfq_vdsIDMc-tYc0rHgHP3MlxJyT47ttCjsR4UyhKBDzEn7piviOxi7qVHVjT368psk"/>
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent opacity-40"></div>
              {/* HUD Overlays */}
              <div className="absolute top-8 right-8 glass-hud p-6 rounded-lg w-48 shadow-sm">
                <p className="font-label-caps text-[10px] text-primary mb-2">LIVE ANALYSIS</p>
                <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-3/4 transition-all duration-1000 ease-in-out"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Manifesto */}
      <section className="bg-on-surface py-section-padding text-surface px-margin overflow-hidden relative parallax-container">
        <div className="max-w-4xl mx-auto text-center relative z-10 fade-in-up">
          <span className="font-label-caps text-surface/60 uppercase block mb-stack-md">The Vision</span>
          <h2 className="font-display-xl text-headline-lg-mobile md:text-display-xl uppercase leading-none mb-stack-lg">
            SMART TECHNOLOGY.<br/>STRONGER RECOVERIES.
          </h2>
          <p className="font-body-lg text-body-lg max-w-2xl mx-auto opacity-80">
            We believe recovery shouldn't be guesswork. By leveraging clinical-grade AI, we turn every home into a high-performance rehabilitation center, ensuring every movement is counted and every goal is met.
          </p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-5 select-none pointer-events-none parallax-bg" data-speed="0.2">
          <span className="font-display-xl text-[400px] leading-none uppercase text-surface">ACCURACY</span>
        </div>
      </section>

      {/* Rehabilitation Banner */}
      <section className="relative h-screen w-full flex items-center justify-center text-center overflow-hidden parallax-container">
        <div className="absolute inset-0">
          <img alt="Elderly male patient performing seated leg exercises" className="w-full h-full object-cover grayscale opacity-20 parallax-bg scale-110" data-speed="0.15" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJoO3ev6a_vyAiPBjmvTmzzknjDes21jdxlXSGh3dN-V7XXm3-XV8hJ1ThMJ_SXNwhKLU2pjNKIknNdj5gSfOwdG0ulqqUuVW5NRHgUvMQsGlIEkKkPg-4HhpVNJl7q7VGoxksHt4r2xHwsAZw_hK6FdfFG5wXLBwDMYYrN85kF2opsThEFnt5MaXzl-NjzVcNW1AJ5Vv4SJeB5EpECceW6Dh2f1_OfQUcDQZTnFF-hGzJ2eN2vMloLoASz2ubuV-w1KlaSIqW6Vo0"/>
          <div className="absolute inset-0 bg-surface/40"></div>
        </div>
        <div className="relative z-10 px-margin flex flex-col items-center fade-in-up">
          <div onClick={onGetStarted} className="w-20 h-20 rounded-full border-2 border-primary flex items-center justify-center mb-stack-lg bg-surface/50 backdrop-blur-sm hover-lift cursor-pointer">
            <Play className="w-8 h-8 text-primary fill-primary ml-1" />
          </div>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg uppercase mb-stack-md text-on-surface">GUIDED. MONITORED. MEASURABLE.</h2>
          <p className="font-label-caps text-primary tracking-[0.4em] uppercase font-bold">The Future of Home Physiotherapy</p>
        </div>
      </section>

      {/* Platform Features (Bento Grid) */}
      <section className="py-section-padding px-margin bg-surface-container-low">
        <div className="w-full max-w-[1440px] mx-auto">
          <div className="mb-stack-lg fade-in-up">
            <h2 className="font-headline-md text-headline-md uppercase mb-4 text-on-surface">Core Ecosystem</h2>
            <div className="h-1 w-24 bg-primary"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {/* AI Pose Detection */}
            <div className="md:col-span-2 bg-surface p-stack-lg rounded-xl border border-outline-variant/30 flex flex-col justify-between group hover-lift transition-all shadow-sm fade-in-up">
              <Camera className="w-10 h-10 text-primary" />
              <div className="mt-stack-lg">
                <h3 className="font-headline-md text-headline-md uppercase mb-2 text-on-surface">AI Pose Detection</h3>
                <p className="font-body-md text-on-surface-variant max-w-[512px]">Advanced sub-millimeter movement tracking using standard hardware. No wearables required, just your vision.</p>
              </div>
            </div>
            {/* Smart Tracking */}
            <div className="bg-primary p-stack-lg rounded-xl text-white flex flex-col justify-between shadow-lg hover-lift transition-all fade-in-up" style={{ transitionDelay: '100ms' }}>
              <TrendingUp className="w-10 h-10 text-white" />
              <div className="mt-stack-lg">
                <h3 className="font-headline-md text-headline-md uppercase mb-2">Smart Tracking</h3>
                <p className="font-body-md opacity-90">Real-time biomechanical analysis and progress quantification.</p>
              </div>
            </div>
            {/* AI Voice Agent */}
            <div className="bg-surface p-stack-lg rounded-xl border border-outline-variant/30 flex flex-col justify-between shadow-sm hover-lift transition-all fade-in-up" style={{ transitionDelay: '200ms' }}>
              <div className="flex justify-between items-start">
                <Mic className="w-10 h-10 text-on-surface" />
                <div className="flex gap-1">
                  <div className="w-1 h-4 bg-primary animate-bounce"></div>
                  <div className="w-1 h-6 bg-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-3 bg-primary animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
              <div className="mt-stack-lg">
                <h3 className="font-headline-md text-headline-md uppercase mb-2 text-on-surface">Voice Coaching</h3>
                <p className="font-body-md text-on-surface-variant">Real-time verbal corrections and encouragement as you perform each set.</p>
              </div>
            </div>
            {/* Doctor Dashboard */}
            <div className="md:col-span-2 bg-surface p-stack-lg rounded-xl border border-outline-variant/30 flex items-center justify-between gap-stack-lg shadow-sm hover-lift transition-all fade-in-up" style={{ transitionDelay: '300ms' }}>
              <div className="w-1/2">
                <h3 className="font-headline-md text-headline-md uppercase mb-2 text-on-surface">Doctor Dashboard</h3>
                <p className="font-body-md text-on-surface-variant">Clinical grade oversight. Doctors can adjust prescriptions remotely based on real biomechanical data.</p>
              </div>
              <div className="w-1/2 relative overflow-hidden h-48 rounded-lg bg-surface-container-low border border-outline-variant/20 p-4 font-body-md text-xs flex flex-col justify-between">
                <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="font-bold text-on-surface">Patient ROM Analysis</span>
                  </div>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Prescription Active</span>
                </div>
                <div className="space-y-2 py-2">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Range of Motion (Knee Extension):</span>
                    <span className="font-bold text-on-surface text-right">115° <span className="text-green-600 font-semibold text-[10px]">(+15°)</span></span>
                  </div>
                  <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full w-[85%] transition-all duration-1000 ease-in-out"></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-on-surface-variant pt-1">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Dr. Elena Ross</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Updated 2h ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Doctor & Patient Workflow */}
      <section className="py-section-padding px-margin border-t border-outline-variant/10 bg-surface">
        <div className="w-full max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-stack-lg">
          <div className="space-y-stack-lg fade-in-up">
            <div className="sticky top-stack-lg">
              <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-md uppercase text-on-surface">The Clinical Flow</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-stack-md">From medical professional to at-home excellence. A seamless loop of data and recovery.</p>
            </div>
          </div>
          <div className="space-y-stack-lg">
            <div className="flex gap-stack-md group fade-in-up" style={{ transitionDelay: '100ms' }}>
              <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-primary flex items-center justify-center font-headline-md text-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">1</div>
              <div>
                <h4 className="font-headline-md text-2xl uppercase mb-2 text-on-surface">Prescription</h4>
                <p className="font-body-md text-on-surface-variant">Clinicians select movements and goals through our proprietary library of over 1,500 clinical exercises.</p>
              </div>
            </div>
            <div className="flex gap-stack-md group fade-in-up" style={{ transitionDelay: '200ms' }}>
              <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-primary flex items-center justify-center font-headline-md text-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">2</div>
              <div>
                <h4 className="font-headline-md text-2xl uppercase mb-2 text-on-surface">Patient Sync</h4>
                <p className="font-body-md text-on-surface-variant">The mobile app instantly syncs the routine, providing high-definition guidance and AI oversight.</p>
              </div>
            </div>
            <div className="flex gap-stack-md group fade-in-up" style={{ transitionDelay: '300ms' }}>
              <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-primary flex items-center justify-center font-headline-md text-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">3</div>
              <div>
                <h4 className="font-headline-md text-2xl uppercase mb-2 text-on-surface">Real-time Feedback</h4>
                <p className="font-body-md text-on-surface-variant">AI monitors joint angles, cadence, and range of motion, providing instant corrective feedback.</p>
              </div>
            </div>
            <div className="flex gap-stack-md group fade-in-up" style={{ transitionDelay: '400ms' }}>
              <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-primary flex items-center justify-center font-headline-md text-2xl text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">4</div>
              <div>
                <h4 className="font-headline-md text-2xl uppercase mb-2 text-on-surface">Data Loop</h4>
                <p className="font-body-md text-on-surface-variant">Performance metrics are sent back to the doctor, enabling data-driven adjustments to the recovery plan.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-section-padding bg-surface-container-low overflow-hidden">
        <div className="w-full max-w-[1440px] mx-auto px-margin mb-stack-lg fade-in-up">
          <h2 className="font-headline-md text-headline-md uppercase text-on-surface">Patient & Clinical Success</h2>
        </div>
        <div className="flex gap-stack-lg overflow-x-auto px-margin pb-10 no-scrollbar">
          {/* Card 1 */}
          <div className="min-w-[400px] bg-surface border border-outline-variant/30 p-stack-lg rounded-xl shadow-sm hover-lift fade-in-up">
            <div className="flex gap-1 mb-stack-md">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-primary fill-primary" />
              ))}
            </div>
            <p className="font-body-lg text-body-lg mb-stack-lg italic text-on-surface">"The accuracy of the pose tracking is incredible. It's like having my therapist in the room with me at 9 PM on a Tuesday."</p>
            <div>
              <p className="font-label-caps text-on-surface">Mark J.</p>
              <p className="font-body-md text-on-surface-variant text-sm">Post-Op Knee Recovery</p>
            </div>
          </div>
          {/* Card 2 */}
          <div className="min-w-[400px] bg-surface border border-outline-variant/30 p-stack-lg rounded-xl shadow-sm hover-lift fade-in-up" style={{ transitionDelay: '100ms' }}>
            <div className="flex gap-1 mb-stack-md">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-primary fill-primary" />
              ))}
            </div>
            <p className="font-body-lg text-body-lg mb-stack-lg italic text-on-surface">"PhysioFlow has transformed how we manage home prescriptions. The compliance rates have jumped by 40%."</p>
            <div>
              <p className="font-label-caps text-on-surface">Dr. Elena Ross</p>
              <p className="font-body-md text-on-surface-variant text-sm">Head of Orthopedics</p>
            </div>
          </div>
          {/* Card 3 */}
          <div className="min-w-[400px] bg-surface border border-outline-variant/30 p-stack-lg rounded-xl shadow-sm hover-lift fade-in-up" style={{ transitionDelay: '200ms' }}>
            <div className="flex gap-1 mb-stack-md">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-primary fill-primary" />
              ))}
            </div>
            <p className="font-body-lg text-body-lg mb-stack-lg italic text-on-surface">"I finally feel confident that I'm doing my exercises correctly. The voice guidance is a game changer."</p>
            <div>
              <p className="font-label-caps text-on-surface">Susan W.</p>
              <p className="font-body-md text-on-surface-variant text-sm">Shoulder Rehab Patient</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-section-padding px-margin bg-surface">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-headline-md text-headline-md uppercase mb-stack-lg text-center text-on-surface fade-in-up">Clinical FAQ</h2>
          <div className="divide-y divide-outline-variant/20">
            <details className="group py-stack-md fade-in-up">
              <summary className="flex justify-between items-center cursor-pointer list-none">
                <span className="font-headline-md text-xl uppercase text-on-surface group-hover:text-primary transition-colors">Is it HIPAA compliant?</span>
                <ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform text-on-surface" />
              </summary>
              <p className="mt-4 font-body-md text-on-surface-variant leading-relaxed">Yes. PhysioFlow adheres to the highest standards of clinical data privacy, ensuring all patient movements and records are end-to-end encrypted.</p>
            </details>
            <details className="group py-stack-md fade-in-up" style={{ transitionDelay: '100ms' }}>
              <summary className="flex justify-between items-center cursor-pointer list-none">
                <span className="font-headline-md text-xl uppercase text-on-surface group-hover:text-primary transition-colors">Does it work with any camera?</span>
                <ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform text-on-surface" />
              </summary>
              <p className="mt-4 font-body-md text-on-surface-variant leading-relaxed">Our AI is optimized for standard smartphone, tablet, and laptop cameras. No specialized infrared or 3D sensing hardware is required.</p>
            </details>
            <details className="group py-stack-md fade-in-up" style={{ transitionDelay: '200ms' }}>
              <summary className="flex justify-between items-center cursor-pointer list-none">
                <span className="font-headline-md text-xl uppercase text-on-surface group-hover:text-primary transition-colors">Can I share my progress?</span>
                <ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform text-on-surface" />
              </summary>
              <p className="mt-4 font-body-md text-on-surface-variant leading-relaxed">Absolutely. Your recovery dashboard can be shared with your physical therapist, surgeon, or primary care physician with a single tap.</p>
            </details>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-container-lowest w-full pt-section-padding pb-stack-lg border-t border-outline-variant/20">
        <div className="flex flex-col px-margin w-full max-w-[1440px] mx-auto">
          <span className="font-display-xl text-display-xl text-on-surface block mb-stack-lg opacity-5 transition-opacity hover:opacity-10 cursor-default">PHYSIOFLOW</span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-stack-lg mb-section-padding">
            <div className="flex flex-col gap-4">
              <p className="font-label-caps text-primary uppercase mb-2 font-bold">Platform</p>
              <a className="font-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</a>
              <a className="font-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Service</a>
            </div>
            <div className="flex flex-col gap-4">
              <p className="font-label-caps text-primary uppercase mb-2 font-bold">Research</p>
              <a className="font-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Clinical Research</a>
              <a className="font-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Press Kit</a>
            </div>
            <div className="flex flex-col gap-4">
              <p className="font-label-caps text-primary uppercase mb-2 font-bold">Support</p>
              <a className="font-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Contact Support</a>
            </div>
            <div className="flex flex-col gap-4 justify-end items-end">
              <div className="flex gap-4">
                <a className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-white transition-all hover-lift" href="#">
                  <Link2 className="w-4 h-4 text-on-surface-variant hover:text-white transition-colors" />
                </a>
                <a className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-primary hover:text-white transition-all hover-lift" href="#">
                  <Share2 className="w-4 h-4 text-on-surface-variant hover:text-white transition-colors" />
                </a>
              </div>
            </div>
          </div>
          <div className="pt-stack-md border-t border-outline-variant/10 flex justify-between items-center">
            <p className="font-body-md text-on-surface-variant uppercase tracking-widest text-xs">© 2024 PHYSIOFLOW. ELITE CLINICAL PERFORMANCE.</p>
            <p className="font-body-md text-on-surface-variant uppercase tracking-widest text-xs">San Francisco, CA</p>
          </div>
        </div>
      </footer>
    </div>
  );
}