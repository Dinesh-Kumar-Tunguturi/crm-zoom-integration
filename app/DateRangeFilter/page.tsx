"use client";

import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DateRange {
  from: string;
  to: string;
}

export default function DateRangeFilter({ onApply }: { onApply: (range: DateRange) => void }) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });

  const handleApply = () => {
    onApply(range);
    setOpen(false);
  };

  const handleClear = () => {
    setRange({ from: "", to: "" });
    onApply({ from: "", to: "" });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center gap-1">
          📅 Date Range
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-4 space-y-3">
        <div className="flex flex-col gap-2">
          <Input
            type="date"
            placeholder="Start Date"
            value={range.from}
            onChange={(e) => setRange({ ...range, from: e.target.value })}
          />
          <Input
            type="date"
            placeholder="End Date"
            value={range.to}
            onChange={(e) => setRange({ ...range, to: e.target.value })}
          />
        </div>

        <div className="flex justify-between items-center mt-2">
          <Button variant="outline" onClick={handleApply} className="flex-1 mr-2">
            Apply Filter
          </Button>
          <Button variant="ghost" onClick={handleClear} className="flex-1">
            Clear Filter
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
