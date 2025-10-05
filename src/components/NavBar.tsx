"use client";

import { loginWithGitHub, loginWithGoogle, logout } from "@/lib/auth-actions";
import { Session } from "next-auth";
import Image from "next/image";
import Link from "next/link";

const GitHubIcon = () => (
  <svg
    className="w-6 h-6 mr-2"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.04-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.83 1.24 1.83 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.05.14 3.01.41 2.29-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.93.43.37.81 1.1.81 2.23 0 1.61-.02 2.91-.02 3.31 0 .32.22.69.83.57C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const GoogleIcon = () => (
  <span className="bg-white rounded-sm p-0.5 mr-2 flex items-center justify-center">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 533.5 544.3"
      className="w-4 h-4"
      aria-hidden
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M533.5 278.4c0-17.4-1.6-34.1-4.6-50.3H272v95.2h146.9c-6.3 34-25 62.7-53.3 81.9v67h86.2c50.6-46.6 81.7-115.4 81.7-193.8z"
      />
      <path
        fill="#34A853"
        d="M272 544.3c72.7 0 133.9-24 178.5-65.1l-86.2-67c-24 16.1-54.7 25.6-92.3 25.6-71.1 0-131.4-47.9-153-112.2h-89v70.6C74.4 486.2 167.3 544.3 272 544.3z"
      />
      <path
        fill="#FBBC05"
        d="M119 325.6c-10.6-31.8-10.6-66.1 0-97.9V157h-89c-37.4 74.8-37.4 163.5 0 238.3l89-69.7z"
      />
      <path
        fill="#EA4335"
        d="M272 106.1c39.6-.6 76.1 14.7 104.6 42.9l78.2-78.2C405.9 26 344.7 2 272 2 167.3 2 74.4 60.1 30 148.3l89 70.6C140.6 154.6 200.9 106.7 272 106.1z"
      />
    </svg>
  </span>
);

export default function NavBar({ session }: { session: Session | null }) {
  return (
    <nav className="bg-white shadow-md py-4 border-b border-gray-200">
      <div className="container mx-auto px-6 lg:px-8 flex justify-between items-center">
        <Link href="/">
          <Image
            src="/plavel_colourful.svg"
            alt="Logo"
            width={50}
            height={50}
          />
        </Link>
        <div className="flex-1 text-left px-5 text-gray-700">
          Plan your travel, with{" "}
          <span className="font-bold text-gray-600">Plavel.</span>
        </div>

        <div className="flex items-center space-x-4">
          {session ? (
            <>
              <Link
                href={"/trips"}
                className="text-slate-900 hover:text-sky-500"
              >
                My Trips
              </Link>
              <Link
                href={"/globe"}
                className="text-slate-900 hover:text-sky-500"
              >
                Globe
              </Link>
              <button
                className="flex items-center justify-center bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 hover:shadow-lg transition cursor-pointer"
                onClick={logout}
                aria-label="Sign out"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <button
                className="flex items-center justify-center bg-sky-500 text-white px-4 py-2 rounded hover:bg-sky-600 hover:shadow-lg transition cursor-pointer"
                onClick={loginWithGoogle}
                aria-label="Sign in with Google"
              >
                <GoogleIcon />
                Sign in
              </button>
              {/* <button
                className="flex items-center justify-center bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 hover:shadow-lg transition cursor-pointer"
                onClick={loginWithGitHub}
                aria-label="Sign in with GitHub"
              >
                <GitHubIcon />
                Sign in
              </button> */}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
