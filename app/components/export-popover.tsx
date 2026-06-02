'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown, Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface ExportPopoverProps {
  isExporting: boolean;
  onExportPDF: (start: Date | null, end: Date | null) => void;
  onExportExcel: (start: Date | null, end: Date | null) => void;
}

export function ExportPopover({ isExporting, onExportPDF, onExportExcel }: ExportPopoverProps) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const parseDates = () => {
    const start = from ? new Date(from) : null;
    const end = to ? new Date(to) : null;
    return { start, end };
  };

  const handleExport = (type: 'pdf' | 'excel') => {
    const { start, end } = parseDates();
    setOpen(false);
    if (type === 'pdf') onExportPDF(start, end);
    else onExportExcel(start, end);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button disabled={isExporting} variant="outline" className="h-8 gap-1.5 text-xs cursor-pointer">
          {isExporting
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Download className="w-3.5 h-3.5" />}
          Export
          <ChevronDown className="w-3 h-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-3 space-y-3">
        <div>
          <p className="text-xs font-semibold text-gray-800 mb-0.5">Export Report</p>
          <p className="text-[11px] text-gray-400">Leave blank to export all records</p>
        </div>

        <div className="space-y-2">
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={e => setFrom(e.target.value)}
              className="w-full h-8 px-2 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={to}
              min={from || undefined}
              max={new Date().toISOString().slice(0, 10)}
              onChange={e => setTo(e.target.value)}
              className="w-full h-8 px-2 text-xs border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
          </div>
          {(from || to) && (
            <button
              type="button"
              onClick={() => { setFrom(''); setTo(''); }}
              className="text-[11px] text-blue-500 hover:underline"
            >
              Clear dates (export all)
            </button>
          )}
        </div>

        <div className="space-y-1.5 pt-1 border-t border-gray-100">
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-2 text-xs h-8 cursor-pointer justify-start"
            onClick={() => handleExport('pdf')}
          >
            <Download className="w-3.5 h-3.5" /> Export as PDF
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-2 text-xs h-8 cursor-pointer justify-start"
            onClick={() => handleExport('excel')}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export as Excel
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
