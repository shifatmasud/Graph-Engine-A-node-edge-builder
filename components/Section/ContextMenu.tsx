import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SignIn,
  Cpu,
  SignOut,
  Code,
  Target,
  TrashSimple,
  MouseSimple,
  Hand,
  FlowArrow,
  UploadSimple,
  DownloadSimple,
} from '@phosphor-icons/react';
import { Position } from '../../types';
import { useTheme } from '../Core/ThemeContext';

interface ContextMenuProps {
  position: Position | null;
  onClose: () => void;
  onAction: (action: string, payload?: any) => void;
}

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
          opacity: 0.1,
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 100 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      />
    )}
  </AnimatePresence>
);

const MenuItem: React.FC<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    color?: string;
}> = ({ label, icon, onClick, color }) => {
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
        overflow: 'hidden' as const,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        padding: '8px 12px',
        border: 'none',
        background: 'transparent',
        color: color || theme.content[1],
        fontSize: '13px',
        fontFamily: '"Inter", sans-serif',
        cursor: 'pointer',
        textAlign: 'left' as const,
        borderRadius: '6px',
        transition: 'color 0.2s',
      },
    };

    return (
        <motion.button
            ref={ref}
            style={style.item}
            onClick={onClick}
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={() => setIsHovered(false)}
            onPointerMove={handlePointerMove}
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


export const ContextMenu: React.FC<ContextMenuProps> = ({ position, onClose, onAction }) => {
  const { theme } = useTheme();

  if (!position) return null;

  const styles = {
    menu: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      x: position.x,
      y: position.y,
      minWidth: '180px',
      background: `rgba(${parseInt(theme.surface[2].slice(1,3), 16)}, ${parseInt(theme.surface[2].slice(3,5), 16)}, ${parseInt(theme.surface[2].slice(5,7), 16)}, 0.8)`,
      backdropFilter: 'blur(12px)',
      borderRadius: '12px',
      border: `1px solid ${theme.border}`,
      boxShadow: theme.shadow,
      padding: '4px',
      zIndex: 100,
      overflow: 'hidden',
    },
    separator: {
      height: '1px',
      background: theme.border,
      margin: '4px 0',
      width: '100%',
    },
  };

  const menuItems = [
    { label: 'Add Input Node', icon: <SignIn size={14} color={theme.accent.primary} />, action: 'add_node', payload: 'input' },
    { label: 'Add Process Node', icon: <Cpu size={14} color={theme.accent.secondary} />, action: 'add_node', payload: 'process' },
    { label: 'Add Output Node', icon: <SignOut size={14} color={theme.accent.valid} />, action: 'add_node', payload: 'output' },
    { separator: true },
    { label: 'Select', icon: <MouseSimple size={14} color={theme.content[1]} />, action: 'select_tool', payload: 'select' },
    { label: 'Connect', icon: <FlowArrow size={14} color={theme.content[1]} />, action: 'select_tool', payload: 'connect' },
    { label: 'Pan', icon: <Hand size={14} color={theme.content[1]} />, action: 'select_tool', payload: 'pan' },
    { separator: true },
    { label: 'Import Project...', icon: <UploadSimple size={14} color={theme.content[1]} />, action: 'import' },
    { label: 'Export Project...', icon: <DownloadSimple size={14} color={theme.content[1]} />, action: 'export' },
    { separator: true },
    { label: 'Copy Pseudo Code', icon: <Code size={14} color={theme.content[1]} />, action: 'copy_pseudo' },
    { label: 'Reset View', icon: <Target size={14} color={theme.content[1]} />, action: 'reset_view' },
    { label: 'Clear Canvas', icon: <TrashSimple size={14} color={theme.accent.danger} />, action: 'clear_canvas' },
  ];

  return (
    <AnimatePresence>
      {position && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 99 }} 
            onClick={onClose}
            onContextMenu={(e) => { e.preventDefault(); onClose(); }} 
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={styles.menu}
            onClick={(e) => e.stopPropagation()}
          >
            {menuItems.map((item, i) => (
              item.separator ? (
                <div key={`sep-${i}`} style={styles.separator} />
              ) : (
                <MenuItem
                  key={item.label}
                  label={item.label}
                  icon={item.icon}
                  color={item.action === 'clear_canvas' ? theme.accent.danger : theme.content[1]}
                  onClick={() => {
                    onAction(item.action as string, item.payload);
                    onClose();
                  }}
                />
              )
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};