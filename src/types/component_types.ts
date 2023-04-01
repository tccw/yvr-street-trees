import { AlertColor } from "@mui/material/Alert"

export interface AlertDetailsProps {
    isAlertVisible: boolean
    alertMessage: string
    alertSeverity: AlertColor | undefined
}

export interface TreeFilter {
    trees?: string[];
    diameters?: number[];
    height_ids?: number[];
  }