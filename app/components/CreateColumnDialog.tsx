import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { useToast } from '@/app/hooks/useToast';

interface CreateColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateColumn: (title: string, color?: string) => Promise<void>;
}

const CreateColumnDialog: React.FC<CreateColumnDialogProps> = ({
  open,
  onOpenChange,
  onCreateColumn
}) => {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    try {
      setIsSubmitting(true);
      await onCreateColumn(title);
      
      // Clear form and close modal
      setTitle('');
      onOpenChange(false);
      toast({ 
        title: "Column created", 
        variant: "success" 
      });
    } catch (error) {
      console.error('Error creating column:', error);
      toast({ 
        title: "Failed to create column", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Column</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="columnTitle" className="block text-sm font-medium mb-1">
              Column Title
            </label>
            <input
              id="columnTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-black-700 dark:text-white"
              placeholder="Enter column title"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Column'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateColumnDialog;