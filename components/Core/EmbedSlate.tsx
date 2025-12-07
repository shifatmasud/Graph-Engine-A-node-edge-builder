import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeContext';
import { NodeData } from '../../types';
// FIX: Switched to namespace import for @phosphor-icons/react to resolve module export errors.
import * as Icon from '@phosphor-icons/react';
import { GLBViewer } from './GLBViewer';
import { UrlEmbedModal } from './UrlEmbedModal';

interface EmbedSlateProps {
  data: Extract<NodeData, { type: 'embed' }>;
  onUpdate: (updates: { data?: Partial<NodeData>, width?: number, height?: number }) => void;
  onDelete?: () => void;
}

export const EmbedSlate: React.FC<EmbedSlateProps> = ({ data, onUpdate, onDelete }) => {
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const isWebsite = data.embedData?.mimeType === 'text/html';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      onUpdate({
        data: {
            embedData: {
            mimeType: file.type,
            dataUrl: event.target.result as string,
            fileName: file.name
            },
            label: file.name
        }
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUrlSubmit = (url: string) => {
    if (url) {
      let mimeType = 'text/html'; // Default to website for generic URLs
      const lowerUrl = url.toLowerCase();
      
      // Check for specific file extensions to override the default
      if (lowerUrl.endsWith('.png')) mimeType = 'image/png';
      else if (lowerUrl.endsWith('.gif')) mimeType = 'image/gif';
      else if (lowerUrl.endsWith('.webp')) mimeType = 'image/webp';
      else if (lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg')) mimeType = 'image/jpeg';
      else if (lowerUrl.endsWith('.svg')) mimeType = 'image/svg+xml';
      else if (lowerUrl.endsWith('.mp4')) mimeType = 'video/mp4';
      else if (lowerUrl.endsWith('.webm')) mimeType = 'video/webm';
      else if (lowerUrl.endsWith('.glb')) mimeType = 'model/gltf-binary';
      
      const fileName = url.substring(url.lastIndexOf('/') + 1);

      const embedUpdate = {
        data: {
            embedData: { mimeType, dataUrl: url, fileName: fileName, },
            label: mimeType === 'text/html' ? url : (fileName || 'Embedded URL'),
        },
        ...(mimeType === 'text/html' && { width: 400, height: 300 })
      };
      
      onUpdate(embedUpdate);
    }
  };

  const clearContent = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ data: { embedData: undefined, label: 'Embed Node' } });
  };
  
  const styles = {
    wrapper: {
      position: 'relative' as const,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
    },
    uploadPlaceholder: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.space[2],
      width: '100%',
      height: '100%',
      border: `2px dashed ${theme.border}`,
      borderRadius: theme.radius[3],
      color: theme.content[2],
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      backgroundColor: theme.surface[1],
    },
    uploadText: {
      fontSize: '12px',
      fontWeight: 500,
    },
    contentWrapper: {
        position: 'relative' as const,
        width: '100%',
        flex: 1,
        minHeight: 0,
        padding: '0 14px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    media: {
      width: '100%',
      height: '100%',
      objectFit: 'contain' as const,
      display: 'block',
      borderRadius: theme.radius[2],
      backgroundColor: theme.surface[1],
    },
    iframe: {
        width: '100%',
        height: '100%',
        border: 'none',
        borderRadius: theme.radius[2],
        backgroundColor: theme.surface[1],
    },
    header: {
      padding: '12px 14px 8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '10px',
      width: '100%',
      flexShrink: 0,
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
    menuButton: {
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: theme.content[3],
      padding: '4px',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: isHovered || showMenu ? 1 : 0,
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
      minWidth: '150px',
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

  const renderContent = () => {
    if (!data.embedData) return null;
    const { mimeType, dataUrl } = data.embedData;

    if (mimeType.startsWith('image/')) {
      return <img src={dataUrl} style={styles.media} alt={data.label} />;
    }
    if (mimeType.startsWith('video/')) {
      return <video src={dataUrl} style={styles.media} controls />;
    }
    if (mimeType.startsWith('audio/')) {
      return <audio src={dataUrl} style={{ width: '100%' }} controls />;
    }
    if (mimeType === 'model/gltf-binary' || data.embedData.fileName?.endsWith('.glb')) {
      return <GLBViewer url={dataUrl} />;
    }
    if (mimeType === 'text/html') {
      return <iframe src={dataUrl} style={styles.iframe} sandbox="allow-scripts allow-same-origin" title={data.label} />
    }
    return (
      <div style={styles.uploadPlaceholder}>
        <Icon.FileX size={32} />
        <span style={styles.uploadText}>Unsupported File</span>
      </div>
    );
  };

  return (
    <div 
        style={styles.wrapper}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
       <UrlEmbedModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        onSubmit={handleUrlSubmit}
      />

      {showMenu && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 55 }} 
          onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} 
        />
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="image/*,video/*,audio/*,.glb"
      />
      <div style={styles.header}>
        <div style={{display: 'flex', alignItems: 'center', gap: theme.space[2], flex: 1, overflow: 'hidden'}}>
            {isWebsite 
                ? <Icon.Globe size={14} color={theme.content[2]} weight="bold"/>
                : <Icon.Cube size={14} color={theme.content[2]} weight="bold"/>
            }
            <span style={styles.headerText} title={data.label}>{data.label}</span>
        </div>
        <button style={styles.menuButton} onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}>
            <Icon.DotsThree size={18} weight="bold" />
        </button>
        <AnimatePresence>
            {showMenu && (
            <motion.div
                style={styles.dropdown}
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                transition={{ duration: 0.1 }}
            >
                <button 
                  style={styles.menuItem}
                  onClick={() => {
                    setShowMenu(false);
                    setIsUrlModalOpen(true);
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.surface[3]}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Icon.Link size={12} />
                  Embed from URL
                </button>
                
                {data.embedData && (
                  <>
                    <div style={{ height: 1, background: theme.border, margin: '2px 0' }} />
                    <button 
                      style={styles.menuItem}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        clearContent(e);
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.surface[3]}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Icon.FileX size={12} />
                      Clear Content
                    </button>
                  </>
                )}

                <div style={{ height: 1, background: theme.border, margin: '2px 0' }} />
                
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
                  <Icon.TrashSimple size={12} color={theme.accent.danger} />
                  Delete Node
                </button>
            </motion.div>
            )}
        </AnimatePresence>
      </div>
      
      <div style={styles.contentWrapper}>
        {!data.embedData ? (
          <div
            style={styles.uploadPlaceholder}
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.accent.primary; e.currentTarget.style.color = theme.content[1]; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.content[2]; }}
          >
            <Icon.FileArrowUp size={32} />
            <span style={styles.uploadText}>Click to upload media</span>
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
};
