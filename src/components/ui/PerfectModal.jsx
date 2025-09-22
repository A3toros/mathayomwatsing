import React from 'react';
import Button from './Button';

// PERFECT MODAL - Based on the working example pattern
// Uses direct Tailwind styling instead of CSS classes for reliability

const PerfectModal = ({
  isOpen = false,
  onClose,
  title = '',
  children,
  size = 'medium', // 'small', 'medium', 'large'
  showCloseButton = true,
  closeOnBackdropClick = true,
  className = '',
  ...props
}) => {
  // Don't render if not open
  if (!isOpen) return null;

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Size classes
  const sizeClasses = {
    small: 'max-w-sm',
    medium: 'max-w-md',
    large: 'max-w-2xl'
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      {...props}
    >
      <div
        className={`
          bg-white rounded-xl shadow-md border border-gray-200 p-6
          hover:shadow-lg hover:-translate-y-1 transition-all duration-200
          w-full ${sizeClasses[size]} mx-auto
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between mb-6">
            {title && (
              <h3 className="text-2xl font-bold text-gray-800">
                {title}
              </h3>
            )}
            {showCloseButton && (
              <Button
                variant="secondary"
                size="small"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                aria-label="Close modal"
              >
                ×
              </Button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PerfectModal;
