"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, LogOut } from "lucide-react";
import { GmfLogo } from "@/components/GmfLogo";
import InteractiveDiagram from "@/components/InteractiveDiagram";

interface SearchResult {
  aircraft: {
    id: number;
    registration: string;
    msn: string;
    fleetType: string;
  };
  drawing: {
    drawingNumber: string;
    title: string;
    revision: string;
    diagramImage: string | null;
  };
  equipment: Array<{
    id: string;
    x: number;
    y: number;
    zone: string | null;
    equipment: Array<{
      id: string;
      partNumber: string;
      description: string;
      quantity?: number;
      functionLocation: string;
      status?: string;
    }>;
  }>;
}

export default function UserSearch() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [functionLocationSearch, setFunctionLocationSearch] = useState("");
  const [highlightedMarkerId, setHighlightedMarkerId] = useState<string | null>(
    null
  );
  const [highlightedMarkerIds, setHighlightedMarkerIds] = useState<string[]>(
    []
  ); // NEW: Multiple highlights
  const [showFLSuggestions, setShowFLSuggestions] = useState(false);
  const [filteredFunctionLocations, setFilteredFunctionLocations] = useState<
    Array<{ fl: string; markerId: string; description: string }>
  >([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [session, status, router]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const searchValue = searchTerm.toUpperCase().trim();
      const res = await fetch(
        `/api/user/search?registration=${searchValue}&msn=${searchValue}`
      );
      const data = await res.json();

      if (res.ok && data.aircraft) {
        setSearchResult(data);
      } else {
        alert(data.error || "Aircraft not found");
        setSearchResult(null);
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("Error searching aircraft");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Realtime function location search with autocomplete
  const handleFunctionLocationChange = (value: string) => {
    setFunctionLocationSearch(value.toUpperCase());

    if (!searchResult || !value.trim()) {
      setShowFLSuggestions(false);
      setFilteredFunctionLocations([]);
      setHighlightedMarkerId(null);
      setHighlightedMarkerIds([]); // Auto-clear multiple highlights when field is empty
      return;
    }

    const searchValue = value.toUpperCase().trim();

    // Build list of all function locations with their markers
    const allFunctionLocations: Array<{
      fl: string;
      markerId: string;
      description: string;
    }> = [];

    searchResult.equipment.forEach((marker) => {
      marker.equipment.forEach((item) => {
        if (
          item.functionLocation &&
          item.functionLocation.toUpperCase().includes(searchValue)
        ) {
          allFunctionLocations.push({
            fl: item.functionLocation,
            markerId: marker.id,
            description: item.description,
          });
        }
      });
    });

    setFilteredFunctionLocations(allFunctionLocations);

    // Multi-highlight strategy:
    // - If 1 result: Single highlight (yellow + zoom)
    // - If 2-10 results: Multiple highlights (orange) + zoom to first
    // - If >10 results: Only show dropdown, no auto-highlight (too general)

    if (allFunctionLocations.length === 1) {
      // Single result - full highlight + zoom
      setHighlightedMarkerId(allFunctionLocations[0].markerId);
      setHighlightedMarkerIds([]);
      setShowFLSuggestions(true);
    } else if (
      allFunctionLocations.length > 1 &&
      allFunctionLocations.length <= 10
    ) {
      // Multiple results (2-10) - highlight all + zoom to first
      const uniqueMarkerIds = Array.from(
        new Set(allFunctionLocations.map((loc) => loc.markerId))
      );
      setHighlightedMarkerId(uniqueMarkerIds[0]); // Zoom to first
      setHighlightedMarkerIds(uniqueMarkerIds); // Highlight all
      setShowFLSuggestions(true);
    } else if (allFunctionLocations.length > 10) {
      // Too many results - only show dropdown, no highlight
      setHighlightedMarkerId(null);
      setHighlightedMarkerIds([]);
      setShowFLSuggestions(true);
    } else {
      setHighlightedMarkerId(null);
      setHighlightedMarkerIds([]);
      setShowFLSuggestions(false);
    }
  };

  const handleSelectFunctionLocation = (markerId: string) => {
    // When user clicks specific item, switch to single highlight mode
    setHighlightedMarkerId(markerId);
    setHighlightedMarkerIds([]); // Clear multiple highlights
    setShowFLSuggestions(false);
  };

  const handleFunctionLocationKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setShowFLSuggestions(false);
    }
  };

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
              <span className="text-sm font-medium whitespace-nowrap hidden lg:inline">
                Welcome, {session?.user?.name}
              </span>
              <button
                onClick={() => router.push("/api/auth/signout")}
                className="flex items-center gap-2 bg-[#004d7a] hover:bg-[#003d5e] px-3 sm:px-4 py-2 rounded-lg transition-colors font-medium whitespace-nowrap"
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
        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Search Aircraft
          </h2>
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                placeholder="Enter aircraft registration or MSN (e.g., PK-GFR or 38728)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006298] focus:border-transparent font-medium text-gray-900"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-[#006298] to-[#004d7a] text-white rounded-lg hover:from-[#004d7a] hover:to-[#003d5e] disabled:opacity-50 flex items-center gap-2 font-semibold transition-colors shadow-sm"
            >
              <Search className="w-5 h-5" />
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </div>

        {/* Aircraft Details */}
        {searchResult && (
          <>
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Aircraft Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">
                    Registration
                  </p>
                  <p className="text-lg font-bold text-[#006298]">
                    {searchResult.aircraft.registration}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">MSN</p>
                  <p className="text-lg font-bold text-gray-900">
                    {searchResult.aircraft.msn}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Fleet Type
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {searchResult.aircraft.fleetType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Drawing</p>
                  <p className="text-lg font-bold text-gray-900">
                    {searchResult.drawing.drawingNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Diagram */}
            {searchResult.drawing.diagramImage && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Equipment Location Diagram
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Use zoom controls or scroll mouse wheel to zoom. Click
                  fullscreen for larger view. Drag to pan. Click markers for
                  equipment details.
                </p>

                {/* Function Location Search with Autocomplete */}
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Search Function Location
                  </label>
                  <div className="flex gap-3 relative">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={functionLocationSearch}
                        onChange={(e) =>
                          handleFunctionLocationChange(e.target.value)
                        }
                        onKeyPress={handleFunctionLocationKeyPress}
                        onFocus={() => {
                          if (
                            functionLocationSearch.trim() &&
                            filteredFunctionLocations.length > 0
                          ) {
                            setShowFLSuggestions(true);
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowFLSuggestions(false), 200);
                        }}
                        placeholder="Type to Search Functional Location"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006298] focus:border-transparent font-medium text-gray-900 uppercase"
                        style={{ textTransform: "uppercase" }}
                      />

                      {/* Autocomplete Dropdown */}
                      {showFLSuggestions &&
                        filteredFunctionLocations.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border-2 border-[#006298] rounded-lg shadow-2xl max-h-64 overflow-y-auto">
                            <div className="px-3 py-2 bg-[#006298] text-white text-xs font-semibold sticky top-0">
                              {filteredFunctionLocations.length} location(s)
                              found - Click to zoom
                            </div>
                            {filteredFunctionLocations.map((item, index) => (
                              <button
                                key={index}
                                type="button"
                                className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0 ${
                                  item.markerId === highlightedMarkerId
                                    ? "bg-yellow-50 border-l-4 border-l-yellow-500"
                                    : ""
                                }`}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleSelectFunctionLocation(item.markerId);
                                }}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-bold text-[#006298] text-sm">
                                      {item.fl}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">
                                      {item.description}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                    {(highlightedMarkerId ||
                      highlightedMarkerIds.length > 0) && (
                      <button
                        onClick={() => {
                          setHighlightedMarkerId(null);
                          setHighlightedMarkerIds([]);
                          setFunctionLocationSearch("");
                          setShowFLSuggestions(false);
                          setFilteredFunctionLocations([]);
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors whitespace-nowrap"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <InteractiveDiagram
                  imageUrl={searchResult.drawing.diagramImage}
                  markers={searchResult.equipment}
                  isEditMode={false}
                  highlightedMarkerId={highlightedMarkerId}
                  highlightedMarkerIds={highlightedMarkerIds}
                />
              </div>
            )}
          </>
        )}

        {/* Instructions */}
        {!searchResult && (
          <div className="bg-[#006298]/5 border border-[#006298]/20 rounded-xl p-6">
            <h3 className="text-lg font-bold text-[#006298] mb-3">
              How to Use
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-[#006298] font-bold text-lg">1.</span>
                <span>
                  Enter the aircraft registration number (e.g., PK-GFR, PK-GFW,
                  PK-GNR) or MSN (e.g., 38728, 37227) in the search box
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#006298] font-bold text-lg">2.</span>
                <span>Click the Search button or press Enter</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#006298] font-bold text-lg">3.</span>
                <span>
                  View the complete equipment list with function locations
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#006298] font-bold text-lg">4.</span>
                <span>
                  Click on diagram markers to see equipment details at specific
                  locations
                </span>
              </li>
            </ul>
            <div className="mt-4 p-4 bg-white rounded-lg">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Available Aircraft:
              </p>
              <p className="text-sm text-gray-600">
                PK-GFR, PK-GFW, PK-GFX, PK-GNA, PK-GNC, PK-GNE, PK-GNF, PK-GNM,
                PK-GNQ, PK-GNR
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
