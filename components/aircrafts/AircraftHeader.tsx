import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { REG_NO, TOTAL_SEATS } from "./constants";
import PlaneInfo from "../svg/PlaneInfo";

interface AircraftHeaderProps {
  availableSeats: number;
}

export const AircraftHeader = ({ availableSeats }: AircraftHeaderProps) => {
  return (
    <Card className="mb-4 overflow-hidden border-gray-100 py-0 shadow-sm">
      <CardContent className="p-5">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-[#E8EBEE] bg-[#f8f9fa] p-2.75">
              {/* <Plane className="h-5 w-5" /> */}
              <PlaneInfo />
            </div>
            <h1 className="font-semibold text-[#374456]">Aircraft Details</h1>
          </div>
          <div className="flex gap-12">
            <div className="text-start">
              <p className="mb-1 text-sm leading-5 font-medium text-[#667386] uppercase">
                Total Seats
              </p>
              <p className="text-xl leading-7 font-semibold text-[#1558F6]">
                {TOTAL_SEATS}
              </p>
            </div>
            <div className="text-start">
              <p className="mb-1 text-sm leading-5 font-medium text-[#667386] uppercase">
                Available Seats
              </p>

              <p className="text-xl leading-7 font-semibold text-[#17B26A]">
                {availableSeats}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label className="text-sm leading-5 font-medium text-[#374456]">
              Aircraft Type
            </Label>
            <Select>
              <SelectTrigger className="mb-0 h-auto! w-full px-3! py-3!">
                <SelectValue placeholder="Select an Aircraft" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="B737-800">B737-800</SelectItem>
                  <SelectItem value="B777-550">B777-550</SelectItem>
                  <SelectItem value="B999-777">B999-777</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm leading-5 font-medium text-[#374456]">
              Registration No.
            </Label>
            <Input
              className="mb-0 h-auto! w-full px-3! py-3!"
              placeholder={REG_NO}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm leading-5 font-medium text-[#374456]">
              Aircraft Status
            </Label>
            <Select>
              <SelectTrigger className="mb-0 h-auto! w-full px-3! py-3!">
                <SelectValue placeholder="Select an Aircraft" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm leading-5 font-medium text-[#374456]">
              Jump Seats
            </Label>
            <Input
              className="mb-0 h-auto! w-full px-3! py-3!"
              placeholder="4"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
