"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header";
import ModelSelector from "@/components/model-selector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, PenTool, LayoutTemplate, Sparkles, ShieldCheck, RefreshCw, WifiOff } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

// --- INTERNAL COMPONENT: Dynamic Health Check Badge ---
function SystemStatusBadge() {
  const [status, setStatus] = useState<'checking' | 'ready' | 'error'>('checking');

  const runHealthCheck = async () => {
    setStatus('checking');
    
    // SIMULATION: Dummy Health Check Logic
    try {
      // 1. Simulate Network Latency (1.5 seconds)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 2. Simulate Response
      const isBackendHealthy = true; 

      if (isBackendHealthy) {
        setStatus('ready');
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  if (status === 'checking') {
    return (
      <div className="flex items-center justify-center sm:justify-start bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-full gap-2 w-full sm:w-auto transition-all">
        <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" />
        <span className="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wide">
          Connecting...
        </span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <button 
        onClick={runHealthCheck}
        className="flex items-center justify-center sm:justify-start bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-full gap-2 w-full sm:w-auto hover:bg-destructive/20 transition-colors cursor-pointer group"
      >
        <WifiOff className="w-3 h-3 text-destructive" />
        <span className="text-xs font-medium text-destructive uppercase tracking-wide">
          System Offline <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 normal-case text-[10px]">(Retry)</span>
        </span>
      </button>
    );
  }

  // Default: Ready
  return (
    <div className="flex items-center justify-center sm:justify-start bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-full gap-2 w-full sm:w-auto animate-in fade-in zoom-in duration-300">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
        System Ready
      </span>
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function InferencePage() {
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [showColumnsDialog, setShowColumnsDialog] = useState(false);

  const handleAnalysisComplete = (results: any) => {
    console.log("Analysis complete:", results);
  };

  return (
    <main className="min-h-screen bg-background text-foreground pb-10">
      <Header />

      <div className="container mx-auto px-4 py-6 lg:py-10 max-w-6xl">
        
        {/* Hero Section */}
        <section className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Analyze NetFlow traffic
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Detect anomalies and threats in seconds using ML.
              </p>
            </div>

            {/* Dynamic Status Badge */}
            <SystemStatusBadge />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* MAIN COLUMN */}
          <div className="lg:col-span-8">
            <Card className="border-border/60 shadow-sm overflow-hidden">
              <CardHeader className="border-b border-border/40 bg-muted/5 pb-4 px-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Inference Console</CardTitle>
                    <CardDescription className="mt-1 text-xs sm:text-sm">
                      Configure parameters and analyze traffic patterns.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="bg-primary/5 border-b border-border/60 p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-5 sm:items-end sm:justify-between border-l-4 border-l-primary">
                  
                  {/* Model Selector Zone */}
                  <div className="space-y-2 w-full sm:w-[340px]">
                    <label className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      Step 1: Select Active Model
                    </label>
                    <div className="relative">
                      <ModelSelector onModelChange={setSelectedModel} />
                    </div>
                  </div>

                  <Button
                    onClick={() => setShowColumnsDialog(true)}
                    variant="outline"
                    className="w-full sm:w-auto shrink-0 gap-2 bg-background/50 hover:bg-background border-dashed text-muted-foreground hover:text-foreground h-10"
                  >
                    <LayoutTemplate className="w-4 h-4" />
                    Check Schema
                  </Button>
                </div>

                <div className="p-4 sm:p-6 space-y-4">
                  <Tabs defaultValue="file" className="w-full">
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                       <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-xs text-muted-foreground">2</span>
                          Choose Input Method
                       </span>
                       <TabsList className="h-9 p-1 bg-muted rounded-md w-full sm:w-auto grid grid-cols-2 sm:flex">
                        <TabsTrigger
                          value="file"
                          className="text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5 mr-2" />
                          CSV
                        </TabsTrigger>
                        <TabsTrigger
                          value="manual"
                          className="text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                        >
                          <PenTool className="w-3.5 h-3.5 mr-2" />
                          Manual
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="file" className="mt-0 focus-visible:outline-none animate-in fade-in-50 slide-in-from-left-1">
                       <FileUploadSection
                        selectedModel={selectedModel}
                        onShowColumns={() => setShowColumnsDialog(true)}
                        onAnalysisComplete={handleAnalysisComplete}
                      />
                    </TabsContent>

                    <TabsContent value="manual" className="mt-0 focus-visible:outline-none animate-in fade-in-50 slide-in-from-right-1">
                      <ManualEntryForm selectedModel={selectedModel} />
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="lg:col-span-4 lg:sticky lg:top-8 space-y-6">
            {/* Guidelines Card - Now the primary item in sidebar */}
            <Card>
              <CardHeader className="pb-3 px-4 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground px-4 sm:px-6">
                <p>
                  1. <strong>Strict Schema:</strong> Ensure headers match the{" "}
                  <button
                    onClick={() => setShowColumnsDialog(true)}
                    className="underline hover:text-foreground"
                  >
                    guidelines
                  </button>.
                </p>
                <Separator />
                <p>
                  2. <strong>Validation:</strong> Use manual entry to test edge cases before bulk upload.
                </p>
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