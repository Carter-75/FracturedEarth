type ImagePromptPlaceholderProps = {
  label: string;
  ratioClassName?: string;
  className?: string;
};

export function ImagePromptPlaceholder({
  label,
  ratioClassName = 'aspect-[16/9]',
  className = '',
}: ImagePromptPlaceholderProps) {
  return (
    <div className={`fe-image-placeholder rounded-2xl p-3 ${className}`}>
      <div className={`w-full rounded-xl border border-white/10 bg-black/20 ${ratioClassName} flex items-center justify-center text-center`}>
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] fe-muted">AI Image Slot</p>
          <p className="mt-1 text-sm font-semibold text-amber-100">{label}</p>
        </div>
      </div>
    </div>
  );
}
