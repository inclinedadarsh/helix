"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { AuroraText } from "@/components/ui/aurora-text";
import { InteractiveGridPattern } from "@/components/ui/interactive-grid-pattern";

export default function CTA() {
  return (
    <section className="bg-background relative mt-16 max-w-4xl mx-auto overflow-hidden rounded-lg border">
      <div className="relative z-10 flex flex-col items-center justify-center gap-10 px-6 py-12 text-center">
        <h2 className="text-4xl font-bold md:text-5xl">
          When AI Starts to
          <br />
          <AuroraText>Remember You</AuroraText>
        </h2>

        <div className="flex items-center gap-4">
          <SignedOut>
            <SignUpButton mode="modal">
              <Button
                className={cn(
                  "font-bold uppercase font-mono tracking-wide text-base cursor-pointer",
                )}
                size="lg"
              >
                Create Account
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "font-bold uppercase font-mono tracking-wide text-base",
              )}
            >
              Dashboard
            </Link>
          </SignedIn>
        </div>
      </div>

      <InteractiveGridPattern
        className={cn(
          "[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12",
        )}
      />
    </section>
  );
}
