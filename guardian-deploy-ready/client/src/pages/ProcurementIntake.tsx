import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function ProcurementIntake() {
  const [formData, setFormData] = useState({
    partNumber: '',
    partName: '',
    material: '',
    quantity: '',
    dimensions: '',
    tolerances: '',
    surface: '',
    specialRequirements: '',
    leadTime: '',
    budget: '',
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    console.log('Procurement intake submitted:', formData);
    alert('Procurement intake submitted. Procurement team will review specifications.');
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Procurement Intake Form</h1>
          <p className="text-lg text-muted-foreground">
            Engineering specifications for material sourcing
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="p-4 bg-card border border-border">
            <h3 className="font-semibold mb-2">Engineering → Procurement</h3>
            <p className="text-sm text-muted-foreground">
              Complete specifications so Procurement can source materials efficiently
            </p>
          </Card>
          <Card className="p-4 bg-card border border-border">
            <h3 className="font-semibold mb-2">Time Saved</h3>
            <p className="text-sm text-muted-foreground">
              Clear intake reduces procurement cycle by 2-3 days
            </p>
          </Card>
        </div>

        {/* Form */}
        <Card className="p-8 bg-card border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Part Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Part Information</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Part Number</label>
                  <Input
                    name="partNumber"
                    value={formData.partNumber}
                    onChange={handleChange}
                    placeholder="e.g., PT-001-A"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Part Name</label>
                  <Input
                    name="partName"
                    value={formData.partName}
                    onChange={handleChange}
                    placeholder="e.g., Machinist's Jack Base"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Material Specifications */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Material Specifications</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Material</label>
                  <Input
                    name="material"
                    value={formData.material}
                    onChange={handleChange}
                    placeholder="e.g., Aluminum 6061-T6, Steel 1018"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Quantity Required</label>
                  <Input
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="e.g., 100 pieces"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Dimensional Requirements */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Dimensional Requirements</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Dimensions (L × W × H)</label>
                  <Input
                    name="dimensions"
                    value={formData.dimensions}
                    onChange={handleChange}
                    placeholder="e.g., 50mm × 30mm × 25mm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tolerances</label>
                  <Input
                    name="tolerances"
                    value={formData.tolerances}
                    onChange={handleChange}
                    placeholder="e.g., ±0.05mm on critical dimensions"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Surface Finish</label>
                  <Input
                    name="surface"
                    value={formData.surface}
                    onChange={handleChange}
                    placeholder="e.g., Anodized, Polished, Painted"
                  />
                </div>
              </div>
            </div>

            {/* Special Requirements */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Special Requirements</h3>
              <Textarea
                name="specialRequirements"
                value={formData.specialRequirements}
                onChange={handleChange}
                placeholder="Certifications needed, compliance standards, special handling, etc."
                rows={4}
              />
            </div>

            {/* Timeline & Budget */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Timeline & Budget</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Required Lead Time</label>
                  <Input
                    name="leadTime"
                    value={formData.leadTime}
                    onChange={handleChange}
                    placeholder="e.g., 5 days, 2 weeks"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Budget per Unit</label>
                  <Input
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    placeholder="e.g., $50, $100"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <Button type="submit" className="flex-1">
                Submit to Procurement
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData({
                  partNumber: '',
                  partName: '',
                  material: '',
                  quantity: '',
                  dimensions: '',
                  tolerances: '',
                  surface: '',
                  specialRequirements: '',
                  leadTime: '',
                  budget: '',
                })}
              >
                Clear Form
              </Button>
            </div>
          </form>
        </Card>

        {/* Benefits */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Card className="p-4 bg-card border border-border">
            <div className="text-2xl font-bold text-accent mb-2">2-3 days</div>
            <p className="text-sm text-muted-foreground">Faster procurement cycle</p>
          </Card>
          <Card className="p-4 bg-card border border-border">
            <div className="text-2xl font-bold text-accent mb-2">100%</div>
            <p className="text-sm text-muted-foreground">Specification clarity</p>
          </Card>
          <Card className="p-4 bg-card border border-border">
            <div className="text-2xl font-bold text-accent mb-2">0 rework</div>
            <p className="text-sm text-muted-foreground">Wrong material orders</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
