import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export default function RootPage() {
  return (
    <main className="grid min-h-screen w-full grid-cols-1 md:grid-cols-2 bg-slate-50">

      {/* Left Side - Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-900 p-8 text-white shadow-[10px_0px_10px_-5px_rgba(0,0,0,0.3)] md:p-12">
        <div className="max-w-md space-y-4 text-center">
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
        <div className="flex w-full max-w-sm flex-col items-center space-y-8 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">

          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Welcome to the System
            </h2>
            <p className="text-sm text-slate-500">
              Access the main panel to view and manage devices.
            </p>
          </div>

          <Link to="dashboard" className="w-full">
            <Button className="w-full" size="lg">
              Go to Dashboard
            </Button>
          </Link>

        </div>
      </div>

    </main>
  );
}