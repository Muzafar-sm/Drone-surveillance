import React, { useState } from "react";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  X,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Alert {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  severity: "critical" | "high" | "medium" | "low";
  confidence: number;
  location: string;
  status: "new" | "acknowledged" | "resolved";
  type: string;
}

interface AlertPanelProps {
  alerts?: Alert[];
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  onViewDetails?: (alertId: string) => void;
}

const AlertPanel = ({
  alerts = defaultAlerts,
  onAcknowledge = () => {},
  onResolve = () => {},
  onViewDetails = () => {},
}: AlertPanelProps) => {
  const [activeTab, setActiveTab] = useState("all");

  const filteredAlerts =
    activeTab === "all"
      ? alerts
      : alerts.filter((alert) => alert.status === activeTab);

  const criticalCount = alerts.filter(
    (a) => a.severity === "critical" && a.status === "new",
  ).length;
  const highCount = alerts.filter(
    (a) => a.severity === "high" && a.status === "new",
  ).length;

  return (
    <Card className="w-full h-full bg-background border shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alert Panel
            {criticalCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {criticalCount} Critical
              </Badge>
            )}
          </CardTitle>
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-auto"
          >
            <TabsList className="grid grid-cols-2 h-8">
              <TabsTrigger value="all" className="text-xs">
                All
              </TabsTrigger>
              <TabsTrigger value="new" className="text-xs">
                New
              </TabsTrigger>
              {/* <TabsTrigger value="acknowledged" className="text-xs">
                In Progress
              </TabsTrigger> */}
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[450px] px-4 pb-4">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Info className="h-10 w-10 mb-2" />
              <p>No alerts to display</p>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {filteredAlerts.map((alert) => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={onAcknowledge}
                  onResolve={onResolve}
                  onViewDetails={onViewDetails}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

interface AlertItemProps {
  alert: Alert;
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
  onViewDetails: (alertId: string) => void;
}

const AlertItem = ({
  alert,
  onAcknowledge,
  onResolve,
  onViewDetails,
}: AlertItemProps) => {
  const severityIcons = {
    critical: <AlertTriangle className="h-5 w-5 text-destructive" />,
    high: <AlertCircle className="h-5 w-5 text-amber-500" />,
    medium: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    low: <Info className="h-5 w-5 text-blue-500" />,
  };

  const severityColors = {
    critical: "bg-destructive/10 border-destructive/50",
    high: "bg-amber-500/10 border-amber-500/50",
    medium: "bg-yellow-500/10 border-yellow-500/50",
    low: "bg-blue-500/10 border-blue-500/50",
  };

  const statusBadges = {
    new: <Badge variant="destructive">New</Badge>,
    acknowledged: <Badge variant="secondary">In Progress</Badge>,
    resolved: (
      <Badge variant="outline">
        <CheckCircle className="h-3 w-3 mr-1" /> Resolved
      </Badge>
    ),
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className={`rounded-md border p-3 ${severityColors[alert.severity]}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {severityIcons[alert.severity]}
          <div>
            <h4 className="font-medium text-sm">{alert.title}</h4>
            <p className="text-xs text-muted-foreground">{alert.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {statusBadges[alert.status]}
          <span className="text-xs text-muted-foreground">
            {formatTime(alert.timestamp)}
          </span>
        </div>
      </div>

      <p className="text-xs mb-3">{alert.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-xs font-medium mr-1">Confidence:</span>
          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${alert.confidence > 80 ? "bg-destructive" : "bg-amber-500"}`}
              style={{ width: `${alert.confidence}%` }}
            />
          </div>
          <span className="text-xs ml-1">{alert.confidence}%</span>
        </div>

        <div className="flex gap-1">
          {alert.status === "new" && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onAcknowledge(alert.id)}
            >
              Acknowledge
            </Button>
          )}
          {alert.status === "acknowledged" && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onResolve(alert.id)}
            >
              Resolve
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onViewDetails(alert.id)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Default mock data
const defaultAlerts: Alert[] = [
  {
    id: "1",
    title: "Fire Detected",
    description:
      "Potential wildfire detected in sector A-7 with high heat signature.",
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    severity: "critical",
    confidence: 94,
    location: "Sector A-7, North Ridge",
    status: "new",
    type: "fire",
  },
  {
    id: "2",
    title: "Unauthorized Vehicle",
    description:
      "Unidentified vehicle detected in restricted area near the perimeter fence.",
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    severity: "high",
    confidence: 87,
    location: "Perimeter Zone B, East Entrance",
    status: "acknowledged",
    type: "intrusion",
  },
  {
    id: "3",
    title: "Crowd Formation",
    description:
      "Unusual crowd density detected in public area exceeding safety thresholds.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    severity: "medium",
    confidence: 76,
    location: "Central Plaza, Main Entrance",
    status: "new",
    type: "crowd",
  },
  {
    id: "4",
    title: "Water Level Rising",
    description:
      "Potential flood risk detected with water levels rising in drainage area.",
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    severity: "high",
    confidence: 82,
    location: "Drainage Basin C, South Sector",
    status: "new",
    type: "flood",
  },
  {
    id: "5",
    title: "Smoke Detection",
    description:
      "Smoke signature detected in industrial zone, potential equipment malfunction.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    severity: "medium",
    confidence: 68,
    location: "Industrial Zone D, Building 7",
    status: "resolved",
    type: "smoke",
  },
  {
    id: "6",
    title: "Structural Anomaly",
    description:
      "Potential structural damage detected on bridge support column.",
    timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
    severity: "low",
    confidence: 62,
    location: "North Bridge, Support Column 3",
    status: "acknowledged",
    type: "structural",
  },
];

export default AlertPanel;
