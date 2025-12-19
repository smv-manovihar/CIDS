"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Play, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ColumnSchema {
  name: string;
  type: string;
  description: string;
  required: boolean;
  example: string;
}

const API_BASE =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
    : "http://localhost:8000";

// Each flow row holds an id plus one value per feature column (dynamic keys).
interface FlowEntry {
  id: string | number;
  [key: string]: string | number;
}

interface ManualEntryFormProps {
  selectedModel: string;
}

export default function ManualEntryForm({
  selectedModel,
}: ManualEntryFormProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [columns, setColumns] = useState<ColumnSchema[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [missingFields, setMissingFields] = useState<
    { flowIndex: number; column: string; value: string | number }[]
  >([]);
  const [isEmptyDialogOpen, setIsEmptyDialogOpen] = useState(false);

  // We start with a single empty row; feature fields are added dynamically as the
  // user types into inputs generated from the backend schema.
  const [flows, setFlows] = useState<FlowEntry[]>([
    {
      id: 1,
    },
  ]);

  // Update function handles strings directly for any feature key
  const updateFlow = (index: number, field: string, value: string) => {
    const newFlows = [...flows];
    newFlows[index] = { ...newFlows[index], [field]: value };
    setFlows(newFlows);
  };

  const addFlow = () => {
    setFlows([
      ...flows,
      {
        id: flows.length + 1,
      },
    ]);
  };

  const removeFlow = (index: number) => {
    if (flows.length > 1) {
      const newFlows = flows.filter((_, i) => i !== index);
      setFlows(newFlows);
    }
  };

  const updateMissingField = (index: number, value: string | number) => {
    const newMissing = [...missingFields];
    newMissing[index].value = value;
    setMissingFields(newMissing);
  };

  const confirmDialog = async () => {
    // Update flows with the edited missing fields
    const newFlows = [...flows];
    missingFields.forEach(({ flowIndex, column, value }) => {
      newFlows[flowIndex] = { ...newFlows[flowIndex], [column]: value };
    });
    setFlows(newFlows);
    setIsDialogOpen(false);
    setMissingFields([]);

    // Now proceed with the analysis
    await handleAnalyzeBatch();
  };

  // Load the shared schema so manual entry can build rows matching the model features
  useEffect(() => {
    const fetchColumns = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/schema/columns`);
        if (!res.ok) {
          throw new Error(`Failed to load schema: ${res.status}`);
        }
        const data: ColumnSchema[] = await res.json();
        setColumns(data);
      } catch (err) {
        console.error("Error loading schema for manual entry:", err);
        // We silently ignore here; backend will still handle partial rows but
        // we prefer to have the schema for full feature coverage.
      }
    };

    void fetchColumns();
  }, []);

  const handleAnalyzeBatch = async () => {
    setIsAnalyzing(true);
    setError(null);
    setResults(null);

    try {
      if (columns.length === 0) {
        throw new Error("Feature schema not loaded. Please try again.");
      }

      // Validation: Check if nothing is provided
      const allEmpty = flows.every((flow) =>
        columns.every((col) => {
          const val = flow[col.name];
          return (
            val === undefined ||
            val === null ||
            val === "" ||
            (typeof val === "number" && !Number.isFinite(val))
          );
        })
      );
      if (allEmpty) {
        setIsEmptyDialogOpen(true);
        setIsAnalyzing(false);
        return;
      }

      // Collect missing required fields
      const missing: {
        flowIndex: number;
        column: string;
        value: string | number;
      }[] = [];
      flows.forEach((flow, index) => {
        columns.forEach((col) => {
          if (col.required) {
            const val = flow[col.name];
            const isEmpty =
              val === undefined ||
              val === null ||
              val === "" ||
              (typeof val === "number" && !Number.isFinite(val));
            if (isEmpty) {
              const defaultValue =
                col.type === "integer" || col.type === "float" ? 0 : "";
              missing.push({
                flowIndex: index,
                column: col.name,
                value: defaultValue,
              });
            }
          }
        });
      });

      if (missing.length > 0) {
        setMissingFields(missing);
        setIsDialogOpen(true);
        setIsAnalyzing(false);
        return;
      }

      // Build rows that follow the full NetFlow feature schema from the backend
      const validFlows = flows.map((f) => {
        const row: Record<string, any> = {};

        // Keep a stable identifier for response mapping
        row.id = String(f.id);

        // For each schema-defined feature, read the string value from the flow
        // and coerce it according to the declared type.
        columns.forEach((col) => {
          const raw = f[col.name];

          if (col.type === "integer" || col.type === "float") {
            const num = typeof raw === "number" ? raw : Number(raw ?? "");
            row[col.name] = Number.isFinite(num) ? num : 0;
          } else {
            row[col.name] =
              raw === undefined || raw === null ? "" : String(raw);
          }
        });

        return row;
      });

      console.log(
        "Sending payload:",
        JSON.stringify({ flows: validFlows, model: selectedModel }, null, 2)
      );

      const response = await fetch(`${API_BASE}/api/analyze_data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flows: validFlows,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setResults(data.results);
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "critical":
        return "bg-red-500 hover:bg-red-600";
      case "high":
        return "bg-orange-500 hover:bg-orange-600";
      case "medium":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "low":
        return "bg-blue-500 hover:bg-blue-600";
      default:
        return "bg-green-500 hover:bg-green-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-md border bg-card">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-lg">Network Flow Data</h3>
          <Button onClick={addFlow} variant={"secondary"} size="sm">
            <Plus className="w-4 h-4 mr-2" /> Add Row
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px] sticky left-0 z-10 bg-card">
                  ID
                </TableHead>
                {columns.map((col) => (
                  <TableHead key={col.name}>{col.name}</TableHead>
                ))}
                <TableHead className="w-[60px] sticky right-0 z-10 bg-card text-center">
                  Delete
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flows.map((flow, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-xs sticky left-0 z-10 bg-card">
                    {flow.id}
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell key={col.name}>
                      <Input
                        type={col.type === "string" ? "text" : "number"}
                        placeholder={col.example}
                        value={String(
                          (flow[col.name] ?? "") as string | number
                        )}
                        onChange={(e) =>
                          updateFlow(index, col.name, e.target.value)
                        }
                        className="h-8 min-w-24"
                      />
                    </TableCell>
                  ))}
                  <TableCell className="sticky right-0 z-10 bg-card">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFlow(index)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      disabled={flows.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleAnalyzeBatch}
          disabled={isAnalyzing}
          size="lg"
          className="bg-primary hover:bg-primary/90"
        >
          {isAnalyzing ? (
            "Analyzing..."
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" /> Analyze Traffic
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold">Analysis Results</h3>
            </div>

            <div className="rounded-md border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Flow ID</TableHead>
                    <TableHead>Prediction</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Risk Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono">
                        {result.flow_id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {result.prediction}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${result.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {(result.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {result.is_threat ? (
                          <span className="text-destructive font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Threat Detected
                          </span>
                        ) : (
                          <span className="text-green-500 font-medium flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Normal
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          className={`${getRiskColor(
                            result.risk_level
                          )} text-white border-0`}
                        >
                          {result.risk_level || "Normal"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={isEmptyDialogOpen} onOpenChange={setIsEmptyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No Input Provided</DialogTitle>
            <DialogDescription>
              Please provide at least some input values before analyzing
              traffic.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsEmptyDialogOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Missing Required Fields</DialogTitle>
            <DialogDescription>
              Some required fields are missing. Please review and provide values
              for the following fields. Default values are shown.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flow ID</TableHead>
                    <TableHead>Column</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missingFields.map((field, index) => {
                    const col = columns.find((c) => c.name === field.column);
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-mono">
                          {flows[field.flowIndex].id}
                        </TableCell>
                        <TableCell>{field.column}</TableCell>
                        <TableCell>
                          <Input
                            type={col?.type === "string" ? "text" : "number"}
                            value={String(field.value)}
                            onChange={(e) =>
                              updateMissingField(
                                index,
                                col?.type === "string"
                                  ? e.target.value
                                  : Number(e.target.value)
                              )
                            }
                            className="h-8 min-w-24"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmDialog}>Send Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
