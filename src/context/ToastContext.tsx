import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-4 w-full max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto animate-in slide-in-from-right-full duration-500 fade-in"
          >
            <div className={`
              relative overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all
              ${toast.type === 'success' ? 'bg-green-50/90 border-green-200 text-green-900' : 
                toast.type === 'error' ? 'bg-red-50/90 border-red-200 text-red-900' : 
                toast.type === 'warning' ? 'bg-orange-50/90 border-orange-200 text-orange-900' : 
                'bg-blue-50/90 border-blue-200 text-blue-900'}
            `}>
              {/* Progress Bar Animation */}
              <div className={`absolute bottom-0 left-0 h-1 transition-all duration-[5000ms] ease-linear bg-current opacity-20 w-0 animate-[progress_5s_linear]`} />
              
              <div className="flex gap-4">
                <div className={`mt-0.5 rounded-full p-1.5 flex-shrink-0
                  ${toast.type === 'success' ? 'bg-green-200/50 text-green-600' : 
                    toast.type === 'error' ? 'bg-red-200/50 text-red-600' : 
                    toast.type === 'warning' ? 'bg-orange-200/50 text-orange-600' : 
                    'bg-blue-200/50 text-blue-600'}
                `}>
                  {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                  {toast.type === 'error' && <XCircle className="w-5 h-5" />}
                  {toast.type === 'warning' && <AlertCircle className="w-5 h-5" />}
                  {toast.type === 'info' && <Info className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm mb-1">{toast.title}</h4>
                  <p className="text-sm opacity-80 leading-relaxed">{toast.message}</p>
                </div>

                <button
                  onClick={() => removeToast(toast.id)}
                  className="mt-0.5 text-current opacity-40 hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
