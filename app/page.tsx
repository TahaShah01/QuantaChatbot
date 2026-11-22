'use client';

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { ChatProvider, useChat } from '@/app/providers/ChatProvider';
import Sidebar from '@/app/components/Sidebar';
import ChatArea from '@/app/components/ChatArea';
import SettingsModal from '@/app/components/SettingsModal';

function MainApp() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { newChat } = useChat();

  // On small mobile screens, default sidebar to closed
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + K -> New Chat
      if (isCmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        newChat();
      }

      // Cmd/Ctrl + B -> Toggle Sidebar
      if (isCmdOrCtrl && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }

      // Cmd/Ctrl + , -> Settings
      if (isCmdOrCtrl && e.key === ',') {
        e.preventDefault();
        setSettingsOpen(true);
      }

      // Escape -> Close Settings
      if (e.key === 'Escape') {
        setSettingsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [newChat]);

  return (
    <div className="flex h-full w-full bg-background text-foreground font-sans overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenSettings={() => {
          setSettingsOpen(true);
          if (window.innerWidth < 1024) setSidebarOpen(false);
        }}
      />
      <ChatArea
        isSidebarOpen={sidebarOpen}
        onOpenSidebar={() => setSidebarOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <ChatProvider>
        <MainApp />
      </ChatProvider>
    </ThemeProvider>
  );
}
