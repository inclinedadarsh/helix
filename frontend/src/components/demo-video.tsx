import { HeroVideoDialog } from "@/components/ui/hero-video-dialog";

export function DemoVideo() {
  return (
    <div className="relative max-w-4xl mx-auto">
      <HeroVideoDialog
        className="block dark:hidden"
        animationStyle="from-center"
        videoSrc="https://www.youtube.com/embed/q812NCfpZqg?si=GGfcK5qsJOq2uaC4"
        thumbnailSrc="https://github.com/inclinedadarsh/helix/raw/main/assets/dashboard.png"
        thumbnailAlt="Hero Video"
      />
      <HeroVideoDialog
        className="hidden dark:block"
        animationStyle="from-center"
        videoSrc="https://www.youtube.com/embed/q812NCfpZqg?si=GGfcK5qsJOq2uaC4"
        thumbnailSrc="https://github.com/inclinedadarsh/helix/raw/main/assets/dashboard.png"
        thumbnailAlt="Hero Video"
      />
    </div>
  );
}
