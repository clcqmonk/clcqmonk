import React from 'react';

const PrivacyPage = ({ onBack }) => {
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
              <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <div className="prose prose-lg max-w-none">
            <div className="text-white space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
                <p className="text-white/80">Effective Date: January 1, 2024</p>
                <p className="text-white/80">Last Updated: {new Date().toLocaleDateString()}</p>
              </div>

              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-8">
                <h3 className="text-blue-400 font-bold mb-2">🔒 Your Privacy Matters</h3>
                <p className="text-white/90 text-sm">
                  We are committed to protecting your personal information and being transparent about how we collect, use, and share your data.
                </p>
              </div>

              <section>
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">1. Information We Collect</h2>
                
                <h3 className="text-lg font-semibold text-white mb-3">Personal Information:</h3>
                <div className="text-white/90 space-y-2 mb-4">
                  <p>• Full name and date of birth</p>
                  <p>• Email address and phone number</p>
                  <p>• Payment information (processed securely)</p>
                  <p>• Government ID for verification</p>
                  <p>• Address for prize delivery</p>
                </div>

                <h3 className="text-lg font-semibold text-white mb-3">Technical Information:</h3>
                <div className="text-white/90 space-y-2 mb-4">
                  <p>• IP address and device information</p>
                  <p>• Browser type and version</p>
                  <p>• Usage patterns and preferences</p>
                  <p>• Location data (if permitted)</p>
                </div>

                <h3 className="text-lg font-semibold text-white mb-3">Transaction Data:</h3>
                <div className="text-white/90 space-y-2">
                  <p>• Purchase history and ticket information</p>
                  <p>• Payment method and transaction records</p>
                  <p>• Win/loss records</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">2. How We Use Your Information</h2>
                <div className="text-white/90 space-y-2">
                  <p><strong>Account Management:</strong> Creating and maintaining your account</p>
                  <p><strong>Transaction Processing:</strong> Processing ticket purchases and prize distributions</p>
                  <p><strong>Communication:</strong> Sending notifications about draws, wins, and platform updates</p>
                  <p><strong>Security:</strong> Preventing fraud and ensuring fair play</p>
                  <p><strong>Legal Compliance:</strong> Meeting regulatory and legal requirements</p>
                  <p><strong>Service Improvement:</strong> Analyzing usage to improve our platform</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">3. Information Sharing</h2>
                <div className="text-white/90 space-y-4">
                  <p><strong>We DO NOT sell your personal information to third parties.</strong></p>
                  
                  <p><strong>We may share information with:</strong></p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Payment processors for transaction processing</li>
                    <li>Legal authorities when required by law</li>
                    <li>Service providers who help operate our platform</li>
                    <li>Auditors for transparency and compliance</li>
                  </ul>

                  <p><strong>Winner Information:</strong> Winner names (with privacy protection) may be displayed publicly for transparency.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">4. Data Security</h2>
                <div className="text-white/90 space-y-2">
                  <p>We implement multiple layers of security to protect your data:</p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>SSL encryption for all data transmission</li>
                    <li>Secure database storage with encryption</li>
                    <li>Regular security audits and updates</li>
                    <li>Limited access controls for staff</li>
                    <li>Monitoring for suspicious activity</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">5. Your Privacy Rights</h2>
                <div className="text-white/90 space-y-2">
                  <p>You have the right to:</p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li><strong>Access:</strong> Request copies of your personal data</li>
                    <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                    <li><strong>Deletion:</strong> Request deletion of your data (subject to legal requirements)</li>
                    <li><strong>Portability:</strong> Request your data in a portable format</li>
                    <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">6. Cookies and Tracking</h2>
                <div className="text-white/90 space-y-2">
                  <p>We use cookies and similar technologies for:</p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Maintaining your login session</li>
                    <li>Remembering your preferences</li>
                    <li>Analyzing platform usage</li>
                    <li>Improving user experience</li>
                  </ul>
                  <p className="mt-4">You can control cookie settings in your browser preferences.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">7. Data Retention</h2>
                <div className="text-white/90 space-y-2">
                  <p>We retain your information for:</p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li><strong>Account Data:</strong> As long as your account is active</li>
                    <li><strong>Transaction Records:</strong> 7 years for legal and tax purposes</li>
                    <li><strong>Marketing Data:</strong> Until you unsubscribe</li>
                    <li><strong>Technical Data:</strong> 2 years for security purposes</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">8. Third-Party Services</h2>
                <div className="text-white/90 space-y-2">
                  <p>Our platform integrates with:</p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li><strong>Payment Processors:</strong> eSewa, Khalti (with their own privacy policies)</li>
                    <li><strong>Email Services:</strong> For notifications and communications</li>
                    <li><strong>Analytics Tools:</strong> To understand platform usage</li>
                  </ul>
                  <p className="mt-4">These services have their own privacy policies that govern their data practices.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">9. International Transfers</h2>
                <p className="text-white/90">
                  Your data is primarily stored and processed in Nepal. If we need to transfer data internationally, 
                  we ensure adequate protection measures are in place.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">10. Children's Privacy</h2>
                <p className="text-white/90">
                  Our platform is not intended for users under 18. We do not knowingly collect personal information 
                  from children. If we discover we have collected data from someone under 18, we will delete it immediately.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">11. Changes to This Policy</h2>
                <p className="text-white/90">
                  We may update this privacy policy periodically. Significant changes will be communicated via:
                </p>
                <ul className="list-disc ml-6 space-y-1 text-white/90">
                  <li>Email notifications to registered users</li>
                  <li>Prominent notices on our platform</li>
                  <li>Updated "Last Modified" date</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-yellow-400 mb-4">12. Contact Us</h2>
                <div className="text-white/90 space-y-2">
                  <p>For privacy-related questions or requests:</p>
                  <p><strong>Email:</strong> privacy@rafflektm360.com</p>
                  <p><strong>Phone:</strong> +977-1-XXXXXXX</p>
                  <p><strong>Address:</strong> Privacy Officer, RafflekTM360, Kathmandu, Nepal</p>
                  <p><strong>Response Time:</strong> We aim to respond within 7 business days</p>
                </div>
              </section>

              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-6 mt-8">
                <h3 className="text-green-400 font-bold mb-3">✅ Our Privacy Commitments</h3>
                <div className="text-white/90 text-sm space-y-2">
                  <p>• We will never sell your personal information</p>
                  <p>• We use industry-standard security measures</p>
                  <p>• We are transparent about our data practices</p>
                  <p>• We respect your privacy choices</p>
                  <p>• We comply with applicable privacy laws</p>
                </div>
              </div>

              <div className="text-center mt-8 pt-6 border-t border-white/20">
                <p className="text-white/60 text-sm">
                  By using RafflekTM360, you acknowledge that you have read and understood our Privacy Policy.
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

export default PrivacyPage;