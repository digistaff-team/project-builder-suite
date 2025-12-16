import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Reader } from '@/types';
import { X, Search, BookOpen, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BorrowModalProps {
  book: Book;
  readers: Reader[];
  onClose: () => void;
  onConfirm: (phone: string) => void;
  loading: boolean;
}

export const BorrowModal = ({ book, readers, onClose, onConfirm, loading }: BorrowModalProps) => {
  const [phoneInput, setPhoneInput] = useState('');
  const [filteredReaders, setFilteredReaders] = useState<Reader[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (phoneInput.length > 1) {
      const matches = readers.filter(r =>
        r.phone.includes(phoneInput) ||
        r.last_name.toLowerCase().includes(phoneInput.toLowerCase())
      );
      setFilteredReaders(matches.slice(0, 3));
    } else {
      setFilteredReaders([]);
    }
  }, [phoneInput, readers]);

  const handleSubmit = () => {
    if (!phoneInput) return;
    const phoneRegex = /^7\d{10}$/;
    if (!phoneRegex.test(phoneInput)) {
      setError('Введите корректный ID (7XXXXXXXXXX) или выберите из списка');
      return;
    }
    onConfirm(phoneInput);
  };

  const selectReader = (phone: string) => {
    setPhoneInput(phone);
    setFilteredReaders([]);
    setError(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/50 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="inline-block align-bottom bg-card rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full border border-border"
          >
            <div className="bg-card px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="w-full">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="text-lg font-display font-semibold text-foreground">
                        Выдача книги
                      </h3>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg mb-6 border border-border/50">
                    <p className="text-sm font-semibold text-foreground">{book.title}</p>
                    <p className="text-sm text-muted-foreground">{book.author}</p>
                  </div>

                  <div className="relative">
                    <Label htmlFor="borrower-phone">
                      Поиск читателя (телефон или фамилия)
                    </Label>
                    <div className="relative mt-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input
                        type="text"
                        name="borrower-phone"
                        id="borrower-phone"
                        autoComplete="off"
                        className={`pl-10 ${error ? 'border-danger focus-visible:ring-danger' : ''}`}
                        placeholder="7999..."
                        value={phoneInput}
                        onChange={(e) => {
                          setPhoneInput(e.target.value);
                          if (error) setError(null);
                        }}
                      />
                    </div>

                    {error && <p className="mt-1 text-xs text-danger">{error}</p>}

                    {filteredReaders.length > 0 && (
                      <motion.ul
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute z-10 mt-1 w-full bg-popover shadow-lg max-h-56 rounded-md py-1 text-base ring-1 ring-border overflow-auto"
                      >
                        {filteredReaders.map((reader) => (
                          <li
                            key={reader.phone}
                            onClick={() => selectReader(reader.phone)}
                            className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-muted transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-secondary rounded-full">
                                <User className="w-3 h-3 text-secondary-foreground" />
                              </div>
                              <div>
                                <span className="font-medium block truncate text-sm">
                                  {reader.last_name} {reader.first_name}
                                </span>
                                <span className="text-muted-foreground text-xs">{reader.phone}</span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-muted/30 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-border/50">
              <Button
                onClick={handleSubmit}
                disabled={loading || !phoneInput}
                className="w-full sm:ml-3 sm:w-auto"
              >
                {loading ? 'Выдача...' : 'Подтвердить выдачу'}
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="mt-3 w-full sm:mt-0 sm:w-auto"
              >
                Отмена
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
