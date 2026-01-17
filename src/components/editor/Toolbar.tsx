import { type Editor } from '@tiptap/react';
import { useState, useEffect } from 'react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Undo,
  Redo,
  Table as TableIcon,
  Pilcrow,
  RemoveFormatting,
  Download,
  FileText
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { exportToPdf, exportToDocx } from '@/utils/exportUtils';

interface ToolbarProps {
  editor: Editor | null;
}

export function Toolbar({ editor }: ToolbarProps) {
  const [, forceUpdate] = useState(0);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => forceUpdate((prev) => prev + 1);

    editor.on('transaction', handleUpdate);
    editor.on('selectionUpdate', handleUpdate);

    return () => {
      editor.off('transaction', handleUpdate);
      editor.off('selectionUpdate', handleUpdate);
    };
  }, [editor]);


  useEffect(() => {
    const handleClickOutside = () => setShowExportMenu(false);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  if (!editor) return null;

  const Button = ({
    onClick,
    isActive,
    disabled,
    children,
    title,
    variant = 'default'
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
    variant?: 'default' | 'segmented';
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-2 rounded flex items-center justify-center cursor-pointer",
        "transition-colors duration-75",
        
        variant === 'default' && [
           "hover:bg-gray-200 hover:shadow-sm",
           isActive 
             ? "bg-blue-100 text-blue-700 font-medium shadow-inner" 
             : "text-gray-700 hover:text-gray-900",
           disabled && "opacity-40 cursor-not-allowed hover:bg-transparent hover:shadow-none"
        ],

        variant === 'segmented' && [
          "text-sm h-8 w-8 p-1",
          isActive 
            ? "bg-white text-blue-600 shadow-sm rounded-md ring-1 ring-gray-200 transition-all duration-100"
            : "text-gray-600 hover:bg-gray-200/50 hover:text-gray-900",
          disabled && "opacity-40"
        ]
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm p-2 flex gap-2 sticky top-0 z-50 flex-wrap items-center shadow-sm">
      
      <div className="bg-gray-100 p-1 rounded-lg flex gap-0.5 border border-gray-200 mr-2">
         <Button
            onClick={() => editor.chain().focus().setParagraph().run()}
            isActive={editor.isActive('paragraph')}
            title="Normal Text"
            variant="segmented"
        >
            <Pilcrow size={16} />
        </Button>
        <Button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
            variant="segmented"
        >
            <Heading1 size={16} />
        </Button>
        <Button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
            variant="segmented"
        >
            <Heading2 size={16} />
        </Button>
      </div>

      <div className="flex gap-1 border-r border-gray-300 pr-2 mr-1">
        <Button
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          title="Bold (Cmd+B)"
        >
          <Bold size={18} />
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          title="Italic (Cmd+I)"
        >
          <Italic size={18} />
        </Button>
        <Button
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            title="Clear Formatting"
        >
            <RemoveFormatting size={18} />
        </Button>
      </div>

      <div className="flex gap-1 border-r border-gray-300 pr-2 mr-1">
        <Button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List size={18} />
        </Button>
        <Button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Ordered List"
        >
          <ListOrdered size={18} />
        </Button>
      </div>

      <div className="flex gap-1 border-r border-gray-300 pr-2 mr-1">
        <Button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <Quote size={18} />
        </Button>
      </div>
      
       <div className="flex gap-1 border-r border-gray-300 pr-2 mr-1">
        <Button
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="Insert 3x3 Table"
        >
          <TableIcon size={18} />
        </Button>
      </div>

      <div className="flex gap-1 ml-auto">
        <div className="relative" onClick={(e) => e.stopPropagation()}>
            <Button
                onClick={() => setShowExportMenu(!showExportMenu)}
                title="Download"
                disabled={isExporting}
            >
                <Download size={18} />
            </Button>
            
            {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-1 min-w-[160px] flex flex-col z-50">
                    <button
                        onClick={async () => {
                            setShowExportMenu(false);
                            setIsExporting(true);
                            await exportToPdf();
                            setIsExporting(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded text-left w-full cursor-pointer"
                    >
                        <FileText size={14} />
                        Export to PDF
                    </button>
                    <button
                        onClick={async () => {
                            setShowExportMenu(false);
                            setIsExporting(true);
                            await exportToDocx(editor.getHTML());
                            setIsExporting(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded text-left w-full cursor-pointer"
                    >
                        <FileText size={14} />
                        Export to DOCX
                    </button>
                </div>
            )}
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <Button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          title="Undo (Cmd+Z)"
        >
          <Undo size={18} />
        </Button>
        <Button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          title="Redo (Cmd+Shift+Z)"
        >
          <Redo size={18} />
        </Button>
      </div>
    </div>
  );
}
