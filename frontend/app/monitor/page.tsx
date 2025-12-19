"use client"

import { useState, useEffect } from "react"
import Header from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  Network, 
  Clock, 
  BarChart3, 
  Search,
  Filter,
  Download,
  ShieldAlert,
  MoreVertical,
  ArrowUpRight,
  Play,   // Imported Play
  Pause   // Imported Pause
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NetworkEvent {
  id: string
  timestamp: string
  sourceIP: string
  destinationIP: string
  threatType: string
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
  confidence: number
}

export default function MonitorPage() {
  const [networkEvents, setNetworkEvents] = useState<NetworkEvent[]>([])
  const [stats, setStats] = useState({
    threatsDetected: 0,
    activeConnections: 0,
    avgConfidence: 0,
    uptime: "24h 32m",
  })
  const [isLive, setIsLive] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchMonitoringData = async () => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800))
      
      const dummyEvents: NetworkEvent[] = [
        {
          id: "evt-001",
          timestamp: new Date(Date.now() - 5000).toISOString(),
          sourceIP: "192.168.1.105",
          destinationIP: "198.51.100.23",
          threatType: "Port Scan",
          severity: "HIGH",
          confidence: 0.96,
        },
        {
          id: "evt-002",
          timestamp: new Date(Date.now() - 15000).toISOString(),
          sourceIP: "10.0.0.42",
          destinationIP: "203.0.113.89",
          threatType: "Anomalous Traffic",
          severity: "MEDIUM",
          confidence: 0.78,
        },
        {
          id: "evt-003",
          timestamp: new Date(Date.now() - 32000).toISOString(),
          sourceIP: "172.16.0.88",
          destinationIP: "198.51.100.45",
          threatType: "DDoS Pattern",
          severity: "CRITICAL",
          confidence: 0.99,
        },
        {
          id: "evt-004",
          timestamp: new Date(Date.now() - 58000).toISOString(),
          sourceIP: "192.168.1.200",
          destinationIP: "203.0.113.12",
          threatType: "Brute Force",
          severity: "HIGH",
          confidence: 0.92,
        },
        {
          id: "evt-005",
          timestamp: new Date(Date.now() - 125000).toISOString(),
          sourceIP: "10.0.0.15",
          destinationIP: "198.51.100.67",
          threatType: "Suspicious Pattern",
          severity: "LOW",
          confidence: 0.65,
        },
      ]

      const dummyStats = {
        threatsDetected: 247,
        activeConnections: 1324,
        avgConfidence: 0.89,
        uptime: "24h 32m",
      }

      setNetworkEvents(dummyEvents)
      setStats(dummyStats)
      setLastUpdated(new Date())
    }

    fetchMonitoringData()

    if (isLive) {
      const interval = setInterval(() => {
        setLastUpdated(new Date())
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [isLive])

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/25"
      case "HIGH":
        return "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/25"
      case "MEDIUM":
        return "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/25"
      case "LOW":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/25"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* --- Page Header & Controls --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Network Monitor
            </h1>
            <p className="text-muted-foreground">
              Real-time threat detection and network telemetry.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-muted/40 p-2 rounded-lg border">
            <div className="px-2 text-right">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Status</p>
                <div className="flex items-center justify-end gap-1.5">
                    {/* Pulsing Dot for Live Status */}
                    <span className="relative flex h-2 w-2">
                      {isLive ? (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </>
                      ) : (
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      )}
                    </span>
                    <p className={`text-sm font-mono font-medium ${isLive ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {isLive ? "Live Stream" : "Paused"}
                    </p>
                </div>
            </div>
            
            <div className="h-8 w-px bg-border mx-1" />

            <div className="px-2 text-right hidden sm:block">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Last Sync</p>
                <p className="text-sm font-mono text-foreground">{lastUpdated.toLocaleTimeString()}</p>
            </div>

            {/* UPDATED TOGGLE BUTTON */}
            <Button
              variant={isLive ? "secondary" : "default"}
              size="icon"
              onClick={() => setIsLive(!isLive)}
              className="ml-1"
              title={isLive ? "Pause Stream" : "Resume Stream"}
            >
              {isLive ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
            </Button>
          </div>
        </div>

        {/* --- KPI Stats Grid --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Threats Detected" 
            value={stats.threatsDetected} 
            icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
            trend="+12%"
            trendUp={true}
          />
          <StatCard 
            title="Active Connections" 
            value={stats.activeConnections.toLocaleString()} 
            icon={<Network className="w-5 h-5 text-blue-500" />}
            trend="+5%"
            trendUp={true}
          />
          <StatCard 
            title="Avg. Confidence" 
            value={`${(stats.avgConfidence * 100).toFixed(0)}%`} 
            icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
            subtext="Model Accuracy"
          />
          <StatCard 
            title="System Uptime" 
            value={stats.uptime} 
            icon={<Clock className="w-5 h-5 text-orange-500" />}
            subtext="Since last reboot"
          />
        </div>

        {/* --- Main Data Table Section --- */}
        <div className="space-y-4">
            
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search IP or Event ID..." 
                        className="pl-9 bg-background" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button variant="outline" className="flex-1 sm:flex-none gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        Filter
                    </Button>
                    <Button variant="outline" className="flex-1 sm:flex-none gap-2">
                        <Download className="w-4 h-4 text-muted-foreground" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Table Card */}
            <Card className="border shadow-sm overflow-hidden">
                <div className="relative w-full overflow-auto">
                    <table className="w-full text-sm text-left caption-bottom">
                        <thead className="[&_tr]:border-b bg-muted/40 sticky top-0 z-10 backdrop-blur-md">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-10 px-4 align-middle font-medium text-muted-foreground w-[180px]">Timestamp</th>
                                <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Source</th>
                                <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Target</th>
                                <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Threat Type</th>
                                <th className="h-10 px-4 align-middle font-medium text-muted-foreground">Severity</th>
                                <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-right">Confidence</th>
                                <th className="h-10 px-4 align-middle font-medium text-muted-foreground w-[50px]"></th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {networkEvents.map((event) => (
                                <tr key={event.id} className="border-b transition-colors hover:bg-muted/30 data-[state=selected]:bg-muted group">
                                    <td className="p-4 align-middle font-mono text-xs text-muted-foreground tabular-nums">
                                        {new Date(event.timestamp).toLocaleTimeString()} 
                                        <span className="text-muted-foreground/40 ml-1.5 text-[10px]">{new Date(event.timestamp).toLocaleDateString()}</span>
                                    </td>
                                    <td className="p-4 align-middle font-mono text-xs">{event.sourceIP}</td>
                                    <td className="p-4 align-middle font-mono text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <ArrowUpRight className="w-3 h-3 text-muted-foreground/50" />
                                            {event.destinationIP}
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle font-medium">{event.threatType}</td>
                                    <td className="p-4 align-middle">
                                        <Badge variant="outline" className={`gap-1.5 pr-3 py-0.5 backdrop-blur-sm ${getSeverityStyles(event.severity)}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                event.severity === "CRITICAL" ? "bg-red-500" :
                                                event.severity === "HIGH" ? "bg-orange-500" :
                                                event.severity === "MEDIUM" ? "bg-yellow-500" : "bg-blue-500"
                                            }`} />
                                            {event.severity}
                                        </Badge>
                                    </td>
                                    <td className="p-4 align-middle text-right">
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="font-medium tabular-nums text-foreground">
                                                {(event.confidence * 100).toFixed(1)}%
                                            </span>
                                            <div className="h-1 w-16 bg-muted rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${event.confidence > 0.9 ? 'bg-red-500' : 'bg-primary'}`} 
                                                    style={{ width: `${event.confidence * 100}%` }} 
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                                <DropdownMenuItem>Block IP</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Report False Positive</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Empty State / Pagination Placeholder */}
                <div className="bg-muted/20 border-t p-3 flex items-center justify-between text-xs text-muted-foreground">
                    <p>Showing 5 most recent events</p>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" disabled className="h-7 text-xs">Previous</Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">Next</Button>
                    </div>
                </div>
            </Card>
        </div>
      </main>
    </div>
  )
}

function StatCard({ title, value, icon, subtext, trend, trendUp }: { 
    title: string, 
    value: string | number, 
    icon: React.ReactNode,
    subtext?: string,
    trend?: string,
    trendUp?: boolean
}) {
    return (
        <Card className="border-border/60 shadow-sm hover:border-border transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-foreground">{value}</div>
                {(subtext || trend) && (
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                        {trend && (
                            <span className={`mr-2 font-medium ${trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
                                {trend}
                            </span>
                        )}
                        {subtext}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}