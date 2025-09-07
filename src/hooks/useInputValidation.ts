import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useInputValidation = () => {
  const [isValidating, setIsValidating] = useState(false);

  const validateMeetingLink = async (link: string): Promise<boolean> => {
    if (!link.trim()) return true; // Empty links are allowed
    
    try {
      setIsValidating(true);
      const { data, error } = await supabase.rpc('validate_meeting_link', { link });
      
      if (error) {
        console.error('Error validating meeting link:', error);
        return false;
      }
      
      return data;
    } catch (error) {
      console.error('Error validating meeting link:', error);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const sanitizeTextInput = async (text: string): Promise<string> => {
    if (!text) return '';
    
    try {
      const { data, error } = await supabase.rpc('sanitize_text_input', { input_text: text });
      
      if (error) {
        console.error('Error sanitizing text:', error);
        return text; // Return original if sanitization fails
      }
      
      return data || text;
    } catch (error) {
      console.error('Error sanitizing text:', error);
      return text;
    }
  };

  const validateAndSanitizeForm = async (formData: Record<string, any>) => {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === 'string') {
        if (key === 'meeting_link' || key === 'meetingLink') {
          const isValid = await validateMeetingLink(value);
          if (!isValid) {
            throw new Error('Invalid meeting link format. Please use a valid URL from Zoom, Teams, Google Meet, or WebEx.');
          }
          sanitized[key] = value;
        } else {
          sanitized[key] = await sanitizeTextInput(value);
        }
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  };

  return {
    validateMeetingLink,
    sanitizeTextInput,
    validateAndSanitizeForm,
    isValidating,
  };
};