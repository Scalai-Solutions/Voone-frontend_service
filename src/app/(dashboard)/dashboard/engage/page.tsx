"use client";

import * as React from "react";
import { BellRing, CalendarClock, CheckCircle2, Clock3, MapPin, Send, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const triggerRules = [
  { id: "visit", label: "After visit", detail: "Send after points are credited", time: "10 minutes" },
  { id: "inactive", label: "Win-back", detail: "Send when a member has not visited", time: "30 days" },
  { id: "birthday", label: "Birthday", detail: "Send a birthday credit reminder", time: "09:00" },
  { id: "tier", label: "Tier close", detail: "Send when a member is near a reward", time: "80% progress" },
];

const recentDispatches = [
  "Veronica received Hydrafacial reward reminder",
  "Mateo entered the Diamond Skin geofence",
  "Lucia received win-back message",
];

export default function NotificationsPage() {
  const [selectedRule, setSelectedRule] = React.useState("visit");
  const activeRule = triggerRules.find((rule) => rule.id === selectedRule) ?? triggerRules[0];

  return (
    <div className="space-y-5">
      <section className="voone-dark-panel px-5 py-6 md:px-8">
        <div className="voone-grain pointer-events-none absolute inset-0 opacity-[0.08]" />
        <div className="relative flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="voone-kicker">Notifications</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-white">Notification center</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/58">Create wallet push rules for visits, rewards, birthdays, and nearby-location reminders.</p>
          </div>
          <div className="rounded-2xl border border-white/12 bg-white/[0.07] px-4 py-3 text-sm text-white/70">
            <span className="font-serif text-3xl text-white">4</span> active rules
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card className="rounded-[24px] border-[#d8c5b6] bg-[#fffaf3]/88 shadow-[0_22px_60px_-46px_rgba(67,48,43,0.72)] backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarClock className="h-5 w-5 text-gold" />
                When should it send?
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {triggerRules.map((rule) => (
                <button
                  key={rule.id}
                  type="button"
                  className={`rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 ${selectedRule === rule.id ? "border-[#241612] bg-[#241612] text-white shadow-[0_18px_44px_-32px_rgba(36,22,18,0.9)]" : "border-border bg-white/60"}`}
                  onClick={() => setSelectedRule(rule.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold">{rule.label}</span>
                    <span className={selectedRule === rule.id ? "rounded-full bg-white/12 px-2.5 py-1 text-[11px] text-gold-light" : "rounded-full bg-gold/10 px-2.5 py-1 text-[11px] font-bold text-[#7a5526]"}>{rule.time}</span>
                  </div>
                  <p className={selectedRule === rule.id ? "mt-2 text-sm leading-5 text-white/62" : "mt-2 text-sm leading-5 text-muted-foreground"}>{rule.detail}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[24px] border-[#d8c5b6] bg-[#fffaf3]/88 shadow-[0_22px_60px_-46px_rgba(67,48,43,0.72)] backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3 text-lg">
                <span className="flex items-center gap-2"><BellRing className="h-5 w-5 text-gold" /> Message and trigger</span>
                <span className="rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-xs font-bold text-[#7a5526]">{activeRule.label}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Audience">
                <select className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none">
                  <option>All active members</option>
                  <option>Gold tier</option>
                  <option>Wallet not added</option>
                  <option>Near clinic location</option>
                </select>
              </Field>
              <Field label="Delivery window">
                <select className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none">
                  <option>Immediately when rule matches</option>
                  <option>Morning, 09:00-11:00</option>
                  <option>Afternoon, 15:00-18:00</option>
                </select>
              </Field>
              <Field label="Notification title" className="md:col-span-2">
                <Input placeholder="Your next reward is close" />
              </Field>
              <Field label="Push body" className="md:col-span-2">
                <Textarea placeholder="Book your next visit this week and we will add bonus points to your pass." />
              </Field>
              <Button className="h-12 rounded-2xl md:col-span-2">
                <Send className="mr-2 h-4 w-4" /> Save notification rule
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[24px] border-[#d8c5b6] bg-[#fffaf3]/88 shadow-[0_22px_60px_-46px_rgba(67,48,43,0.72)] backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><MapPin className="h-5 w-5 text-gold" /> Geolocation trigger</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Address" className="md:col-span-2">
                <Input placeholder="Calle de Serrano 41, Madrid" />
              </Field>
              <Field label="Latitude"><Input inputMode="decimal" placeholder="40.4264" /></Field>
              <Field label="Longitude"><Input inputMode="decimal" placeholder="-3.6879" /></Field>
              <Field label="Radius"><Input placeholder="250 m" /></Field>
              <Field label="Cooldown"><Input placeholder="7 days" /></Field>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <div className="voone-dark-panel p-5">
            <div className="voone-grain pointer-events-none absolute inset-0 opacity-[0.08]" />
            <div className="relative">
              <p className="voone-kicker">Preview</p>
              <div className="mt-4 rounded-[34px] border border-white/12 bg-[#0b0706] p-3 shadow-2xl">
                <div className="rounded-[28px] bg-[#f4eee8] p-4 text-[#241612]">
                  <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#241612] text-gold-light"><Smartphone className="h-5 w-5" /></span>
                    <div>
                      <p className="text-sm font-bold">Voone Wallet</p>
                      <p className="text-xs text-muted-foreground">Your next reward is close</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl bg-[#241612] p-4 text-white">
                    <p className="text-xs uppercase tracking-[0.18em] text-gold-light/70">Selected trigger</p>
                    <p className="mt-2 font-serif text-2xl font-semibold">{activeRule.label}</p>
                    <p className="mt-2 text-sm text-white/58">{activeRule.detail}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Card className="rounded-[24px] border-[#d8c5b6] bg-[#fffaf3]/88 shadow-[0_22px_60px_-46px_rgba(67,48,43,0.72)] backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock3 className="h-5 w-5 text-gold" /> Recent activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentDispatches.map((dispatch) => (
                <div key={dispatch} className="voone-soft-row flex items-center gap-3 px-4 py-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  <span className="font-medium">{dispatch}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label className="mb-2 block text-sm font-semibold">{label}</Label>
      {children}
    </div>
  );
}