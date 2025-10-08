'use client';
import AuthWrapper from '@/app/components/auth-wrapper';
import Dashboard from '../../components/dashboard/dashboard';

const Page = () => {
  return (
    <AuthWrapper>
      <Dashboard />
    </AuthWrapper>
  );
};

export default Page;
