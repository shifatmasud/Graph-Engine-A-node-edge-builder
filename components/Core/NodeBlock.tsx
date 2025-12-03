import React, { memo, useState, useRef, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NodeData } from '../../types';
import { useTheme } from './ThemeContext';

interface IPOSlateProps {
  data: NodeData;
  onUpdate?: (data: Partial<NodeData>) => void;
  onDelete?: () => void;
}

const getNodeIcon = (type: string, color: string) => {
  const style = { width: 16, height: 16, color };
  switch (type) {
    case 'input': return <Icons.LogIn style={style} />;
    case 'output': return <Icons.LogOut style={style} />;
    case 'process': return <Icons.Cpu style={style} />;
    default: return <Icons.Activity style={style} />;
  }
};

export const IPOSlate = memo(({ data, onUpdate, onDelete }: IPOSlateProps) => {
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editValues, setEditValues] = useState({ label: data.label, value: data.value });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
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
      case 'input':
        return [
          { label: 'Configure Source', icon: <Icons.Settings size={12} /> },
          { label: 'Toggle Stream', icon: <Icons.Activity size={12} /> }
        ];
      case 'process':
        return [
          { label: 'Debug Mode', icon: <Icons.Bug size={12} /> },
          { label: 'View Logs', icon: <Icons.FileText size={12} /> }
        ];
      case 'output':
        return [
          { label: 'Export Data', icon: <Icons.Download size={12} /> },
          { label: 'Format Settings', icon: <Icons.Sliders size={12} /> }
        ];
      default:
        return [];
    }
  };

  const styles = {
    wrapper: {
      display: 'flex',
      flexDirection: 'column' as const,
      width: '100%',
      padding: '0', 
    },
    header: {
      padding: '12px 16px',
      borderBottom: `1px solid ${theme.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      background: theme.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
      borderTopLeftRadius: '12px',
      borderTopRightRadius: '12px',
      position: 'relative' as const,
    },
    titleGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flex: 1,
    },
    headerText: {
      fontSize: '14px',
      fontWeight: 400,
      fontFamily: '"Bebas Neue", cursive',
      color: theme.content[1],
      letterSpacing: '0.05em',
      transform: 'translateY(1px)',
    },
    body: {
      padding: '16px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
      minHeight: '60px',
    },
    label: {
      fontSize: '12px',
      fontFamily: '"Inter", sans-serif',
      color: theme.content[2],
      lineHeight: '1.4',
    },
    typeTag: {
      fontSize: '10px',
      fontFamily: '"Victor Mono", monospace',
      color: theme.content[3],
      textTransform: 'uppercase' as const,
      alignSelf: 'flex-start',
    },
    input: {
      background: 'transparent',
      border: `1px solid ${theme.accent.primary}`,
      color: theme.content[1],
      borderRadius: '4px',
      padding: '2px 4px',
      width: '100%',
      fontSize: '12px',
      fontFamily: 'inherit',
      outline: 'none',
    },
    headerInput: {
      background: 'transparent',
      border: 'none',
      borderBottom: `1px solid ${theme.accent.primary}`,
      color: theme.content[1],
      width: '100%',
      fontSize: '14px',
      fontFamily: '"Bebas Neue", cursive',
      letterSpacing: '0.05em',
      outline: 'none',
    },
    iconBtn: {
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: theme.content[3],
      padding: 4,
      borderRadius: 4,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    dropdown: {
      position: 'absolute' as const,
      top: 'calc(100% - 8px)',
      right: '8px',
      background: theme.surface[2],
      border: `1px solid ${theme.border}`,
      borderRadius: '8px',
      padding: '4px',
      minWidth: '140px',
      boxShadow: theme.shadow,
      zIndex: 50,
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
      fontSize: '12px',
      fontFamily: '"Inter", sans-serif',
      cursor: 'pointer',
      borderRadius: '4px',
      textAlign: 'left' as const,
      width: '100%',
    },
    separator: {
      height: '1px',
      background: theme.border,
      margin: '2px 0',
      width: '100%'
    }
  };

  const iconColor = data.type === 'input' ? theme.accent.primary 
                  : data.type === 'output' ? theme.accent.valid 
                  : '#a855f7'; // Purple for process

  return (
    <div style={styles.wrapper}>
      {/* Context Menu Backdrop */}
      {showMenu && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 40 }} 
          onClick={() => setShowMenu(false)} 
        />
      )}

      <div style={styles.header} onDoubleClick={() => setIsEditing(true)}>
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
            <span style={styles.headerText}>{data.label}</span>
          )}
        </div>
        
        <button 
          style={styles.iconBtn} 
          onClick={(e) => { e.stopPropagation(); isEditing ? handleSave() : setShowMenu(!showMenu); }}
        >
          {isEditing ? <Icons.Check size={14} color={theme.accent.valid} /> : <Icons.MoreHorizontal size={14} />}
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
                  onMouseEnter={(e) => e.currentTarget.style.background = theme.surface[3]}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}

              <div style={styles.separator} />

              <button 
                style={styles.menuItem}
                onMouseEnter={(e) => e.currentTarget.style.background = theme.surface[3]}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  setIsEditing(true);
                }}
              >
                <Icons.Edit2 size={12} />
                Rename
              </button>
              <button 
                style={{ ...styles.menuItem, color: theme.accent.danger }}
                onMouseEnter={(e) => e.currentTarget.style.background = theme.surface[3]}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  onDelete?.();
                }}
              >
                <Icons.Trash size={12} color={theme.accent.danger} />
                Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={styles.body}>
        {isEditing ? (
           <input
             style={styles.input}
             value={editValues.value || ''}
             onChange={(e) => setEditValues(prev => ({...prev, value: e.target.value}))}
             placeholder="Enter value..."
             onKeyDown={(e) => e.key === 'Enter' && handleSave()}
           />
        ) : (
          <span style={styles.label}>
            {data.value ? `Value: ${data.value}` : 'Configure node parameters...'}
          </span>
        )}
        <span style={styles.typeTag}>
          #{data.type}
        </span>
      </div>
    </div>
  );
});