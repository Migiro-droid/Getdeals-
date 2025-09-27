import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { GetDealsNumberCard } from './GetDealsNumberCard';
import { UserProfileCard } from './UserProfileCard';
import { Settings, Hash, User, Database } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <Settings className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">GetDeals Admin Panel</h1>
          <p className="text-gray-600">Manage users, numbers, and system settings</p>
        </div>
      </div>

      <Tabs defaultValue="getdeals-numbers" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="getdeals-numbers" className="flex items-center gap-2">
            <Hash className="w-4 h-4" />
            GetDeals Numbers
          </TabsTrigger>
          <TabsTrigger value="user-profiles" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            User Profiles
          </TabsTrigger>
          <TabsTrigger value="system-info" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            System Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="getdeals-numbers" className="mt-6">
          <GetDealsNumberCard />
        </TabsContent>

        <TabsContent value="user-profiles" className="mt-6">
          <UserProfileCard />
        </TabsContent>

        <TabsContent value="system-info" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Database Status</h3>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Tables:</span>
                        <span className="text-sm font-mono">user_profile, wallets</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Triggers:</span>
                        <span className="text-sm font-mono">generate_getdeals_number_trigger</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Sequences:</span>
                        <span className="text-sm font-mono">getdeals_number_seq</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900">GetDeals Number System</h3>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Format:</span>
                        <span className="text-sm font-mono">GD-XXXXXX</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Starting Number:</span>
                        <span className="text-sm font-mono">100001</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Auto-Assignment:</span>
                        <span className="text-sm text-green-600">Enabled</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900">Migration Status</h3>
                  <div className="mt-2 space-y-2">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-sm font-medium text-blue-800">Required Migrations</div>
                      <div className="text-sm text-blue-700 mt-1">
                        • Apply migrations/20250927_add_getdeals_number_system.sql
                      </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="text-sm font-medium text-yellow-800">Testing Steps</div>
                      <div className="text-sm text-yellow-700 mt-1">
                        • Run test-getdeals-number-system.mjs
                        • Verify number generation and assignment
                        • Test wallet linkage functionality
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};