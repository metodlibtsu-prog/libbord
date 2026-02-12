interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectYandex: () => void;
  onSelectManual: () => void;
}

export default function AddResourceModal({
  isOpen,
  onClose,
  onSelectYandex,
  onSelectManual,
}: AddResourceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Добавить ресурс
          </h2>

          <p className="mb-6 text-sm text-gray-600">Выберите способ:</p>

          <div className="space-y-3">
            {/* Yandex.Metrika option */}
            <button
              onClick={onSelectYandex}
              className="w-full rounded-lg border-2 border-indigo-200 bg-indigo-50 p-4 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-100"
            >
              <div className="flex items-start">
                <span className="text-2xl mr-3">🔗</span>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Подключить через Яндекс.Метрику
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Для сайтов, веб-приложений
                  </p>
                </div>
              </div>
            </button>

            {/* Manual option */}
            <button
              onClick={onSelectManual}
              className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 p-4 text-left transition-colors hover:border-gray-300 hover:bg-gray-100"
            >
              <div className="flex items-start">
                <span className="text-2xl mr-3">✏️</span>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Добавить вручную
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Для соцсетей, мессенджеров
                  </p>
                </div>
              </div>
            </button>
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
