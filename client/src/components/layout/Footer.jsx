import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { ShieldCheck, Scale, Globe } from 'lucide-react';

export default function Footer() {
  const [activeModal, setActiveModal] = useState(null); // 'privacy' | 'terms' | null

  return (
    <footer className="py-5 px-6 md:px-8 border-t border-white/5 bg-[#0a0d14] text-sm text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-4 transition-all">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-500">
        <Globe size={14} className="text-slate-600 animate-spin-slow" />
        <span>&copy; {new Date().getFullYear()} Akshay Software Technologies PVT LTD. All rights reserved.</span>
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={() => setActiveModal('privacy')}
          className="hover:text-white cursor-pointer transition-colors flex items-center gap-1.5 font-semibold text-xs tracking-wider uppercase focus:outline-none bg-transparent border-0 p-0"
        >
          <ShieldCheck size={14} />
          Privacy
        </button>
        <button
          onClick={() => setActiveModal('terms')}
          className="hover:text-white cursor-pointer transition-colors flex items-center gap-1.5 font-semibold text-xs tracking-wider uppercase focus:outline-none bg-transparent border-0 p-0"
        >
          <Scale size={14} />
          Terms
        </button>
      </div>

      {/* Privacy Policy Modal */}
      <Modal
        isOpen={activeModal === 'privacy'}
        onClose={() => setActiveModal(null)}
        title="Privacy Policy"
        size="lg"
      >
        <div className="space-y-6 text-slate-300 font-medium text-sm leading-relaxed">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-black">Last Updated: June 2026</p>
          
          <div className="space-y-2">
            <h4 className="text-base font-bold text-white uppercase tracking-wider">1. Information We Collect</h4>
            <p>
              We collect information to log and resolve your ticketing requests. This includes your name, corporate email address, employee code, department assignment, and support communication history.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-base font-bold text-white uppercase tracking-wider">2. Data Usage & Delegation</h4>
            <p>
              Your data is accessed solely for resolution services. Tickets and accompanying descriptions are shared with administrators, departments, and support professionals to execute help desk assignments.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-base font-bold text-white uppercase tracking-wider">3. Secure Communications & Files</h4>
            <p>
              Attached logs, config scripts, and screenshots are transmitted securely using hashed credentials. We protect file payloads on secure server storage accessible only to authenticated accounts.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-base font-bold text-white uppercase tracking-wider">4. Cookies and Sessions</h4>
            <p>
              We use strictly necessary sessionStorage entries to maintain secure JWT session states, and localStorage for theme choices (Light/Dark preferences) across device refreshes.
            </p>
          </div>
        </div>
      </Modal>

      {/* Terms of Service Modal */}
      <Modal
        isOpen={activeModal === 'terms'}
        onClose={() => setActiveModal(null)}
        title="Terms of Service"
        size="lg"
      >
        <div className="space-y-6 text-slate-300 font-medium text-sm leading-relaxed">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-black">Last Updated: June 2026</p>

          <div className="space-y-2">
            <h4 className="text-base font-bold text-white uppercase tracking-wider">1. Scope of Support Services</h4>
            <p>
              This portal provides support logging, routing algorithms, and ticketing logs under client frameworks. SLA response windows are calculated dynamically according to user priority metrics (Low, Medium, High).
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-base font-bold text-white uppercase tracking-wider">2. Payloads & Material Submissions</h4>
            <p>
              Users are strictly prohibited from submitting attachments containing harmful payloads, executables, malware, or plain text credentials. All files must strictly remain corporate-related support logs or configurations.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-base font-bold text-white uppercase tracking-wider">3. Authentication & Access</h4>
            <p>
              Accounts are tied to verified department codes. Attempting to bypass routing controls or access administrative screens without authorization will result in immediate suspension and alert logging.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-base font-bold text-white uppercase tracking-wider">4. Modifications to Terms</h4>
            <p>
              Akshay Software Technologies reserves the right to modify services, interfaces, or support SLAs. Continued utilization of the portal indicates compliance with the updated terms.
            </p>
          </div>
        </div>
      </Modal>
    </footer>
  );
}
