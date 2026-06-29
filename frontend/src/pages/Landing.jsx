import { useEffect } from 'react';
import Navbar from '../components/Landing/Navbar';
import Hero from '../components/Landing/Hero';
import FeatureStrip from '../components/Landing/FeatureStrip';

// ── New Feature Sections (6) ─────────────────────────────────────────────────
import RescueModeSection from '../components/Landing/RescueModeSection';
import ForesightSection from '../components/Landing/ForesightSection';
import ProcrastinationSection from '../components/Landing/ProcrastinationSection';
import SmartPlannerSection from '../components/Landing/SmartPlannerSection';
import PostMeetingSection from '../components/Landing/PostMeetingSection';
import PreMortemSection from '../components/Landing/PreMortemSection';
import EnergySchedulingSection from '../components/Landing/EnergySchedulingSection';

// ── Existing Feature Sections ─────────────────────────────────────────────────
import VoiceSection from '../components/Landing/VoiceSection';
import GoalSystemSection from '../components/Landing/GoalSystemSection';
import CalendarSection from '../components/Landing/CalendarSection';
import CoreWorkflowSection from '../components/Landing/CoreWorkflowSection';
import HabitsSection from '../components/Landing/HabitsSection';
import FocusSessionSection from '../components/Landing/FocusSessionSection';
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

      {/* ── NEW FEATURES (Strongest → Most Agentic) ───────────────────────────── */}
      {/* 1. Rescue Mode — most dramatic, immediate, visceral */}
      <RescueModeSection />

      {/* 2. Foresight — visible on every task, always present */}
      <ForesightSection />

      {/* 3. Procrastination Interception — behaviorally novel */}
      <ProcrastinationSection />

      {/* 4. Smart Roadmap Planner — universal learning roadmap builder */}
      <SmartPlannerSection />

      {/* ── EXISTING FEATURES (Voice AI — proven crowd-pleaser) ───────────────── */}
      <VoiceSection />

      {/* ── NEW: Post-Meeting — closes the calendar loop ──────────────────────── */}
      <PostMeetingSection />

      {/* ── EXISTING: Calendar + Goal ─────────────────────────────────────────── */}
      <CalendarSection />
      <GoalSystemSection />

      {/* ── NEW: Pre-Mortem — pairs naturally after Goals ─────────────────────── */}
      <PreMortemSection />

      {/* ── EXISTING: Core Workflow + Habits ──────────────────────────────────── */}
      <CoreWorkflowSection />
      <HabitsSection />

      {/* ── NEW: Energy Scheduling — pairs after Habits (both behavioral) ──────── */}
      <EnergySchedulingSection />

      {/* ── EXISTING: Focus + Mobile ──────────────────────────────────────────── */}
      <FocusSessionSection />
      <MobileSection />

      <CTASection />
      <Footer />
    </div>
  );
}

