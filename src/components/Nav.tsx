"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/learn", label: "Learn" },
  { href: "/bank", label: "Question Bank" },
  { href: "/flashcards", label: "Flashcards" },
  { href: "/review", label: "Wrong Answers" },
  { href: "/bookmarks", label: "Bookmarks" },
  { href: "/exam", label: "Exam" },
  { href: "/topics", label: "Topics" },
  { href: "/resources", label: "Resources" },
  { href: "/settings", label: "Settings" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="bg-primary-700 text-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="font-bold text-lg">
            Back2Basics Learn
          </Link>
          <div className="flex gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded hover:bg-primary-600 ${
                  pathname === link.href ? "bg-primary-600" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
