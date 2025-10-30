'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CheckCircle, Clock, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useState } from 'react';

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    inquiryType: 'general',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'contact-form',
          ...formData,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setIsSubmitted(true);

        // Reset form after 3 seconds
        setTimeout(() => {
          setIsSubmitted(false);
          setFormData({
            name: '',
            email: '',
            subject: '',
            message: '',
            inquiryType: 'general',
          });
        }, 3000);
      } else {
        setSubmitError(result.error || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Contact Us</h1>
          <p className="text-gray-600">Get in touch with Amayalert for support or inquiries</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-4">
            {/* Emergency Notice */}
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center mb-3">
                  <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                  <h3 className="text-sm font-medium text-red-800">Emergency</h3>
                </div>
                <p className="text-sm text-red-700 mb-2">For life-threatening emergencies:</p>
                <p className="text-lg font-semibold text-red-900">📞 911 / 117</p>
                <p className="text-xs text-red-600 mt-2">
                  Use form below for non-emergency inquiries
                </p>
              </CardContent>
            </Card>

            {/* Contact Methods */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-gray-800 mb-3">Contact Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-gray-600">amayalert.site@gmail.com</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-gray-600">+63 (46) 481-2345</p>
                      <p className="text-xs text-gray-500">Mon-Fri, 8AM-6PM</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div className="text-gray-600">
                      <p>Brgy. Bagbag, Tanza, Cavite</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Hours */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center mb-3">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <h3 className="text-sm font-medium text-gray-800">Business Hours</h3>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Mon-Fri: 7AM - 7PM</p>
                  <p>Saturday: 8AM - 4PM</p>
                  <p>Sunday: Emergency only</p>
                  <p className="text-xs text-gray-500 mt-2">Emergency services: 24/7</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-gray-800 flex items-center">
                  <Send className="h-4 w-4 mr-2 text-blue-600" />
                  Send a Message
                </CardTitle>
                <p className="text-sm text-gray-600">We&apos;ll respond within 1-2 business days</p>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {isSubmitted ? (
                  <div className="text-center py-8 bg-green-50 rounded">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-green-800 mb-2">Message Sent!</h3>
                    <p className="text-sm text-gray-600">
                      Thank you for contacting us. We&apos;ll respond within 1-2 business days.
                    </p>
                  </div>
                ) : (
                  <div>
                    {submitError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm">
                        <div className="flex items-center">
                          <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                          <p className="text-red-700">{submitError}</p>
                        </div>
                      </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Inquiry Type */}
                      <div>
                        <Label htmlFor="inquiryType" className="text-sm font-medium text-gray-700">
                          Inquiry Type
                        </Label>
                        <select
                          id="inquiryType"
                          name="inquiryType"
                          value={formData.inquiryType}
                          onChange={handleInputChange}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          required
                        >
                          <option value="general">General Inquiry</option>
                          <option value="technical">Technical Support</option>
                          <option value="partnership">Partnership</option>
                          <option value="feedback">Feedback</option>
                          <option value="emergency">Emergency Service Issue</option>
                          <option value="privacy">Privacy Concern</option>
                        </select>
                      </div>

                      {/* Name and Email Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                            Full Name *
                          </Label>
                          <Input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Your full name"
                            required
                            disabled={isSubmitting}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                            Email Address *
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="your.email@example.com"
                            required
                            disabled={isSubmitting}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      {/* Subject */}
                      <div>
                        <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
                          Subject *
                        </Label>
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          value={formData.subject}
                          onChange={handleInputChange}
                          placeholder="Brief description of your inquiry"
                          required
                          disabled={isSubmitting}
                          className="mt-1"
                        />
                      </div>

                      {/* Message */}
                      <div>
                        <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                          Message *
                        </Label>
                        <Textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          placeholder="Please provide details about your inquiry"
                          required
                          disabled={isSubmitting}
                          rows={4}
                          className="mt-1 resize-none"
                        />
                      </div>

                      {/* Submit Button */}
                      <div className="pt-2">
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Send Message
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
