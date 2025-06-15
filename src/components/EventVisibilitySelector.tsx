
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface EventVisibilitySelectorProps {
  isPublicEvent: boolean;
  onVisibilityChange: (isPublic: boolean) => void;
  disabled?: boolean;
}

export const EventVisibilitySelector = ({ 
  isPublicEvent, 
  onVisibilityChange, 
  disabled = false 
}: EventVisibilitySelectorProps) => {
  return (
    <div>
      <Label className="text-base font-medium">Event Visibility</Label>
      <RadioGroup
        value={isPublicEvent ? 'public' : 'private'}
        onValueChange={(value) => onVisibilityChange(value === 'public')}
        className="mt-2"
        disabled={disabled}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="private" id="private" />
          <Label htmlFor="private" className="cursor-pointer">
            Private Event - Only visible to you
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="public" id="public" />
          <Label htmlFor="public" className="cursor-pointer">
            Public Event - Visible to all users
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};
