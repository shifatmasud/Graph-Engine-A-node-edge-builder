
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// FIX: Switched to namespace import for @phosphor-icons/react to resolve module export errors.
import * as Icon from '@phosphor-icons/react';
import { useTheme } from '../Core/ThemeContext';
import { ConfirmModal } from './ConfirmModal';

interface GeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string, apiKey: string) => Promise<void>;
  shouldConfirm?: boolean;
  onClear?: () => void;
}

export const GeneratorModal: React.FC<GeneratorModalProps> = ({ isOpen, onClose, onSubmit, shouldConfirm = false, onClear }) => {
  const { theme } = useTheme();
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPrompt('');
      setIsLoading(false);
      setError(null);
      setIsConfirming(false);
      const storedApiKey = localStorage.getItem('nexus-flow-api-key');
      if (storedApiKey) {
        setApiKey(storedApiKey);
      }
    }
  }, [isOpen]);

  const startGeneration = async () => {
    localStorage.setItem('nexus-flow-api-key', apiKey);
    if (onClear) onClear();
    setIsLoading(true);
    setError(null);
    
    try {
      await onSubmit(prompt, apiKey);
    } catch (err) {
        console.error(err);
        setError(`Generation failed. Please check your API key and try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    if (!apiKey.trim()) {
      setError('API Key is required to generate a graph.');
      return;
    }
    setError(null);

    if (shouldConfirm) {
      setIsConfirming(true);
    } else {
      startGeneration();
    }
  };

  const handleConfirmGeneration = () => {
    setIsConfirming(false);
    startGeneration();
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
      maxWidth: '500px',
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
    textarea: {
      width: '100%',
      minHeight: '100px',
      background: theme.surface[1],
      border: `1px solid ${theme.border}`,
      borderRadius: theme.radius[3],
      padding: theme.space[3],
      fontSize: '14px',
      color: theme.content[1],
      fontFamily: '"Inter", sans-serif',
      resize: 'vertical' as const,
      outline: 'none',
      transition: 'border-color 0.2s',
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
    error: {
        color: theme.accent.danger,
        fontSize: '13px',
        fontFamily: '"Inter", sans-serif',
        padding: `${theme.space[2]} ${theme.space[3]}`,
        background: `${theme.accent.danger}20`,
        borderRadius: theme.radius[3],
        textAlign: 'center' as const,
    },
    footer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: theme.space[3],
      marginTop: theme.space[2],
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
    generateButton: {
      background: theme.accent.primary,
      color: 'white',
    },
    cancelButton: {
      background: theme.surface[3],
      color: theme.content[1],
    }
  };

  return (
    <>
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
                  <Icon.Sparkle size={20} color={theme.accent.secondary} weight="fill" />
                  <span>Generate Graph with AI</span>
                </h2>
                <button style={styles.closeButton} onClick={onClose} aria-label="Close">
                  <Icon.X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} style={styles.form}>
                <textarea
                  style={styles.textarea}
                  placeholder="Describe the flow you want to create, e.g., 'a simple user authentication process' or 'data pipeline to process images'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isLoading}
                  onFocus={(e) => e.target.style.borderColor = theme.accent.primary}
                  onBlur={(e) => e.target.style.borderColor = theme.border}
                />
                
                <input
                  type="password"
                  style={styles.input}
                  placeholder="Enter your Google AI API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isLoading}
                  onFocus={(e) => e.target.style.borderColor = theme.accent.primary}
                  onBlur={(e) => e.target.style.borderColor = theme.border}
                />

                <AnimatePresence>
                  {error && (
                    <motion.div
                      style={styles.error}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div style={styles.footer}>
                  <button
                    type="button"
                    style={{...styles.button, ...styles.cancelButton}}
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{...styles.button, ...styles.generateButton, opacity: isLoading ? 0.7 : 1}}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </form>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={isConfirming}
        onClose={() => setIsConfirming(false)}
        onConfirm={handleConfirmGeneration}
        title="Replace Existing Graph"
        message="This will clear your current canvas and generate a new graph. This action cannot be undone."
      />
    </>
  );
};
