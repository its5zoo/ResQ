import { useState, useEffect } from 'react';
import { Flame, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';
import { notifications as apiNotifications } from '../../services/api.js';
import { useSocket } from '../../services/socket.js';

const timeAgo = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const data = await apiNotifications.getAll();
      const mapped = (data || []).map(item => ({
        id: item._id,
        type: item.type || 'info',
        unread: !item.read,
        title: item.title,
        desc: item.message,
        time: timeAgo(item.createdAt),
        createdAt: item.createdAt
      }));
      setNotifications(mapped);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchNotifications();
    };
    load();
  }, []);

  // Socket listener for new real-time notifications
  useSocket('notification:new', (newNotif) => {
    console.log('[Socket] notification:new received on Notifications page:', newNotif);
    const mappedNotif = {
      id: newNotif._id,
      type: newNotif.type || 'info',
      unread: !newNotif.read,
      title: newNotif.title,
      desc: newNotif.message,
      time: timeAgo(newNotif.createdAt),
      createdAt: newNotif.createdAt,
      isNewSocketNotif: true
    };
    setNotifications(prev => [mappedNotif, ...prev]);

    // Clear pulse effect after 4s
    setTimeout(() => {
      setNotifications(prev => prev.map(n => n.id === mappedNotif.id ? { ...n, isNewSocketNotif: false } : n));
    }, 4000);
  });

  const toggleRead = async (id) => {
    const notif = notifications.find(n => n.id === id);
    if (!notif || !notif.unread) return; // already read

    try {
      await apiNotifications.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      const unreadList = notifications.filter(n => n.unread);
      if (unreadList.length === 0) return;
      await Promise.all(unreadList.map(n => apiNotifications.markRead(n.id)));
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  return (
    <div className="space-y-5 lg:space-y-8 animate-fade-in font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <span className="text-xs lg:text-sm font-tech font-bold tracking-[0.3em] text-[#E5B842] block mb-1.5 lg:mb-2">ALERT REGISTRY</span>
          <h2 className="text-2xl lg:text-3xl font-display font-black tracking-tight text-white leading-none">
            Notifications & Actions
          </h2>
        </div>
        <button 
          onClick={markAllRead}
          className="text-sm font-bold text-[#E5B842] hover:text-[#FFF2CC] uppercase tracking-widest cursor-pointer font-tech transition-colors duration-300"
        >
          Mark all read
        </button>
      </div>

      {/* Notifications list */}
      <div className="space-y-4 max-w-4xl">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-24 bg-white/5 rounded-3xl"></div>
            ))}
          </div>
        ) : (
          <>
            {notifications.map((item) => {
              const IconComponent = item.type === 'alert' 
                ? Sparkles 
                : item.type === 'achievement' 
                  ? Flame 
                  : Calendar;

              return (
                <div 
                  key={item.id}
                  onClick={() => toggleRead(item.id)}
                  className={`p-6 bg-[#090909] border transition-all duration-300 flex items-start gap-5 rounded-3xl layered-shadow-lg hover:layered-shadow-xl relative overflow-hidden group cursor-pointer ${
                    item.isNewSocketNotif
                      ? 'border-[#E5B842] shadow-[0_0_20px_rgba(229,184,66,0.3)] animate-pulse'
                      : item.unread 
                        ? 'border-white/[0.04] hover:border-[#E5B842]/30 card-shine-sweep' 
                        : 'border-white/[0.02] hover:border-white/20'
                  }`}
                >
                  {/* Ambient indicator stripe */}
                  <div className={`absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300 ${
                    item.unread 
                      ? 'bg-[#E5B842]' 
                      : 'bg-white/40 group-hover:bg-white'
                  }`}></div>

                  {/* Icon Container */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 ${
                    item.unread
                      ? 'bg-[#E5B842] border-[#E5B842] text-black shadow-[0_0_15px_rgba(229,184,66,0.15)]'
                      : 'bg-white border-white text-black shadow-[0_0_15px_rgba(255,255,255,0.15)]'
                  }`}>
                    <IconComponent className="w-4 h-4 text-black" />
                  </div>

                  {/* Text details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className={`text-sm font-bold transition-all duration-300 leading-none truncate ${
                          item.unread 
                            ? 'text-white' 
                            : 'text-white/45 group-hover:text-white/80'
                        }`}>
                          {item.title}
                        </h4>
                        {item.unread && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E5B842] shadow-[0_0_8px_rgba(229,184,66,0.8)] shrink-0 animate-pulse"></span>
                        )}
                      </div>
                      <span className="text-sm font-tech text-white/35 shrink-0 uppercase tracking-wider">{item.time}</span>
                    </div>
                    <p className={`text-sm leading-relaxed font-light mt-2.5 max-w-2xl transition-all duration-300 ${
                      item.unread ? 'text-white/60' : 'text-white/60'
                    }`}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}

            {notifications.length === 0 && (
              <div className="text-center py-20 bg-[#090909] border border-white/[0.04] rounded-3xl layered-shadow-lg">
                <CheckCircle2 className="w-10 h-10 text-[#E5B842]/30 mx-auto mb-3" />
                <p className="text-sm text-white/70">You have no new alerts.</p>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
