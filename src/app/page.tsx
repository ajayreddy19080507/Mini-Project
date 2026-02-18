import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Calendar, Layers, Users, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 relative z-10">

      {/* Hero Section */}
      <div className="text-center max-w-3xl space-y-6 mb-20 animate-in fade-in slide-in-from-bottom-5 duration-700">
        <div className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-blue-600 uppercase bg-blue-100/50 rounded-full border border-blue-200 backdrop-blur-sm">
          Next-Gen Academic Scheduling
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900">
          Timetables, <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">Reimagined.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Create conflict-free, balanced schedules for your entire college in seconds.
          Powered by intelligent algorithms and wrapped in a stunning interface.
        </p>

        <div className="flex gap-4 justify-center pt-4">
          <Link href="/dashboard">
            <Button className="h-12 px-8 text-lg rounded-full shadow-blue-500/20 shadow-xl">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" className="h-12 px-8 text-lg rounded-full bg-white/60 backdrop-blur-md border-white/40">
              Admin Login
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
        <GlassCard className="space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
            <Calendar className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Smart Scheduling</h3>
          <p className="text-gray-500">
            Automatically generates conflict-free timetables considering all constraints like labs, room availability, and faculty load.
          </p>
        </GlassCard>

        <GlassCard className="space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Workload Balance</h3>
          <p className="text-gray-500">
            Ensures fair distribution of classes among faculty. Avoids burnout by intelligently spacing out lectures.
          </p>
        </GlassCard>

        <GlassCard className="space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-600">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Seamless Integration</h3>
          <p className="text-gray-500">
            Import data directly from Excel templates. Manage faculty, subjects, and rooms in one unified dashboard.
          </p>
        </GlassCard>
      </div>

    </main>
  );
}
