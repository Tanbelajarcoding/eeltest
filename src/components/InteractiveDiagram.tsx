"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Plus,
  Info,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Minimize2,
} from "lucide-react";
import Image from "next/image";

interface EquipmentMarker {
  id: string;
  x: number;
  y: number;
  equipment: EquipmentItem[];
}

interface EquipmentItem {
  id: string;
  partNumber: string;
  description: string;
  alternatePartNumbers?: string[];
  quantity?: number;
  functionLocation: string;
  status?: string;
}

interface InteractiveDiagramProps {
  imageUrl: string;
  markers?: EquipmentMarker[];
  isEditMode?: boolean;
  onMarkerAdd?: (x: number, y: number) => void;
  onMarkerClick?: (marker: EquipmentMarker) => void;
  onMarkerDelete?: (markerId: string) => void;
  highlightedMarkerId?: string | null;
  highlightedMarkerIds?: string[]; // NEW: Support multiple highlights
}

export default function InteractiveDiagram({
  imageUrl,
  markers = [],
  isEditMode = false,
  onMarkerAdd,
  onMarkerClick,
  onMarkerDelete,
  highlightedMarkerId = null,
  highlightedMarkerIds = [],
}: InteractiveDiagramProps) {
  const [selectedMarker, setSelectedMarker] = useState<EquipmentMarker | null>(
    null
  );
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  // Use refs to track current scale and position for wheel event
  const scaleRef = useRef(scale);
  const positionRef = useRef(position);

  useEffect(() => {
    scaleRef.current = scale;
    positionRef.current = position;
  }, [scale, position]);

  useEffect(() => {
    const updateImageSize = () => {
      if (imageRef.current) {
        const { width, height } = imageRef.current.getBoundingClientRect();
        setImageSize({ width, height });
      }
    };

    updateImageSize();
    window.addEventListener("resize", updateImageSize);
    return () => window.removeEventListener("resize", updateImageSize);
  }, []);

  // Auto-focus and zoom to highlighted marker(s)
  useEffect(() => {
    if (imageSize.width === 0) return;

    const container = isFullscreen
      ? fullscreenContainerRef.current
      : containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Case 1: Single highlight (yellow marker) - zoom in to that specific marker
    if (highlightedMarkerId && highlightedMarkerIds.length === 0) {
      const marker = markers.find((m) => m.id === highlightedMarkerId);
      if (marker) {
        const markerX = (marker.x / 100) * imageSize.width;
        const markerY = (marker.y / 100) * imageSize.height;

        // Zoom to 2x and center on marker
        const newScale = 2;
        const newPosition = {
          x: centerX - markerX * newScale,
          y: centerY - markerY * newScale,
        };

        setScale(newScale);
        setPosition(newPosition);
      }
    }
    // Case 2: Multiple highlights (orange markers) - zoom to show all highlighted markers
    else if (highlightedMarkerIds.length > 0) {
      const highlightedMarkers = markers.filter((m) =>
        highlightedMarkerIds.includes(m.id)
      );

      if (highlightedMarkers.length > 0) {
        // Calculate bounding box of all highlighted markers
        const xs = highlightedMarkers.map((m) => (m.x / 100) * imageSize.width);
        const ys = highlightedMarkers.map(
          (m) => (m.y / 100) * imageSize.height
        );

        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        // Calculate center of bounding box
        const boundingCenterX = (minX + maxX) / 2;
        const boundingCenterY = (minY + maxY) / 2;

        // Calculate required scale to fit all markers with padding
        const boundingWidth = maxX - minX;
        const boundingHeight = maxY - minY;
        const padding = 100; // pixels of padding around markers

        const scaleX = rect.width / (boundingWidth + padding * 2);
        const scaleY = rect.height / (boundingHeight + padding * 2);
        let newScale = Math.min(scaleX, scaleY);

        // Clamp scale between 0.5 and 2
        newScale = Math.max(0.5, Math.min(2, newScale));

        // Calculate position to center the bounding box
        const newPosition = {
          x: centerX - boundingCenterX * newScale,
          y: centerY - boundingCenterY * newScale,
        };

        setScale(newScale);
        setPosition(newPosition);
      }
    }
  }, [
    highlightedMarkerId,
    highlightedMarkerIds,
    markers,
    imageSize,
    isFullscreen,
  ]);

  // Native wheel event listener to prevent page scroll and zoom to cursor
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();

      // Get cursor position relative to container
      const rect = container.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      // Calculate new scale using ref to get current value
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const prevScale = scaleRef.current;
      const newScale = Math.max(0.5, Math.min(5, prevScale + delta));
      const scaleDelta = newScale / prevScale;

      // Adjust position to keep cursor point stationary
      const prevPosition = positionRef.current;
      const newPosition = {
        x: cursorX - (cursorX - prevPosition.x) * scaleDelta,
        y: cursorY - (cursorY - prevPosition.y) * scaleDelta,
      };

      setScale(newScale);
      setPosition(newPosition);
    };

    container.addEventListener("wheel", handleWheelEvent, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheelEvent);
    };
  }, []); // No dependencies needed now

  // Native wheel event listener for fullscreen mode
  useEffect(() => {
    const container = fullscreenContainerRef.current;
    if (!container || !isFullscreen) return;

    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault();

      // Get cursor position relative to container
      const rect = container.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      // Calculate new scale using ref to get current value
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const prevScale = scaleRef.current;
      const newScale = Math.max(0.5, Math.min(5, prevScale + delta));
      const scaleDelta = newScale / prevScale;

      // Adjust position to keep cursor point stationary
      const prevPosition = positionRef.current;
      const newPosition = {
        x: cursorX - (cursorX - prevPosition.x) * scaleDelta,
        y: cursorY - (cursorY - prevPosition.y) * scaleDelta,
      };

      setScale(newScale);
      setPosition(newPosition);
    };

    container.addEventListener("wheel", handleWheelEvent, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheelEvent);
    };
  }, [isFullscreen]); // Re-attach when entering/exiting fullscreen

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditMode || !imageRef.current || !onMarkerAdd) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    onMarkerAdd(x, y);
  };

  const handleMarkerClick = (e: React.MouseEvent, marker: EquipmentMarker) => {
    e.stopPropagation();
    if (isEditMode && onMarkerDelete) {
      onMarkerDelete(marker.id);
    } else {
      setSelectedMarker(marker);
      onMarkerClick?.(marker);
    }
  };

  const handleZoomIn = () => {
    if (isFullscreen && fullscreenContainerRef.current) {
      // Zoom to center in fullscreen mode
      const container = fullscreenContainerRef.current;
      const rect = container.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const delta = 0.25;
      const prevScale = scale;
      const newScale = Math.min(prevScale + delta, 5);
      const scaleDelta = newScale / prevScale;

      setPosition((prevPosition) => ({
        x: centerX - (centerX - prevPosition.x) * scaleDelta,
        y: centerY - (centerY - prevPosition.y) * scaleDelta,
      }));
      setScale(newScale);
    } else {
      setScale((prev) => Math.min(prev + 0.25, 5));
    }
  };

  const handleZoomOut = () => {
    if (isFullscreen && fullscreenContainerRef.current) {
      // Zoom to center in fullscreen mode
      const container = fullscreenContainerRef.current;
      const rect = container.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const delta = -0.25;
      const prevScale = scale;
      const newScale = Math.max(prevScale + delta, 0.5);
      const scaleDelta = newScale / prevScale;

      setPosition((prevPosition) => ({
        x: centerX - (centerX - prevPosition.x) * scaleDelta,
        y: centerY - (centerY - prevPosition.y) * scaleDelta,
      }));
      setScale(newScale);
    } else {
      setScale((prev) => Math.max(prev - 0.25, 0.5));
    }
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      // Reset zoom when entering fullscreen
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Allow panning on left click (for non-edit mode) or middle mouse button
    if ((e.button === 0 && !isEditMode) || e.button === 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch events for mobile panning
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEditMode) return; // Don't pan in edit mode
    if (e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((prev) => Math.max(0.5, Math.min(5, prev + delta)));
  };

  return (
    <>
      <div className="relative w-full">
        {/* Zoom Controls */}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 flex flex-col gap-1 sm:gap-2 bg-white rounded-lg shadow-lg p-1 sm:p-2">
          <button
            onClick={handleZoomIn}
            className="p-2 sm:p-2.5 hover:bg-gray-100 rounded transition-colors group relative min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5 sm:w-6 sm:h-6 text-[#006298]" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 sm:p-2.5 hover:bg-gray-100 rounded transition-colors group relative min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5 sm:w-6 sm:h-6 text-[#006298]" />
          </button>
          <button
            onClick={handleFullscreen}
            className="p-2 sm:p-2.5 hover:bg-gray-100 rounded transition-colors group relative min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Fullscreen"
          >
            <Maximize2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#006298]" />
          </button>
          <div className="text-xs text-center text-gray-600 font-mono pt-1 sm:pt-2 border-t">
            {Math.round(scale * 100)}%
          </div>
        </div>

        {/* Image Container with Zoom and Pan */}
        <div
          ref={containerRef}
          className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] overflow-hidden border-2 border-gray-200 rounded-lg bg-gray-50"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            ref={imageRef}
            className={`relative w-full h-auto ${
              isDragging
                ? "cursor-grabbing"
                : isEditMode
                ? "cursor-crosshair"
                : "cursor-grab"
            }`}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: "0 0",
              transition: isDragging ? "none" : "transform 0.1s ease-out",
            }}
            onClick={handleImageClick}
          >
            <img
              src={imageUrl}
              alt="Aircraft Diagram"
              className="w-full h-auto select-none"
              draggable={false}
              onLoad={() => {
                if (imageRef.current) {
                  const { width, height } =
                    imageRef.current.getBoundingClientRect();
                  setImageSize({ width, height });
                }
              }}
            />

            {/* Render Markers */}
            {markers.map((marker) => (
              <div
                key={marker.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                style={{
                  left: `${marker.x}%`,
                  top: `${marker.y}%`,
                }}
              >
                {/* Visual Marker - clickable only here */}
                <div
                  className={`
                    w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 rounded-full border flex items-center justify-center
                    transition-all duration-200 shadow-lg cursor-pointer
                    ${
                      marker.id === highlightedMarkerId
                        ? "bg-yellow-400 border-yellow-600 scale-[3] animate-pulse shadow-yellow-400/50 shadow-2xl"
                        : highlightedMarkerIds.includes(marker.id)
                        ? "bg-orange-400 border-orange-600 scale-[2] animate-pulse shadow-orange-400/50 shadow-xl"
                        : isEditMode
                        ? "bg-red-500 border-red-700 hover:scale-150"
                        : "bg-blue-500 border-blue-700 hover:scale-150 hover:bg-blue-600"
                    }
                  `}
                  onClick={(e) => handleMarkerClick(e, marker)}
                >
                  {isEditMode ? (
                    <X className="w-1 h-1 sm:w-1.5 sm:h-1.5 text-white" />
                  ) : (
                    <Plus className="w-1 h-1 sm:w-1.5 sm:h-1.5 text-white" />
                  )}
                </div>

                {/* Tooltip - Show equipment description (nama item) */}
                {!isEditMode && marker.equipment.length > 0 && (
                  <div
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                            opacity-0 group-hover:opacity-100 transition-opacity duration-200 
                            pointer-events-none z-50"
                  >
                    <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-xl max-w-xs">
                      {marker.equipment.map((item, idx) => (
                        <div key={idx} className="whitespace-nowrap">
                          {item.description}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Equipment Details Popup */}
        {selectedMarker && !isEditMode && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setSelectedMarker(null)}
          >
            <div
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  <h3 className="text-lg font-semibold">Equipment Details</h3>
                </div>
                <button
                  onClick={() => setSelectedMarker(null)}
                  className="hover:bg-blue-800 rounded-full p-1 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(80vh-4rem)]">
                {selectedMarker.equipment.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No equipment assigned to this location
                  </p>
                ) : (
                  <div className="space-y-4">
                    {selectedMarker.equipment.map((item) => (
                      <div
                        key={item.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 font-medium">
                              Part Number
                            </p>
                            <p className="font-semibold text-gray-900">
                              {item.partNumber}
                            </p>
                          </div>
                          {item.alternatePartNumbers &&
                            item.alternatePartNumbers.length > 0 && (
                              <div className="col-span-2">
                                <p className="text-sm text-gray-600 font-medium mb-1">
                                  Alternate Part Numbers
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {item.alternatePartNumbers.map((alt, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-block bg-purple-100 text-purple-800 text-xs font-mono font-semibold px-2 py-1 rounded"
                                    >
                                      {alt}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          <div className="col-span-2">
                            <p className="text-sm text-gray-600 font-medium">
                              Description
                            </p>
                            <p className="text-gray-900">{item.description}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-sm text-gray-600 font-medium mb-1">
                              Function Location
                            </p>
                            {item.functionLocation &&
                            item.functionLocation.includes(",") ? (
                              <ul className="space-y-1">
                                {item.functionLocation
                                  .split(",")
                                  .map((loc, idx) => (
                                    <li
                                      key={idx}
                                      className="font-mono text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded"
                                    >
                                      • {loc.trim()}
                                    </li>
                                  ))}
                              </ul>
                            ) : (
                              <p className="font-mono text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                {item.functionLocation || "-"}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {isEditMode && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Edit Mode:</strong> Click on the diagram to add new
              markers. Click on existing markers to remove them.
            </p>
          </div>
        )}

        {!isEditMode && (
          <div className="mt-4 bg-[#006298]/5 border border-[#006298]/20 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong className="text-[#006298]">💡 Tips:</strong> Use zoom
              buttons or mouse wheel to zoom. Click fullscreen button (⛶) for
              larger view. Click and drag to pan. Click markers to view details.
            </p>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[45] bg-black/80 flex flex-col">
          {/* Fullscreen Zoom Controls */}
          <div className="absolute top-4 right-4 z-[46] flex flex-col gap-2 bg-white rounded-lg shadow-lg p-2">
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-6 h-6 text-[#006298]" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-6 h-6 text-[#006298]" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-6 h-6 text-[#006298]" />
            </button>
            <div className="text-xs text-center text-gray-600 font-mono pt-2 border-t">
              {Math.round(scale * 100)}%
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handleFullscreen}
            className="absolute top-4 left-4 z-[46] p-3 bg-white hover:bg-gray-100 rounded-lg shadow-lg transition-colors"
            title="Exit Fullscreen"
          >
            <Minimize2 className="w-6 h-6 text-gray-700" />
          </button>

          {/* Fullscreen Image Container */}
          <div
            ref={fullscreenContainerRef}
            className="flex-1 w-full h-full overflow-hidden"
          >
            <div
              ref={imageRef}
              className={`relative w-full h-full flex items-center justify-center ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transformOrigin: "0 0",
                  transition: isDragging ? "none" : "transform 0.1s ease-out",
                }}
                className="relative"
              >
                <img
                  src={imageUrl}
                  alt="Aircraft Diagram"
                  className="max-w-none h-auto select-none"
                  draggable={false}
                  style={{ maxHeight: "90vh" }}
                />

                {/* Render Markers in Fullscreen */}
                {markers.map((marker) => (
                  <div
                    key={marker.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                    style={{
                      left: `${marker.x}%`,
                      top: `${marker.y}%`,
                    }}
                  >
                    {/* Visual Marker - clickable only here */}
                    <div
                      className={`
                        w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full border-2 flex items-center justify-center
                        transition-all duration-200 shadow-lg cursor-pointer
                        ${
                          marker.id === highlightedMarkerId
                            ? "bg-yellow-400 border-yellow-600 scale-[3] animate-pulse shadow-yellow-400/50 shadow-2xl"
                            : highlightedMarkerIds.includes(marker.id)
                            ? "bg-orange-400 border-orange-600 scale-[2] animate-pulse shadow-orange-400/50 shadow-xl"
                            : "bg-blue-500 border-blue-700 hover:scale-150 hover:bg-blue-600"
                        }
                      `}
                      onClick={(e) => handleMarkerClick(e, marker)}
                    >
                      <Plus className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 text-white" />
                    </div>

                    {/* Tooltip - Show equipment description (nama item) */}
                    {marker.equipment.length > 0 && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                        <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded shadow-xl max-w-xs">
                          {marker.equipment.map((item, idx) => (
                            <div key={idx} className="whitespace-nowrap">
                              {item.description}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
