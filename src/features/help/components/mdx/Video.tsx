export function Video({ src, poster }: { src: string; poster?: string }) {
  const url = src.startsWith("/") ? src : `/help-assets/${src}`;
  return (
    <video controls preload="metadata" poster={poster} className="my-4 w-full rounded-md ring-1 ring-border">
      <source src={url} />
    </video>
  );
}
