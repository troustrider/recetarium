interface Props {
  message: string
  onRetry?: () => void
}

function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <p className="text-red-600 dark:text-red-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}

export default ErrorMessage
