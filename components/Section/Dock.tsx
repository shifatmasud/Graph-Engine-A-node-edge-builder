import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MouseSimple,
  Hand,
  FlowArrow,
  Plus,
  GearSix,
  SignIn,
  Cpu,
  SignOut,
  Sun,
  Moon,
  UploadSimple,
  DownloadSimple,
  Code,
  Target,
  TrashSimple,
  ArrowLeft
} from '@phosphor-icons/react';
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

// Sub-components with State Layer Interaction
const StateLayer = ({ isHovered, color, ripplePos }: { isHovered: boolean, color: string, ripplePos: {x: number, y: number} }) => (
  <AnimatePresence>
    {isHovered && (
      <motion.div
        style={{
          position: 'absolute',
          top: ripplePos.y,
          left: ripplePos.x,
          width: '1px',
          height: '1px',
          backgroundColor: color,
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          opacity: 0.15,
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 100 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      />
    )}
  </AnimatePresence>
);

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
  const [isHovered, setIsHovered] = useState(false);
  const [ripplePos, setRipplePos] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLButtonElement>(null);

  const finalActiveColor = activeColor || theme.accent.primary;
  
  const handlePointerMove = (e: React.PointerEvent) => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setRipplePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const style = {
    button: {
      position: 'relative' as const,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '44px',
      height: '44px',
      borderRadius: '12px',
      border: 'none',
      background: isActive ? `${finalActiveColor}33` : 'transparent',
      color: isActive ? finalActiveColor : theme.content[2],
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      outline: 'none',
      overflow: 'hidden',
    },
  };

  return (
    <motion.button
      ref={ref}
      style={style.button}
      onClick={onClick}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onPointerMove={handlePointerMove}
      whileHover={{ scale: 1.05, color: isActive ? finalActiveColor : theme.content[1] }}
      whileTap={{ scale: 0.95 }}
      aria-label={label}
    >
      <StateLayer isHovered={isHovered} color={finalActiveColor} ripplePos={ripplePos} />
      <div style={{ zIndex: 1 }}>{icon}</div>
    </motion.button>
  );
};

const PanelItem = ({ icon, label, onClick, color }: { icon: React.ReactNode, label: string, onClick: () => void, color?: string }) => {
    const { theme } = useTheme();
    const [isHovered, setIsHovered] = useState(false);
    const [ripplePos, setRipplePos] = useState({ x: 0, y: 0 });
    const ref = useRef<HTMLButtonElement>(null);
    
    const handlePointerMove = (e: React.PointerEvent) => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setRipplePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }
    };
    
  const style = {
    item: {
      position: 'relative' as const,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '0 12px',
      height: '36px',
      borderRadius: '10px',
      border: 'none',
      background: 'transparent',
      color: color || theme.content[2],
      fontSize: '13px',
      fontWeight: 500,
      fontFamily: '"Inter", sans-serif',
      cursor: 'pointer',
      textAlign: 'left' as const,
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
    }
  };

  return (
    <motion.button
      ref={ref}
      style={style.item}
      onClick={onClick}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onPointerMove={handlePointerMove}
      whileHover={{ color: color || theme.content[1] }}
      whileTap={{ scale: 0.98 }}
    >
      <StateLayer isHovered={isHovered} color={theme.content[1]} ripplePos={ripplePos} />
      <div style={{ zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {icon}
          <span>{label}</span>
      </div>
    </motion.button>
  );
};

// Main Dock Component
export const Dock: React.FC<DockProps> = (props) => {
  const { activeTool, onSelectTool, onAddNode, onClear, onResetView, onImport, onExport, onCopyPseudo } = props;
  const [view, setView] = useState<'main' | 'add' | 'settings'>('main');
  const { theme, toggle, mode } = useTheme();

  const styles = {
    dockContainer: {
      position: 'fixed' as const,
      bottom: theme.space[6],
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
    },
    bar: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.space[1],
      padding: '6px',
      borderRadius: theme.radius.round,
      background: theme.mode === 'dark' 
        ? 'rgba(29, 29, 29, 0.6)'
        : 'rgba(255, 255, 255, 0.6)',
      backdropFilter: 'blur(12px) saturate(180%)',
      border: `1px solid ${theme.border}`,
      boxShadow: theme.shadow,
    },
    divider: {
      width: '1px',
      height: '24px',
      background: theme.border,
      margin: `0 4px`,
    },
    panelContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    }
  };

  const panelTransition = { duration: 0.2, type: 'spring', stiffness: 400, damping: 25 };

  const handleAddNode = (type: NodeData['type']) => {
    onAddNode(type);
    setView('main');
  };

  const handleSettingsAction = (action: () => void) => {
    action();
    setView('main');
  };

  const renderPanel = () => {
    switch (view) {
      case 'add':
        return (
          <motion.div
            key="add"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={panelTransition}
            style={styles.panelContainer}
          >
            <DockButton icon={<ArrowLeft size={20} />} onClick={() => setView('main')} label="Back" />
            <div style={styles.divider} />
            <PanelItem icon={<SignIn size={16} color={theme.accent.primary} />} label="Input" onClick={() => handleAddNode('input')} />
            <PanelItem icon={<Cpu size={16} color={theme.accent.secondary} />} label="Process" onClick={() => handleAddNode('process')} />
            <PanelItem icon={<SignOut size={16} color={theme.accent.valid} />} label="Output" onClick={() => handleAddNode('output')} />
          </motion.div>
        );
      case 'settings':
        return (
          <motion.div
            key="settings"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={panelTransition}
            style={{...styles.panelContainer, gap: '2px'}}
          >
            <DockButton icon={<ArrowLeft size={20} />} onClick={() => setView('main')} label="Back" />
            <div style={styles.divider} />
            <PanelItem icon={mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />} label={mode === 'dark' ? 'Light' : 'Dark'} onClick={() => handleSettingsAction(toggle)} />
            <PanelItem icon={<UploadSimple size={16} />} label="Import" onClick={() => handleSettingsAction(onImport)} />
            <PanelItem icon={<DownloadSimple size={16} />} label="Export" onClick={() => handleSettingsAction(onExport)} />
            <PanelItem icon={<Code size={16} />} label="Pseudo" onClick={() => handleSettingsAction(onCopyPseudo)} />
            <div style={styles.divider} />
            <PanelItem icon={<Target size={16} />} label="Center" onClick={() => handleSettingsAction(onResetView)} />
            <PanelItem icon={<TrashSimple size={16} />} label="Clear" onClick={() => handleSettingsAction(onClear)} color={theme.accent.danger} />
          </motion.div>
        );
      case 'main':
      default:
        return (
          <motion.div
            key="main"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={panelTransition}
            style={styles.panelContainer}
          >
            <DockButton icon={<MouseSimple size={20} weight={activeTool === 'select' ? "bold" : "regular"} />} isActive={activeTool === 'select'} onClick={() => onSelectTool('select')} label="Select" />
            <DockButton icon={<Hand size={20} weight={activeTool === 'pan' ? "bold" : "regular"} />} isActive={activeTool === 'pan'} onClick={() => onSelectTool('pan')} label="Pan" />
            <DockButton icon={<FlowArrow size={20} weight={activeTool === 'connect' ? "bold" : "regular"} />} isActive={activeTool === 'connect'} onClick={() => onSelectTool('connect')} label="Connect" activeColor={theme.accent.primary} />
            <div style={styles.divider} />
            <DockButton icon={<Plus size={20} />} onClick={() => setView('add')} label="Add Node" />
            <DockButton icon={<GearSix size={20} />} onClick={() => setView('settings')} label="Settings" />
          </motion.div>
        );
    }
  };

  return (
    <motion.div
      initial={{ y: 50, opacity: 0, x: '-50%' }}
      animate={{ y: 0, opacity: 1, x: '-50%' }}
      transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 25 }}
      style={styles.dockContainer}
    >
      <motion.div 
        style={styles.bar} 
        layout={{ duration: 0.3, type: 'spring', stiffness: 400, damping: 30 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {renderPanel()}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
