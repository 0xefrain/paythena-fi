"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { RegisterCompany } from "~~/components/RegisterCompany";

export default function Register() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-base-300 to-base-200">
        <div className="card bg-base-100 shadow-2xl p-8 max-w-lg w-full mx-4 border border-base-300">
          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Register Your Company
            </h2>

            {/* Description */}
            <div className="prose prose-sm mb-6">
              <p className="text-base-content/80">
                Start managing your payroll on the blockchain. Connect your wallet to register your company and add
                contributors.
              </p>
            </div>

            {/* Benefits */}
            <div className="bg-base-200 rounded-lg p-4 mb-6 w-full">
              <h3 className="font-semibold mb-2">What You ll Get:</h3>
              <ul className="text-sm text-left space-y-2">
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Automated payroll management
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Secure contributor management
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Treasury yield generation
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                className="btn btn-primary btn-wide"
                onClick={() => document.getElementById("wallet-btn")?.click()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Connect Wallet
              </button>
              <Link href="/" className="btn btn-outline">
                Return Home
              </Link>
            </div>

            {/* Help Text */}
            <p className="mt-6 text-xs text-base-content/60">
              Need help? Check out our documentation or contact our support team.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
                  <Link href="/" className="text-primary">
                    Home
                  </Link>
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
      </div>
    </div>
  );
}
