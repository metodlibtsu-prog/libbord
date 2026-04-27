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
  // Map<counterId, displayName>
  const [selected, setSelected] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState('');

  const loadCounters = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/yandex/counters?library_id=${libraryId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error();
      const data = await response.json();
      setCounters(data.counters);
      setStep(2);
    } catch {
      setError('Не удалось загрузить счётчики');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelected(new Map());
      setError('');
      setProgress(null);
      if (oauthSuccess) loadCounters();
    }
  }, [isOpen, oauthSuccess]);

  const handleStartOAuth = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/yandex/oauth/start?library_id=${libraryId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error();
      const data = await response.json();
      window.location.href = data.auth_url;
    } catch {
      setError('Не удалось начать авторизацию');
      setLoading(false);
    }
  };

  const toggleCounter = (counter: YandexCounter) => {
    const id = String(counter.id);
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.set(id, counter.name);
      }
      return next;
    });
  };

  const updateName = (id: string, name: string) => {
    setSelected((prev) => new Map(prev).set(id, name));
  };

  const handleLinkCounters = async () => {
    const items = Array.from(selected.entries()).map(([id, name]) => ({ id, name }));
    if (items.length === 0) {
      setError('Выберите хотя бы один счётчик');
      return;
    }
    if (items.some((c) => !c.name.trim())) {
      setError('Заполните название для каждого выбранного счётчика');
      return;
    }

    setLinking(true);
    setError('');
    setProgress({ done: 0, total: items.length });

    const token = localStorage.getItem('access_token');
    let done = 0;

    for (const item of items) {
      try {
        const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/yandex/link-counter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            library_id: libraryId,
            yandex_counter_id: item.id,
            name: item.name,
            channel_type: 'website' as ChannelType,
            custom_name: item.name,
          }),
        });
        if (!resp.ok) throw new Error();
      } catch {
        setError(`Не удалось подключить счётчик ID ${item.id}`);
        setLinking(false);
        return;
      }
      done += 1;
      setProgress({ done, total: items.length });
    }

    setLinking(false);
    setStep(3);
  };

  const handleFinish = () => {
    onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  const selectedCount = selected.size;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

        <div className="relative z-10 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Подключение Яндекс.Метрики{step < 3 ? ` (Шаг ${step}/2)` : ''}
          </h2>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
          )}

          {/* Step 1: Authorization */}
          {step === 1 && (
            <div>
              <p className="mb-4 text-sm text-gray-700">
                Для автоматического сбора статистики требуется авторизация в Яндекс.
              </p>
              <p className="mb-6 text-sm text-gray-600">
                Вы будете перенаправлены на страницу Яндекса для предоставления доступа.
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

          {/* Step 2: Multi-select counters */}
          {step === 2 && (
            <div>
              <p className="mb-3 text-sm text-gray-700">
                Выберите счётчики и задайте им названия в Либборде:
              </p>

              <div className="mb-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                {counters.length > 0 ? (
                  counters.map((counter) => {
                    const id = String(counter.id);
                    const isChecked = selected.has(id);
                    return (
                      <div
                        key={counter.id}
                        className={`rounded-md border p-3 transition-colors ${
                          isChecked ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <label className="flex cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCounter(counter)}
                            className="h-4 w-4 rounded text-indigo-600"
                          />
                          <span className="text-sm text-gray-800">
                            {counter.name}{' '}
                            <span className="text-gray-400">(ID: {counter.id})</span>
                          </span>
                        </label>

                        {isChecked && (
                          <div className="mt-2 pl-7">
                            <input
                              type="text"
                              value={selected.get(id) ?? ''}
                              onChange={(e) => updateName(id, e.target.value)}
                              placeholder="Название в Либборде"
                              className="w-full rounded-md border border-indigo-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="py-4 text-center text-sm text-gray-500">
                    Счётчики не найдены. Проверьте доступ в Яндекс.Метрике.
                  </p>
                )}
              </div>

              {progress && linking && (
                <div className="mb-3 text-sm text-indigo-600">
                  Подключаем... {progress.done}/{progress.total}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  disabled={linking}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Назад
                </button>
                <button
                  onClick={handleLinkCounters}
                  disabled={linking || selectedCount === 0}
                  className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {linking
                    ? `Подключаем ${progress?.done ?? 0}/${progress?.total ?? selectedCount}...`
                    : selectedCount > 0
                    ? `Подключить (${selectedCount})`
                    : 'Подключить'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div>
              <div className="mb-4 flex items-center justify-center text-5xl">✓</div>
              <p className="mb-2 text-center text-lg font-semibold text-gray-900">
                {selectedCount === 1 ? 'Счётчик успешно подключён!' : `${selectedCount} счётчика успешно подключены!`}
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
