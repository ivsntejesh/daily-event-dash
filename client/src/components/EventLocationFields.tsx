
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface EventLocationFieldsProps {
  isOnline: boolean;
  meetingLink: string;
  location: string;
  onIsOnlineChange: (checked: boolean) => void;
  onMeetingLinkChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  disabled?: boolean;
}

export const EventLocationFields = ({
  isOnline,
  meetingLink,
  location,
  onIsOnlineChange,
  onMeetingLinkChange,
  onLocationChange,
  disabled = false
}: EventLocationFieldsProps) => {
  return (
    <>
      <div className="flex items-center space-x-2">
        <Switch
          id="isOnline"
          checked={isOnline}
          onCheckedChange={onIsOnlineChange}
          disabled={disabled}
        />
        <Label htmlFor="isOnline">Online Event</Label>
      </div>

      {isOnline ? (
        <div>
          <Label htmlFor="meetingLink">Meeting Link</Label>
          <Input
            id="meetingLink"
            type="url"
            value={meetingLink}
            onChange={(e) => onMeetingLinkChange(e.target.value)}
            placeholder="https://zoom.us/j/..."
            disabled={disabled}
          />
        </div>
      ) : (
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="Room 101, Building A"
            disabled={disabled}
          />
        </div>
      )}
    </>
  );
};
