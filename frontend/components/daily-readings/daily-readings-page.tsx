"use client";

import { useState, useEffect } from "react";
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
  getMassReadings,
  formatDateForAPI,
  formatDateISO,
  cleanHTML,
  saveReadingNote,
  getReadingNote,
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
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
};

export default function DailyReadingsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [readings, setReadings] = useState<MassReading | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [savedNote, setSavedNote] = useState<DailyReadingNote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // TODO: Replace with actual user ID from auth session
  const userId = 1;

  // Load readings and notes for selected date
  useEffect(() => {
    const loadDailyContent = async () => {
      setIsLoading(true);
      setError(null);
      setSaveSuccess(false);

      try {
        // Fetch Mass readings
        const dateString = formatDateForAPI(selectedDate);
        const readingsData = await getMassReadings(dateString);
        setReadings(readingsData);

        // Fetch existing note for this date
        const isoDate = formatDateISO(selectedDate);
        const existingNote = await getReadingNote(userId, isoDate);
        setSavedNote(existingNote);
        setNotes(existingNote?.notes || "");
      } catch (err) {
        console.error("Error loading daily content:", err);
        setError("Failed to load readings. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDailyContent();
  }, [selectedDate]);

  const handleSaveNotes = async () => {
    if (!notes.trim()) {
      setError("Please write some notes before saving.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const isoDate = formatDateISO(selectedDate);
      const savedData = await saveReadingNote(userId, isoDate, notes);
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
                  !selectedDate && "text-muted-foreground"
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
            Jot down your thoughts, prayers, and insights from today&apos;s
            readings
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
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
