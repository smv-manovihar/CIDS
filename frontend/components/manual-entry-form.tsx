"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, 
  Plus, 
  Play, 
  AlertCircle, 
  CheckCircle, 
  Edit, 
  Search, 
  FileText,
  ChevronRight,
  ChevronDown
} from "lucide-react";
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
import { Progress } from "@/components/ui/progress";

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
  
  // State for the "Detailed Editor" Modal
  const [editingFlowIndex, setEditingFlowIndex] = useState<number | null>(null);
  const [fieldSearch, setFieldSearch] = useState("");

  const [missingFields, setMissingFields] = useState<
    { flowIndex: number; column: string; value: string | number }[]
  >([]);
  const [isMissingDialogOpen, setIsMissingDialogOpen] = useState(false);
  
  // State for Collapsible Groups in Missing Fields Dialog
  const [expandedMissingGroups, setExpandedMissingGroups] = useState<Record<number, boolean>>({});

  const [flows, setFlows] = useState<FlowEntry[]>([{ id: 1 }]);

  // --- CRUD Operations ---

  const updateFlow = (index: number, field: string, value: string) => {
    const newFlows = [...flows];
    newFlows[index] = { ...newFlows[index], [field]: value };
    setFlows(newFlows);
  };

  const addFlow = () => {
    setFlows([...flows, { id: flows.length + 1 }]);
  };

  const removeFlow = (indexToDelete: number) => {
    if (flows.length > 1) {
      const newFlows = flows
        .filter((_, i) => i !== indexToDelete)
        .map((flow, i) => ({ ...flow, id: i + 1 }));
        
      setFlows(newFlows);
    }
  };

  // --- Helpers for UI ---

  const getFlowCompleteness = (flow: FlowEntry) => {
    if (columns.length === 0) return 0;
    const filledCount = columns.filter(col => {
      const val = flow[col.name];
      return val !== undefined && val !== "" && val !== null;
    }).length;
    return Math.round((filledCount / columns.length) * 100);
  };

  const filteredColumns = useMemo(() => {
    if (!fieldSearch) return columns;
    return columns.filter(c => c.name.toLowerCase().includes(fieldSearch.toLowerCase()));
  }, [columns, fieldSearch]);

  const groupedMissingFields = useMemo(() => {
    const groups: Record<number, { flowId: string | number; fields: Array<{ originalIndex: number; column: string; value: string | number }> }> = {};
    
    missingFields.forEach((item, index) => {
      if (!groups[item.flowIndex]) {
        groups[item.flowIndex] = {
          flowId: flows[item.flowIndex].id,
          fields: []
        };
      }
      groups[item.flowIndex].fields.push({
        originalIndex: index,
        column: item.column,
        value: item.value
      });
    });
    
    return Object.values(groups);
  }, [missingFields, flows]);

  // Effect to default all groups to expanded when dialog opens
  useEffect(() => {
    if (isMissingDialogOpen && groupedMissingFields.length > 0) {
      const initialState: Record<number, boolean> = {};
      groupedMissingFields.forEach(g => {
        initialState[Number(g.flowId)] = true;
      });
      setExpandedMissingGroups(initialState);
    }
  }, [isMissingDialogOpen, groupedMissingFields]);

  const toggleGroup = (flowId: number) => {
    setExpandedMissingGroups(prev => ({
      ...prev,
      [flowId]: !prev[flowId]
    }));
  };

  // --- Backend Logic ---

  useEffect(() => {
    const fetchColumns = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/schema/columns`);
        if (!res.ok) throw new Error(`Failed to load schema`);
        const data: ColumnSchema[] = await res.json();
        setColumns(data);
      } catch (err) {
        console.error("Error loading schema:", err);
      }
    };
    void fetchColumns();
  }, []);

  const handleAnalyzeBatch = async () => {
    setIsAnalyzing(true);
    setError(null);
    setResults(null);

    try {
      if (columns.length === 0) throw new Error("Feature schema not loaded.");

      // 1. Identify missing required fields
      const missing: typeof missingFields = [];
      flows.forEach((flow, index) => {
        columns.forEach((col) => {
          if (col.required) {
            const val = flow[col.name];
            const isEmpty = val === undefined || val === null || val === "" || (typeof val === "number" && !Number.isFinite(val));
            if (isEmpty) {
              const defaultValue = col.type === "integer" || col.type === "float" ? 0 : "";
              missing.push({ flowIndex: index, column: col.name, value: defaultValue });
            }
          }
        });
      });

      if (missing.length > 0) {
        setMissingFields(missing);
        setIsMissingDialogOpen(true);
        setIsAnalyzing(false);
        return;
      }

      // 2. Normalize Data
      const validFlows = flows.map((f) => {
        const row: Record<string, any> = { id: String(f.id) };
        columns.forEach((col) => {
          const raw = f[col.name];
          if (col.type === "integer" || col.type === "float") {
            const num = typeof raw === "number" ? raw : Number(raw ?? "");
            row[col.name] = Number.isFinite(num) ? num : 0;
          } else {
            row[col.name] = raw === undefined || raw === null ? "" : String(raw);
          }
        });
        return row;
      });

      // 3. Send Request
      const response = await fetch(`${API_BASE}/api/analyze_data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flows: validFlows, model: selectedModel }),
      });

      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setResults(data.results);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const confirmMissingDialog = async () => {
    const newFlows = [...flows];
    missingFields.forEach(({ flowIndex, column, value }) => {
      newFlows[flowIndex] = { ...newFlows[flowIndex], [column]: value };
    });
    setFlows(newFlows);
    setIsMissingDialogOpen(false);
    setMissingFields([]);
    await handleAnalyzeBatch();
  };

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "critical": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-blue-500";
      default: return "bg-green-500";
    }
  };

  return (
    <div className="space-y-6 w-full">
      
      {/* --- Main Overview Table --- */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-4 border-b flex items-center justify-between bg-muted/30">
          <div>
             <h3 className="font-semibold text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Traffic Flows
             </h3>
             <p className="text-sm text-muted-foreground">
               Manage flows for analysis.
             </p>
          </div>
          <Button onClick={addFlow} size="sm" className="shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Add Row
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Data Completeness</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flows.map((flow, index) => {
              const completeness = getFlowCompleteness(flow);
              return (
                <TableRow key={index}>
                  <TableCell className="font-mono font-medium">#{flow.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4 max-w-sm">
                        <Progress value={completeness} className="h-2 w-full" />
                        <span className="text-xs text-muted-foreground w-12 text-right">{completeness}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                                setFieldSearch("");
                                setEditingFlowIndex(index);
                            }}
                            className="text-primary hover:text-primary/80 border-primary/20 bg-primary/5"
                        >
                            <Edit className="w-3.5 h-3.5 mr-2" /> Edit Features
                        </Button>
                        <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFlow(index)}
                        disabled={flows.length === 1}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                        <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleAnalyzeBatch}
          disabled={isAnalyzing}
          size="lg"
          className="bg-primary hover:bg-primary/90 min-w-[150px]"
        >
          {isAnalyzing ? "Processing..." : <><Play className="w-4 h-4 mr-2" /> Analyze All</>}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* --- Detailed Editor Dialog --- */}
      <Dialog open={editingFlowIndex !== null} onOpenChange={(open) => !open && setEditingFlowIndex(null)}>
        <DialogContent className="max-w-[90vw] w-full h-[85vh] p-0 flex flex-col bg-background">
            <DialogHeader className="px-6 py-4 border-b bg-muted/10 shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <DialogTitle className="text-xl">Edit Flow Attributes</DialogTitle>
                        <DialogDescription>
                            Editing Flow ID: <span className="font-mono text-primary font-bold">#{editingFlowIndex !== null ? flows[editingFlowIndex].id : ''}</span>
                        </DialogDescription>
                    </div>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Filter attributes..." 
                            className="pl-9 h-9"
                            value={fieldSearch}
                            onChange={(e) => setFieldSearch(e.target.value)}
                        />
                    </div>
                </div>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-6">
                {editingFlowIndex !== null && (
                    /* GRID UPDATE: Changed from responsive 4 columns to max 2 columns */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredColumns.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                                <Search className="w-8 h-8 opacity-20" />
                                <p>No attributes found matching "{fieldSearch}"</p>
                            </div>
                        ) : (
                            filteredColumns.map((col) => (
                                <div key={col.name} className="space-y-2 p-3 rounded-lg hover:bg-muted/30 border border-transparent hover:border-border/40 transition-colors flex flex-col">
                                    <div className="flex flex-col gap-1 mb-auto">
                                        <label className="text-xs font-medium uppercase text-muted-foreground tracking-wide wrap-break-word whitespace-normal leading-snug">
                                            {col.name} {col.required && <span className="text-red-500">*</span>}
                                        </label>
                                        {col.description && (
                                            <p className="text-[10px] text-muted-foreground/70 line-clamp-2 leading-tight">
                                                {col.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="mt-2">
                                        <Input
                                            type={col.type === "integer" || col.type === "float" ? "number" : "text"}
                                            placeholder={col.example || "—"}
                                            value={String((flows[editingFlowIndex][col.name] ?? "") as string | number)}
                                            onChange={(e) => updateFlow(editingFlowIndex, col.name, e.target.value)}
                                            className="h-9 font-mono text-sm bg-accent/5 focus-visible:bg-background transition-all focus-visible:ring-primary/20"
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
            <DialogFooter className="px-6 py-4 border-t bg-muted/10 shrink-0">
                <Button onClick={() => setEditingFlowIndex(null)} className="w-full sm:w-auto">
                    Done Editing
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Results Section --- */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pt-6 border-t"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
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
                      <TableCell className="font-mono">{result.flow_id}</TableCell>
                      <TableCell className="font-medium">{result.prediction}</TableCell>
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
                            <AlertCircle className="w-3 h-3" /> Threat
                          </span>
                        ) : (
                          <span className="text-emerald-500 font-medium flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Normal
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={`${getRiskColor(result.risk_level)} text-white border-0`}>
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

      {/* --- UPDATED Missing Fields Dialog --- */}
      <Dialog open={isMissingDialogOpen} onOpenChange={setIsMissingDialogOpen}>
        {/* Adjusted dialog size and layout */}
        <DialogContent className="max-w-[95vw] w-full h-[85vh] flex flex-col p-0">
          
          <DialogHeader className="px-6 py-4 border-b shrink-0 bg-red-50/50 dark:bg-red-900/20">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-full">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                    <DialogTitle className="text-lg">Missing Required Data</DialogTitle>
                    <DialogDescription>
                    Please fill in the required fields below to proceed with analysis.
                    </DialogDescription>
                </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/5">
            {groupedMissingFields.map((group) => {
                const isExpanded = expandedMissingGroups[Number(group.flowId)];
                
                return (
                    <div key={group.flowId} className="bg-background border rounded-xl shadow-sm overflow-hidden transition-all">
                        {/* Collapsible Header */}
                        <div 
                            className="px-4 py-3 border-b bg-muted/20 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => toggleGroup(Number(group.flowId))}
                        >
                            <div className="flex items-center gap-3">
                                {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                                <span className="text-sm font-bold px-2.5 py-1 rounded bg-primary/10 text-primary font-mono">
                                    Flow #{group.flowId}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    Missing {group.fields.length} field{group.fields.length > 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>

                        {/* Collapsible Body */}
                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    {/* Grid layout matches the main Edit dialog now: 2 cols */}
                                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-transparent items-start">
                                        {group.fields.map((field, idx) => {
                                            const col = columns.find(c => c.name === field.column);
                                            return (
                                                <div key={`${group.flowId}-${field.column}`} className="space-y-1.5 p-2 rounded hover:bg-accent/5 flex flex-col h-full">
                                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide wrap-break-word whitespace-normal leading-tight mb-1">
                                                        {field.column} <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="mt-auto">
                                                        <Input
                                                            type={col?.type === "integer" || col?.type === "float" ? "number" : "text"}
                                                            value={String(field.value)}
                                                            placeholder="Required"
                                                            onChange={(e) => {
                                                                const newMissing = [...missingFields];
                                                                newMissing[field.originalIndex].value = e.target.value;
                                                                setMissingFields(newMissing);
                                                            }}
                                                            className="h-9 border-red-200 focus-visible:ring-red-500/20 bg-red-50/10 dark:bg-red-900/10"
                                                        />
                                                        <p className="text-[10px] text-red-400 mt-1">Required</p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
          </div>

          <DialogFooter className="px-6 py-4 border-t shrink-0 bg-muted/10">
            <Button variant="ghost" onClick={() => setIsMissingDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmMissingDialog} className="bg-red-600 hover:bg-red-700 text-white">
                Confirm & Analyze
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}