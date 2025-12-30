import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  variant?: 'default' | 'paper';
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, variant = 'default' }) => {
  const isPaper = variant === 'paper';
  // If paper (white background), force dark text. Otherwise use theme colors.
  const textPrimary = isPaper ? "text-gray-900 dark:text-gray-100" : "text-forge-text";
  const textSecondary = isPaper ? "text-gray-600 dark:text-gray-400" : "text-forge-muted";
  const textAccent = isPaper ? "text-orange-600 dark:text-orange-400" : "text-forge-accent";
  const headingBorder = isPaper ? "border-gray-200 dark:border-gray-700" : "border-forge-700";

  return (
    // If paper, removing 'prose-slate' and just using 'prose' with manual overrides or 'prose-stone' might be cleaner, 
    // but applying classes directly to elements as done below is safest.
    <div className={`prose max-w-none ${isPaper ? 'prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-700 dark:prose-p:text-gray-300' : 'prose-slate'}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => <h1 className={`text-3xl font-bold ${textPrimary} mb-6 ${headingBorder} pb-4`} {...props} />,
          h2: ({ node, ...props }) => <h2 className={`text-2xl font-semibold ${textPrimary} mt-10 mb-4`} {...props} />,
          h3: ({ node, ...props }) => <h3 className={`text-xl font-medium ${textAccent} mt-8 mb-3`} {...props} />,
          ul: ({ node, ...props }) => <ul className={`list-disc pl-6 space-y-2 mb-6 ${textSecondary}`} {...props} />,
          ol: ({ node, ...props }) => <ol className={`list-decimal pl-6 space-y-2 mb-6 ${textSecondary}`} {...props} />,
          li: ({ node, ...props }) => <li className="pl-2 leading-relaxed" {...props} />,
          p: ({ node, ...props }) => <p className={`mb-6 leading-7 ${textSecondary}`} {...props} />,
          strong: ({ node, ...props }) => <strong className={`font-bold ${textPrimary}`} {...props} />,
          code: ({ node, ...props }) => (
            <code className={`${isPaper ? 'bg-gray-100 border-gray-200 text-orange-700 dark:bg-gray-800 dark:border-gray-700 dark:text-orange-400' : 'bg-forge-800 border-forge-700 text-forge-accent'} border px-1.5 py-0.5 rounded font-mono text-sm`} {...props} />
          ),
          pre: ({ node, ...props }) => (
            <pre className={`${isPaper ? 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-slate-900 dark:border-gray-700 dark:text-gray-300' : 'bg-forge-900 border-forge-700 text-forge-muted'} p-4 rounded-lg overflow-x-auto border my-6 shadow-sm`} {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className={`border-l-4 ${isPaper ? 'border-orange-500 bg-orange-50 text-gray-600 dark:bg-orange-900/20 dark:text-gray-400' : 'border-forge-accent bg-forge-800/50 text-forge-muted'} pl-4 italic my-6 py-3 rounded-r`} {...props} />
          ),
          a: ({ node, ...props }) => <a className={`${textAccent} hover:underline underline-offset-4 transition-all`} {...props} />,
          hr: ({ node, ...props }) => <hr className={`${headingBorder} my-8`} {...props} />,
          // Table styles
          table: ({ node, ...props }) => (
            <div className={`overflow-x-auto my-8 border ${headingBorder} rounded-lg shadow-sm`}>
              <table className={`min-w-full divide-y ${isPaper ? 'divide-gray-200 dark:divide-gray-700' : 'divide-forge-700'}`} {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className={isPaper ? 'bg-gray-50' : 'bg-forge-800'} {...props} />,
          tbody: ({ node, ...props }) => <tbody className={`divide-y ${isPaper ? 'bg-white divide-gray-200' : 'bg-transparent divide-forge-700'}`} {...props} />,
          tr: ({ node, ...props }) => <tr className={`transition-colors ${isPaper ? 'hover:bg-gray-50' : 'hover:bg-white/5'}`} {...props} />,
          th: ({ node, ...props }) => (
            <th className={`px-6 py-3 text-left text-xs font-medium ${isPaper ? 'text-gray-500 dark:text-gray-400' : 'text-forge-500'} uppercase tracking-wider`} {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className={`px-6 py-4 whitespace-nowrap text-sm ${textSecondary}`} {...props} />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};