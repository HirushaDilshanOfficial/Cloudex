import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <Link href="/register" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 font-medium">
                    <ArrowLeft size={20} className="mr-2" /> Back to Registration
                </Link>

                <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
                <p className="text-gray-500 mb-8">Last Updated: January 20, 2026</p>

                <div className="prose prose-blue max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                        <p>
                            Welcome to Cloudex. By accessing our website and using our services, you agree to comply with and be bound by the following terms and conditions. If you do not agree to these terms, you should not use this website or our services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">2. Services</h2>
                        <p>
                            Cloudex provides a cloud-based Point of Sale (POS) and restaurant management system. We reserve the right to modify, suspend, or discontinue any part of the service at any time with or without notice.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
                        <p>
                            To access certain features, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">4. Data Protection and GDPR (EU Users)</h2>
                        <p>
                            We are committed to protecting your privacy and personal data in accordance with the General Data Protection Regulation (GDPR).
                        </p>
                        <ul className="list-disc pl-6 mt-4 space-y-2">
                            <li><strong>Data Controller:</strong> Cloudex Inc acts as the Data Controller for your account information.</li>
                            <li><strong>Data Processing:</strong> We process your data to provide our services, improve user experience, and comply with legal obligations.</li>
                            <li><strong>Your Rights:</strong> You have the right to access, rectify, delete, or restrict processing of your personal data. You can exercise these rights by contacting our support team.</li>
                            <li><strong>Data Transfer:</strong> Your data may be transferred to servers located outside the EEA. We ensure appropriate safeguards are in place for such transfers.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">5. Subscription and Payments</h2>
                        <p>
                            Cloudex operates on a subscription basis. You agree to pay the fees associated with your selected plan. Payments are non-refundable unless otherwise required by law.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">6. Right of Withdrawal (EU Consumers)</h2>
                        <p>
                            If you are a consumer based in the EU, you have the right to withdraw from this contract within 14 days without giving any reason. The withdrawal period will expire after 14 days from the start of your subscription. To exercise this right, please contact us.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">7. Limitation of Liability</h2>
                        <p>
                            To the fullest extent permitted by law, Cloudex shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">8. Dispute Resolution</h2>
                        <p>
                            These terms shall be governed by and construed in accordance with the laws of Sri Lanka, without regard to its conflict of law principles. For EU users, mandatory consumer protection laws of your country of residence may apply.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">9. Contact Us</h2>
                        <p>
                            If you have any questions about these Terms, please contact us at <a href="mailto:legal@cloudex.com" className="text-blue-600 hover:underline">legal@cloudex.com</a>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
