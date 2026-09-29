'use client';

import Skeleton from './Skeleton';

export function StatSkeleton() {
  return (
    <div style={{ 
      background: 'var(--card-bg)', 
      border: '1px solid var(--card-border)', 
      borderRadius: '1rem', 
      padding: '1.5rem',
      backdropFilter: 'blur(20px)',
    }}>
      <Skeleton variant="text" width="25%" height="1rem" />
      <div style={{ marginTop: '1rem' }}>
        <Skeleton variant="text" width="60%" height="2.5rem" />
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div style={{ 
      background: 'var(--card-bg)', 
      border: '1px solid var(--card-border)', 
      borderRadius: '1rem', 
      padding: '1.5rem',
      backdropFilter: 'blur(20px)',
    }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Skeleton variant="circular" width="48" height="48" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Skeleton variant="text" width="40%" height="1.25rem" />
          <Skeleton variant="text" width="60%" height="1rem" />
        </div>
      </div>
      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
        <Skeleton variant="text" width="80px" height="1rem" />
        <Skeleton variant="text" width="80px" height="1rem" />
        <Skeleton variant="text" width="80px" height="1rem" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ 
      background: 'var(--card-bg)', 
      border: '1px solid var(--card-border)', 
      borderRadius: '1rem', 
      overflow: 'hidden',
      backdropFilter: 'blur(20px)',
    }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        padding: '1rem',
        borderBottom: '1px solid var(--card-border)',
        background: 'var(--bg-card)',
      }}>
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} variant="text" width="80%" height="1rem" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          padding: '1rem',
          borderBottom: r < rows - 1 ? '1px solid var(--card-border)' : 'none',
        }}>
          {Array.from({ length: cols }, (_, c) => (
            <Skeleton key={c} variant="text" width="80%" height="1rem" />
          ))}
        </div>
      ))}
    </div>
  );
}
