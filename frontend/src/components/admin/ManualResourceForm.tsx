import { useState } from 'react';
import { ChannelType } from '../../types';
import { channelTypeLabels } from '../../utils/translations';
import { useAuth } from '../../context/AuthContext';

interface ManualResourceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  libraryId: string;
}

export default function ManualResourceForm({
  isOpen,
  onClose,
  onSuccess,
  libraryId,
}: ManualResourceFormProps) {
  const { session } = useAuth();
  const [channelType, setChannelType] = useState<ChannelType>('telegram');
  const [customName, setCustomName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Только социальные сети и мессенджеры для ручного ввода
  const manualChannelTypes: ChannelType[] = ['telegram', 'vk', 'mobile_app', 'other'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customName.trim()) {
      setError('Пожалуйста, введите название');
      return;
    }

    setLoading(true);
    setError('');

    if (!session?.access_token) {
      setError('Не авторизован. Пожалуйста, войдите снова.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          library_id: libraryId,
          type: channelType,
          custom_name: customName,
          is_manual: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to create channel');

      onSuccess();
      onClose();
      // Reset form
      setChannelType('telegram');
      setCustomName('');
    } catch (err) {
      setError('Не удалось создать ресурс');
    } finally {
      setLoading(false);
    }
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
        <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Добавить ресурс вручную
          </h2>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Тип ресурса:
              </label>
              <select
                value={channelType}
                onChange={(e) => setChannelType(e.target.value as ChannelType)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {manualChannelTypes.map((type) => (
                  <option key={type} value={type}>
                    {channelTypeLabels[type]}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Название:
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Telegram-канал библиотеки"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
