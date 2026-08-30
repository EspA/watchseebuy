export function DeleteWatchForm({ watchId }: { watchId: string }) {
  return (
    <form action={`/api/watches/${watchId}/delete`} method="post">
      <button className="btn secondary" type="submit">
        Stop watching
      </button>
    </form>
  );
}
