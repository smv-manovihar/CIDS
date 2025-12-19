"use client"

import type React from "react"

import { useState } from "react"
import Header from "@/components/header"
import ModelSelector from "@/components/model-selector"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, Loader } from "lucide-react"

export default function ManualEntryPage() {
  const [currentModel, setCurrentModel] = useState("Random Forest")
  const [formData, setFormData] = useState({
    sourceIP: "192.168.1.100",
    destinationIP: "203.0.113.45",
    sourcePort: "54321",
    destinationPort: "443",
    protocol: "TCP",
    bytesIn: "2048",
    bytesOut: "4096",
    duration: "125",
    packetCount: "32",
    flagCount: "5",
  })

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setResult(null)

    // Placeholder API call
    console.log("[v0] Manual entry analysis request:")
    console.log("[v0] Endpoint: POST /api/analyze/single")
    console.log("[v0] Model:", currentModel)
    console.log("[v0] Payload:", formData)

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Dummy detection result
    const dummyResult = {
      classification: "Brute Force Attack",
      confidence: 0.94,
      riskLevel: "HIGH",
      details: {
        suspiciousPatterns: [
          "Unusual number of flag resets",
          "High packet count for short duration",
          "Multiple port connection attempts",
        ],
        model: currentModel,
        processingTime: 0.34,
      },
    }

    console.log("[v0] Analysis complete - Classification:", dummyResult.classification)
    console.log("[v0] API Response:", dummyResult)

    setResult(dummyResult)
    setIsAnalyzing(false)
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "CRITICAL":
        return "text-red-500"
      case "HIGH":
        return "text-orange-500"
      case "MEDIUM":
        return "text-yellow-500"
      case "LOW":
        return "text-green-500"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Manual Threat Analysis</h1>
          <p className="text-muted-foreground">
            Analyze individual NetFlow records to test detection models and understand threat indicators
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Left column - Input form */}
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6 border-border">
              <h2 className="text-xl font-semibold text-foreground mb-4">NetFlow Record</h2>
              <div className="grid gap-4">
                {/* Network Information */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">Network Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Source IP</Label>
                      <Input
                        name="sourceIP"
                        value={formData.sourceIP}
                        onChange={handleInputChange}
                        placeholder="192.168.1.1"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Destination IP</Label>
                      <Input
                        name="destinationIP"
                        value={formData.destinationIP}
                        onChange={handleInputChange}
                        placeholder="203.0.113.1"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Source Port</Label>
                      <Input
                        name="sourcePort"
                        value={formData.sourcePort}
                        onChange={handleInputChange}
                        placeholder="54321"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Destination Port</Label>
                      <Input
                        name="destinationPort"
                        value={formData.destinationPort}
                        onChange={handleInputChange}
                        placeholder="443"
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Protocol Information */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">Protocol Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Protocol</Label>
                      <Input
                        name="protocol"
                        value={formData.protocol}
                        onChange={handleInputChange}
                        placeholder="TCP"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Duration (ms)</Label>
                      <Input
                        name="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                        placeholder="125"
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Traffic Information */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">Traffic Information</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Bytes In</Label>
                      <Input
                        name="bytesIn"
                        value={formData.bytesIn}
                        onChange={handleInputChange}
                        placeholder="2048"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Bytes Out</Label>
                      <Input
                        name="bytesOut"
                        value={formData.bytesOut}
                        onChange={handleInputChange}
                        placeholder="4096"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Packet Count</Label>
                      <Input
                        name="packetCount"
                        value={formData.packetCount}
                        onChange={handleInputChange}
                        placeholder="32"
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleAnalyze} disabled={isAnalyzing} size="lg" className="w-full mt-2">
                  {isAnalyzing ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze Record"
                  )}
                </Button>
              </div>
            </Card>
          </div>

          {/* Right column - Model selector and results */}
          <div className="space-y-6">
            <ModelSelector onModelChange={setCurrentModel} />

            {result && (
              <Card className="p-6 border-accent/20 bg-linear-to-br from-card to-card">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-accent/20 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">Detection Result</h3>
                    <p className="text-xs text-muted-foreground">Analysis completed successfully</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-card/50 border border-border">
                    <div className="text-xs text-muted-foreground mb-1">Classification</div>
                    <div className="text-lg font-bold text-foreground">{result.classification}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-card/50 border border-border">
                      <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                      <div className="text-lg font-bold text-accent">{(result.confidence * 100).toFixed(0)}%</div>
                    </div>
                    <div className="p-3 rounded-lg bg-card/50 border border-border">
                      <div className="text-xs text-muted-foreground mb-1">Risk Level</div>
                      <div className={`text-lg font-bold ${getRiskColor(result.riskLevel)}`}>{result.riskLevel}</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-card/50 border border-border">
                    <div className="text-xs text-muted-foreground mb-2">Suspicious Patterns</div>
                    <ul className="space-y-1">
                      {result.details.suspiciousPatterns.map((pattern: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-1 shrink-0" />
                          <span className="text-xs text-foreground">{pattern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-xs text-muted-foreground p-2 rounded bg-card/50">
                    <span className="text-accent">Model:</span> {result.details.model} •
                    <span className="text-accent ml-1">Time:</span> {result.details.processingTime}s
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
