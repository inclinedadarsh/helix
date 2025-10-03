"use client";

import { useCallback, useState, useEffect } from "react";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Link as LinkIcon,
} from "lucide-react";
import {
  SiReddit,
  SiX,
  SiGithub,
  SiYoutube,
  SiWikipedia,
} from "@icons-pack/react-simple-icons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type ProcessFile = {
  new_name: string;
  old_name: string;
};

type ProcessStatus = {
  type: "completed" | "processing" | "failed";
  message: string;
};

type Process = {
  id: string;
  updated_at: string;
  created_at: string;
  finished_at: string | null;
  files: ProcessFile[];
  status: ProcessStatus;
};

type RecentProcessesResponse = {
  processes: Process[];
};

export default function RecentProcessesPage() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProcesses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/processes/recent", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Failed to load recent processes");
      }
      const data = (await response.json()) as RecentProcessesResponse;
      setProcesses(data.processes);
    } catch (e) {
      setError((e as Error).message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProcesses();
  }, [loadProcesses]);

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
    return <LinkIcon className="size-5 text-black" />;
  };

  const getStatusIcon = (status: ProcessStatus) => {
    switch (status.type) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "processing":
        return (
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
        );
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: ProcessStatus) => {
    switch (status.type) {
      case "completed":
        return "border-green-200 bg-green-50";
      case "processing":
        return "border-blue-200 bg-blue-50";
      case "failed":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    }
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  };

  const formatDuration = (createdAt: string, finishedAt: string | null) => {
    if (!finishedAt) return "In progress";
    const start = new Date(createdAt);
    const end = new Date(finishedAt);
    const diffInSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
    return `${diffInSeconds}s`;
  };

  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <div className="p-6 space-y-8 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Recent Processes</h1>
          <p className="text-muted-foreground">
            Latest 5 processing jobs and their status
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadProcesses()}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          <RefreshCw className="size-4 mr-2" /> Refresh
        </button>
      </div>

      {loading && (
        <div className="space-y-4">
          {["a", "b", "c", "d", "e"].map((key) => (
            <div key={key} className="p-6 border rounded-lg space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20 ml-auto" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
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

      {!loading && !error && processes.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            No recent processes
          </h3>
          <p className="text-sm text-muted-foreground">
            Upload files or add links to see processing history here
          </p>
        </div>
      )}

      {!loading && !error && processes.length > 0 && (
        <div className="space-y-4">
          {processes.map((process) => (
            <div
              key={process.id}
              className={cn(
                "p-6 border rounded-lg transition-all duration-200 hover:shadow-md",
                getStatusColor(process.status),
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(process.status)}
                  <div>
                    <div className="font-semibold capitalize">
                      {process.status.type}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatTimeAgo(process.updated_at)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {formatDuration(process.created_at, process.finished_at)}
                  </div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-medium text-muted-foreground">
                  Processed Files ({process.files.length})
                </div>
                <div className="space-y-2">
                  {process.files.map((file) => (
                    <div
                      key={file.old_name + file.new_name}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg border"
                    >
                      <div className="p-2 bg-gradient-to-b from-white to-gray-100 rounded-full border border-border flex-shrink-0">
                        {getLinkBrandIcon(file.old_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <div className="font-medium truncate text-blue-600">
                            {file.old_name}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {getDomainFromUrl(file.old_name)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          → {file.new_name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {process.status.message && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    {process.status.message}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
