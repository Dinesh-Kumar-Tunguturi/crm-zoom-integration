import { Loader2 } from "lucide-react";
import { useLoading } from "../providers/LoadingContext";

export default function FullScreenLoader() {
  const { message } = useLoading();

  return (
    <div className="fixed inset-0 z-50 bg-white/80 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-gray-700">{message || "Loading, please wait..."}</p>
      </div>
    </div>
  );
}
