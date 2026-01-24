'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle, LayoutDashboard, Utensils, BarChart3, Users, Smartphone, ShieldCheck, Mail, Phone, MapPin, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

export default function LandingPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
//tt
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.type === 'email' ? 'email' : (e.target.placeholder === 'Jane' ? 'firstName' : (e.target.placeholder === 'Doe' ? 'lastName' : 'message'))]: e.target.value }));
    // Note: The above logic is a bit fragile due to reliance on placeholders. 
    // It's better to add 'name' attributes to inputs. I will add them in the next step.
    // Let's just assume I'll add name attributes.
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default if wrapped in form submit

    // Basic validation
    if (!formData.firstName || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post('http://localhost:3001/contact', formData);
      toast.success('Message sent! We will get back to you soon.');
      setFormData({ firstName: '', lastName: '', email: '', message: '' });
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Toaster position="top-center" />
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
              <a href="#contact" className="text-gray-600 hover:text-primary transition-colors">Contact</a>
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
              <div className="bg-gray-800 rounded-xl overflow-hidden aspect-video relative group">
                <Image
                  src="/images/dashboard-preview.png"
                  alt="Cloudex Dashboard Preview"
                  fill
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent pointer-events-none" />
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

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your restaurant's size and needs. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:shadow-xl transition-all relative">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Starter</h3>
              <p className="text-gray-500 mb-6">Perfect for small cafes and food trucks.</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">Free</span>
                <span className="text-gray-500">/14 days</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-gray-600">
                  <CheckCircle className="text-blue-500 w-5 h-5 flex-shrink-0" />
                  <span>1 POS Device</span>
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <CheckCircle className="text-blue-500 w-5 h-5 flex-shrink-0" />
                  <span>Basic Inventory</span>
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <CheckCircle className="text-blue-500 w-5 h-5 flex-shrink-0" />
                  <span>Email Support</span>
                </li>
              </ul>
              <Link href="/register" className="block w-full py-3 px-6 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl text-center hover:bg-gray-50 transition-colors">
                Start Free Trial
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-2xl relative transform md:-translate-y-4">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-500 to-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
                MOST POPULAR
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Professional</h3>
              <p className="text-gray-400 mb-6">For growing restaurants and bars.</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$49</span>
                <span className="text-gray-400">/mo</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-gray-300">
                  <CheckCircle className="text-blue-400 w-5 h-5 flex-shrink-0" />
                  <span>Unlimited Devices</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <CheckCircle className="text-blue-400 w-5 h-5 flex-shrink-0" />
                  <span>Advanced Inventory & Recipes</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <CheckCircle className="text-blue-400 w-5 h-5 flex-shrink-0" />
                  <span>KDS (Kitchen Display System)</span>
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <CheckCircle className="text-blue-400 w-5 h-5 flex-shrink-0" />
                  <span>Staff & Shift Management</span>
                </li>
              </ul>
              <Link href="/register" className="block w-full py-3 px-6 bg-blue-600 text-white font-bold rounded-xl text-center hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/50">
                Get Started
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:shadow-xl transition-all">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
              <p className="text-gray-500 mb-6">For chains and franchises.</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">Custom</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-gray-600">
                  <CheckCircle className="text-blue-500 w-5 h-5 flex-shrink-0" />
                  <span>All Pro Features</span>
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <CheckCircle className="text-blue-500 w-5 h-5 flex-shrink-0" />
                  <span>Multi-location Management</span>
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <CheckCircle className="text-blue-500 w-5 h-5 flex-shrink-0" />
                  <span>Dedicated Account Manager</span>
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <CheckCircle className="text-blue-500 w-5 h-5 flex-shrink-0" />
                  <span>Custom API Access</span>
                </li>
              </ul>
              <Link href="/contact" className="block w-full py-3 px-6 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl text-center hover:bg-gray-50 transition-colors">
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-24 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-bold mb-6">
                OUR MISSION
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Empowering Restaurants with <span className="text-blue-600">Intelligent Technology</span>
              </h2>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                At Cloudex, we believe that running a restaurant should be about passion and great food, not drowning in paperwork and disjointed systems.
              </p>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Founded in 2024 by a team of foodies and engineers, we set out to build the "operating system" for modern hospitality. Today, we help thousands of venues worldwide streamline their operations, reduce waste, and deliver exceptional guest experiences.
              </p>

              <div className="grid grid-cols-2 gap-8 border-t border-gray-200 pt-8">
                <div>
                  <h4 className="text-4xl font-extrabold text-blue-600 mb-2">2k+</h4>
                  <p className="text-gray-500 font-medium">Restaurants</p>
                </div>
                <div>
                  <h4 className="text-4xl font-extrabold text-purple-600 mb-2">99.9%</h4>
                  <p className="text-gray-500 font-medium">Uptime</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-bl from-blue-100 to-purple-100 rounded-3xl -z-10 transform translate-x-8 -translate-y-8"></div>
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 h-full min-h-[400px]">
                <div className="relative h-full w-full">
                  <Image
                    src="/images/team-at-work.jpg"
                    alt="Cloudex Powering Teams"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent flex items-end p-8">
                    <div>
                      <h3 className="text-white text-xl font-bold">Built for Teams</h3>
                      <p className="text-gray-200 mt-1">From the kitchen to the front of house.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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

      {/* Contact Us Section */}
      <section id="contact" className="py-24 bg-gray-950 text-white relative overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-600/10 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-1/4 h-full bg-purple-600/10 blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                Get in Touch
              </h2>
              <p className="text-gray-400 text-lg mb-12 leading-relaxed">
                Have questions about Cloudex? Our support team is here to help you 24/7.
                Whether you need a demo or technical assistance, reach out to us.
              </p>

              <div className="space-y-8">
                <div className="flex items-start gap-5 group">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors">
                    <Mail className="text-blue-400 w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">Email Support</h4>
                    <p className="text-gray-400">support@cloudex.com</p>
                    <p className="text-gray-500 text-sm">Response time: &lt; 2 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-5 group">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500/20 transition-colors">
                    <Phone className="text-purple-400 w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">Call Us</h4>
                    <p className="text-gray-400">+94 77 123 4567</p>
                    <p className="text-gray-500 text-sm">Mon-Fri, 9am - 6pm IST</p>
                  </div>
                </div>

                <div className="flex items-start gap-5 group">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                    <MapPin className="text-emerald-400 w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">Headquarters</h4>
                    <p className="text-gray-400">Level 4, Orion City, Baseline Road</p>
                    <p className="text-gray-500 text-sm">Colombo 09, Sri Lanka</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl"
            >
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600"
                      placeholder="Jane"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600"
                    placeholder="jane@company.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">Message</label>
                  <textarea
                    rows={4}
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600 resize-none"
                    placeholder="Tell us about your restaurant needs..."
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 group"
                >
                  {isSubmitting ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-gray-500 mt-4">
                  By sending this message, you agree to our <a href="#" className="underline hover:text-gray-300">Privacy Policy</a>.
                </p>
              </form>
            </motion.div>
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

