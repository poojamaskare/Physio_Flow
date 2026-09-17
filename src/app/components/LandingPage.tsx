'use client';

import { useEffect } from 'react';
import ThemeToggle from './ThemeToggle';
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
            nav.classList.add('py-3', 'shadow-lg');
            nav.classList.remove('py-5');
          } else {
            nav.classList.add('py-5');
            nav.classList.remove('py-3', 'shadow-lg');
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
    <div className="bg-background text-foreground">
      <style>{`
        .glass-hud {
          background: color-mix(in oklch, var(--background) 70%, transparent);
          backdrop-filter: blur(20px);
          border: 1px solid var(--border);
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
          box-shadow: 0 20px 40px color-mix(in oklch, var(--foreground) 8%, transparent);
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
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/20 transition-all duration-300">
        <div className="flex justify-between items-center px-6 md:px-16 py-5 w-full max-w-[1440px] mx-auto">
          <div className="cursor-pointer" onClick={onGetStarted}>
            <span className="text-2xl font-semibold tracking-tight text-foreground">PhysioFlow</span>
          </div>
          <div className="flex items-center gap-8">
            <div className="hidden md:flex gap-8">
              <a className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors" href="#">Product</a>
              <a className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors" href="#">Solutions</a>
              <a className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors" href="#">Doctors</a>
            </div>
            <ThemeToggle />
            <div>
              <button onClick={onGetStarted} className="bg-primary text-primary-foreground px-6 py-3 rounded-full text-base font-medium transition-colors hover:bg-primary/80">
                Start recovery
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen pt-32 md:pt-40 flex items-center px-6 md:px-16">
        <div className="w-full max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="w-full flex flex-col items-start gap-12 z-10 fade-in-up">
            <div className="inline-block border border-primary/30 px-4 py-1 rounded-full text-primary text-xs font-bold tracking-[0.1em] uppercase">
              Clinical Precision AI
            </div>
            <h1 className="font-semibold tracking-tight text-4xl md:text-6xl uppercase leading-tight max-w-2xl text-foreground">
              REHAB SMARTER.<br/>RECOVER STRONGER.
            </h1>
            <div className="flex gap-12 border-l-2 border-primary pl-6 py-2">
              <div>
                <p className="text-3xl font-semibold tabular-nums text-foreground">25K+</p>
                <p className="text-xs font-bold tracking-[0.1em] text-muted-foreground uppercase">Patients Treated</p>
              </div>
              <div>
                <p className="text-3xl font-semibold tabular-nums text-foreground">98.6%</p>
                <p className="text-xs font-bold tracking-[0.1em] text-muted-foreground uppercase">AI Accuracy</p>
              </div>
            </div>
            <p className="text-lg text-muted-foreground max-w-[448px]">
              Combining elite clinical knowledge with advanced computer vision to monitor your rehabilitation in real-time, anywhere in the world.
            </p>
          </div>
          <div className="w-full relative mt-12 md:mt-0 fade-in-up delay-200">
            <div className="relative w-full aspect-square md:aspect-auto md:h-[80vh] overflow-hidden rounded-xl border border-border/30 bg-muted shadow-xl">
              <img alt="Advanced AI skeleton tracking in a home environment" className="w-full h-full object-cover scale-105" src="/landing-page.jpg"/>
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent opacity-40"></div>
              {/* HUD Overlays */}
              <div className="absolute top-8 right-8 glass-hud p-6 rounded-lg w-48 shadow-sm">
                <p className="text-xs font-bold tracking-[0.1em] text-[10px] text-primary mb-2">LIVE ANALYSIS</p>
                <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-3/4 transition-all duration-1000 ease-in-out"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Manifesto */}
      <section className="bg-foreground py-24 md:py-40 text-background px-6 md:px-16 overflow-hidden relative parallax-container">
        <div className="max-w-4xl mx-auto text-center relative z-10 fade-in-up">
          <span className="text-xs font-bold tracking-[0.1em] text-background/60 uppercase block mb-6">The Vision</span>
          <h2 className="font-bold tracking-tighter text-4xl md:text-8xl uppercase leading-none mb-12">
            SMART TECHNOLOGY.<br/>STRONGER RECOVERIES.
          </h2>
          <p className="text-lg max-w-2xl mx-auto opacity-80">
            We believe recovery shouldn't be guesswork. By leveraging clinical-grade AI, we turn every home into a high-performance rehabilitation center, ensuring every movement is counted and every goal is met.
          </p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-5 select-none pointer-events-none parallax-bg" data-speed="0.2">
          <span className="font-bold tracking-tighter text-[400px] leading-none uppercase text-background">ACCURACY</span>
        </div>
      </section>

      {/* Rehabilitation Banner */}
      <section className="relative h-screen w-full flex items-center justify-center text-center overflow-hidden parallax-container">
        <div className="absolute inset-0">
          <img alt="Elderly male patient performing seated leg exercises" className="w-full h-full object-cover grayscale opacity-20 parallax-bg scale-110" data-speed="0.15" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJoO3ev6a_vyAiPBjmvTmzzknjDes21jdxlXSGh3dN-V7XXm3-XV8hJ1ThMJ_SXNwhKLU2pjNKIknNdj5gSfOwdG0ulqqUuVW5NRHgUvMQsGlIEkKkPg-4HhpVNJl7q7VGoxksHt4r2xHwsAZw_hK6FdfFG5wXLBwDMYYrN85kF2opsThEFnt5MaXzl-NjzVcNW1AJ5Vv4SJeB5EpECceW6Dh2f1_OfQUcDQZTnFF-hGzJ2eN2vMloLoASz2ubuV-w1KlaSIqW6Vo0"/>
          <div className="absolute inset-0 bg-background/40"></div>
        </div>
        <div className="relative z-10 px-6 md:px-16 flex flex-col items-center fade-in-up">
          <div onClick={onGetStarted} className="w-20 h-20 rounded-full border-2 border-primary flex items-center justify-center mb-12 bg-background/50 backdrop-blur-sm hover-lift cursor-pointer">
            <Play className="w-8 h-8 text-primary fill-primary ml-1" />
          </div>
          <h2 className="font-semibold tracking-tight text-4xl md:text-6xl uppercase mb-6 text-foreground">GUIDED. MONITORED. MEASURABLE.</h2>
          <p className="text-xs font-bold tracking-[0.1em] text-primary tracking-[0.4em] uppercase font-bold">The Future of Home Physiotherapy</p>
        </div>
      </section>

      {/* Platform Features (Bento Grid) */}
      <section className="py-16 md:py-24 px-6 md:px-16 bg-muted/40">
        <div className="w-full max-w-[1440px] mx-auto">
          <div className="mb-8 fade-in-up">
            <h2 className="text-xl font-semibold tracking-tight mb-3 text-foreground">Core Ecosystem</h2>
            <div className="h-px w-12 bg-border"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* AI Pose Detection */}
            <div className="md:col-span-2 bg-background p-6 rounded-lg border border-border/30 flex flex-col justify-between min-h-[200px] group transition-colors hover:bg-muted/60 fade-in-up">
              <Camera className="w-5 h-5 text-primary" />
              <div className="mt-10">
                <h3 className="text-base font-medium mb-1 text-foreground">AI Pose Detection</h3>
                <p className="text-muted-foreground max-w-[512px]">Advanced sub-millimeter movement tracking using standard hardware. No wearables required, just your vision.</p>
              </div>
            </div>
            {/* Smart Tracking */}
            <div className="bg-primary p-6 rounded-lg text-primary-foreground flex flex-col justify-between min-h-[200px]  fade-in-up" style={{ transitionDelay: '100ms' }}>
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
              <div className="mt-10">
                <h3 className="text-base font-medium mb-1">Smart Tracking</h3>
                <p className="opacity-90">Real-time biomechanical analysis and progress quantification.</p>
              </div>
            </div>
            {/* AI Voice Agent */}
            <div className="bg-background p-6 rounded-lg border border-border/30 flex flex-col justify-between min-h-[200px]  fade-in-up" style={{ transitionDelay: '200ms' }}>
              <div className="flex justify-between items-start">
                <Mic className="w-5 h-5 text-foreground" />
                <div className="flex gap-1">
                  <div className="w-1 h-4 bg-primary animate-bounce"></div>
                  <div className="w-1 h-6 bg-primary animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-3 bg-primary animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
              <div className="mt-10">
                <h3 className="text-base font-medium mb-1 text-foreground">Voice Coaching</h3>
                <p className="text-muted-foreground">Real-time verbal corrections and encouragement as you perform each set.</p>
              </div>
            </div>
            {/* Doctor Dashboard */}
            <div className="md:col-span-2 bg-background p-6 rounded-lg border border-border/30 flex items-center justify-between gap-12  fade-in-up" style={{ transitionDelay: '300ms' }}>
              <div className="w-1/2">
                <h3 className="text-base font-medium mb-1 text-foreground">Doctor Dashboard</h3>
                <p className="text-muted-foreground">Clinical grade oversight. Doctors can adjust prescriptions remotely based on real biomechanical data.</p>
              </div>
              <div className="w-1/2 relative overflow-hidden h-40 rounded-md bg-muted/40 border border-border/20 p-4 text-xs flex flex-col justify-between min-h-[200px]">
                <div className="flex justify-between items-center border-b border-border/20 pb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="font-bold text-foreground">Patient ROM Analysis</span>
                  </div>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Prescription Active</span>
                </div>
                <div className="space-y-2 py-2">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Range of Motion (Knee Extension):</span>
                    <span className="font-bold text-foreground text-right">115° <span className="text-success font-semibold text-[10px]">(+15°)</span></span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full w-[85%] transition-all duration-1000 ease-in-out"></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground pt-1">
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
      <section className="py-24 md:py-40 px-6 md:px-16 border-t border-border/10 bg-background">
        <div className="w-full max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-12 fade-in-up">
            <div className="sticky top-8 md:p-12">
              <h2 className="font-semibold tracking-tight text-4xl md:text-4xl uppercase text-foreground">The Clinical Flow</h2>
              <p className="text-lg text-muted-foreground mt-6">From medical professional to at-home excellence. A seamless loop of data and recovery.</p>
            </div>
          </div>
          <div className="space-y-12">
            <div className="flex gap-6 group fade-in-up" style={{ transitionDelay: '100ms' }}>
              <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-primary flex items-center justify-center font-semibold tracking-tight text-2xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">1</div>
              <div>
                <h4 className="font-semibold tracking-tight text-2xl uppercase mb-2 text-foreground">Prescription</h4>
                <p className="text-muted-foreground">Clinicians select movements and goals through our proprietary library of over 1,500 clinical exercises.</p>
              </div>
            </div>
            <div className="flex gap-6 group fade-in-up" style={{ transitionDelay: '200ms' }}>
              <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-primary flex items-center justify-center font-semibold tracking-tight text-2xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">2</div>
              <div>
                <h4 className="font-semibold tracking-tight text-2xl uppercase mb-2 text-foreground">Patient Sync</h4>
                <p className="text-muted-foreground">The mobile app instantly syncs the routine, providing high-definition guidance and AI oversight.</p>
              </div>
            </div>
            <div className="flex gap-6 group fade-in-up" style={{ transitionDelay: '300ms' }}>
              <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-primary flex items-center justify-center font-semibold tracking-tight text-2xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">3</div>
              <div>
                <h4 className="font-semibold tracking-tight text-2xl uppercase mb-2 text-foreground">Real-time Feedback</h4>
                <p className="text-muted-foreground">AI monitors joint angles, cadence, and range of motion, providing instant corrective feedback.</p>
              </div>
            </div>
            <div className="flex gap-6 group fade-in-up" style={{ transitionDelay: '400ms' }}>
              <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-primary flex items-center justify-center font-semibold tracking-tight text-2xl text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">4</div>
              <div>
                <h4 className="font-semibold tracking-tight text-2xl uppercase mb-2 text-foreground">Data Loop</h4>
                <p className="text-muted-foreground">Performance metrics are sent back to the doctor, enabling data-driven adjustments to the recovery plan.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 md:py-40 bg-muted/40 overflow-hidden">
        <div className="w-full max-w-[1440px] mx-auto px-6 md:px-16 mb-12 fade-in-up">
          <h2 className="font-semibold tracking-tight text-3xl uppercase text-foreground">Patient & Clinical Success</h2>
        </div>
        <div className="flex gap-12 overflow-x-auto px-6 md:px-16 pb-10 no-scrollbar">
          {/* Card 1 */}
          <div className="min-w-[400px] bg-background border border-border/30 p-8 md:p-12 rounded-xl shadow-sm hover-lift fade-in-up">
            <div className="flex gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-primary fill-primary" />
              ))}
            </div>
            <p className="text-lg mb-12 italic text-foreground">"The accuracy of the pose tracking is incredible. It's like having my therapist in the room with me at 9 PM on a Tuesday."</p>
            <div>
              <p className="text-xs font-bold tracking-[0.1em] text-foreground">Mark J.</p>
              <p className="text-muted-foreground text-sm">Post-Op Knee Recovery</p>
            </div>
          </div>
          {/* Card 2 */}
          <div className="min-w-[400px] bg-background border border-border/30 p-8 md:p-12 rounded-xl shadow-sm hover-lift fade-in-up" style={{ transitionDelay: '100ms' }}>
            <div className="flex gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-primary fill-primary" />
              ))}
            </div>
            <p className="text-lg mb-12 italic text-foreground">"PhysioFlow has transformed how we manage home prescriptions. The compliance rates have jumped by 40%."</p>
            <div>
              <p className="text-xs font-bold tracking-[0.1em] text-foreground">Dr. Elena Ross</p>
              <p className="text-muted-foreground text-sm">Head of Orthopedics</p>
            </div>
          </div>
          {/* Card 3 */}
          <div className="min-w-[400px] bg-background border border-border/30 p-8 md:p-12 rounded-xl shadow-sm hover-lift fade-in-up" style={{ transitionDelay: '200ms' }}>
            <div className="flex gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-primary fill-primary" />
              ))}
            </div>
            <p className="text-lg mb-12 italic text-foreground">"I finally feel confident that I'm doing my exercises correctly. The voice guidance is a game changer."</p>
            <div>
              <p className="text-xs font-bold tracking-[0.1em] text-foreground">Susan W.</p>
              <p className="text-muted-foreground text-sm">Shoulder Rehab Patient</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 md:py-40 px-6 md:px-16 bg-background">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-semibold tracking-tight text-3xl uppercase mb-12 text-center text-foreground fade-in-up">Clinical FAQ</h2>
          <div className="divide-y divide-border/20">
            <details className="group py-6 fade-in-up">
              <summary className="flex justify-between items-center cursor-pointer list-none">
                <span className="font-semibold tracking-tight text-xl uppercase text-foreground group-hover:text-primary transition-colors">Is it HIPAA compliant?</span>
                <ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform text-foreground" />
              </summary>
              <p className="mt-4 text-muted-foreground leading-relaxed">Yes. PhysioFlow adheres to the highest standards of clinical data privacy, ensuring all patient movements and records are end-to-end encrypted.</p>
            </details>
            <details className="group py-6 fade-in-up" style={{ transitionDelay: '100ms' }}>
              <summary className="flex justify-between items-center cursor-pointer list-none">
                <span className="font-semibold tracking-tight text-xl uppercase text-foreground group-hover:text-primary transition-colors">Does it work with any camera?</span>
                <ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform text-foreground" />
              </summary>
              <p className="mt-4 text-muted-foreground leading-relaxed">Our AI is optimized for standard smartphone, tablet, and laptop cameras. No specialized infrared or 3D sensing hardware is required.</p>
            </details>
            <details className="group py-6 fade-in-up" style={{ transitionDelay: '200ms' }}>
              <summary className="flex justify-between items-center cursor-pointer list-none">
                <span className="font-semibold tracking-tight text-xl uppercase text-foreground group-hover:text-primary transition-colors">Can I share my progress?</span>
                <ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform text-foreground" />
              </summary>
              <p className="mt-4 text-muted-foreground leading-relaxed">Absolutely. Your recovery dashboard can be shared with your physical therapist, surgeon, or primary care physician with a single tap.</p>
            </details>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background w-full pt-32 md:pt-40 pb-12 border-t border-border/20">
        <div className="flex flex-col px-6 md:px-16 w-full max-w-[1440px] mx-auto">
          <span className="font-bold tracking-tighter text-6xl md:text-8xl text-foreground block mb-12 opacity-5 transition-opacity hover:opacity-10 cursor-default">PHYSIOFLOW</span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-24">
            <div className="flex flex-col gap-4">
              <p className="text-xs font-bold tracking-[0.1em] text-primary uppercase mb-2 font-bold">Platform</p>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#">Privacy Policy</a>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#">Terms of Service</a>
            </div>
            <div className="flex flex-col gap-4">
              <p className="text-xs font-bold tracking-[0.1em] text-primary uppercase mb-2 font-bold">Research</p>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#">Clinical Research</a>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#">Press Kit</a>
            </div>
            <div className="flex flex-col gap-4">
              <p className="text-xs font-bold tracking-[0.1em] text-primary uppercase mb-2 font-bold">Support</p>
              <a className="text-muted-foreground hover:text-primary transition-colors" href="#">Contact Support</a>
            </div>
            <div className="flex flex-col gap-4 justify-end items-end">
              <div className="flex gap-4">
                <a className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all hover-lift" href="#">
                  <Link2 className="w-4 h-4 text-muted-foreground hover:text-primary-foreground transition-colors" />
                </a>
                <a className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all hover-lift" href="#">
                  <Share2 className="w-4 h-4 text-muted-foreground hover:text-primary-foreground transition-colors" />
                </a>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-border/10 flex justify-between items-center">
            <p className="text-muted-foreground uppercase tracking-widest text-xs">© 2024 PHYSIOFLOW. ELITE CLINICAL PERFORMANCE.</p>
            <p className="text-muted-foreground uppercase tracking-widest text-xs">San Francisco, CA</p>
          </div>
        </div>
      </footer>
    </div>
  );
}