import * as React from 'react';

interface Props {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function Switch({ checked = false, onCheckedChange }: Props) {
  return (
    <button
      onClick={() => onCheckedChange && onCheckedChange(!checked)}
      aria-pressed={checked}
      className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${checked ? 'bg-slate-900' : 'bg-slate-200'}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`}
      />
    </button>
  );
}
