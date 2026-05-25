export function Screenshot({ src, alt, caption }: { src: string; alt?: string; caption?: string }) {
  const url = src.startsWith("/") ? src : `/help-assets/${src}`;
  return (
    <figure className="my-4">
      <img src={url} alt={alt ?? caption ?? ""} className="rounded-md ring-1 ring-border" />
      {caption ? <figcaption className="text-muted-foreground mt-1 text-xs">{caption}</figcaption> : null}
    </figure>
  );
}
