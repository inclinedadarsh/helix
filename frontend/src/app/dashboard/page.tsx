"use client";

import React from "react";
import {
  SiReddit,
  SiX,
  SiGithub,
  SiYoutube,
  SiGoogledocs,
  SiGooglesheets,
  SiWikipedia,
} from "@icons-pack/react-simple-icons";
import {
  Download,
  ExternalLink,
  FileArchive,
  FileAudio,
  FileCode,
  FileVideo,
  File as FileGeneric,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  RefreshCw,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type DocItem = {
  old_name: string;
  name: string;
  summary: string;
  tags: string[];
};

type FilesResponse = {
  docs: DocItem[];
  links: DocItem[];
  media: DocItem[];
};

function getFileExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return "";
  return filename.slice(dotIndex + 1).toLowerCase();
}

function FileTypeIcon({ ext, className }: { ext: string; className?: string }) {
  if (["pdf", "txt", "doc", "docx", "md", "rtf"].includes(ext)) {
    return <SiGoogledocs title="Doc" className={cn("size-5", className)} />;
  }
  if (["csv", "xlsx", "xls", "tsv"].includes(ext)) {
    return <SiGooglesheets title="Sheet" className={cn("size-5", className)} />;
  }
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
    return <ImageIcon className={cn("size-5", className)} />;
  }
  if (["mp4", "mov", "webm", "mkv"].includes(ext)) {
    return <FileVideo className={cn("size-5", className)} />;
  }
  if (["mp3", "wav", "aac", "flac"].includes(ext)) {
    return <FileAudio className={cn("size-5", className)} />;
  }
  if (["zip", "tar", "gz", "rar", "7z"].includes(ext)) {
    return <FileArchive className={cn("size-5", className)} />;
  }
  if (["js", "ts", "tsx", "py", "java", "go", "rb"].includes(ext)) {
    return <FileCode className={cn("size-5", className)} />;
  }
  return <FileGeneric className={cn("size-5", className)} />;
}

function LinkBrandIcon({ url }: { url: string }) {
  const u = url.toLowerCase();
  if (u.includes("twitter.com") || u.includes("x.com")) {
    return <SiX title="Twitter/X" className="size-4" color="default" />;
  }
  if (u.includes("reddit.com")) {
    return <SiReddit title="Reddit" className="size-4" color="default" />;
  }
  if (u.includes("github.com")) {
    return <SiGithub title="GitHub" className="size-4" color="default" />;
  }
  if (u.includes("youtube.com") || u.includes("youtu.be")) {
    return <SiYoutube title="YouTube" className="size-4" color="default" />;
  }
  if (u.includes("wikipedia.org")) {
    return <SiWikipedia title="Wikipedia" className="size-4" color="default" />;
  }
  return <LinkIcon className="size-4 text-black" />;
}

function getFileTypeColors(ext: string) {
  if (["csv", "xlsx", "xls", "tsv"].includes(ext)) {
    return {
      bg: "bg-gradient-to-br from-green-50 to-green-100",
      tagBg: "bg-green-500 text-white",
      iconColor: "text-green-600",
    };
  }
  if (["ppt", "pptx"].includes(ext)) {
    return {
      bg: "bg-gradient-to-br from-yellow-50 to-yellow-100",
      tagBg: "bg-yellow-500 text-white",
      iconColor: "text-yellow-600",
    };
  }
  if (["pdf", "txt", "doc", "docx", "md", "rtf"].includes(ext)) {
    return {
      bg: "bg-gradient-to-br from-red-50 to-red-100",
      tagBg: "bg-red-500 text-white",
      iconColor: "text-red-600",
    };
  }
  return {
    bg: "bg-gradient-to-br from-blue-50 to-blue-100",
    tagBg: "bg-blue-500 text-white",
    iconColor: "text-blue-600",
  };
}

function EmptyStateCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-muted-foreground/25 rounded-lg">
      <div className="bg-muted rounded-full p-4 mb-4">
        <Plus className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-muted-foreground mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        {description}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = React.useState<FilesResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [downloading, setDownloading] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/files", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load files");
      const json = (await res.json()) as FilesResponse;
      setData(json);
    } catch (e) {
      setError((e as Error).message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadFile = React.useCallback(
    async (fileName: string, fileType: "docs" | "media") => {
      setDownloading(fileName);
      try {
        const res = await fetch("/api/download", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file_name: fileName,
            file_type: fileType,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to download file");
        }

        // Get the filename from the Content-Disposition header or use the original name
        const contentDisposition = res.headers.get("content-disposition");
        let downloadFileName = fileName;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            downloadFileName = filenameMatch[1];
          }
        }

        // Create a blob from the response and trigger download
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = downloadFileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (e) {
        setError((e as Error).message || "Failed to download file");
      } finally {
        setDownloading(null);
      }
    },
    [],
  );

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          type="button"
          onClick={() => void load()}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          <RefreshCw className="size-4 mr-1" /> Refresh
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {["a", "b", "c", "d", "e", "f"].map((key) => (
            <div key={key} className="p-4 border rounded-lg space-y-3">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 border border-destructive rounded-lg bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      {!loading && data && (
        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-semibold mb-4">Files</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.docs && data.docs.length > 0 ? (
                data.docs.map((doc) => {
                  const ext = getFileExtension(doc.old_name);
                  const colors = getFileTypeColors(ext);
                  return (
                    <div
                      key={doc.name + doc.old_name}
                      className={cn(
                        "p-4 border rounded-lg flex flex-col h-full",
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <FileTypeIcon
                          ext={ext}
                          className={cn(colors.iconColor, "shrink-0")}
                        />
                        <div className="font-medium truncate" title={doc.name}>
                          {doc.name}
                        </div>
                        {ext && (
                          <span
                            className={cn(
                              "text-xs ml-auto rounded px-2 py-0.5 uppercase",
                              colors.tagBg,
                            )}
                          >
                            {ext}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {doc.summary}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {doc.tags?.map((t) => (
                          <span
                            key={t}
                            className="text-xs bg-muted rounded px-2 py-0.5"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="mt-auto flex gap-2">
                        <button
                          type="button"
                          onClick={() => downloadFile(doc.name, "docs")}
                          disabled={downloading === doc.name}
                          className={cn(buttonVariants({ variant: "default" }))}
                        >
                          <Download className="size-4 mr-1" />
                          {downloading === doc.name
                            ? "Downloading..."
                            : "Download"}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyStateCard
                  title="No files yet"
                  description="Upload some documents to get started. We support PDFs, Word docs, spreadsheets, and more!"
                />
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Media</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.media && data.media.length > 0 ? (
                data.media.map((m) => {
                  const ext = getFileExtension(m.old_name);
                  const isAudio = ["mp3", "wav", "aac", "flac"].includes(ext);
                  const isVideo = ["mp4", "mov", "webm", "mkv"].includes(ext);
                  return (
                    <div
                      key={m.name + m.old_name}
                      className="p-4 border rounded-lg flex flex-col h-full"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {isAudio ? (
                          <FileAudio className="size-5 shrink-0" />
                        ) : isVideo ? (
                          <FileVideo className="size-5 shrink-0" />
                        ) : (
                          <ImageIcon className="size-5 shrink-0" />
                        )}
                        <div className="font-medium truncate" title={m.name}>
                          {m.name}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {m.summary}
                      </p>
                      <div className="mt-auto flex gap-2">
                        <button
                          type="button"
                          onClick={() => downloadFile(m.name, "media")}
                          disabled={downloading === m.name}
                          className={cn(buttonVariants({ variant: "default" }))}
                        >
                          <Download className="size-4 mr-1" />
                          {downloading === m.name
                            ? "Downloading..."
                            : "Download"}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyStateCard
                  title="No media yet"
                  description="Add some images, videos, or audio files to see them here!"
                />
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.links && data.links.length > 0 ? (
                data.links.map((link) => (
                  <div
                    key={link.name + link.old_name}
                    className="p-4 border rounded-lg flex flex-col gap-3 h-full"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-b from-white to-gray-100 rounded-full border border-border">
                        <LinkBrandIcon url={link.old_name} />
                      </div>
                      <div
                        className="font-medium truncate"
                        title={link.old_name}
                      >
                        {link.old_name}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {link.summary}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {link.tags?.map((t) => (
                        <span
                          key={t}
                          className="text-xs bg-muted rounded px-2 py-0.5"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="mt-auto flex gap-2">
                      <a
                        href={link.old_name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(buttonVariants({ variant: "default" }))}
                      >
                        <ExternalLink className="size-4 mr-1" /> Visit
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          navigator.clipboard.writeText(link.old_name)
                        }
                        className={cn(buttonVariants({ variant: "outline" }))}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyStateCard
                  title="No links yet"
                  description="Save some web links to organize them here. We support Twitter, GitHub, YouTube, Wikipedia, and more!"
                />
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
