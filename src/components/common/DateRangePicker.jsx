"use client";

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
}) {
  const handleClear = () => {
    onStartChange("");
    onEndChange("");
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <Input
        label="Start date"
        type="date"
        value={startDate}
        onChange={(e) => onStartChange(e.target.value)}
      />
      <Input
        label="End date"
        type="date"
        value={endDate}
        onChange={(e) => onEndChange(e.target.value)}
      />
      {(startDate || endDate) && (
        <Button variant="ghost" size="sm" onClick={handleClear}>
          Clear
        </Button>
      )}
    </div>
  );
}
