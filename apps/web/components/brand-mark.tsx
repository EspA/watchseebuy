type BrandMarkProps = {
  className?: string;
  alt?: string;
};

export function BrandMark({ className, alt = "" }: BrandMarkProps) {
  return (
    <img
      className={className}
      src="/brand-mark.png?v=16"
      alt={alt}
      width={512}
      height={512}
      decoding="async"
    />
  );
}
