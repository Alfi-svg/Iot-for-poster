/**
 * Formats an estimated carbon stock value alongside its 95% uncertainty interval.
 * Example: formatStockWithCI(48.2, 5.1) -> "48.2 ± 5.1 t C/ha"
 */
export function formatStockWithCI(mean: number, ci95: number, unit = 't C/ha'): string {
  if (isNaN(mean) || isNaN(ci95)) return 'N/A';
  return `${mean.toFixed(1)} ± ${ci95.toFixed(1)} ${unit}`;
}

export function formatStock(mean: number, unit = 't C/ha'): string {
  if (isNaN(mean)) return 'N/A';
  return `${mean.toFixed(1)} ${unit}`;
}

export function formatCI(ci95: number, unit = 't C/ha'): string {
  if (isNaN(ci95)) return 'N/A';
  return `± ${ci95.toFixed(1)} ${unit}`;
}

export function formatPercent(value: number): string {
  if (isNaN(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
}

export function formatBDT(amount: number): string {
  return `৳${amount.toLocaleString('en-US')}`;
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function formatShortHash(hash: string, length = 8): string {
  if (!hash) return '';
  return `${hash.slice(0, length)}…${hash.slice(-4)}`;
}
