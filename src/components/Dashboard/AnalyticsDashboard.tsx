import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Activity,
  Users,
  AlertTriangle,
  Cpu,
  Clock,
} from "lucide-react";

interface AnalyticsDashboardProps {
  processingMetrics?: {
    averageLatency: number;
    framesProcessed: number;
    cpuUtilization: number;
    gpuUtilization: number;
    memoryUsage: number;
  };
  detectionStats?: {
    totalDetections: number;
    hazardsByType: { [key: string]: number };
    confidenceDistribution: { [key: string]: number };
    falsePositiveRate: number;
  };
  systemPerformance?: {
    uptime: number;
    activeModels: string[];
    queuedTasks: number;
    errorRate: number;
  };
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  processingMetrics = {
    averageLatency: 120,
    framesProcessed: 1458,
    cpuUtilization: 68,
    gpuUtilization: 82,
    memoryUsage: 74,
  },
  detectionStats = {
    totalDetections: 247,
    hazardsByType: {
      Vehicle: 124,
      Person: 86,
      Fire: 12,
      Crowd: 25,
    },
    confidenceDistribution: {
      "High (>90%)": 142,
      "Medium (70-90%)": 85,
      "Low (<70%)": 20,
    },
    falsePositiveRate: 3.2,
  },
  systemPerformance = {
    uptime: 14.5,
    activeModels: [
      "facebook/detr-resnet-50",
      "damo/cv_resnet_depth-estimation",
    ],
    queuedTasks: 8,
    errorRate: 0.4,
  },
}: AnalyticsDashboardProps) => {
  return (
    <div className="w-full bg-background p-4 rounded-lg border">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <Badge variant="outline" className="flex items-center gap-1">
            <Activity className="h-3 w-3" /> Live Data
          </Badge>
        </div>

        <Tabs defaultValue="processing" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="processing">AI Processing</TabsTrigger>
            <TabsTrigger value="detection">Detection Stats</TabsTrigger>
            <TabsTrigger value="system">System Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="processing" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg. Latency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-2xl font-bold">
                      {processingMetrics.averageLatency}ms
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Frames Processed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <BarChart className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-2xl font-bold">
                      {processingMetrics.framesProcessed}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    CPU Utilization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xl font-bold">
                        {processingMetrics.cpuUtilization}%
                      </span>
                    </div>
                    <Progress
                      value={processingMetrics.cpuUtilization}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    GPU Utilization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xl font-bold">
                        {processingMetrics.gpuUtilization}%
                      </span>
                    </div>
                    <Progress
                      value={processingMetrics.gpuUtilization}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Memory Usage</CardTitle>
                <CardDescription>
                  Current system memory allocation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Usage</span>
                    <span className="font-medium">
                      {processingMetrics.memoryUsage}%
                    </span>
                  </div>
                  <Progress
                    value={processingMetrics.memoryUsage}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detection" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Detection Summary</CardTitle>
                  <CardDescription>
                    Total objects detected and classified
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-muted-foreground">
                      Total Detections
                    </span>
                    <span className="text-2xl font-bold">
                      {detectionStats.totalDetections}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Hazards by Type</h4>
                    <div className="space-y-2">
                      {Object.entries(detectionStats.hazardsByType).map(
                        ([type, count]) => (
                          <div
                            key={type}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center">
                              <span className="text-sm">{type}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm font-medium">
                                {count}
                              </span>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Confidence Distribution</CardTitle>
                  <CardDescription>AI model confidence levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(detectionStats.confidenceDistribution).map(
                      ([level, count]) => (
                        <div key={level} className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">{level}</span>
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                          <Progress
                            value={
                              (count / detectionStats.totalDetections) * 100
                            }
                            className="h-2"
                          />
                        </div>
                      ),
                    )}

                    <div className="flex items-center justify-between mt-4 pt-2 border-t">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                        <span className="text-sm">False Positive Rate</span>
                      </div>
                      <span className="text-sm font-medium">
                        {detectionStats.falsePositiveRate}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    System Uptime
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-2xl font-bold">
                      {systemPerformance.uptime} hrs
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Queued Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-2xl font-bold">
                      {systemPerformance.queuedTasks}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Error Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-2xl font-bold">
                      {systemPerformance.errorRate}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Active AI Models</CardTitle>
                <CardDescription>Currently deployed models</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {systemPerformance.activeModels.map((model, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm font-medium">{model}</span>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
