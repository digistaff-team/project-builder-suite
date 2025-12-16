import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: 'primary' | 'warning' | 'success';
  delay?: number;
}

const colorClasses = {
  primary: 'bg-primary/10 text-primary',
  warning: 'bg-warning/10 text-warning',
  success: 'bg-success/10 text-success',
};

const valueClasses = {
  primary: 'text-foreground',
  warning: 'text-warning',
  success: 'text-success',
};

export const StatsCard = ({ title, value, icon: Icon, color, delay = 0 }: StatsCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="border-border/50">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold font-display ${valueClasses[color]}`}>{value}</p>
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
