import { useRef, useState } from "react";
import { useRequestUploadUrl } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PhotoUploader({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (objectPath: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { mutateAsync: requestUrl } = useRequestUploadUrl();

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please pick an image file.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum image size is 10 MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setPreviewUrl(URL.createObjectURL(file));
    try {
      const { uploadURL, objectPath } = await requestUrl({
        data: { name: file.name, size: file.size, contentType: file.type },
      });

      const putRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) {
        throw new Error(`Upload failed (${putRes.status})`);
      }

      onChange(objectPath);
      toast({ title: "Photo uploaded" });
    } catch (err) {
      console.error(err);
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
      setPreviewUrl(null);
      onChange(null);
    } finally {
      setUploading(false);
    }
  }

  function clear() {
    setPreviewUrl(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        data-testid="input-photo"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      {!value && !previewUrl && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-secondary/30 text-muted-foreground transition hover:border-primary hover:text-primary"
          data-testid="button-pick-photo"
        >
          <Camera className="h-8 w-8" />
          <span className="text-sm font-medium">Tap to take or upload a photo</span>
          <span className="text-xs">JPG, PNG up to 10 MB</span>
        </button>
      )}
      {(previewUrl || value) && (
        <div className="relative overflow-hidden rounded-xl border border-card-border">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="h-64 w-full object-cover"
            />
          ) : (
            <div className="grid h-64 w-full place-items-center bg-muted text-muted-foreground">
              Uploaded
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 grid place-items-center bg-background/70 text-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {!uploading && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute right-3 top-3 gap-1"
              onClick={clear}
              type="button"
              data-testid="button-remove-photo"
            >
              <X className="h-4 w-4" /> Remove
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
