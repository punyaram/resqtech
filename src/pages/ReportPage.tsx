import React from 'react';
import { ReportForm } from '@/components/ReportForm';

export const ReportPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Report Ocean Hazard</h1>
        <p className="text-muted-foreground">
          Help protect coastal communities by reporting dangerous ocean conditions
        </p>
      </div>
      
      <ReportForm />
    </div>
  );
};