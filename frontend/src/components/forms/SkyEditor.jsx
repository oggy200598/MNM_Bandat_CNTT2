import { useEffect, useRef } from "react";
import { sanitizeRichHtml } from "../../utils/richText";

const TOOLS = [
  { command: "bold", label: "B" },
  { command: "italic", label: "I" },
  { command: "underline", label: "U" },
  { command: "insertUnorderedList", label: "• List" },
  { command: "insertOrderedList", label: "1. List" },
];

export default function SkyEditor({
  value,
  onChange,
  placeholder = "Nhập mô tả chi tiết...",
}) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current) return;
    const safeHtml = sanitizeRichHtml(value);
    if (editorRef.current.innerHTML !== safeHtml) {
      editorRef.current.innerHTML = safeHtml;
    }
  }, [value]);

  function emitChange() {
    const html = sanitizeRichHtml(editorRef.current?.innerHTML || "");
    onChange?.(html);
  }

  function apply(command) {
    editorRef.current?.focus();
    document.execCommand(command, false);
    emitChange();
  }

  function insertLink() {
    const nextHref = window.prompt("Nhập liên kết");
    if (!nextHref) return;
    editorRef.current?.focus();
    document.execCommand("createLink", false, nextHref);
    emitChange();
  }

  return (
    <div className="sky-editor">
      <div className="sky-editor__toolbar">
        {TOOLS.map((tool) => (
          <button
            key={tool.command}
            type="button"
            className="sky-editor__tool"
            onClick={() => apply(tool.command)}
          >
            {tool.label}
          </button>
        ))}
        <button
          type="button"
          className="sky-editor__tool"
          onClick={insertLink}
        >
          Link
        </button>
      </div>

      <div
        ref={editorRef}
        className="sky-editor__surface"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emitChange}
        onBlur={emitChange}
      />
    </div>
  );
}
