import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Dashboard/Sidebar';
import DashboardHome from '../components/Dashboard/DashboardHome';
import TasksPage from '../components/Dashboard/TasksPage';
import CalendarPage from '../components/Dashboard/CalendarPage';
import GoalsPage from '../components/Dashboard/GoalsPage';
import HabitsPage from '../components/Dashboard/HabitsPage';
import VoiceAIPage from '../components/Dashboard/VoiceAIPage';
import SettingsPage from '../components/Dashboard/SettingsPage';
import NotificationsPage from '../components/Dashboard/NotificationsPage';

export default function Dashboard() {
  const [currentTab, setCurrentTab] = useState('dashboard');

  // Load and apply theme and plan states on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('resq-theme') || 'dark';
    const savedPlan = localStorage.getItem('resq-plan') || 'free';
    
    const root = document.documentElement;
    
    // Theme
    root.classList.remove('light', 'matrix');
    if (savedTheme === 'light') {
      root.classList.add('light');
    } else if (savedTheme === 'matrix') {
      root.classList.add('matrix');
    }
    
    // Plan
    root.classList.remove('premium-active', 'free-active');
    if (savedPlan === 'premium') {
      root.classList.add('premium-active');
    } else {
      root.classList.add('free-active');
    }
  }, []);

  // Shared Task State
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Draft React Frontend Architecture', urgency: 9, dueDate: 'Today', duration: 45, completed: false, category: 'Work', subtasks: [] },
    { id: 2, title: 'Submit Vibe2Ship Hackathon Project', urgency: 10, dueDate: 'Today', duration: 30, completed: false, category: 'Hackathon', subtasks: [] },
    { id: 3, title: 'Drink 3L of Water', urgency: 4, dueDate: 'Today', duration: 5, completed: true, category: 'Health', subtasks: [] },
    { id: 4, title: 'Renew Google Calendar OAuth scopes', urgency: 7, dueDate: 'Tomorrow', duration: 15, completed: false, category: 'Admin', subtasks: [] }
  ]);

  // Shared Habits State
  const [habits, setHabits] = useState([
    { id: 1, title: 'Gym Workout Routine', streak: 7, completedToday: true },
    { id: 2, title: 'Focus Reading (30m)', streak: 3, completedToday: false }
  ]);

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const toggleHabit = (id) => {
    setHabits(habits.map(h => 
      h.id === id ? { ...h, completedToday: !h.completedToday, streak: !h.completedToday ? h.streak + 1 : Math.max(0, h.streak - 1) } : h
    ));
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardHome 
            tasks={tasks} 
            toggleTask={toggleTask} 
            habits={habits} 
            toggleHabit={toggleHabit} 
            setCurrentTab={setCurrentTab}
          />
        );
      case 'tasks':
        return (
          <TasksPage 
            tasks={tasks} 
            setTasks={setTasks} 
            toggleTask={toggleTask} 
            deleteTask={deleteTask}
          />
        );
      case 'calendar':
        return <CalendarPage tasks={tasks} />;
      case 'goals':
        return <GoalsPage />;
      case 'habits':
        return <HabitsPage />;
      case 'voice':
        return <VoiceAIPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardHome tasks={tasks} toggleTask={toggleTask} habits={habits} toggleHabit={toggleHabit} setCurrentTab={setCurrentTab} />;
    }
  };

  return (
    <div className="flex bg-black text-white min-h-screen relative overflow-hidden bg-noise">
      <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      
      {/* Main Workspace Frame */}
      <main className="flex-1 h-screen overflow-y-auto px-8 py-6 relative z-10">
        <div className="max-w-6xl mx-auto w-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
