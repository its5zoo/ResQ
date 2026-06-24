import { useEffect } from 'react';
import Navbar from '../components/Landing/Navbar';
import Hero from '../components/Landing/Hero';
import FeatureStrip from '../components/Landing/FeatureStrip';

import DashboardPreview from '../components/Landing/DashboardPreview';
import CoreWorkflowSection from '../components/Landing/CoreWorkflowSection';
import GoalSystemSection from '../components/Landing/GoalSystemSection';
import CalendarSection from '../components/Landing/CalendarSection';
import VoiceSection from '../components/Landing/VoiceSection';
import MobileSection from '../components/Landing/MobileSection';
import CTASection from '../components/Landing/CTASection';
import Footer from '../components/Landing/Footer';

import Lenis from 'lenis';

export default function Landing() {
  useEffect(() => {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('resq-theme') || 'dark';
    const root = document.documentElement;
    root.classList.remove('light', 'matrix');
    if (savedTheme === 'light') {
      root.classList.add('light');
    } else if (savedTheme === 'matrix') {
      root.classList.add('matrix');
    }
  }, []);

  useEffect(() => {
    // Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
      gestureDirection: 'vertical',
      smooth: true,
    });

    let rafId;
    const scrollRAF = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(scrollRAF);
    };

    rafId = requestAnimationFrame(scrollRAF);

    // Cleanup
    return () => {
      lenis.destroy();
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="bg-[#080808] text-white min-h-screen relative bg-noise overflow-x-hidden notranslate">
      <Navbar />
      <Hero />
      <FeatureStrip />
      
      {/* New Narrative Flow */}
      <DashboardPreview />
      <CoreWorkflowSection />
      <GoalSystemSection />
      <CalendarSection />
      
      {/* Existing Sections */}
      <VoiceSection />
      <MobileSection />
      <CTASection />
      <Footer />
    </div>
  );
}
