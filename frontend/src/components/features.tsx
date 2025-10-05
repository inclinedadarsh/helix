"use client";

import Image from "next/image";
import { AuroraText } from "@/components/ui/aurora-text";
import { ShineBorder } from "@/components/ui/shine-border";
import { cn } from "@/lib/utils";
import { cerebrasLogo, dockerLogo, metaLogo } from "@/assets";
import { StaticImageData } from "next/image";

export default function Features() {
  return (
    <section className="w-full py-24 mt-12">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center text-3xl md:text-4xl font-bold leading-tight">
          Build to be <AuroraText>fast</AuroraText>. Build to be{" "}
          <AuroraText>smart</AuroraText>.
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Card 1 */}
          <FeatureCard
            title="Super Fast"
            description="Powered by Cerebras inferencing, you go from drop to dialogue in about 15 seconds. Upload files or links. Ask anything. It just flies."
            logo={{ src: cerebrasLogo as StaticImageData, alt: "Cerebras" }}
            shineColors={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
          />

          {/* Card 2 */}
          <FeatureCard
            title="Upload Once, Use Anywhere"
            description="With the Docker MCP Gateway, connect your files to any LLM. One upload. Many agents. Zero friction."
            logo={{ src: dockerLogo as StaticImageData, alt: "Docker" }}
            shineColors={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
          />

          {/* Card 3 */}
          <FeatureCard
            title="Agent Search"
            description="With Meta Llama models, your agent hunts through your data, plans, and finds answers. It feels like magic."
            logo={{ src: metaLogo as StaticImageData, alt: "Meta" }}
            shineColors={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  title,
  description,
  logo,
  shineColors,
}: {
  title: string;
  description: string;
  logo: { src: StaticImageData; alt: string };
  shineColors: string[];
}) {
  return (
    <div className="relative rounded-xl bg-background px-12 py-12 h-full overflow-hidden">
      <ShineBorder shineColor={shineColors} />
      <div className="relative z-10 flex flex-col gap-4">
        <div className="h-10">
          <Image
            src={logo.src}
            alt={logo.alt}
            className={cn("w-20 object-contain mx-auto")}
          />
        </div>
        <h3 className="text-lg font-semibold text-center">{title}</h3>
        <p className="text-muted-foreground text-sm text-center">
          {description}
        </p>
      </div>
    </div>
  );
}
