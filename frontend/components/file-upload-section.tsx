"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Loader,
  AlertCircle,
  Download,
  FileText,
  FlaskConical,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SAMPLE_CSV_CONTENT } from "@/components/data/sample-csv";
import { Arrow } from "@radix-ui/react-select";

interface FileUploadSectionProps {
  selectedModel: string;
  onShowColumns?: () => void;
  onAnalysisComplete?: (result: AnalysisResult) => void;
}

interface AnalysisResult {
  filename: string;
  model_used: string;
  rows_analyzed: number;
  attacks_detected: number;
  attack_types: { type: string; count: number; confidence: number }[];
  analysis_time: number;
  csv_file: string;
}

export default function FileUploadSection({
  selectedModel,
  onShowColumns,
  onAnalysisComplete,
}: FileUploadSectionProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(
    null
  );
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
      : "http://localhost:8000";

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.name.endsWith(".csv")) {
      setFile(selectedFile);
      setUploadStatus("idle");
      setAnalysisResults(null);
      setPreviewData([]);
    }
  };

  const handleLoadSample = (e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: "text/csv" });
    const sampleFile = new File([blob], "NF_ToN_IoT_sample.csv", {
      type: "text/csv",
      lastModified: new Date().getTime(),
    });
    handleFileSelect(sampleFile);
  };

  const handleAnalyze = async () => {
    if (!file || !selectedModel) return;

    setIsLoading(true);
    setUploadStatus("idle");
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("model", selectedModel);

    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Analysis failed: ${res.status}`);
      }

      const data: AnalysisResult = await res.json();

      setAnalysisResults(data);
      if (onAnalysisComplete) {
        onAnalysisComplete(data);
      }

      if (data.csv_file) {
        const csvContent = atob(data.csv_file);
        const lines = csvContent.split("\n");
        const headers = lines[0].split(",");

        const preview = lines
          .slice(1, 6)
          .filter((line) => line.trim())
          .map((line) => {
            const vals = line.split(",");
            const obj: any = {};
            headers.forEach((h, i) => (obj[h.trim()] = vals[i]));
            return obj;
          });
        setPreviewData(preview);
      }

      setUploadStatus("success");
    } catch (err: any) {
      setUploadStatus("error");
      setError(err.message || "An unexpected error occurred during analysis");
      console.error("Analysis error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!analysisResults?.csv_file) return;
    const csvContent = atob(analysisResults.csv_file);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `analyzed_${analysisResults.filename}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetUpload = () => {
    setFile(null);
    setAnalysisResults(null);
    setPreviewData([]);
    setUploadStatus("idle");
    setError(null);
  };

  if (analysisResults && uploadStatus === "success") {
    return (
      <Card className="w-full animate-in fade-in zoom-in-95 duration-300 shadow-sm">
        <CardHeader className="pb-3 md:pb-6">
          {/* Mobile Friendly Header: Stacks vertically on small screens */}
          <CardTitle className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <span className="text-lg md:text-xl">Analysis Complete</span>
            <Button
              onClick={handleDownload}
              size="sm"
              className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export Result CSV</span>
              <span className="sm:hidden">Download CSV</span>
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 px-4 md:px-6">
          {/* Responsive Stats Grid: 1 col (xs), 2 cols (sm), 4 cols (md) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-sm bg-muted/30 p-3 md:p-4 rounded-lg border border-border/50">
            <div className="flex flex-row justify-between sm:flex-col items-center sm:items-start p-2 sm:p-0">
              <p className="text-muted-foreground">Flows Analyzed</p>
              <p className="text-lg md:text-xl font-bold">
                {analysisResults.rows_analyzed.toLocaleString()}
              </p>
            </div>
            <div className="flex flex-row justify-between sm:flex-col items-center sm:items-start p-2 sm:p-0 border-t sm:border-t-0 border-border/40">
              <p className="text-muted-foreground">Threats Found</p>
              <p className="text-lg md:text-xl font-bold text-red-500">
                {analysisResults.attacks_detected}
              </p>
            </div>
            <div className="flex flex-row justify-between sm:flex-col items-center sm:items-start p-2 sm:p-0 border-t sm:border-t-0 border-border/40">
              <p className="text-muted-foreground">Time Taken</p>
              <p className="text-lg md:text-xl font-bold">
                {analysisResults.analysis_time}s
              </p>
            </div>
            <div className="flex flex-row justify-between sm:flex-col items-center sm:items-start p-2 sm:p-0 border-t sm:border-t-0 border-border/40">
              <p className="text-muted-foreground">Model</p>
              <p
                className="text-lg md:text-xl font-bold truncate max-w-[120px] sm:max-w-none"
                title={analysisResults.model_used}
              >
                {analysisResults.model_used}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm md:text-base">
              <AlertCircle className="h-4 w-4" /> Threat Distribution
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {analysisResults.attack_types.map((attack, idx) => (
                <div
                  key={idx}
                  className="flex flex-col p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-md"
                >
                  <span className="font-medium text-red-700 dark:text-red-400 text-sm md:text-base truncate">
                    {attack.type}
                  </span>
                  <div className="flex justify-between items-end mt-1">
                    <span className="text-xs text-muted-foreground">
                      Conf: {Math.round(attack.confidence * 100)}%
                    </span>
                    <span className="text-lg font-bold">{attack.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {previewData.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm md:text-base">
                <FileText className="h-4 w-4" /> Data Preview (First 5 Rows)
              </h4>
              <div className="overflow-x-auto rounded-md border scrollbar-thin scrollbar-thumb-muted-foreground/20">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground text-xs uppercase whitespace-nowrap">
                    <tr>
                      <th className="px-3 py-2 md:px-4">Src IP</th>
                      <th className="px-3 py-2 md:px-4">Dst IP</th>
                      <th className="px-3 py-2 md:px-4">IN_PKTS</th>
                      <th className="px-3 py-2 md:px-4">Class</th>
                      <th className="px-3 py-2 md:px-4">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y whitespace-nowrap">
                    {previewData.map((row, i) => (
                      <tr key={i} className="hover:bg-muted/50">
                        <td className="px-3 py-2 md:px-4 font-mono text-xs md:text-sm">
                          {row["IPV4_SRC_ADDR"]}
                        </td>
                        <td className="px-3 py-2 md:px-4 font-mono text-xs md:text-sm">
                          {row["IPV4_DST_ADDR"]}
                        </td>
                        <td className="px-3 py-2 md:px-4 text-xs md:text-sm">
                          {row["IN_PKTS"]}
                        </td>
                        <td
                          className={`px-3 py-2 md:px-4 font-medium text-xs md:text-sm ${
                            row["Class"] === "Benign"
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {row["Class"]}
                        </td>
                        <td className="px-3 py-2 md:px-4 text-xs md:text-sm">
                          {(parseFloat(row["Confidence"]) * 100).toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 md:hidden text-center">
                Scroll horizontally to view more data
              </p>
            </div>
          )}

          <Button
            onClick={resetUpload}
            variant="outline"
            className="w-full h-11 md:h-10"
          >
            Analyze Another File
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${isDragActive ? "border-2 border-primary" : ""}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <Upload className="h-5 w-5" /> File Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 md:px-6">
        <div
          className="border-2 border-dashed border-border rounded-lg p-6 md:p-8 text-center hover:bg-accent/30 cursor-pointer transition-colors w-full group relative min-h-[220px] flex flex-col justify-center items-center"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) =>
              e.target.files && handleFileSelect(e.target.files[0])
            }
            className="hidden"
          />

          <div className="flex justify-center mb-4">
            <div className="p-3 bg-muted rounded-full group-hover:scale-110 transition-transform duration-200">
              <Upload className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
            </div>
          </div>

          <p className="font-medium mb-1 text-sm md:text-base">
            {file ? file.name : "Tap to upload or drag file"}
          </p>
          <p className="text-xs text-muted-foreground mb-8">
            {file
              ? `File ready • ${(file.size / 1024).toFixed(2)} KB`
              : "CSV files only (Max 10MB)"}
          </p>

          {!file && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLoadSample}
                className="h-8 text-xs gap-1.5 shadow-sm bg-background hover:bg-background/80 border px-4"
              >
                <FlaskConical className="w-3 h-3 text-amber-500" />
                Try with Demo Data
              </Button>
            </div>
          )}
        </div>

        {onShowColumns && (
          <Button
            onClick={onShowColumns}
            variant="ghost"
            size="sm"
            className="w-full mt-4 border-dashed text-xs text-muted-foreground h-auto py-2"
          >
            View Required Schema
          </Button>
        )}

        {file && (
          <div className="animate-in slide-in-from-bottom-2 fade-in">
            <Button
              onClick={handleAnalyze}
              disabled={isLoading || !selectedModel}
              className="w-full mt-4 font-semibold h-11 md:h-10 text-sm md:text-base whitespace-normal"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : selectedModel ? (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Run Analysis
                </>
              ) : (
                "Select a model to analyze"
              )}
            </Button>

            {!selectedModel && (
              <p className="text-[10px] text-center text-muted-foreground mt-2">
                (Scroll up to select a model first)
              </p>
            )}

            {error && uploadStatus === "error" && (
              <Alert variant="destructive" className="mt-4 text-left">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription className="text-xs md:text-sm mt-1">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
