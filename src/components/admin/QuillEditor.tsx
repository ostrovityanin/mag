
import React from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  minHeight?: number;
  disabled?: boolean;
}

const QuillNoSSRWrapper = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => <div>Загрузка редактора…</div>
});

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
      <QuillNoSSRWrapper
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
    </div>
  );
};
