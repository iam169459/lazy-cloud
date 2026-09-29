'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { fadeInUp } from '@/lib/animations';

interface Column<T> {
  key: string;
  header: string;
  render: (item: T, index: number) => ReactNode;
  className?: React.CSSProperties;
}

interface AnimatedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  emptyMessage?: string;
  className?: string;
  rowClassName?: string | ((item: T) => string);
  onRowClick?: (item: T) => void;
  loading?: boolean;
}

export default function AnimatedTable<T extends Record<string, unknown>>({ 
  data, 
  columns, 
  keyField,
  emptyMessage = 'No data',
  className = '',
  rowClassName,
  onRowClick,
  loading = false,
}: AnimatedTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div 
          className="w-8 h-8 border-2 border-transparent rounded-full"
          style={{ 
            borderTopColor: 'var(--primary)',
            borderRightColor: 'var(--primary)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  const rows = data.map((item, index) => (
    <motion.tr
      key={String(item[keyField])}
      variants={fadeInUp}
      custom={index}
      style={{ 
        borderBottom: '1px solid var(--card-border)',
        transition: 'all 0.2s ease',
      }}
      whileHover={{ 
        backgroundColor: 'var(--card-hover)',
        scale: 1.005,
      }}
      onClick={() => onRowClick?.(item)}
      className={typeof rowClassName === 'function' ? rowClassName(item) : rowClassName}
    >
      {columns.map((col) => (
        <td key={col.key} className="px-4 py-3" style={col.className}>
          {col.render(item, index)}
        </td>
      ))}
    </motion.tr>
  ));

  return (
    <div className={`overflow-x-auto rounded-xl ${className}`} style={{ 
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
    }}>
      <div className="overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
              {columns.map((col) => (
                <th 
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-mono uppercase tracking-wider"
                  style={{ color: 'var(--text-dim)', ...col.className }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <motion.tr 
                variants={fadeInUp}
                style={{ opacity: 0 }}
              >
                <td colSpan={columns.length} className="px-4 py-12 text-center" style={{ color: 'var(--text-dim)' }}>
                  {emptyMessage}
                </td>
              </motion.tr>
            ) : (
              <AnimatePresence>
                {rows}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
