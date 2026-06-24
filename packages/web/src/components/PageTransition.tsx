'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState('enter');

  useEffect(() => {
    setTransitionStage('exit');
    
    const timeout = setTimeout(() => {
      setDisplayChildren(children);
      setTransitionStage('enter');
    }, 150);

    return () => clearTimeout(timeout);
  }, [pathname, children]);

  return (
    <div
      className={`transition-all duration-500 ease-out ${
        transitionStage === 'enter' 
          ? 'opacity-100 scale-100' 
          : 'opacity-0 scale-95'
      }`}
    >
      {displayChildren}
    </div>
  );
}
