import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, danger = false }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative card p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-full ${danger ? 'bg-cinnabar-600/10' : 'bg-divine-gold-500/10'}`}>
            <AlertTriangle className={`w-6 h-6 ${danger ? 'text-cinnabar-600' : 'text-divine-gold-600'}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-ink mb-2">{title}</h3>
            <p className="text-ink-secondary text-sm">{message}</p>
            <div className="flex gap-3 mt-5">
              <button onClick={onCancel} className="btn-ghost flex-1">取消</button>
              <button onClick={onConfirm}
                className={`flex-1 px-4 py-2 rounded-xl text-white font-medium text-sm ${danger ? 'bg-cinnabar-600 hover:bg-cinnabar-500' : 'bg-divine-gold-500 hover:bg-divine-gold-600'}`}>
                确认
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}