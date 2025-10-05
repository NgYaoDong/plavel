"use client";

import { useRouter } from "next/navigation";
import { loginWithGoogle } from "@/lib/auth-actions";

interface AuthButtonProps {
  isLoggedIn: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function AuthButton({
  isLoggedIn,
  className,
  children,
}: AuthButtonProps) {
  const router = useRouter();

  const handleClick = async () => {
    if (isLoggedIn) {
      router.push("/trips");
    } else {
      await loginWithGoogle();
    }
  };

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
}