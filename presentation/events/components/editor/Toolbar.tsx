import { type Editor, useEditorState } from "@tiptap/react";
import { ToolbarButton } from "./ToolbarButton";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Redo,
  Strikethrough,
  Undo,
} from "lucide-react";

interface ToolbarProps {
  editor: Editor;
  state: {
    isBold: boolean;
    isItalic: boolean;
    isStrike: boolean;
    isH2: boolean;
    isH3: boolean;
    isBulletList: boolean;
    isOrderedList: boolean;
    canUndo: boolean;
    canRedo: boolean;
    characterCount: number;
  } | null;
}

const Divider = () => <div className="mx-1 h-5 w-px bg-gray-200" />;

export const Toolbar = ({ editor, state }: ToolbarProps) => {
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 px-2 py-1.5">
      {/* Headings */}
      <ToolbarButton
        title="Título H2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={state?.isH2}
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        title="Título H3"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={state?.isH3}
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      {/* Formato de texto */}
      <ToolbarButton
        title="Negrita"
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={state?.isBold}
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        title="Cursiva"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={state?.isItalic}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        title="Tachado"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={state?.isStrike}
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      {/* Listas */}
      <ToolbarButton
        title="Lista con viñetas"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={state?.isBulletList}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        title="Lista numerada"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={state?.isOrderedList}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>

      <Divider />

      {/* Historial */}
      <ToolbarButton
        title="Deshacer"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!state?.canUndo}
      >
        <Undo className="h-4 w-4" />
      </ToolbarButton>

      <ToolbarButton
        title="Rehacer"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!state?.canRedo}
      >
        <Redo className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
};
