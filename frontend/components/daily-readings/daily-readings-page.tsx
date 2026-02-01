"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  getMassReadingsAction,
  saveReadingNoteAction,
  getReadingNoteAction,
} from "@/lib/actions/dailyReadingsActions";
import {
  formatDateForAPI,
  formatDateISO,
  type MassReading,
  type DailyReadingNote,
} from "@/lib/services/dailyReadingsService";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Helper function to decode HTML entities
const decodeHtmlEntities = (text: string): string => {
  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = text;
    return textarea.value;
  }
  // Server-side fallback
  return text
    .replace(/&#x2010;/g, "–")
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
};

export default function DailyReadingsPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id ? parseInt(session.user.id) : null;

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [readings, setReadings] = useState<MassReading | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [savedNote, setSavedNote] = useState<DailyReadingNote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load readings and notes for selected date
  useEffect(() => {
    const loadDailyContent = async () => {
      setIsLoading(true);
      setError(null);
      setSaveSuccess(false);

      try {
        // Fetch Mass readings (available to all users)
        const dateString = formatDateForAPI(selectedDate);
        const readingsData = await getMassReadingsAction(dateString);
        setReadings(readingsData);

        // Fetch existing note for this date (only for authenticated users)
        if (userId) {
          const isoDate = formatDateISO(selectedDate);
          const existingNote = await getReadingNoteAction(userId, isoDate);
          setSavedNote(existingNote);
          setNotes(existingNote?.notes || "");
        }
      } catch (err) {
        console.error("Error loading daily content:", err);
        setError("Failed to load readings. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDailyContent();
  }, [selectedDate, userId]);

  const handleSaveNotes = async () => {
    if (!userId) {
      setError("You must be logged in to save notes.");
      return;
    }

    if (!notes.trim()) {
      setError("Please write some notes before saving.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const isoDate = formatDateISO(selectedDate);
      const savedData = await saveReadingNoteAction(userId, isoDate, notes);
      setSavedNote(savedData);
      setSaveSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving notes:", err);
      setError("Failed to save notes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    if (direction === "prev") {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday =
    format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      {/* Header with Date Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Daily Mass Readings</h1>
          <p className="text-muted-foreground mt-1">
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDate("prev")}
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDate("next")}
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {!isToday && (
            <Button variant="secondary" onClick={goToToday}>
              Today
            </Button>
          )}
        </div>
      </div>

      {/* Inspirational Quotes */}
      <Card className="border-l-4 border-l-primary">
        <CardContent>
          <blockquote className="space-y-4 italic text-muted-foreground">
            <p className="text-lg">
              &ldquo;I am not here to understand everything; I am here to be
              addressed and to respond faithfully.&rdquo;
            </p>
            <p className="text-lg">
              &ldquo;Speak, Lord—tell me what to do, not what to think.&rdquo;
            </p>
          </blockquote>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {saveSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            Your notes have been saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Readings Content */}
      {!isLoading && readings && (
        <div className="space-y-6">
          {/* First Reading */}
          {readings.Mass_R1 && (
            <Card>
              <CardHeader>
                <CardTitle>First Reading</CardTitle>
                {readings.Mass_R1.source && (
                  <p className="text-sm text-muted-foreground">
                    {decodeHtmlEntities(readings.Mass_R1.source)}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: readings.Mass_R1.text }}
                />
              </CardContent>
            </Card>
          )}

          {/* Responsorial Psalm */}
          {readings.Mass_Ps && (
            <Card>
              <CardHeader>
                <CardTitle>Responsorial Psalm</CardTitle>
                {readings.Mass_Ps.source && (
                  <p className="text-sm text-muted-foreground">
                    {decodeHtmlEntities(readings.Mass_Ps.source)}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: readings.Mass_Ps.text }}
                />
              </CardContent>
            </Card>
          )}

          {/* Second Reading */}
          {readings.Mass_R2 && (
            <Card>
              <CardHeader>
                <CardTitle>Second Reading</CardTitle>
                {readings.Mass_R2.source && (
                  <p className="text-sm text-muted-foreground">
                    {decodeHtmlEntities(readings.Mass_R2.source)}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: readings.Mass_R2.text }}
                />
              </CardContent>
            </Card>
          )}

          {/* Gospel */}
          {readings.Mass_G && (
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle className="text-primary">Gospel</CardTitle>
                {readings.Mass_G.source && (
                  <p className="text-sm text-muted-foreground">
                    {decodeHtmlEntities(readings.Mass_G.source)}
                  </p>
                )}
                {readings.Mass_G.heading && (
                  <p className="text-sm font-semibold text-primary/80 italic">
                    {decodeHtmlEntities(readings.Mass_G.heading)}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: readings.Mass_G.text }}
                />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Notes Section */}
      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle>Your Reflections & Notes</CardTitle>
          <p className="text-sm text-muted-foreground">
            {session
              ? "Jot down your thoughts, prayers, and insights from today's readings"
              : "Sign in to save your reflections and view your past notes"}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {session ? (
            <>
              <Textarea
                placeholder="What is God speaking to you through these readings today?&#10;&#10;What action or response is being called for?&#10;&#10;How can you carry this message into your day?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-50 text-base"
                disabled={isLoading || isSaving}
              />

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {savedNote && (
                    <span>
                      Last saved: {format(new Date(savedNote.updatedAt), "PPp")}
                    </span>
                  )}
                </div>

                <Button
                  onClick={handleSaveNotes}
                  disabled={isSaving || isLoading || !notes.trim()}
                  className="gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Notes
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  Create an account or sign in to save your daily reflections
                  and build a personal journal of your spiritual journey.
                </p>
              </div>
              <Button
                onClick={() => signIn("google")}
                size="lg"
                className="gap-2"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Copyright/Attribution */}
      {readings && readings.copyright?.text && (
        <Card className="bg-muted/30">
          <CardContent>
            <div
              className="text-xs text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: readings.copyright.text }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
