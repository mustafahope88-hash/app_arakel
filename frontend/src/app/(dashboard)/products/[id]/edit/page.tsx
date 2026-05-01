'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { uploadImage, getImageUrl } from '@/lib/upload';

interface Category {
  id: number;
  name: string;
}

interface ProductForm {
  name: string;
  barcode: string;
  costPrice: string;
  salePrice: string;
  stockQuantity: string;
  minStock: string;
  categoryId: string;
  imageUrl: string;
}

export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id ? Number(params.id) : null;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<ProductForm>({
    name: '',
    barcode: '',
    costPrice: '',
    salePrice: '',
    stockQuantity: '0',
    minStock: '0',
    categoryId: '',
    imageUrl: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!productId) return;
      
      try {
        const { data: catData } = await api.get('/categories');
        if (catData.success) {
          setCategories(catData.categories);
        }

        const { data: prodData } = await api.get(`/products/${productId}`);
        if (prodData.success) {
          const p = prodData.product;
          setFormData({
            name: p.name,
            barcode: p.barcode || '',
            costPrice: String(p.costPrice),
            salePrice: String(p.salePrice),
            stockQuantity: String(p.stockQuantity),
            minStock: String(p.minStock),
            categoryId: p.category?.id ? String(p.category.id) : '',
            imageUrl: p.imageUrl || '',
          });
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };

    fetchData();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;
    
    setError('');
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        barcode: formData.barcode || null,
        costPrice: Number(formData.costPrice) || 0,
        salePrice: Number(formData.salePrice) || 0,
        stockQuantity: Number(formData.stockQuantity) || 0,
        minStock: Number(formData.minStock) || 0,
        categoryId: formData.categoryId ? Number(formData.categoryId) : null,
        imageUrl: formData.imageUrl || null,
      };

      const { data } = await api.put(`/products/${productId}`, payload);
      if (data.success) {
        router.push('/products');
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          تعديل منتج
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="card space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم المنتج *
              </label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="اسم المنتج"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الباركود
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="باركود اختياري"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  التصنيف
                </label>
                <select
                  className="input"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                >
                  <option value="">اختر التصنيف</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  سعر التكلفة
                </label>
                <input
                  type="number"
                  className="input"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  سعر البيع *
                </label>
                <input
                  type="number"
                  className="input"
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المخزون الحالي
                </label>
                <input
                  type="number"
                  className="input"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الحد الأدنى للمخزون
                </label>
                <input
                  type="number"
                  className="input"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                صورة المنتج
              </label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="input"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  setUploading(true);
                  const url = await uploadImage(file);
                  if (url) {
                    setFormData({ ...formData, imageUrl: url });
                  } else {
                    setError('فشل رفع الصورة');
                  }
                  setUploading(false);
                }}
                disabled={uploading}
              />
              {uploading && <p className="text-sm text-gray-500 mt-1">جاري الرفع...</p>}
              {formData.imageUrl && !formData.imageUrl.startsWith('http') && (
                <div className="mt-2">
                  <img
                    src={getImageUrl(formData.imageUrl)}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-lg border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push('/products')}
                className="flex-1 btn bg-gray-100 text-gray-700"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn btn-primary disabled:opacity-50"
              >
                {loading ? 'جاري...' : 'حفظ'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}