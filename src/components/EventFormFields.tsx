
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface EventFormFieldsProps {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  errors: Record<string, string>;
  disabled?: boolean;
}

export const EventFormFields = ({
  title,
  description,
  date,
  startTime,
  endTime,
  notes,
  onTitleChange,
  onDescriptionChange,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onNotesChange,
  errors,
  disabled = false
}: EventFormFieldsProps) => {
  return (
    <>
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className={errors.title ? 'border-red-500' : ''}
          disabled={disabled}
        />
        {errors.title && (
          <p className="text-sm text-red-500 mt-1">{errors.title}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
          disabled={disabled}
        />
      </div>

      <div>
        <Label htmlFor="date">Date *</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className={errors.date ? 'border-red-500' : ''}
          disabled={disabled}
        />
        {errors.date && (
          <p className="text-sm text-red-500 mt-1">{errors.date}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startTime">Start Time *</Label>
          <Input
            id="startTime"
            type="time"
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
            className={errors.startTime ? 'border-red-500' : ''}
            disabled={disabled}
          />
          {errors.startTime && (
            <p className="text-sm text-red-500 mt-1">{errors.startTime}</p>
          )}
        </div>

        <div>
          <Label htmlFor="endTime">End Time *</Label>
          <Input
            id="endTime"
            type="time"
            value={endTime}
            onChange={(e) => onEndTimeChange(e.target.value)}
            className={errors.endTime ? 'border-red-500' : ''}
            disabled={disabled}
          />
          {errors.endTime && (
            <p className="text-sm text-red-500 mt-1">{errors.endTime}</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          disabled={disabled}
        />
      </div>
    </>
  );
};
