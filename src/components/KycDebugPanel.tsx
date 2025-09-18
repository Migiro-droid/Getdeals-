import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWalletKyc } from '../hooks/useWalletKyc';

export function KycDebugPanel() {
  const { kycData, loading } = useWalletKyc();

  if (loading) {
    return <div>Loading KYC data...</div>;
  }

  if (!kycData) {
    return <div>No KYC data found</div>;
  }

  const testDate = (dateValue: any, fieldName: string) => {
    console.log(`${fieldName} raw value:`, dateValue, typeof dateValue);
    
    try {
      const date = new Date(dateValue);
      console.log(`${fieldName} as Date:`, date, 'isValid:', !isNaN(date.getTime()));
      return {
        raw: dateValue,
        type: typeof dateValue,
        asDate: date.toString(),
        isValid: !isNaN(date.getTime()),
        formatted: !isNaN(date.getTime()) ? date.toLocaleString() : 'Invalid Date'
      };
    } catch (error) {
      console.error(`Error parsing ${fieldName}:`, error);
      return {
        raw: dateValue,
        type: typeof dateValue,
        error: error.message,
        formatted: 'Error parsing date'
      };
    }
  };

  const createdAtTest = testDate(kycData.createdAt, 'createdAt');
  const verifiedAtTest = kycData.verifiedAt ? testDate(kycData.verifiedAt, 'verifiedAt') : null;
  const rejectedAtTest = kycData.rejectedAt ? testDate(kycData.rejectedAt, 'rejectedAt') : null;

  return (
    <Card className="mt-4 border-blue-200">
      <CardHeader>
        <CardTitle className="text-sm text-blue-800">🔧 KYC Date Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-xs space-y-2">
          <div className="bg-gray-50 p-2 rounded">
            <strong>Created At:</strong>
            <div>Raw: {JSON.stringify(createdAtTest.raw)}</div>
            <div>Type: {createdAtTest.type}</div>
            <div>Valid: {createdAtTest.isValid ? '✅' : '❌'}</div>
            <div>Formatted: {createdAtTest.formatted}</div>
          </div>

          {verifiedAtTest && (
            <div className="bg-green-50 p-2 rounded">
              <strong>Verified At:</strong>
              <div>Raw: {JSON.stringify(verifiedAtTest.raw)}</div>
              <div>Type: {verifiedAtTest.type}</div>
              <div>Valid: {verifiedAtTest.isValid ? '✅' : '❌'}</div>
              <div>Formatted: {verifiedAtTest.formatted}</div>
            </div>
          )}

          {rejectedAtTest && (
            <div className="bg-red-50 p-2 rounded">
              <strong>Rejected At:</strong>
              <div>Raw: {JSON.stringify(rejectedAtTest.raw)}</div>
              <div>Type: {rejectedAtTest.type}</div>
              <div>Valid: {rejectedAtTest.isValid ? '✅' : '❌'}</div>
              <div>Formatted: {rejectedAtTest.formatted}</div>
            </div>
          )}

          <div className="bg-yellow-50 p-2 rounded">
            <strong>Full KYC Data:</strong>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(kycData, null, 2)}
            </pre>
          </div>
        </div>

        <Button 
          size="sm" 
          variant="outline"
          onClick={() => {
            console.log('Full KYC Data:', kycData);
            console.log('Created At Test:', createdAtTest);
            if (verifiedAtTest) console.log('Verified At Test:', verifiedAtTest);
            if (rejectedAtTest) console.log('Rejected At Test:', rejectedAtTest);
          }}
        >
          Log to Console
        </Button>
      </CardContent>
    </Card>
  );
}

// You can temporarily add this to any page to debug date issues:
// <KycDebugPanel />