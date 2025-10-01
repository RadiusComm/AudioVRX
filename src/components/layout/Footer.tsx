import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Linkedin, Github } from 'lucide-react';
import { Logo } from '../ui/Logo';

export const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-8 sm:mt-12">
      <div className="max-w-7xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
          <div className="col-span-1 md:col-span-2 text-center md:text-left">
            <div className="flex items-center">
              <Logo className="h-6 sm:h-8 w-auto mx-auto md:mx-0" />
            </div>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-md mx-auto md:mx-0">
              Elevate your conversation skills with AI-powered training role-plays. 
              Practice, receive feedback, and track your progress with our comprehensive platform.
            </p>
            <div className="mt-4 sm:mt-6 flex space-x-4 sm:space-x-6 justify-center md:justify-start">
              <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-5 w-5 sm:h-6 sm:w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="h-5 w-5 sm:h-6 sm:w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                <span className="sr-only">GitHub</span>
                <Github className="h-5 w-5 sm:h-6 sm:w-6" />
              </a>
            </div>
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-300 tracking-wider uppercase mb-3 sm:mb-4">Product</h3>
            <ul className="space-y-2 sm:space-y-4">
              <li>
                <Link to="/features" className="text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/role-plays" className="text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  Role-Play
                </Link>
              </li>
              <li>
                <Link to="/roadmap" className="text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  Roadmap
                </Link>
              </li>
            </ul>
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-300 tracking-wider uppercase mb-3 sm:mb-4">Company</h3>
            <ul className="space-y-2 sm:space-y-4">
              <li>
                <Link to="/about" className="text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm sm:text-base text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 sm:mt-12 border-t border-gray-200 dark:border-gray-800 pt-6 sm:pt-8">
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 text-center">
            &copy; {new Date().getFullYear()} AudioVR. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};