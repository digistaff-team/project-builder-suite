import { useState } from 'react';
import { BookFormData, CoverType, ConditionState, BookStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, X } from 'lucide-react';

interface AddBookFormProps {
  onSubmit: (data: BookFormData) => Promise<boolean>;
  onCancel?: () => void;
  isLoading: boolean;
}

export const AddBookForm = ({ onSubmit, onCancel, isLoading }: AddBookFormProps) => {
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    author: '',
    coverType: CoverType.HARD,
    publicationYear: new Date().getFullYear(),
    genre: '',
    pageCount: 0,
    conditionState: ConditionState.NEW,
    status: BookStatus.AVAILABLE
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'publicationYear' || name === 'pageCount' ? Number(value) : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSubmit(formData);
    if (success) {
      setFormData({
        title: '',
        author: '',
        coverType: CoverType.HARD,
        publicationYear: new Date().getFullYear(),
        genre: '',
        pageCount: 0,
        conditionState: ConditionState.NEW,
        status: BookStatus.AVAILABLE
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="title">Название книги</Label>
          <Input
            type="text"
            name="title"
            id="title"
            required
            value={formData.title}
            onChange={handleChange}
            placeholder="Например: Война и мир"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="author">Автор</Label>
          <Input
            type="text"
            name="author"
            id="author"
            required
            value={formData.author}
            onChange={handleChange}
            placeholder="Лев Толстой"
          />
        </div>

        <div>
          <Label htmlFor="genre">Жанр</Label>
          <Input
            type="text"
            name="genre"
            id="genre"
            required
            value={formData.genre}
            onChange={handleChange}
            placeholder="Роман"
          />
        </div>

        <div>
          <Label htmlFor="publicationYear">Год издания</Label>
          <Input
            type="number"
            name="publicationYear"
            id="publicationYear"
            required
            min="1800"
            max={new Date().getFullYear() + 1}
            value={formData.publicationYear}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="pageCount">Количество страниц</Label>
          <Input
            type="number"
            name="pageCount"
            id="pageCount"
            required
            min="1"
            value={formData.pageCount || ''}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="coverType">Тип обложки</Label>
          <Select
            value={formData.coverType}
            onValueChange={(value) => handleSelectChange('coverType', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(CoverType).map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="conditionState">Состояние</Label>
          <Select
            value={formData.conditionState}
            onValueChange={(value) => handleSelectChange('conditionState', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(ConditionState).map((state) => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Статус</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => handleSelectChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(BookStatus).map((status) => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="pt-4 flex gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-1/3"
          >
            <X className="w-4 h-4 mr-2" />
            Отмена
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Сохранение...' : 'Добавить книгу'}
        </Button>
      </div>
    </form>
  );
};
