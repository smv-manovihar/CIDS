"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { theme, resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const features = [
    {
      icon: Shield,
      title: "Advanced Threat Detection",
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

  const currentImage =
    mounted && (theme === "dark" || resolvedTheme === "dark")
      ? "/dark-mode.png"
      : "/light-mode.png";

  return (
    <main className="min-h-screen bg-background selection:bg-primary/20">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-24 border-b border-border">
        <div className="container mx-auto px-4 md:px-12 lg:px-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="flex flex-col gap-6 max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">
              {/* 1. Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.15]">
                Network Intrusion <br />
                <span className="text-primary">Detection System</span>
              </h1>

              {/* 2. Description (Now naturally second) */}
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium lg:font-normal">
                Advanced AI-powered network threat detection with high
                precision.
              </p>

              {/* 3. Button Section (Now naturally third) */}
              {/* Removed w-full to prevent full width stretching on mobile/tablet */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/inference">
                  <Button
                    size="lg"
                    className="w-auto gap-2 shadow-lg shadow-primary/20 h-12 text-base px-8"
                  >
                    Start Detection <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Content (Desktop Image) */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-full max-w-[600px] aspect-video">
                {/* Branding Glow */}
                <div
                  className={`absolute inset-0 bg-linear-to-br ${
                    mounted && (theme === "dark" || resolvedTheme === "dark")
                      ? "from-primary/30 to-accent/30"
                      : "from-primary/20 to-accent/20"
                  } rounded-2xl blur-3xl transform scale-110`}
                />

                {/* Image Container */}
                <div className="relative w-full h-full rounded-xl overflow-hidden">
                  {mounted && (
                    <img
                      src={currentImage}
                      alt="IDS Dashboard Preview "
                      className="w-full h-full object-cover md:object-contain"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 md:px-12 lg:px-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Powerful Detection Capabilities
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to identify and respond to network threats
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="mb-6 p-4 bg-primary/10 rounded-xl w-fit group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4 md:px-12 lg:px-24 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Protect Your Network?
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Upload your NetFlow data or manually test records with our
              advanced detection system immediately.
            </p>
            <Link href="/inference">
              <Button size="lg" className="gap-2 h-12 px-8 text-base">
                Launch Inference Dashboard <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
