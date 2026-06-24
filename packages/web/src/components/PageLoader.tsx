'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function PageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timeout);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="h-1 bg-gradient-to-r from-primary-teal via-primary-pink to-primary-teal animate-loading-bar" />
    </div>
  );
}
