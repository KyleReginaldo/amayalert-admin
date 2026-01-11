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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react';
import Image from 'next/image';
import type React from 'react';
import { useState } from 'react';
import toast from 'react-hot-toast';
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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
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

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password reset email sent! Check your inbox.');
        setShowForgotPassword(false);
        setResetEmail('');
      }
    } catch (error) {
      toast.error('Failed to send reset email. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  if (fullPage) {
    return (
      <div
        className="relative flex items-center justify-center min-h-screen p-6 overflow-hidden"
        style={{ backgroundColor: '#0F172A' }}
      >
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large gradient circle - top left */}
          <div
            className="absolute rounded-full w-96 h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/10 blur-3xl -top-20 -left-20 animate-pulse"
            style={{ animationDuration: '4s' }}
          />

          {/* Medium gradient circle - bottom right */}
          <div
            className="absolute rounded-full w-80 h-80 bg-gradient-to-tr from-cyan-500/15 to-blue-500/10 blur-2xl -bottom-32 -right-32 animate-pulse"
            style={{ animationDuration: '6s' }}
          />

          {/* Small circle - top right */}
          <div
            className="absolute w-64 h-64 rounded-full bg-gradient-to-bl from-indigo-500/20 to-transparent blur-2xl top-10 right-20 animate-pulse"
            style={{ animationDuration: '5s' }}
          />

          {/* Accent circle - left middle */}
          <div
            className="absolute w-48 h-48 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/5 blur-xl top-1/3 left-10 animate-pulse"
            style={{ animationDuration: '7s' }}
          />

          {/* Small decorative dots */}
          <div
            className="absolute w-32 h-32 rounded-full bg-blue-400/5 blur-lg top-2/3 right-1/4 animate-pulse"
            style={{ animationDuration: '3s' }}
          />
          <div
            className="absolute w-24 h-24 rounded-full bg-cyan-400/5 blur-lg bottom-1/4 left-1/3 animate-pulse"
            style={{ animationDuration: '4.5s' }}
          />
        </div>

        <div className="relative z-10 flex flex-col w-full max-w-6xl overflow-hidden bg-white shadow-2xl rounded-2xl md:flex-row">
          {/* Left - decorative hero */}
          <div className="relative hidden overflow-hidden md:flex md:w-1/2 bg-slate-900">
            <div className="relative w-full h-full">
              <Image src={'/amaya.jpg'} alt="amaya" fill className="object-cover opacity-50" />

              {/* Simple gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-10">
                <div className="max-w-md space-y-3">
                  <h2 className="text-3xl font-bold text-white">Welcome Back</h2>

                  <p className="text-slate-300">
                    Your vigilance keeps communities safe. Sign in to manage alerts and coordinate
                    emergency responses.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right - form */}
          <div className="flex items-center justify-center w-full p-8 md:w-1/2 md:p-12">
            <div className="w-full max-w-md">
              <Card className="w-full bg-transparent border-0 shadow-none">
                <CardHeader className="space-y-1 text-center md:text-left">
                  <CardTitle className="text-2xl font-bold text-foreground">Sign in</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Access the dashboard with your credentials
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                  <CardContent className="mt-2 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-foreground">
                        E-mail Address
                      </Label>
                      <div className="relative">
                        <Shield className="absolute w-4 h-4 left-3 top-3 text-muted-foreground" />
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
                        <Lock className="absolute w-4 h-4 left-3 top-3 text-muted-foreground" />
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
                          className="absolute transition-colors right-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          id="remember"
                          type="checkbox"
                          className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
                        />
                        <Label htmlFor="remember" className="text-sm text-muted-foreground">
                          Keep me signed in
                        </Label>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-col mt-4 space-y-4">
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Signing in...' : 'Sign in'}
                    </Button>
                    <div className="text-xs text-center text-muted-foreground">
                      Don&apos;t have an account? <a className="text-primary">Sign Up!</a>
                    </div>
                  </CardFooter>
                </form>
              </Card>
            </div>
          </div>
        </div>

        {/* Forgot Password Modal */}
        <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Enter your email address and we&apos;ll send you a link to reset your password.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePasswordReset}>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute w-4 h-4 left-3 top-3 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="pl-10"
                      required
                      disabled={isResetting}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForgotPassword(false)}
                  disabled={isResetting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isResetting}>
                  {isResetting ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // default compact card (unchanged)
  return (
    <Card className="w-full border-0 shadow-lg bg-card">
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
              <Shield className="absolute w-4 h-4 left-3 top-3 text-muted-foreground" />
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
              <Lock className="absolute w-4 h-4 left-3 top-3 text-muted-foreground" />
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
                className="absolute transition-colors right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                id="remember"
                type="checkbox"
                className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
              />
              <Label htmlFor="remember" className="text-sm text-muted-foreground">
                Keep me signed in
              </Label>
            </div>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
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

      {/* Forgot Password Modal */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we&apos;ll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordReset}>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email-compact">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute w-4 h-4 left-3 top-3 text-muted-foreground" />
                  <Input
                    id="reset-email-compact"
                    type="email"
                    placeholder="Enter your email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isResetting}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForgotPassword(false)}
                disabled={isResetting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isResetting}>
                {isResetting ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
