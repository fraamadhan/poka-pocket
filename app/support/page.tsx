import type { Metadata } from "next";
import { auth } from "@/auth";
import SupportClient from "./SupportClient";

export const metadata: Metadata = {
  title: "Support & Feedback | Poka Pocket",
  description: "Send feedback, ask questions, or report bugs to the Poka Pocket team.",
};

export default async function SupportPage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return <SupportClient isLoggedIn={isLoggedIn} />;
}
