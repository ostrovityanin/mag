
import React, { Suspense } from "react";
import "react-quill/dist/quill.snow.css";

const ReactQuill = React.lazy(() => import("react-quill"));

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  minHeight?: number;
  disabled?: boolean;
}

export const QuillEditor: React.FC<QuillEditorProps> = ({
  value,
  onChange,
  readOnly = false,
  placeholder = "",
  minHeight = 100,
  disabled = false,
}) => {
  return (
    <div className={disabled ? "opacity-60 pointer-events-none" : ""}>
      <Suspense fallback={<div>Загрузка редактора…</div>}>
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          placeholder={placeholder}
          style={{ minHeight }}
          modules={{
            toolbar: readOnly || disabled
              ? false
              : [
                  [{ header: [1, 2, false] }],
                  ["bold", "italic", "underline", "strike"],
                  [{ color: [] }, { background: [] }],
                  ["link", "blockquote", "code-block"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  [{ align: [] }],
                  ["clean"],
                ],
          }}
        />
      </Suspense>
    </div>
  );
};
