'use client';

import { supabase } from '@/app/client/supabase';
import hotlinesAPI, { Hotline, HOTLINE_CATEGORIES } from '@/app/lib/hotlines-api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Edit,
  Loader2,
  Phone,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const CATEGORY_COLORS: Record<string, string> = {
  Hospital:    'bg-blue-50 text-blue-700 border-blue-200',
  Ambulance:   'bg-red-50 text-red-700 border-red-200',
  Police:      'bg-indigo-50 text-indigo-700 border-indigo-200',
  Fire:        'bg-orange-50 text-orange-700 border-orange-200',
  'Coast Guard': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Red Cross': 'bg-rose-50 text-rose-700 border-rose-200',
  NDRRMC:      'bg-yellow-50 text-yellow-700 border-yellow-200',
  Barangay:    'bg-green-50 text-green-700 border-green-200',
  Other:       'bg-gray-50 text-gray-700 border-gray-200',
};

function categoryBadge(category: string) {
  const cls = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {category}
    </span>
  );
}

// ── Phone list editor ─────────────────────────────────────────────────────────
function PhoneListEditor({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const update = (i: number, val: string) => {
    const next = [...values];
    next[i] = val;
    onChange(next);
  };
  const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i));
  const add = () => onChange([...values, '']);

  return (
    <div>
      <Label className="text-sm font-semibold">{label}</Label>
      <div className="mt-2 space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={v}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              className="h-8 text-sm bg-background"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => remove(i)}
              className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          className="h-7 text-xs gap-1 cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          Add {label}
        </Button>
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotline: Hotline | null;
  onSave: (data: { category: string; name: string; phones: string[]; landlines: string[] }) => Promise<void>;
  loading: boolean;
}

