import React from 'react';

const TermsPage = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={onBack}
                className="mr-4 text-white hover:text-yellow-400 transition-colors"
              >
                ← Back to Home
              </button>
              <h1 className="text-2xl font-bold text-white">Terms & Conditions</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <div className="prose prose-lg max-w-none">
            <div className="text-white space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Terms & Conditions</h1>
                <p className="text-white/80">Effective Date: January 1, 2024</p>
                <p className="text-white/80">Last Updated: {new Date().toLocaleDateString()}</p>
              </div>

              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-8">
                <h3 className="text-yellow-400 font-bold mb-2">⚠️ Important Notice</h3>
                <p className="text-white/90 text-sm">
                  You must be 18 years or older to participate. Gambling can be addictive. 
                  Play responsibly and within your means.
                </p>
              </div>

              <section>
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">1. Acceptance of Terms</h2>
                <p className="text-white/90 mb-4">
                  By accessing and using RafflekTM360 ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">2. Eligibility Requirements</h2>
                <div className="text-white/90 space-y-2">
                  <p>• You must be at least 18 years of age</p>
                  <p>• You must be a legal resident of Nepal</p>
                  <p>• You must have a valid government-issued ID</p>
                  <p>• You must provide accurate and complete information</p>
                  <p>• You must have a valid email address and phone number</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">3. How Raffles Work</h2>
                <div className="text-white/90 space-y-4">
                  <p><strong>Ticket Purchase:</strong> You can purchase tickets for active raffles using the available payment methods.</p>
                  <p><strong>Draw Process:</strong> Winners are selected using a cryptographically secure random number generator to ensure fairness.</p>
                  <p><strong>Winner Notification:</strong> Winners will be notified via email and phone within 24 hours of the draw.</p>
                  <p><strong>Prize Collection:</strong> Prizes must be collected within 30 days of being declared the winner.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">4. Payment and Refunds</h2>
                <div className="text-white/90 space-y-2">
                  <p><strong>Payment Methods:</strong> We accept eSewa, Khalti, and other approved payment methods.</p>
                  <p><strong>Transaction Security:</strong> All payments are processed through secure, encrypted channels.</p>
                  <p><strong>Refund Policy:</strong> Ticket purchases are generally non-refundable except in the following cases:</p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Technical error resulting in duplicate charges</li>
                    <li>Raffle cancellation by RafflekTM360</li>
                    <li>Proven fraudulent activity</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">5. Prize Terms</h2>
                <div className="text-white/90 space-y-2">
                  <p>• All prizes are as described in the raffle listings</p>
                  <p>• Prizes cannot be exchanged for cash equivalent</p>
                  <p>• Winners are responsible for any applicable taxes</p>
                  <p>• Prize collection must be arranged within 30 days</p>
                  <p>• Valid ID required for prize collection</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">6. Fair Play and Transparency</h2>
                <div className="text-white/90 space-y-2">
                  <p>• All draws are conducted using cryptographically secure random selection</p>
                  <p>• Draw records are maintained for transparency and audit purposes</p>
                  <p>• Results cannot be altered once a draw is completed</p>
                  <p>• We reserve the right to investigate suspicious activity</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">7. Account Responsibilities</h2>
                <div className="text-white/90 space-y-2">
                  <p>• You are responsible for maintaining account security</p>
                  <p>• Do not share your login credentials</p>
                  <p>• Report suspicious activity immediately</p>
                  <p>• Keep your contact information updated</p>
                  <p>• One account per person</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">8. Prohibited Activities</h2>
                <div className="text-white/90 space-y-2">
                  <p>The following activities are strictly prohibited:</p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Creating multiple accounts</li>
                    <li>Using automated systems or bots</li>
                    <li>Attempting to manipulate draws or results</li>
                    <li>Providing false information</li>
                    <li>Money laundering or fraudulent activities</li>
                    <li>Reselling tickets to third parties</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">9. Responsible Gaming</h2>
                <div className="text-white/90 space-y-2">
                  <p>• Set spending limits and stick to them</p>
                  <p>• Never chase losses</p>
                  <p>• Take regular breaks from gaming</p>
                  <p>• Seek help if gambling becomes a problem</p>
                  <p>• Remember that raffles are games of chance</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">10. Limitation of Liability</h2>
                <p className="text-white/90">
                  RafflekTM360 shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of the platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">11. Modifications to Terms</h2>
                <p className="text-white/90">
                  We reserve the right to modify these terms at any time. Users will be notified of significant changes via email or platform notifications.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">12. Governing Law</h2>
                <p className="text-white/90">
                  These terms shall be governed by and construed in accordance with the laws of Nepal. Any disputes shall be resolved in the courts of Kathmandu, Nepal.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">13. Contact Information</h2>
                <div className="text-white/90 space-y-2">
                  <p>For questions about these terms or the platform:</p>
                  <p>• Email: support@rafflektm360.com</p>
                  <p>• Phone: +977-1-XXXXXXX</p>
                  <p>• Address: Kathmandu, Nepal</p>
                </div>
              </section>

              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 mt-8">
                <h3 className="text-red-400 font-bold mb-3">🚨 Important Disclaimers</h3>
                <div className="text-white/90 text-sm space-y-2">
                  <p>• Participation in raffles involves risk and no guarantee of winning</p>
                  <p>• Past results do not predict future outcomes</p>
                  <p>• RafflekTM360 is not responsible for technical issues beyond our control</p>
                  <p>• Winners may be subject to background verification</p>
                  <p>• We reserve the right to suspend or terminate accounts for violations</p>
                </div>
              </div>

              <div className="text-center mt-8 pt-6 border-t border-white/20">
                <p className="text-white/60 text-sm">
                  By using RafflekTM360, you acknowledge that you have read, understood, and agree to these Terms & Conditions.
                </p>
                <p className="text-white/60 text-sm mt-2">
                  Last updated: {new Date().toLocaleDateString()} • Version 1.0
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;