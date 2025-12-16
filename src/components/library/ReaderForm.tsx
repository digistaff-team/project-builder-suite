import { useState } from 'react';
import { ReaderFormData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus } from 'lucide-react';

interface ReaderFormProps {
  onSubmit: (data: ReaderFormData) => Promise<boolean>;
  isLoading: boolean;
}

export const ReaderForm = ({ onSubmit, isLoading }: ReaderFormProps) => {
  const [formData, setFormData] = useState<ReaderFormData>({
    phone: '',
    firstName: '',
    lastName: '',
    dob: ''
  });
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const validatePhone = (phone: string) => {
    const phoneRegex = /^7\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return 'Номер должен начинаться с 7 и содержать 11 цифр';
    }
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setPhoneError(null);
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validatePhone(formData.phone);
    if (error) {
      setPhoneError(error);
      return;
    }
    const success = await onSubmit(formData);
    if (success) {
      setFormData({ phone: '', firstName: '', lastName: '', dob: '' });
      setPhoneError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="phone">Номер телефона (ID)</Label>
        <Input
          type="text"
          name="phone"
          id="phone"
          required
          placeholder="79001234567"
          value={formData.phone}
          onChange={handleChange}
          className={phoneError ? 'border-danger focus-visible:ring-danger' : ''}
        />
        {phoneError ? (
          <p className="mt-1 text-xs text-danger">{phoneError}</p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">Служит уникальным идентификатором. Формат: 7XXXXXXXXXX</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">Имя</Label>
          <Input
            type="text"
            name="firstName"
            id="firstName"
            required
            value={formData.firstName}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="lastName">Фамилия</Label>
          <Input
            type="text"
            name="lastName"
            id="lastName"
            required
            value={formData.lastName}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="dob">Дата рождения</Label>
        <Input
          type="date"
          name="dob"
          id="dob"
          required
          value={formData.dob}
          onChange={handleChange}
        />
      </div>

      <div className="pt-4">
        <Button type="submit" className="w-full" disabled={isLoading}>
          <UserPlus className="w-4 h-4 mr-2" />
          {isLoading ? 'Регистрация...' : 'Зарегистрировать читателя'}
        </Button>
      </div>
    </form>
  );
};
