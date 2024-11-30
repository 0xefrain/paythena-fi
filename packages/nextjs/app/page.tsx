"use client";

import Image from "next/image";
import Link from "next/link";
import { PaythenaLogo } from "~~/components/PaythenaLogo";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section with Dashboard Preview */}
      <section className="relative py-20 bg-gradient-to-b from-base-200 to-base-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="text-left">
              <h1 className="text-5xl font-bold mb-8">Decentralized Payroll System for Web3</h1>
              <p className="text-xl mb-8 opacity-80">
                Streamline your DAO or Web3 company payroll with automated USDe payments, yield generation, and
                salary-backed lending on Ethena Protocol.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="https://network.ethena.fi/bridge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-lg gap-2"
                >
                  <svg className="h-6 w-6" viewBox="0 0 1920 1920" fill="currentColor">
                    <path d="M959.8 730.9c-9.3 0-18.5 2.2-27 6.7L727.9 840.1c-16.7 8.9-27 26.1-27 44.9s10.3 36 27 44.9l204.9 102.5c8.5 4.5 17.7 6.7 27 6.7 9.3 0 18.5-2.2 27-6.7l204.9-102.5c16.7-8.9 27-26.1 27-44.9s-10.3-36-27-44.9L986.8 737.6c-8.5-4.5-17.7-6.7-27-6.7z" />
                    <path d="M959.8 0 331.8 334.2v669.3L959.8 1338l628-334.5V334.2L959.8 0zm0 1186.7L415.9 892.3V446.1l543.9-294.4 543.9 294.4v446.2l-543.9 294.4z" />
                  </svg>
                  Get USDe
                </a>
                <a
                  href="https://github.com/yourusername/paythena"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-lg gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  View on GitHub
                </a>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="badge badge-ghost gap-2">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Sepolia Network
                </div>
                <div className="badge badge-ghost gap-2">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  USDe Payments
                </div>
                <div className="badge badge-ghost gap-2">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  Ethena Protocol
                </div>
                <div className="badge badge-ghost gap-2">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <Link href="/docs" className="hover:underline">
                    Documentation
                  </Link>
                </div>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="relative lg:block">
              <div className="relative">
                {/* Shadow and Glow Effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary opacity-30 blur-2xl rounded-lg"></div>

                {/* Dashboard Image */}
                <div className="relative">
                  <div className="bg-base-300 rounded-lg shadow-2xl overflow-hidden border border-base-200">
                    <Image
                      src="/dashboard-preview.png"
                      alt="Paythena Dashboard Preview"
                      width={1200}
                      height={800}
                      className="w-full h-auto rounded-lg transform hover:scale-105 transition-transform duration-300"
                      priority
                    />
                  </div>

                  {/* Floating Badges */}
                  <div className="absolute -right-4 top-4 bg-base-100 p-2 rounded-lg shadow-lg border border-base-200 transform rotate-3">
                    <div className="badge badge-primary">Automated Payments</div>
                  </div>
                  <div className="absolute -left-4 bottom-4 bg-base-100 p-2 rounded-lg shadow-lg border border-base-200 transform -rotate-3">
                    <div className="badge badge-secondary">USDe Integration</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Access Options Section */}
      <section className="py-16 bg-base-100">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Choose Your Path</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Get USDe Box */}
            <div className="card bg-gradient-to-br from-blue-500 to-purple-600 text-white hover:scale-105 transition-transform duration-200">
              <div className="card-body items-center text-center">
                <svg className="w-16 h-16 mb-4" viewBox="0 0 1920 1920" fill="currentColor">
                  <path d="M959.8 730.9c-9.3 0-18.5 2.2-27 6.7L727.9 840.1c-16.7 8.9-27 26.1-27 44.9s10.3 36 27 44.9l204.9 102.5c8.5 4.5 17.7 6.7 27 6.7 9.3 0 18.5-2.2 27-6.7l204.9-102.5c16.7-8.9 27-26.1 27-44.9s-10.3-36-27-44.9L986.8 737.6c-8.5-4.5-17.7-6.7-27-6.7z" />
                  <path d="M959.8 0 331.8 334.2v669.3L959.8 1338l628-334.5V334.2L959.8 0zm0 1186.7L415.9 892.3V446.1l543.9-294.4 543.9 294.4v446.2l-543.9 294.4z" />
                </svg>
                <h3 className="card-title text-2xl mb-2">Get USDe</h3>
                <div className="divider my-2"></div>
                <ul className="text-left space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Bridge ETH to USDe
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Stable 1:1 with USD
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Ethena Protocol
                  </li>
                </ul>
                <a
                  href="https://network.ethena.fi/bridge"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost border-white text-white hover:bg-white hover:text-blue-500 btn-lg w-full"
                >
                  Bridge Now
                </a>
              </div>
            </div>

            {/* Company Box */}
            <div className="card bg-primary text-primary-content hover:scale-105 transition-transform duration-200">
              <div className="card-body items-center text-center">
                <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <h3 className="card-title text-2xl mb-2">Company Dashboard</h3>
                <div className="divider my-2"></div>
                <ul className="text-left space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Manage contributors
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Process payments
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Monitor treasury
                  </li>
                </ul>
                <Link href="/company" className="btn btn-secondary btn-lg w-full">
                  Access Dashboard
                </Link>
              </div>
            </div>

            {/* Contributor Box */}
            <div className="card bg-secondary text-secondary-content hover:scale-105 transition-transform duration-200">
              <div className="card-body items-center text-center">
                <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <h3 className="card-title text-2xl mb-2">Contributor Dashboard</h3>
                <div className="divider my-2"></div>
                <ul className="text-left space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    View payment history
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Access salary details
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Request loans
                  </li>
                </ul>
                <Link href="/contributor" className="btn btn-primary btn-lg w-full">
                  Access Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-base-100">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Core Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Payroll Management */}
            <div className="card bg-base-200">
              <div className="card-body">
                <svg className="w-10 h-10 text-primary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h3 className="card-title">Automated Payroll</h3>
                <p>Streamline salary payments with automated USDe distributions and configurable payment schedules.</p>
              </div>
            </div>

            {/* Yield Generation */}
            <div className="card bg-base-200">
              <div className="card-body">
                <svg className="w-10 h-10 text-primary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <h3 className="card-title">Yield Generation</h3>
                <p>
                  Generate yield on idle funds through Ethena protocol integration for both employers and contractors.
                </p>
              </div>
            </div>

            {/* Salary-Backed Lending */}
            <div className="card bg-base-200">
              <div className="card-body">
                <svg className="w-10 h-10 text-primary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="card-title">Salary-Backed Lending</h3>
                <p>Access loans backed by your future salary payments with automated repayment processing.</p>
              </div>
            </div>

            {/* Security */}
            <div className="card bg-base-200">
              <div className="card-body">
                <svg className="w-10 h-10 text-primary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <h3 className="card-title">Ethena-Backed Security</h3>
                <p>
                  Built on Ethena Protocol&apos;s robust infrastructure, ensuring institutional-grade security and
                  reliability for all transactions and funds.
                </p>
              </div>
            </div>

            {/* USDe Integration */}
            <div className="card bg-base-200">
              <div className="card-body">
                <svg className="w-10 h-10 text-primary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                <h3 className="card-title">USDe Integration</h3>
                <p>Seamless integration with Ethena USDe for stable and efficient payments.</p>
              </div>
            </div>

            {/* Management Dashboard */}
            <div className="card bg-base-200">
              <div className="card-body">
                <svg className="w-10 h-10 text-primary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
                <h3 className="card-title">Management Dashboard</h3>
                <p>Comprehensive dashboard for managing companies, contributors, and payments.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-base-200">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-8">Ready to Modernize Your Payroll?</h2>
          <p className="text-xl mb-8 opacity-80">Join the future of decentralized payroll management with Paythena.</p>
          <Link href="/register" className="btn btn-primary btn-lg">
            Register Your Company
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer footer-center p-10 bg-base-300 text-base-content">
        <div>
          <PaythenaLogo className="mb-4" />
          <p className="font-bold">Paythena - Web3 Payroll Solutions</p>
          <p className="opacity-80">Built on Ethena Protocol</p>
        </div>
      </footer>
    </div>
  );
}
