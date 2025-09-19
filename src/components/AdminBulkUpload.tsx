import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Download, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useProducts } from '@/contexts/ProductsContext';

type CSVRow = {
  name: string;
  price: string;
  originalPrice?: string;
  category: string;
  description?: string;
  items?: string;
  image?: string;
};

type ValidationError = {
  row: number;
  field: string;
  message: string;
};

type UploadResult = {
  success: number;
  failed: number;
  errors: ValidationError[];
};

const VALID_CATEGORIES = [
  'essential',
  'family', 
  'basket',
  'holiday',
  'school',
  'blackfriday',
  'quickmart'
];

export function AdminBulkUpload({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<UploadResult | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [previewErrors, setPreviewErrors] = useState<ValidationError[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { add: addToContext } = useProducts();

  const parseCSV = (csvText: string): CSVRow[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = [];
      let current = '';
      let inQuotes = false;
      
      // Parse CSV line respecting quoted values
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      // Map to object
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      rows.push(row as CSVRow);
    }

    return rows;
  };

  const validateCSVData = (data: CSVRow[]): ValidationError[] => {
    const errors: ValidationError[] = [];

    data.forEach((row, index) => {
      const rowNum = index + 1;

      // Required fields
      if (!row.name?.trim()) {
        errors.push({ row: rowNum, field: 'name', message: 'Product name is required' });
      }

      if (!row.price?.trim()) {
        errors.push({ row: rowNum, field: 'price', message: 'Price is required' });
      } else if (isNaN(Number(row.price))) {
        errors.push({ row: rowNum, field: 'price', message: 'Price must be a valid number' });
      }

      if (!row.category?.trim()) {
        errors.push({ row: rowNum, field: 'category', message: 'Category is required' });
      } else if (!VALID_CATEGORIES.includes(row.category.trim())) {
        errors.push({ 
          row: rowNum, 
          field: 'category', 
          message: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` 
        });
      }

      // Optional field validation
      if (row.originalPrice && isNaN(Number(row.originalPrice))) {
        errors.push({ row: rowNum, field: 'originalPrice', message: 'Original price must be a valid number' });
      }
    });

    return errors;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setResults(null);

    // Parse and preview the file
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const parsed = parseCSV(csvText);
        setCsvData(parsed);
        
        const errors = validateCSVData(parsed);
        setPreviewErrors(errors);
        
        if (errors.length > 0) {
          toast({
            title: "Validation errors found",
            description: `Found ${errors.length} validation error(s) in the CSV file`,
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error parsing CSV",
          description: "Failed to parse the CSV file. Please check the format.",
          variant: "destructive",
        });
        setFile(null);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !csvData.length || previewErrors.length > 0) return;

    setUploading(true);
    setProgress(0);
    
    const results: UploadResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      setProgress((i / csvData.length) * 100);

      try {
        const items = row.items ? 
          row.items.split(/[,;]+/).map(s => s.trim()).filter(Boolean) : 
          [];

        const productData = {
          name: row.name.trim(),
          description: row.description?.trim() || undefined,
          price: Number(row.price),
          originalPrice: row.originalPrice ? Number(row.originalPrice) : undefined,
          category: row.category.trim(),
          image: row.image?.trim() || '/placeholder.svg',
          items,
          itemsDetail: []
        };

        await addToContext(productData);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          field: 'general',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    setProgress(100);
    setResults(results);
    setUploading(false);

    toast({
      title: "Upload completed",
      description: `Successfully uploaded ${results.success} products. ${results.failed} failed.`,
      variant: results.failed > 0 ? "destructive" : "default",
    });
  };

  const downloadTemplate = () => {
    const csvContent = `name,price,originalPrice,category,description,items,image
"Essential Basket - Sample",1500,1800,essential,"Basic essentials for a small household","1kg Rice;500g Sugar;250ml Cooking Oil",/placeholder.svg
"Family Basket - Sample",5000,6200,family,"Full family grocery bundle","5kg Rice;2kg Sugar;1L Cooking Oil;2kg Flour",/placeholder.svg`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Bulk Product Upload
            </CardTitle>
            <CardDescription>
              Upload multiple products using a CSV file
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Template Download */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <h3 className="font-medium">Download CSV Template</h3>
            <p className="text-sm text-muted-foreground">
              Get a sample CSV file with the correct format and example data
            </p>
          </div>
          <Button variant="outline" onClick={downloadTemplate} className="gap-2">
            <Download className="w-4 h-4" />
            Download Template
          </Button>
        </div>

        {/* File Upload */}
        <div className="space-y-4">
          <Label htmlFor="csv-file">Select CSV File</Label>
          <div className="flex items-center gap-4">
            <Input
              ref={fileInputRef}
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Choose CSV File
            </Button>
            {file && (
              <span className="text-sm text-muted-foreground">
                {file.name} ({file.size} bytes)
              </span>
            )}
          </div>
        </div>

        {/* CSV Format Requirements */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>CSV Format Requirements:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• <strong>Required fields:</strong> name, price, category</li>
              <li>• <strong>Optional fields:</strong> originalPrice, description, items, image</li>
              <li>• <strong>Valid categories:</strong> {VALID_CATEGORIES.join(', ')}</li>
              <li>• <strong>Items format:</strong> Separate multiple items with semicolons (;)</li>
              <li>• <strong>Price format:</strong> Numbers only (e.g., 1500, not 1,500)</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Preview Errors */}
        {previewErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Validation Errors Found:</strong>
              <div className="mt-2 max-h-32 overflow-y-auto">
                {previewErrors.slice(0, 10).map((error, index) => (
                  <div key={index} className="text-sm">
                    Row {error.row}, {error.field}: {error.message}
                  </div>
                ))}
                {previewErrors.length > 10 && (
                  <div className="text-sm mt-1">
                    ...and {previewErrors.length - 10} more errors
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Preview Data */}
        {csvData.length > 0 && previewErrors.length === 0 && (
          <div>
            <h3 className="font-medium mb-2">Preview ({csvData.length} products)</h3>
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Price</th>
                      <th className="text-left p-2">Category</th>
                      <th className="text-left p-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 10).map((row, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2 font-medium">{row.name}</td>
                        <td className="p-2">KES {row.price}</td>
                        <td className="p-2">
                          <Badge variant="secondary">{row.category}</Badge>
                        </td>
                        <td className="p-2 text-muted-foreground truncate max-w-48">
                          {row.description || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {csvData.length > 10 && (
                <div className="p-2 text-center text-sm text-muted-foreground bg-muted">
                  ... and {csvData.length - 10} more products
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Uploading products...</span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Upload Results */}
        {results && (
          <Alert variant={results.failed > 0 ? "destructive" : "default"}>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Upload Results:</strong>
              <div className="mt-2">
                <p>✅ Successfully uploaded: {results.success} products</p>
                {results.failed > 0 && (
                  <>
                    <p>❌ Failed: {results.failed} products</p>
                    {results.errors.length > 0 && (
                      <div className="mt-2 max-h-32 overflow-y-auto">
                        {results.errors.slice(0, 5).map((error, index) => (
                          <div key={index} className="text-sm">
                            Row {error.row}: {error.message}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || csvData.length === 0 || previewErrors.length > 0 || uploading}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : `Upload ${csvData.length} Products`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}