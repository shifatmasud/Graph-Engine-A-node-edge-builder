import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { NodeData, Position } from '../../types';

interface ContextMenuProps {
  position: Position | null;
  onClose: () => void;
  onAction: (action: string, payload?: any) => void;
}

const theme = {
  surface: '#18181b',
  border: '#27272a',
  text: '#fafafa',
  hover: '#27272a',
  accent: '#3b82f6',
};

export const ContextMenu: React.FC<ContextMenuProps> = ({ position, onClose, onAction }) => {
  if (!position) return null;

  const styles = {
    menu: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      x: position.x,
      y: position.y,
      minWidth: '180px',
      background: 'rgba(24, 24, 27, 0.8)', // Surface 2 + opacity
      backdropFilter: 'blur(12px)',
      borderRadius: '12px',
      border: `1px solid ${theme.border}`,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
      padding: '4px',
      zIndex: 100,
      overflow: 'hidden',
    },
    item: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      width: '100%',
      padding: '8px 12px',
      border: 'none',
      background: 'transparent',
      color: theme.text,
      fontSize: '13px',
      fontFamily: '"Inter", sans-serif',
      cursor: 'pointer',
      textAlign: 'left' as const,
      borderRadius: '6px',
      transition: 'background 0.2s',
    },
    separator: {
      height: '1px',
      background: theme.border,
      margin: '4px 0',
      width: '100%',
    },
    shortcut: {
      marginLeft: 'auto',
      color: '#a1a1aa',
      fontSize: '10px',
      fontFamily: '"Victor Mono", monospace',
    }
  };

  const menuItems = [
    { label: 'Add Input Node', icon: <Icons.LogIn size={14} color="#3b82f6" />, action: 'add_node', payload: 'input' },
    { label: 'Add Process Node', icon: <Icons.Cpu size={14} color="#a855f7" />, action: 'add_node', payload: 'process' },
    { label: 'Add Output Node', icon: <Icons.LogOut size={14} color="#22c55e" />, action: 'add_node', payload: 'output' },
    { separator: true },
    { label: 'Copy Pseudo Code', icon: <Icons.Code size={14} />, action: 'copy_pseudo' },
    { label: 'Reset View', icon: <Icons.Focus size={14} />, action: 'reset_view' },
    { label: 'Clear Canvas', icon: <Icons.Trash2 size={14} color="#ef4444" />, action: 'clear_canvas' },
  ];

  return (
    <AnimatePresence>
      {position && (
        <>
          {/* Backdrop to close */}
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
                <motion.button
                  key={item.label}
                  style={styles.item}
                  whileHover={{ backgroundColor: theme.hover }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    onAction(item.action as string, item.payload);
                    onClose();
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </motion.button>
              )
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};