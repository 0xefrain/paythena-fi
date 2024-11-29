"use client";

import { RegisterCompany } from "~~/components/RegisterCompany";

export default function RegisterPage() {
  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5">
        <h1 className="text-center mb-8">
          <span className="block text-4xl font-bold">Register Company</span>
        </h1>
        <RegisterCompany />
      </div>
    </div>
  );
}