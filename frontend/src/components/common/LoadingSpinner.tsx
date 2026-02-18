export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="relative">
        {/* Main spinner */}
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-dark-border border-t-gradient-cyan shadow-glow-cyan" />

        {/* Ping effect */}
        <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full border-2 border-gradient-cyan opacity-20" />
      </div>
    </div>
  )
}
