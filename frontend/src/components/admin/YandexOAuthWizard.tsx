import { useState, useEffect } from 'react';
import { ChannelType } from '../../types';

interface YandexCounter {
  id: number;
  name: string;
  status: string | null;
}

interface YandexOAuthWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  libraryId: string;
  oauthSuccess?: boolean;
}

export default function YandexOAuthWizard({
  isOpen,
  onClose,
  onSuccess,
  libraryId,
  oauthSuccess = false,
}: YandexOAuthWizardProps) {
  const [step, setStep] = useState(1);
  const [counters, setCounters] = useState<YandexCounter[]>([]);
  const [selectedCounterId, setSelectedCounterId] = useState<string>('');
  const [resourceName, setResourceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadCounters = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/yandex/counters?library_id=${libraryId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to load counters');

      const data = await response.json();
      setCounters(data.counters);
      setStep(2);
    } catch (err) {
      setError('Не удалось загрузить счётчики');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Reset state when wizard opens
      setStep(1);
      setSelectedCounterId('');
      setResourceName('');
      setError('');

      // If OAuth just succeeded, automatically load counters
      if (oauthSuccess) {
        loadCounters();
      }
    }
  }, [isOpen, oauthSuccess]);

  const handleStartOAuth = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/yandex/oauth/start?library_id=${libraryId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to start OAuth');

      const data = await response.json();

      // Redirect to Yandex OAuth
      window.location.href = data.auth_url;
    } catch (err) {
      setError('Не удалось начать авторизацию');
      setLoading(false);
    }
  };

  const handleLinkCounter = async () => {
    if (!selectedCounterId || !resourceName) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/yandex/link-counter`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            library_id: libraryId,
            yandex_counter_id: selectedCounterId,
            name: resourceName,
            channel_type: 'website' as ChannelType,
            custom_name: resourceName,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to link counter');

      setStep(3);
    } catch (err) {
      setError('Не удалось подключить счётчик');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onSuccess();
    onClose();
  };

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
        <div className="relative z-10 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Подключение Яндекс.Метрики (Шаг {step}/3)
          </h2>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Step 1: Authorization */}
          {step === 1 && (
            <div>
              <p className="mb-4 text-sm text-gray-700">
                Для автоматического сбора статистики требуется авторизация в
                Яндекс.
              </p>
              <p className="mb-6 text-sm text-gray-600">
                Вы будете перенаправлены на страницу Яндекса для предоставления
                доступа.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleStartOAuth}
                  disabled={loading}
                  className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Загрузка...' : 'Авторизоваться в Яндекс'}
                </button>
                <button
                  onClick={onClose}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Отмена
                </button>
              </div>
              <button
                onClick={loadCounters}
                className="mt-3 text-xs text-indigo-600 hover:text-indigo-700"
              >
                Уже авторизованы? Загрузить счётчики
              </button>
            </div>
          )}

          {/* Step 2: Counter selection */}
          {step === 2 && (
            <div>
              <p className="mb-4 text-sm text-gray-700">
                Выберите счётчик для подключения:
              </p>

              <div className="mb-4 space-y-2 max-h-60 overflow-y-auto">
                {counters.length > 0 ? (
                  counters.map((counter) => (
                    <label
                      key={counter.id}
                      className="flex items-center rounded-md border border-gray-200 p-3 cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="counter"
                        value={counter.id}
                        checked={selectedCounterId === String(counter.id)}
                        onChange={(e) => setSelectedCounterId(e.target.value)}
                        className="h-4 w-4 text-indigo-600"
                      />
                      <span className="ml-3 text-sm">
                        {counter.name} (ID: {counter.id})
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Счётчики не найдены. Проверьте доступ в Яндекс.Метрике.
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Название ресурса в Либборде:
                </label>
                <input
                  type="text"
                  value={resourceName}
                  onChange={(e) => setResourceName(e.target.value)}
                  placeholder="Сайт библиотеки"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Назад
                </button>
                <button
                  onClick={handleLinkCounter}
                  disabled={loading || !selectedCounterId || !resourceName}
                  className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Подключение...' : 'Подключить'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div>
              <div className="mb-4 flex items-center justify-center text-5xl">
                ✓
              </div>
              <p className="mb-2 text-center text-lg font-semibold text-gray-900">
                Ресурс успешно подключён!
              </p>
              <p className="mb-6 text-center text-sm text-gray-600">
                Данные будут автоматически обновляться каждый день в 3:00.
              </p>
              <button
                onClick={handleFinish}
                className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Готово
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
