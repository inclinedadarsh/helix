"use client";

import { forwardRef, useRef } from "react";

import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import {
  SiClaude,
  SiGithub,
  SiGoogledocs,
  SiGooglegemini,
  SiGooglesheets,
  SiGithubcopilot,
  SiYoutube,
  SiReddit,
  SiX,
  SiWikipedia,
  SiGoogleslides,
} from "@icons-pack/react-simple-icons";
import Image from "next/image";
import { helixLogoMark } from "@/assets";
import { Headphones, Play } from "lucide-react";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-16 items-center justify-center rounded-full border-2 bg-white shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className,
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

// Random icon positions for background icons - all above the Helix logo
const randomIconPositions = [
  {
    icon: "youtube",
    x: "15%",
    y: "15%",
    scale: 0.8,
    rotation: -15,
    reverse: false,
  },
  {
    icon: "github",
    x: "85%",
    y: "10%",
    scale: 0.9,
    rotation: 20,
    reverse: true,
  },
  {
    icon: "docs",
    x: "10%",
    y: "25%",
    scale: 0.7,
    rotation: -10,
    reverse: false,
  },
  {
    icon: "sheets",
    x: "90%",
    y: "30%",
    scale: 0.8,
    rotation: 25,
    reverse: true,
  },
  {
    icon: "audio",
    x: "20%",
    y: "35%",
    scale: 0.9,
    rotation: -20,
    reverse: false,
  },
  {
    icon: "linkedin",
    x: "80%",
    y: "20%",
    scale: 0.8,
    rotation: 15,
    reverse: true,
  },
  {
    icon: "reddit",
    x: "5%",
    y: "40%",
    scale: 0.7,
    rotation: -25,
    reverse: false,
  },
  { icon: "x", x: "95%", y: "45%", scale: 0.8, rotation: 30, reverse: true },
  {
    icon: "wikipedia",
    x: "25%",
    y: "5%",
    scale: 0.6,
    rotation: -5,
    reverse: false,
  },
  {
    icon: "slides",
    x: "75%",
    y: "40%",
    scale: 0.8,
    rotation: 10,
    reverse: true,
  },
  {
    icon: "video",
    x: "60%",
    y: "8%",
    scale: 0.7,
    rotation: -30,
    reverse: true,
  },
];

export function HelixSupportSystem() {
  const containerRef = useRef<HTMLDivElement>(null);
  const helixRef = useRef<HTMLDivElement>(null);
  const copilotRef = useRef<HTMLDivElement>(null);
  const claudeRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  // Create individual refs for each random icon
  const youtubeRef = useRef<HTMLDivElement>(null);
  const githubRef = useRef<HTMLDivElement>(null);
  const docsRef = useRef<HTMLDivElement>(null);
  const sheetsRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLDivElement>(null);
  const linkedinRef = useRef<HTMLDivElement>(null);
  const redditRef = useRef<HTMLDivElement>(null);
  const xRef = useRef<HTMLDivElement>(null);
  const wikipediaRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);

  const randomIconRefs = [
    youtubeRef,
    githubRef,
    docsRef,
    sheetsRef,
    audioRef,
    linkedinRef,
    redditRef,
    xRef,
    wikipediaRef,
    slidesRef,
    videoRef,
  ];

  return (
    <div className="absolute inset-0 w-full h-full" ref={containerRef}>
      {/* Random background icons */}
      {randomIconPositions.map((pos, index) => (
        <div
          key={`${pos.icon}-${index}`}
          ref={randomIconRefs[index]}
          className="absolute z-10 flex items-center justify-center rounded-full border-2 bg-white shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]"
          style={{
            left: pos.x,
            top: pos.y,
            transform: `scale(${pos.scale}) rotate(${pos.rotation}deg)`,
            width: "64px",
            height: "64px",
          }}
        >
          {Icons[pos.icon as keyof typeof Icons]?.()}
        </div>
      ))}

      {/* Helix logo positioned below the dashboard button area */}
      <div className="absolute top-[80%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <Circle ref={helixRef} className="size-20">
          <Icons.helix />
        </Circle>
      </div>

      {/* Bottom three logos positioned below Helix logo with more spacing */}
      <div className="absolute top-[100%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="flex flex-row items-center justify-center gap-16">
          <Circle ref={copilotRef}>
            <Icons.githubcopilot />
          </Circle>
          <Circle ref={claudeRef}>
            <Icons.claude />
          </Circle>
          <Circle ref={cursorRef}>
            <Icons.cursor />
          </Circle>
        </div>
      </div>

      {/* Animated beams from random icons to Helix logo */}
      {randomIconPositions.map((pos, index) => (
        <AnimatedBeam
          key={`beam-${pos.icon}-${index}`}
          containerRef={containerRef}
          fromRef={randomIconRefs[index]}
          toRef={helixRef}
          delay={Math.random() * 3 + 3}
          duration={Math.random() * 3 + 7}
          pathColor="#94a3b8"
          reverse={pos.reverse}
          gradientStartColor="#FFF200"
          gradientStopColor="#FF5400"
        />
      ))}

      {/* Animated beams from Helix logo to bottom three logos */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={helixRef}
        toRef={copilotRef}
        reverse
        delay={Math.random() * 3 + 3}
        duration={12}
        gradientStartColor="#FFF200"
        gradientStopColor="#FF5400"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={helixRef}
        toRef={claudeRef}
        delay={Math.random() * 3 + 3}
        duration={12}
        reverse
        gradientStartColor="#FFF200"
        gradientStopColor="#FF5400"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={helixRef}
        toRef={cursorRef}
        delay={Math.random() * 3 + 3}
        duration={12}
        gradientStartColor="#FFF200"
        gradientStopColor="#FF5400"
      />
    </div>
  );
}

