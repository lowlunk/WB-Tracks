import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";

interface ComponentIconProps {
  componentId: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function ComponentIcon({ 
  componentId, 
  size = "md", 
  className = "" 
}: ComponentIconProps) {
  const [imageError, setImageError] = useState(false);

  // Fetch component photos
  const { data: photos = [] } = useQuery({
    queryKey: ["/api/components", componentId, "photos"],
    queryFn: async () => {
      const response = await fetch(`/api/components/${componentId}/photos`);
      if (!response.ok) {
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Find primary photo
  const primaryPhoto = photos.find((photo: any) => photo.isPrimary) || photos[0];

  // Size classes
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10", 
    lg: "w-16 h-16"
  };

  const iconSizeClasses = {
    sm: "h-3 w-3",
    md: "h-5 w-5",
    lg: "h-8 w-8"
  };

  if (primaryPhoto && !imageError) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden relative ${className}`}>
        <img
          src={primaryPhoto.imageUrl}
          alt="Component"
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Fallback to Package icon
  return (
    <div className={`${sizeClasses[size]} bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center relative ${className}`}>
      <Package className={`${iconSizeClasses[size]} text-gray-500`} />
    </div>
  );
}