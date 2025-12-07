import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// FIX: Switched to namespace import for @phosphor-icons/react to resolve module export errors.
import * as Icon from '@phosphor-icons/react';
import { useTheme } from './ThemeContext';

interface UrlEmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string) => void;
}

export const UrlEmbedModal: React.FC<UrlEmbedModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const { theme } = useTheme();
  const [url, setUrl] = useState('https://');

  useEffect(() => {
    if (isOpen) {
      setUrl('https://');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || url.trim() === 'https://') return;
    onSubmit(url);
    onClose();
  };

  const styles = {
    backdrop: {
      position: 'fixed' as const,
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modal: {
      width: '90%',
      maxWidth: '450px',
      background: theme.surface[2],
      borderRadius: theme.radius[5],
      border: `1px solid ${theme.border}`,
      boxShadow: theme.shadow,
      padding: theme.space[6],
      display: 'flex',
      flexDirection: 'column' as const,
      gap: theme.space[4],
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.space[2],
      fontSize: '18px',
      fontWeight: 600,
      color: theme.content[1],
    },
    closeButton: {
      background: 'transparent',
      border: 'none',
      color: theme.content[2],
      cursor: 'pointer',
      padding: theme.space[1],
    },
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: theme.space[3],
    },
    input: {
      width: '100%',
      background: theme.surface[1],
      border: `1px solid ${theme.border}`,
      borderRadius: theme.radius[3],
      padding: theme.space[3],
      fontSize: '14px',
      color: theme.content[1],
      fontFamily: '"Inter", sans-serif',
      outline: 'none',
      transition: 'border-color 0.2s',
    },
    infoText: {
      fontSize: '12px',
      color: theme.content[2],
      fontFamily: '"Inter", sans-serif',
      textAlign: 'center' as const,
      padding: `0 ${theme.space[1]}`,
    },
    footer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: theme.space[3],
    },
    button: {
      padding: `${theme.space[2]} ${theme.space[4]}`,
      borderRadius: theme.radius[3],
      border: 'none',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    embedButton: {
      background: theme.accent.primary,
      color: 'white',
    },
    cancelButton: {
      background: theme.surface[3],
      color: theme.content[1],
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          style={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            style={styles.modal}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.header}>
              <h2 style={styles.title}>
                <Icon.Link size={20} color={theme.content[2]} weight="bold" />
                <span>Embed from URL</span>
              </h2>
              <button style={styles.closeButton} onClick={onClose} aria-label="Close">
                <Icon.X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <input
                type="text"
                style={styles.input}
                placeholder="https://example.com/image.png"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onFocus={(e) => e.target.style.borderColor = theme.accent.primary}
                onBlur={(e) => e.target.style.borderColor = theme.border}
                autoFocus
              />
              <p style={styles.infoText}>
                Note: Some websites may block embedding due to their security policies.
              </p>
              <div style={styles.footer}>
                <button
                  type="button"
                  style={{...styles.button, ...styles.cancelButton}}
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{...styles.button, ...styles.embedButton}}
                >
                  Embed
                </button>
              </div>
            </form>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};