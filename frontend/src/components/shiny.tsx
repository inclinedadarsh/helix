"use client";

import React, { forwardRef, useRef } from "react";

import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import {
  SiClaude,
  SiGithub,
  SiGoogledocs,
  SiGoogledrive,
  SiGooglegemini,
  SiGooglesheets,
  SiNotion,
  SiOpenai,
  SiWhatsapp,
  SiYoutube,
} from "@icons-pack/react-simple-icons";
import Image from "next/image";
import { helixLogoMark } from "@/assets";
import { Headphones } from "lucide-react";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className,
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

export function HelixSupportSystem() {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);
  const div7Ref = useRef<HTMLDivElement>(null);
  const div8Ref = useRef<HTMLDivElement>(null);
  const div9Ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className="relative h-[400px] flex w-full items-center justify-center -mt-10"
      ref={containerRef}
    >
      <div className="flex size-full max-w-lg flex-col items-stretch justify-between gap-10">
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div1Ref}>
            <Icons.youtube />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div2Ref}>
            <Icons.github />
          </Circle>
          <Circle ref={div3Ref}>
            <Icons.claude />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div4Ref}>
            <Icons.docs />
          </Circle>
          <Circle ref={div5Ref} className="size-16">
            <Icons.helix />
          </Circle>
          <Circle ref={div6Ref}>
            <Icons.openai />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div7Ref}>
            <Icons.sheets />
          </Circle>
          <Circle ref={div8Ref}>
            <Icons.gemini />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div9Ref}>
            {/** biome-ignore lint/a11y/useMediaCaption: audio icon */}
            <Icons.audio />
          </Circle>
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div5Ref}
        reverse
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div5Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div5Ref}
        reverse
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div4Ref}
        toRef={div5Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div6Ref}
        toRef={div5Ref}
        reverse
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div7Ref}
        toRef={div5Ref}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div8Ref}
        toRef={div5Ref}
        reverse
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div9Ref}
        toRef={div5Ref}
        reverse
      />
    </div>
  );
}

const Icons = {
  openai: () => <SiOpenai color="#000000" />,
  claude: () => <SiClaude color="default" />,
  gemini: () => <SiGooglegemini color="#164EE9" />,
  helix: () => <Image src={helixLogoMark} alt="Helix Logo" />,
  youtube: () => <SiYoutube color="default" />,
  docs: () => <SiGoogledocs color="default" />,
  github: () => <SiGithub color="default" />,
  sheets: () => <SiGooglesheets color="default" />,
  audio: () => <Headphones />,
};
