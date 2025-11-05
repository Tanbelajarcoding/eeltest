"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, ArrowLeft, Search, Plane } from "lucide-react";
import { GmfLogo } from "@/components/GmfLogo";

interface Aircraft {
  id: number;
  registration: string;
  msn: string;
  fleetType: {
    id: number;
    name: string;
  };
  drawing: {
    id: number;
    drawingNumber: string;
    title: string;
  } | null;
  _count: {
    equipment: number;
  };
}

interface FleetType {
  id: number;
  name: string;
  manufacturer: string;
  model: string;
}

interface Drawing {
  id: number;
  drawingNumber: string;
  title: string;
}

export default function AircraftManagementPage() {
  const router = useRouter();
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [fleetTypes, setFleetTypes] = useState<FleetType[]>([]);
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    registration: "",
    msn: "",
    fleetTypeId: "",
    drawingId: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [aircraftRes, fleetTypesRes, drawingsRes] = await Promise.all([
        fetch("/api/admin/aircraft"),
        fetch("/api/admin/fleet-types"),
        fetch("/api/admin/drawings"),
      ]);

      if (aircraftRes.ok) setAircraft(await aircraftRes.json());
      if (fleetTypesRes.ok) setFleetTypes(await fleetTypesRes.json());
      if (drawingsRes.ok) setDrawings(await drawingsRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId
        ? `/api/admin/aircraft/${editingId}`
        : "/api/admin/aircraft";

      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchData();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          registration: "",
          msn: "",
          fleetTypeId: "",
          drawingId: "",
        });
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save aircraft");
      }
    } catch (error) {
      console.error("Error saving aircraft:", error);
      alert("Failed to save aircraft");
    }
  };

  const handleEdit = (ac: Aircraft) => {
    setEditingId(ac.id);
    setFormData({
      registration: ac.registration,
      msn: ac.msn,
      fleetTypeId: ac.fleetType.id.toString(),
      drawingId: ac.drawing?.id.toString() || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this aircraft?")) return;

    try {
      const res = await fetch(`/api/admin/aircraft/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchData();
      } else {
        alert("Failed to delete aircraft");
      }
    } catch (error) {
      console.error("Error deleting aircraft:", error);
      alert("Failed to delete aircraft");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-[#006298] to-[#004d7a] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="hover:bg-[#004d7a] p-2 rounded"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <Plane className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Aircraft Management</h1>
              <p className="text-blue-100 text-sm">
                Manage aircraft fleet and assignments
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by registration or MSN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006298] focus:border-transparent text-gray-900"
            />
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">
                {editingId ? "Edit Aircraft" : "Add New Aircraft"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.registration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        registration: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="PK-GFR"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006298] text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    MSN (Manufacturer Serial Number){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.msn}
                    onChange={(e) =>
                      setFormData({ ...formData, msn: e.target.value })
                    }
                    placeholder="38728"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006298] text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fleet Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.fleetTypeId}
                    onChange={(e) =>
                      setFormData({ ...formData, fleetTypeId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006298] text-gray-900"
                  >
                    <option value="">Select Fleet Type</option>
                    {(() => {
                      // Filter to show only active fleet types (used by aircraft)
                      const activeFleetTypeIds = new Set(
                        aircraft.map((a) => a.fleetType.id)
                      );
                      return fleetTypes
                        .filter((ft) => activeFleetTypeIds.has(ft.id))
                        .map((ft) => (
                          <option key={ft.id} value={ft.id}>
                            {ft.name} ({ft.manufacturer})
                          </option>
                        ));
                    })()}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Drawing (Optional)
                  </label>
                  <select
                    value={formData.drawingId}
                    onChange={(e) =>
                      setFormData({ ...formData, drawingId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006298] text-gray-900"
                  >
                    <option value="">No Drawing</option>
                    {drawings.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.drawingNumber} - {d.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-[#006298] text-white px-4 py-2.5 rounded-lg hover:bg-[#004d7a] font-medium transition-colors shadow-sm"
                  >
                    {editingId ? "Update Aircraft" : "Create Aircraft"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-300 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MSN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fleet Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Drawing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipment
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {aircraft.filter(
                  (ac) =>
                    ac.registration
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                    ac.msn.toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center text-gray-500"
                    >
                      <Plane className="w-12 h-12 mx-auto mb-4 opacity-20 text-[#006298]" />
                      <p className="text-base font-medium">
                        {searchTerm
                          ? "No aircraft found matching your search."
                          : "No aircraft found. Add your first aircraft to get started."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  aircraft
                    .filter(
                      (ac) =>
                        ac.registration
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        ac.msn.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((ac) => (
                      <tr
                        key={ac.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-[#006298]">
                          {ac.registration}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {ac.msn}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {ac.fleetType.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {ac.drawing ? (
                            <span className="text-sm">
                              {ac.drawing.drawingNumber}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">
                              Not assigned
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {ac._count.equipment} items
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(ac)}
                            className="text-[#006298] hover:text-[#004d7a] mr-4 transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(ac.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
