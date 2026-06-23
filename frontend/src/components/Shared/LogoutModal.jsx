import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, X, Lock } from 'lucide-react';

export default function LogoutModal({ isOpen, onClose, onConfirm }) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-md transition-opacity"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div 
        className="relative bg-[#09090b] [.light_&]:bg-white border border-neutral-800 [.light_&]:border-neutral-100 rounded-3xl p-8 w-full max-w-[420px] shadow-2xl [.light_&]:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transform transition-all flex flex-col items-center text-center font-sans"
        style={{ animation: 'modalFadeIn 0.2s ease-out' }}
      >
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-500 hover:text-white [.light_&]:hover:text-neutral-800 transition-colors focus:outline-hidden cursor-pointer"
        >
          <X className="w-5 h-5 stroke-[1.5]" />
        </button>

        {/* Outline Icon */}
        <div className="w-16 h-16 rounded-full border border-red-500/30 [.light_&]:border-red-200 bg-red-500/5 [.light_&]:bg-red-50 text-red-500 flex items-center justify-center mb-6 mt-2 relative">
          <div className="absolute inset-0 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.15)] [.light_&]:shadow-[0_0_15px_rgba(239,68,68,0.1)] pointer-events-none"></div>
          <LogOut className="w-7 h-7 stroke-[2] ml-1" />
        </div>
        
        {/* Text */}
        <h3 className="text-2xl font-bold text-white [.light_&]:text-neutral-900 mb-3 tracking-tight">Log Out</h3>
        <p className="text-neutral-400 [.light_&]:text-neutral-500 text-[15px] mb-8 max-w-[260px] leading-relaxed">
          Are you sure you want to log out<br/>of your account?
        </p>
        
        {/* Outlined Actions */}
        <div className="flex gap-4 w-full mb-7">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-3.5 rounded-2xl bg-[#121214] [.light_&]:bg-white border border-neutral-800 [.light_&]:border-neutral-200 text-neutral-300 [.light_&]:text-neutral-800 hover:bg-[#18181b] [.light_&]:hover:bg-neutral-50 hover:text-white [.light_&]:hover:text-neutral-900 font-medium text-[15px] transition-all focus:outline-hidden cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 px-4 py-3.5 rounded-2xl bg-transparent [.light_&]:bg-white border border-red-500 [.light_&]:border-red-400 text-red-500 hover:bg-red-500/10 [.light_&]:hover:bg-red-50 font-medium text-[15px] transition-all focus:outline-hidden cursor-pointer"
          >
            Log Out
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 text-neutral-500 [.light_&]:text-neutral-400 text-[13px] font-medium">
          <Lock className="w-3.5 h-3.5 stroke-[2]" />
          <span>You'll be securely signed out.</span>
        </div>
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
}
