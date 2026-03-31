import React from 'react';
import { LucideIcon } from 'lucide-react';
import { classNames } from '@correlaciones/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  tone?: 'base' | 'alt1' | 'alt2' | 'alt3' | 'alt4' | 'alt5';
  icon?: LucideIcon;
}

const toneStyles: Record<NonNullable<KpiCardProps['tone']>, string> = {
  base: 'cor-kpi-tone-base',
  alt1: 'cor-kpi-tone-alt1',
  alt2: 'cor-kpi-tone-alt2',
  alt3: 'cor-kpi-tone-alt3',
  alt4: 'cor-kpi-tone-alt4',
  alt5: 'cor-kpi-tone-alt5',
};

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtitle, tone = 'base', icon: Icon }) => {
  return (
    <div className={classNames('kpi-card cor-kpi-card', toneStyles[tone])}>
      {Icon ? (
        <span className="cor-kpi-icon">
          <Icon className="cor-inline-icon" aria-hidden="true" />
        </span>
      ) : null}
      <div className="cor-kpi-title">{title}</div>
      <div
        className={classNames(
          'cor-kpi-value',
          typeof value === 'number' ? 'cor-kpi-value-large' : 'cor-kpi-value-compact',
        )}
      >
        {value}
      </div>
      <div className="cor-kpi-subtitle">{subtitle}</div>
    </div>
  );
};
