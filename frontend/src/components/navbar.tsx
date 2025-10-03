import { helixLogo } from "@/assets";
import { cn } from "@/lib/utils";
import { SiGithub } from "@icons-pack/react-simple-icons";
import Image from "next/image";
import Link from "next/link";
import { Button, buttonVariants } from "./ui/button";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Blocks } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="flex justify-between items-center max-w-7xl mx-auto mt-5 mb-2">
      <Image src={helixLogo} alt="Helix Logo" className="w-32" />
      <div className="flex gap-4 items-center">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "font-bold uppercase font-mono tracking-wide",
          )}
        >
          <Blocks /> Install Extension
        </Link>
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "font-bold uppercase font-mono tracking-wide",
          )}
        >
          <SiGithub /> GitHub
        </Link>
        <SignedOut>
          <SignInButton mode="modal">
            <Button
              className={cn(
                "font-bold uppercase font-mono tracking-wide cursor-pointer",
              )}
              variant="outline"
            >
              Login
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button
              className={cn(
                "font-bold uppercase font-mono tracking-wide cursor-pointer",
              )}
              variant="default"
            >
              Create Account
            </Button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <Link href="/dashboard">
            <Button
              className={cn(
                "font-bold uppercase font-mono tracking-wide cursor-pointer",
              )}
              variant="default"
            >
              Dashboard
            </Button>
          </Link>
          <UserButton />
        </SignedIn>
      </div>
    </nav>
  );
};

export default Navbar;
