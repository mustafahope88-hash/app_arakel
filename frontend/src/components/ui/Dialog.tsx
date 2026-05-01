import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

interface DialogContentProps {
  className?: string;
  children: React.ReactNode;
}

interface DialogHeaderProps {
  className?: string;
  children: React.ReactNode;
}

interface DialogTitleProps {
  className?: string;
  children: React.ReactNode;
}

const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>({
  open: false,
  onOpenChange: () => {},
});

const Dialog: React.FC<DialogProps> = ({ open = false, onOpenChange, children }) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange: onOpenChange || (() => {}) }}>
      {children}
    </DialogContext.Provider>
  );
};

const DialogTrigger: React.FC<DialogTriggerProps> = ({ children }) => {
  const { onOpenChange } = React.useContext(DialogContext);

  const handleClick = () => {
    onOpenChange(true);
  };

  return (
    <div onClick={handleClick}>
      {children}
    </div>
  );
};

const DialogContent: React.FC<DialogContentProps> = ({ className, children }) => {
  const { open, onOpenChange } = React.useContext(DialogContext);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700",
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => onOpenChange(false)}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none dark:ring-offset-gray-950 dark:focus:ring-blue-400"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>

              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

const DialogHeader: React.FC<DialogHeaderProps> = ({ className, children }) => {
  return (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left p-6 pb-0", className)}>
      {children}
    </div>
  );
};

const DialogTitle: React.FC<DialogTitleProps> = ({ className, children }) => {
  return (
    <h2 className={cn("text-lg font-semibold leading-none tracking-tight text-gray-900 dark:text-white", className)}>
      {children}
    </h2>
  );
};

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle };
