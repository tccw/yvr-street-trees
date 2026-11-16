import React from "react";
import Alert, { AlertColor } from "@mui/material/Alert";
import styled from "styled-components";

const StyledAlert = styled(Alert)`
  && {
    margin: 5px;
    padding: 6px 14px;
    line-height: 1.35;
    font-size: 0.85rem;
    border-radius: 4px;
    box-shadow: 0px 2px 7px rgba(0, 0, 0, 0.1);
    flex: 0 0 auto;
    align-items: center;
  }

  && .MuiAlert-icon {
    padding: 2px 0;
    margin-right: 10px;
    font-size: 1.2rem;
    align-items: center;
  }

  && .MuiAlert-message {
    padding: 2px 0;
    line-height: 1.35;
  }

  @media (max-width: 600px) {
    && {
      margin: 4px 0;
      padding: 5px 10px;
      font-size: 0.8rem;
      line-height: 1.3;
    }

    && .MuiAlert-icon {
      margin-right: 8px;
      font-size: 1.1rem;
    }

    && .MuiAlert-message {
      line-height: 1.3;
    }
  }
`;

export interface InfoBannerProps {
  severity?: AlertColor;
  children: React.ReactNode;
  className?: string;
}

/**
 * Compact inline notice banner built on MUI Alert, safe for use inside
 * containers with larger inherited line-height (e.g. FilterPanel).
 */
export default function InfoBanner({
  severity = "info",
  children,
  className,
}: InfoBannerProps) {
  return (
    <StyledAlert severity={severity} className={className}>
      {children}
    </StyledAlert>
  );
}
