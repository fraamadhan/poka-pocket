import { auth } from "@/auth";
import { redirect } from "next/navigation";
import LoginClient from "./LoginClient";

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { error } = await searchParams;
  const session = await auth();
  
  if (session?.user) {
    redirect("/dashboard");
  }
  
  return <LoginClient error={error} />;
}
