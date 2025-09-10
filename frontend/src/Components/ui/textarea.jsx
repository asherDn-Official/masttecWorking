export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={`w-full border rounded px-3 py-2 ${className || ""}`}
      {...props}
    />
  );
}
