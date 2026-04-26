import { LoaderCircle } from "lucide-react";

export function LoadingSpinner() {
  return (
    <div className="flex min-h-[30vh] items-center justify-center">
      <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
