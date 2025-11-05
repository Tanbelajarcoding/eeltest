"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  MapPin,
  Edit,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import test from "node:test";

interface Drawing {
  id: number;
  drawingNumber: string;
  title: string;
  revision: string;
  diagramImage: string;
  fleetType: {
    id: number;
    name: string;
  };
}

interface EquipmentType {
  id: number;
  partNumber: string;
  description: string;
  category: string;
}

interface EquipmentLocation {
  id?: number;
  x: number;
  y: number;
  equipmentTypeId: number;
  functionLocations?: string[]; // Array of function location codes
  alternatePartNumbers?: string[]; // Array of alternate part numbers
  equipmentType?: EquipmentType;
}

export default function DrawingEditorPage() {
  const router = useRouter();
  const params = useParams();
  const drawingId = params.id as string;

  const [drawing, setDrawing] = useState<Drawing | null>(null);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [locations, setLocations] = useState<EquipmentLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialLocationsCount, setInitialLocationsCount] = useState(0);

  const [scale, setScale] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    partNumbers: [""], // Array of part numbers (alternate parts)
    equipmentName: "",
    functionLocations: [""], // Array of function locations
  });
  const [showEquipmentSuggestions, setShowEquipmentSuggestions] =
    useState(false);
  const [filteredEquipmentTypes, setFilteredEquipmentTypes] = useState<
    EquipmentType[]
  >([]);
  const [alternateSuggestions, setAlternateSuggestions] = useState<string[]>(
    []
  );
  const [showAlternateSuggestions, setShowAlternateSuggestions] =
    useState(false);
  const [activeFieldIndex, setActiveFieldIndex] = useState<number | null>(null);
  const [tempMarker, setTempMarker] = useState<{ x: number; y: number } | null>(
    null
  );
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const locationRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    fetchData();
  }, [drawingId]);

  // Auto-scroll to selected location in sidebar
  useEffect(() => {
    if (selectedLocation !== null && locationRefs.current[selectedLocation]) {
      locationRefs.current[selectedLocation]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedLocation]);

  // Handle wheel zoom with cursor as center point
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!containerRef.current) return;

    // Get cursor position relative to container
    const rect = containerRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    // Calculate new scale
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const prevScale = scale;
    const newScale = Math.min(Math.max(prevScale + delta, 0.5), 3);
    const scaleDelta = newScale / prevScale;

    // Adjust pan offset to keep cursor point stationary
    setPanOffset((prevOffset) => ({
      x: cursorX - (cursorX - prevOffset.x) * scaleDelta,
      y: cursorY - (cursorY - prevOffset.y) * scaleDelta,
    }));

    setScale(newScale);
  };

  const fetchData = async () => {
    try {
      const [drawingRes, equipmentTypesRes, locationsRes] = await Promise.all([
        fetch(`/api/admin/drawings/${drawingId}`),
        fetch("/api/admin/equipment-types"),
        fetch(`/api/admin/drawings/${drawingId}/locations`),
      ]);

      if (drawingRes.ok) setDrawing(await drawingRes.json());
      if (equipmentTypesRes.ok)
        setEquipmentTypes(await equipmentTypesRes.json());
      if (locationsRes.ok) {
        const locs = await locationsRes.json();
        setLocations(locs);
        setInitialLocationsCount(locs.length);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Track changes to locations
  useEffect(() => {
    if (locations.length !== initialLocationsCount) {
      setHasUnsavedChanges(true);
    }
  }, [locations, initialLocationsCount]);

  // Prevent accidental navigation when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = ""; // Chrome requires returnValue to be set
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Handle back button with confirmation
  const handleBack = () => {
    if (hasUnsavedChanges && locations.length > 0) {
      if (
        confirm(
          "⚠️ Warning: You have unsaved changes!\n\nAll progress will be lost if you leave now.\n\nClick OK to discard changes and leave, or Cancel to stay."
        )
      ) {
        router.push("/admin/drawings");
      }
    } else {
      router.push("/admin/drawings");
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    // Don't add marker when panning or Ctrl is pressed
    if (!imageRef.current || isPanning || e.ctrlKey) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setTempMarker({ x, y });
    setShowForm(true);
    setSelectedLocation(null);
    setFormData({
      partNumbers: [""],
      equipmentName: "",
      functionLocations: [""],
    });
    setShowEquipmentSuggestions(false);
  };

  const handleEditLocation = (index: number) => {
    const loc = locations[index];
    setSelectedLocation(index);
    setTempMarker({ x: loc.x, y: loc.y });
    setShowForm(true);

    // Build part numbers array: primary + alternates
    const partNumbersArray = [loc.equipmentType?.partNumber || ""];
    if (loc.alternatePartNumbers && loc.alternatePartNumbers.length > 0) {
      partNumbersArray.push(...loc.alternatePartNumbers);
    }

    setFormData({
      partNumbers: partNumbersArray,
      equipmentName: loc.equipmentType?.description || "",
      functionLocations:
        loc.functionLocations && loc.functionLocations.length > 0
          ? loc.functionLocations
          : [""],
    });
    setShowEquipmentSuggestions(false);
  };

  const handleAddLocation = async () => {
    // Filter out empty part numbers and convert to UPPERCASE
    const filteredPartNumbers = formData.partNumbers
      .map((pn) => pn.trim().toUpperCase())
      .filter((pn) => pn !== "");

    if (
      !tempMarker ||
      filteredPartNumbers.length === 0 ||
      !formData.equipmentName.trim()
    ) {
      alert("Please fill in at least one Part Number and Equipment Name");
      return;
    }

    // Use first part number as primary
    const primaryPartNumber = filteredPartNumbers[0];

    // Find or create equipment type
    let equipmentType = equipmentTypes.find(
      (et) =>
        et.partNumber.toLowerCase() === primaryPartNumber.toLowerCase() &&
        et.description.toLowerCase() ===
          formData.equipmentName.trim().toLowerCase()
    );

    // If not found, create new equipment type
    if (!equipmentType) {
      try {
        const res = await fetch("/api/admin/equipment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            partNumber: primaryPartNumber,
            description: formData.equipmentName.trim(),
            category: "GENERAL", // Default category
          }),
        });

        if (res.ok) {
          equipmentType = await res.json();
          // Refresh equipment types list
          const typesRes = await fetch("/api/admin/equipment-types");
          if (typesRes.ok) {
            setEquipmentTypes(await typesRes.json());
          }
        } else {
          alert("Failed to create equipment type");
          return;
        }
      } catch (error) {
        console.error("Error creating equipment:", error);
        alert("Failed to create equipment type");
        return;
      }
    }

    // Ensure equipmentType is defined before proceeding
    if (!equipmentType) {
      alert("Equipment type not found or created");
      return;
    }

    // Filter out empty function locations and convert to UPPERCASE
    const filteredFunctionLocs = formData.functionLocations
      .map((loc) => loc.trim().toUpperCase())
      .filter((loc) => loc !== "");

    // Function location is now OPTIONAL (some items don't have function location)
    // No validation needed

    // Store alternate part numbers (excluding the primary one)
    const alternates = filteredPartNumbers.slice(1);

    // Create equipment types for all alternate part numbers
    if (alternates.length > 0) {
      try {
        await fetch("/api/admin/equipment/alternates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            primaryPartNumber: primaryPartNumber,
            alternatePartNumbers: alternates,
            description: formData.equipmentName.trim(),
          }),
        });

        // Refresh equipment types list to include new alternates
        const typesRes = await fetch("/api/admin/equipment-types");
        if (typesRes.ok) {
          setEquipmentTypes(await typesRes.json());
        }
      } catch (error) {
        console.error("Error creating alternate equipment types:", error);
        // Continue anyway, don't block saving the location
      }
    }

    const newLocation: EquipmentLocation = {
      x: tempMarker.x,
      y: tempMarker.y,
      equipmentTypeId: equipmentType.id,
      functionLocations: filteredFunctionLocs,
      alternatePartNumbers: alternates.length > 0 ? alternates : undefined,
      equipmentType: equipmentType,
    };

    if (selectedLocation !== null) {
      // Update existing location
      const updatedLocations = [...locations];
      updatedLocations[selectedLocation] = newLocation;
      setLocations(updatedLocations);
      setHasUnsavedChanges(true);
    } else {
      // Add new location
      setLocations([...locations, newLocation]);
    }

    setTempMarker(null);
    setShowForm(false);
    setSelectedLocation(null);
    setFormData({
      partNumbers: [""],
      equipmentName: "",
      functionLocations: [""],
    });
    setShowEquipmentSuggestions(false);
  };

  // Part Number handlers
  const handleAddPartNumber = () => {
    setFormData({
      ...formData,
      partNumbers: [...formData.partNumbers, ""],
    });
  };

  const handleRemovePartNumber = (index: number) => {
    if (formData.partNumbers.length > 1) {
      setFormData({
        ...formData,
        partNumbers: formData.partNumbers.filter((_, i) => i !== index),
      });
    }
  };

  const handlePartNumberChange = async (index: number, value: string) => {
    console.log(
      "🔤 Typing PN:",
      value,
      "Index:",
      index,
      "Length:",
      value.trim().length
    );

    // Set active field for showing suggestions
    setActiveFieldIndex(index);

    const updatedPartNumbers = [...formData.partNumbers];
    updatedPartNumbers[index] = value.toUpperCase();
    setFormData({
      ...formData,
      partNumbers: updatedPartNumbers,
    });

    // Fetch alternate suggestions for ANY part number field when typing (minimal 2 karakter)
    if (value.trim().length >= 2) {
      console.log("✅ Condition met, fetching suggestions for:", value.trim());
      try {
        const res = await fetch(
          `/api/admin/equipment/alternates?partNumber=${encodeURIComponent(
            value.trim()
          )}`
        );
        console.log("📡 API response status:", res.status);
        if (res.ok) {
          const data = await res.json();
          console.log("📦 API response data:", data);

          // Check local unsaved locations too for more complete suggestions
          const localAlternates = new Set<string>();
          locations.forEach((loc: any) => {
            // If this location's primary matches, add its alternates
            if (loc.equipmentType?.partNumber === value.trim().toUpperCase()) {
              if (
                loc.alternatePartNumbers &&
                Array.isArray(loc.alternatePartNumbers)
              ) {
                loc.alternatePartNumbers.forEach((alt: string) =>
                  localAlternates.add(alt)
                );
              }
            }
            // If this location's alternates contain this PN, add its primary
            if (
              loc.alternatePartNumbers &&
              Array.isArray(loc.alternatePartNumbers)
            ) {
              if (
                loc.alternatePartNumbers.includes(value.trim().toUpperCase())
              ) {
                localAlternates.add(loc.equipmentType.partNumber);
              }
            }
          });

          // Combine API results with local results
          const allSuggestions = [
            ...(data.alternates || []),
            ...Array.from(localAlternates),
          ];
          const uniqueSuggestions = Array.from(new Set(allSuggestions));

          if (uniqueSuggestions.length > 0) {
            console.log("💡 Setting suggestions:", uniqueSuggestions);
            setAlternateSuggestions(uniqueSuggestions);
            setShowAlternateSuggestions(true);
          } else {
            console.log("❌ No alternates found in response");
            setAlternateSuggestions([]);
            setShowAlternateSuggestions(false);
          }
        }
      } catch (error) {
        console.error("Error fetching alternate suggestions:", error);
      }
    } else {
      console.log("⏩ Skipping (length < 2)");
      setAlternateSuggestions([]);
      setShowAlternateSuggestions(false);
    }
  };

  const handleSelectAlternateSuggestion = (partNumber: string) => {
    // ALTERNATE suggestions SELALU menambah field baru, tidak replace!
    // Kecuali jika part number sudah ada dalam list
    if (!formData.partNumbers.includes(partNumber)) {
      setFormData({
        ...formData,
        partNumbers: [...formData.partNumbers, partNumber],
      });
    }

    // TIDAK menutup suggestions! Biarkan tetap terbuka untuk pilih lagi
    // User bisa close dengan blur (klik di luar atau pindah field)
  }; // Function Location handlers
  const handleAddFunctionLocation = () => {
    setFormData({
      ...formData,
      functionLocations: [...formData.functionLocations, ""],
    });
  };

  const handleRemoveFunctionLocation = (index: number) => {
    if (formData.functionLocations.length > 1) {
      setFormData({
        ...formData,
        functionLocations: formData.functionLocations.filter(
          (_, i) => i !== index
        ),
      });
    }
  };

  const handleFunctionLocationChange = (index: number, value: string) => {
    const newFunctionLocations = [...formData.functionLocations];
    newFunctionLocations[index] = value;
    setFormData({
      ...formData,
      functionLocations: newFunctionLocations,
    });
  };

  const handleDeleteLocation = (index: number) => {
    if (!confirm("Delete this equipment location?")) return;
    setLocations(locations.filter((_, i) => i !== index));
    setSelectedLocation(null);
  };

  const handleSaveAll = async () => {
    if (locations.length === 0) {
      alert("No equipment locations to save");
      return;
    }

    setSaving(true);
    try {
      console.log("Saving locations:", locations);

      const res = await fetch(`/api/admin/drawings/${drawingId}/locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locations }),
      });

      const responseData = await res.json();
      console.log("Save response:", responseData);

      if (res.ok) {
        setHasUnsavedChanges(false);
        setInitialLocationsCount(locations.length);
        alert("Equipment locations saved successfully!");
        router.push("/admin/drawings");
      } else {
        console.error("Save error:", responseData);
        alert(responseData.error || "Failed to save locations");
      }
    } catch (error) {
      console.error("Error saving locations:", error);
      alert(
        "Failed to save locations: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleZoomIn = () => setScale(Math.min(scale + 0.25, 3));
  const handleZoomOut = () => setScale(Math.max(scale - 0.25, 0.5));
  const handleResetZoom = () => {
    setScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Mouse handlers for panning and dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle mouse button or Ctrl + left click for panning
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const newX = e.clientX - panStart.x;
      const newY = e.clientY - panStart.y;
      setPanOffset({ x: newX, y: newY });
    } else if (draggingIndex !== null) {
      // Dragging a marker
      if (!imageRef.current) return;
      const rect = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      const updatedLocations = [...locations];
      updatedLocations[draggingIndex] = {
        ...updatedLocations[draggingIndex],
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      };
      setLocations(updatedLocations);
      setHasUnsavedChanges(true);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingIndex(null);
  };

  const handleMarkerMouseDown = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (e.button === 0 && !e.ctrlKey) {
      // Left click without Ctrl
      setDraggingIndex(index);
      setSelectedLocation(index);
    }
  };

  // Touch events for mobile panning
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsPanning(true);
      setPanStart({
        x: touch.clientX - panOffset.x,
        y: touch.clientY - panOffset.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPanning && e.touches.length === 1) {
      const touch = e.touches[0];
      const newX = touch.clientX - panStart.x;
      const newY = touch.clientY - panStart.y;
      setPanOffset({ x: newX, y: newY });
    } else if (draggingIndex !== null && e.touches.length === 1) {
      // Dragging a marker on touch
      if (!imageRef.current) return;
      const touch = e.touches[0];
      const rect = imageRef.current.getBoundingClientRect();
      const x = ((touch.clientX - rect.left) / rect.width) * 100;
      const y = ((touch.clientY - rect.top) / rect.height) * 100;

      const updatedLocations = [...locations];
      updatedLocations[draggingIndex] = {
        ...updatedLocations[draggingIndex],
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      };
      setLocations(updatedLocations);
      setHasUnsavedChanges(true);
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    setDraggingIndex(null);
  };

  // Native wheel event for zoom (with passive: false)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale((prevScale) => Math.min(Math.max(prevScale + delta, 0.5), 3));
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!drawing) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-red-600">Drawing not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#006298] to-[#004d7a] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-3 lg:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                onClick={handleBack}
                className="hover:bg-[#004d7a] p-1.5 sm:p-2 rounded transition-colors flex-shrink-0"
                title="Back to Drawings"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg lg:text-xl font-bold truncate">
                  Equipment Location Editor
                </h1>
                <p className="text-blue-100 text-xs sm:text-sm truncate">
                  {drawing.drawingNumber} - {drawing.title}
                  {hasUnsavedChanges && (
                    <span className="ml-1 sm:ml-2 text-yellow-300">
                      ● Unsaved
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-1 sm:gap-2 flex-shrink-0">
              <button
                onClick={handleSaveAll}
                disabled={saving || locations.length === 0}
                className="flex items-center gap-1 sm:gap-2 bg-green-600 text-white px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 text-xs sm:text-sm lg:text-base"
              >
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">
                  {saving ? "Saving..." : `Save All`}
                </span>
                <span className="sm:hidden">
                  {saving ? "..." : `(${locations.length})`}
                </span>
                <span className="hidden sm:inline">({locations.length})</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Canvas */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-gray-100"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: isPanning ? "grabbing" : "default" }}
        >
          {/* Zoom Controls */}
          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white rounded-lg shadow-lg p-1 sm:p-2 flex flex-col gap-1 sm:gap-2 z-10">
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-100 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Zoom In (or use mouse wheel)"
            >
              <ZoomIn size={20} />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-100 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Zoom Out (or use mouse wheel)"
            >
              <ZoomOut size={20} />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 hover:bg-gray-100 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Reset Zoom & Pan"
            >
              <RotateCcw size={20} />
            </button>
            <div className="text-center text-sm font-medium px-2 py-1">
              {Math.round(scale * 100)}%
            </div>
          </div>

          {/* Instructions - Hidden on mobile, visible on desktop */}
          <div className="hidden lg:block absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10 text-xs text-gray-700 max-w-xs">
            <p className="font-medium mb-1">Controls:</p>
            <ul className="space-y-0.5 ml-2">
              <li>
                • <strong>Zoom:</strong> Mouse wheel
              </li>
              <li>
                • <strong>Pan:</strong> Ctrl + Drag or Middle mouse
              </li>
              <li>
                • <strong>Add:</strong> Click on diagram
              </li>
              <li>
                • <strong>Move:</strong> Drag marker
              </li>
              <li>
                • <strong>Edit:</strong> Double-click marker
              </li>
            </ul>
          </div>

          {/* Image with Markers */}
          <div
            className="inline-block p-8"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
              transformOrigin: "top left",
              transition: isPanning ? "none" : "transform 0.1s",
            }}
          >
            <div className="relative inline-block">
              {drawing.diagramImage ? (
                <img
                  ref={imageRef}
                  src={drawing.diagramImage}
                  alt={drawing.title}
                  onClick={handleImageClick}
                  className="max-w-full h-auto shadow-lg"
                  style={{ cursor: isPanning ? "grabbing" : "crosshair" }}
                  onError={(e) => {
                    console.error("Image load error:", drawing.diagramImage);
                    e.currentTarget.src = "/placeholder-image.png";
                  }}
                  draggable={false}
                />
              ) : (
                <div className="w-full h-96 bg-gray-200 flex items-center justify-center text-gray-500">
                  No diagram image uploaded
                </div>
              )}

              {/* Existing Markers */}
              {locations.map((loc, index) => (
                <div
                  key={index}
                  className={`absolute w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 -ml-2 -mt-2 sm:-ml-2.5 sm:-mt-2.5 md:-ml-3 md:-mt-3 transition-all group ${
                    selectedLocation === index ? "z-20" : "z-10"
                  } ${draggingIndex === index ? "opacity-75" : ""}`}
                  style={{
                    left: `${loc.x}%`,
                    top: `${loc.y}%`,
                    cursor: draggingIndex === index ? "grabbing" : "grab",
                  }}
                  onMouseDown={(e) => handleMarkerMouseDown(e, index)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!draggingIndex) {
                      setSelectedLocation(index);
                    }
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleEditLocation(index);
                  }}
                  title="Drag to move, double-click to edit"
                >
                  <MapPin
                    className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${
                      selectedLocation === index
                        ? "text-red-600 drop-shadow-lg"
                        : "text-blue-600"
                    }`}
                    fill={selectedLocation === index ? "#DC2626" : "#2563EB"}
                  />
                  {/* PN shows only on hover */}
                  {loc.equipmentType && (
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs font-medium shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {loc.equipmentType.partNumber}
                    </div>
                  )}
                </div>
              ))}

              {/* Temp Marker */}
              {tempMarker && (
                <div
                  className="absolute w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 -ml-2 -mt-2 sm:-ml-2.5 sm:-mt-2.5 md:-ml-3 md:-mt-3 z-30 animate-pulse"
                  style={{
                    left: `${tempMarker.x}%`,
                    top: `${tempMarker.y}%`,
                  }}
                >
                  <MapPin
                    className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600"
                    fill="#16A34A"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Toggle Sidebar Button - Floating */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed right-0 top-1/2 transform -translate-y-1/2 bg-white border border-gray-300 rounded-l-lg shadow-lg p-2 z-30 hover:bg-gray-50 transition-all"
          style={{ right: isSidebarOpen ? "384px" : "0" }}
          title={isSidebarOpen ? "Hide Equipment List" : "Show Equipment List"}
        >
          {isSidebarOpen ? (
            <ChevronRight size={20} />
          ) : (
            <ChevronLeft size={20} />
          )}
        </button>

        {/* Sidebar */}
        <div
          className={`bg-white border-l border-gray-200 overflow-y-auto transition-all duration-300 ${
            isSidebarOpen ? "w-96" : "w-0"
          }`}
          style={{
            opacity: isSidebarOpen ? 1 : 0,
            pointerEvents: isSidebarOpen ? "auto" : "none",
          }}
        >
          <div className="p-4 w-96">
            {(() => {
              const filteredCount = locations.filter((loc) => {
                if (!searchQuery.trim()) return true;
                const query = searchQuery.toLowerCase();
                const partNumber =
                  loc.equipmentType?.partNumber?.toLowerCase() || "";
                const description =
                  loc.equipmentType?.description?.toLowerCase() || "";
                const alternates =
                  loc.alternatePartNumbers?.join(" ").toLowerCase() || "";
                return (
                  partNumber.includes(query) ||
                  description.includes(query) ||
                  alternates.includes(query)
                );
              }).length;

              return (
                <>
                  <h2 className="text-lg font-bold mb-2 flex items-center gap-2 text-gray-900">
                    <MapPin className="w-5 h-5 text-gray-900" />
                    Equipment Locations (
                    {searchQuery
                      ? `${filteredCount} / ${locations.length}`
                      : locations.length}
                    )
                  </h2>

                  {/* Search Box */}
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Search by part number or equipment name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006298] text-sm text-gray-900 placeholder:text-gray-500"
                    />
                  </div>
                </>
              );
            })()}

            {/* Location List */}
            <div className="space-y-2 mb-4">
              {locations
                .filter((loc) => {
                  if (!searchQuery.trim()) return true;
                  const query = searchQuery.toLowerCase();
                  const partNumber =
                    loc.equipmentType?.partNumber?.toLowerCase() || "";
                  const description =
                    loc.equipmentType?.description?.toLowerCase() || "";
                  const alternates =
                    loc.alternatePartNumbers?.join(" ").toLowerCase() || "";
                  return (
                    partNumber.includes(query) ||
                    description.includes(query) ||
                    alternates.includes(query)
                  );
                })
                .map((loc, index) => (
                  <div
                    key={index}
                    ref={(el) => {
                      locationRefs.current[index] = el;
                    }}
                    className={`p-3 border rounded-lg transition-colors ${
                      selectedLocation === index
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedLocation(index)}
                    onDoubleClick={() => handleEditLocation(index)}
                    title="Click to select, double-click to edit"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold text-sm text-[#006298]">
                        {loc.equipmentType?.partNumber ||
                          `Location ${index + 1}`}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditLocation(index);
                          }}
                          className="text-[#006298] hover:text-[#004d7a] p-1 cursor-pointer"
                          title="Edit location"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLocation(index);
                          }}
                          className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
                          title="Delete location"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-800 space-y-1">
                      <div>
                        <span className="font-semibold text-gray-900">
                          Part Number:
                        </span>{" "}
                        <span className="text-gray-800">
                          {loc.equipmentType?.partNumber || "N/A"}
                        </span>
                      </div>
                      {loc.alternatePartNumbers &&
                        loc.alternatePartNumbers.length > 0 && (
                          <div>
                            <span className="font-semibold text-gray-900">
                              Alternates:
                            </span>{" "}
                            <span className="text-purple-700 font-mono text-[10px] font-semibold">
                              {loc.alternatePartNumbers.join(", ")}
                            </span>
                          </div>
                        )}
                      <div>
                        <span className="font-semibold text-gray-900">
                          Equipment:
                        </span>{" "}
                        <span className="text-gray-800">
                          {loc.equipmentType?.description || "N/A"}
                        </span>
                      </div>
                      {loc.functionLocations &&
                        loc.functionLocations.length > 0 && (
                          <div>
                            <span className="font-semibold text-gray-900">
                              Functional Location:
                            </span>{" "}
                            <span className="text-blue-700 font-medium">
                              {loc.functionLocations[0]}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                ))}
            </div>

            {locations.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No equipment locations yet</p>
                <p className="text-xs mt-1">Click on the diagram to add</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Location Form Modal */}
      {showForm && tempMarker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg">
              <h2 className="text-xl font-bold">
                {selectedLocation !== null
                  ? "Edit Equipment Location"
                  : "Add Equipment Location"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Define equipment location on the aircraft diagram
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Part Number(s) <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Add primary and alternate part numbers. Will be converted to
                  UPPERCASE automatically.
                </p>
                {formData.partNumbers.map((pn, index) => (
                  <div key={index} className="mb-2">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={pn}
                          onChange={(e) => {
                            console.log("test");
                            const value = e.target.value;
                            const updatedPartNumbers = [
                              ...formData.partNumbers,
                            ];
                            updatedPartNumbers[index] = value.toUpperCase();

                            // Show equipment type suggestions for primary field (minimal 1 karakter)
                            if (index === 0 && value.trim()) {
                              const filtered = equipmentTypes.filter((et) =>
                                et.partNumber
                                  .toLowerCase()
                                  .includes(value.toLowerCase())
                              );
                              setFilteredEquipmentTypes(filtered);
                              setShowEquipmentSuggestions(filtered.length > 0);

                              // Auto-fill equipment name if exact match
                              const exactMatch = equipmentTypes.find(
                                (et) =>
                                  et.partNumber.toUpperCase() ===
                                  value.toUpperCase()
                              );

                              setFormData({
                                ...formData,
                                partNumbers: updatedPartNumbers,
                                equipmentName: exactMatch
                                  ? exactMatch.description
                                  : formData.equipmentName,
                              });
                            } else {
                              setFormData({
                                ...formData,
                                partNumbers: updatedPartNumbers,
                              });
                              if (index === 0) {
                                setShowEquipmentSuggestions(false);
                              }
                            }

                            // Trigger alternate suggestions for ANY field
                            handlePartNumberChange(index, value);
                          }}
                          onFocus={() => {
                            setActiveFieldIndex(index);
                            // If field already has value, trigger suggestions
                            if (pn.trim().length >= 2) {
                              handlePartNumberChange(index, pn);
                            }
                          }}
                          onBlur={(e) => {
                            const relatedTarget =
                              e.relatedTarget as HTMLElement;

                            // Don't close if moving to dropdown
                            if (
                              relatedTarget?.closest(".suggestions-dropdown")
                            ) {
                              return;
                            }

                            // Don't close if moving to another part number field
                            const input = relatedTarget as HTMLInputElement;
                            if (
                              input?.type === "text" &&
                              input?.placeholder?.includes("part number")
                            ) {
                              return;
                            }

                            // Otherwise, close dropdown
                            setTimeout(() => {
                              setActiveFieldIndex(null);
                              setShowEquipmentSuggestions(false);
                              setShowAlternateSuggestions(false);
                            }, 100);
                          }}
                          placeholder={
                            index === 0
                              ? "Primary part number"
                              : "Alternate part number"
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006298] text-gray-900 bg-white uppercase"
                          style={{ textTransform: "uppercase" }}
                        />
                        {/* Equipment Type Suggestions (only for primary field, index 0) */}
                        {index === 0 &&
                          showEquipmentSuggestions &&
                          filteredEquipmentTypes.length > 0 && (
                            <div
                              className="suggestions-dropdown absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              {filteredEquipmentTypes.map((et) => (
                                <button
                                  key={et.id}
                                  type="button"
                                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm text-gray-900 border-b border-gray-100 last:border-0"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    const updatedPartNumbers = [
                                      ...formData.partNumbers,
                                    ];
                                    updatedPartNumbers[0] = et.partNumber;
                                    handlePartNumberChange(
                                      index,
                                      et.partNumber
                                    );
                                    setFormData({
                                      ...formData,
                                      partNumbers: updatedPartNumbers,
                                      equipmentName: et.description,
                                    });

                                    setShowEquipmentSuggestions(false);
                                  }}
                                >
                                  <div className="font-medium">
                                    {et.partNumber}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {et.description}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}

                        {/* Alternate Part Number Suggestions (for ANY field) - Dropdown style */}
                        {activeFieldIndex === index &&
                          showAlternateSuggestions &&
                          alternateSuggestions.filter(
                            (alt) => !formData.partNumbers.includes(alt)
                          ).length > 0 && (
                            <div
                              className="suggestions-dropdown absolute z-20 w-full mt-1 bg-blue-50 border-2 border-blue-400 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <div className="sticky top-0 bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-900 border-b border-blue-300">
                                💡 Previously used together
                              </div>
                              {alternateSuggestions
                                .filter(
                                  (alt) => !formData.partNumbers.includes(alt)
                                )
                                .map((alt, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    className="w-full text-left px-3 py-2 hover:bg-blue-100 text-sm text-gray-900 border-b border-blue-200 last:border-0 font-mono font-semibold"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                    }}
                                    onClick={() => {
                                      handleSelectAlternateSuggestion(alt);
                                    }}
                                  >
                                    {alt}
                                  </button>
                                ))}
                            </div>
                          )}
                      </div>
                      {formData.partNumbers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePartNumber(index)}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          title="Remove part number"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddPartNumber}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[#006298] hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Alternate Part Number
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipment Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.equipmentName}
                  onChange={(e) =>
                    setFormData({ ...formData, equipmentName: e.target.value })
                  }
                  placeholder="Enter equipment name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006298] text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Functional Locations{" "}
                  <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Will be converted to UPPERCASE automatically. Leave empty if
                  not applicable.
                </p>
                {formData.functionLocations.map((loc, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={loc}
                      onChange={(e) =>
                        handleFunctionLocationChange(index, e.target.value)
                      }
                      placeholder="e.g., PK-GFR.72.00.00.EG.LH"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006298] text-gray-900 bg-white uppercase"
                      style={{ textTransform: "uppercase" }}
                    />
                    {formData.functionLocations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFunctionLocation(index)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        title="Remove location"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddFunctionLocation}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[#006298] hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Location
                </button>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200 rounded-b-lg">
              <div className="flex gap-3">
                <button
                  onClick={handleAddLocation}
                  disabled={
                    formData.partNumbers.filter((pn) => pn.trim()).length ===
                      0 || !formData.equipmentName.trim()
                  }
                  className="flex-1 bg-[#006298] text-white px-4 py-2 rounded-lg hover:bg-[#004d7a] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {selectedLocation !== null
                    ? "Update Location"
                    : "Add Location"}
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setTempMarker(null);
                    setSelectedLocation(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
