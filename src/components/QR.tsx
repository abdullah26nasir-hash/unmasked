import qrcode from 'qrcode-generator';
import { useMemo } from 'react';

// Drawn locally: the invite link never goes to a third-party QR service.
export function QR({ value, size = 168, label }: { value: string; size?: number; label: string }) {
  const { n, d } = useMemo(() => {
    const q = qrcode(0, 'M');
    q.addData(value);
    q.make();
    const n = q.getModuleCount();
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + 2} ${r + 2}h1v1h-1z`;
    return { n, d };
  }, [value]);
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${n + 4} ${n + 4}`} width={size} height={size} shapeRendering="crispEdges" className="rounded-2xl bg-white">
      <path d={d} fill="currentColor" />
    </svg>
  );
}
