"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Plus, X, CheckCircle2, XCircle, TrendingUp, AlertCircle } from "lucide-react";
import { FlashcardCard } from "#/components/flashcard-card";
import { EmptyState } from "#/components/empty-state";
import { Button } from "#/components/ui/button";
import { Card, CardContent } from "#/components/ui/card";
import { FancyButton } from "#/components/ui/fancy-button";
import { Input } from "#/components/ui/input";
import { Skeleton } from "#/components/ui/skeleton";
import { api } from "../../../../../convex/_generated/api";

type UrlField = {
  id: string;
  value: string;
};

export default function FlashCardsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [urls, setUrls] = useState<UrlField[]>([{ id: crypto.randomUUID(), value: "" }]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Get flashcard sets from database
  const flashcards = useQuery(api.flashcard.getFlashcardSets);
  const stats = useQuery(api.flashcard.getUserFlashcardStats);
  const generateUrl = useMutation(api.files.generateUploadUrl);
  const createFlashcardSet = useMutation(api.flashcard.createFlashcardSetFromFile);
  const createFlashcardSetFromUrls = useMutation(api.flashcard.createFlashcardSetFromUrls);

  const [creationMethod, setCreationMethod] = useState<"file" | "url" | null>(null);
  const [title, setTitle] = useState("");

  const handleFileUpload = async (file: File) => {
    if (!title.trim()) {
      alert("Please enter a title for your flashcard set");
      return;
    }

    setIsUploading(true);
    try {
      // Step 1: Get upload URL
      const uploadUrl = await generateUrl();
      
      // Step 2: Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      const { storageId } = await result.json();
      
      // Step 3: Create flashcard set and trigger workflow
      await createFlashcardSet({
        title: title.trim(),
        sourceFileId: storageId,
        sourceFileName: file.name,
        sourceFileType: file.type,
        targetCount: 20,
      });
      
      // Reset form
      setShowCreateForm(false);
      setCreationMethod(null);
      setTitle("");
      setUploadedFile(null);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const addUrlField = () => {
    setUrls([...urls, { id: crypto.randomUUID(), value: "" }]);
  };

  const removeUrlField = (id: string) => {
    if (urls.length > 1) {
      setUrls(urls.filter((url) => url.id !== id));
    }
  };

  const updateUrl = (id: string, value: string) => {
    setUrls(urls.map((url) => (url.id === id ? { ...url, value } : url)));
  };

  const handleUrlSubmit = async () => {
    if (!title.trim()) {
      alert("Please enter a title for your flashcard set");
      return;
    }

    // Filter out empty URLs
    const validUrls = urls.filter((url) => url.value.trim() !== "").map((url) => url.value.trim());

    if (validUrls.length === 0) {
      alert("Please enter at least one URL");
      return;
    }

    setIsUploading(true);
    try {
      await createFlashcardSetFromUrls({
        title: title.trim(),
        sourceUrls: validUrls,
        targetCount: 20,
      });

      // Reset form
      setShowCreateForm(false);
      setCreationMethod(null);
      setTitle("");
      setUrls([{ id: crypto.randomUUID(), value: "" }]);
    } catch (error) {
      console.error("Error creating flashcards from URLs:", error);
      alert("Failed to create flashcards. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (showCreateForm) {
    return (
      <Card className="border-none shadow-none mt-6">
        <CardContent className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-medium text-black text-sm">Create Flashcards</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCreateForm(false);
                setCreationMethod(null);
              }}
              className="h-7 text-gray-500 hover:text-gray-900"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {creationMethod === null ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setCreationMethod("file")}
                className="flex w-full items-center gap-4 rounded-lg border border-gray-300 border-b-4 bg-white p-5 text-left transition-all hover:border-gray-200 hover:bg-gray-50 active:border-b-1 active:translate-y-1"
              >
                <div className="flex flex-1 items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <Plus className="h-5 w-5 text-black" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Upload File</div>
                    <div className="text-gray-500 text-sm">
                      PDF, document, or text file
                    </div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCreationMethod("url")}
                className="flex w-full items-center gap-4 rounded-lg border border-gray-300 border-b-4 bg-white p-5 text-left transition-all hover:border-gray-200 hover:bg-gray-50 active:border-b-1 active:translate-y-1"
              >
                <div className="flex flex-1 items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <Plus className="h-5 w-5 text-black" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">From URLs</div>
                    <div className="text-gray-500 text-sm">
                      Scrape content from web pages
                    </div>
                  </div>
                </div>
              </button>
            </div>
          ) : creationMethod === "file" ? (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCreationMethod(null)}
                className="mb-4 h-7 text-gray-500 hover:text-gray-900"
              >
                ← Back
              </Button>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-700">
                    Flashcard Set Title
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Biology Chapter 3"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label htmlFor="file" className="mb-2 block text-sm font-medium text-gray-700">
                    Upload PDF
                  </label>
                  <Input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadedFile(file);
                      }
                    }}
                    className="w-full"
                  />
                </div>
                {uploadedFile && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-sm text-gray-700">
                      Selected: <span className="font-medium">{uploadedFile.name}</span>
                    </p>
                  </div>
                )}
                <Button
                  onClick={() => uploadedFile && handleFileUpload(uploadedFile)}
                  disabled={!uploadedFile || !title.trim() || isUploading}
                  className="w-full rounded-lg border border-black/30 bg-black text-white hover:bg-black/90"
                >
                  {isUploading ? "Uploading & Generating..." : "Generate Flashcards"}
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCreationMethod(null)}
                className="mb-4 h-7 text-gray-500 hover:text-gray-900"
              >
                ← Back
              </Button>
              <div className="space-y-3">
                <div>
                  <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-700">
                    Flashcard Set Title
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Web Development Resources"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                {urls.map((url) => (
                  <div key={url.id} className="flex items-center gap-2">
                    <Input
                      type="url"
                      placeholder="https://example.com/article"
                      value={url.value}
                      onChange={(e) => updateUrl(url.id, e.target.value)}
                      className="flex-1"
                    />
                    {urls.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeUrlField(url.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addUrlField}
                  className="w-full"
                >
                  <Plus className="h-4 w-4" />
                  Add URL
                </Button>
                
                <Button
                  onClick={handleUrlSubmit}
                  disabled={!title.trim() || isUploading}
                  className="w-full rounded-lg border border-black/30 bg-black text-white hover:bg-black/90"
                >
                  {isUploading ? "Scraping & Generating..." : "Generate Flashcards"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-none mt-10">
      <CardContent className="px-6">
        {/* Stats Section */}
        {stats && stats.totalCards > 0 && (
          <div className="mb-6 grid grid-cols-4 gap-4">
            <div className="rounded-lg border bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-gray-600">Cards Studied</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalCards}</div>
            </div>
            
            <div className="rounded-lg border bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-gray-600">Correct</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.correctAnswers}</div>
            </div>
            
            <div className="rounded-lg border bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-xs font-medium text-gray-600">Incorrect</span>
              </div>
              <div className="text-2xl font-bold text-red-600">{stats.incorrectAnswers}</div>
            </div>
            
            <div className="rounded-lg border bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-medium text-gray-600">Accuracy</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">{stats.accuracy}%</div>
            </div>
            
            {stats.mostDifficultCard && (
              <div className="col-span-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-orange-900 mb-1">Most Challenging Card</div>
                    <div className="text-sm text-orange-800 mb-2">{stats.mostDifficultCard.question}</div>
                    <div className="flex gap-4 text-xs text-orange-700">
                      <span>❌ Failed: {stats.mostDifficultCard.incorrectCount} times</span>
                      <span>✓ Correct: {stats.mostDifficultCard.correctCount} times</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-medium text-black text-sm">Your Flashcards</h2>
          </div>
          <FancyButton
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 rounded-lg border border-black/30 bg-white h-7 px-2 py-2 font-medium text-black transition-all hover:bg-gray-50"
          >
            <span className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              Create New
            </span>
          </FancyButton>
        </div>
        {flashcards == null ? (
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-xl bg-white p-0">
                <Skeleton className="mb-3 h-22 w-full rounded-lg" />
                <Skeleton className="mb-2 h-2 w-3/4" />
                <Skeleton className="h-2 w-1/2" />
              </div>
            ))}
          </div>
        ) : flashcards.length === 0 ? (
          <EmptyState type="flashcards" />
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {flashcards.map((flashcard) => (
              <FlashcardCard key={flashcard._id} flashcard={flashcard} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
