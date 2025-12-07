import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icon from '@phosphor-icons/react';
import { useTheme } from '../Core/ThemeContext';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  const { theme } = useTheme();

  const handleConfirmAction = () => {
    onConfirm();
  };

  const styles = {
    backdrop: {
      position: 'fixed' as const,
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      zIndex: 300, // Higher z-index to appear on top of other modals
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modal: {
      width: '90%',
      maxWidth: '400px',
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
      gap: theme.space[3],
    },
    title: {
      fontSize: '18px',
      fontWeight: 600,
      color: theme.content[1],
    },
    message: {
        fontSize: '14px',
        color: theme.content[2],
        lineHeight: 1.5,
        fontFamily: '"Inter", sans-serif',
    },
    footer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: theme.space[3],
      marginTop: theme.space[4],
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
    confirmButton: {
      background: theme.accent.danger,
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
              <Icon.WarningCircle size={24} color={theme.accent.danger} weight="fill" />
              <h2 style={styles.title}>{title}</h2>
            </div>
            
            <p style={styles.message}>{message}</p>
            
            <div style={styles.footer}>
              <button
                type="button"
                style={{...styles.button, ...styles.cancelButton}}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{...styles.button, ...styles.confirmButton}}
                onClick={handleConfirmAction}
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
