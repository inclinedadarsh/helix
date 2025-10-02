import { helixLogo } from "@/assets";
import { cn } from "@/lib/utils";
import { Github } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "./ui/button";

const Navbar = () => {
  return (
    <nav className="flex justify-between items-center max-w-7xl mx-auto mt-5 mb-2">
      <Image src={helixLogo} alt="Helix Logo" className="w-32" />
      <div className="flex gap-4 items-center">
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
          <Github /> GitHub
        </Link>
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "default" }), "font-bold")}
        >
          Try it out
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
