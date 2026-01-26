"use client";

import { CheckCircle } from "lucide-react";
import { getWaitlistConfig } from "../../config/waitlist.config";
import { WaitlistForm } from "../forms/WaitlistForm";

export function WaitlistHeroSection() {
  const config = getWaitlistConfig();

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              {config.heroTitle && (
                <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">{config.heroTitle}</h1>
              )}
              {config.heroSubtitle && (
                <p className="text-muted-foreground text-xl md:text-2xl">{config.heroSubtitle}</p>
              )}
              {config.heroDescription && <p className="text-muted-foreground">{config.heroDescription}</p>}
            </div>

            {/* Benefits */}
            {config.benefits && config.benefits.length > 0 && (
              <ul className="space-y-3">
                {config.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="text-primary mt-0.5 h-5 w-5 shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Right Column - Form */}
          <div className="lg:pl-8">
            <div className="bg-card rounded-lg border p-6 shadow-lg md:p-8">
              <WaitlistForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
