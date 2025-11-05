"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Package, ArrowLeft, Search } from "lucide-react";
import { GmfLogo } from "@/components/GmfLogo";

interface EquipmentType {
  id: number;
  partNumber: string;
  description: string;
  _count: {
    locations: number;
    equipment: number;
  };
}

export default function EquipmentManagementPage() {
  const router = useRouter();
  const [equipment, setEquipment] = useState<EquipmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    partNumber: "",
    description: "",
  });

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const res = await fetch("/api/admin/equipment");
      if (res.ok) {
        const data = await res.json();
        setEquipment(data);
      }
    } catch (error) {
      console.error("Error fetching equipment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId
        ? `/api/admin/equipment/${editingId}`
        : "/api/admin/equipment";

      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await fetchEquipment();
        setShowForm(false);
        setEditingId(null);
        setFormData({ partNumber: "", description: "" });
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save equipment type");
      }
    } catch (error) {
      console.error("Error saving equipment type:", error);
      alert("Failed to save equipment type");
    }
  };

  const handleEdit = (eq: EquipmentType) => {
    setEditingId(eq.id);
    setFormData({
      partNumber: eq.partNumber,
      description: eq.description,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this equipment type?"))
      return;

    try {
      const res = await fetch(`/api/admin/equipment/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchEquipment();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete equipment type");
      }
    } catch (error) {
      console.error("Error deleting equipment type:", error);
      alert("Failed to delete equipment type");
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
            <Package className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Equipment Management</h1>
              <p className="text-blue-100 text-sm">
                Manage equipment types and part numbers
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
              placeholder="Search by part number or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006298] focus:border-transparent text-gray-900"
            />
          </div>
          <button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setFormData({ partNumber: "", description: "" });
            }}
            className="flex items-center gap-2 bg-[#006298] text-white px-4 py-2.5 rounded-lg hover:bg-[#004d7a] font-medium transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus size={20} />
            Add Equipment Type
          </button>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">
                {editingId ? "Edit Equipment Type" : "Add New Equipment Type"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Part Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.partNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        partNumber: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="453-5000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="FIRE EXTINGUISHER HALON"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
                <div className="flex gap-3 pt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-[#006298] text-white px-4 py-2.5 rounded-lg hover:bg-[#004d7a] font-medium transition-colors shadow-sm"
                  >
                    {editingId ? "Update Equipment" : "Create Equipment"}
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
                    Part Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Locations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    In Use
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {equipment.filter(
                  (eq) =>
                    eq.partNumber
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                    eq.description
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                ).length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-16 text-center text-gray-500"
                    >
                      <Package
                        size={48}
                        className="mx-auto mb-4 text-gray-300"
                      />
                      <p className="text-base font-medium">
                        {searchTerm
                          ? "No equipment types found matching your search."
                          : "No equipment types found. Add your first equipment type to get started."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  equipment
                    .filter(
                      (eq) =>
                        eq.partNumber
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase()) ||
                        eq.description
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())
                    )
                    .sort((a, b) => a.description.localeCompare(b.description))
                    .map((eq) => (
                      <tr
                        key={eq.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-[#006298]">
                          {eq.partNumber}
                        </td>
                        <td className="px-6 py-4 text-gray-900">
                          {eq.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {eq._count.locations} drawing(s)
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {eq._count.equipment} aircraft
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(eq)}
                            className="text-[#006298] hover:text-[#004d7a] mr-4 transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(eq.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete"
                            disabled={
                              eq._count.equipment > 0 || eq._count.locations > 0
                            }
                          >
                            <Trash2
                              size={18}
                              className={
                                eq._count.equipment > 0 ||
                                eq._count.locations > 0
                                  ? "opacity-30 cursor-not-allowed"
                                  : ""
                              }
                            />
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
