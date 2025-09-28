import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, Trash2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUploadService } from '@/services/imageUpload';
import { useAuth } from '@/contexts/AuthContext';

interface ProfilePictureUploadProps {
  currentImageUrl?: string;
  onImageUpdate: (imageUrl: string | null) => void;
  userInitials?: string;
}

export const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentImageUrl,
  onImageUpdate,
  userInitials = 'U'
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    
    try {
      // Create a preview URL immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewUrl(result);
      };
      reader.readAsDataURL(file);

      // In a real application, you would upload to your storage service
      // For now, we'll simulate an upload and use the preview URL
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate upload delay
      
      // For demonstration, we'll use the file reader result
      // In production, this would be the URL returned from your storage service
      const reader2 = new FileReader();
      reader2.onload = (e) => {
        const result = e.target?.result as string;
        onImageUpdate(result);
        toast({
          title: "Profile Picture Updated",
          description: "Your profile picture has been successfully updated.",
        });
      };
      reader2.readAsDataURL(file);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload your profile picture. Please try again.",
        variant: "destructive",
      });
      setPreviewUrl(currentImageUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageUpdate(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: "Profile Picture Removed",
      description: "Your profile picture has been removed.",
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Avatar Display */}
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src={previewUrl || undefined} alt="Profile picture" />
              <AvatarFallback className="text-2xl">
                <User className="w-8 h-8" />
              </AvatarFallback>
            </Avatar>
            
            {/* Camera overlay for upload */}
            <Button
              variant="secondary"
              size="sm"
              className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
              onClick={triggerFileInput}
              disabled={uploading}
            >
              <Camera className="w-4 h-4" />
            </Button>
          </div>

          {/* Upload Status */}
          {uploading && (
            <div className="text-sm text-muted-foreground">
              Uploading your picture...
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={triggerFileInput}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {previewUrl ? 'Change' : 'Upload'}
            </Button>
            
            {previewUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveImage}
                disabled={uploading}
                className="flex items-center gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </Button>
            )}
          </div>

          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Help Text */}
          <div className="text-xs text-muted-foreground text-center">
            <p>Upload a profile picture (JPG, PNG, GIF)</p>
            <p>Maximum file size: 5MB</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};