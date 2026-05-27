'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tables } from '@/database.types';
import { AlertTriangle, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type WordFilter = Tables<'word_filters'>;

export default function WordFiltersPage() {
  const [filters, setFilters] = useState<WordFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<WordFilter | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    fetchFilters();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { supabase } = await import('@/app/client/supabase');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const fetchFilters = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/word-filters');
      if (response.ok) {
        const data = await response.json();
        setFilters(data);
      }
    } catch (error) {
      console.error('Error fetching word filters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWord = async () => {
    if (!newWord.trim()) return;

    try {
      setSubmitting(true);
      const response = await fetch('/api/word-filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: newWord.trim(), userId }),
      });

      if (response.ok) {
        await fetchFilters();
        setNewWord('');
        setIsAddDialogOpen(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add word filter');
      }
    } catch (error) {
      console.error('Error adding word filter:', error);
      alert('Failed to add word filter');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWord = async () => {
    if (!selectedFilter) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/word-filters/${selectedFilter.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        await fetchFilters();
        setIsDeleteDialogOpen(false);
        setSelectedFilter(null);
      } else {
        alert('Failed to delete word filter');
      }
    } catch (error) {
      console.error('Error deleting word filter:', error);
      alert('Failed to delete word filter');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredWords = filters.filter((filter) =>
    filter.word?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading word filters...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-[#f8fafc] md:p-6">
      <div className="mx-auto space-y-4 max-w-7xl">
        {/* Toolbar */}
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            <div className="flex-1 min-w-[80px] p-3 rounded-xl border border-gray-200 bg-white">
              <p className="text-xs font-medium text-gray-500">Total</p>
              <p className="text-xl font-bold mt-0.5 text-gray-900 tabular-nums leading-none">{filters.length}</p>
            </div>
            <div className="flex-1 min-w-[80px] p-3 rounded-xl border border-gray-200 bg-white">
              <p className="text-xs font-medium text-gray-500">Matching</p>
              <p className="text-xl font-bold mt-0.5 text-gray-900 tabular-nums leading-none">{filteredWords.length}</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search filter words..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 w-52 text-sm"
              />
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="h-8 gap-1.5 text-xs bg-[#4988C4] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Word
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {filteredWords.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-100 bg-gray-50/80">
                  <TableHead className="w-[80px] px-4 py-2 text-xs font-medium text-gray-500">ID</TableHead>
                  <TableHead className="px-4 py-2 text-xs font-medium text-gray-500">Filtered Word</TableHead>
                  <TableHead className="px-4 py-2 text-xs font-medium text-gray-500">Created At</TableHead>
                  <TableHead className="w-[100px] px-4 py-2 text-xs font-medium text-gray-500 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWords.map((filter) => (
                  <TableRow key={filter.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100">
                    <TableCell className="px-4 py-2.5 font-medium text-gray-700 text-sm">#{filter.id}</TableCell>
                    <TableCell className="px-4 py-2.5">
                      <span className="px-2 py-0.5 text-xs font-medium text-red-700 bg-red-50 border border-red-100 rounded">
                        {filter.word}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-sm text-gray-500">
                      {new Date(filter.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFilter(filter);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium">No word filters found</p>
              <p className="mt-1 text-sm">
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Add your first filter word to get started'}
              </p>
            </div>
          )}
        </div>

        {/* Add Word Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Filter Word</DialogTitle>
              <DialogDescription>
                Add a new word or phrase to filter from user content.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="Enter word to filter (e.g., tanga)"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !submitting) {
                    handleAddWord();
                  }
                }}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setNewWord('');
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button onClick={handleAddWord} disabled={!newWord.trim() || submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Filter'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Filter Word</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this filter word? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {selectedFilter && (
              <div className="p-4 rounded-lg bg-gray-50">
                <p className="text-sm text-gray-600">Word to delete:</p>
                <p className="mt-1 text-lg font-semibold text-red-600">{selectedFilter.word}</p>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setSelectedFilter(null);
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteWord} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
