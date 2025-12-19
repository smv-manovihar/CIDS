"use client"

import React, { useState, useRef } from "react"
import { Upload, Loader, AlertCircle, Download, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface FileUploadSectionProps {
  selectedModel: string
  onShowColumns?: () => void
  onAnalysisComplete?: (result: AnalysisResult) => void
}

interface AnalysisResult {
  filename: string
  model_used: string
  rows_analyzed: number
  attacks_detected: number
  attack_types: { type: string; count: number; confidence: number }[]
  analysis_time: number
  csv_file: string
}

export default function FileUploadSection({
  selectedModel,
  onShowColumns,
  onAnalysisComplete,
}: FileUploadSectionProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null)
  const [previewData, setPreviewData] = useState<any[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const API_BASE =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
      : "http://localhost:8000"

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true)
    } else if (e.type === "dragleave") {
      setIsDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.name.endsWith(".csv")) {
      setFile(selectedFile)
      setUploadStatus("idle")
      setAnalysisResults(null)
      setPreviewData([])
    }
  }

  const handleAnalyze = async () => {
    if (!file || !selectedModel) return

    setIsLoading(true)
    setUploadStatus("idle")

    const formData = new FormData()
    formData.append("file", file)
    formData.append("model", selectedModel)

    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error(`Analysis failed: ${res.status}`)
      const data: AnalysisResult = await res.json()
      
      setAnalysisResults(data)
      if (onAnalysisComplete) {
        onAnalysisComplete(data)
      }
      
      if (data.csv_file) {
        const csvContent = atob(data.csv_file)
        const lines = csvContent.split('\n')
        const headers = lines[0].split(',')
        
        const preview = lines.slice(1, 6).filter(line => line.trim()).map(line => {
          const vals = line.split(',')
          const obj: any = {}
          headers.forEach((h, i) => obj[h.trim()] = vals[i])
          return obj
        })
        setPreviewData(preview)
      }
      
      setUploadStatus("success")
    } catch (err: any) {
      setUploadStatus("error")
      console.error("Analysis error:", err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = () => {
    if (!analysisResults?.csv_file) return

    const csvContent = atob(analysisResults.csv_file)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `analyzed_${analysisResults.filename}`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const resetUpload = () => {
    setFile(null)
    setAnalysisResults(null)
    setPreviewData([])
    setUploadStatus("idle")
  }

  if (analysisResults && uploadStatus === "success") {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Analysis Complete</span>
            <Button onClick={handleDownload} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
              <Download className="h-4 w-4" /> Export Result CSV
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
            <div>
              <p className="text-muted-foreground">Flows Analyzed</p>
              <p className="text-xl font-bold">{analysisResults.rows_analyzed.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Threats Found</p>
              <p className="text-xl font-bold text-red-500">{analysisResults.attacks_detected}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Analysis Time</p>
              <p className="text-xl font-bold">{analysisResults.analysis_time}s</p>
            </div>
            <div>
              <p className="text-muted-foreground">Model</p>
              <p className="text-xl font-bold">{analysisResults.model_used}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Threat Distribution
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {analysisResults.attack_types.map((attack, idx) => (
                <div key={idx} className="flex flex-col p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-md">
                  <span className="font-medium text-red-700 dark:text-red-400">{attack.type}</span>
                  <div className="flex justify-between items-end mt-1">
                    <span className="text-xs text-muted-foreground">Conf: {Math.round(attack.confidence * 100)}%</span>
                    <span className="text-lg font-bold">{attack.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {previewData.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Data Preview (First 5 Rows)
              </h4>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground text-xs uppercase">
                    <tr>
                      <th className="px-4 py-2">Src IP</th>
                      <th className="px-4 py-2">Dst IP</th>
                      <th className="px-4 py-2">IN_PKTS</th>
                      <th className="px-4 py-2">Class</th>
                      <th className="px-4 py-2">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {previewData.map((row, i) => (
                      <tr key={i} className="hover:bg-muted/50">
                        <td className="px-4 py-2 font-mono">{row['IPV4_SRC_ADDR']}</td>
                        <td className="px-4 py-2 font-mono">{row['IPV4_DST_ADDR']}</td>
                        <td className="px-4 py-2">{row['IN_PKTS']}</td>
                        <td
                          className={`px-4 py-2 font-medium ${
                            row['Class'] === 'Benign' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {row['Class']}
                        </td>
                        <td className="px-4 py-2">
                          {(parseFloat(row['Confidence']) * 100).toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <Button onClick={resetUpload} variant="outline" className="w-full">
            Analyze Another File
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={isDragActive ? "border-2 border-primary" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" /> File Upload
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-accent/30 cursor-pointer transition-colors w-full"
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
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
          <p className="font-medium mt-4 mb-2">{file ? file.name : "Upload CSV File"}</p>
          <p className="text-sm text-muted-foreground mb-6">
            {file ? `File ready • ${(file.size / 1024).toFixed(2)} KB` : "Drag and drop your NetFlow CSV"}
          </p>
          <Button size="lg" className="pointer-events-none">
            {file ? "Change File" : "Select File"}
          </Button>
        </div>
        
        {onShowColumns && (
          <Button onClick={onShowColumns} variant="ghost" size="sm" className="w-full mt-4 border-dashed">
            View Schema
          </Button>
        )}
        
        {file && (
          <Button
            onClick={handleAnalyze}
            disabled={isLoading || !selectedModel}
            className="w-full mt-4"
          >
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" /> Analyzing with {selectedModel}...
              </>
            ) : (
              selectedModel ? `Analyze File with ${selectedModel}` : "Select a model to analyze"
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
