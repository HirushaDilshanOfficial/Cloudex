import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <Link href="/register" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 font-medium">
                    <ArrowLeft size={20} className="mr-2" /> Back to Registration
                </Link>

                <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
                <p className="text-gray-500 mb-8">Last Updated: January 20, 2026</p>

                <div className="prose prose-blue max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold mb-4">1. Overview</h2>
                        <p>
                            Cloudex ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website and services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Personal Information:</strong> Name, email address, phone number, restaurant name, and billing details provided during registration.</li>
                            <li><strong>Usage Data:</strong> Information about how you interact with our service, including IP address, browser type, and page visits.</li>
                            <li><strong>Cookies:</strong> We use cookies to manage sessions and store preferences.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">3. How We Use Your Data</h2>
                        <p>We use your personal data for the following purposes:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>To provide and maintain our services.</li>
                            <li>To prevent fraud and ensure security.</li>
                            <li>To communicate with you about updates and offers.</li>
                            <li>To comply with legal obligations.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">4. Legal Basis for Processing (GDPR)</h2>
                        <p>If you are from the European Economic Area (EEA), our legal basis for collecting and using your personal information depends on the Personal Information we collect and the specific context in which we collect it:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>We need to perform a contract with you.</li>
                            <li>You have given us permission to do so.</li>
                            <li>The processing is in our legitimate interests and it's not overridden by your rights.</li>
                            <li>To comply with the law.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">5. Data Retention</h2>
                        <p>
                            We act as data controllers for your account information and data processors for the content you create. We will retain your Personal Information only for as long as is necessary for the purposes set out in this Privacy Policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">6. Security</h2>
                        <p>
                            The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. We strive to use commercially acceptable means to protect your Personal Information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-4">7. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@cloudex.com" className="text-blue-600 hover:underline">privacy@cloudex.com</a>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
