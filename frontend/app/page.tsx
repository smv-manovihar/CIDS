"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import Header from "@/components/header";
import ColumnsDialog from "@/components/columns-dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [showColumnsDialog, setShowColumnsDialog] = useState(false);
  const { theme } = useTheme();

  const features = [
    {
      icon: Shield,
      title: "Real-Time Detection",
      description: "Detect network threats instantly with advanced ML models",
    },
    {
      icon: TrendingUp,
      title: "Multi-Model Support",
      description: "Test and compare different detection algorithms",
    },
    {
      icon: Zap,
      title: "Fast Analysis",
      description: "Process millions of network flows in seconds",
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-20 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-3">
                <h1 className="text-5xl md:text-6xl font-bold text-balance leading-tight">
                  Network Intrusion Detection
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                  Cortex IDS uses advanced machine learning to detect and
                  classify malicious network activities in real-time. Protect
                  your infrastructure from threats.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/inference">
                  <Button size="lg" className="w-full sm:w-auto gap-2">
                    Start Detection <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Button
                  onClick={() => setShowColumnsDialog(true)}
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  View Data Schema
                </Button>
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-full h-80">
                <div
                  className={`absolute inset-0 bg-linear-to-br ${
                    theme === "dark"
                      ? "from-primary/20 to-accent/20"
                      : "from-primary/20 to-accent/10"
                  } rounded-2xl blur-3xl`}
                />
                <img
                  src={theme === "dark" ? "/dark-mode.png" : "/light-mode.png"}
                  alt={theme === "dark" ? "Dark Mode" : "Light Mode"}
                  className="relative w-full h-full object-cover rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Detection Capabilities
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to identify and respond to network threats
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-lg bg-card border border-border hover:border-accent/50 transition-all hover:bg-card/80"
                >
                  <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 border-t border-border bg-card/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Protect Your Network?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Upload your NetFlow data or manually test records with our advanced
            detection system
          </p>
          <Link href="/inference">
            <Button size="lg" className="gap-2">
              Launch Inference Dashboard <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <ColumnsDialog
        open={showColumnsDialog}
        onOpenChange={setShowColumnsDialog}
      />
    </main>
  );
}
