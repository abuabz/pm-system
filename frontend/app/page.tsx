"use client";

import { useAuthStore } from "@/store/use-auth-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (user?.role?.name === "Developer") {
      router.push('/projects');
    } else {
      router.push('/dashboard');
    }
  }, [user, router]);

  return null;
}
