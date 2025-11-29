import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> {
  label?: string;
  error?: string;
  icon?: React.ComponentType<any>;
  as?: 'input' | 'textarea' | 'select';
  children?: React.ReactNode;
  rows?: number;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  icon: Icon, 
  className = '', 
  as = 'input',
  children,
  ...props 
}) => {
  const baseClassName = `
    block w-full rounded-lg border-slate-300 shadow-sm 
    bg-white
    focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm 
    ${Icon ? 'pl-10' : 'pl-3'}
    ${error ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'}
    ${className}
  `;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && as === 'input' && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-slate-400" />
          </div>
        )}
        
        {as === 'textarea' ? (
          <textarea
            className={`${baseClassName} py-2`}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : as === 'select' ? (
          <select
            className={`${baseClassName} py-2.5`}
            {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
          >
            {children}
          </select>
        ) : (
          <input
            className={`${baseClassName} py-2.5`}
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};