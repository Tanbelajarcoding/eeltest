"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit,
  Trash2,
  FileImage,
  ArrowLeft,
  Search,
  MapPin,
} from "lucide-react";
import { FileUpload } from "@/components/FileUpload";

interface Drawing {
  id: number;
  drawingNumber: string;
  title: string;
  revision: string;
  diagramImage: string | null;
  fleetType: {
    id: number;
    name: string;
  };
  aircraft: Array<{
    registration: string;
  }>;
  _count: {
    locations: number;
    aircraft: number;
  };
}

interface FleetType {
  id: number;
  name: string;
  manufacturer: string;
  model: string;
}

export default function DrawingsManagementPage() {
  const router = useRouter();
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [fleetTypes, setFleetTypes] = useState<FleetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    drawingNumber: "",
    title: "",
    revision: "",
    fleetTypeName: "", // Single input for fleet type
    diagramImage: "",
    aircraftRegistrations: "",
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredFleetTypes, setFilteredFleetTypes] = useState<FleetType[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [drawingsRes, fleetTypesRes] = await Promise.all([
        fetch("/api/admin/drawings-list"),
        fetch("/api/admin/fleet-types"),
      ]);

      if (drawingsRes.ok) setDrawings(await drawingsRes.json());
      if (fleetTypesRes.ok) setFleetTypes(await fleetTypesRes.json());
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
        ? `/api/admin/drawings-manage/${editingId}`
        : "/api/admin/drawings-manage";

      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const result = await res.json();
        setShowForm(false);
        setEditingId(null);
        setFormData({
          drawingNumber: "",
          title: "",
          revision: "",
          fleetTypeName: "",
          diagramImage: "",
          aircraftRegistrations: "",
        });
        setShowSuggestions(false);

        // If creating new drawing, redirect to editor
        if (!editingId && result.id) {
          router.push(`/admin/drawings/${result.id}/editor`);
        } else {
          await fetchData();
        }
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save drawing");
      }
    } catch (error) {
      console.error("Error saving drawing:", error);
      alert("Failed to save drawing");
    }
  };

  const handleEdit = (drawing: Drawing) => {
    setEditingId(drawing.id);
    const registrations = drawing.aircraft
      .map((a) => a.registration)
      .join(", ");
    setFormData({
      drawingNumber: drawing.drawingNumber,
      title: drawing.title,
      revision: drawing.revision,
      fleetTypeName: drawing.fleetType.name,
      diagramImage: drawing.diagramImage || "",
      aircraftRegistrations: registrations,
    });
    setShowSuggestions(false);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this drawing?")) return;

    try {
      const res = await fetch(`/api/admin/drawings-manage/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchData();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete drawing");
      }
    } catch (error) {
      console.error("Error deleting drawing:", error);
      alert("Failed to delete drawing");
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
              className="hover:bg-[#004d7a] p-2 rounded transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <FileImage className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Drawings Management</h1>
              <p className="text-blue-100 text-sm">
                Manage aircraft diagrams and equipment locations
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
              placeholder="Search by drawing number or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006298] focus:border-transparent text-gray-900"
            />
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData({
                drawingNumber: "",
                title: "",
                revision: "",
                fleetTypeName: "",
                diagramImage: "",
                aircraftRegistrations: "",
              });
              setShowSuggestions(false);
            }}
            className="flex items-center gap-2 bg-[#006298] text-white px-4 py-2.5 rounded-lg hover:bg-[#004d7a] font-medium transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus size={20} />
            Add Drawing
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
                <h2 className="text-2xl font-bold">
                  {editingId ? "Edit Drawing" : "Add New Drawing"}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Drawing Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.drawingNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        drawingNumber: e.target.value,
                      })
                    }
                    placeholder="10000097352-001-04"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Emergency Equipment List - B737-800"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Revision <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.revision}
                    onChange={(e) =>
                      setFormData({ ...formData, revision: e.target.value })
                    }
                    placeholder="04"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fleet Type <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.fleetTypeName}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({ ...formData, fleetTypeName: value });

                        // Filter fleet types based on input - only show active ones
                        if (value.trim()) {
                          // Get fleet types that are currently used by drawings
                          const activeFleetTypeIds = new Set(
                            drawings.map((d) => d.fleetType.id)
                          );
                          const filtered = fleetTypes.filter(
                            (ft) =>
                              activeFleetTypeIds.has(ft.id) &&
                              ft.name
                                .toLowerCase()
                                .includes(value.toLowerCase())
                          );
                          setFilteredFleetTypes(filtered);
                          setShowSuggestions(true);
                        } else {
                          setShowSuggestions(false);
                        }
                      }}
                      onFocus={() => {
                        if (formData.fleetTypeName.trim()) {
                          // Get fleet types that are currently used by drawings
                          const activeFleetTypeIds = new Set(
                            drawings.map((d) => d.fleetType.id)
                          );
                          const filtered = fleetTypes.filter(
                            (ft) =>
                              activeFleetTypeIds.has(ft.id) &&
                              ft.name
                                .toLowerCase()
                                .includes(formData.fleetTypeName.toLowerCase())
                          );
                          setFilteredFleetTypes(filtered);
                          setShowSuggestions(true);
                        }
                      }}
                      onBlur={() => {
                        // Delay to allow click on suggestion
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                      placeholder="Type fleet type (e.g., B737-800)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                    />
                    {showSuggestions && filteredFleetTypes.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredFleetTypes.map((ft) => (
                          <button
                            key={ft.id}
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                fleetTypeName: ft.name,
                              });
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-gray-900 text-sm"
                          >
                            {ft.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Type to see suggestions from existing fleet types or create
                    new
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aircraft Registration Numbers{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={formData.aircraftRegistrations}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        aircraftRegistrations: e.target.value,
                      })
                    }
                    placeholder="PK-GFR, PK-GFW, PK-GFX"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter aircraft registration numbers separated by commas (,)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diagram Image
                  </label>
                  <FileUpload
                    onFileUpload={(path) =>
                      setFormData({ ...formData, diagramImage: path })
                    }
                    currentImage={formData.diagramImage}
                    onClearImage={() =>
                      setFormData({ ...formData, diagramImage: "" })
                    }
                  />
                </div>
              </form>
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-lg">
                <div className="flex gap-3">
                  <button
                    type="submit"
                    form="drawing-form"
                    onClick={handleSubmit}
                    className="flex-1 bg-[#006298] text-white px-4 py-2.5 rounded-lg hover:bg-[#004d7a] font-medium transition-colors shadow-sm"
                  >
                    {editingId ? "Update Drawing" : "Create Drawing"}
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
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Drawing Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revision
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fleet Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Locations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aircraft
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drawings.filter(
                  (drawing) =>
                    drawing.drawingNumber
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                    drawing.title
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                ).length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-16 text-center text-gray-500"
                    >
                      <FileImage
                        size={48}
                        className="mx-auto mb-4 text-gray-300"
                      />
                      <p className="text-base font-medium">
                        {searchTerm
                          ? "No drawings found matching your search."
                          : "No drawings found. Add your first drawing to get started."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  drawings
                    .filter(
                      (drawing) =>
                        drawing.drawingNumber
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        drawing.title
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())
                    )
                    .map((drawing) => (
                      <tr
                        key={drawing.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() =>
                              router.push(
                                `/admin/drawings/${drawing.id}/editor`
                              )
                            }
                            className="font-semibold text-[#006298] hover:text-[#004d7a] hover:underline transition-colors cursor-pointer"
                            title="Click to edit equipment locations on diagram"
                          >
                            {drawing.drawingNumber}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-gray-900">
                          {drawing.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {drawing.revision}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                          {drawing.fleetType.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {drawing._count.locations} locations
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {drawing._count.aircraft} aircraft
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(drawing)}
                            className="text-[#006298] hover:text-[#004d7a] mr-4 transition-colors cursor-pointer"
                            title="Edit Drawing Info"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(drawing.id)}
                            className="text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                            title="Delete Drawing"
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
