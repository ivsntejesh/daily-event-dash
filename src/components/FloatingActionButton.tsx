
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FloatingActionButtonProps {
  onClick: () => void;
}

export const FloatingActionButton = ({ onClick }: FloatingActionButtonProps) => {
  return (
    <div className="fixed bottom-6 right-6 md:hidden">
      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg"
        onClick={onClick}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};
