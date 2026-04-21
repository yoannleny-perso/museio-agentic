
import React from 'react';
import { Check, X } from 'lucide-react';

interface EditSocialMediaFormProps {
  platform: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const EditSocialMediaForm: React.FC<EditSocialMediaFormProps> = ({
  platform,
  value,
  onChange,
  onSave,
  onCancel,
  onKeyDown
}) => {
  return (
    <div className="flex items-center gap-2 bg-white border border-[#8B5CF6] rounded-lg p-2 shadow-lg">
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="text-xs w-32 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-[#8B5CF6]"
        placeholder={`${platform} URL`}
        autoFocus
      />
      <button
        onClick={onSave}
        className="p-1 text-green-600 hover:bg-green-50 rounded"
      >
        <Check className="h-4 w-4" />
      </button>
      <button
        onClick={onCancel}
        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default EditSocialMediaForm;
