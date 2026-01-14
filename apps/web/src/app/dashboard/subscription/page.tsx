import React from 'react';

import { CreditCard, Check } from 'lucide-react';

export default function SubscriptionPage() {
    return (
        <>
            <div className="max-w-4xl mx-auto text-center mb-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Upgrade Your Plan</h1>
                <p className="text-lg text-gray-600">Choose the perfect plan for your restaurant business.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {/* Basic Plan */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col">
                    <h3 className="text-xl font-semibold text-gray-900">Starter</h3>
                    <div className="mt-4 mb-8">
                        <span className="text-4xl font-bold text-gray-900">$29</span>
                        <span className="text-gray-500">/month</span>
                    </div>
                    <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex items-center gap-3 text-gray-600">
                            <Check size={20} className="text-green-500" />
                            <span>1 Outlet</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-600">
                            <Check size={20} className="text-green-500" />
                            <span>Basic POS</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-600">
                            <Check size={20} className="text-green-500" />
                            <span>5 Staff Members</span>
                        </li>
                    </ul>
                    <button className="w-full py-3 px-4 rounded-lg border-2 border-primary text-primary font-semibold hover:bg-primary/5 transition-colors">
                        Current Plan
                    </button>
                </div>

                {/* Pro Plan */}
                <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 p-8 flex flex-col transform scale-105 relative">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                        Most Popular
                    </div>
                    <h3 className="text-xl font-semibold text-white">Professional</h3>
                    <div className="mt-4 mb-8">
                        <span className="text-4xl font-bold text-white">$79</span>
                        <span className="text-slate-400">/month</span>
                    </div>
                    <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex items-center gap-3 text-slate-300">
                            <Check size={20} className="text-primary" />
                            <span>3 Outlets</span>
                        </li>
                        <li className="flex items-center gap-3 text-slate-300">
                            <Check size={20} className="text-primary" />
                            <span>Advanced POS & Inventory</span>
                        </li>
                        <li className="flex items-center gap-3 text-slate-300">
                            <Check size={20} className="text-primary" />
                            <span>Unlimited Staff</span>
                        </li>
                        <li className="flex items-center gap-3 text-slate-300">
                            <Check size={20} className="text-primary" />
                            <span>Analytics Dashboard</span>
                        </li>
                    </ul>
                    <button className="w-full py-3 px-4 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors">
                        Upgrade Now
                    </button>
                </div>

                {/* Enterprise Plan */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col">
                    <h3 className="text-xl font-semibold text-gray-900">Enterprise</h3>
                    <div className="mt-4 mb-8">
                        <span className="text-4xl font-bold text-gray-900">$199</span>
                        <span className="text-gray-500">/month</span>
                    </div>
                    <ul className="space-y-4 mb-8 flex-1">
                        <li className="flex items-center gap-3 text-gray-600">
                            <Check size={20} className="text-green-500" />
                            <span>Unlimited Outlets</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-600">
                            <Check size={20} className="text-green-500" />
                            <span>Custom Integrations</span>
                        </li>
                        <li className="flex items-center gap-3 text-gray-600">
                            <Check size={20} className="text-green-500" />
                            <span>24/7 Priority Support</span>
                        </li>
                    </ul>
                    <button className="w-full py-3 px-4 rounded-lg border-2 border-gray-200 text-gray-600 font-semibold hover:border-gray-300 hover:bg-gray-50 transition-colors">
                        Contact Sales
                    </button>
                </div>
            </div>
        </>
    );
}
