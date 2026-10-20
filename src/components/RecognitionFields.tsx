/**
 * "How should we thank you?" fields shared by every giving form. Unchecked by
 * default: givers appear on the home-page thank-you ticker once their gift is
 * received, unless they ask to stay anonymous.
 */
export function RecognitionFields({
  defaults,
  className = "",
}: {
  defaults?: { anonymous?: boolean; displayName?: string | null };
  className?: string;
}) {
  return (
    <fieldset className={`space-y-2 rounded-xl bg-dusk-50 p-4 text-sm ${className}`}>
      <legend className="sr-only">Public thank-you</legend>
      <p className="font-semibold text-dusk-700">How should we thank you?</p>
      <p className="text-xs text-black/60">
        Once your gift arrives, we&rsquo;ll add your name to the thank-you list on our home page.
      </p>
      <input
        name="displayName"
        defaultValue={defaults?.displayName ?? ""}
        maxLength={80}
        placeholder="Name to show, e.g. “The Smith Family” (optional)"
        className="input"
      />
      <label className="flex items-center gap-2">
        <input type="checkbox" name="anonymous" defaultChecked={defaults?.anonymous} className="h-4 w-4 accent-dusk-700" />
        Keep my gift anonymous. Don&rsquo;t show my name.
      </label>
    </fieldset>
  );
}
