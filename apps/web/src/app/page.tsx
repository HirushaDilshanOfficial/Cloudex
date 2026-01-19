'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, LayoutDashboard, Utensils, BarChart3, Users, Smartphone, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Utensils className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                Cloudex
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-primary transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-primary transition-colors">Pricing</a>
              <a href="#about" className="text-gray-600 hover:text-primary transition-colors">About</a>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-gray-600 hover:text-primary font-medium transition-colors">
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-20 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-8 border border-blue-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            New: Advanced Inventory Management
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-8">
            The All-in-One POS for <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-600 to-purple-600">
              Modern Restaurants
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Streamline operations, boost sales, and delight customers with Cloudex.
            From tableside ordering to kitchen display systems, we've got you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 font-bold text-lg flex items-center gap-2"
            >
              Start Free Trial <ArrowRight size={20} />
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-bold text-lg"
            >
              View Demo
            </Link>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20 relative mx-auto max-w-5xl">
            <div className="bg-gray-900 rounded-2xl p-2 shadow-2xl border border-gray-800">
              <div className="bg-gray-800 rounded-xl overflow-hidden aspect-video relative">
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  {/* Placeholder for Dashboard Screenshot */}
                  <div className="text-center">
                    <LayoutDashboard size={64} className="mx-auto mb-4 opacity-50" />
                    <p>Dashboard Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to run your business</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to help you manage every aspect of your restaurant efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Smartphone className="text-blue-600" size={32} />,
                title: "Smart POS",
                desc: "Fast, intuitive point of sale that works on any device. Handle orders, payments, and tables with ease."
              },
              {
                icon: <BarChart3 className="text-purple-600" size={32} />,
                title: "Real-time Analytics",
                desc: "Track sales, inventory, and staff performance in real-time. Make data-driven decisions."
              },
              {
                icon: <Utensils className="text-green-600" size={32} />,
                title: "Kitchen Display",
                desc: "Send orders directly to the kitchen. Reduce errors and improve preparation times."
              },
              {
                icon: <Users className="text-orange-600" size={32} />,
                title: "Staff Management",
                desc: "Manage shifts, track attendance, and monitor performance of your entire team."
              },
              {
                icon: <LayoutDashboard className="text-pink-600" size={32} />,
                title: "Inventory Control",
                desc: "Track ingredients, manage recipes, and get low stock alerts automatically."
              },
              {
                icon: <ShieldCheck className="text-teal-600" size={32} />,
                title: "Secure & Reliable",
                desc: "Enterprise-grade security with daily backups. Your data is always safe and accessible."
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="mb-4 p-3 bg-gray-50 rounded-xl w-fit">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary rounded-3xl p-12 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-6 relative z-10">Ready to transform your restaurant?</h2>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto relative z-10">
              Join thousands of restaurants using Cloudex to grow their business. Start your 14-day free trial today.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors shadow-lg relative z-10"
            >
              Get Started Now <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Utensils className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white">Cloudex</span>
            </div>
            <p className="text-sm">
              The modern operating system for restaurants. Built for speed, reliability, and growth.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Features</a></li>
              <li><a href="#" className="hover:text-white">Pricing</a></li>
              <li><a href="#" className="hover:text-white">Integrations</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">About Us</a></li>
              <li><a href="#" className="hover:text-white">Careers</a></li>
              <li><a href="#" className="hover:text-white">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-800 text-center text-sm">
          © 2026 Cloudex Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
