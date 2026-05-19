export default function Field({
  label,
  type = "text",
  placeholder,
  as = "input",
  name,
  ...props
}) {
  const Tag = as;

  return (
    <label className="extra-field">
      <span>{label}</span>

      <Tag
        name={name}
        type={type}
        placeholder={placeholder}
        rows={
          as === "textarea"
            ? 5
            : undefined
        }
        {...props}
      />
    </label>
  );
}