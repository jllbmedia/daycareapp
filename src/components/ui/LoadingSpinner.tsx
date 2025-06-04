interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'white';
  text?: string;
  fullscreen?: boolean;
}

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'primary',
  text,
  fullscreen = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3'
  };

  const variantClasses = {
    primary: 'border-indigo-600',
    white: 'border-white'
  };

  const spinnerClasses = `
    inline-block rounded-full 
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    border-t-transparent
    animate-spin
  `;

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3`}>
      <div className={spinnerClasses} />
      {text && (
        <p className={`text-sm font-medium ${variant === 'white' ? 'text-white' : 'text-gray-600'}`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
} 