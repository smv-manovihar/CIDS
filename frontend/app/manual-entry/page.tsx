"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Header from "@/components/header";
import ModelSelector from "@/components/model-selector";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Loader, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const API_BASE =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
    : "http://localhost:8000";

interface ColumnSchema {
  name: string;
  type: string;
  description: string;
  required: boolean;
  example: string;
}

// Protocol name to number mapping
const PROTOCOL_MAP: Record<string, number> = {
  TCP: 6,
  UDP: 17,
  ICMP: 1,
  IGMP: 2,
  GRE: 47,
  ESP: 50,
  AH: 51,
};

function getProtocolNumber(protocol: string): number {
  const upper = protocol.toUpperCase();
  if (PROTOCOL_MAP[upper]) {
    return PROTOCOL_MAP[upper];
  }
  // Try to parse as number
  const num = parseInt(protocol, 10);
  return isNaN(num) ? 6 : num; // Default to TCP if invalid
}

// Map form field names to schema column names
const FORM_TO_SCHEMA_MAP: Record<string, string> = {
  sourceIP: "IPV4_SRC_ADDR",
  destinationIP: "IPV4_DST_ADDR",
  sourcePort: "L4_SRC_PORT",
  destinationPort: "L4_DST_PORT",
  protocol: "PROTOCOL",
  bytesIn: "IN_BYTES",
  bytesOut: "OUT_BYTES",
  duration: "FLOW_DURATION_MILLISECONDS",
  packetCount: "IN_PKTS",
  flagCount: "TCP_FLAGS",
};

export default function ManualEntryPage() {
  const [currentModel, setCurrentModel] = useState("Random Forest");
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
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState<ColumnSchema[]>([]);
  const [schemaLoading, setSchemaLoading] = useState(true);

  // Fetch schema on component mount
  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/schema/columns`);
        if (!res.ok) throw new Error(`Failed to load schema`);
        const data: ColumnSchema[] = await res.json();
        setSchema(data);
      } catch (err) {
        console.error("Error loading schema:", err);
        setError("Failed to load schema. Please refresh the page.");
      } finally {
        setSchemaLoading(false);
      }
    };
    void fetchSchema();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Get default value for a schema column based on its type and example
  const getDefaultValue = (col: ColumnSchema): any => {
    if (col.example) {
      if (col.type === "integer") {
        const parsed = parseInt(col.example, 10);
        return isNaN(parsed) ? 0 : parsed;
      } else if (col.type === "float") {
        const parsed = parseFloat(col.example);
        return isNaN(parsed) ? 0.0 : parsed;
      } else {
        return col.example;
      }
    }
    // Fallback defaults based on type
    if (col.type === "integer") return 0;
    if (col.type === "float") return 0.0;
    return "";
  };

  // Convert form value to schema value
  const convertFormValue = (
    formField: string,
    value: string,
    col: ColumnSchema
  ): any => {
    if (formField === "protocol") {
      return getProtocolNumber(value);
    }
    if (col.type === "integer") {
      return parseInt(value, 10) || 0;
    }
    if (col.type === "float") {
      return parseFloat(value) || 0.0;
    }
    return value || "";
  };

  const handleAnalyze = async () => {
    if (schema.length === 0) {
      setError("Schema not loaded. Please wait and try again.");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      // Build flow data dynamically from schema
      const flowData: Record<string, any> = {
        id: "1",
      };

      // Process each column in the schema
      for (const col of schema) {
        // Check if this column is mapped from a form field
        const formField = Object.keys(FORM_TO_SCHEMA_MAP).find(
          (key) => FORM_TO_SCHEMA_MAP[key] === col.name
        );

        if (formField && formData[formField as keyof typeof formData]) {
          // Use form value
          const formValue = formData[formField as keyof typeof formData];
          flowData[col.name] = convertFormValue(
            formField,
            String(formValue),
            col
          );
        } else {
          // Use default value based on schema
          let defaultValue = getDefaultValue(col);

          // Special handling for time-related fields
          if (col.name === "FLOW_START_MILLISECONDS") {
            defaultValue = Date.now();
          } else if (col.name === "FLOW_END_MILLISECONDS") {
            const duration = parseInt(formData.duration) || 0;
            defaultValue = Date.now() + duration;
          } else if (col.name === "CLIENT_TCP_FLAGS" && formData.flagCount) {
            defaultValue = parseInt(formData.flagCount) || 0;
          } else if (col.name === "DURATION_IN" && formData.duration) {
            defaultValue = parseInt(formData.duration) || 0;
          } else if (
            col.name === "SRC_TO_DST_SECOND_BYTES" &&
            formData.bytesIn
          ) {
            defaultValue = parseInt(formData.bytesIn) || 0;
          } else if (
            col.name === "DST_TO_SRC_SECOND_BYTES" &&
            formData.bytesOut
          ) {
            defaultValue = parseInt(formData.bytesOut) || 0;
          } else if (
            col.name === "SRC_TO_DST_AVG_THROUGHPUT" &&
            formData.bytesIn
          ) {
            defaultValue = parseFloat(formData.bytesIn) || 0;
          } else if (
            col.name === "DST_TO_SRC_AVG_THROUGHPUT" &&
            formData.bytesOut
          ) {
            defaultValue = parseFloat(formData.bytesOut) || 0;
          } else if (col.name === "SRC_TO_DST_IAT_MAX" && formData.duration) {
            defaultValue = parseInt(formData.duration) || 0;
          } else if (col.name === "SRC_TO_DST_IAT_AVG" && formData.duration) {
            defaultValue = parseFloat(formData.duration) || 0;
          }

          flowData[col.name] = defaultValue;
        }
      }

      const response = await fetch(`${API_BASE}/api/analyze_data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flows: [flowData],
          model: currentModel,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const firstResult = data.results[0];

        // Generate suspicious patterns based on the prediction
        const suspiciousPatterns: string[] = [];
        if (firstResult.is_threat) {
          if (firstResult.prediction === "DDoS") {
            suspiciousPatterns.push("High volume traffic detected");
            suspiciousPatterns.push("Unusual packet patterns");
          } else if (firstResult.prediction === "Scanning") {
            suspiciousPatterns.push("Multiple port connection attempts");
            suspiciousPatterns.push("Unusual port scanning behavior");
          } else if (firstResult.prediction === "DoS") {
            suspiciousPatterns.push("High packet count for short duration");
            suspiciousPatterns.push("Potential denial of service pattern");
          } else {
            suspiciousPatterns.push("Anomalous traffic pattern detected");
            suspiciousPatterns.push("Threat indicators present");
          }
        } else {
          suspiciousPatterns.push("No suspicious patterns detected");
        }

        // Transform backend response to match UI expectations
        const transformedResult = {
          classification: firstResult.prediction,
          confidence: firstResult.confidence,
          riskLevel: firstResult.risk_level.toUpperCase(),
          details: {
            suspiciousPatterns,
            model: data.model_used,
            processingTime: data.analysis_time,
          },
        };

        setResult(transformedResult);
      } else {
        throw new Error("No results returned from analysis");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during analysis");
      console.error("Analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "CRITICAL":
        return "text-red-500";
      case "HIGH":
        return "text-orange-500";
      case "MEDIUM":
        return "text-yellow-500";
      case "LOW":
        return "text-green-500";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Manual Threat Analysis
          </h1>
          <p className="text-muted-foreground">
            Analyze individual NetFlow records to test detection models and
            understand threat indicators
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Left column - Input form */}
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6 border-border">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                NetFlow Record
              </h2>
              <div className="grid gap-4">
                {/* Network Information */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">
                    Network Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Source IP
                      </Label>
                      <Input
                        name="sourceIP"
                        value={formData.sourceIP}
                        onChange={handleInputChange}
                        placeholder="192.168.1.1"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Destination IP
                      </Label>
                      <Input
                        name="destinationIP"
                        value={formData.destinationIP}
                        onChange={handleInputChange}
                        placeholder="203.0.113.1"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Source Port
                      </Label>
                      <Input
                        name="sourcePort"
                        value={formData.sourcePort}
                        onChange={handleInputChange}
                        placeholder="54321"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Destination Port
                      </Label>
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
                  <h3 className="text-sm font-medium text-foreground mb-3">
                    Protocol Details
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Protocol
                      </Label>
                      <Input
                        name="protocol"
                        value={formData.protocol}
                        onChange={handleInputChange}
                        placeholder="TCP"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Duration (ms)
                      </Label>
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
                  <h3 className="text-sm font-medium text-foreground mb-3">
                    Traffic Information
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Bytes In
                      </Label>
                      <Input
                        name="bytesIn"
                        value={formData.bytesIn}
                        onChange={handleInputChange}
                        placeholder="2048"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Bytes Out
                      </Label>
                      <Input
                        name="bytesOut"
                        value={formData.bytesOut}
                        onChange={handleInputChange}
                        placeholder="4096"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Packet Count
                      </Label>
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

                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || schemaLoading || schema.length === 0}
                  size="lg"
                  className="w-full mt-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : schemaLoading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Loading schema...
                    </>
                  ) : (
                    "Analyze Record"
                  )}
                </Button>

                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
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
                    <h3 className="font-semibold text-foreground mb-1">
                      Detection Result
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Analysis completed successfully
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-card/50 border border-border">
                    <div className="text-xs text-muted-foreground mb-1">
                      Classification
                    </div>
                    <div className="text-lg font-bold text-foreground">
                      {result.classification}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-card/50 border border-border">
                      <div className="text-xs text-muted-foreground mb-1">
                        Confidence
                      </div>
                      <div className="text-lg font-bold text-accent">
                        {(result.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-card/50 border border-border">
                      <div className="text-xs text-muted-foreground mb-1">
                        Risk Level
                      </div>
                      <div
                        className={`text-lg font-bold ${getRiskColor(
                          result.riskLevel
                        )}`}
                      >
                        {result.riskLevel}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-card/50 border border-border">
                    <div className="text-xs text-muted-foreground mb-2">
                      Suspicious Patterns
                    </div>
                    <ul className="space-y-1">
                      {result.details.suspiciousPatterns.map(
                        (pattern: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-1 shrink-0" />
                            <span className="text-xs text-foreground">
                              {pattern}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  <div className="text-xs text-muted-foreground p-2 rounded bg-card/50">
                    <span className="text-accent">Model:</span>{" "}
                    {result.details.model} •
                    <span className="text-accent ml-1">Time:</span>{" "}
                    {result.details.processingTime}s
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
