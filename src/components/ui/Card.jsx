import { cn } from "../../utils/cn";

/** Container branco padrão das seções das telas. */
function Card({ as: Tag = "section", className, children, ...props }) {
  return (
    <Tag
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export default Card;
