import { useEffect, useRef } from 'react';

import { IPCChannels } from '../shared/enums/ipcChannels';
import { sendToIPC } from '../shared/utils/ipc';

interface InteractiveAreaProps {
  className?: string;
  children: React.ReactNode;
}

export default function InteractiveArea({
  className = '',
  children,
}: InteractiveAreaProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const handleMouseEnter = () =>
      sendToIPC(IPCChannels.RM_SET_IGNORE_MOUSE_EVENTS, false);

    const handleMouseLeave = () =>
      sendToIPC(IPCChannels.RM_SET_IGNORE_MOUSE_EVENTS, true);

    node.addEventListener('mouseenter', handleMouseEnter);
    node.addEventListener('mouseleave', handleMouseLeave);

    const checkMouseOver = () => {
      const hoveredEl = document.elementFromPoint(
        window.innerWidth / 2,
        window.innerHeight / 2,
      );
      if (node.contains(hoveredEl)) {
        handleMouseEnter();
      }
    };

    checkMouseOver();

    return () => {
      node.removeEventListener('mouseenter', handleMouseEnter);
      node.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div ref={ref} className={className + ' interactive'}>
      {children}
    </div>
  );
}
