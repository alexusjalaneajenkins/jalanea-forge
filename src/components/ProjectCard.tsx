'use client';

import React from 'react';
import { ExternalLink, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Badge } from './Badge';
import type { LabStatus, ClientStatus, DevStatus, ToolCategory } from '@/lib/types';

interface ProjectCardProps {
  title: string;
  description: string;
  status?: LabStatus | ClientStatus | DevStatus;
  category?: ToolCategory;
  url?: string;
  date?: string;
  icon?: React.ReactNode;
  metadata?: { label: string; value: string }[];
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ProjectCard({
  title,
  description,
  status,
  category,
  url,
  date,
  icon,
  metadata,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <div className="group relative bg-lab-card border border-lab-border rounded-xl p-4 hover:border-lab-accent/30 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 min-w-0">
          {icon && (
            <div className="p-2 bg-lab-border rounded-lg shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-semibold text-lab-text truncate">{title}</h3>
            {date && (
              <p className="text-xs text-lab-muted-dark mt-0.5">{date}</p>
            )}
          </div>
        </div>

        {/* Actions menu */}
        {(onEdit || onDelete) && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-lab-border text-lab-muted hover:text-lab-text transition-all"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 w-36 bg-lab-card border border-lab-border rounded-lg shadow-lg py-1 animate-fade-in">
                  {onEdit && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEdit();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-lab-muted hover:bg-lab-border hover:text-lab-text transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDelete();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-lab-muted line-clamp-2 mb-3">{description}</p>

      {/* Metadata */}
      {metadata && metadata.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-xs">
          {metadata.map((item, index) => (
            <div key={index} className="flex items-center gap-1">
              <span className="text-lab-muted-dark">{item.label}:</span>
              <span className="text-lab-muted">{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {status && <Badge variant={status}>{status}</Badge>}
          {category && <Badge variant={category}>{category}</Badge>}
        </div>

        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-lab-accent hover:underline"
          >
            <span>Open</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}
