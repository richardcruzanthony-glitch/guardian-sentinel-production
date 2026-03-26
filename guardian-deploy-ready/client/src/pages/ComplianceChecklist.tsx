import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface ComplianceStandard {
  name: string;
  items: string[];
}

const COMPLIANCE_STANDARDS: Record<string, ComplianceStandard> = {
  AS9100: {
    name: 'AS9100 (Aerospace)',
    items: [
      'Material certification (CoC)',
      'Traceability documentation',
      'First article inspection report',
      'Process capability study (Cpk)',
      'Configuration management',
      'Counterfeit parts prevention',
      'Foreign object debris (FOD) control',
      'Nonconforming parts disposition',
    ],
  },
  ISO9001: {
    name: 'ISO 9001 (Quality Management)',
    items: [
      'Quality policy documentation',
      'Process control procedures',
      'Inspection and testing records',
      'Corrective action reports',
      'Management review records',
      'Internal audit reports',
      'Supplier evaluation',
      'Customer satisfaction data',
    ],
  },
  ISO13485: {
    name: 'ISO 13485 (Medical Devices)',
    items: [
      'Design history file (DHF)',
      'Risk analysis documentation',
      'Biocompatibility assessment',
      'Sterilization validation',
      'Shelf life validation',
      'Traceability records',
      'Post-market surveillance',
      'Complaint handling procedures',
    ],
  },
  ITAR: {
    name: 'ITAR (Export Control)',
    items: [
      'Controlled technical data classification',
      'Access control procedures',
      'Employee training documentation',
      'Visitor log and access control',
      'Export authorization verification',
      'Deemed export compliance',
      'Encryption and data protection',
      'Incident reporting procedures',
    ],
  },
  RoHS: {
    name: 'RoHS (Hazardous Substances)',
    items: [
      'Material composition declaration',
      'Lead-free certification',
      'Cadmium-free certification',
      'Mercury-free certification',
      'Supplier declarations',
      'Testing reports (if required)',
      'Exemption documentation (if applicable)',
      'Compliance statement',
    ],
  },
};

export function ComplianceChecklist() {
  const [selectedStandard, setSelectedStandard] = useState<string>('AS9100');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean[]>>({});

  const standard = COMPLIANCE_STANDARDS[selectedStandard];
  const items = standard.items;

  const handleCheck = (index: number) => {
    const key = selectedStandard;
    const current = checkedItems[key] || new Array(items.length).fill(false);
    const updated = [...current];
    updated[index] = !updated[index];
    setCheckedItems({ ...checkedItems, [key]: updated });
  };

  const completedCount = (checkedItems[selectedStandard] || []).filter(Boolean).length;
  const completionPercent = Math.round((completedCount / items.length) * 100);

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Compliance Checklist</h1>
          <p className="text-lg text-muted-foreground">
            Concise compliance requirements by standard
          </p>
        </div>

        {/* Standard Selection */}
        <Card className="p-6 bg-card border border-border mb-8">
          <h3 className="text-lg font-semibold mb-4">Select Compliance Standard</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(COMPLIANCE_STANDARDS).map(([key, standard]) => (
              <Button
                key={key}
                onClick={() => {
                  setSelectedStandard(key);
                }}
                variant={selectedStandard === key ? 'default' : 'outline'}
                className="justify-start"
              >
                {standard.name.split('(')[0].trim()}
              </Button>
            ))}
          </div>
        </Card>

        {/* Checklist */}
        <Card className="p-8 bg-card border border-border">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl font-bold">{standard.name}</h2>
              <span className="text-lg font-semibold text-accent">
                {completedCount}/{items.length} ({completionPercent}%)
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={(checkedItems[selectedStandard] || [])[index] || false}
                  onCheckedChange={() => handleCheck(index)}
                  id={`item-${index}`}
                />
                <label
                  htmlFor={`item-${index}`}
                  className="flex-1 cursor-pointer text-sm"
                >
                  {item}
                </label>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-8">
            <Button className="flex-1">Export Checklist</Button>
            <Button
              variant="outline"
              onClick={() => {
                setCheckedItems({
                  ...checkedItems,
                  [selectedStandard]: new Array(items.length).fill(false),
                });
              }}
            >
              Reset
            </Button>
          </div>
        </Card>

        {/* Benefits */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Card className="p-4 bg-card border border-border">
            <div className="text-2xl font-bold text-accent mb-2">5 standards</div>
            <p className="text-sm text-muted-foreground">AS9100, ISO 9001, ISO 13485, ITAR, RoHS</p>
          </Card>
          <Card className="p-4 bg-card border border-border">
            <div className="text-2xl font-bold text-accent mb-2">Concise</div>
            <p className="text-sm text-muted-foreground">Essential requirements only</p>
          </Card>
          <Card className="p-4 bg-card border border-border">
            <div className="text-2xl font-bold text-accent mb-2">Exportable</div>
            <p className="text-sm text-muted-foreground">Generate compliance reports</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
