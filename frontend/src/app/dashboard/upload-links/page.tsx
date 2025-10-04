"use client";

import { useCallback, useState } from "react";
import {
  Link,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Link2Icon,
} from "lucide-react";
import {
  SiReddit,
  SiX,
  SiGithub,
  SiYoutube,
  SiWikipedia,
} from "@icons-pack/react-simple-icons";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import confetti from "canvas-confetti";

type LinkItem = {
  id: string;
  url: string;
  status: "pending" | "processing" | "success" | "error";
  error?: string;
};

export default function UploadLinksPage() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const validateUrl = useCallback((url: string): string | null => {
    try {
      const urlObj = new URL(url);
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        return "URL must start with http:// or https://";
      }
      return null;
    } catch {
      return "Please enter a valid URL";
    }
  }, []);

  const addLink = useCallback(() => {
    if (!newUrl.trim()) return;

    const error = validateUrl(newUrl.trim());
    if (error) {
      toast.error(error);
      return;
    }

    // Check for duplicates
    const isDuplicate = links.some((link) => link.url === newUrl.trim());
    if (isDuplicate) {
      toast.error("This URL has already been added");
      return;
    }

    const newLink: LinkItem = {
      id: Math.random().toString(36).substr(2, 9),
      url: newUrl.trim(),
      status: "pending",
    };

    setLinks((prev) => [...prev, newLink]);
    setNewUrl("");
  }, [newUrl, links, validateUrl]);

  const removeLink = useCallback((id: string) => {
    setLinks((prev) => prev.filter((link) => link.id !== id));
  }, []);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addLink();
      }
    },
    [addLink],
  );

  const processLinks = async () => {
    if (links.length === 0) return;

    setIsProcessing(true);
    const urls = links.map((link) => link.url);

    try {
      // Update all links to processing status
      setLinks((prev) =>
        prev.map((link) => ({ ...link, status: "processing" as const })),
      );

      const response = await fetch("/api/process-urls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ urls }),
      });

      if (!response.ok) {
        throw new Error("Failed to process URLs");
      }

      // Update all links to success status
      setLinks((prev) =>
        prev.map((link) => ({ ...link, status: "success" as const })),
      );

      // Show success message
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.7 },
      });
      toast.success("Links processed successfully!");

      // Clear links after a delay
      setTimeout(() => {
        setLinks([]);
      }, 2000);
    } catch (error) {
      // Update all links to error status
      setLinks((prev) =>
        prev.map((link) => ({
          ...link,
          status: "error" as const,
          error: error instanceof Error ? error.message : "Processing failed",
        })),
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: LinkItem["status"]) => {
    switch (status) {
      case "processing":
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
        );
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Link className="h-4 w-4 text-gray-400" />;
    }
  };

  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const getLinkBrandIcon = (url: string) => {
    const u = url.toLowerCase();
    if (u.includes("twitter.com") || u.includes("x.com")) {
      return <SiX title="Twitter/X" className="size-5" color="default" />;
    }
    if (u.includes("reddit.com")) {
      return <SiReddit title="Reddit" className="size-5" color="default" />;
    }
    if (u.includes("github.com")) {
      return <SiGithub title="GitHub" className="size-5" color="default" />;
    }
    if (u.includes("youtube.com") || u.includes("youtu.be")) {
      return <SiYoutube title="YouTube" className="size-5" color="default" />;
    }
    if (u.includes("wikipedia.org")) {
      return (
        <SiWikipedia title="Wikipedia" className="size-5" color="default" />
      );
    }
    return <Link2Icon className="size-5 text-black" />;
  };

  return (
    <div className="p-6 space-y-8 w-full">
      <div>
        <h1 className="text-3xl font-bold mb-2">Upload Links</h1>
        <p className="text-muted-foreground">
          Add multiple URLs to process and analyze their content.
        </p>
      </div>

      {/* URL Input Section */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              type="url"
              placeholder="https://example.com"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-base"
            />
          </div>
          <button
            type="button"
            onClick={addLink}
            disabled={!newUrl.trim()}
            className={cn(
              buttonVariants({ variant: "default" }),
              "px-6",
              !newUrl.trim() && "opacity-50 cursor-not-allowed",
            )}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Link
          </button>
        </div>

        <div className="text-sm text-muted-foreground">
          Press Enter or click "Add Link" to add the URL to your list
        </div>
      </div>

      {/* Links List */}
      {links.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Links to Process ({links.length})
            </h3>
            <button
              type="button"
              onClick={() => setLinks([])}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <X className="w-4 h-4 mr-2" />
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {links.map((link) => (
              <div
                key={link.id}
                className={cn(
                  "flex flex-col gap-3 p-4 border rounded-lg",
                  link.status === "success" && "border-green-200 bg-green-50",
                  link.status === "error" && "border-red-200 bg-red-50",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(link.status)}
                    <span className="text-sm font-medium text-muted-foreground">
                      {getDomainFromUrl(link.url)}
                    </span>
                  </div>
                  {link.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => removeLink(link.id)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-b from-white to-gray-100 rounded-full border border-border flex-shrink-0">
                    {getLinkBrandIcon(link.url)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="font-medium truncate text-blue-600"
                      title={link.url}
                    >
                      {link.url}
                    </div>
                  </div>
                </div>

                {link.error && (
                  <div className="text-sm text-red-500">{link.error}</div>
                )}
              </div>
            ))}
          </div>

          {/* Process Button */}
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={processLinks}
              disabled={isProcessing || links.some((l) => l.status === "error")}
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "px-8",
              )}
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Link className="w-4 h-4 mr-2" />
                  Process {links.length} link{links.length === 1 ? "" : "s"}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {links.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Link className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            No links added yet
          </h3>
          <p className="text-sm text-muted-foreground">
            Start by adding URLs above to process their content
          </p>
        </div>
      )}
    </div>
  );
}
