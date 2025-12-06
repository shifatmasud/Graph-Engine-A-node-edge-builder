import React, { memo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeContext';
import {
  SignIn,
  SignOut,
  Cpu,
  Pulse,
  Gear,
  Bug,
  DownloadSimple,
  PencilSimple,
  TrashSimple,
  Check,
  DotsThree,
} from '@phosphor-icons/react';
import { NodeData } from '../../types';

interface IPOSlateProps {
  data: NodeData;
  onUpdate?: (data: Partial<NodeData>) => void;
  onDelete?: () => void;
}

const getNodeIcon = (type: string, color: string) => {
  const style = { width: 14, height: 14, color, opacity: 0.8 };
  switch (type) {
    case 'input': return <SignIn style={style} weight="bold" />;
    case 'output': return <SignOut style={style} weight="bold" />;
    case 'process': return <Cpu style={style} weight="bold" />;
    default: return <Pulse style={style} weight="bold" />;
  }
};

export const IPOSlate = memo(({ data, onUpdate, onDelete }: IPOSlateProps) => {
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [editValues, setEditValues] = useState({ label: data.label, value: data.value });
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) {
        if (inputRef.current) {
            inputRef.current.focus();
        }
        if (textareaRef.current) {
            const ta = textareaRef.current;
            ta.style.height = 'auto'; // Reset height
            ta.style.height = `${ta.scrollHeight}px`; // Set to scroll height
        }
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (onUpdate) {
      onUpdate({
        label: editValues.label,
        value: editValues.value
      });
    }
  };

  const getNodeSpecificActions = () => {
    switch(data.type) {
      case 'input': return [ { label: 'Source Config', icon: <Gear size={12} /> } ];
      case 'process': return [ { label: 'Debug', icon: <Bug size={12} /> } ];
      case 'output': return [ { label: 'Export', icon: <DownloadSimple size={12} /> } ];
      default: return [];
    }
  };

  const styles = {
    wrapper: {
      display: 'flex',
      flexDirection: 'column' as const,
      width: '100%',
    },
    header: {
      padding: '12px 14px 8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '10px',
    },
    titleGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flex: 1,
      overflow: 'hidden',
    },
    headerText: {
      fontSize: '16px',
      fontWeight: 400,
      fontFamily: '"Bebas Neue", cursive',
      color: theme.content[1],
      letterSpacing: '0.05em',
      textTransform: 'uppercase' as const,
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      transform: 'translateY(1px)', 
    },
    body: {
      padding: '0 14px 14px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    },
    valueDisplay: {
      fontSize: '12px',
      fontFamily: '"Victor Mono", monospace',
      color: theme.content[2],
      background: theme.surface[1], // Cutout effect
      padding: '8px 10px',
      borderRadius: theme.radius[2],
      border: '1px solid transparent',
      minHeight: '32px',
      display: 'flex',
      alignItems: 'center',
      whiteSpace: 'pre-wrap' as const,
      wordBreak: 'break-word' as const,
    },
    input: {
      background: theme.surface[1],
      border: `1px solid ${theme.accent.primary}`,
      color: theme.content[1],
      borderRadius: theme.radius[2],
      padding: '7px 9px',
      width: '100%',
      fontSize: '12px',
      fontFamily: '"Victor Mono", monospace',
      outline: 'none',
      resize: 'none' as const,
      overflow: 'hidden',
    },
    headerInput: {
      background: 'transparent',
      border: 'none',
      borderBottom: `1px solid ${theme.accent.primary}`,
      color: theme.content[1],
      width: '100%',
      fontSize: '16px',
      fontFamily: '"Bebas Neue", cursive',
      letterSpacing: '0.05em',
      outline: 'none',
      padding: 0,
    },
    iconBtn: {
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: theme.content[3],
      padding: '4px',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: isHovered || showMenu ? 1 : 0, // Only show on hover for minimal noise
      transition: 'opacity 0.2s, color 0.2s',
    },
    dropdown: {
      position: 'absolute' as const,
      top: '36px',
      right: '8px',
      background: theme.surface[2],
      border: `1px solid ${theme.border}`,
      borderRadius: theme.radius[3],
      padding: '4px',
      minWidth: '120px',
      boxShadow: theme.shadow,
      zIndex: 60,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '2px',
    },
    menuItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '6px 8px',
      border: 'none',
      background: 'transparent',
      color: theme.content[1],
      fontSize: '11px',
      fontFamily: '"Inter", sans-serif',
      cursor: 'pointer',
      borderRadius: theme.radius[1],
      textAlign: 'left' as const,
      width: '100%',
    }
  };

  const iconColor = data.type === 'input' ? theme.accent.primary
                  : data.type === 'output' ? theme.accent.valid 
                  : theme.accent.secondary;

  return (
    <div 
      style={styles.wrapper}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Context Menu Backdrop */}
      {showMenu && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 55 }} 
          onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} 
        />
      )}

      <div style={styles.header}>
        <div style={styles.titleGroup}>
          {getNodeIcon(data.type, iconColor)}
          {isEditing ? (
            <input
              ref={inputRef}
              style={styles.headerInput}
              value={editValues.label}
              onChange={(e) => setEditValues(prev => ({...prev, label: e.target.value}))}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          ) : (
            <span style={styles.headerText} title={data.label}>{data.label}</span>
          )}
        </div>
        
        <button 
          style={styles.iconBtn} 
          onClick={(e) => { e.stopPropagation(); isEditing ? handleSave() : setShowMenu(!showMenu); }}
        >
          {isEditing ? <Check size={14} color={theme.accent.valid} weight="bold" /> : <DotsThree size={18} weight="bold" />}
        </button>

        <AnimatePresence>
          {showMenu && !isEditing && (
            <motion.div
              style={styles.dropdown}
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ duration: 0.1 }}
            >
              {getNodeSpecificActions().map((action, idx) => (
                 <button 
                  key={idx}
                  style={styles.menuItem}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.surface[3]}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}

              <div style={{ height: 1, background: theme.border, margin: '2px 0' }} />

              <button 
                style={styles.menuItem}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  setIsEditing(true);
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.surface[3]}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <PencilSimple size={12} />
                Rename
              </button>
              <button 
                style={{ ...styles.menuItem, color: theme.accent.danger }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDelete?.();
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.surface[3]}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <TrashSimple size={12} color={theme.accent.danger} />
                Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={styles.body}>
        {isEditing ? (
             <textarea
                ref={textareaRef}
                style={styles.input}
                value={editValues.value ?? ''}
                onChange={(e) => {
                    setEditValues(prev => ({...prev, value: e.target.value}));
                    // Auto-resize on change
                    const ta = e.currentTarget;
                    ta.style.height = 'auto';
                    ta.style.height = `${ta.scrollHeight}px`;
                }}
                placeholder="No Data"
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSave();
                    }
                }}
                rows={1}
            />
        ) : (
        <div style={styles.valueDisplay}>
            {(data.value !== undefined && data.value !== '') ? data.value : <span style={{ opacity: 0.3, fontStyle: 'italic' }}>null</span>}
        </div>
        )}
      </div>
    </div>
  );
});