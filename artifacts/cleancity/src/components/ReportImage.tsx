import { useState } from "react";
import { ImageIcon } from "lucide-react";

function buildSrc(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  if (path.startsWith("/objects/")) {
    return `${base}/api/storage${path}`;
  }
  if (path.startsWith("/public-objects/")) {
    return `${base}/api/storage${path}`;
  }
  if (path.startsWith("/")) {
    return `${base}/api/storage${path}`;
  }
  return path;
}

export default function ReportImage({
  path,
  alt,
  className,
}: {
  path: string;
  alt: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);
  if (!path || errored) {
    return (
      <div
        className={`grid place-items-center bg-muted text-muted-foreground ${className ?? ""}`}
      >
        <ImageIcon className="h-6 w-6" />
      </div>
    );
  }
  return (
    <img
      src={buildSrc(path)}
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
      loading="lazy"
    />
  );
}
