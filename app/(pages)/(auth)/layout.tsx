export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This is a nested layout inside `app/layout.tsx`.
  // Don't render <html> or <body> here because the root layout already does.
  return <>{children}</>;
}
