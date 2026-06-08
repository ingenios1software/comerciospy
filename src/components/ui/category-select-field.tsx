"use client";

import { useEffect, useMemo, useState } from 'react';
import type { Category } from '@/lib/categories';

type CategorySelectFieldProps = {
  id: string;
  label: string;
  value: string;
  options: Category[];
  onChange: (value: string) => void;
  required?: boolean;
  inputPlaceholder?: string;
  controlClassName?: string;
};

const customCategoryValue = '__custom_category__';
const defaultControlClassName =
  'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-red-100';

export function CategorySelectField({
  id,
  label,
  value,
  options,
  onChange,
  required,
  inputPlaceholder = 'Ej: Panificados',
  controlClassName = defaultControlClassName
}: CategorySelectFieldProps) {
  const optionLabels = useMemo(() => options.map((option) => option.label), [options]);
  const isKnownCategory = optionLabels.includes(value);
  const [customMode, setCustomMode] = useState(() => Boolean(value && !isKnownCategory));

  useEffect(() => {
    if (value && !optionLabels.includes(value)) {
      setCustomMode(true);
    }
  }, [optionLabels, value]);

  const handleSelectCategory = (nextValue: string) => {
    if (nextValue === customCategoryValue) {
      setCustomMode(true);
      if (isKnownCategory) onChange('');
      return;
    }

    setCustomMode(false);
    onChange(nextValue);
  };

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <select
        id={id}
        value={customMode ? customCategoryValue : value}
        onChange={(event) => handleSelectCategory(event.target.value)}
        className={controlClassName}
        required={required && !customMode}
      >
        {options.map((option) => (
          <option key={option.id} value={option.label}>
            {option.label}
          </option>
        ))}
        <option value={customCategoryValue}>Agregar categoria...</option>
      </select>
      {customMode ? (
        <input
          id={`${id}-custom`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={inputPlaceholder}
          maxLength={60}
          className={`${controlClassName} mt-2`}
          required={required}
          aria-label={`${label} personalizada`}
        />
      ) : null}
    </div>
  );
}
