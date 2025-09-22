'use client';

import { LayoutDashboard, MapPinHouse, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar = () => {
  const pathname = usePathname();

  // Hide the sidebar on authentication routes like /signin
  if (pathname?.startsWith('/signin')) return null;

  return (
    <div className="bg-[#3396D3] h-screen py-8 pl-4 pr-10 text-white">
      <ul className="flex flex-col gap-[16px]">
        <li>
          <Link href="/" className="flex gap-[8px] items-center">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
        </li>
        <li>
          <Link href="/alert" className="flex gap-[8px] items-center">
            <TriangleAlert size={18} />
            <span>Alert</span>
          </Link>
        </li>
        <li>
          <Link href="/evacuation" className="flex gap-[8px] items-center">
            <MapPinHouse size={18} />
            <span>Evacuation</span>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
