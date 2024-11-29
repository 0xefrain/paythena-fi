"use client";

import Link from "next/link";
import { RegisterCompany } from "~~/components/RegisterCompany";

export default function Register() {
  return (
    <div className="flex flex-col gap-8 p-4 max-w-[1024px] mx-auto">
      {/* Top Navigation Bar */}
      <div className="bg-base-200 rounded-box p-4 shadow-sm">
        <div className="flex items-center">
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold">Register Company</h1>
            <div className="text-sm breadcrumbs">
              <ul>
                <li>
                  <Link href="/" className="text-primary">Home</Link>
                </li>
                <li>Register Company</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Form Container */}
      <div className="bg-base-100 rounded-box p-6 shadow-lg">
        <RegisterCompany />
        <div className="divider"></div>
        <div className="flex justify-center mt-4">
          <Link 
            href="/" 
            className="btn btn-outline gap-2"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
              />
            </svg>
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}