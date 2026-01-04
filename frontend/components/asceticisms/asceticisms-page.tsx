"use client";

import { useEffect, useState } from "react";
import {
  getAsceticisms,
  getUserAsceticisms,
  joinAsceticism,
  logProgress,
  Asceticism,
  UserAsceticism,
} from "@/lib/services/asceticismService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Check, Plus, Flame, Activity } from "lucide-react";

const TEST_USER_ID = 1;

export default function AsceticismsPage() {
  const [templates, setTemplates] = useState<Asceticism[]>([]);
  const [myAsceticisms, setMyAsceticisms] = useState<UserAsceticism[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [all, mine] = await Promise.all([
        getAsceticisms(),
        getUserAsceticisms(TEST_USER_ID),
      ]);
      setTemplates(all);
      setMyAsceticisms(mine);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load asceticisms");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(id: number) {
    try {
      await joinAsceticism(TEST_USER_ID, id);
      toast.success("Joined asceticism!");
      fetchData();
    } catch (e) {
      toast.error("Failed to join.");
    }
  }

  async function handleLog(userAsceticismId: number) {
    const date = new Date().toISOString();
    try {
      await logProgress({
        userAsceticismId,
        date,
        completed: true,
      });
      toast.success("Progress logged for today!");
    } catch (e) {
      toast.error("Failed to log progress.");
    }
  }

  if (loading)
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );

  return (
    <div className="container mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-gradient-to-r from-amber-700 to-orange-500 bg-clip-text text-transparent">
          Asceticism
        </h1>
        <p className="text-muted-foreground text-lg">
          Discipline your body and soul through daily practices.
        </p>
      </div>

      <Tabs defaultValue="my-commitments" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="my-commitments">My Commitments</TabsTrigger>
          <TabsTrigger value="browse">Browse Practices</TabsTrigger>
        </TabsList>

        <TabsContent value="my-commitments" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myAsceticisms.map((ua) => (
              <Card
                key={ua.id}
                className="relative overflow-hidden border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-all"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Activity size={64} />
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge
                      variant="outline"
                      className="mb-2 bg-green-50 text-green-700 border-green-200"
                    >
                      {ua.asceticism?.category}
                    </Badge>
                  </div>
                  <CardTitle>{ua.asceticism?.title}</CardTitle>
                  <CardDescription>
                    Started on {new Date(ua.startDate).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {ua.asceticism?.description || "Daily practice."}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => handleLog(ua.id)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 shadow-sm"
                  >
                    <Check size={16} /> Log Complete
                  </Button>
                </CardFooter>
              </Card>
            ))}
            {myAsceticisms.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg text-muted-foreground">
                <Flame size={48} className="mb-4 text-orange-200" />
                <p>You haven't committed to any practices yet.</p>
                <p className="text-sm">
                  Switch to "Browse Practices" to get started.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="browse" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((t) => (
              <Card
                key={t.id}
                className="hover:border-primary/50 transition-colors"
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary">{t.category}</Badge>
                  </div>
                  <CardTitle className="text-xl">{t.title}</CardTitle>
                </CardHeader>
                <CardContent className="h-24">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {t.description || "No description available."}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => handleJoin(t.id)}
                    variant="default"
                    className="w-full gap-2"
                  >
                    <Plus size={16} /> Start Practice
                  </Button>
                </CardFooter>
              </Card>
            ))}
            {templates.length === 0 && (
              <div className="col-span-full text-center p-12 text-muted-foreground">
                <p>No templates found. Create one via API!</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
