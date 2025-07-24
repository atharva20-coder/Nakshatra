'use client';

import { useState, useEffect } from 'react';

const ResponsiveWrapper = ({ children }: { children: React.ReactNode }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  if (isMobile) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-center px-4">
        <h1 className="text-2xl font-bold text-foreground">
          This Web Application is only available on desktop devices.
        </h1>
      </div>
    );
  }

  return <>{children}</>;
};

export default ResponsiveWrapper;