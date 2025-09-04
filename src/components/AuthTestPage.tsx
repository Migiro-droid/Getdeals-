import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase, auth } from '../../lib/supabase';
import { AlertTriangle, CheckCircle, User, Mail, Key } from 'lucide-react';

export function AuthTestPage() {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [signupForm, setSignupForm] = useState({
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  });
  const [signinForm, setSigninForm] = useState({
    email: 'test@example.com',
    password: 'password123'
  });
  const { toast } = useToast();

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testSupabaseConnection = async () => {
    try {
      addResult('Testing Supabase connection...');
      const { data, error } = await supabase.from('users').select('count').limit(1);
      
      if (error) {
        addResult(`❌ Connection test failed: ${error.message}`);
        return false;
      } else {
        addResult('✅ Supabase connection successful');
        return true;
      }
    } catch (error) {
      addResult(`❌ Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  const testSignUp = async () => {
    try {
      setLoading(true);
      addResult('Testing user signup...');
      
      const { data, error } = await auth.signUp(
        signupForm.email, 
        signupForm.password, 
        { name: signupForm.name }
      );

      if (error) {
        addResult(`❌ Signup failed: ${error.message}`);
        toast({
          title: "Signup Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        addResult('✅ Signup successful');
        if (data.user) {
          addResult(`User ID: ${data.user.id}`);
          addResult(`Email: ${data.user.email}`);
        }
        toast({
          title: "Signup Successful",
          description: "User created successfully",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addResult(`❌ Signup error: ${message}`);
      toast({
        title: "Signup Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testSignIn = async () => {
    try {
      setLoading(true);
      addResult('Testing user signin...');
      
      const { data, error } = await auth.signIn(signinForm.email, signinForm.password);

      if (error) {
        addResult(`❌ Signin failed: ${error.message}`);
        toast({
          title: "Signin Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        addResult('✅ Signin successful');
        if (data.user) {
          addResult(`User ID: ${data.user.id}`);
          addResult(`Email: ${data.user.email}`);
        }
        toast({
          title: "Signin Successful",
          description: "User signed in successfully",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addResult(`❌ Signin error: ${message}`);
      toast({
        title: "Signin Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testGetSession = async () => {
    try {
      addResult('Testing get session...');
      const { session, user } = await auth.getSession();
      
      if (session && user) {
        addResult('✅ Active session found');
        addResult(`User: ${user.email}`);
        addResult(`Session expires: ${new Date(session.expires_at! * 1000).toLocaleString()}`);
      } else {
        addResult('❌ No active session');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addResult(`❌ Session check error: ${message}`);
    }
  };

  const testSignOut = async () => {
    try {
      addResult('Testing signout...');
      const { error } = await auth.signOut();
      
      if (error) {
        addResult(`❌ Signout failed: ${error.message}`);
      } else {
        addResult('✅ Signout successful');
        toast({
          title: "Signed Out",
          description: "User signed out successfully",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addResult(`❌ Signout error: ${message}`);
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    await testSupabaseConnection();
    await testGetSession();
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Supabase Authentication Test</h1>
          <p className="text-muted-foreground">
            Test authentication functionality and debug any issues
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Authentication Tests
              </CardTitle>
              <CardDescription>
                Run various authentication tests to verify Supabase integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={runAllTests} variant="outline" size="sm">
                  Connection Test
                </Button>
                <Button onClick={testGetSession} variant="outline" size="sm">
                  Check Session
                </Button>
                <Button onClick={testSignOut} variant="outline" size="sm">
                  Sign Out
                </Button>
                <Button onClick={clearResults} variant="outline" size="sm">
                  Clear Results
                </Button>
              </div>

              {/* Signup Form */}
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Test Signup
                </h3>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-name">Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={signupForm.name}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <Button onClick={testSignUp} disabled={loading} className="w-full">
                    {loading ? 'Testing...' : 'Test Signup'}
                  </Button>
                </div>
              </div>

              {/* Signin Form */}
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-semibold flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Test Signin
                </h3>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={signinForm.email}
                      onChange={(e) => setSigninForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={signinForm.password}
                      onChange={(e) => setSigninForm(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                  <Button onClick={testSignIn} disabled={loading} className="w-full">
                    {loading ? 'Testing...' : 'Test Signin'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                Real-time output from authentication tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {testResults.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No test results yet. Run some tests to see output here.
                  </p>
                ) : (
                  testResults.map((result, index) => (
                    <div 
                      key={index} 
                      className={`text-xs p-2 rounded border-l-2 ${
                        result.includes('✅') 
                          ? 'bg-green-50 border-green-500 text-green-800' 
                          : result.includes('❌')
                          ? 'bg-red-50 border-red-500 text-red-800'
                          : 'bg-muted border-muted-foreground/20'
                      }`}
                    >
                      {result}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Setup Instructions:</strong> If tests are failing, you may need to create the database schema first. 
            Run the SQL commands in <code>supabase-schema.sql</code> in your Supabase dashboard under SQL Editor.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
