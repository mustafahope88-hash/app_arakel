import api from './api';

export const uploadImage = async (file: File): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/upload/product-image', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      return data.url;
    }
    return null;
  } catch (error) {
    console.error('Upload failed:', error);
    return null;
  }
};

const API_BASE_URL = 'http://localhost:3001';

export const getImageUrl = (url: string | null): string => {
  if (!url) return '/placeholder.png';
  
  // If it's already a full URL, use it
  if (url.startsWith('http')) return url;
  
  // If it's a relative URL from our upload, add the backend URL
  if (url.startsWith('/uploads')) {
    return `${API_BASE_URL}${url}`;
  }
  
  // Default fallback
  return '/placeholder.png';
};