"use client"

export default function HeroSection() {
  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-4xl md:text-5xl font-bold text-balance">Network Threat Detection</h2>
        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Cortex IDS uses advanced machine learning to analyze NetFlow data and identify malicious network patterns.
          Upload your traffic data to detect and classify intrusion attempts in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <div className="p-4 rounded-lg bg-card border border-border/50 hover:border-accent/50 transition-colors">
          <div className="text-accent font-bold text-sm mb-2">01</div>
          <h3 className="font-semibold text-foreground mb-1">Upload NetFlow Data</h3>
          <p className="text-sm text-muted-foreground">Submit CSV files containing NetFlow protocol packets</p>
        </div>

        <div className="p-4 rounded-lg bg-card border border-border/50 hover:border-accent/50 transition-colors">
          <div className="text-accent font-bold text-sm mb-2">02</div>
          <h3 className="font-semibold text-foreground mb-1">AI Analysis</h3>
          <p className="text-sm text-muted-foreground">Machine learning models classify attack patterns</p>
        </div>

        <div className="p-4 rounded-lg bg-card border border-border/50 hover:border-accent/50 transition-colors">
          <div className="text-accent font-bold text-sm mb-2">03</div>
          <h3 className="font-semibold text-foreground mb-1">Threat Classification</h3>
          <p className="text-sm text-muted-foreground">Detailed reports for each detected anomaly</p>
        </div>
      </div>
    </section>
  )
}
