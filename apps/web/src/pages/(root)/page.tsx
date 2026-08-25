import { Link } from "react-router";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import iotBg from "@/assets/iot-mesh-background.jpg";

export default function RootPage() {
  return (
    <main className="grid min-h-screen w-full grid-cols-1 md:grid-cols-2 bg-slate-50">
      {/* Left Side - Hero Section with IoT Background */}
      <div className="relative z-10 flex flex-col items-center justify-center p-8 text-white shadow-[10px_0px_10px_-5px_rgba(0,0,0,0.3)] md:p-12 overflow-hidden bg-slate-950">
        {/* Background Image & Overlay */}
        <img
          src={iotBg}
          alt="IoT Mesh"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-linear-to-br from-blue-950/80 via-slate-950/80 to-indigo-950/80" />

        {/* Minimal Title & Subtitle */}
        <div className="relative z-10 max-w-md space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            IoT Dashboard
          </h1>
          <p className="text-lg font-light text-blue-100">
            Centralized platform for aggregating, controlling, and monitoring smart devices.
          </p>
        </div>
      </div>

      {/* Right Side - Interaction */}
      <div className="flex flex-col items-center justify-center p-8 md:p-12">
        <div className="flex w-full max-w-sm flex-col items-center space-y-8 rounded-2xl bg-white p-8 shadow-xs ring-1 ring-slate-200">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Welcome to the System
            </h2>
            <p className="text-sm text-slate-500">
              Access the main panel to view and manage devices.
            </p>
          </div>

          <Link
            to="/dashboard"
            className={cn(buttonVariants({ size: "lg" }), "w-full")}
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}