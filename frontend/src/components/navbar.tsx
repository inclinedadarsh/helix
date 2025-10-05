import { helixLogo } from "@/assets";
import { cn } from "@/lib/utils";
import { SiGithub } from "@icons-pack/react-simple-icons";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
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
      <div className="flex items-center gap-6">
        <Image src={helixLogo} alt="Helix Logo" className="w-32 mr-8" />
        <Link
          href="https://github.com/inclinedadarsh/helix/tree/main/chrome_extension"
          className={cn(
            "uppercase font-mono tracking-wide flex gap-2 items-center font-medium text-sm px-2 py-1 rounded-md hover:bg-gray-100 transition-colors",
          )}
        >
          <Blocks size={16} /> Install Extension
        </Link>
        <Link
          href="https://github.com/inclinedadarsh/helix"
          className={cn(
            "uppercase font-mono tracking-wide flex gap-2 items-center font-medium text-sm px-2 py-1 rounded-md hover:bg-gray-100 transition-colors",
          )}
        >
          <SiGithub size={16} /> GitHub
        </Link>
      </div>
      <div className="flex gap-4 items-center">
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
