"use client"

import { Menu, Moon, Sun, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export default function Header() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/inference", label: "Inference" },
    { href: "/monitor", label: "Monitor" },
  ]

  const isActive = (href: string) => pathname === href
  const isDark = theme === "dark"

  return (
    <header className="border-b border-border bg-card/60 backdrop-blur-xl sticky top-0 z-50">
      <div className="container relative mx-auto px-4 py-3 flex items-center justify-between gap-3">
        
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity z-10">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">Cortex IDS</h1>
            <p className="text-[11px] md:text-xs text-muted-foreground">AI-powered Threat Detection</p>
          </div>
        </Link>

        {/* Desktop Navigation - Centered Absolutely */}
        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 rounded-full transition-colors text-sm font-medium ${
                isActive(item.href)
                  ? "bg-primary/15 text-accent border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/70"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-3 z-10">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              className="rounded-full border border-border/60 bg-card/60 hover:bg-accent/10"
              onClick={() => setTheme(isDark ? "light" : "dark")}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden z-10">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              className="rounded-full border border-border/60 bg-card/60 hover:bg-accent/10"
              onClick={() => setTheme(isDark ? "light" : "dark")}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          )}
          
          {/* Mobile Toggle Button with Seamless Icon Transition */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-full relative" // Added relative for absolute positioning of children
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            {/* Menu Icon: visible when closed, rotates out when open */}
            <Menu 
              className={`w-5 h-5 transition-all duration-300 ease-in-out ${
                mobileMenuOpen 
                  ? "rotate-90 opacity-0 scale-50" 
                  : "rotate-0 opacity-100 scale-100"
              }`} 
            />
            
            {/* Close Icon: invisible when closed, rotates in when open */}
            <X 
              className={`w-5 h-5 absolute transition-all duration-300 ease-in-out ${
                mobileMenuOpen 
                  ? "rotate-0 opacity-100 scale-100" 
                  : "-rotate-90 opacity-0 scale-50"
              }`} 
            />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Container */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="border-t border-border bg-card/90 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-lg transition-colors text-sm font-medium text-center ${
                  isActive(item.href)
                    ? "bg-primary/20 text-accent font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/70"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  )
}