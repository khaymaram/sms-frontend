import { forwardRef } from 'react';
import {
  type FormSize,
  getFormSizeClasses,
  FORM_BASE_STYLES,
  FORM_ERROR_STYLES,
  FORM_DEFAULT_STYLES
} from '@/constants/formSizes';
import { cn } from '@/lib/utils';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  inputSize?: FormSize;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, inputSize = 'md', className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground/80 dark:text-foreground/70 mb-2">
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            FORM_BASE_STYLES,
            getFormSizeClasses(inputSize),
            error ? FORM_ERROR_STYLES : FORM_DEFAULT_STYLES,
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
