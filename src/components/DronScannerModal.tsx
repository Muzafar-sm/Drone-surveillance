// components/Dashboard/DroneScannerModal.tsx
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const fakeDrones = [
  { id: "drone-1", name: "SkyEye-001", protocol: "Wi-Fi" },
  { id: "drone-2", name: "Phantom-X", protocol: "Bluetooth" },
];

const DroneScannerModal = ({ open, onClose, onConnect }: any) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan for Nearby Drones</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Searching via Wi-Fi & Bluetooth...</p>
          {fakeDrones.map((drone) => (
            <div
              key={drone.id}
              className="flex items-center justify-between border rounded-md p-3"
            >
              <div>
                <p className="font-medium">{drone.name}</p>
                <p className="text-xs text-muted-foreground">{drone.protocol}</p>
              </div>
              <Button onClick={() => onConnect(drone)}>Connect</Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DroneScannerModal;
