// components/ui/InputModal.tsx
import React, { useState } from 'react';
import { Modal } from './Modal';

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: number) => void;
  title: string;
  message: string;
  inputLabel: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'number' | 'text';
  min?: number;
  max?: number;
  defaultValue?: number;
  isLoading?: boolean;
}

export const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  inputLabel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'number',
  min,
  max,
  defaultValue,
  isLoading = false
}) => {
  const [value, setValue] = useState(defaultValue?.toString() || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'number') {
      onConfirm(parseFloat(value));
    }
  };

  const isValueValid = () => {
    if (type === 'number') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return false;
      if (min !== undefined && numValue < min) return false;
      if (max !== undefined && numValue > max) return false;
      return true;
    }
    return value.trim().length > 0;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          {message}
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {inputLabel}
          </label>
          <input
            type={type}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            min={min}
            max={max}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="submit"
            disabled={!isValueValid() || isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </form>
    </Modal>
  );
};