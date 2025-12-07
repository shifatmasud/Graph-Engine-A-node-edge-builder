// FIX: Corrected the import of useState and useRef from 'react'. The hook 'useRef' was incorrectly quoted as a string.
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// FIX: Switched to namespace import for @phosphor-icons/react to resolve module export errors.
import * as Icon from '@phosphor-icons/react';
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
  onGenerateGraph: () => void;
}

// --- Internal Components ---

const Separator = () => {
  const { theme } = useTheme();
  return (
    <div style={{ 
      width: '1px', 
      height: '24px', 
      backgroundColor: theme.border, 
      margin: '0 4px',
      opacity: 0.5
    }} />
  );
};

const DockButton = ({ 
  icon, 
  onClick, 
  isActive = false, 
  activeColor 
}: { 
  icon: React.ReactNode; 
  onClick: () => void; 
  isActive?: boolean;
  activeColor?: string;
}) => {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  
  // State layer logic
  const [ripplePos, setRipplePos] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLButtonElement>(null);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setRipplePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const finalColor = isActive ? (activeColor || theme.accent.primary) : theme.content[2];
  const bg = isActive ? `${activeColor || theme.accent.primary}20` : 'transparent';

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onPointerMove={handlePointerMove}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '44px',
        height: '44px',
        borderRadius: theme.radius.round, // Make buttons circular
        border: 'none',
        background: bg,
        color: finalColor,
        cursor: 'pointer',
        overflow: 'hidden',
        outline: 'none',
      }}
      whileTap={{ scale: 0.92 }}
    >
      <div style={{ position: 'relative', zIndex: 2 }}>{icon}</div>
      
      {/* State Layer Ripple */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            style={{
              position: 'absolute',
              top: ripplePos.y,
              left: ripplePos.x,
              width: '1px',
              height: '1px',
              borderRadius: '50%',
              backgroundColor: isActive ? finalColor : theme.content[1],
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
            initial={{ scale: 0, opacity: 0.1 }}
            animate={{ scale: 80, opacity: 0.1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
};

const MenuAction = ({ 
  icon, 
  label, 
  onClick, 
  danger = false 
}: { 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void; 
  danger?: boolean 
}) => {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
        padding: '10px 12px',
        border: 'none',
        background: isHovered ? theme.surface[3] : 'transparent',
        color: danger ? theme.accent.danger : theme.content[1],
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '13px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        transition: 'background 0.2s',
        textAlign: 'left',
      }}
      whileTap={{ scale: 0.98 }}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  );
};

const AddNodeMenu = ({ onAdd, onGenerate }: { onAdd: (t: NodeData['type']) => void; onGenerate: () => void; }) => {
  const { theme } = useTheme();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <MenuAction icon={<Icon.SignIn size={16} weight="duotone" color={theme.accent.primary} />} label="Input Node" onClick={() => onAdd('input')} />
      <MenuAction icon={<Icon.Cpu size={16} weight="duotone" color={theme.accent.secondary} />} label="Process Node" onClick={() => onAdd('process')} />
      <MenuAction icon={<Icon.SignOut size={16} weight="duotone" color={theme.accent.valid} />} label="Output Node" onClick={() => onAdd('output')} />
      <MenuAction icon={<Icon.FileImage size={16} weight="duotone" color={theme.content[2]} />} label="Embed Node" onClick={() => onAdd('embed')} />
      <div style={{ height: '1px', background: theme.border, margin: '4px 0' }} />
      <MenuAction icon={<Icon.Sparkle size={16} weight="duotone" color={theme.accent.secondary} />} label="Generate with AI" onClick={onGenerate} />
    </div>
  );
};

// --- Main Component ---

