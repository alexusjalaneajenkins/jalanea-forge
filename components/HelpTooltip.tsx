import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface HelpTooltipProps {
  content: string;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'sm' | 'md';
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  content,
  title,
  position = 'top',
  size = 'sm',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const trigger = triggerRef.current.getBoundingClientRect();
      const tooltip = tooltipRef.current.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      let style: React.CSSProperties = {};

      // Calculate position based on available space
      switch (position) {
        case 'top':
          style = {
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
          };
          // Check if tooltip would go off-screen top
          if (trigger.top - tooltip.height < 10) {
            style = {
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: '8px',
            };
          }
          break;
        case 'bottom':
          style = {
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: '8px',
          };
          break;
        case 'left':
          style = {
            right: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            marginRight: '8px',
          };
          break;
        case 'right':
          style = {
            left: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            marginLeft: '8px',
          };
          break;
      }

      // Ensure tooltip doesn't go off-screen horizontally
      if (tooltip.left < 10) {
        style.left = '0';
        style.transform = position === 'top' || position === 'bottom' ? 'translateX(0)' : style.transform;
      }
      if (tooltip.right > viewport.width - 10) {
        style.right = '0';
        style.left = 'auto';
        style.transform = position === 'top' || position === 'bottom' ? 'translateX(0)' : style.transform;
      }

      setTooltipStyle(style);
    }
  }, [isVisible, position]);

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <span className="relative inline-flex items-center">
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className={`${iconSize} text-gray-400 dark:text-forge-500 hover:text-gray-600 dark:hover:text-forge-300 transition-colors cursor-help focus:outline-none focus:ring-2 focus:ring-forge-accent focus:ring-offset-2 dark:focus:ring-offset-forge-900 rounded-full`}
        aria-label={title || 'Help'}
        aria-describedby={isVisible ? 'help-tooltip' : undefined}
      >
        <HelpCircle className={iconSize} />
      </button>

      {isVisible && (
        <div
          ref={tooltipRef}
          id="help-tooltip"
          role="tooltip"
          className="absolute z-50 w-64 p-3 bg-gray-900 dark:bg-forge-800 text-white text-sm rounded-lg shadow-xl border border-gray-700 dark:border-forge-600 animate-fade-in"
          style={tooltipStyle}
        >
          {title && (
            <p className="font-semibold text-forge-accent mb-1">{title}</p>
          )}
          <p className="text-gray-200 dark:text-forge-muted leading-relaxed">{content}</p>
          {/* Arrow */}
          <div
            className={`absolute w-2 h-2 bg-gray-900 dark:bg-forge-800 border-gray-700 dark:border-forge-600 transform rotate-45 ${
              position === 'top' ? 'bottom-[-5px] left-1/2 -translate-x-1/2 border-r border-b' :
              position === 'bottom' ? 'top-[-5px] left-1/2 -translate-x-1/2 border-l border-t' :
              position === 'left' ? 'right-[-5px] top-1/2 -translate-y-1/2 border-t border-r' :
              'left-[-5px] top-1/2 -translate-y-1/2 border-b border-l'
            }`}
          />
        </div>
      )}
    </span>
  );
};
