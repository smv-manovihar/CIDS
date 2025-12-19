"use client"

import { useState, useEffect } from "react"
import Header from "@/components/header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, TrendingUp, AlertTriangle, Zap, Network, Clock, BarChart3, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

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

  useEffect(() => {
    const fetchMonitoringData = async () => {
      // Placeholder API call
      console.log("[v0] Network monitoring request:")
      console.log("[v0] Endpoint: GET /api/monitor/live")
      console.log("[v0] Streaming real-time network data...")

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Dummy monitoring data
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

      console.log("[v0] API Response - Recent events:", dummyEvents)
      console.log("[v0] API Response - Statistics:", dummyStats)

      setNetworkEvents(dummyEvents)
      setStats(dummyStats)
      setLastUpdated(new Date())
    }

    fetchMonitoringData()

    // Simulate live updates when isLive is true
    if (isLive) {
      const interval = setInterval(() => {
        setLastUpdated(new Date())
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [isLive])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "HIGH":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "LOW":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getSeverityIcon = (severity: string) => {
    return severity === "CRITICAL" || severity === "HIGH" ? (
      <AlertTriangle className="w-4 h-4" />
    ) : (
      <Activity className="w-4 h-4" />
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Network Monitoring</h1>
            <p className="text-muted-foreground">Real-time threat detection and network activity analysis</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right text-sm">
              <p className="text-muted-foreground">Last updated</p>
              <p className="text-accent font-mono">{lastUpdated.toLocaleTimeString()}</p>
            </div>
            <Button
              variant={isLive ? "default" : "outline"}
              size="sm"
              onClick={() => setIsLive(!isLive)}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {isLive ? "Live" : "Paused"}
            </Button>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="p-4 border-border cyber-glow-accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Threats Detected</p>
                <p className="text-2xl font-bold text-foreground">{stats.threatsDetected}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-accent opacity-50" />
            </div>
          </Card>

          <Card className="p-4 border-border cyber-glow-accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Active Connections</p>
                <p className="text-2xl font-bold text-foreground">{stats.activeConnections}</p>
              </div>
              <Network className="w-8 h-8 text-accent opacity-50" />
            </div>
          </Card>

          <Card className="p-4 border-border cyber-glow-accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Avg Confidence</p>
                <p className="text-2xl font-bold text-accent">{(stats.avgConfidence * 100).toFixed(0)}%</p>
              </div>
              <Zap className="w-8 h-8 text-accent opacity-50" />
            </div>
          </Card>

          <Card className="p-4 border-border cyber-glow-accent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">System Uptime</p>
                <p className="text-2xl font-bold text-foreground">{stats.uptime}</p>
              </div>
              <Clock className="w-8 h-8 text-accent opacity-50" />
            </div>
          </Card>
        </div>

        {/* Events Table */}
        <Card className="border-border overflow-hidden">
          <div className="p-6 border-b border-border flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-foreground">Recent Threats</h2>
            {isLive && (
              <div className="ml-auto flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">Live</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Source IP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Destination IP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Threat Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Severity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {networkEvents.map((event) => (
                  <tr key={event.id} className="border-b border-border hover:bg-card/30 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-foreground">{event.sourceIP}</td>
                    <td className="px-6 py-3 font-mono text-xs text-foreground">{event.destinationIP}</td>
                    <td className="px-6 py-3 text-foreground">{event.threatType}</td>
                    <td className="px-6 py-3">
                      <Badge className={`gap-1.5 ${getSeverityColor(event.severity)}`}>
                        {getSeverityIcon(event.severity)}
                        {event.severity}
                      </Badge>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-card border border-border overflow-hidden">
                          <div className="h-full bg-accent" style={{ width: `${event.confidence * 100}%` }} />
                        </div>
                        <span className="text-accent font-medium">{(event.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </main>
  )
}
