import React, { useState, useEffect } from 'react';
import { ShieldCheck, RotateCcw } from 'lucide-react';

const CONSENT_KEY = 'psConsent';

export function ConsentBanner() {
  const [consentState, setConsentState] = useState<'yes' | 'no' | null>(() => {
    try {
      const saved = localStorage.getItem(CONSENT_KEY);
      if (saved === 'yes' || saved === 'no') return saved;
    } catch {
      // Ignore restricted storage
    }
    return null;
  });
  const [manageOpen, setManageOpen] = useState(false);

  const handleChoice = (choice: 'yes' | 'no') => {
    try {
      localStorage.setItem(CONSENT_KEY, choice);
    } catch {
      // Ignore storage error
    }
    setConsentState(choice);
    setManageOpen(false);
  };

  const handleWithdrawOrReset = () => {
    try {
      localStorage.removeItem(CONSENT_KEY);
    } catch {
      // Ignore storage error
    }
    setConsentState(null);
    setManageOpen(true);
  };

  useEffect(() => {
    // Expose a global trigger so the footer "Manage Privacy / Withdraw Consent" button can open it anytime
    (window as unknown as { __openPsConsentManager?: () => void }).__openPsConsentManager = () => {
      setManageOpen(true);
    };
  }, []);

  if (consentState !== null && !manageOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-label="UK Privacy and Cookie Choice"
      className="fixed left-3 bottom-3 sm:left-5 sm:bottom-5 z-50 max-w-md rounded-xl bg-[#0b0f19]/95 backdrop-blur-md border border-cyan-400/35 p-4 text-xs text-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.75)] space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-cyan-300 font-semibold">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Sanctuary Privacy & Consent (UK GDPR / PECR)</span>
        </div>
        {consentState !== null && (
          <button
            type="button"
            onClick={() => setManageOpen(false)}
            className="text-slate-400 hover:text-white text-[11px] cursor-pointer"
          >
            Close
          </button>
        )}
      </div>

      <p className="text-slate-300 leading-relaxed">
        We never load analytics before your explicit choice, never use advertising trackers, and never send Arron conversations or Journal Vault notes to any analytics service. You can withdraw or change your choice anytime from the footer.
      </p>

      <div className="flex items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => handleChoice('yes')}
          className="flex-1 py-2 px-3 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-[#0b0f19] font-bold text-xs text-center transition-colors cursor-pointer"
        >
          Accept Anonymised Stats
        </button>
        <button
          type="button"
          onClick={() => handleChoice('no')}
          className="flex-1 py-2 px-3 rounded-lg bg-transparent hover:bg-white/5 text-slate-100 border border-sky-400/60 font-bold text-xs text-center transition-colors cursor-pointer"
        >
          Decline All Analytics
        </button>
      </div>

      {consentState !== null && (
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            Current status: <strong className="text-amber-300">{consentState === 'yes' ? 'Accepted' : 'Declined'}</strong>
          </span>
          <button
            type="button"
            onClick={handleWithdrawOrReset}
            className="text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Withdraw / Reset Choice
          </button>
        </div>
      )}
    </div>
  );
}
