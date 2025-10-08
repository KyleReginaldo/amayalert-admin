'use client';

import type React from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock, Shield } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../client/supabase';
import { useAlert } from './alert-context';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const alert = useAlert();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('Admin login attempt:', { email, password });
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      alert.showAlert({ title: 'Sign in failed', message: error.message, variant: 'error' });
    } else {
      window.location.href = '/';
    }
    setIsLoading(false);
  };

  return (
    <Card className="w-full shadow-lg border-0 bg-card">
      <CardHeader className="space-y-1 text-center">
        <div className="flex items-center justify-center mb-2">
          <Shield className="h-8 w-8 text-primary mr-2" />
        </div>
        <CardTitle className="text-2xl font-bold text-card-foreground">Sign In</CardTitle>
        <CardDescription className="text-muted-foreground">
          Access the dashboard with your credentials
        </CardDescription>
      </CardHeader>
      {/* Alert is handled globally via AlertProvider / TopRightDialog */}
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-card-foreground">
              Admin Email
            </Label>
            <div className="relative">
              <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-input border-border focus:ring-2 focus:ring-ring focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-card-foreground">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-input border-border focus:ring-2 focus:ring-ring focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
              />
              <Label htmlFor="remember" className="text-sm text-muted-foreground">
                Keep me signed in
              </Label>
            </div>
            <button
              type="button"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Need help?
            </button>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 mt-[16px]">
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Access Dashboard'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
