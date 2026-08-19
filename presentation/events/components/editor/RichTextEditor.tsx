"use client";
import {
  EditorContent,
  type JSONContent,
  useEditor,
  useEditorState,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import { cn } from "@/app/lib/utils/cn";
import { Toolbar } from "./Toolbar";
import { useRef } from "react";

const CHARACTERS_LIMIT = 1000;

interface RichTextEditorProps {
  value: JSONContent;
  onChange: (value: JSONContent) => void;
  onBlur?: () => void;
  readonly?: boolean;
  id?: string;
}

export const RichTextEditor = ({
  value,
  onChange,
  onBlur,
  readonly,
  id,
}: RichTextEditorProps) => {

  const firstRender = useRef(true);


  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        code: false,
        codeBlock: false,
        blockquote: false,

        // Volver a activar con config
        heading: { levels: [2, 3] },
        bulletList: {},
        orderedList: {},
        listItem: {},
        horizontalRule: false,
      }),
      CharacterCount.configure({
        limit: CHARACTERS_LIMIT,
      }),
      Placeholder.configure({
        placeholder: "Empieza a escribir la descripción de tu evento aquí...",
      }),
    ],
    onUpdate: ({ editor }) => {
      if (firstRender.current) {
        firstRender.current = false;
        return;
      }
      onChange(editor.getJSON());
    },
    onBlur: () => onBlur?.(),
    content: value,
    editable: !readonly,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[240px] max-h-[480px] overflow-y-auto px-4 py-3 focus:outline-none",
      },
    },
  });
  const state = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor)
        return {
          isBold: false,
          isItalic: false,
          isStrike: false,
          isH2: false,
          isH3: false,
          isBulletList: false,
          isOrderedList: false,
          canUndo: false,
          canRedo: false,
          characterCount: 0,
        };

      return {
        isBold: ctx.editor.isActive("bold"),
        isItalic: ctx.editor.isActive("italic"),
        isStrike: ctx.editor.isActive("strike"),
        isH2: ctx.editor.isActive("heading", { level: 2 }),
        isH3: ctx.editor.isActive("heading", { level: 3 }),
        isBulletList: ctx.editor.isActive("bulletList"),
        isOrderedList: ctx.editor.isActive("orderedList"),
        canUndo: ctx.editor.can().undo(),
        canRedo: ctx.editor.can().redo(),
        characterCount: ctx.editor.storage.characterCount.characters(),
      };
    },
  });

  const characterCount = state?.characterCount ?? 0;

  const isNearLimit = characterCount >= CHARACTERS_LIMIT * 0.9;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400 transition-shadow">
      {editor && !readonly && <Toolbar editor={editor} state={state} />}
      <EditorContent id={id} editor={editor} />
      {editor && (
        <div className="flex justify-end border-t border-gray-100 px-3 py-1.5">
          <span
            className={cn(
              "text-xs tabular-nums",
              isNearLimit ? "text-red-500" : "text-gray-400",
            )}
          >
            {characterCount} / {CHARACTERS_LIMIT}
          </span>
        </div>
      )}
    </div>
  );
};
