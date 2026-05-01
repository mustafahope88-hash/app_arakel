'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { 
  Box, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Typography, 
  Alert,
  Avatar,
  Container
} from '@mui/material';
import { LockOutlined as LockIcon } from '@mui/icons-material';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username.trim() || !password) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      setLoading(false);
      return;
    }

    const success = await login(username, password);
    
    if (success) {
      router.push('/dashboard');
    } else {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة');
    }
    
    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorative elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '40%',
          height: '40%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '40%',
          height: '40%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 2,
              bgcolor: 'white',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }}
          >
            <img src="/logo.jpeg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </Avatar>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white', mb: 1 }}>
            محل الأراكيل
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            نظام إدارة المحل
          </Typography>
        </Box>

        <Card
          sx={{
            backdropFilter: 'blur(20px)',
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            borderRadius: 4,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Avatar
                sx={{
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  width: 56,
                  height: 56,
                }}
              >
                <LockIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                تسجيل الدخول
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
              <TextField
                fullWidth
                label="اسم المستخدم"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                type="password"
                label="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                sx={{ mb: 3 }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #6a4293 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                  },
                  transition: 'all 0.3s',
                }}
              >
                {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}