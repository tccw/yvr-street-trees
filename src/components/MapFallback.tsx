import React from "react";
import mapboxgl from "mapbox-gl";
import styled from "styled-components";

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #f2f4f6;
  color: #2f3437;
  z-index: 2000;
`;

const Card = styled.div`
  max-width: 520px;
  width: 100%;
  background: #fff;
  border-radius: 10px;
  padding: 24px 28px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.12);
  line-height: 1.5;

  @media (max-width: 600px) {
    padding: 20px;
  }
`;

const Heading = styled.h2`
  margin: 0 0 10px;
  font-size: 1.25rem;
  color: #1f2427;
`;

const Body = styled.p`
  margin: 0 0 12px;
  font-size: 0.95rem;
  color: #4a5054;
`;

const Subheading = styled.p`
  margin: 14px 0 6px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #2f3437;
`;

const BrowserList = styled.ul`
  margin: 0 0 16px;
  padding-left: 20px;
  font-size: 0.9rem;
  color: #4a5054;

  li {
    margin-bottom: 6px;
  }

  a {
    color: #2193b9;
    font-weight: 500;
  }
`;

const ReloadButton = styled.button`
  background: #2193b9;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #1b7c9d;
  }
`;

const BROWSER_GUIDES = [
  {
    name: "Google Chrome",
    note: "Settings → System → Use graphics acceleration when available",
    url: "https://support.google.com/chrome/thread/412501283/how-do-i-turn-hardware-acceleration-back-on?hl=en",
  },
  {
    name: "Mozilla Firefox",
    note: "Settings → General → Performance → Use hardware acceleration when available",
    url: "https://support.mozilla.org/kb/performance-settings",
  },
  {
    name: "Safari (macOS)",
    note: "Enabled automatically by macOS; update macOS or check extensions",
    url: "https://support.apple.com/guide/safari/welcome/mac",
  },
  {
    name: "Opera",
    note: "Settings → System → Use graphics acceleration when available",
    url: "https://help.opera.com/en/latest/crashes-and-issues/",
  },
];

export function isWebGLSupported(): boolean {
  try {
    if (!mapboxgl.supported()) {
      return false;
    }
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") || canvas.getContext("webgl")
    );
  } catch {
    return false;
  }
}

export function isFatalWebGLError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error ?? "");
  return /webgl|context|hardware/i.test(message);
}

interface MapFallbackProps {
  reason?: string;
}

export function MapFallback({ reason }: MapFallbackProps) {
  return (
    <Backdrop role="alert">
      <Card>
        <Heading>Map Cannot Be Displayed</Heading>
        <Body>
          This interactive tree map requires <strong>WebGL</strong> and{" "}
          <strong>hardware acceleration</strong>, which appear to be disabled or
          unsupported in your current browser.
        </Body>
        {reason && (
          <Body style={{ fontSize: "0.82rem", color: "#6c7378" }}>
            Details: {reason}
          </Body>
        )}
        <Subheading>How to enable hardware acceleration:</Subheading>
        <BrowserList>
          {BROWSER_GUIDES.map((guide) => (
            <li key={guide.name}>
              <a href={guide.url} target="_blank" rel="noopener noreferrer">
                {guide.name}
              </a>{" "}
              — {guide.note}
            </li>
          ))}
        </BrowserList>
        <ReloadButton type="button" onClick={() => window.location.reload()}>
          Reload page
        </ReloadButton>
      </Card>
    </Backdrop>
  );
}

interface MapErrorBoundaryProps {
  children: React.ReactNode;
}

interface MapErrorBoundaryState {
  errorMessage: string | null;
}

export class MapErrorBoundary extends React.Component<
  MapErrorBoundaryProps,
  MapErrorBoundaryState
> {
  constructor(props: MapErrorBoundaryProps) {
    super(props);
    this.state = { errorMessage: null };
  }

  static getDerivedStateFromError(error: Error): MapErrorBoundaryState {
    return { errorMessage: error?.message || "Failed to initialize map." };
  }

  render() {
    if (this.state.errorMessage) {
      if (isFatalWebGLError(this.state.errorMessage)) {
        return <MapFallback reason={this.state.errorMessage} />;
      }
      return (
        <Backdrop role="alert">
          <Card>
            <Heading>Something went wrong</Heading>
            <Body>
              An unexpected error occurred while rendering the map view.
            </Body>
            <Body style={{ fontSize: "0.82rem", color: "#6c7378" }}>
              Details: {this.state.errorMessage}
            </Body>
            <ReloadButton type="button" onClick={() => window.location.reload()}>
              Reload page
            </ReloadButton>
          </Card>
        </Backdrop>
      );
    }
    return this.props.children;
  }
}
