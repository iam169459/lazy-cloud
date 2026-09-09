import { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight, MoreHorizontal, CheckSquare, Square, Download, Trash2, Copy } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: T) => React.ReactNode;
}

export interface Action<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  variant?: 'default' | 'danger';
  disabled?: (row: T) => boolean;
  hidden?: (row: T) => boolean;
}

export interface BulkAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (rows: T[]) => void;
  variant?: 'default' | 'danger';
  disabled?: (rows: T[]) => boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  actions?: Action<T>[];
  bulkActions?: BulkAction<T>[];
  keyExtractor: (row: T) => string;
  searchPlaceholder?: string;
  searchKeys?: (keyof T & string)[];
  pageSize?: number;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  loading?: boolean;
  loadingText?: string;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  actions,
  bulkActions,
  keyExtractor,
  searchPlaceholder = 'Search...',
  searchKeys = [],
  pageSize = 10,
  emptyIcon,
  emptyTitle = 'No data',
  emptyDescription,
  loading,
  loadingText = 'Loading...',
  selectable = false,
  onSelectionChange,
}: DataTableProps<T>) {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [selectAllPage, setSelectAllPage] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((k) => String(row[k] ?? '').toLowerCase().includes(q))
    );
  }, [data, search, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const selectedRows = useMemo(() => paged.filter((row) => selectedKeys.has(keyExtractor(row))), [paged, selectedKeys, keyExtractor]);
  const allPageSelected = paged.length > 0 && paged.every((row) => selectedKeys.has(keyExtractor(row)));

  const toggleRow = useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleAllPage = useCallback(() => {
    if (allPageSelected) {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        paged.forEach((row) => next.delete(keyExtractor(row)));
        return next;
      });
    } else {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        paged.forEach((row) => next.add(keyExtractor(row)));
        return next;
      });
    }
  }, [allPageSelected, paged, keyExtractor]);

  const clearSelection = useCallback(() => {
    setSelectedKeys(new Set());
  }, []);

  const handleBulkAction = useCallback((action: BulkAction<T>) => {
    if (selectedRows.length === 0) return;
    if (action.disabled && action.disabled(selectedRows)) return;
    action.onClick(selectedRows);
    clearSelection();
  }, [selectedRows, clearSelection]);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  if (loading) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3" style={{ borderColor: colors.success, borderTopColor: 'transparent' }} />
        <p className="text-sm" style={{ color: colors.textMuted }}>{loadingText}</p>
      </div>
    );
  }

  return (
    <div className="glass-card">
      {/* Search Bar */}
      {searchKeys.length > 0 && (
        <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: colors.textDim }} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder={searchPlaceholder}
              className="input pl-9 py-2 text-xs"
            />
          </div>
          <span className="text-[10px] font-mono" style={{ color: colors.textDim }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Table */}
      {paged.length === 0 ? (
        <div className="py-16 text-center">
          {emptyIcon && <div className="mb-3" style={{ color: colors.textDim }}>{emptyIcon}</div>}
          <p className="text-sm font-medium" style={{ color: colors.textMuted }}>{emptyTitle}</p>
          {emptyDescription && <p className="text-xs mt-1" style={{ color: colors.textDim }}>{emptyDescription}</p>}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[10px] font-mono uppercase" style={{ color: colors.textDim, borderBottom: `1px solid ${colors.border}` }}>
                {selectable && (
                  <th className="px-4 py-2.5 w-10">
                    <label className="inline-flex items-center justify-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleAllPage}
                        className="w-4 h-4 rounded border" style={{ borderColor: 'var(--border)', accentColor: 'var(--primary)' }}
                        aria-label="Select all on page"
                      />
                    </label>
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-2.5 font-medium"
                    style={{
                      width: col.width,
                      textAlign: col.align || 'left',
                      cursor: col.sortable ? 'pointer' : 'default',
                      userSelect: col.sortable ? 'none' : undefined,
                    }}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sortable && sortKey === col.key && (
                        sortDir === 'asc'
                          ? <ChevronUp className="w-3 h-3" />
                          : <ChevronDown className="w-3 h-3" />
                      )}
                    </span>
                  </th>
                ))}
                {actions && actions.length > 0 && <th className="px-4 py-2.5 w-12" />}
              </tr>
            </thead>
            <tbody>
              {paged.map((row) => {
                const id = keyExtractor(row);
                const isSelected = selectedKeys.has(id);
                return (
                  <tr
                    key={id}
                    className={`data-table-row transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                    style={{ borderBottom: `1px solid ${colors.border}` }}
                  >
                    {selectable && (
                      <td className="px-4 py-2.5">
                        <label className="inline-flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(id)}
                            className="w-4 h-4 rounded border" style={{ borderColor: 'var(--border)', accentColor: 'var(--primary)' }}
                            aria-label="Select row"
                          />
                        </label>
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-4 py-2.5 text-xs"
                        style={{ textAlign: col.align || 'left' }}
                      >
                        {col.render ? col.render(row) : String(row[col.key] ?? '')}
                      </td>
                    ))}
                    {actions && actions.length > 0 && (
                      <td className="px-4 py-2.5">
                        <div className="relative flex justify-end">
                          <button
                            onClick={() => setOpenMenu(openMenu === id ? null : id)}
                            className="p-1.5 rounded-md transition-colors"
                            style={{ color: colors.textDim }}
                            aria-label="Row actions"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {openMenu === id && (
                            <>
                              <div className="fixed inset-0 z-50" onClick={() => setOpenMenu(null)} />
                              <div
                                className="absolute right-0 top-full mt-1 w-44 rounded-xl py-1.5 z-50 animate-scale-in"
                                style={{
                                  background: colors.cardBg,
                                  border: `1px solid ${colors.border}`,
                                  backdropFilter: 'blur(20px)',
                                  boxShadow: `0 8px 32px ${colors.bg}80`,
                                }}
                              >
                                {actions
                                  .filter((a) => !a.hidden || !a.hidden(row))
                                  .map((action, i) => (
                                    <button
                                      key={i}
                                      onClick={() => { action.onClick(row); setOpenMenu(null); }}
                                      disabled={action.disabled?.(row)}
                                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors text-left disabled:opacity-40"
                                      style={{
                                        color: action.variant === 'danger' ? colors.danger : colors.text,
                                      }}
                                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = action.variant === 'danger' ? `${colors.danger}14` : colors.cardBg; }}
                                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                    >
                                      {action.icon}
                                      {action.label}
                                    </button>
                                  ))}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      {selectable && selectedKeys.size > 0 && bulkActions && bulkActions.length > 0 && (
        <div className="px-4 py-2.5 flex items-center gap-3 flex-wrap" style={{ borderTop: `1px solid ${colors.border}`, background: `${colors.success}0d` }}>
          <span className="text-xs font-mono" style={{ color: colors.textMuted }}>
            {selectedKeys.size} selected
          </span>
          <button onClick={clearSelection} className="text-xs px-2 py-1 rounded" style={{ color: colors.textMuted, background: 'transparent', border: '1px solid var(--border)' }}>
            Clear
          </button>
          <div className="flex items-center gap-2 ml-auto">
            {bulkActions.map((action, i) => (
              <button
                key={i}
                onClick={() => handleBulkAction(action)}
                disabled={action.disabled && action.disabled(selectedRows)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors disabled:opacity-40"
                style={{
                  background: action.variant === 'danger' ? `${colors.danger}1a` : colors.cardBg,
                  color: action.variant === 'danger' ? colors.danger : colors.text,
                  border: '1px solid transparent',
                }}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop: `1px solid ${colors.border}` }}>
          <span className="text-[10px] font-mono" style={{ color: colors.textDim }}>
            Page {safePage + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(0, safePage - 1))}
              disabled={safePage === 0}
              className="p-1.5 rounded-md transition-colors disabled:opacity-30"
              style={{ color: colors.textMuted }}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i;
              } else if (safePage < 2) {
                pageNum = i;
              } else if (safePage > totalPages - 3) {
                pageNum = totalPages - 5 + i;
              } else {
                pageNum = safePage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className="w-7 h-7 rounded-md text-[11px] font-mono transition-colors"
                  style={{
                    background: safePage === pageNum ? `${colors.success}1f` : 'transparent',
                    color: safePage === pageNum ? colors.success : colors.textDim,
                  }}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
              disabled={safePage >= totalPages - 1}
              className="p-1.5 rounded-md transition-colors disabled:opacity-30"
              style={{ color: colors.textMuted }}
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
