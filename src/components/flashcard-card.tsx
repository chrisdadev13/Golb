import { BookOpen } from "lucide-react";
import Link from "next/link";

type Flashcard = {
  _id: string;
  title: string;
  cardCount: number;
  _creationTime: number;
};

interface FlashcardCardProps {
  flashcard: Flashcard;
}

export function FlashcardCard({ flashcard }: FlashcardCardProps) {
  return (
    <Link key={flashcard._id} href={`/flashcard/${flashcard._id}`}>
      <div className="cursor-pointer rounded-lg border bg-white p-4 transition-all hover:shadow-md">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
          <BookOpen className="h-6 w-6 text-black" strokeWidth={1} />
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
    </Link>
  );
}