const Icons = {
  githubcopilot: () => <SiGithubcopilot color="default" size={30} />,
  claude: () => <SiClaude color="default" size={30} />,
  gemini: () => <SiGooglegemini color="#164EE9" size={30} />,
  helix: () => <Image src={helixLogoMark} alt="Helix Logo" className="w-10" />,
  youtube: () => <SiYoutube color="default" size={30} />,
  docs: () => <SiGoogledocs color="default" size={30} />,
  github: () => <SiGithub color="default" size={30} />,
  sheets: () => <SiGooglesheets color="default" size={30} />,
  audio: () => <Headphones size={28} />,
  linkedin: () => (
    <svg
      width="30"
      height="30"
      viewBox="0 0 382 382"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="LinkedIn"
    >
      <title>LinkedIn</title>
      <path
        d="M347.445,0H34.555C15.471,0,0,15.471,0,34.555v312.889C0,366.529,15.471,382,34.555,382h312.889C366.529,382,382,366.529,382,347.444V34.555C382,15.471,366.529,0,347.445,0z M118.207,329.844c0,5.554-4.502,10.056-10.056,10.056H65.345c-5.554,0-10.056-4.502-10.056-10.056V150.403c0-5.554,4.502-10.056,10.056-10.056h42.806c5.554,0,10.056,4.502,10.056,10.056V329.844z M86.748,123.432c-22.459,0-40.666-18.207-40.666-40.666S64.289,42.1,86.748,42.1s40.666,18.207,40.666,40.666S109.208,123.432,86.748,123.432z M341.91,330.654c0,5.106-4.14,9.246-9.246,9.246H286.73c-5.106,0-9.246-4.14-9.246-9.246v-84.168c0-12.556,3.683-55.021-32.813-55.021c-28.309,0-34.051,29.066-35.204,42.11v97.079c0,5.106-4.139,9.246-9.246,9.246h-44.426c-5.106,0-9.246-4.14-9.246-9.246V149.593c0-5.106,4.14-9.246,9.246-9.246h44.426c5.106,0,9.246,4.14,9.246,9.246v15.655c10.497-15.753,26.097-27.912,59.312-27.912c73.552,0,73.131,68.716,73.131,106.472L341.91,330.654L341.91,330.654z"
        fill="#0077B7"
      />
    </svg>
  ),
  reddit: () => <SiReddit color="default" size={30} />,
  x: () => <SiX color="default" size={30} />,
  wikipedia: () => <SiWikipedia color="default" size={30} />,
  slides: () => <SiGoogleslides size={30} color="default" />,
  video: () => <Play size={30} />,
  cursor: () => (
    <svg
      height="1em"
      style={{ flex: "none", lineHeight: "1" }}
      viewBox="0 0 24 24"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
      className="size-7"
    >
      <title>Cursor</title>
      <path
        d="M11.925 24l10.425-6-10.425-6L1.5 18l10.425 6z"
        fill="url(#lobe-icons-cursorundefined-fill-0)"
      ></path>
      <path
        d="M22.35 18V6L11.925 0v12l10.425 6z"
        fill="url(#lobe-icons-cursorundefined-fill-1)"
      ></path>
      <path
        d="M11.925 0L1.5 6v12l10.425-6V0z"
        fill="url(#lobe-icons-cursorundefined-fill-2)"
      ></path>
      <path d="M22.35 6L11.925 24V12L22.35 6z" fill="#555"></path>
      <path d="M22.35 6l-10.425 6L1.5 6h20.85z" fill="#000"></path>
      <defs>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="lobe-icons-cursorundefined-fill-0"
          x1="11.925"
          x2="11.925"
          y1="12"
          y2="24"
        >
          <stop offset=".16" stopColor="#000" stopOpacity=".39"></stop>
          <stop offset=".658" stopColor="#000" stopOpacity=".8"></stop>
        </linearGradient>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="lobe-icons-cursorundefined-fill-1"
          x1="22.35"
          x2="11.925"
          y1="6.037"
          y2="12.15"
        >
          <stop offset=".182" stopColor="#000" stopOpacity=".31"></stop>
          <stop offset=".715" stopColor="#000" stopOpacity="0"></stop>
        </linearGradient>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id="lobe-icons-cursorundefined-fill-2"
          x1="11.925"
          x2="1.5"
          y1="0"
          y2="18"
        >
          <stop stopColor="#000" stopOpacity=".6"></stop>
          <stop offset=".667" stopColor="#000" stopOpacity=".22"></stop>
        </linearGradient>
      </defs>
    </svg>
  ),
};
