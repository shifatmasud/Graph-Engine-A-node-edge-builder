import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { NodeData } from '../../types';
import { useTheme } from '../Core/ThemeContext';

interface DockProps {
  activeTool: 'select' | 'connect' | 'pan';
  onSelectTool: (tool: 'select' | 'connect' | 'pan') => void;
  onAddNode: (type: NodeData['type']) => void;
  onClear: () => void;
  onResetView: () => void;
  onImport: () => void;
  onExport: () => void;
  onCopyPseudo: () => void;
}

export const Dock: React.FC<DockProps> = ({ 
  activeTool, 
  onSelectTool, 
  onAddNode, 
  onClear, 
  onResetView,
  onImport,
  onExport,
  onCopyPseudo
}) => {
  const [activeMenu, setActiveMenu] = useState<'none' | 'add' | 'settings'>('none');
  const { theme, toggle, mode } = useTheme();

  const styles = {
    dockContainer: {
      position: 'fixed' as const,
      bottom: '32px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: '12px',
    },
    bar: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px',
      borderRadius: '24px',
      background: mode === 'dark' ? 'rgba(9, 9, 11, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(16px)',
      border: `1px solid ${theme.surface[3]}`,
      boxShadow: theme.shadow,
    },
    divider: {
      width: '1px',
      height: '24px',
      background: theme.surface[3],
      margin: '0 4px',
    },
    floatingMenu: {
      position: 'absolute' as const,
      bottom: '100%',
      marginBottom: '12px',
      background: theme.surface[2],
      border: `1px solid ${theme.surface[3]}`,
      borderRadius: '16px',
      padding: '4px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px',
      boxShadow: theme.shadow,
      overflow: 'hidden',
      minWidth: '160px',
    },
  };

  const toggleMenu = (menu: 'add' | 'settings') => {
    setActiveMenu(prev => prev === menu ? 'none' : menu);
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0, x: '-50%' }}
      animate={{ y: 0, opacity: 1, x: '-50%' }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
      style={styles.dockContainer}
    >
      {/* Contextual Menus */}
      <AnimatePresence>
        {activeMenu === 'add' && (
          <motion.div
            style={styles.floatingMenu}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
          >
            <DockMenuItem icon={<Icons.LogIn size={16} color={theme.accent.primary} />} label="Input Node" onClick={() => { onAddNode('input'); setActiveMenu('none'); }} />
            <DockMenuItem icon={<Icons.Cpu size={16} color="#a855f7" />} label="Process Node" onClick={() => { onAddNode('process'); setActiveMenu('none'); }} />
            <DockMenuItem icon={<Icons.LogOut size={16} color={theme.accent.valid} />} label="Output Node" onClick={() => { onAddNode('output'); setActiveMenu('none'); }} />
          </motion.div>
        )}

        {activeMenu === 'settings' && (
          <motion.div
            style={styles.floatingMenu}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
          >
             <DockMenuItem 
              icon={mode === 'dark' ? <Icons.Sun size={16} /> : <Icons.Moon size={16} />} 
              label={mode === 'dark' ? 'Light Mode' : 'Dark Mode'} 
              onClick={() => { toggle(); setActiveMenu('none'); }} 
            />
             <div style={{ height: 1, background: theme.surface[3], margin: '4px 0' }} />
            <DockMenuItem icon={<Icons.Upload size={16} />} label="Import JSON" onClick={() => { onImport(); setActiveMenu('none'); }} />
            <DockMenuItem icon={<Icons.Download size={16} />} label="Export JSON" onClick={() => { onExport(); setActiveMenu('none'); }} />
            <DockMenuItem icon={<Icons.Code size={16} />} label="Copy Pseudo Code" onClick={() => { onCopyPseudo(); setActiveMenu('none'); }} />
             <div style={{ height: 1, background: theme.surface[3], margin: '4px 0' }} />
             <DockMenuItem icon={<Icons.Focus size={16} />} label="Center View" onClick={() => { onResetView(); setActiveMenu('none'); }} />
             <DockMenuItem icon={<Icons.Trash2 size={16} color={theme.accent.danger} />} label="Clear All" onClick={() => { onClear(); setActiveMenu('none'); }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Bar */}
      <div style={styles.bar}>
        <DockButton 
          icon={<Icons.MousePointer2 size={18} />} 
          isActive={activeTool === 'select'}
          onClick={() => onSelectTool('select')}
          label="Select"
        />
        <DockButton 
          icon={<Icons.Hand size={18} />} 
          isActive={activeTool === 'pan'}
          onClick={() => onSelectTool('pan')}
          label="Pan"
        />
        <DockButton 
          icon={<Icons.Cable size={18} />} 
          isActive={activeTool === 'connect'}
          onClick={() => onSelectTool('connect')}
          label="Connect"
          activeColor={theme.accent.primary}
        />
        
        <div style={styles.divider} />
        
        <DockButton 
          icon={<Icons.Plus size={20} />} 
          isActive={activeMenu === 'add'}
          onClick={() => toggleMenu('add')}
          label="Add"
        />
        <DockButton 
          icon={<Icons.Settings2 size={20} />} 
          isActive={activeMenu === 'settings'}
          onClick={() => toggleMenu('settings')}
          label="Settings"
        />
      </div>
    </motion.div>
  );
};

const DockButton = ({ 
  icon, 
  onClick, 
  isActive = false,
  label,
  activeColor
}: { 
  icon: React.ReactNode; 
  onClick: () => void; 
  isActive?: boolean;
  label: string;
  activeColor?: string;
}) => {
  const { theme } = useTheme();
  
  const style = {
    button: {
      position: 'relative' as const,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '44px',
      height: '44px',
      borderRadius: '16px',
      border: 'none',
      background: isActive ? theme.surface[3] : 'transparent',
      color: isActive ? (activeColor || theme.content[1]) : theme.content[2],
      cursor: 'pointer',
      transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      outline: 'none',
    },
    indicator: {
      position: 'absolute' as const,
      bottom: '6px',
      width: '4px',
      height: '4px',
      borderRadius: '50%',
      backgroundColor: activeColor || theme.accent.primary,
    }
  };

  return (
    <motion.button
      style={style.button}
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      whileHover={{ backgroundColor: isActive ? theme.surface[3] : theme.surface[2] }}
      aria-label={label}
    >
      {icon}
      {isActive && activeColor && <div style={style.indicator} />}
    </motion.button>
  );
};

const DockMenuItem = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => {
    const { theme } = useTheme();
  const style = {
    item: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 12px',
      borderRadius: '8px',
      border: 'none',
      background: 'transparent',
      color: theme.content[1],
      fontSize: '14px',
      fontFamily: '"Inter", sans-serif',
      cursor: 'pointer',
      width: '100%',
      textAlign: 'left' as const,
    }
  };

  return (
    <motion.button
      style={style.item}
      onClick={onClick}
      whileHover={{ backgroundColor: theme.surface[3] }}
      whileTap={{ scale: 0.98 }}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  );
};