import Spinner from "@/components/ui/Spinner";

export default function LoadingSpinner({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
      <Spinner size="lg" />
      <p className="mt-4 text-sm text-ink-muted">{label}</p>
    </div>
  );
}
