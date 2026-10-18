import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  X,
  ExternalLink,
  Phone,
  MessageSquare,
  Camera,
  Share2,
  TrendingUp,
  Sparkles,
  Calculator,
} from 'lucide-react';
import { ActionIntent } from '../types';

interface IntentConfirmationModalProps {
  intent: ActionIntent | null;
  onConfirm: (intent: ActionIntent) => void;
  onCancel: () => void;
}

export const IntentConfirmationModal: React.FC<IntentConfirmationModalProps> = ({
  intent,
  onConfirm,
  onCancel,
}) => {
  if (!intent) return null;

  const [customPhone, setCustomPhone] = useState(intent.payload?.phone || '');
  const [customText, setCustomText] = useState(intent.payload?.text || intent.payload?.message || '');

  const getIcon = () => {
    switch (intent.type) {
      case 'open_app':
        if (intent.payload?.appName?.toLowerCase().includes('cal')) {
          return <Calculator className="w-5 h-5 text-indigo-400" />;
        }
        return <MessageSquare className="w-5 h-5 text-emerald-400" />;
      case 'send_whatsapp':
        return <MessageSquare className="w-5 h-5 text-emerald-400" />;
      case 'call_contact':
        return <Phone className="w-5 h-5 text-cyan-400" />;
      case 'share_content':
        return <Share2 className="w-5 h-5 text-indigo-400" />;
      case 'stock_analysis':
        return <TrendingUp className="w-5 h-5 text-amber-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-indigo-400" />;
    }
  };

  const handleProceed = () => {
    const updatedIntent = {
      ...intent,
      payload: {
        ...intent.payload,
        phone: customPhone,
        text: customText,
      },
    };
    onConfirm(updatedIntent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-950 to-[#070b14] border border-indigo-500/30 rounded-2xl shadow-2xl p-5 space-y-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
          {getIcon()}
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
            Authorization Required
          </span>
          <h3 className="font-extrabold text-base text-white mt-2">{intent.title}</h3>
          <p className="text-xs text-slate-300 mt-1">{intent.description}</p>
        </div>

        {/* WhatsApp message editor if applicable */}
        {intent.type === 'send_whatsapp' && (
          <div className="space-y-2 text-left text-xs">
            <div>
              <label className="text-slate-400 text-[11px] font-semibold block mb-1">
                Recipient (Phone with country code or blank for contact picker)
              </label>
              <input
                type="text"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="+91 9876543210 (Optional)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>
            <div>
              <label className="text-slate-400 text-[11px] font-semibold block mb-1">
                Message Content
              </label>
              <textarea
                rows={3}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Type your message to confirm before sending..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>
          </div>
        )}

        {/* Standard payload preview if not WhatsApp */}
        {intent.type !== 'send_whatsapp' && Object.keys(intent.payload || {}).length > 0 && (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-left font-mono text-slate-400 space-y-1">
            {Object.entries(intent.payload).map(([k, v]) => (
              <div key={k} className="flex justify-between truncate">
                <span className="text-slate-500">{k}:</span>
                <span className="text-slate-200 truncate ml-2">{String(v)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleProceed}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            Confirm &amp; Proceed
          </button>
        </div>

        <p className="text-[10px] text-slate-500">
          Brain Mate asks for confirmation before launching external apps or actions.
        </p>
      </div>
    </div>
  );
};
