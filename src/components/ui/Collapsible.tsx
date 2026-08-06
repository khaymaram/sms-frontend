import { useState, useRef, useEffect } from 'react';

interface CollapsibleProps {
  isOpen: boolean;
  children: React.ReactNode;
}

const Collapsible = ({ isOpen, children }: CollapsibleProps) => {
  const [height, setHeight] = useState<number | undefined>(isOpen ? undefined : 0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    const updateHeight = () => {
      if (isOpen) {
        setHeight(contentRef.current?.scrollHeight);
      } else {
        setHeight(0);
      }
    };

    // Initial height calculation
    updateHeight();

    // Watch for changes in nested content (for nested collapsibles)
    const resizeObserver = new ResizeObserver(() => {
      if (isOpen) {
        updateHeight();
      }
    });

    resizeObserver.observe(contentRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isOpen]);

  return (
    <div
      className="overflow-hidden transition-all duration-300 ease-in-out"
      style={{ height: height === undefined ? 'auto' : `${height}px` }}
    >
      <div ref={contentRef}>
        {children}
      </div>
    </div>
  );
};

export default Collapsible;
