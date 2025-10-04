"use client";

import { useCallback, useState } from "react";
import { Upload, X, File, CheckCircle, AlertCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import confetti from "canvas-confetti";

const ALLOWED_FILE_TYPES = [
  "pdf",
  "docx",
  "txt",
  "pptx",
  "xlsx",
  "csv",
  "doc",
  "md",
  "mp4",
  "mp3",
];

const MAX_FILES = 10;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

type FileWithPreview = {
  file: File;
  id: string;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
};

export default function UploadPage() {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = useCallback((file: File): string | null => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !ALLOWED_FILE_TYPES.includes(extension)) {
      return `File type .${extension} is not supported. Allowed types: ${ALLOWED_FILE_TYPES.join(", ")}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }
    return null;
  }, []);

  const handleFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const validFiles: FileWithPreview[] = [];
      const errors: string[] = [];

      fileArray.forEach((file) => {
        if (files.length + validFiles.length >= MAX_FILES) {
          errors.push(`Maximum ${MAX_FILES} files allowed`);
          return;
        }

        const error = validateFile(file);
        if (error) {
          errors.push(`${file.name}: ${error}`);
          return;
        }

        // Check for duplicates
        const isDuplicate = files.some(
          (f) => f.file.name === file.name && f.file.size === file.size,
        );
        if (isDuplicate) {
          errors.push(`${file.name}: File already added`);
          return;
        }

        validFiles.push({
          file,
          id: Math.random().toString(36).substr(2, 9),
          status: "pending",
        });
      });

      if (errors.length > 0) {
        toast.error(errors.join("\n"));
      }

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
      }
    },
    [files, validateFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        handleFiles(droppedFiles);
      }
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();

    files.forEach((fileWithPreview, index) => {
      formData.append(`file_${index}`, fileWithPreview.file);
    });

    try {
      // Update all files to uploading status
      setFiles((prev) =>
        prev.map((f) => ({ ...f, status: "uploading" as const })),
      );

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      // Update all files to success status
      setFiles((prev) =>
        prev.map((f) => ({ ...f, status: "success" as const })),
      );

      // Show success message
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.7 },
      });
      toast.success("Files uploaded successfully!");

      // Clear files after a delay
      setTimeout(() => {
        setFiles([]);
      }, 2000);
    } catch (error) {
      // Update all files to error status
      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          status: "error" as const,
          error: error instanceof Error ? error.message : "Upload failed",
        })),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (["pdf", "txt", "doc", "docx", "md"].includes(ext || "")) {
      return "📄";
    }
    if (["xlsx", "csv"].includes(ext || "")) {
      return "📊";
    }
    if (["pptx"].includes(ext || "")) {
      return "📽️";
    }
    if (["mp4"].includes(ext || "")) {
      return "🎥";
    }
    if (["mp3"].includes(ext || "")) {
      return "🎵";
    }
    return "📁";
  };

  const getStatusIcon = (status: FileWithPreview["status"]) => {
    switch (status) {
      case "uploading":
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
        );
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <File className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Upload Files</h1>
        <p className="text-muted-foreground">Upload up to {MAX_FILES} files.</p>
      </div>

      {/* Upload Area */}
      <section
        className={cn(
          "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
          isDragOver
            ? "border-blue-500 bg-blue-50"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          files.length > 0 && "border-green-500 bg-green-50",
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        aria-label="File upload drop zone"
      >
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Upload className="w-8 h-8 text-muted-foreground" />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">
              {files.length > 0
                ? `${files.length} file${files.length === 1 ? "" : "s"} ready`
                : "Drop files here"}
            </h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop your files here, or click to browse
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              type="button"
              onClick={() => document.getElementById("file-upload")?.click()}
              className={cn(buttonVariants({ variant: "default" }))}
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Files
            </button>
            <input
              id="file-upload"
              type="file"
              multiple
              accept={ALLOWED_FILE_TYPES.map((ext) => `.${ext}`).join(",")}
              onChange={handleFileInput}
              className="hidden"
            />

            {files.length > 0 && (
              <button
                type="button"
                onClick={() => setFiles([])}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                <X className="w-4 h-4 mr-2" />
                Clear All
              </button>
            )}
          </div>
        </div>
      </section>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Selected Files</h3>
          <div className="space-y-2">
            {files.map((fileWithPreview) => (
              <div
                key={fileWithPreview.id}
                className={cn(
                  "flex items-center gap-4 p-4 border rounded-lg",
                  fileWithPreview.status === "success" &&
                    "border-green-200 bg-green-50",
                  fileWithPreview.status === "error" &&
                    "border-red-200 bg-red-50",
                )}
              >
                <div className="text-2xl">
                  {getFileIcon(fileWithPreview.file.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {fileWithPreview.file.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {(fileWithPreview.file.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                  {fileWithPreview.error && (
                    <div className="text-sm text-red-500 mt-1">
                      {fileWithPreview.error}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {getStatusIcon(fileWithPreview.status)}
                  {fileWithPreview.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => removeFile(fileWithPreview.id)}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Upload Button */}
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={uploadFiles}
              disabled={isUploading || files.some((f) => f.status === "error")}
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "px-8",
              )}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {files.length} file{files.length === 1 ? "" : "s"}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
