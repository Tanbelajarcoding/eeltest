"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GmfLogo } from "@/components/GmfLogo";
import { Users, FileText, Package, LogOut, Plane } from "lucide-react";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalAircraft: 0,
    totalDrawings: 0,
    totalEquipmentTypes: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session && session.user?.role !== "ADMIN") {
      router.push("/user/search");
    }
  }, [session, status, router]);

  useEffect(() => {
    // Fetch stats
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error(err));
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006298]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#006298] to-[#004d7a] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <GmfLogo
                width={160}
                height={42}
                className="w-[120px] sm:w-[160px] h-auto"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm whitespace-nowrap hidden lg:inline">
                Welcome, {session?.user?.name}
              </span>
              <button
                onClick={() => router.push("/api/auth/signout")}
                className="flex items-center gap-2 bg-[#004d7a] hover:bg-[#003d5e] px-3 sm:px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#006298]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  Total Aircraft
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalAircraft}
                </p>
              </div>
              <Plane className="w-12 h-12 text-[#006298] opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Drawings</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalDrawings}
                </p>
              </div>
              <FileText className="w-12 h-12 text-orange-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  Equipment Types
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalEquipmentTypes}
                </p>
              </div>
              <Package className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalUsers}
                </p>
              </div>
              <Users className="w-12 h-12 text-purple-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push("/admin/aircraft")}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#006298] hover:bg-[#006298]/5 transition-all text-left"
            >
              <Plane className="w-6 h-6 text-[#006298] mb-2" />
              <h3 className="font-semibold text-gray-900">Manage Aircraft</h3>
              <p className="text-sm text-gray-600">
                Add or edit aircraft details
              </p>
            </button>

            <button
              onClick={() => router.push("/admin/drawings")}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all text-left"
            >
              <FileText className="w-6 h-6 text-orange-500 mb-2" />
              <h3 className="font-semibold text-gray-900">Manage Drawings</h3>
              <p className="text-sm text-gray-600">
                Upload and configure diagrams
              </p>
            </button>

            <button
              onClick={() => router.push("/admin/equipment")}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all text-left"
            >
              <Package className="w-6 h-6 text-green-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Manage Equipment</h3>
              <p className="text-sm text-gray-600">
                Add equipment types and parts
              </p>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Getting Started
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-[#006298]/5 rounded-lg border border-[#006298]/10">
              <div className="w-7 h-7 rounded-full bg-[#006298] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Create Equipment Types
                </h4>
                <p className="text-sm text-gray-600">
                  Add emergency equipment catalog with part numbers
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-[#006298]/5 rounded-lg border border-[#006298]/10">
              <div className="w-7 h-7 rounded-full bg-[#006298] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Upload Aircraft Diagram
                </h4>
                <p className="text-sm text-gray-600">
                  Create drawing and upload JPG diagram
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-[#006298]/5 rounded-lg border border-[#006298]/10">
              <div className="w-7 h-7 rounded-full bg-[#006298] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Mark Equipment Locations
                </h4>
                <p className="text-sm text-gray-600">
                  Click on diagram to add markers and assign equipment
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-[#006298]/5 rounded-lg border border-[#006298]/10">
              <div className="w-7 h-7 rounded-full bg-[#006298] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Register Aircraft
                </h4>
                <p className="text-sm text-gray-600">
                  Add aircraft and auto-populate equipment from template
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
