import { useState, useEffect, useCallback } from 'react';
import { Book, Reader, ReaderFormData, BookFormData, BookStatus } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Demo data for the frontend-only version
const DEMO_BOOKS: Book[] = [
  {
    id: 1,
    title: 'Война и мир',
    author: 'Лев Толстой',
    cover_type: 'твердая' as any,
    publication_year: 1869,
    genre: 'Роман',
    page_count: 1225,
    condition_state: 'хорошее' as any,
    status: BookStatus.AVAILABLE,
  },
  {
    id: 2,
    title: 'Мастер и Маргарита',
    author: 'Михаил Булгаков',
    cover_type: 'твердая' as any,
    publication_year: 1967,
    genre: 'Роман',
    page_count: 480,
    condition_state: 'новая' as any,
    status: BookStatus.BORROWED,
    borrowed_date: '2024-12-01',
    borrower_phone: '79001234567',
    first_name: 'Иван',
    last_name: 'Петров',
  },
  {
    id: 3,
    title: 'Преступление и наказание',
    author: 'Фёдор Достоевский',
    cover_type: 'мягкая' as any,
    publication_year: 1866,
    genre: 'Роман',
    page_count: 671,
    condition_state: 'среднее' as any,
    status: BookStatus.AVAILABLE,
  },
  {
    id: 4,
    title: 'Анна Каренина',
    author: 'Лев Толстой',
    cover_type: 'твердая' as any,
    publication_year: 1877,
    genre: 'Роман',
    page_count: 864,
    condition_state: 'хорошее' as any,
    status: BookStatus.AVAILABLE,
  },
  {
    id: 5,
    title: 'Евгений Онегин',
    author: 'Александр Пушкин',
    cover_type: 'твердая' as any,
    publication_year: 1833,
    genre: 'Поэма',
    page_count: 224,
    condition_state: 'новая' as any,
    status: BookStatus.BORROWED,
    borrowed_date: '2024-11-15',
    borrower_phone: '79009876543',
    first_name: 'Мария',
    last_name: 'Сидорова',
  },
  {
    id: 6,
    title: 'Двенадцать стульев',
    author: 'Илья Ильф, Евгений Петров',
    cover_type: 'мягкая' as any,
    publication_year: 1928,
    genre: 'Сатира',
    page_count: 416,
    condition_state: 'хорошее' as any,
    status: BookStatus.AVAILABLE,
  },
];

const DEMO_READERS: Reader[] = [
  {
    phone: '79001234567',
    first_name: 'Иван',
    last_name: 'Петров',
    birth_date: '1990-05-15',
    registration_date: '2024-01-10',
  },
  {
    phone: '79009876543',
    first_name: 'Мария',
    last_name: 'Сидорова',
    birth_date: '1985-08-22',
    registration_date: '2024-02-20',
  },
  {
    phone: '79005554433',
    first_name: 'Алексей',
    last_name: 'Козлов',
    birth_date: '1995-03-10',
    registration_date: '2024-03-05',
  },
];

export const useLibrary = () => {
  const [books, setBooks] = useState<Book[]>(DEMO_BOOKS);
  const [readers, setReaders] = useState<Reader[]>(DEMO_READERS);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRegisterReader = async (data: ReaderFormData): Promise<boolean> => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (readers.find(r => r.phone === data.phone)) {
      toast({
        title: 'Ошибка',
        description: 'Читатель с таким телефоном уже существует',
        variant: 'destructive',
      });
      setLoading(false);
      return false;
    }

    const newReader: Reader = {
      phone: data.phone,
      first_name: data.firstName,
      last_name: data.lastName,
      birth_date: data.dob,
      registration_date: new Date().toISOString().split('T')[0],
    };

    setReaders(prev => [newReader, ...prev]);
    toast({
      title: 'Успешно',
      description: `Читатель ${data.lastName} зарегистрирован`,
    });
    setLoading(false);
    return true;
  };

  const handleAddBook = async (data: BookFormData): Promise<boolean> => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const newBook: Book = {
      id: Math.max(...books.map(b => b.id), 0) + 1,
      title: data.title,
      author: data.author,
      cover_type: data.coverType,
      publication_year: data.publicationYear,
      genre: data.genre,
      page_count: data.pageCount,
      condition_state: data.conditionState,
      status: data.status,
    };

    setBooks(prev => [...prev, newBook]);
    toast({
      title: 'Успешно',
      description: `Книга "${data.title}" добавлена`,
    });
    setLoading(false);
    return true;
  };

  const handleDeleteBook = async (id: number) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    setBooks(prev => prev.filter(book => book.id !== id));
    toast({
      title: 'Успешно',
      description: 'Книга удалена',
    });
    setLoading(false);
  };

  const handleBorrow = async (bookId: number, phone: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const reader = readers.find(r => r.phone === phone);
    if (!reader) {
      toast({
        title: 'Ошибка',
        description: 'Читатель не найден. Сначала зарегистрируйте его.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    setBooks(prev => prev.map(book => {
      if (book.id === bookId) {
        return {
          ...book,
          status: BookStatus.BORROWED,
          borrower_phone: phone,
          borrowed_date: new Date().toISOString().split('T')[0],
          first_name: reader.first_name,
          last_name: reader.last_name,
        };
      }
      return book;
    }));

    toast({
      title: 'Успешно',
      description: 'Книга успешно выдана',
    });
    setLoading(false);
  };

  const handleReturn = async (bookId: number) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    setBooks(prev => prev.map(book => {
      if (book.id === bookId) {
        return {
          ...book,
          status: BookStatus.AVAILABLE,
          borrower_phone: null,
          borrowed_date: null,
          first_name: null,
          last_name: null,
        };
      }
      return book;
    }));

    toast({
      title: 'Успешно',
      description: 'Книга возвращена',
    });
    setLoading(false);
  };

  const stats = {
    total: books.length,
    borrowed: books.filter(b => b.status === BookStatus.BORROWED).length,
    readers: readers.length,
  };

  return {
    books,
    readers,
    loading,
    stats,
    fetchData,
    handleRegisterReader,
    handleAddBook,
    handleDeleteBook,
    handleBorrow,
    handleReturn,
  };
};