export const Dock: React.FC<DockProps> = (props) => {
  const { theme, mode, toggle } = useTheme();
  const [activeMenu, setActiveMenu] = useState<'settings' | 'add' | null>(null);

  const toggleMenu = (menu: 'settings' | 'add') => {
    setActiveMenu(prev => prev === menu ? null : menu);
  };

  const closeMenu = () => setActiveMenu(null);

  // Execute an action and close the menu
  const exec = (fn: () => void) => {
    fn();
    closeMenu();
  };

  const styles = {
    dockWrapper: {
      position: 'fixed' as const,
      bottom: '32px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: '12px',
    },
    bar: {
      display: 'flex',
      alignItems: 'center',
      padding: '6px 8px',
      background: theme.surface[2], // Use theme token
      borderRadius: theme.radius.round, // Full pill shape
      border: `1px solid ${theme.border}`,
      boxShadow: theme.shadow,
      gap: '2px',
    },
    popup: {
      position: 'absolute' as const,
      bottom: '60px',
      right: activeMenu === 'settings' ? 0 : '48px',
      width: '220px',
      background: theme.surface[2], // Use theme token
      border: `1px solid ${theme.border}`,
      borderRadius: '16px',
      padding: '6px',
      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
      overflow: 'hidden',
    },
    menuHeader: {
      padding: '8px 12px',
      fontSize: '12px',
      fontWeight: 600,
      color: theme.content[3],
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
    }
  };

  return (
    <div style={styles.dockWrapper}>
      <AnimatePresence>
        {activeMenu && (
          <>
            {/* Backdrop to close */}
            <div 
              style={{ position: 'fixed', inset: 0, zIndex: -1 }} 
              onClick={closeMenu}
            />
            
            <motion.div
              style={styles.popup}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              {activeMenu === 'settings' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <MenuAction 
                    icon={mode === 'light' ? <Icon.Moon size={16} /> : <Icon.Sun size={16} />} 
                    label={mode === 'light' ? "Dark Mode" : "Light Mode"} 
                    onClick={() => exec(toggle)} 
                  />
                  
                  <div style={{ height: '1px', background: theme.border, margin: '4px 0' }} />
                  
                  <MenuAction icon={<Icon.UploadSimple size={16} />} label="Import JSON" onClick={() => exec(props.onImport)} />
                  <MenuAction icon={<Icon.DownloadSimple size={16} />} label="Export JSON" onClick={() => exec(props.onExport)} />
                  <MenuAction icon={<Icon.Code size={16} />} label="Copy Pseudo Code" onClick={() => exec(props.onCopyPseudo)} />
                  
                  <div style={{ height: '1px', background: theme.border, margin: '4px 0' }} />
                  
                  <MenuAction icon={<Icon.CornersOut size={16} />} label="Center View" onClick={() => exec(props.onResetView)} />
                  <MenuAction icon={<Icon.Trash size={16} weight="bold" />} label="Clear All" danger onClick={() => exec(props.onClear)} />
                </div>
              ) : (
                <AddNodeMenu 
                  onAdd={(t) => exec(() => props.onAddNode(t))} 
                  onGenerate={() => exec(props.onGenerateGraph)}
                />
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div 
        style={styles.bar}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <DockButton 
          icon={<Icon.Cursor size={20} weight={props.activeTool === 'select' ? 'fill' : 'regular'} />} 
          onClick={() => props.onSelectTool('select')} 
          isActive={props.activeTool === 'select'} 
        />
        <DockButton 
          icon={<Icon.Hand size={20} weight={props.activeTool === 'pan' ? 'fill' : 'regular'} />} 
          onClick={() => props.onSelectTool('pan')} 
          isActive={props.activeTool === 'pan'} 
        />
        <DockButton 
          icon={<Icon.Plugs size={20} weight={props.activeTool === 'connect' ? 'fill' : 'regular'} />} 
          onClick={() => props.onSelectTool('connect')} 
          isActive={props.activeTool === 'connect'} 
        />
        
        <Separator />
        
        <DockButton 
          icon={<Icon.Plus size={20} weight="bold" />} 
          onClick={() => toggleMenu('add')} 
          isActive={activeMenu === 'add'}
          activeColor={theme.content[1]}
        />
        <DockButton 
          icon={<Icon.Faders size={20} weight="regular" />} 
          onClick={() => toggleMenu('settings')} 
          isActive={activeMenu === 'settings'}
          activeColor={theme.content[1]}
        />
      </motion.div>
    </div>
  );
};
