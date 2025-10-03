"use client";

import { ArrowUpRight, ChevronRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DotPattern } from "@/components/ui/dot-pattern";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/navbar";
import { HelixSupportSystem } from "@/components/shiny";
import { SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="">
      <Navbar />
      <header className="bg-background relative flex h-[500px] w-full flex-col items-center justify-center overflow-hidden rounded-lg">
        <DotPattern
          className={cn(
            "[mask-image:radial-gradient(300px_circle_at_center,white,transparent)] ",
            "absolute top-0 left-0",
          )}
        />
        <Link
          href="#"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gradient-to-b from-white to-gray-100 flex gap-2 mb-16 border border-border rounded-lg px-2 py-1 text-sm items-center z-10 shadow-sm hover:bg-gray-50 transition-colors group"
        >
          🎉 <Separator orientation="vertical" className="" /> Checkout demo
          video{" "}
          <ChevronRight
            size={16}
            className="group-hover:translate-x-1 transition-transform"
          />
        </Link>
        <h1 className="text-7xl font-bold z-10">
          <span className="bg-gradient-to-br from-blue-500 to-blue-700 pl-4 pr-1 py-2 rounded-lg text-white shadow-lg">
            L1 Cache⚡
          </span>{" "}
          for your LLM!
        </h1>
        <p className="font-medium text-gray-800 z-10 mt-16 max-w-2xl text-center">
          Drop your files and links, and your LLM will never lose context. Some
          Drop your files and links, and your LLM will never lose context.
        </p>
        <SignedOut>
          <SignUpButton mode="modal">
            <Button
              className={cn(
                "font-bold mt-10 z-10 uppercase font-mono tracking-wide text-base cursor-pointer",
              )}
              variant="default"
              size="lg"
            >
              Create Account <ArrowUpRight />
            </Button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "font-bold mt-10 z-10 uppercase font-mono tracking-wide text-base",
            )}
          >
            Dashboard <ArrowUpRight />
          </Link>
        </SignedIn>
      </header>
      <HelixSupportSystem />
      <div className="h-[400px]"></div>
    </main>
  );
}
