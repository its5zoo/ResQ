import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import Navbar from '../components/Landing/Navbar';
import DocsSidebar from '../components/Docs/DocsSidebar';
import DocsContent from '../components/Docs/DocsContent';

export default function DocsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'introduction';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setActiveSection(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    // Execute initially if hash is present
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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

  return (
    <div className="bg-[#080808] text-white min-h-screen relative bg-noise overflow-x-hidden notranslate flex flex-col">
      {/* Top Navigation - Shared with Landing */}
      <div className="z-[100] relative">
        <Navbar />
      </div>

      <div className="flex flex-1 pt-24 max-w-[90rem] mx-auto w-full px-4 sm:px-6 md:px-8">
        
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar Container */}
        <aside className={`
          fixed top-0 left-0 h-full w-72 bg-[#080808]/95 backdrop-blur-xl border-r border-white/5 z-[200]
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:sticky lg:top-24 lg:h-[calc(100vh-6rem)] lg:w-64 lg:bg-transparent lg:border-none lg:z-auto lg:self-start
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between p-4 lg:hidden border-b border-white/5">
            <span className="font-display font-black tracking-tight text-xl text-white">Documentation</span>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-white/50 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="h-full overflow-y-auto p-4 lg:p-0 scrollbar-hide">
            <DocsSidebar activeSection={activeSection} setActiveSection={setActiveSection} closeMobileSidebar={() => setIsSidebarOpen(false)} />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 lg:pl-12 pb-24">
          <div className="lg:hidden mb-6 flex items-center justify-between border-b border-white/10 pb-4">
            <h1 className="text-xl font-bold">Documentation</h1>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/80"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          
          <DocsContent activeSection={activeSection} />
        </main>

      </div>
    </div>
  );
}
