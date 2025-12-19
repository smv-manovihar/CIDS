"use client";

import { useState } from "react";
import Header from "@/components/header";
import ModelSelector from "@/components/model-selector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, PenTool, LayoutTemplate, Info } from "lucide-react";
import FileUploadSection from "@/components/file-upload-section";
import ManualEntryForm from "@/components/manual-entry-form";
import ColumnsDialog from "@/components/columns-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function InferencePage() {
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [showColumnsDialog, setShowColumnsDialog] = useState(false);

  const handleAnalysisComplete = (results: any) => {
    // Hook for future global state / logging
    console.log("Analysis complete:", results);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />
      
      {/* Center container with a max-width for better readability on large screens */}
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        
        {/* Page Hero Section */}
        <section className="mb-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2 md:max-w-2xl">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Analyze NetFlow traffic
              </h1>
              <p className="text-muted-foreground text-lg">
                Detect anomalies and threats in seconds using advanced ML models.
              </p>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center self-start md:self-center bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full gap-3">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
              <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                 System Ready
              </div>
            </div>
          </div>
        </section>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Actions (Takes up 8/12 columns) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Step 1: Model Selection */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">1</span>
                Configuration
              </div>
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle>Select Detection Model</CardTitle>
                  <CardDescription>
                    Choose the specific trained model architecture for this session.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ModelSelector onModelChange={setSelectedModel} />
                </CardContent>
              </Card>
            </section>

            {/* Step 2: Data Input */}
            <section className="space-y-3">
               <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">2</span>
                Data Ingestion
              </div>
              
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-0 border-b border-border/40 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Provide NetFlow Data</CardTitle>
                      <CardDescription className="mt-1">
                        Choose between bulk file processing or targeted manual entry.
                      </CardDescription>
                    </div>
                    {/* Contextual Action Button moved here for better alignment */}
                    <Button
                      onClick={() => setShowColumnsDialog(true)}
                      variant="outline"
                      size="sm"
                      className="gap-2 shrink-0"
                    >
                      <LayoutTemplate className="w-4 h-4" />
                      View Schema
                    </Button>
                  </div>

                  {/* Tabs List integrated into Header for cleaner look */}
                  <div className="mt-4">
                     <Tabs defaultValue="file" className="w-full">
                      <TabsList className="w-full sm:w-auto grid grid-cols-2 h-10 p-1 bg-muted/50 rounded-lg">
                        <TabsTrigger
                          value="file"
                          className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                        >
                          <Upload className="w-4 h-4" />
                          CSV Upload
                        </TabsTrigger>
                        <TabsTrigger
                          value="manual"
                          className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                        >
                          <PenTool className="w-4 h-4" />
                          Manual Entry
                        </TabsTrigger>
                      </TabsList>

                      <div className="py-6">
                        <TabsContent value="file" className="mt-0 focus-visible:outline-none">
                          <FileUploadSection
                            selectedModel={selectedModel}
                            onShowColumns={() => setShowColumnsDialog(true)}
                            onAnalysisComplete={handleAnalysisComplete}
                          />
                        </TabsContent>

                        <TabsContent value="manual" className="mt-0 focus-visible:outline-none">
                          <ManualEntryForm selectedModel={selectedModel} />
                        </TabsContent>
                      </div>
                    </Tabs>
                  </div>
                </CardHeader>
              </Card>
            </section>
          </div>

          {/* RIGHT COLUMN: Sidebar (Takes up 4/12 columns) */}
          {/* Sticky positioning makes it follow the user while scrolling long forms */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            
            {/* Guidance Card */}
            <Card className="bg-muted/30 border-muted-foreground/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Inference Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 text-sm">
                  <div className="font-mono font-bold text-muted-foreground">01</div>
                  <p className="text-muted-foreground leading-relaxed">
                    Ensure your CSV headers match the <button onClick={() => setShowColumnsDialog(true)} className="underline decoration-dotted hover:text-foreground">required schema</button> exactly.
                  </p>
                </div>
                <Separator className="bg-border/50" />
                <div className="flex gap-3 text-sm">
                  <div className="font-mono font-bold text-muted-foreground">02</div>
                  <p className="text-muted-foreground leading-relaxed">
                    Use manual entry to probe specific edge cases before running bulk analysis.
                  </p>
                </div>
                 <Separator className="bg-border/50" />
                <div className="flex gap-3 text-sm">
                  <div className="font-mono font-bold text-muted-foreground">03</div>
                  <p className="text-muted-foreground leading-relaxed">
                    Results marked <strong>Critical</strong> will automatically trigger alerts.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* State Summary */}
            <Card>
              <CardHeader className="pb-3 bg-muted/20">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Session Context
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid gap-4 text-sm">
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-muted-foreground">Selected Model</span>
                  <span className="font-medium text-right truncate" title={selectedModel}>
                    {selectedModel || <span className="text-muted-foreground italic">None</span>}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-muted-foreground">Schema Version</span>
                  <span className="font-mono text-right">v1.2.0</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <span className="text-muted-foreground">Engine Status</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium text-right">Online</span>
                </div>
              </CardContent>
            </Card>
          </aside>

        </div>
      </div>

      <ColumnsDialog
        open={showColumnsDialog}
        onOpenChange={setShowColumnsDialog}
      />
    </main>
  );
}