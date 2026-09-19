import { CheckCircle2, Clock3, Headphones, MessageCircle, Search, Send, ShieldAlert } from "lucide-react";

import { PageHeader } from "@/components/shared/page-kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const threads = [
  { clinic: "Clínica Aurea", title: "Google save link returns an expired session", status: "Open", priority: "High", replies: 4, time: "12 min" },
  { clinic: "Luma Skin Studio", title: "Need help changing tier rewards before launch", status: "Pending", priority: "Medium", replies: 2, time: "38 min" },
  { clinic: "Nova Esthetics", title: "Can we add a second owner email?", status: "Answered", priority: "Low", replies: 6, time: "1h" },
];

export default function AdminCustomerCarePage() {
  const active = threads[0];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Support" title="Customer Care" description="A clinic forum-style inbox for questions, implementation issues, and Voone replies." />

      <section className="grid gap-4 md:grid-cols-3">
        <CareStat icon={Headphones} label="Open queries" value="12" detail="Across all clinics" />
        <CareStat icon={Clock3} label="Median response" value="18m" detail="This week" />
        <CareStat icon={CheckCircle2} label="Resolved" value="94%" detail="30 day close rate" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[26px] border border-[#ded2cb] bg-white/78 p-5 shadow-[0_24px_70px_-50px_rgba(67,48,43,0.68)] backdrop-blur-xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search clinic questions" className="h-11 rounded-2xl border-[#d9c9b6] bg-[#fffaf3]/86 pl-9 shadow-sm" />
          </div>
          <div className="mt-5 space-y-3">
            {threads.map((thread) => (
              <button key={thread.title} type="button" className="w-full rounded-2xl border border-[#e4d8d1] bg-[#fffaf6]/86 p-4 text-left transition hover:bg-white">
                <div className="flex items-start justify-between gap-4">
                  <span><span className="block font-semibold">{thread.title}</span><span className="mt-1 block text-xs text-[#8c7870]">{thread.clinic} · {thread.replies} replies · {thread.time}</span></span>
                  <Badge variant={thread.status === "Open" ? "destructive" : thread.status === "Answered" ? "default" : "secondary"}>{thread.status}</Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] bg-[#211918] p-6 text-[#fff8f2] shadow-[0_20px_60px_rgba(67,42,30,0.14)]">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#d6a979]">Active thread</p><h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight">{active.title}</h2><p className="mt-2 text-sm text-[#c9bbb3]">{active.clinic} · Priority {active.priority}</p></div>
            <ShieldAlert className="h-6 w-6 text-[#d6a979]" />
          </div>

          <div className="mt-6 space-y-3">
            <div className="max-w-[82%] rounded-2xl border border-white/10 bg-white/[0.07] p-4 text-sm"><p className="font-semibold">Clinic</p><p className="mt-2 text-[#c9bbb3]">The Wallet button opens but Google reports the session expired for two test members.</p></div>
            <div className="ml-auto max-w-[82%] rounded-2xl bg-[#f1d6bd] p-4 text-sm text-[#402d26]"><p className="font-semibold">Voone</p><p className="mt-2">We are checking the link TTL and will regenerate the save URL for both members.</p></div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.07] p-3">
            <Textarea placeholder="Write a reply to the clinic" className="min-h-28 border-white/10 bg-[#2b211f] text-[#fff8f2] placeholder:text-[#9e8b80]" />
            <div className="mt-3 flex justify-between gap-3"><Button variant="outline" className="rounded-full border-[#8f6b5b] bg-transparent text-[#fff6ed] hover:bg-[#8a604b] hover:text-white"><MessageCircle className="mr-2 h-4 w-4" /> Add note</Button><Button className="rounded-full bg-[#f1d6bd] text-[#402d26] hover:bg-[#f5e5d4]"><Send className="mr-2 h-4 w-4" /> Send reply</Button></div>
          </div>
        </div>
      </section>
    </div>
  );
}

function CareStat({ icon: Icon, label, value, detail }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[24px] border border-[#d9c9b6] bg-[#fffaf3]/88 p-5 shadow-[0_24px_70px_-50px_rgba(67,48,43,0.74)]">
      <div className="flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a47845]">{label}</p><Icon className="h-5 w-5 text-[#a47845]" /></div>
      <p className="mt-4 font-serif text-4xl font-semibold">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}