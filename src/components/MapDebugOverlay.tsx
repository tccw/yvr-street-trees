import React, { useState } from "react";
import { MapRef, ViewState } from "react-map-gl";
import styled from "styled-components";
import {
  boundaryTrasitionZoomLevel,
  wideBoundaryTransitionZoomLevel,
} from "../styles/map-styles.js";

const DebugBox = styled.div`
  position: fixed;
  bottom: 44px;
  right: 12px;
  z-index: 1100;
  background: rgba(20, 24, 28, 0.88);
  color: #e6edf3;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  line-height: 1.45;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  min-width: 220px;
  max-width: 300px;
  pointer-events: auto;
  user-select: text;

  @media (max-width: 600px) {
    bottom: auto;
    top: calc(70px + env(safe-area-inset-top));
    right: 10px;
    font-size: 10px;
  }
`;

const DebugHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-weight: 700;
  color: #f5a623;
  letter-spacing: 0.04em;
`;

const ToggleButton = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #e6edf3;
  border-radius: 3px;
  padding: 0 5px;
  font-size: 10px;
  line-height: 1.4;
  cursor: pointer;
  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }
`;

const DebugGrid = styled.div`
  margin-top: 6px;
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 10px;
  row-gap: 2px;
`;

const Label = styled.span`
  color: #8b949e;
`;

const Value = styled.span`
  color: #e6edf3;
  text-align: right;
  word-break: break-all;
`;

export const isMapDebugEnabled =
  import.meta.env.DEV &&
  (__APP_DEBUG__ ||
    (typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("debug")));

interface MapDebugOverlayProps {
  mapRef: React.RefObject<MapRef>;
  viewState: ViewState;
  minZoom: number;
  maxZoom: number;
  mapStyleName?: string;
  wideZoomActive?: boolean;
}

export default function MapDebugOverlay({
  mapRef,
  viewState,
  minZoom,
  maxZoom,
  mapStyleName,
  wideZoomActive = false,
}: MapDebugOverlayProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (!isMapDebugEnabled) {
    return null;
  }

  const map = mapRef.current?.getMap();
  const zoom = map ? map.getZoom() : viewState.zoom;
  const center = map
    ? map.getCenter()
    : { lat: viewState.latitude, lng: viewState.longitude };
  const bearing = map ? map.getBearing() : viewState.bearing ?? 0;
  const pitch = map ? map.getPitch() : viewState.pitch ?? 0;
  const bounds = map?.getBounds();
  const transitionZoom = wideZoomActive
    ? wideBoundaryTransitionZoomLevel
    : boundaryTrasitionZoomLevel;
  const layerMode = zoom <= transitionZoom ? "boundaries" : "trees";

  return (
    <DebugBox>
      <DebugHeader>
        <span>MAPBOX DEBUG</span>
        <ToggleButton
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          title={collapsed ? "Expand debug view" : "Collapse debug view"}
        >
          {collapsed ? "+" : "−"}
        </ToggleButton>
      </DebugHeader>
      {!collapsed && (
        <DebugGrid>
          <Label>zoom</Label>
          <Value>
            {zoom.toFixed(2)} ({layerMode} @ &gt;{transitionZoom})
          </Value>
          <Label>center</Label>
          <Value>
            {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
          </Value>
          <Label>bounds SW</Label>
          <Value>
            {bounds
              ? `${bounds.getSouth().toFixed(4)}, ${bounds.getWest().toFixed(4)}`
              : "—"}
          </Value>
          <Label>bounds NE</Label>
          <Value>
            {bounds
              ? `${bounds.getNorth().toFixed(4)}, ${bounds.getEast().toFixed(4)}`
              : "—"}
          </Value>
          <Label>pitch / brg</Label>
          <Value>
            {pitch.toFixed(1)}° / {bearing.toFixed(1)}°
          </Value>
          <Label>zoom range</Label>
          <Value>
            {minZoom} – {maxZoom}
          </Value>
          {mapStyleName && (
            <>
              <Label>style</Label>
              <Value>{mapStyleName}</Value>
            </>
          )}
        </DebugGrid>
      )}
    </DebugBox>
  );
}
