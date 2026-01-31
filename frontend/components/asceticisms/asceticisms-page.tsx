"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, BarChart3 } from "lucide-react";
import CreateAsceticismForm from "./tabs/create-asceticism-form";
import ProgressDashboard from "./tabs/progress-dashboard";
import BrowseAsceticismTemplates from "./tabs/browse-asceticism-templates";
import MyCommitments from "./tabs/my-commitments";
import SignInPromptDialog from "./dialogs/sign-in-prompt-dialog";
import RemoveAsceticismDialog from "@/components/asceticisms/dialogs/remove-asceticism-dialog";

export default function AsceticismsPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:px-8 md:py-10 max-w-7xl">
      <div className="flex flex-col gap-3 mb-10">
        <h1 className="text-4xl font-bold lg:text-5xl">Asceticism</h1>
        <p className="text-muted-foreground text-lg">
          Discipline your body and soul through daily practices.
        </p>
      </div>

      <Tabs defaultValue="my-commitments" className="w-full">
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2 md:grid-cols-4 h-auto p-1">
          <TabsTrigger value="my-commitments" className="py-3 px-6">
            My Commitments
          </TabsTrigger>
          <TabsTrigger value="progress" className="gap-2 py-3 px-6">
            <BarChart3 className="h-4 w-4" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="browse" className="py-3 px-6">
            Browse Practices
          </TabsTrigger>
          <TabsTrigger value="create" className="gap-2 py-3 px-6">
            <Sparkles className="h-4 w-4" />
            Create
          </TabsTrigger>
        </TabsList>

        {/* My Commitments Tab */}
        <TabsContent value="my-commitments" className="mt-8 space-y-6">
          <MyCommitments />
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="mt-8">
          <ProgressDashboard />
        </TabsContent>

        {/* Browse Tab */}
        <TabsContent value="browse" className="mt-8">
          <BrowseAsceticismTemplates />
        </TabsContent>

        {/* Create Tab */}
        <TabsContent value="create" className="mt-8">
          <CreateAsceticismForm />
        </TabsContent>
      </Tabs>

      <SignInPromptDialog />
      {/*  This needs to be here since the MyCommitments and BrowseAsceticisms tabs both use it */}
      <RemoveAsceticismDialog />
    </div>
  );
}
