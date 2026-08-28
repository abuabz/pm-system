"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  mobile: z.string().min(10, "Invalid mobile number"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setError(null);
      await apiClient.post("/auth/register", data);
      router.push("/login?registered=true");
    } catch (err: any  ) {
      setError(err.response?.data?.message || "Failed to register");
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Sign up to start managing your projects"
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="space-y-1">
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-red-500">
                  {errors.name.message}
                </p>
              )}
            </div>
          </div>

        <div>
          <Label htmlFor="email">Email address</Label>
          <div className="mt-1">
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>
        
        <div>
          <Label htmlFor="mobile">Mobile Number</Label>
          <div className="mt-1">
            <Input id="mobile" type="tel" {...register("mobile")} />
            {errors.mobile && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.mobile.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="mt-1">
            <Input id="password" type="password" {...register("password")} />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>

        <div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Register"}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
