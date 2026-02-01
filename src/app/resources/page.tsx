"use client";

import { useQuery } from "@tanstack/react-query";

interface Resource {
  id: string;
  title: string;
  url: string;
  category: string;
}

export default function ResourcesPage() {
  const { data: resources, isLoading } = useQuery({
    queryKey: ["resources"],
    queryFn: () => fetch("/api/resources").then((r) => r.json()),
  });

  if (isLoading) return <div className="py-12">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Resources</h1>
      <p className="text-slate-600">
        DAU and FAR reference materials for study.
      </p>
      <ul className="space-y-3">
        {(resources as Resource[] || []).map((r) => (
          <li key={r.id} className="bg-white rounded-lg shadow p-4">
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline font-medium"
            >
              {r.title}
            </a>
            <p className="text-sm text-slate-500 mt-1">{r.url}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
