import React from 'react';
import { LucideIcon } from 'lucide-react';
import { classNames } from '@reincidentes/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  tone?: 'base' | 'alt1' | 'alt2' | 'alt3' | 'alt4';
  icon?: LucideIcon;
}

const toneStyles: Record<NonNullable<KpiCardProps['tone']>, string> = {
  base: 'rri-kpi-tone-base',
  alt1: 'rri-kpi-tone-alt1',
  alt2: 'rri-kpi-tone-alt2',
  alt3: 'rri-kpi-tone-alt3',
  alt4: 'rri-kpi-tone-alt4',
};

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtitle, tone = 'base', icon: Icon }) => {
  return (
    <div className={classNames('kpi-card rri-kpi-card', toneStyles[tone])}>
      {Icon ? (
        <span className="rri-kpi-icon">
          <Icon className="rri-inline-icon" aria-hidden="true" />
        </span>
      ) : null}
      <div className="rri-kpi-title">{title}</div>
      <div
        className={classNames(
          'rri-kpi-value',
          typeof value === 'number' ? 'rri-kpi-value-large' : 'rri-kpi-value-compact',
        )}
      >
        {value}
      </div>
      <div className="rri-kpi-subtitle">{subtitle}</div>
    </div>
  );
};
