import "./dashboard.css";
export default function EmailTableSkeleton() {
  return (
    <div className="email-loading-list">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="email-loading-row" key={index}>
          <div className="email-skeleton recipient" />
          <div className="email-skeleton date" />
          <div className="email-skeleton subject" />
          <div className="email-skeleton star" />
        </div>
      ))}
    </div>
  );
}
