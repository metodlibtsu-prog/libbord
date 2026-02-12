import { useState } from 'react';
import { Channel } from '../../types';
import { translateChannelType } from '../../utils/translations';

interface ResourceCardProps {
  channel: Channel;
  onViewData: () => void;
  onAddData: () => void;
  onDelete: (channelId: string) => void;
}

export default function ResourceCard({ channel, onViewData, onAddData, onDelete }: ResourceCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const resourceName = channel.custom_name || translateChannelType(channel.type);
  const isAutomatic = !channel.is_manual;

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(channel.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{resourceName}</h3>
          <div className="mt-2">
            {isAutomatic ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Автоматически (Я.Метрика)
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Ручной ввод
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          {isAutomatic ? (
            <button
              onClick={onViewData}
              className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
            >
              Просмотр данных
            </button>
          ) : (
            <button
              onClick={onAddData}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Добавить данные
            </button>
          )}
          <button
            onClick={handleDelete}
            onBlur={() => setConfirmDelete(false)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              confirmDelete
                ? 'text-white bg-red-600 hover:bg-red-700'
                : 'text-red-600 bg-red-50 hover:bg-red-100'
            }`}
          >
            {confirmDelete ? 'Точно удалить?' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  );
}