function HotlineModal({ isOpen, onClose, hotline, onSave, loading }: ModalProps) {
  const [form, setForm] = useState({
    category: '',
    customCategory: '',
    name: '',
    phones: [''],
    landlines: [''],
  });

  const isCustom = form.category === '__custom__';

  useEffect(() => {
    if (isOpen) {
      if (hotline) {
        const known = HOTLINE_CATEGORIES.includes(hotline.category as never);
        setForm({
          category: known ? hotline.category : '__custom__',
          customCategory: known ? '' : hotline.category,
          name: hotline.name,
          phones: hotline.phones.length ? hotline.phones : [''],
          landlines: hotline.landlines.length ? hotline.landlines : [''],
        });
      } else {
        setForm({ category: '', customCategory: '', name: '', phones: [''], landlines: [''] });
      }
    }
  }, [isOpen, hotline]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedCategory = isCustom ? form.customCategory.trim() : form.category;
    if (!resolvedCategory) return;
    await onSave({
      category: resolvedCategory,
      name: form.name.trim(),
      phones: form.phones.filter((p) => p.trim()),
      landlines: form.landlines.filter((l) => l.trim()),
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto rounded-lg">
        <DialogHeader>
          <DialogTitle>{hotline ? 'Edit Hotline' : 'Add Hotline'}</DialogTitle>
          <DialogDescription>
            {hotline ? 'Update emergency hotline details.' : 'Add a new emergency hotline service.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Category */}
          <div>
            <Label className="text-sm font-semibold">Category *</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm((p) => ({ ...p, category: v, customCategory: '' }))}
              disabled={loading}
            >
              <SelectTrigger className="mt-2 bg-background">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {HOTLINE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
                <SelectItem value="__custom__">Other (custom)</SelectItem>
              </SelectContent>
            </Select>
            {isCustom && (
              <Input
                value={form.customCategory}
                onChange={(e) => setForm((p) => ({ ...p, customCategory: e.target.value }))}
                placeholder="Enter custom category"
                required
                disabled={loading}
                className="mt-2 bg-background"
              />
            )}
          </div>

          {/* Name */}
          <div>
            <Label className="text-sm font-semibold">Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="E.g., Amaya General Hospital, Tanza PNP"
              required
              disabled={loading}
              className="mt-2 bg-background"
            />
          </div>

          {/* Phone Numbers */}
          <PhoneListEditor
            label="Phone Numbers"
            values={form.phones}
            onChange={(phones) => setForm((p) => ({ ...p, phones }))}
            placeholder="+63 9XX XXX XXXX"
          />

          {/* Landlines */}
          <PhoneListEditor
            label="Landlines"
            values={form.landlines}
            onChange={(landlines) => setForm((p) => ({ ...p, landlines }))}
            placeholder="(046) XXX-XXXX"
          />

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !form.name.trim() || !(isCustom ? form.customCategory.trim() : form.category)}
              className="gap-2 bg-[#4988C4] cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {hotline ? 'Save Changes' : 'Add Hotline'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HotlinesPage() {
  const [hotlines, setHotlines] = useState<Hotline[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Hotline | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await hotlinesAPI.getAll();
    if (res.success && res.data) setHotlines(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const categories = Array.from(new Set(hotlines.map((h) => h.category))).sort();

  const filtered = hotlines.filter((h) => {
    const matchesSearch =
      !searchTerm ||
      h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.phones.some((p) => p.includes(searchTerm)) ||
      h.landlines.some((l) => l.includes(searchTerm));
    const matchesCategory = categoryFilter === 'all' || h.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (h: Hotline) => { setEditing(h); setModalOpen(true); };

  const handleSave = async (data: { category: string; name: string; phones: string[]; landlines: string[] }) => {
    setModalLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    if (editing) {
      const res = await hotlinesAPI.update(editing.id, { ...data, userId });
      if (res.success && res.data) {
        setHotlines((prev) => prev.map((h) => (h.id === editing.id ? res.data! : h)));
        setModalOpen(false);
      }
    } else {
      const res = await hotlinesAPI.create({ ...data, userId });
      if (res.success && res.data) {
        setHotlines((prev) => [res.data!, ...prev]);
        setModalOpen(false);
      }
    }
    setModalLoading(false);
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    setDeleting(true);
    const { data: { user } } = await supabase.auth.getUser();
    const res = await hotlinesAPI.delete(deleteId, user?.id);
    if (res.success) setHotlines((prev) => prev.filter((h) => h.id !== deleteId));
    setDeleteId(null);
    setDeleting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-[#f8fafc] md:p-6">
      <div className="mx-auto space-y-4 max-w-7xl">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Emergency Hotlines</h1>
            <p className="text-sm text-gray-500">Manage emergency contact numbers and services</p>
          </div>
          <Button onClick={openCreate} className="gap-2 bg-[#4988C4] cursor-pointer h-9 text-sm">
            <Plus className="w-4 h-4" />
            Add Hotline
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Total', value: hotlines.length },
            { label: 'Categories', value: categories.length },
            { label: 'Phone Numbers', value: hotlines.reduce((s, h) => s + h.phones.length, 0) },
            { label: 'Landlines', value: hotlines.reduce((s, h) => s + h.landlines.length, 0) },
          ].map((s) => (
            <Card key={s.label} className="p-4 shadow-none border-gray-200">
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Search hotlines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-8 text-sm border-gray-200 bg-white"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-8 w-[160px] text-xs border-gray-200 bg-white">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Phone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-gray-900">
                {hotlines.length === 0 ? 'No hotlines yet' : 'No results found'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {hotlines.length === 0
                  ? 'Add your first emergency hotline to get started'
                  : 'Try adjusting your search or filter'}
              </p>
              {hotlines.length === 0 && (
                <Button onClick={openCreate} className="mt-4 gap-2 bg-[#4988C4] cursor-pointer">
                  <Plus className="w-4 h-4" /> Add First Hotline
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                      <TableHead className="text-xs font-semibold text-gray-500 w-[140px]">Category</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500">Name</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 w-[200px]">Phone Numbers</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 w-[200px]">Landlines</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 w-[90px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((h) => (
                      <TableRow key={h.id} className="hover:bg-gray-50/50">
                        <TableCell className="py-3">{categoryBadge(h.category)}</TableCell>
                        <TableCell className="py-3 font-medium text-gray-900">{h.name}</TableCell>
                        <TableCell className="py-3">
                          {h.phones.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {h.phones.map((p, i) => (
                                <span key={i} className="inline-flex items-center gap-1 text-xs text-gray-700 bg-gray-100 rounded px-1.5 py-0.5">
                                  <Phone className="w-3 h-3 text-gray-400" />{p}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          {h.landlines.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {h.landlines.map((l, i) => (
                                <span key={i} className="inline-flex items-center gap-1 text-xs text-gray-700 bg-gray-100 rounded px-1.5 py-0.5">
                                  {l}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(h)}
                              className="h-7 w-7 p-0 text-gray-500 hover:text-gray-900"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(h.id)}
                              className="h-7 w-7 p-0 text-gray-500 hover:text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {filtered.map((h) => (
                  <div key={h.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {categoryBadge(h.category)}
                        <p className="mt-1 font-semibold text-gray-900 text-sm">{h.name}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(h)} className="h-7 w-7 p-0 text-gray-500">
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(h.id)} className="h-7 w-7 p-0 text-gray-500 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    {h.phones.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {h.phones.map((p, i) => (
                          <span key={i} className="inline-flex items-center gap-1 text-xs text-gray-700 bg-gray-100 rounded px-1.5 py-0.5">
                            <Phone className="w-3 h-3 text-gray-400" />{p}
                          </span>
                        ))}
                      </div>
                    )}
                    {h.landlines.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {h.landlines.map((l, i) => (
                          <span key={i} className="text-xs text-gray-700 bg-gray-100 rounded px-1.5 py-0.5">{l}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer count */}
        {filtered.length > 0 && (
          <p className="text-xs text-gray-400 text-right">
            Showing {filtered.length} of {hotlines.length} hotlines
          </p>
        )}
      </div>

      {/* Modal */}
      <HotlineModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        hotline={editing}
        onSave={handleSave}
        loading={modalLoading}
      />

      {/* Delete Confirm */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Hotline</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-900">
                {hotlines.find((h) => h.id === deleteId)?.name}
              </span>
              ? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-2">
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
