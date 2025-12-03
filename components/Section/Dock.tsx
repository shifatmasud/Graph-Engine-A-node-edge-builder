
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { NodeData } from '../../types';

interface DockProps {
  activeTool: 'select' | 'connect' | 'pan';
  onSelectTool: (tool: 'select' | 'connect' | 'pan') => void;
  onAddNode: (type: NodeData['type']) => void;
  onClear: () => void;
  onResetView: () => void;
}

const theme = {
  surface1: '#09090b',
  surface2: '#18181b',
  surface3: '#27272a',
  content1: '#fafafa',
  content2: '#a1a1aa',
  accent: '#3b82f6',
  danger: '#ef4444',
  shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
};

export const Dock: React.FC<DockProps> = ({ 
  activeTool, 
  onSelectTool, 
  onAddNode, 
  onClear, 
  onResetView 
}) => {
  const [activeMenu, setActiveMenu] = useState<'none' | 'add' | 'more'>('none');

  const styles = {
    dockContainer: {
      position: 'fixed' as const,
      bottom: '32px',
      left: '50%',
      transform: 'translateX(-50%)', // Handled by motion initial/animate, but good fallback
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
      background: 'rgba(9, 9, 11, 0.8)', // Surface 1 transparent
      backdropFilter: 'blur(16px)',
      border: `1px solid ${theme.surface3}`,
      boxShadow: theme.shadow,
    },
    divider: {
      width: '1px',
      height: '24px',
      background: theme.surface3,
      margin: '0 4px',
    },
    floatingMenu: {
      position: 'absolute' as const,
      bottom: '100%',
      marginBottom: '12px',
      background: theme.surface2,
      border: `1px solid ${theme.surface3}`,
      borderRadius: '16px',
      padding: '4px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px',
      boxShadow: theme.shadow,
      overflow: 'hidden',
      minWidth: '140px',
    },
    menuItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      borderRadius: '8px',
      color: theme.content1,
      fontSize: '13px',
      cursor: 'pointer',
      border: 'none',
      background: 'transparent',
      width: '100%',
      textAlign: 'left' as const,
    }
  };

  const toggleMenu = (menu: 'add' | 'more') => {
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
            <DockMenuItem icon={<Icons.BoxSelect size={16} color="#3b82f6" />} label="Input Node" onClick={() => { onAddNode('input'); setActiveMenu('none'); }} />
            <DockMenuItem icon={<Icons.Cpu size={16} color="#a855f7" />} label="Process Node" onClick={() => { onAddNode('process'); setActiveMenu('none'); }} />
            <DockMenuItem icon={<Icons.HardDrive size={16} color="#22c55e" />} label="Output Node" onClick={() => { onAddNode('output'); setActiveMenu('none'); }} />
          </motion.div>
        )}

        {activeMenu === 'more' && (
          <motion.div
            style={styles.floatingMenu}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
          >
            <DockMenuItem icon={<Icons.Focus size={16} />} label="Center View" onClick={() => { onResetView(); setActiveMenu('none'); }} />
            <DockMenuItem icon={<Icons.Trash2 size={16} color="#ef4444" />} label="Clear All" onClick={() => { onClear(); setActiveMenu('none'); }} />
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
          activeColor={theme.accent}
        />
        
        <div style={styles.divider} />
        
        <DockButton 
          icon={<Icons.Plus size={20} />} 
          isActive={activeMenu === 'add'}
          onClick={() => toggleMenu('add')}
          label="Add"
        />
        <DockButton 
          icon={<Icons.MoreVertical size={20} />} 
          isActive={activeMenu === 'more'}
          onClick={() => toggleMenu('more')}
          label="More"
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
      background: isActive ? theme.surface3 : 'transparent',
      color: isActive ? (activeColor || theme.content1) : theme.content2,
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
      backgroundColor: activeColor || theme.accent,
    }
  };

  return (
    <motion.button
      style={style.button}
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      whileHover={{ backgroundColor: isActive ? theme.surface3 : 'rgba(39, 39, 42, 0.5)' }}
      aria-label={label}
    >
      {icon}
      {isActive && activeColor && <div style={style.indicator} />}
    </motion.button>
  );
};

const DockMenuItem = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => {
  const style = {
    item: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 12px',
      borderRadius: '8px',
      border: 'none',
      background: 'transparent',
      color: theme.content1,
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
      whileHover={{ backgroundColor: theme.surface3 }}
      whileTap={{ scale: 0.98 }}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  );
};
