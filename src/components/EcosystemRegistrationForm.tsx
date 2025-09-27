import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Hash, User, Mail, Phone, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { validateOrganizationFields, formatOrganizationNumber } from '@/utils/organizationValidation';

interface EcosystemRegistrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EcosystemRegistrationForm({ onSuccess, onCancel }: EcosystemRegistrationFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    organization: '',
    organizationNumber: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { signUp } = useAuth();
  const { toast } = useToast();

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'firstName':
      case 'lastName':
        return value.trim().length < 2 ? 'Must be at least 2 characters' : '';
      
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Please enter a valid email address' : '';
      
      case 'phone':
        const phoneRegex = /^\+?[1-9]\d{8,14}$/;
        return !phoneRegex.test(value.replace(/\s/g, '')) ? 'Please enter a valid phone number' : '';
      
      case 'password':
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return 'Password must contain uppercase, lowercase, and number';
        }
        return '';
      
      case 'confirmPassword':
        return value !== formData.password ? 'Passwords do not match' : '';
      
      case 'organization':
        return value.trim().length < 2 ? 'Organization name is required for ecosystem users' : '';
      
      case 'organizationNumber':
        if (!value.trim()) return 'Organization number is required for ecosystem users';
        const validation = validateOrganizationFields(formData.organization, value);
        return validation.isValid ? '' : validation.error || 'Invalid organization number';
      
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) newErrors[key] = error;
    });

    // Additional organization validation
    const orgValidation = validateOrganizationFields(formData.organization, formData.organizationNumber);
    if (!orgValidation.isValid) {
      newErrors.organizationNumber = orgValidation.error || 'Invalid organization details';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors below",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await signUp(
        `${formData.firstName} ${formData.lastName}`,
        formData.phone,
        formData.email,
        formData.password,
        formData.organization,
        formData.organizationNumber
      );
      
      toast({
        title: "Ecosystem Account Created!",
        description: "Welcome to GetDeals Kenya ecosystem. Please verify your email to complete registration.",
      });
      
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || 'Failed to create account',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFieldValid = (field: string) => {
    return formData[field as keyof typeof formData] && !errors[field];
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Building2 className="h-6 w-6 text-primary" />
          <Badge variant="secondary" className="text-sm">Ecosystem Registration</Badge>
        </div>
        <CardTitle className="text-2xl">Join GetDeals Kenya Ecosystem</CardTitle>
        <p className="text-muted-foreground">
          Create your business account to access our ecosystem of services and opportunities
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  First Name *
                  {isFieldValid('firstName') && <CheckCircle2 className="inline h-4 w-4 text-green-500 ml-1" />}
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.firstName ? 'border-red-500' : ''}
                  required
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.firstName}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">
                  Last Name *
                  {isFieldValid('lastName') && <CheckCircle2 className="inline h-4 w-4 text-green-500 ml-1" />}
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.lastName ? 'border-red-500' : ''}
                  required
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">
                Email Address *
                {isFieldValid('email') && <CheckCircle2 className="inline h-4 w-4 text-green-500 ml-1" />}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.email ? 'border-red-500 pl-10' : 'pl-10'}
                  required
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number *
                {isFieldValid('phone') && <CheckCircle2 className="inline h-4 w-4 text-green-500 ml-1" />}
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+254 728 322 355"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.phone ? 'border-red-500 pl-10' : 'pl-10'}
                  required
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.phone}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Organization Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Organization Information</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="organization">
                Organization Name *
                {isFieldValid('organization') && <CheckCircle2 className="inline h-4 w-4 text-green-500 ml-1" />}
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="organization"
                  name="organization"
                  type="text"
                  placeholder="Your Company Ltd"
                  value={formData.organization}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.organization ? 'border-red-500 pl-10' : 'pl-10'}
                  required
                />
              </div>
              {errors.organization && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.organization}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="organizationNumber">
                Organization Number *
                {isFieldValid('organizationNumber') && <CheckCircle2 className="inline h-4 w-4 text-green-500 ml-1" />}
              </Label>
              <div className="relative">
                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="organizationNumber"
                  name="organizationNumber"
                  type="text"
                  placeholder="REG123456789, KRA123456789, or VAT123456789"
                  value={formData.organizationNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.organizationNumber ? 'border-red-500 pl-10' : 'pl-10'}
                  required
                />
              </div>
              {errors.organizationNumber && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.organizationNumber}
                </p>
              )}
              {formData.organizationNumber && !errors.organizationNumber && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Formatted: {formatOrganizationNumber(formData.organizationNumber)}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Security Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">Security</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">
                Password *
                {isFieldValid('password') && <CheckCircle2 className="inline h-4 w-4 text-green-500 ml-1" />}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.password ? 'border-red-500 pl-10 pr-10' : 'pl-10 pr-10'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-primary"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm Password *
                {isFieldValid('confirmPassword') && <CheckCircle2 className="inline h-4 w-4 text-green-500 ml-1" />}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.confirmPassword ? 'border-red-500 pl-10 pr-10' : 'pl-10 pr-10'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-primary"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <Building2 className="h-4 w-4 mr-2" />
                  Join Ecosystem
                </>
              )}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}