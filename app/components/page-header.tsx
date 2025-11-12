import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  className?: string;
  action?: React.ReactNode;
  size?: 'default' | 'small';
}

export function PageHeader({
  title,
  subtitle,
  className,
  action,
  size = 'default',
}: PageHeaderProps) {
  const hasAction = Boolean(action);

  return (
    <div className={cn('mb-6', className)}>
      {/* Title row - with or without button */}
      {hasAction ? (
        <div className="flex items-center justify-between mb-1">
          <h1
            className={cn('font-semibold text-gray-900', size === 'small' ? 'text-lg' : 'text-xl')}
          >
            {title}
          </h1>
          {action}
        </div>
      ) : (
        <h1
          className={cn(
            'font-semibold text-gray-900 mb-1',
            size === 'small' ? 'text-lg' : 'text-xl',
          )}
        >
          {title}
        </h1>
      )}

      {/* Subtitle - always left aligned */}
      <p className="text-sm text-gray-600">{subtitle}</p>
    </div>
  );
}
