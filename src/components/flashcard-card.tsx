import { BookOpen, Loader2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "#/components/ui/badge";

type Flashcard = {
  _id: string;
  title: string;
  cardCount: number;
  _creationTime: number;
  status: "processing" | "completed" | "failed";
};

interface FlashcardCardProps {
  flashcard: Flashcard;
}

const statusConfig = {
  processing: {
    label: "Processing",
    variant: "secondary" as const,
    icon: Loader2,
  },
  completed: {
    label: "Ready",
    variant: "default" as const,
    icon: null,
  },
  failed: {
    label: "Failed",
    variant: "destructive" as const,
    icon: null,
  },
};

export function FlashcardCard({ flashcard }: FlashcardCardProps) {
  const config = statusConfig[flashcard.status];
  const StatusIcon = config.icon;
  const isClickable = flashcard.status === "completed";

  const content = (
    <div className={`rounded-lg border bg-white p-4 transition-all ${isClickable ? "cursor-pointer hover:shadow-md" : "cursor-not-allowed opacity-60"}`}>
      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
          <BookOpen className="h-6 w-6 text-black" strokeWidth={1} />
        </div>
        <Badge variant={config.variant} className="flex items-center gap-1">
          {StatusIcon && <StatusIcon className="h-3 w-3 animate-spin" />}
          {config.label}
        </Badge>
      </div>
      <h3 className="mb-1 font-medium text-gray-900 text-sm line-clamp-1">
        {flashcard.title}
      </h3>
      <p className="mb-2 text-gray-500 text-xs">
        {flashcard.cardCount} cards
      </p>
      <p className="text-gray-400 text-xs">
        {new Date(flashcard._creationTime).toLocaleDateString()}
      </p>
    </div>
  );

  if (isClickable) {
    return (
      <Link key={flashcard._id} href={`/flashcard/${flashcard._id}`}>
        {content}
      </Link>
    );
  }

  return <div key={flashcard._id}>{content}</div>;
}
