import React, { useState, useEffect } from 'react';
import ProfilePage from './pages/ProfilePage.jsx';
import DocumentsPage from './pages/DocumentsPage.jsx';
import PreferencesPage from './pages/PreferencesPage.jsx';
import MappingsPage from './pages/MappingsPage.jsx';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { User, FileText, Settings, Brain, Zap } from "lucide-react";

const NAV_ITEMS = [
  { id: 'profile',     icon: User, label: 'Profile' },
  { id: 'documents',  icon: FileText, label: 'Documents' },
  { id: 'preferences',icon: Settings, label: 'Preferences' },
  { id: 'mappings',   icon: Brain, label: 'Learned Mappings' },
];

const PAGE_COMPONENTS = {
  profile:     ProfilePage,
  documents:   DocumentsPage,
  preferences: PreferencesPage,
  mappings:    MappingsPage,
};

export default function Options() {
  const [activePage, setActivePage] = useState('profile');

  // Read initial tab from URL hash
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && NAV_ITEMS.find(n => n.id === hash)) {
      setActivePage(hash);
    }
  }, []);

  const ActiveComponent = PAGE_COMPONENTS[activePage] || ProfilePage;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
        <Sidebar className="border-r border-border">
          <SidebarHeader className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-orange-600 rounded-lg flex items-center justify-center text-primary-foreground shadow-md">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">AI Form Autofill</span>
                <span className="text-xs text-muted-foreground">v1.0.0</span>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2">Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV_ITEMS.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton 
                        isActive={activePage === item.id}
                        onClick={() => setActivePage(item.id)}
                        className={`transition-colors py-5 ${activePage === item.id ? 'bg-primary/20 text-primary hover:bg-primary/30 hover:text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                      >
                        <item.icon className="w-5 h-5 mr-2" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">Data stored securely & locally</p>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-auto bg-background relative">
          <ActiveComponent />
        </main>
      </div>
    </SidebarProvider>
  );
}
