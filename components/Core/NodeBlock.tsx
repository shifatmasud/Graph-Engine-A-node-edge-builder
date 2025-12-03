import React, { memo } from 'react';
import * as Icons from 'lucide-react';
import { NodeData } from '../../types';

interface IPOSlateProps {
  data: NodeData;
}

const getNodeIcon = (type: string) => {
  const style = { width: 16, height: 16 };
  switch (type) {
    case 'input': return <Icons.BoxSelect style={{ ...style, color: '#3b82f6' }} />; // Blue
    case 'output': return <Icons.HardDrive style={{ ...style, color: '#22c55e' }} />; // Green
    case 'process': return <Icons.Cpu style={{ ...style, color: '#a855f7' }} />; // Purple
    default: return <Icons.Activity style={{ ...style, color: '#a1a1aa' }} />;
  }
};

export const IPOSlate = memo(({ data }: IPOSlateProps) => {
  const styles = {
    wrapper: {
      display: 'flex',
      flexDirection: 'column' as const,
      width: '100%',
      // No fixed height, let content drive it
      padding: '0', 
    },
    header: {
      padding: '12px 16px',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      background: 'rgba(255,255,255,0.02)',
      borderTopLeftRadius: '12px',
      borderTopRightRadius: '12px',
    },
    titleGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    headerText: {
      fontSize: '14px',
      fontWeight: 400,
      fontFamily: '"Bebas Neue", cursive',
      color: '#fafafa',
      letterSpacing: '0.05em',
      transform: 'translateY(1px)', // Visual balance for Bebas
    },
    body: {
      padding: '16px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
      minHeight: '60px', // Visual consistency
    },
    label: {
      fontSize: '12px',
      fontFamily: '"Inter", sans-serif',
      color: '#a1a1aa',
      lineHeight: '1.4',
    },
    typeTag: {
      fontSize: '10px',
      fontFamily: '"Victor Mono", monospace',
      color: '#52525b', // Zinc 600
      textTransform: 'uppercase' as const,
      alignSelf: 'flex-start',
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div style={styles.titleGroup}>
          {getNodeIcon(data.type)}
          <span style={styles.headerText}>{data.label}</span>
        </div>
        <Icons.MoreHorizontal size={14} className="text-content-3" />
      </div>
      <div style={styles.body}>
        <span style={styles.label}>
          {data.value ? `Value: ${data.value}` : 'Configure node parameters...'}
        </span>
        <span style={styles.typeTag}>
          #{data.type}
        </span>
      </div>
    </div>
  );
});