import "./dashboard.css";
interface EmptyStateProps {
  title: string;
  description: string;
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="email-empty-state">
      <div className="email-empty-icon">
        <span>—</span>
      </div>

      <h3>{title}</h3>

      <p>{description}</p>
    </div>
  );
}
