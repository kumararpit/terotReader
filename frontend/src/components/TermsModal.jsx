import React from 'react';
import { X, Check, ShieldAlert } from 'lucide-react';
import { Button } from './ui/button';

export const TermsModal = ({ isOpen, onClose, onAccept }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-primary/5 flex items-center justify-between bg-background">
                    <div className="flex items-center gap-2 text-[#3B2E5A]">
                        <ShieldAlert className="w-5 h-5 text-[var(--color-primary)]" />
                        <h3 className="text-xl font-heading font-semibold">Terms & Conditions</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-primary/5 rounded-full transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4 text-sm text-primary leading-relaxed">
                    <p>Please read the following terms and conditions carefully before booking a session:</p>

                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Age Requirement:</strong> You must be 18 years or older to book a reading.</li>
                        <li><strong>Medical Disclaimer:</strong> Tarot readings are for guidance only and are not a substitute for professional medical, legal, or financial advice. We do not answer questions related to serious health conditions, illnesses, or death.</li>
                        <li><strong>Confidentiality:</strong> All sessions are strictly confidential. Your personal information and shared stories will never be disclosed to third parties.</li>
                        <li><strong>Refund Policy:</strong> Payments are non-refundable once the session has begun or the reading has been delivered. Rescheduling is allowed up to 24 hours in advance.</li>
                        <li><strong>Code of Conduct:</strong> We reserve the right to terminate a session if the client behaves in a disrespectful, abusive, or inappropriate manner.</li>
                        <li><strong>Accuracy:</strong> While we strive for accuracy, tarot readings are subject to interpretation and should be viewed as a tool for self-reflection.</li>
                    </ul>

                    <p className="mt-4 text-xs text-muted-foreground">By clicking "Accept & Proceed", you acknowledge that you have read, understood, and agreed to these terms.</p>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-primary/5 bg-background flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} className="px-6">
                        Decline
                    </Button>
                    <Button onClick={onAccept} className="btn-primary px-8 gap-2">
                        <Check className="w-4 h-4" />
                        Accept & Proceed
                    </Button>
                </div>

            </div>
        </div>
    );
};
