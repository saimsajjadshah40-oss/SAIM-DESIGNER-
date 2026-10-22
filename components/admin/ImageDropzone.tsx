"use client";

import { useId, useRef, useState } from "react";
import { CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageDropzoneProps {
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  label?: string;
  hint?: string;
  compact?: boolean;
  disabled?: boolean;
}

export function ImageDropzone({
  multiple = false,
  onFiles,
  label = "Drag & drop images here",
  hint = "JPG, JPEG, PNG or WebP · up to 10 MB each",
  compact = false,
  disabled = false,
}: ImageDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const take = (list: FileList | null) => {
    if (!list || disabled) return;
    const files = Array.from(list);
    onFiles(multiple ? files : files.slice(0, 1));
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        take(e.dataTransfer.files);
      }}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition",
        compact ? "gap-1 px-4 py-6" : "gap-2 px-6 py-10",
        over ? "border-electric bg-brand/10" : "border-line bg-ink/60 hover:border-slate-600",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <CloudUpload size={compact ? 22 : 30} className="text-glow" aria-hidden />
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="text-xs text-muted">{hint}</p>
      <label
        htmlFor={inputId}
        className="mt-2 cursor-pointer rounded-full border border-electric/50 px-4 py-1.5 text-sm font-semibold text-glow transition hover:bg-brand/20 focus-within:ring-2 focus-within:ring-electric"
      >
        Browse files
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => {
            take(e.target.files);
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
      </label>
    </div>
  );
}
