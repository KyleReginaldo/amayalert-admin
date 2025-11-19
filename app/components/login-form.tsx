'use client';

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
import Image from 'next/image';
import type React from 'react';
import { useState } from 'react';
import { supabase } from '../client/supabase';
import { useAlert } from './alert-context';

interface LoginFormProps {
  fullPage?: boolean;
}

export function LoginForm({ fullPage = false }: LoginFormProps) {
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

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-6xl bg-white rounded-2xl overflow-hidden shadow-md flex flex-col md:flex-row">
          {/* Left - decorative hero */}
          <div className="hidden md:block md:w-1/2 bg-gray-50">
            <div className="h-full w-full relative">
              <Image src={'/amaya.jpg'} alt="amaya" fill className="object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-transparent w-full py-4 px-6">
                <p className="text-white">Amaya V</p>
              </div>
            </div>
          </div>

          {/* Right - form */}
          <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-12">
            <div className="w-full max-w-md">
              <Card className="w-full shadow-none border-0 bg-transparent">
                <CardHeader className="space-y-1 text-center md:text-left">
                  <CardTitle className="text-2xl font-bold text-foreground">Sign in</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Access the dashboard with your credentials
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-4 mt-2">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-foreground">
                        E-mail Address
                      </Label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 bg-input border-border focus:ring-2 focus:ring-ring focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-foreground">
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
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
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
                      <div />
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-col space-y-4 mt-4">
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Signing in...' : 'Sign in'}
                    </Button>
                    <div className="text-center text-xs text-muted-foreground">
                      Don&apos;t have an account? <a className="text-primary">Sign Up!</a>
                    </div>
                  </CardFooter>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // default compact card (unchanged)
  return (
    <Card className="w-full shadow-lg border-0 bg-card">
      <CardHeader className="space-y-1 text-center">
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
              Email
            </Label>
            <div className="relative">
              <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
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
